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

// L'offerta introduttiva di App Store di un prodotto (es. Black Friday: 3,99 € al mese per i primi
// 3 mesi), solo se esiste su App Store Connect E l'utente ne ha diritto. Se Apple non sa dirlo
// (stato "sconosciuto") mostriamo il prezzo pieno, per non promettere uno sconto che poi non arriva.
async function introFor(P, product) {
  const ip = product.introPrice;
  if (!ip || !ip.priceString || !(ip.price > 0) || !product.identifier) return null;
  try {
    const elig = await P.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers: [product.identifier] });
    if (elig?.[product.identifier]?.status === 2) { // 2 = INTRO_ELIGIBILITY_STATUS_ELIGIBLE
      return { priceString: ip.priceString, cycles: ip.cycles || 1, periodUnit: ip.periodUnit || '', periodNumberOfUnits: ip.periodNumberOfUnits || 1 };
    }
  } catch (err) { /* stato sconosciuto: prezzo pieno */ }
  return null;
}

// I pacchetti di Premium dell'offerta "current" di RevenueCat, con i prezzi già formattati per il
// paese dell'utente:
//   { pkg, priceString, price, intro }               → il mensile (come prima, per compatibilità)
//   annual: { pkg, priceString, price, pricePerMonthString, intro } | null → l'annuale, se c'è
// L'annuale compare nell'app solo quando su RevenueCat è nell'offerta (pacchetto "Annual").
export async function loadPremiumOffer() {
  await initPurchases();
  const { P } = await getPlugin();
  const offerings = await P.getOfferings();
  const current = offerings?.current;
  const pkg = current?.monthly || current?.availablePackages?.find((p) => p?.product?.subscriptionPeriod === 'P1M') || current?.availablePackages?.[0] || null;
  if (!pkg) return null;
  const product = pkg.product || {};
  const annualPkg = current?.annual && current.annual !== pkg ? current.annual : null;
  let annual = null;
  if (annualPkg) {
    const ap = annualPkg.product || {};
    annual = {
      pkg: annualPkg,
      priceString: ap.priceString || '',
      price: Number(ap.price) || 0,
      pricePerMonthString: ap.pricePerMonthString || '',
      intro: await introFor(P, ap),
    };
  }
  return { pkg, priceString: product.priceString || '', price: Number(product.price) || 0, intro: await introFor(P, product), annual };
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
