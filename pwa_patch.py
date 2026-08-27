with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_tags = '''    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#1B6FC9" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Offside" />
    <link rel="apple-touch-icon" href="/icon.svg" />
'''

if 'rel="manifest"' in content:
    print("Il manifest risulta già collegato — non ho aggiunto nulla per evitare doppioni.")
else:
    content = content.replace('</head>', new_tags + '  </head>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fatto! Righe aggiunte con successo prima di </head>.")

print("\n--- Questo è il contenuto attuale di index.html ---\n")
print(content)
