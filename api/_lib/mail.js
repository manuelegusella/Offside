// /api/_lib/mail.js
// Invio email con Resend (https://resend.com). Funziona solo quando su Vercel ci sono:
//   RESEND_API_KEY  = la chiave API di Resend
//   RESEND_FROM     = (facoltativo) mittente, es. "Offside Squadre <squadre@myoffside.com>"
// Senza chiave le funzioni che mandano email rispondono "email non attiva" invece di rompersi.

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

// from (facoltativo): mittente diverso da quello predefinito, es. per gli avvisi d'errore.
export async function sendEmail({ to, subject, html, text, from: fromOverride }) {
  if (!emailConfigured()) throw new Error('email_not_configured');
  const from = fromOverride || process.env.RESEND_FROM || 'Offside Squadre <squadre@myoffside.com>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Email con il codice per reimpostare la password dell'account squadra.
export function resetCodeEmail({ teamName, code }) {
  const subject = `${code} è il tuo codice per Offside Squadre`;
  const text = [
    `Ciao,`,
    ``,
    `qualcuno (speriamo tu) ha chiesto di reimpostare la password di ${teamName} su Offside Squadre.`,
    `Il codice è: ${code}`,
    ``,
    `Vale 30 minuti. Se non sei stato tu, ignora questa email: la password resta quella di prima.`,
    ``,
    `Offside — myoffside.com`,
  ].join('\n');
  const html = `<!doctype html><html lang="it"><body style="margin:0;background:#f3f6f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1411">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f5;padding:32px 12px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dfe7e3">
      <tr><td style="background:#07110d;padding:20px 28px;color:#ffffff;font-weight:800;letter-spacing:.18em;font-size:13px">OFFSIDE <span style="color:#72e6f2">SQUADRE</span></td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0 0 14px;font-size:16px;line-height:1.5">Ecco il codice per reimpostare la password di <strong>${esc(teamName)}</strong>:</p>
        <p style="margin:0 0 18px;font-size:38px;font-weight:800;letter-spacing:.28em;color:#07110d;font-family:SFMono-Regular,Menlo,Consolas,monospace">${esc(code)}</p>
        <p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#4c5b55">Vale 30 minuti. Inseriscilo nell'app o sul sito, nella schermata "Password dimenticata".</p>
        <p style="margin:0;font-size:14px;line-height:1.5;color:#4c5b55">Se non sei stato tu, ignora questa email: la password resta quella di prima.</p>
      </td></tr>
      <tr><td style="padding:16px 28px;border-top:1px solid #eef2f0;font-size:12px;color:#7a8a84">Offside · myoffside.com</td></tr>
    </table>
  </td></tr></table></body></html>`;
  return { subject, text, html };
}
