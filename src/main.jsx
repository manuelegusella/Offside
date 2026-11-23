import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Caratteri inclusi nell'app (prima arrivavano da Google Fonts): si vedono giusti anche senza rete,
// la prima schermata non "salta" quando arrivano e nessuna richiesta parte verso Google.
import '@fontsource-variable/bricolage-grotesque/standard.css'
import '@fontsource-variable/public-sans/wght.css'
import '@fontsource/bebas-neue/400.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { IS_NATIVE } from './platform.js'
import { installGlobalErrorHandlers } from './errorReporting.js'
import { installStorageGuards, restoreBackupIfNeeded } from './storageBackup.js'
import { Analytics } from '@vercel/analytics/react'
import { IconContext } from '@phosphor-icons/react'

installGlobalErrorHandlers()

// Sito: dopo un nuovo rilascio i file vecchi (es. quelli dei grafici, caricati solo quando servono)
// non esistono più. Chi aveva la pagina aperta da prima la vede ricaricarsi da sola, una volta sola,
// invece di un errore.
window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem('offside_update_reload')) return
    sessionStorage.setItem('offside_update_reload', '1')
  } catch (err) { return }
  event.preventDefault()
  window.location.reload()
})

function start() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <IconContext.Provider value={{ weight: 'bold' }}>
          <App />
        </IconContext.Provider>
      </ErrorBoundary>
      <Analytics />
    </StrictMode>,
  )
  installStorageGuards()
}

// App iPhone: se iOS ha svuotato la memoria della WebView, i dati tornano dalla copia di
// sicurezza prima che l'app parta (vedi storageBackup.js). Sul sito parte subito.
if (IS_NATIVE) restoreBackupIfNeeded().finally(start)
else start()

// Registra il service worker per rendere l'app installabile (PWA).
// Non blocca né rallenta il caricamento: parte dopo che la pagina è pronta.
if ('serviceWorker' in navigator && !IS_NATIVE) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
