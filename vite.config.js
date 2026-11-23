import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Icone più leggere. Ogni icona Phosphor contiene 6 stili (bold, duotone, fill, light, regular,
// thin), ma l'app ne usa solo 2: "bold" (impostato per tutte in main.jsx) e "fill". Al momento
// della build qui si tolgono gli altri 4 da ogni icona: stesso aspetto, circa 150 KB in meno.
// Se un giorno serve un altro stile (es. weight="duotone"), aggiungilo a KEEP_WEIGHTS.
const KEEP_WEIGHTS = new Set(['bold', 'fill'])

// Trova la fine di un blocco [..], (..) o {..} che inizia in `start`, saltando le stringhe.
function blockEnd(code, start) {
  const pairs = { '[': ']', '(': ')', '{': '}' }
  const stack = []
  for (let i = start; i < code.length; i++) {
    const ch = code[i]
    if (ch === '"' || ch === "'" || ch === '`') {
      for (i++; i < code.length && code[i] !== ch; i++) if (code[i] === '\\') i++
      continue
    }
    if (ch === '/' && code[i + 1] === '*') { i = code.indexOf('*/', i + 2) + 1; continue }
    if (pairs[ch]) stack.push(pairs[ch])
    else if (ch === ']' || ch === ')' || ch === '}') {
      if (stack.pop() !== ch) return -1
      if (!stack.length) return i
    }
  }
  return -1
}

function phosphorWeightsPlugin() {
  return {
    name: 'offside-phosphor-weights',
    apply: 'build',
    transform(code, id) {
      if (!/@phosphor-icons[\\/]react[\\/]dist[\\/]defs[\\/][^\\/]+\.es\.js$/.test(id)) return null
      const mapStart = code.indexOf('new Map([')
      if (mapStart < 0) return null
      const listStart = mapStart + 'new Map('.length
      const listEnd = blockEnd(code, listStart)
      if (listEnd < 0) return null
      const entries = []
      for (let i = listStart + 1; i < listEnd; i++) {
        if (code[i] !== '[') continue
        const end = blockEnd(code, i)
        if (end < 0) return null
        const entry = code.slice(i, end + 1)
        const name = (entry.match(/^\[\s*"([a-z]+)"/) || [])[1]
        if (!name) return null
        entries.push({ name, entry })
        i = end
      }
      const kept = entries.filter((e) => KEEP_WEIGHTS.has(e.name))
      // Formato inatteso (es. nuova versione della libreria): meglio non toccare nulla.
      if (entries.length < 2 || kept.length !== KEEP_WEIGHTS.size) return null
      return { code: code.slice(0, listStart) + '[\n  ' + kept.map((e) => e.entry).join(',\n  ') + '\n]' + code.slice(listEnd + 1), map: null }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), phosphorWeightsPlugin()],
  // Data della build: finisce nei rapporti d'errore, per sapere da quale versione arrivano.
  define: {
    __APP_BUILD__: JSON.stringify(`web ${new Date().toISOString().slice(0, 16)}`),
  },
  resolve: {
    alias: {
      // Vedi src/mediapipe-pose-stub.js: @tensorflow-models/pose-detection importa
      // staticamente { Pose } da "@mediapipe/pose" per un runtime opzionale che non usiamo
      // mai (usiamo solo MoveNet). Il pacchetto reale non è un modulo ESM/CJS importabile,
      // quindi il build fallirebbe senza questo alias a uno stub innocuo.
      '@mediapipe/pose': fileURLToPath(new URL('./src/mediapipe-pose-stub.js', import.meta.url)),
    },
  },
})
