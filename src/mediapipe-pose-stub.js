// Stub per il pacchetto "@mediapipe/pose", usato SOLO per far compilare il build.
//
// @tensorflow-models/pose-detection importa staticamente `{ Pose }` da "@mediapipe/pose" per
// il suo runtime opzionale "mediapipe" (usato solo dal modello BlazePose). Noi usiamo sempre e
// solo MoveNet col runtime di default "tfjs" (vedi MovementCameraOverlay in App.jsx): quel ramo
// di codice non viene mai eseguito. Il pacchetto reale, però, è pensato per essere caricato con
// un tag <script> globale (assegna `window.Pose`), non per essere importato come modulo ESM/CJS
// — quindi qualunque bundler ESM (Vite/Rollup/Rolldown) fallisce provando a risolvere quel
// nome staticamente, anche se non verrà mai chiamato davvero.
// Questo stub soddisfa il bundler con un binding fittizio, senza cambiare alcun comportamento
// a runtime (vedi alias in vite.config.js).
export const Pose = undefined;
