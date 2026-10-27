"""Applica a src/App.jsx le modifiche per gli acquisti in-app dell'app iPhone (RevenueCat).
Uso, dalla cartella del progetto:  python3 iap_patch.py
Prima deve essere già applicata la patch iOS (ios_patch.py) e deve esistere src/purchases.js.
Se un pezzo di codice non è nel punto atteso si ferma SENZA toccare nulla.

Cosa cambia, solo nell'app iPhone (il sito resta identico):
  - pulsante "Sblocca Premium" con acquisto Apple, testi di rinnovo e link obbligatori
  - pulsante "Ripristina acquisti"
  - all'avvio controlla se Premium è attivo (e lo toglie se l'abbonamento è scaduto)
  - Squadre: niente prezzi, link di pagamento e "mese gratis" dentro l'app (regola Apple 3.1.1)"""
import pathlib
import re
import sys

app_p = pathlib.Path('src/App.jsx')
app = app_p.read_text()


def need(cond, msg):
    if not cond:
        sys.exit('ERRORE: ' + msg + '. Non ho modificato nulla.')


need("from './platform.js'" in app, "manca la patch iOS (ios_patch.py): lanciala prima")
need(pathlib.Path('src/purchases.js').exists(), "manca src/purchases.js")
if "from './purchases.js'" in app:
    sys.exit('Patch acquisti già applicata, niente da fare.')


def replace_once(old, new, label):
    global app
    need(app.count(old) == 1, f"{label}: punto di codice non trovato (o trovato più volte)")
    app = app.replace(old, new)


def wrap_native_hidden(start_marker, end_token, label):
    """Avvolge un elemento JSX in {!IS_NATIVE && (...)} così nell'app iPhone sparisce."""
    global app
    need(app.count(start_marker) == 1, f"{label}: inizio non trovato (o trovato più volte)")
    s = app.index(start_marker)
    e = app.index(end_token, s)
    need(e > s, f"{label}: fine non trovata")
    e += len(end_token)
    app = app[:s] + '{!IS_NATIVE && (' + app[s:e] + ')}' + app[e:]


# 1) import
replace_once(
    "import { IS_NATIVE, apiUrl } from './platform.js';\n",
    "import { IS_NATIVE, apiUrl } from './platform.js';\n"
    "import { loadPremiumOffer, hasPremiumEntitlement, buyPremium, restorePremiumPurchases } from './purchases.js';\n",
    'import',
)

# 2) stato, controllo all'avvio e funzioni di acquisto (prima di restorePremium)
iap_logic = r"""  // --- Acquisti in-app (solo app iPhone; sul sito questo blocco non fa nulla) ---
  const [iapOffer, setIapOffer] = useState(null);
  const [iapStatus, setIapStatus] = useState('idle'); // idle | buying | restoring | error | cancelled | notfound
  const [iapChange, setIapChange] = useState(null); // { on, t }: esito del controllo/acquisto

  // Dopo il caricamento dei dati: Premium è attivo su Apple? Se l'abbonamento è scaduto
  // (e Premium era stato sbloccato da un acquisto) lo togliamo.
  useEffect(() => {
    if (!IS_NATIVE || loading) return undefined;
    let stopped = false;
    (async () => {
      try {
        const active = await hasPremiumEntitlement();
        if (stopped) return;
        let wasIap = false;
        try { wasIap = localStorage.getItem('offside_iap') === '1'; } catch (err) {}
        if (active) setIapChange({ on: true, t: Date.now() });
        else if (wasIap) setIapChange({ on: false, t: Date.now() });
      } catch (err) {}
      try {
        const offer = await loadPremiumOffer();
        if (!stopped) setIapOffer(offer);
      } catch (err) {}
    })();
    return () => { stopped = true; };
  }, [loading]);

  useEffect(() => {
    if (!iapChange) return;
    try {
      if (iapChange.on) localStorage.setItem('offside_iap', '1');
      else localStorage.removeItem('offside_iap');
    } catch (err) {}
    if (premiumUnlocked !== iapChange.on) {
      setPremiumUnlocked(iapChange.on);
      persist(snapshot({ premiumUnlocked: iapChange.on }));
    }
  }, [iapChange]);

  const iapBuy = async () => {
    if (iapStatus === 'buying' || iapStatus === 'restoring') return;
    trackEvent('premium_unlock_clicked_native');
    setIapStatus('buying');
    try {
      let offer = iapOffer;
      if (!offer) { offer = await loadPremiumOffer(); setIapOffer(offer); }
      if (!offer) { setIapStatus('error'); return; }
      const res = await buyPremium(offer.pkg);
      if (res.ok) {
        trackEvent('premium_purchased_native');
        setIapChange({ on: true, t: Date.now() });
        setIapStatus('idle');
      } else {
        setIapStatus(res.cancelled ? 'cancelled' : 'error');
      }
    } catch (err) {
      setIapStatus('error');
    }
  };

  const iapRestore = async () => {
    if (iapStatus === 'buying' || iapStatus === 'restoring') return;
    setIapStatus('restoring');
    try {
      const ok = await restorePremiumPurchases();
      if (ok) {
        setIapChange({ on: true, t: Date.now() });
        setIapStatus('idle');
      } else {
        setIapStatus('notfound');
      }
    } catch (err) {
      setIapStatus('error');
    }
  };

"""
replace_once("  const restorePremium = async () => {\n", iap_logic + "  const restorePremium = async () => {\n", 'funzioni acquisto')

