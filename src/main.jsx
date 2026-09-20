import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Analytics } from '@vercel/analytics/react'
import { IconContext } from '@phosphor-icons/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IconContext.Provider value={{ weight: 'bold' }}>
      <App />
    </IconContext.Provider>
    <Analytics />
  </StrictMode>,
)

// Registra il service worker per rendere l'app installabile (PWA).
// Non blocca né rallenta il caricamento: parte dopo che la pagina è pronta.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
