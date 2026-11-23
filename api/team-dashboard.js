// /api/team-dashboard.js
// Restituisce il riepilogo della squadra al responsabile autenticato: nome, infortunio,
// fase e stima di recupero indicativa di ogni giocatore che ha dato consenso. Mai il diario.

import { redis } from './_lib/redis.js';
import { billingSummary, computeTeamAccess, getTeamBySessionToken, parseJsonMaybe } from './_lib/team.js';
import { SEASON, seasonPassOffer } from './_lib/teamPlans.js';

const DAY = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { token } = req.body || {};

  try {
    const team = await getTeamBySessionToken(token);
    if (!team) {
      return res.status(401).json({ error: 'Sessione scaduta, rifai il login' });
    }

    const access = computeTeamAccess(team);
    const base = {
      subscriptionActive: access.hasAccess,
      isPaid: access.isPaid,
      seasonPassActive: access.seasonPassActive,
      paidUntil: access.paidUntil,
      trialActive: access.trialActive,
      trialDaysLeft: access.trialDaysLeft,
      teamName: team.teamName,
      inviteCode: team.inviteCode,
      responsibleName: team.responsibleName,
      responsibleRole: team.responsibleRole,
      billing: billingSummary(team),
      offer: seasonPassOffer(new Date(), access.trialEndsAt),
      season: { label: SEASON.label, start: SEASON.start, end: SEASON.end },
    };

    if (!access.hasAccess) {
      const count = await redis.scard(`teamplayers:${team.teamId}`).catch(() => null);
      return res.status(200).json({ ...base, subscriptionActive: false, playerCount: Number.isFinite(count) ? count : null });
    }

    const playerIds = await redis.smembers(`teamplayers:${team.teamId}`);
    const players = [];
    // Statistiche di squadra: SOLO aggregate/anonime (mai il nome del giocatore), calcolate qui
    // sul server a partire dallo storico infortuni di ciascuno, e mai esposte per singolo giocatore.
    const statsByLabel = {};
    let totalEpisodes = 0;
    let daysLostSeason = 0;
    const resolvedDurations = [];
    const now = Date.now();
    const seasonStart = new Date(SEASON.start).getTime();
    // Riepilogo del check-in di benessere: qui SI per nome (come "status"), perché senza sapere
    // CHI è a rischio lo staff non può fare nulla di concreto — ma resta solo il livello calcolato,
    // mai le risposte del giocatore (vedi sanitizeWellness in team-player-sync.js).
    const wellnessSummary = { rosso: 0, giallo: 0, verde: 0, insufficiente: 0 };
    if (playerIds && playerIds.length) {
      const records = await Promise.all(playerIds.map((id) => redis.get(`player:${id}`)));
      for (const raw of records) {
        const p = parseJsonMaybe(raw);
        if (!p) continue;
        players.push({
          playerId: p.playerId,
          name: p.name,
          consentedAt: p.consentedAt,
          lastSyncAt: p.lastSyncAt || (p.status && p.status.lastUpdated) || p.consentedAt || null,
          status: p.status || null,
          wellness: p.wellness || null,
        });
        if (p.wellness && p.wellness.level && wellnessSummary[p.wellness.level] !== undefined) {
          wellnessSummary[p.wellness.level]++;
        }

        const history = Array.isArray(p.injuryHistory) ? p.injuryHistory : [];
        for (const episode of history) {
          if (!episode || !episode.label) continue;
          const started = new Date(episode.startedAt).getTime();
          const ended = episode.resolvedAt ? new Date(episode.resolvedAt).getTime() : now;
          if (!Number.isFinite(started)) continue;
          if (ended < seasonStart) continue; // episodio di una stagione passata
          statsByLabel[episode.label] = (statsByLabel[episode.label] || 0) + 1;
          totalEpisodes++;
          daysLostSeason += Math.max(0, Math.round((Math.min(ended, now) - Math.max(started, seasonStart)) / DAY));
          if (episode.resolvedAt) {
            const days = Math.round((ended - started) / DAY);
            if (Number.isFinite(days) && days >= 0) resolvedDurations.push(days);
          }
        }
      }
    }
    players.sort((a, b) => a.name.localeCompare(b.name, 'it'));

    const topInjuries = Object.entries(statsByLabel)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    const teamStats = {
      totalEpisodes,
      topInjuries,
      daysLostSeason,
      activeInjuries: players.filter((p) => p.status && p.status.injuryLabel).length,
      avgResolvedDays: resolvedDurations.length
        ? Math.round(resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length)
        : null,
    };

    return res.status(200).json({
      ...base,
      subscriptionActive: true,
      players,
      teamStats,
      wellnessSummary,
    });
  } catch (err) {
    console.error('Errore nel caricare la dashboard squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