# 3) schermata Premium: dentro l'app iPhone il pulsante compra con Apple
native_note = re.compile(
    r"[ \t]*<p style=\{\{ color: colors\.mutedInk \}\} className=\"text-sm leading-relaxed text-center py-4\">"
    r"\{isEN \? 'Premium subscriptions on iPhone are coming soon\.' : 'Gli abbonamenti Premium su iPhone arrivano a breve\.'\}</p>\n"
)
need(len(native_note.findall(app)) == 1, "avviso 'Premium arriva a breve' non trovato")
iap_ui = r"""                  <>
                    <GoldButton full onClick={iapBuy}>
                      <span>
                        {iapStatus === 'buying' ? '...' : (<>{isEN ? 'Unlock' : 'Sblocca'}<span className="hidden min-[360px]:inline">{' Premium'}</span>{' · '}{iapOffer?.priceString || (isEN ? PREMIUM_PRICE.en : PREMIUM_PRICE.it)}{isEN ? '/month' : '/mese'}</>)}
                      </span><ArrowRight size={16} />
                    </GoldButton>
                    {iapStatus === 'error' && <p role="alert" style={{ color: colors.red }} className="text-xs text-center mt-2">{isEN ? 'Purchase not completed. Please try again in a moment.' : 'Acquisto non completato. Riprova tra poco.'}</p>}
                    {iapStatus === 'cancelled' && <p style={{ color: colors.mutedInk }} className="text-xs text-center mt-2">{isEN ? 'Purchase cancelled.' : 'Acquisto annullato.'}</p>}
                    {iapStatus === 'notfound' && <p style={{ color: colors.mutedInk }} className="text-xs text-center mt-2">{isEN ? 'No purchases to restore for this Apple Account.' : 'Nessun acquisto da ripristinare per questo Apple Account.'}</p>}
                    <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed text-center mt-3">
                      {isEN
                        ? `Monthly subscription, ${iapOffer?.priceString || PREMIUM_PRICE.en} per month. Payment is charged to your Apple Account at purchase confirmation. The subscription renews automatically every month unless you cancel it at least 24 hours before the end of the period. You can manage or cancel it any time in Settings > your name > Subscriptions. `
                        : `Abbonamento mensile, ${iapOffer?.priceString || PREMIUM_PRICE.it} al mese. Il pagamento viene addebitato sul tuo Apple Account alla conferma dell'acquisto. L'abbonamento si rinnova automaticamente ogni mese, salvo disdetta almeno 24 ore prima della fine del periodo. Puoi gestirlo o annullarlo in qualsiasi momento da Impostazioni > il tuo nome > Abbonamenti. `}
                    </p>
                    <p className="text-xs text-center mt-1.5">
                      <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" style={{ color: colors.mutedInk }} className="underline hover:opacity-70">{isEN ? 'Terms of Use (Apple EULA)' : 'Termini d\'uso (EULA Apple)'}</a>
                      <span style={{ color: colors.mutedInk }}>{' · '}</span>
                      <a href="/privacy.html" style={{ color: colors.mutedInk }} className="underline hover:opacity-70">{isEN ? 'Privacy Policy' : 'Informativa sulla Privacy'}</a>
                    </p>
                    <button type="button" onClick={iapRestore} disabled={iapStatus === 'restoring' || iapStatus === 'buying'} style={{ color: colors.ink }} className="os-focus w-full text-center text-xs font-semibold underline hover:opacity-70 mt-3 py-2">
                      {iapStatus === 'restoring' ? '...' : (isEN ? 'Restore purchases' : 'Ripristina acquisti')}
                    </button>
                  </>
"""
app = native_note.sub(lambda m: iap_ui, app, count=1)

