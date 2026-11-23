// /api/team.js
// Azioni dello staff di "Offside Squadre" in un solo endpoint (il piano gratuito di Vercel accetta
// al massimo 12 funzioni per progetto). Si sceglie l'azione con il campo "action":
//
//   checkout        pagamento sicuro su Stripe (Pass Stagionale o mensile), legato alla squadra
//   confirm         al ritorno da Stripe: attiva subito il piano, senza aspettare il webhook
//   cancel-renewal  il mensile non si rinnova più (resta attivo fino a fine periodo)
//   resume-renewal  annulla la disdetta
//   remove-player   toglie un giocatore dalla rosa
//   rotate-code     nuovo codice invito (quello vecchio smette di funzionare)
//   redeem          codice omaggio: dashboard gratis fino a fine stagione
//   forgot          manda via email il codice per reimpostare la password
//   reset           imposta la nuova password con il codice ricevuto

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redis } from './_lib/redis.js';
import {
  billingSummary, clientIp, computeTeamAccess, countAttempt, createTeamSession, generateInviteCode,
  getTeam, getTeamBySessionToken, normalizeEmail, parseJsonMaybe, saveTeam, teamLoginPayload, underLimit,
} from './_lib/team.js';
import {
  applyTeamPayment, classifySession, getStripe, isPaidSession, subscriptionRenewsAt,
  TEAM_MONTHLY_PRICE_ID, TEAM_SEASON_PRODUCT_ID,
} from './_lib/teamBilling.js';
import { SEASON, seasonPassOffer } from './_lib/teamPlans.js';
import { matchGiftCode } from './_lib/teamGift.js';
import { emailConfigured, resetCodeEmail, sendEmail } from './_lib/mail.js';

const HOUR = 60 * 60;
const SITE_URL = process.env.SITE_URL || 'https://myoffside.com';
// Dopo il pagamento Stripe riporta sullo stesso indirizzo da cui si è partiti (con o senza "www"),
// così la sessione della squadra salvata nel browser c'è ancora.
const RETURN_ORIGINS = ['https://myoffside.com', 'https://www.myoffside.com', 'https://offside-pearl.vercel.app'];
const returnOrigin = (req) => {
  const origin = req.headers && req.headers.origin;
  return RETURN_ORIGINS.includes(origin) ? origin : SITE_URL;
};

const fail = (res, status, error, extra = {}) => res.status(status).json({ error, ...extra });

async function requireTeam(req, res) {
  const team = await getTeamBySessionToken(req.body && req.body.token);
  if (!team) {
    fail(res, 401, 'Sessione scaduta, rifai il login');
    return null;
  }
  return team;
}

// --- Pagamenti ---------------------------------------------------------------------------------

