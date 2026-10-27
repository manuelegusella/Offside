// src/purchases.js
// Acquisti in-app dell'app iPhone (RevenueCat). Sul sito e nella PWA non fa nulla:
// tutte le funzioni sono usate solo quando IS_NATIVE è vero, e il plugin viene caricato
// solo allora (import dinamico), così il sito non si appesantisce.

import { IS_NATIVE } from './platform.js';

// Chiave PUBBLICA di RevenueCat per iOS (inizia con "appl_"). È fatta per stare dentro l'app.
const RC_API_KEY_IOS = 'appl_sMufOuVJzKGFqryGNvtWbVjCOLI';

// Nome dell'entitlement creato su RevenueCat.
export const ENTITLEMENT_ID = 'premium';

let pluginPromise = null;
let configuredPromise = null;

// Attenzione: i plugin Capacitor sono "proxy" e NON vanno restituiti da una promise
// (il proxy risponderebbe a .then() e la promise resterebbe appesa). Per questo
// restituiamo un oggetto semplice { P } e il plugin si usa come P.metodo().
function getPlugin() {
  if (!pluginPromise) {
    pluginPromise = import('@revenuecat/purchases-capacitor').then((m) => ({ P: m.Purchases }));
  }
  return pluginPromise;
}

export function initPurchases() {
  if (!IS_NATIVE) return Promise.resolve(false);
  if (!configuredPromise) {
    configuredPromise = (async () => {
      if (!RC_API_KEY_IOS.startsWith('appl_')) throw new Error('Chiave RevenueCat mancante');
      const { P } = await getPlugin();
      await P.configure({ apiKey: RC_API_KEY_IOS });
      return true;
    })().catch((err) => {
      configuredPromise = null; // permette di riprovare
      throw err;
    });
  }
  return configuredPromise;
}

// Confronto senza maiuscole/minuscole: su RevenueCat l'identificatore può essere scritto "Premium" o "premium".
const isActive = (customerInfo) =>
  Object.keys(customerInfo?.entitlements?.active || {}).some((k) => k.toLowerCase() === ENTITLEMENT_ID.toLowerCase());

// Il pacchetto mensile di Premium (con prezzo già formattato per il paese dell'utente).
export async function loadPremiumOffer() {
  await initPurchases();
  const { P } = await getPlugin();
  const offerings = await P.getOfferings();
  const current = offerings?.current;
  const pkg = current?.monthly || current?.availablePackages?.[0] || null;
  if (!pkg) return null;
  return { pkg, priceString: pkg.product?.priceString || '' };
}

// true se Premium è attivo adesso (RevenueCat controlla anche la scadenza).
export async function hasPremiumEntitlement() {
  await initPurchases();
  const { P } = await getPlugin();
  const { customerInfo } = await P.getCustomerInfo();
  return isActive(customerInfo);
}

// Avvia l'acquisto. Ritorna { ok, cancelled }. Gli altri errori vengono rilanciati.
export async function buyPremium(pkg) {
  await initPurchases();
  const { P } = await getPlugin();
  try {
    const { customerInfo } = await P.purchasePackage({ aPackage: pkg });
    return { ok: isActive(customerInfo), cancelled: false };
  } catch (err) {
    if (err && (err.userCancelled || String(err.code) === '1')) return { ok: false, cancelled: true };
    throw err;
  }
}

// "Ripristina acquisti": serve su un telefono nuovo o dopo aver reinstallato l'app.
export async function restorePremiumPurchases() {
  await initPurchases();
  const { P } = await getPlugin();
  const { customerInfo } = await P.restorePurchases();
  return isActive(customerInfo);
}
