// /api/team-dashboard.js
// Restituisce il riepilogo della squadra al responsabile autenticato: nome, infortunio,
// fase e stima di recupero indicativa di ogni giocatore che ha dato consenso. Mai il diario.

import { redis } from './_lib/redis.js';
import { computeTeamAccess, getTeamBySessionToken, parseJsonMaybe } from './_lib/team.js';

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

    if (!access.hasAccess) {
      return res.status(200).json({
        subscriptionActive: false,
        isPaid: access.isPaid,
        trialActive: access.trialActive,
        trialDaysLeft: access.trialDaysLeft,
        teamName: team.teamName,
        inviteCode: team.inviteCode,
      });
    }

    const playerIds = await redis.smembers(`teamplayers:${team.teamId}`);
    const players = [];
    if (playerIds && playerIds.length) {
      const records = await Promise.all(playerIds.map((id) => redis.get(`player:${id}`)));
      for (const raw of records) {
        const p = parseJsonMaybe(raw);
        if (p) players.push({ playerId: p.playerId, name: p.name, consentedAt: p.consentedAt, status: p.status || null });
      }
    }
    players.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      subscriptionActive: true,
      isPaid: access.isPaid,
      trialActive: access.trialActive,
      trialDaysLeft: access.trialDaysLeft,
      teamName: team.teamName,
      inviteCode: team.inviteCode,
      responsibleName: team.responsibleName,
      players,
    });
  } catch (err) {
    console.error('Errore nel caricare la dashboard squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
