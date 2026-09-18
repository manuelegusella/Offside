// /api/_lib/team.js
// Funzioni di supporto condivise da tutti gli endpoint "Offside Squadre".

import crypto from 'crypto';
import { redis } from './redis.js';

// Caratteri senza ambiguità (niente 0/O, 1/I/L) per un codice leggibile e dettabile al telefono.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 7) {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateId() {
  return crypto.randomUUID();
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export const TEAM_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 giorni

// Primo mese di prova gratuito per le nuove squadre.
export const TEAM_TRIAL_DAYS = 30;

// Calcola se una squadra ha accesso alla dashboard: o ha un abbonamento attivo,
// o è ancora dentro il mese di prova gratuito. Se "trialEndsAt" manca (squadre create
// prima di questa funzione), lo calcoliamo da "createdAt" così nessuna squadra esistente
// resta bloccata per errore.
export function computeTeamAccess(team) {
  const isPaid = !!(team && team.subscriptionActive);
  const fallbackTrialEndsAt = team && team.createdAt
    ? new Date(new Date(team.createdAt).getTime() + TEAM_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const trialEndsAt = (team && team.trialEndsAt) || fallbackTrialEndsAt;
  const trialActive = !isPaid && !!trialEndsAt && new Date(trialEndsAt).getTime() > Date.now();
  const trialDaysLeft = trialActive
    ? Math.max(1, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;
  return { isPaid, trialActive, trialDaysLeft, trialEndsAt, hasAccess: isPaid || trialActive };
}

// Carica il team associato a un token di sessione valido, o null se assente/scaduto.
export async function getTeamBySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const teamId = await redis.get(`teamsession:${token}`);
  if (!teamId) return null;
  const team = await redis.get(`team:${teamId}`);
  if (!team) return null;
  return typeof team === 'string' ? JSON.parse(team) : team;
}

// Upstash a volte restituisce già un oggetto (auto-parse) e a volte una stringa: normalizza.
export function parseJsonMaybe(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
}