async function checkout(req, res) {
  const team = await requireTeam(req, res);
  if (!team) return;
  const plan = req.body.plan;
  if (plan !== 'season' && plan !== 'monthly') return fail(res, 400, 'Piano non valido');

  const limitKey = `teamcheckout:${team.teamId}`;
  if (!(await underLimit(limitKey, 20))) return fail(res, 429, 'Troppi tentativi. Riprova tra un po\'.');
  await countAttempt(limitKey, HOUR);

  const access = computeTeamAccess(team);
  const tag = plan === 'season' ? 'squadre_stagione' : 'squadre_mensile';
  const metadata = { offside: tag, teamId: team.teamId };
  const site = returnOrigin(req);
  const common = {
    client_reference_id: team.teamId,
    metadata,
    locale: 'it',
    automatic_tax: { enabled: true },
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    allow_promotion_codes: false,
    success_url: `${site}/?team=activated&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/?team=checkout_cancel`,
  };

  try {
    const stripe = getStripe();
    let session;
    if (plan === 'season') {
      if (access.seasonPassActive) return fail(res, 409, 'La squadra è già coperta fino a fine stagione.');
      const offer = seasonPassOffer(new Date(), access.trialEndsAt);
      if (!offer.available) return fail(res, 410, 'Il Pass Stagionale non è più in vendita per questa stagione: puoi attivare il mensile.');
      session = await stripe.checkout.sessions.create({
        ...common,
        mode: 'payment',
        customer_creation: 'always',
        line_items: [{
          quantity: 1,
          price_data: { currency: 'eur', product: TEAM_SEASON_PRODUCT_ID, unit_amount: offer.price * 100, tax_behavior: 'inclusive' },
        }],
        payment_intent_data: { metadata, description: `Offside Squadre · Pass Stagionale ${SEASON.label} · ${team.teamName}`.slice(0, 200) },
      });
    } else {
      if (access.seasonPassActive) return fail(res, 409, 'La squadra è già coperta fino a fine stagione: non serve il mensile.');
      if (team.subscriptionActive) return fail(res, 409, 'L\'abbonamento mensile è già attivo.');
      const subscriptionData = { metadata, description: `Offside Squadre · ${team.teamName}`.slice(0, 200) };
      // Un solo mese gratis: se la prova dell'app è ancora in corso, il primo addebito arriva quando finisce.
      const trialMs = access.trialActive ? new Date(access.trialEndsAt).getTime() - Date.now() : 0;
      if (trialMs >= 48 * HOUR * 1000) subscriptionData.trial_end = Math.floor(new Date(access.trialEndsAt).getTime() / 1000);
      else if (trialMs > 0) subscriptionData.trial_period_days = Math.max(1, Math.ceil(trialMs / (24 * HOUR * 1000)));
      session = await stripe.checkout.sessions.create({
        ...common,
        mode: 'subscription',
        payment_method_collection: 'always',
        line_items: [{ price: TEAM_MONTHLY_PRICE_ID, quantity: 1 }],
        subscription_data: subscriptionData,
      });
    }
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Errore nel creare il pagamento squadra:', err);
    return fail(res, 502, 'Il pagamento non è partito. Riprova tra poco.');
  }
}

async function confirm(req, res) {
  const team = await requireTeam(req, res);
  if (!team) return;
  const sessionId = req.body.sessionId;
  if (typeof sessionId !== 'string' || !/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return fail(res, 400, 'Pagamento non valido');
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const ref = session.client_reference_id || (session.metadata && session.metadata.teamId);
    if (ref !== team.teamId) return fail(res, 403, 'Questo pagamento non è di questa squadra.');
    if (!isPaidSession(session)) return res.status(200).json({ activated: false, status: session.payment_status });
    const kind = classifySession(session);
    if (kind !== 'team_monthly' && kind !== 'team_season') return fail(res, 400, 'Pagamento non valido');
    const updated = await applyTeamPayment(session, kind, stripe);
    return res.status(200).json({ activated: true, plan: computeTeamAccess(updated || team).plan, billing: billingSummary(updated || team) });
  } catch (err) {
    if (err && (err.statusCode === 404 || err.code === 'resource_missing')) return fail(res, 404, 'Pagamento non trovato.');
    console.error('Errore nella conferma del pagamento squadra:', err);
    return fail(res, 502, 'Non riesco a verificare il pagamento adesso. Ricarica tra qualche secondo.');
  }
}

async function setRenewal(req, res, cancel) {
  const team = await requireTeam(req, res);
  if (!team) return;
  if (!team.stripeSubscriptionId || !team.subscriptionActive) return fail(res, 400, 'Non c\'è un abbonamento mensile attivo.');
  try {
    const sub = await getStripe().subscriptions.update(team.stripeSubscriptionId, { cancel_at_period_end: cancel });
    const updated = await saveTeam({ ...team, subscriptionCancelAtPeriodEnd: cancel, subscriptionRenewsAt: subscriptionRenewsAt(sub) || team.subscriptionRenewsAt || null });
    return res.status(200).json({ ok: true, billing: billingSummary(updated) });
  } catch (err) {
    console.error('Errore nel cambiare il rinnovo:', err);
    return fail(res, 502, 'Non riesco a contattare Stripe adesso. Riprova tra poco.');
  }
}

