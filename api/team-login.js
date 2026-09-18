// /api/team-login.js
// Login del responsabile della squadra (email + password vera, con hash bcrypt).

import bcrypt from 'bcryptjs';
import { redis } from './_lib/redis.js';
import { computeTeamAccess, generateSessionToken, normalizeEmail, parseJsonMaybe, TEAM_SESSION_TTL_SECONDS } from './_lib/team.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email o password non corretti' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const teamId = await redis.get(`teamemail:${normalizedEmail}`);
    if (!teamId) {
      return res.status(401).json({ error: 'Email o password non corretti' });
    }

    const team = parseJsonMaybe(await redis.get(`team:${teamId}`));
    if (!team) {
      return res.status(401).json({ error: 'Email o password non corretti' });
    }

    const passwordOk = await bcrypt.compare(password, team.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Email o password non corretti' });
    }

    const token = generateSessionToken();
    await redis.set(`teamsession:${token}`, teamId, { ex: TEAM_SESSION_TTL_SECONDS });

    const access = computeTeamAccess(team);

    return res.status(200).json({
      token,
      teamId,
      teamName: team.teamName,
      responsibleName: team.responsibleName,
      responsibleRole: team.responsibleRole,
      inviteCode: team.inviteCode,
      subscriptionActive: access.hasAccess,
      isPaid: access.isPaid,
      seasonPassActive: access.seasonPassActive,
      paidUntil: access.paidUntil,
      trialActive: access.trialActive,
      trialDaysLeft: access.trialDaysLeft,
    });
  } catch (err) {
    console.error('Errore nel login squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
