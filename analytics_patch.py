import re

with open('src/main.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

changed = False

# 1. Aggiungi l'import se manca
if "@vercel/analytics/react" not in content:
    import_line = "import { Analytics } from '@vercel/analytics/react'\n"
    if "import App from './App.jsx'" in content:
        content = content.replace(
            "import App from './App.jsx'",
            "import App from './App.jsx'\n" + import_line.rstrip('\n'),
            1
        )
        changed = True
    else:
        print("ATTENZIONE: non trovo 'import App from './App.jsx'' — incolla qui sotto il contenuto del tuo main.jsx così lo sistemiamo a mano.")

# 2. Aggiungi <Analytics /> subito dopo <App />
if "<Analytics />" not in content:
    if re.search(r"<App\s*/>", content):
        content = re.sub(r"(<App\s*/>)", r"\1\n    <Analytics />", content, count=1)
        changed = True
    else:
        print("ATTENZIONE: non trovo '<App />' nel file — potrebbe essere scritto diversamente. Mandami il contenuto di main.jsx.")

if changed:
    with open('src/main.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fatto! Ecco il contenuto aggiornato di main.jsx:\n")
    print(content)
else:
    print("Sembra che Analytics fosse già collegato, o non ho trovato i punti di aggancio attesi. Contenuto attuale:\n")
    print(content)
