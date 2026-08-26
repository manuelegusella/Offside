with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_load = """        const result = await window.storage.get(STORAGE_KEY, false);
        if (result && result.value) {
          const data = JSON.parse(result.value);"""

new_load = """        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);"""

old_persist = """  const persist = useCallback(async (next) => {
    try {
      const result = await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
      setSaveError(!result);
    } catch (err) {
      setSaveError(true);
    }
  }, []);"""

new_persist = """  const persist = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (err) {
      setSaveError(true);
    }
  }, []);"""

ok1 = old_load in content
ok2 = old_persist in content

if ok1:
    content = content.replace(old_load, new_load, 1)
if ok2:
    content = content.replace(old_persist, new_persist, 1)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Blocco caricamento dati trovato e corretto:", ok1)
print("Blocco salvataggio dati trovato e corretto:", ok2)
if ok1 and ok2:
    print("\nFatto! Il file ora usa localStorage invece di window.storage.")
else:
    print("\nATTENZIONE: uno dei due blocchi non è stato trovato esattamente com'era atteso.")
    print("Manda a Claude questo output così controlliamo insieme.")
