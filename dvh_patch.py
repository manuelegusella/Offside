with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

old = '''html, body, #root {
  height: 100%;
  margin: 0;
}'''

new = '''html, body, #root {
  height: 100%;
  min-height: 100dvh;
  margin: 0;
  background: #101B26;
}'''

if old in content:
    content = content.replace(old, new)
    with open('src/index.css', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fatto! index.css aggiornato con supporto dvh.")
else:
    print("ATTENZIONE: non ho trovato il blocco atteso — mandami il contenuto di src/index.css e lo sistemiamo a mano.")
