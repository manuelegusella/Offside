// src/storageBackup.js
// Copia di sicurezza dei dati, per non perdere mai il percorso di un utente.
//
// App iPhone: i dati (diario, percorso, Premium, squadra, scelte) stanno nel localStorage della
// WebView, che iOS può svuotare quando il telefono è quasi pieno (lo dice anche la guida di
// Capacitor: "localStorage è temporaneo"). Per questo ogni salvataggio viene copiato anche nelle
// Preferences native (UserDefaults), che iOS non svuota. All'avvio, se il localStorage ha perso
// i dati ma la copia c'è, si rimette tutto a posto PRIMA che l'app parta.
//
// Sito: chiede al browser di non cancellare i dati quando lo spazio scarseggia (storage.persist).

import { IS_NATIVE } from './platform.js';

const BACKUP_KEY = 'offside_backup_v1';
const MAIN_KEY = 'injury-recovery-progress-v3';
// Si copiano i dati del percorso e le piccole scelte dell'utente (lingua, consenso, Premium…).
const isBackedUpKey = (k) => k === MAIN_KEY || k === 'offside-cookie-consent' || k.startsWith('offside_');

let pluginPromise = null;
// I plugin Capacitor sono "proxy": non vanno restituiti da una promise (vedi purchases.js).
function getPlugin() {
  if (!pluginPromise) {
    pluginPromise = import('@capacitor/preferences')
      .then((m) => ({ Pref: m.Preferences }))
      .catch((err) => { pluginPromise = null; throw err; });
  }
  return pluginPromise;
}

// Se all'avvio i dati andavano ripristinati ma non è stato possibile, in questa sessione la copia
// NON si sovrascrive: altrimenti un'app ripartita da zero cancellerebbe anche la copia buona.
let backupLocked = false;
let timer = null;

function readLocal() {
  const items = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== BACKUP_KEY && isBackedUpKey(k)) {
        const v = localStorage.getItem(k);
        if (typeof v === 'string') items[k] = v;
      }
    }
  } catch (err) { /* storage non disponibile */ }
  return items;
}

// Da chiamare prima di far partire l'app. Risolve sempre (mai errori), al massimo dopo timeoutMs.
export async function restoreBackupIfNeeded(timeoutMs = 2500) {
  if (!IS_NATIVE) return 'web';
  let hasLocal = false;
  try { hasLocal = !!localStorage.getItem(MAIN_KEY); } catch (err) { return 'nostorage'; }
  if (hasLocal) return 'ok';

  let finished = false;
  const work = (async () => {
    const { Pref } = await getPlugin();
    const { value } = await Pref.get({ key: BACKUP_KEY });
    if (!value) return 'none';
    const data = JSON.parse(value);
    const items = data && typeof data === 'object' ? data.items : null;
    if (!items || typeof items[MAIN_KEY] !== 'string') return 'none';
    if (finished) return 'late'; // l'app è già partita: non si tocca più nulla
    for (const [k, v] of Object.entries(items)) {
      if (typeof v === 'string' && isBackedUpKey(k)) localStorage.setItem(k, v);
    }
    return 'restored';
  })().catch(() => 'failed');

  const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), timeoutMs));
  const result = await Promise.race([work, timeout]);
  finished = true;
  if (result === 'failed' || result === 'timeout') backupLocked = true;
  return result;
}

async function writeBackup() {
  if (!IS_NATIVE || backupLocked) return;
  const items = readLocal();
  if (typeof items[MAIN_KEY] !== 'string') return; // niente da salvare (o dati appena cancellati)
  try {
    const { Pref } = await getPlugin();
    await Pref.set({ key: BACKUP_KEY, value: JSON.stringify({ v: 1, savedAt: new Date().toISOString(), items }) });
  } catch (err) { /* riproverà al prossimo salvataggio */ }
}

// Dopo ogni salvataggio: la copia parte poco dopo (più salvataggi di fila = una sola copia).
export function scheduleBackup() {
  if (!IS_NATIVE) return;
  clearTimeout(timer);
  timer = setTimeout(writeBackup, 600);
}

export function flushBackup() {
  if (!IS_NATIVE) return;
  clearTimeout(timer);
  writeBackup();
}

let installed = false;
export function installStorageGuards() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  if (IS_NATIVE) {
    // App in background (o chiusa): copia subito, senza aspettare.
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushBackup(); });
    window.addEventListener('pagehide', flushBackup);
    // Prima copia per chi aggiorna l'app e ha già dei dati.
    setTimeout(writeBackup, 4000);
    return;
  }
  // Sito: dati "persistenti" (niente cancellazione automatica quando lo spazio scarseggia).
  // Firefox lo chiederebbe con un avviso, quindi lì non si chiede.
  try {
    const ua = navigator.userAgent || '';
    if (navigator.storage && navigator.storage.persist && !/firefox|fxios/i.test(ua)) {
      navigator.storage.persisted().then((already) => { if (!already) navigator.storage.persist().catch(() => {}); }).catch(() => {});
    }
  } catch (err) { /* niente */ }
}
