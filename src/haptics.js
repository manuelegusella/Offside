// src/haptics.js
// Vibrazione al tocco.
// Sull'iPhone Safari non supporta navigator.vibrate, quindi prima l'app non vibrava mai.
// Nell'app nativa ora si usa il motore aptico di iOS (plugin @capacitor/haptics), che rispetta
// da solo l'impostazione "Feedback aptico" del telefono. Sul sito resta navigator.vibrate
// (funziona su Android).
//
// haptic() accetta sia i vecchi valori in millisecondi (8, [10, 30, 16]…) sia un nome:
// 'light' tocco leggero · 'medium' tocco deciso · 'success' azione completata · 'warning' · 'error'

import { IS_NATIVE } from './platform.js';

let pluginPromise = null;
// I plugin Capacitor sono "proxy": non vanno restituiti da una promise (vedi purchases.js).
function getPlugin() {
  if (!pluginPromise) {
    pluginPromise = import('@capacitor/haptics')
      .then((m) => ({ H: m.Haptics, ImpactStyle: m.ImpactStyle, NotificationType: m.NotificationType }))
      .catch((err) => { pluginPromise = null; throw err; });
  }
  return pluginPromise;
}

const WEB_PATTERNS = { light: 8, medium: 14, success: [10, 30, 16], warning: [20, 40, 20], error: [30, 40, 30, 40, 30] };

// Traduce i vecchi valori in un tipo di vibrazione.
function kindOf(pattern) {
  if (typeof pattern === 'string') return pattern;
  if (Array.isArray(pattern)) {
    const total = pattern.reduce((sum, n) => sum + (Number(n) || 0), 0);
    return total >= 55 ? 'success' : 'medium';
  }
  const ms = Number(pattern) || 0;
  if (ms >= 30) return 'success';
  if (ms >= 12) return 'medium';
  return 'light';
}

export function haptic(pattern = 10) {
  const kind = kindOf(pattern);
  if (IS_NATIVE) {
    getPlugin().then(({ H, ImpactStyle, NotificationType }) => {
      if (kind === 'success') return H.notification({ type: NotificationType.Success });
      if (kind === 'warning') return H.notification({ type: NotificationType.Warning });
      if (kind === 'error') return H.notification({ type: NotificationType.Error });
      return H.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
    }).catch(() => { /* niente vibrazione */ });
    return;
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(typeof pattern === 'string' ? (WEB_PATTERNS[pattern] || 10) : pattern);
    }
  } catch (err) { /* niente vibrazione */ }
}

// Carica il plugin in anticipo, così la prima vibrazione non arriva in ritardo.
export function warmUpHaptics() {
  if (IS_NATIVE) getPlugin().catch(() => {});
}
