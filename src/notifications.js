// src/notifications.js
// Promemoria giornaliero del piano di oggi: una notifica locale che il telefono mostra all'ora scelta.
// Non passa da nessun server e non porta fuori nessun dato. Funziona solo nell'app per iPhone:
// sul sito e nella PWA il modulo non fa nulla e il controllo nell'app non compare.

import { IS_NATIVE } from './platform.js';

const REMINDER_ID = 4201;

export const remindersSupported = () => IS_NATIVE;

// Attenzione: i plugin Capacitor sono "proxy" e NON vanno restituiti da una promise
// (il proxy risponderebbe a .then() e la promise resterebbe appesa). Per questo
// restituiamo un oggetto semplice { LN } e il plugin si usa come LN.metodo().
// (Lo stesso accorgimento di purchases.js.)
let pluginPromise = null;
function getPlugin() {
  if (!pluginPromise) {
    pluginPromise = import('@capacitor/local-notifications')
      .then((m) => ({ LN: m.LocalNotifications }))
      .catch((err) => { pluginPromise = null; throw err; });
  }
  return pluginPromise;
}

// 'granted' | 'denied' | 'prompt' | 'unsupported'
export async function reminderPermission() {
  if (!IS_NATIVE) return 'unsupported';
  try {
    const { LN } = await getPlugin();
    const r = await LN.checkPermissions();
    if (r.display === 'granted') return 'granted';
    if (r.display === 'denied') return 'denied';
    return 'prompt';
  } catch (err) {
    return 'unsupported';
  }
}

// Programma il promemoria di ogni giorno all'ora indicata (sostituisce quello di prima).
// Chiede il permesso al sistema se serve: la finestra del sistema compare solo la prima volta.
// Restituisce 'granted' (programmato), 'denied' (permesso negato) o 'unsupported' / 'error'.
export async function scheduleDailyReminder({ hour, minute, title, body }) {
  if (!IS_NATIVE) return 'unsupported';
  try {
    const { LN } = await getPlugin();
    let perm = await LN.checkPermissions();
    if (perm.display !== 'granted') perm = await LN.requestPermissions();
    if (perm.display !== 'granted') return 'denied';
    try { await LN.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch (err) { /* niente da annullare */ }
    await LN.schedule({
      notifications: [{
        id: REMINDER_ID,
        title,
        body,
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      }],
    });
    return 'granted';
  } catch (err) {
    return 'error';
  }
}

export async function cancelDailyReminder() {
  if (!IS_NATIVE) return;
  try {
    const { LN } = await getPlugin();
    await LN.cancel({ notifications: [{ id: REMINDER_ID }] });
  } catch (err) { /* nessun promemoria da togliere */ }
}

// Testi del promemoria: brevi, senza pressione. Niente nome dell'infortunio nella notifica
// (resta sul telefono, ma può comparire sulla schermata bloccata).
export const REMINDER_COPY = {
  it: {
    title: 'Offside',
    body: 'Il tuo piano di oggi è pronto. Prima di iniziare, segna come stai.',
  },
  en: {
    title: 'Offside',
    body: 'Your plan for today is ready. Before you start, log how you feel.',
  },
};
