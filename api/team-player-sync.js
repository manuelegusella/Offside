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
  if (typeof status.injuryKey === 'string') s.injuryKey = status.injuryKey.slice(0, 40);
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

// Confronta lo stato precedente con quello nuovo e aggiorna lo storico infortuni del giocatore,
// che serve solo a calcolare statistiche di squadra AGGREGATE (mai per singolo nome, vedi team-dashboard.js).
// Tiene solo gli ultimi 30 episodi per giocatore.
function updateInjuryHistory(existingHistory, oldStatus, newStatus) {
  const history = Array.isArray(existingHistory) ? existingHistory.slice(-30) : [];
  const oldLabel = oldStatus && oldStatus.injuryLabel ? oldStatus.injuryLabel : null;
  const newLabel = newStatus && newStatus.injuryLabel ? newStatus.injuryLabel : null;
  if (oldLabel === newLabel) return history;

  // Chiude l'episodio precedente, se ancora aperto.
  if (oldLabel) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].label === oldLabel && !history[i].resolvedAt) {
        history[i] = { ...history[i], resolvedAt: new Date().toISOString() };
        break;
      }
    }
  }
  // Apre un nuovo episodio. Se il giocatore era già a un certo giorno di recupero,
  // stimiamo l'inizio a ritroso invece di partire sempre da "adesso".
  if (newLabel) {
    const startedAt = Number.isFinite(newStatus.dayOfRecovery) && newStatus.dayOfRecovery > 0
      ? new Date(Date.now() - newStatus.dayOfRecovery * 24 * 60 * 60 * 1000).toISOString()
      : new Date().toISOString();
    history.push({ label: newLabel, severity: newStatus.severity || null, startedAt, resolvedAt: null });
  }
  while (history.length > 30) history.shift();
  return history;
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
    const injuryHistory = updateInjuryHistory(player.injuryHistory, player.status, clean);
    const updated = { ...player, status: clean, injuryHistory };
    await redis.set(`player:${playerId}`, updated);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Errore nel sync del giocatore:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
