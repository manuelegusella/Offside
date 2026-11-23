// /api/_lib/teamBilling.js
// Tutto ciò che collega Stripe alle squadre e al Premium individuale, usato da:
//   - stripe-webhook.js (quando Stripe avvisa che un pagamento è andato a buon fine)
//   - team.js (pagamento creato dall'app e conferma immediata al ritorno da Stripe)
//   - verify-premium.js (sblocco Premium solo con un pagamento verificato)
//
// Prima il tipo di pagamento si capiva dall'importo: un abbonamento squadra con mese di prova
// arrivava a 0 € e veniva scambiato per un Premium individuale. Ora si guarda prima l'etichetta
// che mettiamo noi sul pagamento (metadata "offside"), poi il link di pagamento, e solo alla fine l'importo.

import Stripe from 'stripe';
import { redis } from './redis.js';
import { getTeam, normalizeEmail, saveTeam } from './team.js';
import { SEASON } from './teamPlans.js';

// Oggetti Stripe (account live) di Offside.
export const TEAM_MONTHLY_PRICE_ID = 'price_1UGg50EKB2kie19iAGtfG7NL'; // OFFSIDE Squadre, 50 €/mese
export const TEAM_MONTHLY_PRODUCT_ID = 'prod_VHEYwEStwC0OP5';
export const TEAM_SEASON_PRODUCT_ID = 'prod_VHheSawZCb0Wat'; // OFFSIDE Squadre — Pass Stagionale
// Premium individuale del sito: un solo prodotto, con il prezzo mensile e quello annuale.
export const PREMIUM_PRODUCT_ID = 'prod_VFLWguN2BduRWi';
const PREMIUM_PRICE_IDS = new Set([
  'price_1UevqOEKB2kie19iPxVWKH9a', // 4,99 €/mese
  'price_1UezVPEKB2kie19ipdhKW35E', // 49 €/anno
  'price_1UEqpCEKB2kie19ibGKeDtNQ', // 3,99 €/mese (vecchio, solo abbonati già attivi)
]);

// Payment Link: servono a riconoscere i pagamenti partiti da pagine ancora aperte.
const PAYMENT_LINK_KIND = {
  plink_1UGg8SEKB2kie19i3caBsuXR: 'team_monthly',
  plink_1UH8FZEKB2kie19iC3SD0Zr6: 'team_season',
  plink_1UevqTEKB2kie19i5IVjwK9H: 'premium', // Premium 4,99 €/mese
  plink_1UezVYEKB2kie19iukVM04Bp: 'premium', // Premium 49 €/anno
  plink_1UEqroEKB2kie19i1E2Dj0FA: 'premium', // vecchio Premium 3,99 €/mese
};

const METADATA_KIND = {
  squadre_mensile: 'team_monthly',
  squadre_stagione: 'team_season',
  premium_individuale_sito: 'premium',
  premium_individuale_sito_annuale: 'premium',
};

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY mancante');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// 'team_monthly' | 'team_season' | 'premium'
export function classifySession(session) {
  const tag = session && session.metadata && session.metadata.offside;
  if (tag && METADATA_KIND[tag]) return METADATA_KIND[tag];
  if (session && session.payment_link && PAYMENT_LINK_KIND[session.payment_link]) return PAYMENT_LINK_KIND[session.payment_link];
  // Ultima spiaggia (pagamenti senza etichetta né link conosciuto): è della squadra solo se porta
  // l'ID di una squadra, o se è il vecchio Pass Stagionale (pagamento unico da 200 € in su).
  // Prima bastava un importo da 10 € in su: un Premium annuale da 49 € sarebbe finito alle squadre.
  if (session && (session.client_reference_id || (session.metadata && session.metadata.teamId))) {
    return session.mode === 'payment' ? 'team_season' : 'team_monthly';
  }
  const amount = (session && session.amount_total) || 0;
  if (session && session.mode === 'payment' && amount >= 20000) return 'team_season';
  return 'premium';
}

export function sessionEmail(session) {
  const email = (session.customer_details && session.customer_details.email) || session.customer_email || '';
  return email ? normalizeEmail(email) : null;
}

export function isPaidSession(session) {
  return !!session && session.status === 'complete'
    && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
}

// La squadra di un pagamento: prima l'ID squadra che mettiamo noi nel pagamento
// (così non importa con quale email paga il presidente o il tesoriere), poi l'email.
export async function findTeamForSession(session) {
  const ref = session.client_reference_id || (session.metadata && session.metadata.teamId) || null;
  if (ref) {
    const team = await getTeam(ref);
    if (team) return team;
  }
  const email = sessionEmail(session);
  if (email) {
    const teamId = await redis.get(`teamemail:${email}`);
    if (teamId) return getTeam(teamId);
  }
  return null;
}

