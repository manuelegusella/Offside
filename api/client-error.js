// /api/client-error.js
// Riceve i rapporti d'errore dell'app e del sito (vedi src/errorReporting.js).
// - Li conserva nel database (gli ultimi 300, lista "clienterrors").
// - Se su Vercel c'è ERROR_ALERT_EMAIL (e Resend è attivo), manda un'email per ogni errore NUOVO:
//   lo stesso errore al massimo una volta ogni 6 ore, e al massimo 12 email all'ora in tutto.
// Nei rapporti ci sono solo dati tecnici: niente nomi, email o dati di salute.
// Funzione Vercel n. 11 di 12 (piano Hobby).

import crypto from 'crypto';
import { redis } from './_lib/redis.js';
import { clientIp, countAttempt, underLimit } from './_lib/team.js';
import { emailConfigured, sendEmail } from './_lib/mail.js';

const LIST_KEY = 'clienterrors';
const MAX_KEEP = 300;
const PER_IP_PER_HOUR = 30;
const EMAILS_PER_HOUR = 12;

const text = (value, max) => (typeof value === 'string' ? value : '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false });

  const report = {
    message: text(body.message, 300),
    stack: text(body.stack, 2000),
    componentStack: text(body.componentStack, 1500),
    kind: text(body.kind, 20),
    screen: text(body.screen, 40),
    platform: text(body.platform, 20),
    version: text(body.version, 40),
    url: text(body.url, 120),
    ua: text(body.ua, 200),
    at: new Date().toISOString(),
  };
  if (!report.message) return res.status(400).json({ ok: false });

  try {
    const ipKey = `clienterror:ip:${clientIp(req)}`;
    if (!(await underLimit(ipKey, PER_IP_PER_HOUR))) return res.status(429).json({ ok: false });
    await countAttempt(ipKey, 60 * 60);

    await redis.lpush(LIST_KEY, JSON.stringify(report));
    await redis.ltrim(LIST_KEY, 0, MAX_KEEP - 1);

    const to = process.env.ERROR_ALERT_EMAIL;
    if (to && emailConfigured()) {
      const firstLine = (report.stack.split('\n').find((l) => /\d+:\d+/.test(l)) || '').trim();
      const signature = crypto.createHash('sha1').update(`${report.message}|${firstLine}`).digest('hex').slice(0, 16);
      const isNew = await redis.set(`clienterrormail:${signature}`, 1, { nx: true, ex: 6 * 60 * 60 });
      const hourKey = 'clienterrormail:hour';
      if (isNew && (await underLimit(hourKey, EMAILS_PER_HOUR))) {
        await countAttempt(hourKey, 60 * 60);
        const where = [report.platform, report.version, report.screen && `schermata "${report.screen}"`].filter(Boolean).join(' · ');
        const subject = `Errore nell'app: ${report.message.slice(0, 80)}`;
        const plain = [
          `Un utente ha incontrato un errore (${where || 'dettagli non disponibili'}).`,
          '',
          `Messaggio: ${report.message}`,
          '',
          report.stack ? `Dove:\n${report.stack.split('\n').slice(0, 8).join('\n')}` : '',
          report.componentStack ? `\nComponenti:\n${report.componentStack.split('\n').slice(0, 8).join('\n')}` : '',
          '',
          `Dispositivo: ${report.ua}`,
          `Quando: ${report.at}`,
          '',
          'Gli ultimi 300 errori restano nel database (chiave "clienterrors"). Lo stesso errore non manda altre email per 6 ore.',
        ].join('\n');
        try {
          await sendEmail({
            to,
            from: 'Offside Avvisi <avvisi@myoffside.com>',
            subject,
            text: plain,
            html: `<pre style="font:13px/1.5 SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;color:#0b1411">${esc(plain)}</pre>`,
          });
        } catch (err) {
          console.error('Avviso errore: email non inviata', err.message);
        }
      }
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('client-error: rapporto non salvato', err);
    return res.status(200).json({ ok: false });
  }
}
