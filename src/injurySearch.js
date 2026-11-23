// src/injurySearch.js
// Ricerca degli infortuni per nome: "caviglia", "menisco", "strappo", "pubalgia", "flessori"…
// Oltre al nome e alla zona di ogni infortunio, ci sono i modi in cui le persone li chiamano
// davvero (parole comuni, non diagnosi). Le parole valgono in italiano e in inglese.

// Parole comuni per ogni infortunio (chiavi uguali a injuriesData in App.jsx).
export const INJURY_KEYWORDS = {
  ankle: 'caviglia storta slogatura distorsione legamenti piede girato storta rolled twisted ankle sprain ligament',
  achilles: 'tendine achille tallone tendinite achillea heel tendon tendinitis',
  achilles_rupture: 'rottura tendine achille tallone rupture torn heel tendon',
  knee: 'rotula ginocchio dolore davanti femoro rotuleo kneecap patella front knee runners knee',
  mcl: 'collaterale mediale legamento interno ginocchio distorsione ginocchio medial inner knee ligament sprain',
  patellar: 'tendine rotuleo ginocchio del saltatore tendinite rotulea jumpers knee patellar tendon',
  meniscus: 'menisco cartilagine ginocchio torsione blocco ginocchio bloccato meniscus cartilage twist locking',
  itband: 'bandelletta ileotibiale tensore fascia lata ginocchio del corridore esterno ginocchio iliotibial outer knee runners knee',
  osgood: 'osgood schlatter crescita ragazzi adolescenti sotto il ginocchio growth teen kids',
  hamstring: 'flessori bicipite femorale semitendinoso strappo stiramento posteriore coscia retro coscia hamstring pull tear back thigh',
  quad: 'quadricipite retto femorale strappo stiramento anteriore coscia quadriceps pull front thigh',
  contusion: 'botta ematoma livido ginocchiata coscia morta contusione dead leg bruise knock',
  calf: 'polpaccio gemello soleo strappo stiramento calf pull gastrocnemius soleus',
  shinsplints: 'tibia stinco periostite stress tibiale shin splints mtss',
  plantarfasciitis: 'fascite plantare tallone pianta del piede arco plantare heel arch sole foot',
  groin: 'pubalgia inguine adduttori pube groin adductor pubalgia',
  hipflexor: 'ileopsoas psoas flessore anca inguine tiro hip flexor iliopsoas kicking',
  piriformis: 'piriforme gluteo natica sedere glute buttock',
  trochanteric: 'borsite trocanterica trocantere fianco anca esterna bursitis outer hip',
  lcl: 'collaterale laterale legamento esterno ginocchio distorsione lateral outer knee ligament sprain',
  cramps: 'crampo crampi muscoli cramp cramps',
  blisters: 'vescica vesciche bolle scarpini piedi blister blisters boots',
  lowback: 'schiena mal di schiena lombare lombalgia colpo della strega back pain lumbar lower back',
  shoulder_impingement: 'spalla conflitto impingement portiere rinvio shoulder goalkeeper throw',
  ac_joint: 'acromion clavicola spalla acromioclaveare caduta spalla collarbone clavicle shoulder separation',
  bicep_tendinopathy: 'bicipite braccio tendinite biceps arm',
  wrist_sprain: 'polso distorsione polso slogatura caduta mano wrist sprain',
  finger_jam: 'dito dita dito incastrato pallonata finger jammed',
  thumb_sprain: 'pollice distorsione pollice thumb sprain',
};

// Minuscole, senza accenti né apostrofi: "Achille", "achillé" e "d'Achille" diventano uguali.
export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Elenco ordinato delle chiavi che corrispondono alla ricerca.
// Ogni parola scritta deve trovarsi (anche solo all'inizio di una parola) nel nome, nella zona
// o nelle parole comuni. Conta di più il nome, poi le parole comuni, la descrizione e la zona.
export function searchInjuries(query, { injuriesData, regions, regionLabels, limit = 8 }) {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length || words.join('').length < 2) return [];
  const results = [];
  let order = 0;
  for (const [regionKey, region] of Object.entries(regions || {})) {
    for (const key of region.injuries || []) {
      const data = injuriesData[key];
      if (!data) continue;
      order += 1;
      const label = normalize(data.label);
      const subtitle = normalize(data.subtitle);
      const zone = normalize(regionLabels[regionKey] || '');
      const extra = normalize(INJURY_KEYWORDS[key] || '');
      const fields = [[label, 6], [extra, 4], [subtitle, 3], [zone, 2]];
      let score = 0;
      let allFound = true;
      for (const w of words) {
        // Singolare/plurale: "legamento" trova anche "legamenti", "strappi" trova "strappo".
        const stem = w.length >= 5 ? w.slice(0, -1) : null;
        let best = 0;
        for (const [text, weight] of fields) {
          if (!text) continue;
          const tokens = text.split(' ');
          if (tokens.some((t) => t === w)) best = Math.max(best, weight + 1);
          else if (tokens.some((t) => t.startsWith(w))) best = Math.max(best, weight);
          else if (stem && tokens.some((t) => t.startsWith(stem))) best = Math.max(best, weight - 2);
          else if (w.length >= 4 && text.includes(w)) best = Math.max(best, weight - 2);
        }
        if (!best) { allFound = false; break; }
        score += best;
      }
      if (allFound) results.push({ key, region: regionKey, score, order });
    }
  }
  results.sort((a, b) => b.score - a.score || a.order - b.order);
  return results.slice(0, limit);
}
