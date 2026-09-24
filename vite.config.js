import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
