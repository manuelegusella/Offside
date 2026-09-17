// /api/team-player-sync.js
// Chiamata dal dispositivo del giocatore (solo se ha dato consenso attivo) ogni volta che
// il suo riepilogo cambia: infortunio, fase, giorno di recupero. NON riceve mai il diario
// giornaliero, le sensazioni o le note personali — quei campi non lasciano il dispositivo.

import { redis } from './_lib/redis.js';
import { parseJsonMaybe } from './_lib/team.js';

function sanitizeStatus(status) {
  if (!status || typeof status !== 'object') return null;
  const s = {};
  if (typeof status.injuryLabel === 'string') s.injuryLabel = status.injuryLabel.slice(0, 80);
  if (typeof status.phaseLabel === 'string') s.phaseLabel = status.phaseLabel.slice(0, 60);
  if (Number.isFinite(status.phaseIndex)) s.phaseIndex = status.phaseIndex;
  if (Number.isFinite(status.totalPhases)) s.totalPhases = status.totalPhases;
  if (Number.isFinite(status.dayOfRecovery)) s.dayOfRecovery = status.dayOfRecovery;
  if (Number.isFinite(status.estimateDays)) s.estimateDays = status.estimateDays;
  if (typeof status.severity === 'string') s.severity = status.severity.slice(0, 20);
  s.needsAttention = !!status.needsAttention;
  s.lastUpdated = new Date().toISOString();
  return s;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { playerId, status } = req.body || {};

  if (!playerId || typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Richiesta non valida' });
  }

  try {
    const player = parseJsonMaybe(await redis.get(`player:${playerId}`));
    if (!player) {
      // Il consenso è stato revocato (o non è mai esistito): non fare nulla.
      return res.status(404).json({ error: 'not_found' });
    }

    const clean = sanitizeStatus(status);
    const updated = { ...player, status: clean };
    await redis.set(`player:${playerId}`, updated);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Errore nel sync del giocatore:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