// --- Rosa e codice invito ----------------------------------------------------------------------

async function removePlayer(req, res) {
  const team = await requireTeam(req, res);
  if (!team) return;
  const playerId = req.body.playerId;
  if (typeof playerId !== 'string' || !playerId) return fail(res, 400, 'Richiesta non valida');
  const player = parseJsonMaybe(await redis.get(`player:${playerId}`));
  if (!player || player.teamId !== team.teamId) return fail(res, 404, 'Giocatore non trovato');
  await redis.del(`player:${playerId}`);
  await redis.srem(`teamplayers:${team.teamId}`, playerId);
  // Così l'app del giocatore può dirgli perché non è più collegato.
  await redis.set(`playergone:${playerId}`, { reason: 'removed', teamName: team.teamName, at: new Date().toISOString() }, { ex: 90 * 24 * HOUR });
  return res.status(200).json({ ok: true });
}

async function rotateCode(req, res) {
  const team = await requireTeam(req, res);
  if (!team) return;
  let code = generateInviteCode();
  for (let i = 0; i < 6; i++) {
    if (!(await redis.get(`teamcode:${code}`))) break;
    code = generateInviteCode();
  }
  await redis.set(`teamcode:${code}`, team.teamId);
  if (team.inviteCode && team.inviteCode !== code) await redis.del(`teamcode:${team.inviteCode}`);
  await saveTeam({ ...team, inviteCode: code, inviteCodeRotatedAt: new Date().toISOString() });
  return res.status(200).json({ inviteCode: code });
}

// --- Codice omaggio ----------------------------------------------------------------------------

async function redeem(req, res) {
  const team = await requireTeam(req, res);
  if (!team) return;
  const teamKey = `teamredeemfail:${team.teamId}`;
  const ipKey = `teamredeemfail:ip:${clientIp(req)}`;
  if (!(await underLimit(teamKey, 8)) || !(await underLimit(ipKey, 20))) return fail(res, 429, 'Troppi tentativi. Riprova tra un\'ora.');

  const gift = matchGiftCode(req.body.code);
  if (!gift) {
    await countAttempt(teamKey, HOUR);
    await countAttempt(ipKey, HOUR);
    return fail(res, 404, 'Codice non valido. Controlla di averlo scritto giusto.');
  }
  const key = `teamgift:${gift.id}`;
  let owner = await redis.get(key);
  if (!owner) {
    const ok = await redis.set(key, team.teamId, { nx: true });
    owner = ok ? team.teamId : await redis.get(key);
  }
  if (owner !== team.teamId) return fail(res, 409, 'Questo codice è già stato usato da un\'altra squadra.');

  const next = { ...team, paidUntil: SEASON.end, gift: { id: gift.id, label: gift.label, redeemedAt: new Date().toISOString() } };
  // Se pagava mese per mese, il rinnovo si ferma: l'omaggio copre fino a fine stagione.
  if (team.stripeSubscriptionId && team.subscriptionActive && !team.subscriptionCancelAtPeriodEnd) {
    try {
      await getStripe().subscriptions.update(team.stripeSubscriptionId, { cancel_at_period_end: true });
      next.subscriptionCancelAtPeriodEnd = true;
    } catch (err) {
      console.error('Omaggio: non riesco a fermare il rinnovo mensile', err);
    }
  }
  const saved = await saveTeam(next);
  return res.status(200).json({ ok: true, billing: billingSummary(saved) });
}

// --- Password dimenticata ----------------------------------------------------------------------

const hashResetCode = (teamId, code) => crypto.createHash('sha256').update(`${teamId}:${code}`).digest('hex');

