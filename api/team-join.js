// /api/team-join.js
// Un giocatore inserisce il codice invito della squadra e (dopo aver visto la schermata di
// consenso lato app) conferma di voler condividere il riepilogo del suo infortunio con il
// responsabile della squadra. Qui arriva SOLO dopo che il consenso è stato dato in app.

import { redis } from './_lib/redis.js';
import { clientIp, countAttempt, generateId, getTeam, underLimit } from './_lib/team.js';

const WINDOW_SECONDS = 15 * 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { inviteCode, playerName, consent } = req.body || {};

  if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
    return res.status(400).json({ error: 'Codice squadra mancante' });
  }
  if (!playerName || typeof playerName !== 'string' || !playerName.trim()) {
    return res.status(400).json({ error: 'Inserisci un nome o soprannome' });
  }
  if (consent !== true) {
    return res.status(400).json({ error: 'Serve il tuo consenso esplicito per continuare' });
  }

  const normalizedCode = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const ipKey = `teamjoinfail:ip:${clientIp(req)}`;

  try {
    // Limite ai codici sbagliati per rete: nessuno può indovinare i codici a forza di tentativi.
    if (!(await underLimit(ipKey, 20))) {
      return res.status(429).json({ error: 'Troppi codici sbagliati. Riprova tra 15 minuti.' });
    }

    const teamId = await redis.get(`teamcode:${normalizedCode}`);
    const team = teamId ? await getTeam(teamId) : null;
    if (!team) {
      await countAttempt(ipKey, WINDOW_SECONDS);
      return res.status(404).json({ error: 'Codice non valido. Controlla con il tuo fisio/preparatore.' });
    }

    const playerId = generateId();
    const player = {
      playerId,
      teamId,
      name: playerName.trim().slice(0, 40),
      consentedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      status: null,
    };

    await redis.set(`player:${playerId}`, player);
    await redis.sadd(`teamplayers:${teamId}`, playerId);

    return res.status(200).json({ playerId, teamId, teamName: team.teamName });
  } catch (err) {
    console.error('Errore nell\'iscrizione alla squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
