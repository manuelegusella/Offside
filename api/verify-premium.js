// /api/verify-premium.js
// Due usi:
//  1. { sessionId } — ritorno dal pagamento Stripe: chiediamo a Stripe se quel pagamento Premium è
//     davvero andato a buon fine prima di sbloccare. (Prima bastava aprire il sito con
//     "?premium=unlocked" per avere Premium gratis.)
//  2. { email } — "Ripristina Premium" su un nuovo dispositivo: controlla se l'email ha già pagato.
// Questo file va messo in una cartella "api" nella RADICE del progetto (a fianco di "src", non dentro).

import { redis } from './_lib/redis.js';
import { classifySession, getStripe, isPaidSession, sessionEmail } from './_lib/teamBilling.js';

// Uno stesso pagamento può sbloccare al massimo qualche dispositivo (telefono, computer, tablet).
const MAX_DEVICES_PER_PAYMENT = 4;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { email, sessionId } = req.body || {};

  if (sessionId !== undefined) {
    if (typeof sessionId !== 'string' || !/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(sessionId)) {
      return res.status(400).json({ error: 'Pagamento non valido' });
    }
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (!isPaidSession(session) || classifySession(session) !== 'premium') {
        return res.status(200).json({ premium: false });
      }
      const uses = await redis.incr(`premiumsession:${sessionId}`);
      if (uses === 1) await redis.expire(`premiumsession:${sessionId}`, 60 * 60 * 24 * 365);
      if (uses > MAX_DEVICES_PER_PAYMENT) {
        return res.status(200).json({ premium: false, reason: 'too_many_devices' });
      }
      const paidEmail = sessionEmail(session);
      if (paidEmail) {
        await redis.set(`premium:${paidEmail}`, true);
        if (typeof session.customer === 'string') await redis.set(`customer:${session.customer}`, paidEmail);
      }
      return res.status(200).json({ premium: true });
    } catch (err) {
      if (err && (err.statusCode === 404 || err.code === 'resource_missing')) {
        return res.status(200).json({ premium: false });
      }
      console.error('Errore nel verificare il pagamento Premium:', err);
      return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
    }
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email non valida' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const hasPremium = await redis.get(`premium:${normalizedEmail}`);
    return res.status(200).json({ premium: !!hasPremium });
  } catch (err) {
    console.error('Errore nel controllare Redis:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