function itemPeriodEnd(sub) {
  const item = sub && sub.items && sub.items.data && sub.items.data[0];
  const ts = (item && item.current_period_end) || (sub && sub.current_period_end) || null;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export function subscriptionRenewsAt(sub) {
  if (!sub) return null;
  if (sub.status === 'trialing' && sub.trial_end) return new Date(sub.trial_end * 1000).toISOString();
  return itemPeriodEnd(sub);
}

// Abbonamento Premium individuale (mensile o annuale)?
export function isPremiumSubscription(sub) {
  if (!sub) return false;
  const tag = sub.metadata && sub.metadata.offside;
  if (tag && String(tag).startsWith('premium')) return true;
  const items = (sub.items && sub.items.data) || [];
  return items.some((item) => {
    const price = item.price || {};
    return price.product === PREMIUM_PRODUCT_ID || PREMIUM_PRICE_IDS.has(price.id);
  });
}

export function isTeamSubscription(sub) {
  if (!sub) return false;
  if (sub.metadata && sub.metadata.offside === 'squadre_mensile') return true;
  if (isPremiumSubscription(sub)) return false;
  const items = (sub.items && sub.items.data) || [];
  return items.some((item) => {
    const price = item.price || {};
    if (price.id === TEAM_MONTHLY_PRICE_ID || price.product === TEAM_MONTHLY_PRODUCT_ID) return true;
    // Il piano squadre è solo mensile: un abbonamento annuale non è mai "Squadre".
    if (price.recurring && price.recurring.interval && price.recurring.interval !== 'month') return false;
    // Ultima spiaggia per abbonamenti molto vecchi: importo da squadra (il Premium mensile costa meno di 10 €).
    const unit = Number.isFinite(price.unit_amount) ? price.unit_amount : 0;
    const qty = Number.isFinite(item.quantity) ? item.quantity : 1;
    return unit * qty >= 1000;
  });
}

// Attiva il piano della squadra dopo un pagamento riuscito. Si può chiamare più volte con lo
// stesso pagamento (webhook + ritorno dall'app) senza fare danni.
export async function applyTeamPayment(session, kind, stripe = null) {
  const team = await findTeamForSession(session);
  const email = sessionEmail(session);
  if (!team) {
    // Pagamento senza squadra: lo teniamo da parte per sistemarlo a mano.
    await redis.set(`orphanpayment:${session.id}`, { sessionId: session.id, kind, email, amount: session.amount_total || 0, at: new Date().toISOString() });
    console.warn(`Pagamento squadra ${session.id} (${kind}) senza squadra collegata. Email: ${email || '-'}`);
    return null;
  }

  const customerId = typeof session.customer === 'string' ? session.customer : (session.customer && session.customer.id) || null;
  if (customerId) {
    await redis.set(`teamcustomer:${customerId}`, team.teamId);
    if (email) await redis.set(`customer:${customerId}`, email);
  }

  const next = { ...team };
  if (kind === 'team_season') {
    next.paidUntil = SEASON.end;
    next.seasonPass = { sessionId: session.id, amount: session.amount_total || 0, paidAt: new Date().toISOString() };
    // Se pagava già mese per mese, smette di rinnovarsi: il Pass copre fino a fine stagione.
    if (team.stripeSubscriptionId && team.subscriptionActive && !team.subscriptionCancelAtPeriodEnd) {
      try {
        const s = stripe || getStripe();
        await s.subscriptions.update(team.stripeSubscriptionId, { cancel_at_period_end: true });
        next.subscriptionCancelAtPeriodEnd = true;
      } catch (err) {
        console.error('Pass Stagionale: non riesco a fermare il rinnovo mensile', err);
      }
    }
  } else if (kind === 'team_monthly') {
    next.subscriptionActive = true;
    next.subscriptionCancelAtPeriodEnd = false;
    const subId = typeof session.subscription === 'string' ? session.subscription : (session.subscription && session.subscription.id) || null;
    if (subId) {
      next.stripeSubscriptionId = subId;
      await redis.set(`teamsub:${subId}`, team.teamId);
      try {
        const s = stripe || getStripe();
        const sub = await s.subscriptions.retrieve(subId);
        next.subscriptionRenewsAt = subscriptionRenewsAt(sub);
      } catch (err) {
        console.error('Non riesco a leggere la data di rinnovo', err);
      }
    }
  }
  if (customerId) next.stripeCustomerId = customerId;
  await saveTeam(next);
  return next;
}

// Abbonamento finito (disdetta arrivata a scadenza o pagamenti non riusciti).
export async function handleSubscriptionEnded(sub) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : (sub.customer && sub.customer.id) || null;
  if (isTeamSubscription(sub)) {
    let teamId = (sub.metadata && sub.metadata.teamId) || await redis.get(`teamsub:${sub.id}`);
    if (!teamId && customerId) teamId = await redis.get(`teamcustomer:${customerId}`);
    if (!teamId && customerId) {
      const email = await redis.get(`customer:${customerId}`);
      if (email) teamId = await redis.get(`teamemail:${email}`);
    }
    const team = teamId ? await getTeam(teamId) : null;
    if (team && (!team.stripeSubscriptionId || team.stripeSubscriptionId === sub.id)) {
      await saveTeam({ ...team, subscriptionActive: false, subscriptionCancelAtPeriodEnd: false, subscriptionRenewsAt: null, subscriptionEndedAt: new Date().toISOString() });
      console.log(`Abbonamento Squadre terminato: ${team.teamId}`);
    }
    return;
  }
  if (customerId) {
    const email = await redis.get(`customer:${customerId}`);
    if (typeof email === 'string' && email) {
      await redis.del(`premium:${email}`);
      console.log(`Premium tolto per: ${email} (abbonamento terminato)`);
    }
  }
}
