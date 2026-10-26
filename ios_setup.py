#!/usr/bin/env python3
"""Prepara l'app iOS di Offside (Capacitor 8) in un colpo solo.

Uso, dalla cartella principale del progetto (quella con package.json):
    python3 ios_setup.py

Cosa fa, in ordine (si può rilanciare senza danni):
  1. installa le dipendenze e i plugin Capacitor
  2. applica ios_patch.py a src/App.jsx e src/main.jsx (se non già fatto)
  3. costruisce il sito (npm run build)
  4. crea il progetto iOS nella cartella ios/ (solo la prima volta)
  5. genera icona e schermata di avvio dalle immagini del pacchetto
  6. scrive in Info.plist il testo del permesso fotocamera e "nessuna crittografia speciale"
  7. imposta il tuo Team Apple nel progetto Xcode
  8. sincronizza tutto con Xcode (npx cap sync ios)
Se qualcosa non torna si ferma con un messaggio chiaro."""
import pathlib
import plistlib
import re
import shutil
import subprocess
import sys

TEAM_ID = 'CJL92KVK8S'  # il tuo Team ID Apple (lo vedi in developer.apple.com → Account → Membership)
BUNDLE_ID = 'com.myoffside.app'
CAMERA_TEXT = (
    "Offside usa la fotocamera per analizzare i tuoi movimenti durante lo screening. "
    "Il video resta sul telefono e non viene registrato. / "
    "Offside uses the camera to analyse your movement during screening. "
    "The video stays on your phone and is never recorded."
)

ROOT = pathlib.Path.cwd()


def stop(msg):
    print('\nERRORE: ' + msg)
    sys.exit(1)


def run(*cmd):
    print('\n$ ' + ' '.join(cmd), flush=True)
    if subprocess.run(cmd, cwd=ROOT).returncode != 0:
        stop('il comando qui sopra è fallito. Copia il testo rosso/errore e mandalo a Claude.')


# 0) controlli di base
for f in ('package.json', 'src/App.jsx', 'src/main.jsx', 'src/platform.js', 'capacitor.config.json',
          'ios_patch.py', 'public/icon-1024-appstore.png', 'assets/splash.png', 'assets/splash-dark.png'):
    if not (ROOT / f).exists():
        stop(f"manca {f}. Sei nella cartella giusta del progetto? Hai copiato tutti i file del pacchetto?")
if not shutil.which('node') or not shutil.which('npm'):
    stop('Node.js non è installato: scaricalo da https://nodejs.org (versione 22 o più recente).')

# 1) dipendenze
run('npm', 'install')
run('npm', 'install', '@capacitor/core@^8', '@capacitor/ios@^8', '@capacitor/splash-screen@^8',
    '@capacitor/status-bar@^8')
run('npm', 'install', '-D', '@capacitor/cli@^8', '@capacitor/assets@^3')

# 2) modifiche al codice per la versione iOS
if "from './platform.js'" in (ROOT / 'src/App.jsx').read_text():
    print('\nPatch del codice già applicata: salto.')
else:
    run('python3', 'ios_patch.py')

# 3) build del sito
run('npm', 'run', 'build')

# 4) progetto iOS
if (ROOT / 'ios' / 'App').exists():
    print('\nCartella ios già presente: salto "cap add".')
else:
    run('npx', 'cap', 'add', 'ios')

# 5) icona e schermata di avvio
shutil.copyfile(ROOT / 'public/icon-1024-appstore.png', ROOT / 'assets/icon-only.png')
run('npx', '@capacitor/assets', 'generate', '--ios')

# 6) Info.plist
plist_p = ROOT / 'ios/App/App/Info.plist'
if not plist_p.exists():
    stop('non trovo ios/App/App/Info.plist: "npx cap add ios" non ha creato il progetto.')
with plist_p.open('rb') as fh:
    plist = plistlib.load(fh)
plist['NSCameraUsageDescription'] = CAMERA_TEXT
plist['ITSAppUsesNonExemptEncryption'] = False
plist['CFBundleDisplayName'] = 'Offside'
with plist_p.open('wb') as fh:
    plistlib.dump(plist, fh)
print('\nInfo.plist aggiornato (permesso fotocamera, crittografia).')

# 7) Team Apple nel progetto Xcode
pbx_p = ROOT / 'ios/App/App.xcodeproj/project.pbxproj'
pbx = pbx_p.read_text()
if f'DEVELOPMENT_TEAM = {TEAM_ID};' in pbx:
    print('Team Apple già impostato.')
else:
    pbx, n = re.subn(r'(\n(\t+)PRODUCT_BUNDLE_IDENTIFIER = ' + re.escape(BUNDLE_ID) + r';)',
                     lambda m: m.group(1) + '\n' + m.group(2) + f'DEVELOPMENT_TEAM = {TEAM_ID};', pbx)
    if n < 2:
        print(f'ATTENZIONE: Team Apple non impostato automaticamente ({n} punti trovati). '
              'Lo sceglierai a mano in Xcode (Signing & Capabilities).')
    else:
        pbx_p.write_text(pbx)
        print(f'Team Apple {TEAM_ID} impostato in {n} punti.')

# 8) sincronizza
run('npx', 'cap', 'sync', 'ios')

print('\n' + '=' * 60)
print('FATTO. Ora apri Xcode con:   npx cap open ios')
print('=' * 60)
