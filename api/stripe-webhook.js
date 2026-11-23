// /api/stripe-webhook.js
// Riceve gli eventi da Stripe. Quando un pagamento va a buon fine, sblocca il Premium individuale
// o attiva il piano della squadra (mensile o Pass Stagionale). Quando un abbonamento finisce, lo spegne.
// Questo file va messo in una cartella "api" nella RADICE del progetto (a fianco di "src", non dentro).

import Stripe from 'stripe';
import { redis } from './_lib/redis.js';
import { applyTeamPayment, classifySession, handleSubscriptionEnded, isPaidSession, sessionEmail } from './_lib/teamBilling.js';

// Stripe ha bisogno del corpo della richiesta "grezzo" per verificare la firma, quindi disattiviamo il parsing automatico.
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  let event;
  try {
    const buf = await buffer(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
  } catch (err) {
    console.error('Verifica firma webhook fallita:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (!isPaidSession(session)) {
        console.warn(`Checkout ${session.id} completato ma non pagato (${session.payment_status}).`);
      } else {
        const kind = classifySession(session);
        if (kind === 'team_monthly' || kind === 'team_season') {
          const team = await applyTeamPayment(session, kind, stripe);
          if (team) console.log(`Squadra ${team.teamId}: attivato ${kind}`);
        } else {
          const email = sessionEmail(session);
          const customerId = typeof session.customer === 'string' ? session.customer : null;
          if (email) {
            // Collegamento cliente -> email: serve quando l'abbonamento finisce (l'evento dà solo l'ID cliente).
            if (customerId) await redis.set(`customer:${customerId}`, email);
            await redis.set(`premium:${email}`, true);
            console.log(`Premium sbloccato per: ${email}`);
          } else {
            console.warn('Pagamento Premium completato ma nessuna email trovata nella sessione.');
          }
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionEnded(event.data.object);
    }
  } catch (err) {
    // Rispondiamo comunque 200 a Stripe: il pagamento è andato a buon fine, un errore qui non deve far
    // ripetere l'evento all'infinito. L'app ha anche la conferma diretta al ritorno da Stripe.
    console.error('Errore nel gestire l\'evento Stripe:', err);
  }

  res.status(200).json({ received: true });
}
