// src/review.js
// Richiesta di recensione su App Store, con la finestra ufficiale di Apple (le stelle si danno
// senza uscire dall'app). Si chiede solo in un momento felice:
//   - dopo aver segnato la sessione del giorno almeno 3 volte (in 3 giorni diversi), oppure
//   - quando si passa alla fase successiva del percorso;
// mai nei primi 3 giorni dall'installazione e al massimo una volta ogni 4 mesi.
// Apple decide comunque da sola se mostrarla (al massimo 3 volte l'anno per persona).
// Sul sito non fa nulla.

import { IS_NATIVE } from './platform.js';

const KEY = 'offside_review';
const DAY = 24 * 60 * 60 * 1000;
const MIN_DAYS_FROM_FIRST_OPEN = 3;
const MIN_DAYS_BETWEEN_ASKS = 120;

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (err) { return {}; }
}
function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* niente */ }
}

// Da chiamare all'avvio: ricorda il primo giorno d'uso.
export function noteAppOpen() {
  if (!IS_NATIVE) return;
  const s = read();
  if (!s.firstOpen) write({ ...s, firstOpen: Date.now() });
}

export function canAskForReview(now = Date.now()) {
  if (!IS_NATIVE) return false;
  const s = read();
  if (!s.firstOpen || now - s.firstOpen < MIN_DAYS_FROM_FIRST_OPEN * DAY) return false;
  if (s.lastAsked && now - s.lastAsked < MIN_DAYS_BETWEEN_ASKS * DAY) return false;
  return true;
}

// reason: 'sessions' | 'phase'. delayMs: attesa prima della finestra (es. dopo l'animazione del GOL).
export function maybeAskForReview(reason, delayMs = 900) {
  if (!canAskForReview()) return false;
  const s = read();
  write({ ...s, lastAsked: Date.now(), lastReason: reason });
  setTimeout(() => {
    import('@capacitor-community/in-app-review')
      .then((m) => m.InAppReview.requestReview())
      .catch(() => { /* niente finestra: pazienza */ });
  }, delayMs);
  return true;
}
