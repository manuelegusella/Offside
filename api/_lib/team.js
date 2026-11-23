// /api/_lib/team.js
// Funzioni di supporto condivise da tutti gli endpoint "Offside Squadre".

import crypto from 'crypto';
import { redis } from './redis.js';
import { SEASON, TEAM_TRIAL_DAYS as PLAN_TRIAL_DAYS } from './teamPlans.js';

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
export const TEAM_TRIAL_DAYS = PLAN_TRIAL_DAYS;

// Fine della stagione in corso: fino a qui valgono Pass Stagionale e codici omaggio.
// Si aggiorna in un posto solo: SEASON in teamPlans.js.
export const TEAM_SEASON_PASS_END = SEASON.end;

// Upstash a volte restituisce già un oggetto (auto-parse) e a volte una stringa: normalizza.
export function parseJsonMaybe(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
}

export async function getTeam(teamId) {
  if (!teamId) return null;
  return parseJsonMaybe(await redis.get(`team:${teamId}`));
}

export async function saveTeam(team) {
  await redis.set(`team:${team.teamId}`, team);
  return team;
}

// Calcola se una squadra ha accesso alla dashboard: o ha un abbonamento mensile attivo,
// o ha un Pass Stagionale / omaggio ancora valido (paidUntil nel futuro), o è ancora dentro il mese
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
  let plan = 'none';
  if (seasonPassActive) plan = team.gift ? 'gift' : 'season';
  else if (team && team.subscriptionActive) plan = 'monthly';
  else if (trialActive) plan = 'trial';
  return {
    isPaid,
    seasonPassActive,
    paidUntil: seasonPassActive ? team.paidUntil : null,
    trialActive,
    trialDaysLeft,
    trialEndsAt,
    hasAccess: isPaid || trialActive,
    plan,
  };
}

// Sessioni: il valore salvato è "teamId|epoca". Quando la password cambia, l'epoca della squadra
// sale di 1 e tutte le sessioni vecchie smettono di funzionare. Le sessioni create prima di questa
// versione contengono solo il teamId e valgono come epoca 0.
export async function createTeamSession(team) {
  const token = generateSessionToken();
  const epoch = Number(team.sessionEpoch) || 0;
  await redis.set(`teamsession:${token}`, `${team.teamId}|${epoch}`, { ex: TEAM_SESSION_TTL_SECONDS });
  return token;
}

// Carica il team associato a un token di sessione valido, o null se assente/scaduto.
export async function getTeamBySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const raw = await redis.get(`teamsession:${token}`);
  if (!raw) return null;
  const [teamId, epochStr] = String(raw).split('|');
  const team = await getTeam(teamId);
  if (!team) return null;
  const epoch = Number(epochStr) || 0;
  if ((Number(team.sessionEpoch) || 0) > epoch) return null;
  return team;
}

// Limite di tentativi: conta le richieste su una chiave in una finestra di tempo.
// underLimit dice se si è ancora sotto il limite; countAttempt registra un tentativo.
export async function underLimit(key, limit) {
  const count = Number(await redis.get(key)) || 0;
  return count < limit;
}

export async function countAttempt(key, windowSeconds) {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  return count;
}

// Indirizzo IP di chi chiama (Vercel lo passa in x-forwarded-for): serve solo per i limiti anti-abuso.
export function clientIp(req) {
  const fwd = req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
  return String(fwd || 'unknown').split(',')[0].trim().slice(0, 64);
}

// Risposta standard dopo registrazione / accesso / nuova password: stessi campi di sempre,
// così anche le versioni dell'app già installate continuano a funzionare.
export function teamLoginPayload(team, token) {
  const access = computeTeamAccess(team);
  return {
    token,
    teamId: team.teamId,
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
  };
}

// Dati del piano da mostrare nella dashboard (mai dati di pagamento sensibili).
export function billingSummary(team) {
  const access = computeTeamAccess(team);
  return {
    plan: access.plan,
    trialEndsAt: access.trialEndsAt,
    paidUntil: access.paidUntil,
    renewsAt: team.subscriptionActive ? (team.subscriptionRenewsAt || null) : null,
    cancelAtPeriodEnd: !!(team.subscriptionActive && team.subscriptionCancelAtPeriodEnd),
    giftLabel: team.gift ? (team.gift.label || null) : null,
    hasSubscription: !!team.stripeSubscriptionId,
  };
}
