#!/usr/bin/env python3
"""Aggiunge gli acquisti in-app (RevenueCat) all'app iPhone di Offside.

Uso, dalla cartella principale del progetto (quella con package.json):
    python3 iap_setup.py appl_LA_TUA_CHIAVE_REVENUECAT

La chiave è quella PUBBLICA dell'app iOS che trovi su RevenueCat (inizia con "appl_").
Si può rilanciare senza danni. Cosa fa:
  1. scrive la chiave in src/purchases.js
  2. installa il plugin RevenueCat
  3. applica iap_patch.py a src/App.jsx (se non già fatto)
  4. costruisce il sito e sincronizza il progetto iOS
  5. alza il numero di Build (1 -> 2) per poter caricare una nuova versione su TestFlight"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path.cwd()


def stop(msg):
    print('\nERRORE: ' + msg)
    sys.exit(1)


def run(*cmd):
    print('\n$ ' + ' '.join(cmd), flush=True)
    if subprocess.run(cmd, cwd=ROOT).returncode != 0:
        stop('il comando qui sopra è fallito. Copia il testo dell\'errore e mandalo a Claude.')


key = sys.argv[1].strip() if len(sys.argv) > 1 else ''
if not re.fullmatch(r'appl_[A-Za-z0-9]{10,}', key):
    stop('manca la chiave RevenueCat, oppure non è quella giusta.\n'
         'Uso: python3 iap_setup.py appl_xxxxxxxxxxxx\n'
         '(la chiave pubblica dell\'app iOS: su RevenueCat → il tuo progetto → API keys; inizia con appl_)')

for f in ('package.json', 'src/App.jsx', 'src/platform.js', 'src/purchases.js', 'iap_patch.py', 'ios/App/App.xcodeproj/project.pbxproj'):
    if not (ROOT / f).exists():
        stop(f'manca {f}. Sei nella cartella giusta? Hai già eseguito ios_setup.py e copiato i file di questo pacchetto?')

# 1) chiave
pj = ROOT / 'src/purchases.js'
txt = pj.read_text()
new, n = re.subn(r"const RC_API_KEY_IOS = '[^']*';", f"const RC_API_KEY_IOS = '{key}';", txt)
if n != 1:
    stop('non trovo la riga della chiave in src/purchases.js')
pj.write_text(new)
print('Chiave RevenueCat scritta in src/purchases.js.')

# 2) plugin
run('npm', 'install', '@revenuecat/purchases-capacitor@^13')

# 3) patch del codice
if "from './purchases.js'" in (ROOT / 'src/App.jsx').read_text():
    print('\nPatch acquisti già applicata: salto.')
else:
    run('python3', 'iap_patch.py')

# 4) build e sync
run('npm', 'run', 'build')
run('npx', 'cap', 'sync', 'ios')

# 5) numero di build
pbx_p = ROOT / 'ios/App/App.xcodeproj/project.pbxproj'
pbx = pbx_p.read_text()
builds = set(re.findall(r'CURRENT_PROJECT_VERSION = (\d+);', pbx))
if builds == {'1'}:
    pbx = pbx.replace('CURRENT_PROJECT_VERSION = 1;', 'CURRENT_PROJECT_VERSION = 2;')
    pbx_p.write_text(pbx)
    print('\nNumero di Build alzato a 2.')
else:
    print(f'\nNumero di Build attuale: {", ".join(sorted(builds))}. Ricorda: ogni caricamento su TestFlight ne vuole uno più alto.')

print('\n' + '=' * 60)
print('FATTO. Ora apri Xcode con:   npx cap open ios')
print('=' * 60)
