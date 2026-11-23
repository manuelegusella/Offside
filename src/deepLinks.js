// src/deepLinks.js
// Link che aprono l'app (Universal Links). Se sull'iPhone c'è Offside, toccare un invito
// https://www.myoffside.com/?squadra=CODICE (WhatsApp, Messaggi, email…) apre direttamente l'app
// con il codice già scritto, invece del sito. Quali indirizzi aprono l'app lo decide il file
// public/.well-known/apple-app-site-association; qui si legge il link arrivato.
// Sul sito non fa nulla.

import { IS_NATIVE } from './platform.js';
import { setErrorContext } from './errorReporting.js';

let started = false;

// onUrl(url) riceve l'indirizzo completo (es. "https://www.myoffside.com/?squadra=ABC1234").
export function initNativeLinks(onUrl) {
  if (!IS_NATIVE || started) return;
  started = true;
  import('@capacitor/app')
    .then((m) => {
      const App = m.App;
      Promise.resolve(App.addListener('appUrlOpen', (event) => { if (event && event.url) onUrl(event.url); })).catch(() => {});
      // App aperta da chiusa toccando un link.
      App.getLaunchUrl().then((res) => { if (res && res.url) onUrl(res.url); }).catch(() => {});
      // Versione dell'app nei rapporti d'errore (es. "1.2 (8)").
      App.getInfo().then((info) => { if (info && info.version) setErrorContext({ version: `${info.version} (${info.build})` }); }).catch(() => {});
    })
    .catch(() => { /* plugin non disponibile */ });
}

// Codice squadra da un link d'invito, già pulito. null se il link non è un invito.
export function inviteCodeFromUrl(url) {
  try {
    const u = new URL(url);
    const raw = u.searchParams.get('squadra');
    if (!raw) return null;
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    return code || null;
  } catch (err) {
    return null;
  }
}