async function forgot(req, res) {
  const email = normalizeEmail(req.body.email);
  if (!email.includes('@')) return fail(res, 400, 'Inserisci l\'email della squadra.');
  if (!emailConfigured()) return fail(res, 503, 'email_not_configured');
  const emailKey = `teamforgot:${email}`;
  const ipKey = `teamforgot:ip:${clientIp(req)}`;
  if (!(await underLimit(emailKey, 3)) || !(await underLimit(ipKey, 10))) return fail(res, 429, 'Hai già chiesto diversi codici. Controlla la posta (anche lo spam) o riprova tra un\'ora.');
  await countAttempt(emailKey, HOUR);
  await countAttempt(ipKey, HOUR);

  const teamId = await redis.get(`teamemail:${email}`);
  const team = teamId ? await getTeam(teamId) : null;
  if (team) {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const expiresAt = Date.now() + 30 * 60 * 1000;
    await redis.set(`teamreset:${team.teamId}`, { hash: hashResetCode(team.teamId, code), attempts: 0, expiresAt }, { ex: 30 * 60 });
    try {
      await sendEmail({ to: team.email, ...resetCodeEmail({ teamName: team.teamName, code }) });
    } catch (err) {
      console.error('Invio email reset non riuscito:', err);
      return fail(res, 502, 'Non riesco a mandare l\'email adesso. Riprova tra poco.');
    }
  }
  // Stessa risposta se l'email esiste o no: così nessuno può scoprire quali squadre sono registrate.
  return res.status(200).json({ ok: true });
}

async function reset(req, res) {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || '').replace(/\D/g, '');
  const password = req.body.password;
  if (!email.includes('@') || code.length !== 6) return fail(res, 400, 'Inserisci l\'email e il codice di 6 cifre.');
  if (typeof password !== 'string' || password.length < 8) return fail(res, 400, 'La password deve avere almeno 8 caratteri.');
  const ipKey = `teamreset:ip:${clientIp(req)}`;
  if (!(await underLimit(ipKey, 30))) return fail(res, 429, 'Troppi tentativi. Riprova tra un\'ora.');

  const teamId = await redis.get(`teamemail:${email}`);
  const record = teamId ? parseJsonMaybe(await redis.get(`teamreset:${teamId}`)) : null;
  if (!record || record.expiresAt < Date.now()) {
    await countAttempt(ipKey, HOUR);
    return fail(res, 400, 'Codice scaduto o non valido. Richiedine uno nuovo.');
  }
  if (record.attempts >= 5) return fail(res, 429, 'Troppi tentativi con questo codice. Richiedine uno nuovo.');
  const given = Buffer.from(hashResetCode(teamId, code), 'hex');
  const expected = Buffer.from(record.hash, 'hex');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    await countAttempt(ipKey, HOUR);
    const left = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
    await redis.set(`teamreset:${teamId}`, { ...record, attempts: record.attempts + 1 }, { ex: left });
    return fail(res, 400, 'Codice non corretto.');
  }

  const team = await getTeam(teamId);
  if (!team) return fail(res, 400, 'Codice scaduto o non valido. Richiedine uno nuovo.');
  const updated = await saveTeam({
    ...team,
    passwordHash: await bcrypt.hash(password, 10),
    sessionEpoch: (Number(team.sessionEpoch) || 0) + 1, // esce da tutti i dispositivi
    passwordChangedAt: new Date().toISOString(),
  });
  await redis.del(`teamreset:${teamId}`);
  await redis.del(`teamloginfail:${email}`);
  const token = await createTeamSession(updated);
  return res.status(200).json(teamLoginPayload(updated, token));
}

// --- Router ------------------------------------------------------------------------------------

const ACTIONS = {
  checkout,
  confirm,
  'cancel-renewal': (req, res) => setRenewal(req, res, true),
  'resume-renewal': (req, res) => setRenewal(req, res, false),
  'remove-player': removePlayer,
  'rotate-code': rotateCode,
  redeem,
  forgot,
  reset,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'Metodo non permesso');
  }
  req.body = req.body || {};
  const action = ACTIONS[req.body.action];
  if (!action) return fail(res, 400, 'Azione non valida');
  try {
    return await action(req, res);
  } catch (err) {
    console.error(`Errore in /api/team (${req.body.action}):`, err);
    return fail(res, 500, 'Errore del server, riprova tra poco');
  }
}

