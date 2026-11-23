// /api/team-login.js
// Login del responsabile della squadra (email + password vera, con hash bcrypt).
// Dopo 5 password sbagliate sulla stessa email si blocca per 15 minuti (e c'è un limite anche per rete),
// così nessuno può provare migliaia di password.

import bcrypt from 'bcryptjs';
import { redis } from './_lib/redis.js';
import { clientIp, countAttempt, createTeamSession, getTeam, normalizeEmail, teamLoginPayload, underLimit } from './_lib/team.js';

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 30;

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
  const emailKey = `teamloginfail:${normalizedEmail}`;
  const ipKey = `teamloginfail:ip:${clientIp(req)}`;

  try {
    if (!(await underLimit(emailKey, MAX_FAILS_PER_EMAIL)) || !(await underLimit(ipKey, MAX_FAILS_PER_IP))) {
      return res.status(429).json({ error: 'Troppi tentativi. Riprova tra 15 minuti, o usa "Password dimenticata".' });
    }

    const failed = async () => {
      await countAttempt(emailKey, WINDOW_SECONDS);
      await countAttempt(ipKey, WINDOW_SECONDS);
      return res.status(401).json({ error: 'Email o password non corretti' });
    };

    const teamId = await redis.get(`teamemail:${normalizedEmail}`);
    if (!teamId) return failed();

    const team = await getTeam(teamId);
    if (!team) return failed();

    const passwordOk = await bcrypt.compare(password, team.passwordHash);
    if (!passwordOk) return failed();

    await redis.del(emailKey);
    const token = await createTeamSession(team);
    return res.status(200).json(teamLoginPayload(team, token));
  } catch (err) {
    console.error('Errore nel login squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
