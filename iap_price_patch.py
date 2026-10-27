#!/usr/bin/env python3
"""Prezzo dell'abbonamento nell'app iPhone: ora segue quello impostato su App Store Connect.

Uso, dalla cartella del progetto (quella con package.json):  python3 iap_price_patch.py

Cosa cambia, solo nell'app iPhone (il sito resta a 3,99 €):
  - il prezzo grande nella scheda Premium mostra il prezzo vero che arriva da Apple
  - se Apple non risponde, come riserva compare 4,99 € (prima compariva 3,99 €)
  - lo stesso per il pulsante "Sblocca Premium" e per il testo sul rinnovo
Se un pezzo di codice non è nel punto atteso si ferma SENZA toccare nulla. Si può rilanciare senza danni."""
import pathlib
import sys

app_p = pathlib.Path('src/App.jsx')
app = app_p.read_text()


def need(cond, msg):
    if not cond:
        sys.exit('ERRORE: ' + msg + '. Non ho modificato nulla.')


need("from './purchases.js'" in app, "manca la patch acquisti (iap_patch.py): lanciala prima")
if 'NATIVE_PRICE' in app:
    print('Patch prezzo già applicata, niente da fare.')
    sys.exit(0)

# 1) prezzo di riserva dell'app iPhone
old = "const PREMIUM_PRICE = { it: '3,99 €', en: '€3.99' };\n"
need(app.count(old) == 1, 'costante PREMIUM_PRICE non trovata (o trovata più volte)')
app = app.replace(old, old + "// Prezzo di riserva dell'app iPhone: quello vero arriva da Apple (App Store Connect).\n"
                  "const NATIVE_PRICE = { it: '4,99 €', en: '€4.99' };\n")

# 2) prezzo grande nella scheda Premium
old = """className="text-[48px] leading-none">{isEN ? PREMIUM_PRICE.en : PREMIUM_PRICE.it}</span>"""
new = """className="text-[48px] leading-none">{IS_NATIVE ? (iapOffer?.priceString || (isEN ? NATIVE_PRICE.en : NATIVE_PRICE.it)) : (isEN ? PREMIUM_PRICE.en : PREMIUM_PRICE.it)}</span>"""
need(app.count(old) == 1, 'prezzo grande della scheda Premium non trovato (o trovato più volte)')
app = app.replace(old, new)

# 3) riserve nel pulsante e nel testo sul rinnovo
for old, new in (
    ("iapOffer?.priceString || (isEN ? PREMIUM_PRICE.en : PREMIUM_PRICE.it)", "iapOffer?.priceString || (isEN ? NATIVE_PRICE.en : NATIVE_PRICE.it)"),
    ("iapOffer?.priceString || PREMIUM_PRICE.en", "iapOffer?.priceString || NATIVE_PRICE.en"),
    ("iapOffer?.priceString || PREMIUM_PRICE.it", "iapOffer?.priceString || NATIVE_PRICE.it"),
):
    need(app.count(old) >= 1, f"riserva del prezzo non trovata: {old}")
    app = app.replace(old, new)

app_p.write_text(app)
print('Patch prezzo applicata a src/App.jsx.')
