// /api/stripe-webhook.js
// Riceve gli eventi da Stripe. Quando un pagamento va a buon fine, segna l'email come Premium
// (individuale) o attiva l'abbonamento della squadra, a seconda dell'importo pagato.
// Questo file va messo in una cartella "api" nella RADICE del progetto (a fianco di "src", non dentro).

import Stripe from 'stripe';
import { redis } from './_lib/redis.js';
import { normalizeEmail, parseJsonMaybe } from './_lib/team.js';

// Distingue un pagamento "Offside Squadre" (50$/mese) da un Premium individuale (3,99€/mese):
// usiamo l'importo perché sono due Payment Link diversi con prezzi molto distanti.
// Se in futuro cambi i prezzi, aggiorna questa soglia (in centesimi) di conseguenza.
const TEAM_PLAN_MIN_CENTS = 1000;

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    const customerId = session.customer;
    const isTeamPlan = (session.amount_total || 0) >= TEAM_PLAN_MIN_CENTS;

    if (email) {
      const normalizedEmail = normalizeEmail(email);
      try {
        // Salviamo il collegamento cliente -> email in ogni caso, ci serve quando l'abbonamento
        // finisce (l'evento di cancellazione ci dà solo l'ID cliente, non l'email direttamente).
        if (customerId) {
          await redis.set(`customer:${customerId}`, normalizedEmail);
        }

        if (isTeamPlan) {
          const teamId = await redis.get(`teamemail:${normalizedEmail}`);
          if (teamId) {
            const team = parseJsonMaybe(await redis.get(`team:${teamId}`));
            if (team) {
              await redis.set(`team:${teamId}`, { ...team, subscriptionActive: true });
              console.log(`Abbonamento Squadre attivato per: ${normalizedEmail}`);
            }
          } else {
            console.warn(`Pagamento Squadre ricevuto per ${normalizedEmail} ma nessuna squadra registrata con questa email.`);
          }
        } else {
          await redis.set(`premium:${normalizedEmail}`, true);
          console.log(`Premium sbloccato per: ${normalizedEmail}`);
        }
      } catch (err) {
        console.error('Errore nel salvare su Redis:', err);
        // Rispondiamo comunque 200 a Stripe: il pagamento è andato a buon fine,
        // un errore qui non deve far ripetere l'evento a Stripe all'infinito.
      }
    } else {
      console.warn('Pagamento completato ma nessuna email trovata nella sessione.');
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    if (customerId) {
      try {
        const email = await redis.get(`customer:${customerId}`);
        if (email) {
          const teamId = await redis.get(`teamemail:${email}`);
          if (teamId) {
            const team = parseJsonMaybe(await redis.get(`team:${teamId}`));
            if (team) {
              await redis.set(`team:${teamId}`, { ...team, subscriptionActive: false });
              console.log(`Abbonamento Squadre disattivato per: ${email}`);
            }
          } else {
            await redis.del(`premium:${email}`);
            console.log(`Premium tolto per: ${email} (abbonamento terminato)`);
          }
        } else {
          console.warn(`Abbonamento terminato per cliente ${customerId}, ma non trovo l'email collegata.`);
        }
      } catch (err) {
        console.error('Errore nel togliere Premium su Redis:', err);
      }
    }
  }

  res.status(200).json({ received: true });
}
