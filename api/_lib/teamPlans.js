// /api/_lib/teamPlans.js
// Prezzi e stagione di "Offside Squadre", in un posto solo.
// Lo usano sia il server (per decidere il prezzo vero del pagamento) sia l'app (per mostrarlo),
// quindi qui non ci sono import di Node: solo numeri, date e piccoli calcoli.
//
// OGNI ESTATE: aggiorna SEASON (fine stagione) e PASS_SCHEDULE (prezzi mese per mese).

export const TEAM_MONTHLY_EUR = 50;
export const TEAM_TRIAL_DAYS = 30;

// Stagione dilettantistica in corso: il Pass Stagionale e i codici omaggio valgono fino a qui.
export const SEASON = {
  label: '2026/27',
  start: '2026-07-01T00:00:00.000Z',
  end: '2027-05-31T21:59:59.000Z', // 31 maggio, 23:59:59 ora italiana
};

// Prezzo del Pass Stagionale in base al mese in cui lo compri: 50 € in meno ogni mese.
// Dopo l'ultima data ("until") il Pass non si vende più: resta solo il mensile.
export const PASS_SCHEDULE = [
  { from: '2026-11-01', price: 200 },
  { from: '2026-12-01', price: 150 },
  { from: '2027-01-01', price: 100 },
  { from: '2027-02-01', price: 50 },
];
export const PASS_SALE_UNTIL = '2027-03-01'; // dal 1° marzo niente Pass

const DAY = 24 * 60 * 60 * 1000;

function toTime(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return new Date(value).getTime();
}

// Quanti addebiti mensili servirebbero per restare coperti dalla data "start" fino a fine stagione.
export function monthlyChargesUntilSeasonEnd(start, seasonEnd = SEASON.end) {
  const end = toTime(seasonEnd);
  const d = new Date(toTime(start));
  let n = 0;
  while (d.getTime() < end && n < 24) {
    n += 1;
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return n;
}

// Il prezzo del Pass oggi, quanto costerebbe lo stesso periodo mese per mese e il risparmio.
// trialEndsAt: fine della prova della squadra (se c'è): il mensile si paga solo da lì in poi.
export function seasonPassOffer(now = new Date(), trialEndsAt = null) {
  const t = toTime(now);
  const seasonEnd = toTime(SEASON.end);
  let price = null;
  for (const step of PASS_SCHEDULE) {
    if (t >= toTime(`${step.from}T00:00:00.000Z`)) price = step.price;
  }
  const onSale = price !== null && price > 0 && t < toTime(`${PASS_SALE_UNTIL}T00:00:00.000Z`) && t < seasonEnd;
  const trialEnd = trialEndsAt ? toTime(trialEndsAt) : t + TEAM_TRIAL_DAYS * DAY;
  const billingStart = Math.max(t, Number.isFinite(trialEnd) ? trialEnd : t);
  const charges = monthlyChargesUntilSeasonEnd(billingStart, SEASON.end);
  const monthlyTotal = charges * TEAM_MONTHLY_EUR;
  return {
    available: onSale,
    price: onSale ? price : null,
    seasonEnd: SEASON.end,
    seasonLabel: SEASON.label,
    monthlyCharges: charges,
    monthlyTotal,
    savings: onSale ? Math.max(0, monthlyTotal - price) : 0,
  };
}
