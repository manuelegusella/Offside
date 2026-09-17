// /api/team-player-revoke.js
// Il giocatore revoca il consenso: i suoi dati vengono cancellati subito dal lato server.
// Il diario giornaliero non è mai stato inviato, quindi non c'è nulla da cancellare oltre
// al riepilogo (nome, infortunio, fase, stima) che era stato condiviso.

import { redis } from './_lib/redis.js';
import { parseJsonMaybe } from './_lib/team.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { playerId } = req.body || {};

  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Richiesta non valida' });
  }

  try {
    const player = parseJsonMaybe(await redis.get(`player:${playerId}`));
    if (!player) {
      // Già rimosso: dal punto di vista del giocatore l'esito è comunque "consenso revocato".
      return res.status(200).json({ ok: true });
    }

    await redis.del(`player:${playerId}`);
    await redis.srem(`teamplayers:${player.teamId}`, playerId);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Errore nella revoca del consenso:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
