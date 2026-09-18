// /api/team-register.js
// Crea un nuovo account "Offside Squadre" per il responsabile (fisio/preparatore/altro).
// La password NON viene mai salvata in chiaro: viene subito trasformata con bcrypt.

import bcrypt from 'bcryptjs';
import { redis } from './_lib/redis.js';
import { computeTeamAccess, generateId, generateInviteCode, generateSessionToken, normalizeEmail, TEAM_SESSION_TTL_SECONDS, TEAM_TRIAL_DAYS } from './_lib/team.js';

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
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email non valida' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' });
  }
  if (minorConsentAttested !== true) {
    return res.status(400).json({ error: 'Devi confermare la dichiarazione sui minorenni per continuare' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const existing = await redis.get(`teamemail:${normalizedEmail}`);
    if (existing) {
      return res.status(409).json({ error: 'Esiste già una squadra registrata con questa email' });
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
      teamName: teamName.trim(),
      responsibleName: responsibleName.trim(),
      responsibleRole,
      email: normalizedEmail,
      passwordHash,
      inviteCode,
      subscriptionActive: false,
      trialEndsAt: new Date(Date.now() + TEAM_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      minorConsentAttested: true,
      minorConsentAttestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await redis.set(`team:${teamId}`, team);
    await redis.set(`teamemail:${normalizedEmail}`, teamId);
    await redis.set(`teamcode:${inviteCode}`, teamId);

    const token = generateSessionToken();
    await redis.set(`teamsession:${token}`, teamId, { ex: TEAM_SESSION_TTL_SECONDS });

    const access = computeTeamAccess(team);

    return res.status(200).json({
      token,
      teamId,
      teamName: team.teamName,
      inviteCode,
      subscriptionActive: access.hasAccess,
      isPaid: access.isPaid,
      trialActive: access.trialActive,
      trialDaysLeft: access.trialDaysLeft,
    });
  } catch (err) {
    console.error('Errore nella registrazione squadra:', err);
    return res.status(500).json({ error: 'Errore del server, riprova tra poco' });
  }
}
