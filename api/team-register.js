// /api/team-register.js
// Crea un nuovo account "Offside Squadre" per il responsabile (fisio/preparatore/altro).
// La password NON viene mai salvata in chiaro: viene subito trasformata con bcrypt.

import bcrypt from 'bcryptjs';
import { redis } from './_lib/redis.js';
import {
  clientIp, countAttempt, createTeamSession, generateId, generateInviteCode, normalizeEmail,
  teamLoginPayload, TEAM_TRIAL_DAYS, underLimit,
} from './_lib/team.js';

const ALLOWED_ROLES = ['fisioterapista', 'preparatore', 'allenatore', 'altro'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  const { teamName, responsibleName, responsibleRole, email, password, minorConsentAttested } = req.body || {};

  if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
    return res.status(400).json({ error: 'Nome squadra mancante' });
  }
  if (!responsibleName || typeof responsibleName !== 'string' || !responsibleName.trim()) {
    return res.status(400).json({ error: 'Nome del responsabile mancante' });
  }
  if (!ALLOWED_ROLES.includes(responsibleRole)) {
    return res.status(400).json({ error: 'Ruolo non valido' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Email non valida' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' });
  }
  if (minorConsentAttested !== true) {
    return res.status(400).json({ error: 'Devi confermare la dichiarazione sui minorenni per continuare' });
  }

  const normalizedEmail = normalizeEmail(email);
  const ipKey = `teamregister:ip:${clientIp(req)}`;

  try {
    if (!(await underLimit(ipKey, 10))) {
      return res.status(429).json({ error: 'Troppe registrazioni da questa rete. Riprova tra un\'ora.' });
    }

    const existing = await redis.get(`teamemail:${normalizedEmail}`);
    if (existing) {
      return res.status(409).json({ error: 'Esiste già una squadra registrata con questa email. Accedi, o usa "Password dimenticata".' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const teamId = generateId();

    // Genera un codice invito unico (praticamente certo al primo tentativo, ma verifica per sicurezza).
    let inviteCode = generateInviteCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const taken = await redis.get(`teamcode:${inviteCode}`);
      if (!taken) break;
      inviteCode = generateInviteCode();
    }

    const team = {
      teamId,
      teamName: teamName.trim().slice(0, 60),
      responsibleName: responsibleName.trim().slice(0, 60),
      responsibleRole,
      email: normalizedEmail,
      passwordHash,
      inviteCode,
      subscriptionActive: false,
      trialEndsAt: new Date(Date.now() + TEAM_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      minorConsentAttested: true,
      minorConsentAttestedAt: new Date().toISOString(),
      sessionEpoch: 0,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`team:${teamId}`, team);
    await redis.set(`teamemail:${normalizedEmail}`, teamId);
    await redis.set(`teamcode:${inviteCode}`, teamId);
    await countAttempt(ipKey, 60 * 60);

    const token = await createTeamSession(team);
    return res.status(200).json(teamLoginPayload(team, token));
  } catch (err) {
    console.error('Errore nella registrazione squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
