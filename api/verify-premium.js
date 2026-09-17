// /api/verify-premium.js
// Controlla se un'email ha già Premium sbloccato. Chiamata dall'app quando l'utente
// prova a "ripristinare" Premium su un nuovo dispositivo inserendo la sua email.
// Questo file va messo in una cartella "api" nella RADICE del progetto (a fianco di "src", non dentro).

import { redis } from './_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { email } = req.body || {};

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