# 4) Squadre: niente prezzi né link di pagamento nell'app iPhone
# 4a) tabella prezzi nella presentazione di Squadre
replace_once(
    '                    <div className="space-y-2.5 mb-6">\n',
    '                    {!IS_NATIVE && (\n                    <div className="space-y-2.5 mb-6">\n',
    'prezzi Squadre (inizio)',
)
replace_once(
    "in entrambi i casi'}</p>\n                    </div>\n                    <button onClick={() => { trackEvent('team_register_clicked')",
    "in entrambi i casi'}</p>\n                    </div>\n                    )}\n                    <button onClick={() => { trackEvent('team_register_clicked')",
    'prezzi Squadre (fine)',
)
# 4b) "Primo mese gratis" nella registrazione
wrap_native_hidden(
    '<p style={{ color: LED_TEAL }} className="text-xs font-semibold text-center mt-5 mb-3">{isEN ? \'First month free',
    '</p>',
    'primo mese gratis',
)
# 4c) dashboard con abbonamento non attivo
replace_once(
    '{isEN ? `Activate to keep using',
    "{IS_NATIVE ? (isEN ? 'This team has no active subscription.' : 'Questa squadra non ha un abbonamento attivo.') : isEN ? `Activate to keep using",
    'testo abbonamento non attivo',
)
wrap_native_hidden(
    "<a href={STRIPE_TEAM_SEASON_PAYMENT_LINK} target=\"_blank\" rel=\"noopener noreferrer\" onClick={() => trackEvent('team_season_pass_clicked')}",
    '</a>', 'link Pass Stagionale',
)
wrap_native_hidden(
    "<a href={STRIPE_TEAM_PAYMENT_LINK} target=\"_blank\" rel=\"noopener noreferrer\" onClick={() => trackEvent('team_subscribe_clicked')}",
    '</a>', 'link abbonamento mensile',
)
wrap_native_hidden(
    '<p style={{ color: \'rgba(255,255,255,0.6)\' }} className="relative text-[10.5px] text-center mt-2.5">',
    '</p>', 'nota pagamenti Stripe',
)
replace_once(
    "{isEN ? 'I already paid — refresh' : 'Ho già pagato — aggiorna'}",
    "{IS_NATIVE ? (isEN ? 'Refresh' : 'Aggiorna') : (isEN ? 'I already paid — refresh' : 'Ho già pagato — aggiorna')}",
    'pulsante aggiorna',
)
# 4d) mese di prova: niente prezzo né link
replace_once("left, then €50/month.", "left${IS_NATIVE ? '.' : ', then €50/month.'}", 'prova (EN)')
replace_once(", poi 50€/mese.`", "${IS_NATIVE ? '.' : ', poi 50€/mese.'}`", 'prova (IT)')
wrap_native_hidden(
    "<a href={STRIPE_TEAM_PAYMENT_LINK} target=\"_blank\" rel=\"noopener noreferrer\" onClick={() => trackEvent('team_subscribe_clicked_early')}",
    '</a>', 'link attiva ora',
)
wrap_native_hidden(
    "<a href={STRIPE_TEAM_SEASON_PAYMENT_LINK} target=\"_blank\" rel=\"noopener noreferrer\" onClick={() => trackEvent('team_season_pass_clicked_early')}",
    '</a>', 'link pass stagionale (prova)',
)

app_p.write_text(app)
print('OK: patch acquisti applicata a src/App.jsx.')
