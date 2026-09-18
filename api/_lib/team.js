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

// Il "Pass Stagionale" è un pagamento UNICO (non ricorrente) valido fino alla fine della
// stagione di calcio dilettantistico in corso (Eccellenza/Promozione/Prima Categoria finiscono
// tra inizio maggio e fine maggio con playoff/playout inclusi — verificato stagione 2026-27).
// Da aggiornare ogni estate quando esce il nuovo calendario federale.
export const TEAM_SEASON_PASS_END = '2027-05-31T23:59:59.000Z';

// Calcola se una squadra ha accesso alla dashboard: o ha un abbonamento mensile attivo,
// o ha un Pass Stagionale ancora valido (paidUntil nel futuro), o è ancora dentro il mese
// di prova gratuito. Se "trialEndsAt" manca (squadre create prima di questa funzione), lo
// calcoliamo da "createdAt" così nessuna squadra esistente resta bloccata per errore.
export function computeTeamAccess(team) {
  const now = Date.now();
  const seasonPassActive = !!(team && team.paidUntil && new Date(team.paidUntil).getTime() > now);
  const isPaid = !!(team && team.subscriptionActive) || seasonPassActive;
  const fallbackTrialEndsAt = team && team.createdAt
    ? new Date(new Date(team.createdAt).getTime() + TEAM_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const trialEndsAt = (team && team.trialEndsAt) || fallbackTrialEndsAt;
  const trialActive = !isPaid && !!trialEndsAt && new Date(trialEndsAt).getTime() > now;
  const trialDaysLeft = trialActive
    ? Math.max(1, Math.ceil((new Date(trialEndsAt).getTime() - now) / (24 * 60 * 60 * 1000)))
    : 0;
  return {
    isPaid,
    seasonPassActive,
    paidUntil: seasonPassActive ? team.paidUntil : null,
    trialActive,
    trialDaysLeft,
    trialEndsAt,
    hasAccess: isPaid || trialActive,
  };
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
