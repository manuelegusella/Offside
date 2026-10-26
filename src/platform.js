// src/platform.js
// Distingue il sito/PWA dall'app nativa iOS (Capacitor) e costruisce gli indirizzi dell'API.
// Nell'app nativa la pagina gira da capacitor://localhost, quindi "/api/..." da solo non
// arriverebbe al server: va puntato al sito di produzione. Con CapacitorHttp attivo
// (vedi capacitor.config.json) le chiamate partono dal sistema, senza problemi di CORS.

export const IS_NATIVE = typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

// Se un giorno cambi dominio di produzione, cambia solo questa riga.
const API_ORIGIN = 'https://offside-pearl.vercel.app';

export const apiUrl = (path) => (IS_NATIVE ? `${API_ORIGIN}${path}` : path);
