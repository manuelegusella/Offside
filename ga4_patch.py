with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

ga_tag = '''    <script async src="https://www.googletagmanager.com/gtag/js?id=G-SJ728X80V0"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-SJ728X80V0');
    </script>
'''

if 'googletagmanager.com/gtag' in content:
    print("Il tag Google risulta già presente — non ho aggiunto nulla per evitare doppioni.")
else:
    content = content.replace('</head>', ga_tag + '  </head>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fatto! Tag Google Analytics aggiunto prima di </head>.")

print("\n--- Contenuto attuale di index.html ---\n")
print(content)
