// src/errorReporting.js
// Quando qualcosa si rompe sul telefono di un utente, l'app manda al server un breve rapporto
// tecnico (vedi api/client-error.js): messaggio d'errore, punto del codice, schermata, versione e
// tipo di dispositivo. Mai dati personali: niente diario, niente email, niente dati salvati.
// Così gli errori si scoprono e si sistemano prima che qualcuno debba scriverli.

import { IS_NATIVE, apiUrl } from './platform.js';

const MAX_PER_SESSION = 5;
let sentCount = 0;
const seen = new Set();
let context = { screen: '', version: typeof __APP_BUILD__ !== 'undefined' ? __APP_BUILD__ : '' };

export function setErrorContext(next) {
  context = { ...context, ...next };
}

// Toglie eventuali indirizzi email e accorcia: nel rapporto restano solo dati tecnici.
function clean(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .slice(0, max);
}

// Errori che non dipendono dall'app: rete assente, estensioni del browser, script di terzi.
const IGNORE = /ResizeObserver loop|^Script error\.?$|chrome-extension:|moz-extension:|safari-(web-)?extension:|Failed to fetch|Load failed|NetworkError|network connection was lost|Network request failed|The Internet connection appears to be offline|AbortError|The operation was aborted/i;

export function reportError(error, extra = {}) {
  try {
    if (typeof window === 'undefined') return;
    const message = clean(error && typeof error === 'object' ? (error.message || error.name || JSON.stringify(error).slice(0, 200)) : error, 300);
    const stack = clean(error && typeof error === 'object' ? error.stack : '', 2000);
    if (!message || IGNORE.test(message) || IGNORE.test(stack.split('\n')[0] || '')) return;
    const signature = `${message}|${(stack.split('\n').find((l) => /\d+:\d+/.test(l)) || '').trim()}`;
    if (seen.has(signature) || sentCount >= MAX_PER_SESSION) return;
    seen.add(signature);
    sentCount += 1;
    const body = JSON.stringify({
      message,
      stack,
      componentStack: clean(extra.componentStack, 1500),
      kind: extra.kind || 'error',
      screen: clean(context.screen, 40),
      platform: IS_NATIVE ? 'ios-app' : 'web',
      version: clean(context.version, 40),
      url: clean(window.location && window.location.pathname, 120),
      ua: clean(navigator.userAgent, 200),
    });
    const url = apiUrl('/api/client-error');
    if (!IS_NATIVE && navigator.sendBeacon) {
      if (navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))) return;
    }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch (err) { /* il rapporto non deve mai rompere l'app */ }
}

let installed = false;
export function installGlobalErrorHandlers() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    reportError(e.error || { message: e.message, stack: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : '' }, { kind: 'error' });
  });
  window.addEventListener('unhandledrejection', (e) => {
    reportError(e.reason || { message: 'Promise rifiutata senza motivo' }, { kind: 'promise' });
  });
}
