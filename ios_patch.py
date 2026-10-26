"""Applica a src/App.jsx e src/main.jsx le modifiche minime per l'app iOS (Capacitor).
Uso, dalla cartella del progetto:  python3 ios_patch.py
Se un pezzo di codice non è nel punto atteso si ferma SENZA toccare nulla."""
import pathlib
import re
import sys

app_p, main_p = pathlib.Path('src/App.jsx'), pathlib.Path('src/main.jsx')
app, main = app_p.read_text(), main_p.read_text()


def need(cond, msg):
    if not cond:
        sys.exit('ERRORE: ' + msg + '. Non ho modificato nulla.')


if "from './platform.js'" in app:
    sys.exit('Patch già applicata, niente da fare.')

# 1) import in App.jsx
imp_anchor = "import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';\n"
need(app.count(imp_anchor) == 1, "riga di import di recharts non trovata")
app = app.replace(imp_anchor, imp_anchor + "import { IS_NATIVE, apiUrl } from './platform.js';\n")

# 2) tutte le chiamate fetch('/api/...') passano da apiUrl
app, n = re.subn(r"fetch\('(/api/[a-z-]+)'", r"fetch(apiUrl('\1')", app)
need(n == 7, f"mi aspettavo 7 chiamate a /api, ne ho trovate {n}")

# 3) Premium individuale: nell'app iOS niente link a Stripe (Apple vuole gli acquisti in-app)
start = "                <GoldButton full href={STRIPE_PAYMENT_LINK} onClick={() => trackEvent('premium_unlock_clicked')}>"
end = "                </p>\n                <div className=\"text-center mt-3\">{renderRestoreBox()}</div>"
need(app.count(start) == 1, "bottone Premium non trovato")
need(app.count(end) == 1, "fine del blocco Premium non trovata")
native_note = (
    "                {IS_NATIVE ? (\n"
    "                  <p style={{ color: colors.mutedInk }} className=\"text-sm leading-relaxed text-center py-4\">"
    "{isEN ? 'Premium subscriptions on iPhone are coming soon.' : 'Gli abbonamenti Premium su iPhone arrivano a breve.'}</p>\n"
    "                ) : (<>\n"
)
app = app.replace(start, native_note + start)
app = app.replace(end, "                </p>\n                </>)}\n                <div className=\"text-center mt-3\">{renderRestoreBox()}</div>")

# 4) service worker: non serve (e non è supportato) dentro l'app nativa
need("if ('serviceWorker' in navigator) {" in main, "registrazione del service worker non trovata")
main = main.replace("if ('serviceWorker' in navigator) {", "if ('serviceWorker' in navigator && !IS_NATIVE) {")
main = main.replace("import App from './App.jsx'\n", "import App from './App.jsx'\nimport { IS_NATIVE } from './platform.js'\n", 1)
need("from './platform.js'" in main, "import in main.jsx non inserito")

app_p.write_text(app)
main_p.write_text(main)
print('OK: patch applicata (App.jsx e main.jsx).')
