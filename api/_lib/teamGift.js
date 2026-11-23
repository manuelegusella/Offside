// /api/_lib/teamGift.js
// Codici omaggio per Offside Squadre: chi ha un codice valido ha la dashboard gratis fino a fine
// stagione. Ogni codice vale per UNA squadra. Qui ci sono solo le "impronte" dei codici (scrypt),
// non i codici veri: il progetto è pubblico su GitHub e nessuno deve poterli leggere da qui.
//
// Per aggiungere un codice nuovo chiedi a Claude, oppure calcola l'impronta così (Node):
//   crypto.scryptSync('CODICESENZATRATTINI', 'offside-gift-v1', 32, { N: 16384, r: 8, p: 1 }).toString('hex')

import crypto from 'crypto';

const SALT = 'offside-gift-v1';

export const GIFT_CODES = [
  { id: 'amico-1', hash: 'f80fa4daefc1840a5881b829b303373d1cb345ecb0eda33e7784872fb5d4957a', label: 'Omaggio stagione 2026/27' },
  { id: 'amico-2', hash: '669455e88c7a1f67b48ebb4fdf49f7688e461d367fa6a6052db583b49ff2da5d', label: 'Omaggio stagione 2026/27' },
];

export function normalizeGiftCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Restituisce il codice omaggio che corrisponde, o null.
export function matchGiftCode(code) {
  const norm = normalizeGiftCode(code);
  if (norm.length < 8 || norm.length > 40) return null;
  const hash = crypto.scryptSync(norm, SALT, 32, { N: 16384, r: 8, p: 1 });
  for (const gift of GIFT_CODES) {
    const expected = Buffer.from(gift.hash, 'hex');
    if (expected.length === hash.length && crypto.timingSafeEqual(expected, hash)) return gift;
  }
  return null;
}
