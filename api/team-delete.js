// /api/team-delete.js
// Eliminazione definitiva dell'account squadra, richiesta dal responsabile dall'app
// (richiesto da Apple App Review, linea guida 5.1.1(v), e dal GDPR art. 17).
//
// Cosa fa, in ordine:
//   1. verifica la sessione (token) E la password del responsabile (conferma anti-errore/anti-furto);
//   2. annulla subito l'abbonamento mensile "Offside Squadre" su Stripe, se presente.
//      Se l'annullamento fallisce NON cancelliamo nulla: altrimenti la squadra continuerebbe
//      a essere addebitata senza più un account da cui disdire;
//   3. cancella da Redis tutti i dati della squadra: scheda squadra, email, codice invito,
//      tutti i giocatori collegati (nickname, stato, storico, benessere), sessione.
//
// Il Premium individuale (3,99 €/mese, anche se con la stessa email) NON viene toccato.
// Le ricevute e i dati di fatturazione restano presso Stripe per gli obblighi fiscali.

import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import { redis } from './_lib/redis.js';
import { getTeamBySessionToken, normalizeEmail } from './_lib/team.js';

// Stessa soglia di stripe-webhook.js: sopra questa cifra (in centesimi) un abbonamento è "Squadre".
const TEAM_PLAN_MIN_CENTS = 1000;

// Dopo troppi tentativi di password sbagliata si blocca per un po': evita che qualcuno
// con un token rubato indovini la password da qui.
const MAX_BAD_PASSWORDS = 5;
const BAD_PASSWORD_WINDOW_SECONDS = 15 * 60;

// Cerca nel database i clienti Stripe collegati all'email della squadra
// (li scrive stripe-webhook.js al momento del pagamento).
async function findStripeCustomerKeys(email) {
  const keys = [];
  let cursor = 0;
  let rounds = 0;
  do {
    const [next, batch] = await redis.scan(cursor, { match: 'customer:*', count: 200 });
    cursor = Number(next);
    for (const key of batch || []) keys.push(key);
    rounds += 1;
  } while (cursor !== 0 && rounds < 100);

  const matching = [];
  for (const key of keys) {
    const value = await redis.get(key);
    if (typeof value === 'string' && normalizeEmail(value) === email) matching.push(key);
  }
  return matching;
}

function isTeamPlanSubscription(subscription) {
  const items = (subscription && subscription.items && subscription.items.data) || [];
  return items.some((item) => {
    const unit = item.price && Number.isFinite(item.price.unit_amount) ? item.price.unit_amount : 0;
    const qty = Number.isFinite(item.quantity) ? item.quantity : 1;
    return unit * qty >= TEAM_PLAN_MIN_CENTS;
  });
}

// Annulla gli abbonamenti Squadre dei clienti indicati. Lancia un errore se qualcosa va storto.
// Restituisce le chiavi `customer:*` che non servono più (nessun altro abbonamento attivo).
async function cancelTeamSubscriptions(customerKeys) {
  if (!customerKeys.length) return [];
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY mancante');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const removable = [];
  for (const key of customerKeys) {
    const customerId = key.slice('customer:'.length);
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
    let stillNeeded = false;
    for (const sub of subs.data) {
      const live = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'].includes(sub.status);
      if (!live) continue;
      if (isTeamPlanSubscription(sub)) {
        await stripe.subscriptions.cancel(sub.id);
      } else {
        stillNeeded = true; // abbonamento Premium individuale: il collegamento cliente->email serve ancora
      }
    }
    if (!stillNeeded) removable.push(key);
  }
  return removable;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { token, password } = req.body || {};

  if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Inserisci la password per confermare' });
  }

  try {
    const team = await getTeamBySessionToken(token);
    if (!team) {
      return res.status(401).json({ error: 'Sessione scaduta, rifai il login' });
    }

    const failKey = `teamdelfail:${team.teamId}`;
    const fails = Number(await redis.get(failKey)) || 0;
    if (fails >= MAX_BAD_PASSWORDS) {
      return res.status(429).json({ error: 'Troppi tentativi. Riprova tra 15 minuti.' });
    }

    const passwordOk = await bcrypt.compare(password, team.passwordHash);
    if (!passwordOk) {
      const count = await redis.incr(failKey);
      if (count === 1) await redis.expire(failKey, BAD_PASSWORD_WINDOW_SECONDS);
      return res.status(403).json({ error: 'Password non corretta' });
    }

    const email = normalizeEmail(team.email);

    // 1) Stripe: prima di cancellare qualsiasi dato.
    let removableCustomerKeys = [];
    try {
      const customerKeys = await findStripeCustomerKeys(email);
      removableCustomerKeys = await cancelTeamSubscriptions(customerKeys);
    } catch (err) {
      console.error('Eliminazione squadra: annullamento abbonamento non riuscito:', err);
      return res.status(502).json({
        error: 'Non riesco ad annullare l\'abbonamento in questo momento, quindi non ho cancellato nulla. Riprova tra poco o scrivi a privacy@myoffside.com.',
      });
    }

    // 2) Dati della squadra.
    const playerIds = (await redis.smembers(`teamplayers:${team.teamId}`)) || [];
    for (const playerId of playerIds) {
      await redis.del(`player:${playerId}`);
    }

    const keysToDelete = [
      `teamplayers:${team.teamId}`,
      `teamemail:${email}`,
      `teamsession:${token}`,
      `team:${team.teamId}`,
      failKey,
      ...removableCustomerKeys,
    ];
    if (team.inviteCode) keysToDelete.push(`teamcode:${team.inviteCode}`);
    for (const key of keysToDelete) {
      await redis.del(key);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Errore nell\'eliminazione della squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
