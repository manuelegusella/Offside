// src/premiumPlan.js
// Il Premium del percorso di recupero: regole e testi, senza grafica.
//   1. quali fasi sono gratis e quali no (i percorsi già avviati prima dell'aggiornamento restano gratis);
//   2. il "semaforo del dolore" e come cambia il piano di oggi;
//   3. i "livelli" di ogni esercizio: più facile, più difficile, cosa fare se fa male.
//
// Importante: le soglie del semaforo (0-3 verde, 4-5 giallo, 6 o più rosso) sono una regola pratica scelta da
// Offside in modo prudente. Non sono un test clinico e non vengono da uno studio. Lo studio citato nelle
// fonti (Silbernagel 2007) dice solo che regolare il carico in base al dolore, nel tendine d'Achille, non ha
// dato effetti negativi. I testi dei livelli sono principi generali di progressione (una cosa alla volta,
// più o meno carico, più o meno difficoltà), non prescrizioni per un infortunio specifico.

// ---------------------------------------------------------------------------------------
// 1. Fasi gratis e fasi Premium
// ---------------------------------------------------------------------------------------

// Le prime due fasi di ogni infortunio sono gratis. Dalla terza serve Premium.
export const FREE_PHASES = 2;

// Chi aveva già un percorso in corso prima dell'aggiornamento lo finisce gratis.
// "Avviato" = infortunio aperto, con una data, con un esercizio o un criterio spuntato, o con un diario.
// Le chiavi di fase hanno la forma "<infortunio>-<numero fase>" (gli infortuni non contengono trattini).
export function deriveLegacyInjuries(loaded) {
  const keys = new Set();
  const add = (k) => { if (typeof k === 'string' && k) keys.add(k); };
  const fromPhaseKey = (pk) => pk.slice(0, pk.lastIndexOf('-'));
  const hasTrue = (obj) => !!obj && typeof obj === 'object' && Object.values(obj).some(Boolean);
  if (!loaded || typeof loaded !== 'object') return [];
  add(loaded.selectedInjury);
  Object.keys(loaded.injuryDates || {}).forEach(add);
  Object.keys(loaded.dailyLog || {}).forEach(add);
  Object.entries(loaded.progress || {}).forEach(([pk, v]) => { if (hasTrue(v) && pk.includes('-')) add(fromPhaseKey(pk)); });
  Object.entries(loaded.criteriaChecked || {}).forEach(([pk, v]) => { if (hasTrue(v) && pk.includes('-')) add(fromPhaseKey(pk)); });
  return [...keys];
}

// ---------------------------------------------------------------------------------------
// 2. Semaforo del dolore
// ---------------------------------------------------------------------------------------

// Zona di un valore di dolore 0-10 (serve anche per colorare la scala).
export function painZone(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  if (n >= 6) return 'red';
  if (n >= 4) return 'yellow';
  return 'green';
}

// Il semaforo di oggi, dalla voce del diario: { pain: 0-10, flags: { swelling, giving, worse } }.
//   rosso:  dolore 6 o più, gonfiore in aumento, la zona cede
//   giallo: dolore 4-5, oppure "peggio di ieri / dopo l'ultima sessione"
//   verde:  dolore 0-3 e nessun segnale
// Senza nessuna risposta non c'è semaforo (null).
export function painLight(entry) {
  if (!entry) return null;
  const pain = typeof entry.pain === 'number' ? entry.pain : null;
  const flags = entry.flags || {};
  if (pain === null && !flags.swelling && !flags.giving && !flags.worse) return null;
  if ((pain !== null && pain >= 6) || flags.swelling || flags.giving) return 'red';
  if ((pain !== null && pain >= 4) || flags.worse) return 'yellow';
  return 'green';
}

export const LIGHT_COPY = {
  it: {
    green: {
      chip: 'Via libera',
      title: 'Sessione completa',
      lines: [
        'Dolore basso e nessun segnale d\'allarme: fai la sessione come da programma.',
        'Se per 2-3 sessioni resta così e il giorno dopo non peggiora, puoi salire di livello. Cambia una cosa sola alla volta.',
      ],
    },
    yellow: {
      chip: 'Fastidio',
      title: 'Sessione ridotta',
      lines: [
        'Dimezza serie e ripetizioni e usa la versione più facile di rinforzo, equilibrio e tenute.',
        'Niente corsa, salti e cambi di direzione oggi.',
        'Controlla domattina: se il dolore è peggiore di oggi, domani niente carico.',
      ],
    },
    red: {
      chip: 'Stop',
      title: 'Oggi niente carico',
      lines: [
        'Dolore alto o segnali che non vanno ignorati: oggi solo scarico e riposo.',
        'Se il gonfiore aumenta, la zona cede o il dolore non cala nei prossimi giorni, fai valutare la zona da un medico o da un fisioterapista.',
      ],
    },
  },
  en: {
    green: {
      chip: 'Go',
      title: 'Full session',
      lines: [
        'Low pain and no warning signs: do the session as planned.',
        'If it stays like this for 2-3 sessions and the next day is no worse, you can move up a level. Change one thing at a time.',
      ],
    },
    yellow: {
      chip: 'Niggle',
      title: 'Lighter session',
      lines: [
        'Halve sets and reps and use the easier version of strength, balance and holds.',
        'No running, jumping or changes of direction today.',
        'Check tomorrow morning: if the pain is worse than today, take tomorrow off from loading.',
      ],
    },
    red: {
      chip: 'Stop',
      title: 'No loading today',
      lines: [
        'High pain or signs that should not be ignored: today only offloading and rest.',
        'If swelling increases, the area gives way or the pain does not ease in the next few days, have it checked by a doctor or a physiotherapist.',
      ],
    },
  },
};

export const FLAG_COPY = {
  it: {
    swelling: 'Il gonfiore è aumentato',
    giving: 'La zona cede o è instabile',
    worse: 'Peggio di ieri o dopo l\'ultima sessione',
  },
  en: {
    swelling: 'Swelling has increased',
    giving: 'The area gives way or feels unstable',
    worse: 'Worse than yesterday or after the last session',
  },
};

// Cosa fare oggi con un esercizio, in base al semaforo e al tipo di esercizio.
//   'ok'     = come da programma
//   'easier' = versione più facile (e metà volume)
//   'skip'   = oggi si salta
// Gli esercizi di scarico ("rest": elevazione, camminare nei limiti del dolore, ghiaccio...) restano sempre.
// Con il giallo si saltano corsa, salti, cambi di direzione, scatti e test; il resto passa alla versione più
// facile. Con il rosso tutto il carico si salta.
export function todayMode(light, cat, text) {
  if (!light || light === 'green') return 'ok';
  if (cat === 'rest') return 'ok';
  if (light === 'red') return 'skip';
  return skipOnYellow(text, cat) ? 'skip' : 'easier';
}

export function planCounts(light, exercises) {
  const out = { ok: 0, easier: 0, skip: 0 };
  (exercises || []).forEach((ex) => { out[todayMode(light, ex.cat, ex.text)] += 1; });
  return out;
}

export const MODE_COPY = {
  it: { easier: 'Oggi: versione più facile', skip: 'Oggi: salta' },
  en: { easier: 'Today: easier version', skip: 'Today: skip' },
};

// ---------------------------------------------------------------------------------------
// 3. Livelli degli esercizi
// ---------------------------------------------------------------------------------------

// Gli esercizi che non sono davvero "un esercizio" (consigli, test, criteri per tornare, contatti di gioco,
// automassaggi) non hanno livelli: dire "rendilo più difficile" non avrebbe senso.
// Le espressioni riconoscono sia il testo italiano sia quello inglese (i due elenchi non hanno le stesse voci).
const NO_LEVELS = new RegExp('\\b(' + [
  // italiano
  'solo se', 'solo dopo', 'test (di|del|della|dei)', 'conta quant\\w+', 'parlane', 'comunica', 'monitora', 'monitorando',
  'valuta', 'sostituisc\\w*', 'idrat\\w*', 'reintegra', 'osserva', 'usa una', 'usa un', 'torna agli', 'ritorno agli',
  'allenamento completo', 'contatti? leggeri', 'contatto', 'contrasti?', 'massagg\\w*', 'foam roller', 'rullo', 'anche dopo',
  'alterna superfici', 'per verificare',
  // inglese
  'only if', 'only after', 'count how', 'talk to', 'tell your', 'monitoring', 'monitor', 'assess', 'replace', 'hydrat\\w*',
  'observe', 'use a', 'go back to', 'return to full', 'full training', 'contact', 'tackles?', 'massage', 'foam roll\\w*',
  'roller', 'keep up', 'roll a', 'alternate soft', 'to verify', 'to check',
].join('|') + ')\\b', 'i');

// Cose da NON fare nei giorni "gialli": corsa, salti, cambi di direzione, scatti, test.
const IMPACT = /\bjump|\bhop(s|ping)?\b|plyometric|bounding|\bsalt|pliometr|change[s]? of direction|changes? direction|cambi\w* di direzione|slalom|agilit|agility|zig-?zag|sprint|scatt|accelerat|decelerat|accelerazion|decelerazion|changes? of pace|cambi di ritmo|\bjog|\brun(ning)?\b|\bcorri\b|\bcorsa\b(?!\s+(parziale|ridotta|limitata|completa))|trotto|\btest\b|count how|conta quant/i;

export function skipOnYellow(text, cat) {
  return cat === 'run' || IMPACT.test(text || '');
}

// Famiglie di movimento riconosciute dal testo dell'esercizio, in italiano o in inglese (la prima che combacia vince).
const FAMILIES = [
  ['calf_raise', /calf raise|heel raise|sulle punte|onto your toes|on the balls? of (your|the) foot|sollevament\w* (del )?tallon|sollevarsi/i],
  ['jump', /\bjump|\bhop(s|ping)?\b|plyometric|bounding|\bsalt|pliometr/i],
  ['cod', /change[s]? of direction|changes? direction|cambi\w* di direzione|slalom|agilit|agility|zig-?zag|perno/i],
  ['sprint', /sprint|scatt|accelerat|decelerat|accelerazion|decelerazion|changes? of pace|cambi di ritmo/i],
  ['jog', /\bjog|\brun(ning)?\b|\bcorri\b|\bcorsa\b(?!\s+(parziale|ridotta|limitata|completa))|trotto/i],
  ['squat', /squat|sit-to-stand|\bchair\b|sedia/i],
  ['bridge', /bridge|\bponte\b|hip thrust/i],
  ['step', /\bstep\b|\bstairs?\b|gradino|scalin/i],
  ['band', /\bband\b|elastic/i],
  ['lunge', /lunge|affond/i],
  ['balance', /balance|equilibri|proprioce|propriocett|unstable|instabil|single-leg|one leg|one foot|gamba sola|monopodal|su un piede|su una gamba/i],
  ['throw', /\bthrow|\bkicks?\b|\bcalci\b|\bcatch|clearance|\bsave\b|\bdiving|\bdive\b|lanc[io]|rinvi|parat|tuffo|tuffi|pres[ae] del pallone|prese progressive/i],
  ['loadbearing', /weight-?bearing|appogg\w* progressiv/i],
];

const VOLUME = /\d+\s*(serie|ripetizioni|rip\b|secondi|sec\b|minuti|sets?|reps?|seconds?)|\bserie\b|\bsets?\b|\d+\s*[x×]\s*\d+/i;
const STRENGTH_WORDS = /rinforz|rafforz|strengthen|\bcurl|\braise|\bextension|estension|rotation|rotazion|plank|bird-?dog|clamshell|nordic|leg press|squeeze|stringi|abduct|adduct|abduz|adduz|kick|\bcalci\b|pinch|pinza|push-?up/i;
const STRETCHING = /stretch|allung|tension|tensione/i;

// Se nessuna famiglia combacia si usa il tipo di esercizio (cat). Se neanche questo basta a dire che è un
// esercizio vero (per esempio un consiglio senza serie né ripetizioni), niente livelli.
function fallbackFamily(text, cat) {
  if (cat === 'hold') return 'hold';
  if (cat === 'stretch') return STRETCHING.test(text) ? 'stretch' : 'mobility';
  if (cat === 'strength') return (VOLUME.test(text) || STRENGTH_WORDS.test(text)) ? 'strength' : null;
  if (cat === 'run' || cat === 'balance') return 'intensity';
  return null;
}

// Restituisce la famiglia di livelli di un esercizio (testo nella lingua dell'esercizio stesso), o null
// se non ha senso dare livelli. Gli esercizi di "scarico" (rest) non hanno mai livelli.
export function classifyExercise(text, cat) {
  if (!text || cat === 'rest') return null;
  if (NO_LEVELS.test(text)) return null;
  if (cat === 'hold') return 'hold';
  if (cat === 'stretch') return STRETCHING.test(text) ? 'stretch' : 'mobility';
  const hit = FAMILIES.find(([, re]) => re.test(text));
  if (hit) return hit[0];
  return fallbackFamily(text, cat);
}

const LEVELS = {
  calf_raise: {
    it: {
      easier: 'Fai il movimento su due gambe anche in discesa, con una mano appoggiata a un muro, e fai meno ripetizioni.',
      harder: 'Rallenta la discesa (3-4 secondi), poi aggiungi un po\' di peso (uno zaino). Solo quando è facile passa a una gamba sola.',
    },
    en: {
      easier: 'Use both legs on the way down too, with a hand on a wall, and do fewer reps.',
      harder: 'Slow the lowering down (3-4 seconds), then add a little weight (a backpack). Only when it feels easy, move to one leg.',
    },
  },
  jump: {
    it: {
      easier: 'Saltelli piccoli e bassi, a due piedi, con atterraggio morbido e silenzioso. Poche ripetizioni.',
      harder: 'Solo se i salti a due piedi sono senza dolore: aggiungi UN elemento nuovo, per esempio salti laterali oppure su una gamba sola.',
    },
    en: {
      easier: 'Small, low hops on two feet with a soft, quiet landing. Few reps.',
      harder: 'Only if two-footed jumps are pain-free: add ONE new element, for example side-to-side jumps or single-leg hops.',
    },
  },
  cod: {
    it: {
      easier: 'Curve ampie a bassa velocità, prima senza pallone.',
      harder: 'Curve più strette o più veloci, poi con il pallone. Un solo elemento nuovo per sessione.',
    },
    en: {
      easier: 'Wide turns at low speed, without the ball first.',
      harder: 'Tighter or faster turns, then with the ball. Only one new element per session.',
    },
  },
  sprint: {
    it: {
      easier: 'Resta intorno al 60-70% della tua velocità massima e allunga i recuperi tra una ripetizione e l\'altra.',
      harder: 'Sali a piccoli passi (per esempio dal 70 all\'80%) oppure accorcia i recuperi, mai tutte e due insieme. Fermati se senti una fitta.',
    },
    en: {
      easier: 'Stay around 60-70% of your top speed and lengthen the rest between reps.',
      harder: 'Go up in small steps (for example from 70 to 80%) or shorten the rest, never both together. Stop if you feel a sharp pain.',
    },
  },
  jog: {
    it: {
      easier: 'Alterna camminata e corsa leggera su una superficie piana e regolare, per meno tempo.',
      harder: 'Aumenta la durata oppure la velocità, mai tutte e due nella stessa sessione, e guarda come stai il giorno dopo.',
    },
    en: {
      easier: 'Alternate walking and easy jogging on a flat, even surface, for less time.',
      harder: 'Increase the duration or the speed, never both in the same session, and see how you feel the next day.',
    },
  },
  balance: {
    it: {
      easier: 'Tieniti con una mano a un muro o a un sostegno e fai tenute più brevi (10-15 secondi), oppure usa una superficie stabile.',
      harder: 'Aggiungi una sola difficoltà: occhi chiusi, una superficie morbida oppure un lancio di palla.',
    },
    en: {
      easier: 'Hold a wall or a support with one hand and do shorter holds (10-15 seconds), or use a stable surface.',
      harder: 'Add just one difficulty: eyes closed, a soft surface or a ball throw.',
    },
  },
  squat: {
    it: {
      easier: 'Scendi poco, con le mani appoggiate a un tavolo o a una sedia, e fai meno ripetizioni.',
      harder: 'Scendi un po\' di più solo se resta senza dolore, rallenta la discesa (3 secondi) oppure aggiungi un peso leggero.',
    },
    en: {
      easier: 'Go down only a little, with your hands on a table or a chair, and do fewer reps.',
      harder: 'Go a little deeper only if it stays pain-free, slow the lowering down (3 seconds) or add a light weight.',
    },
  },
  bridge: {
    it: {
      easier: 'Tieni la posizione alta per poco tempo, con entrambi i piedi a terra, e fai meno ripetizioni.',
      harder: 'Tieni la posizione alta 2-3 secondi. Poi, solo se è facile e senza dolore, passa a una gamba sola.',
    },
    en: {
      easier: 'Hold the top position for a short time, with both feet on the floor, and do fewer reps.',
      harder: 'Hold the top position for 2-3 seconds. Then, only if it is easy and pain-free, move to one leg.',
    },
  },
  step: {
    it: {
      easier: 'Usa un gradino più basso e tieniti con una mano. Scendi piano.',
      harder: 'Scegli un gradino un po\' più alto oppure scendi più lentamente (3 secondi). Il peso leggero solo dopo.',
    },
    en: {
      easier: 'Use a lower step and hold on with a hand. Come down slowly.',
      harder: 'Pick a slightly higher step or lower yourself more slowly (3 seconds). Light weight only afterwards.',
    },
  },
  band: {
    it: {
      easier: 'Usa un elastico più leggero o meno teso, con ritorno lento, e fai meno ripetizioni.',
      harder: 'Passa a un elastico un po\' più forte oppure rallenta il ritorno (3 secondi), senza compensare con il resto del corpo.',
    },
    en: {
      easier: 'Use a lighter or less stretched band, with a slow return, and do fewer reps.',
      harder: 'Move to a slightly stronger band or slow the return down (3 seconds), without compensating with the rest of the body.',
    },
  },
  lunge: {
    it: {
      easier: 'Fai affondi corti, con una mano appoggiata a un sostegno.',
      harder: 'Scendi un po\' di più restando senza dolore e rallenta la discesa. Il peso leggero solo dopo.',
    },
    en: {
      easier: 'Do short lunges, with a hand on a support.',
      harder: 'Go a little deeper while staying pain-free and slow the lowering down. Light weight only afterwards.',
    },
  },
  throw: {
    it: {
      easier: 'Distanza più corta, velocità più bassa e meno ripetizioni.',
      harder: 'Aumenta una sola cosa per volta: la distanza, la velocità oppure il numero di ripetizioni. Guarda come stai il giorno dopo.',
    },
    en: {
      easier: 'Shorter distance, lower speed and fewer reps.',
      harder: 'Increase just one thing at a time: the distance, the speed or the number of reps. See how you feel the next day.',
    },
  },
  loadbearing: {
    it: {
      easier: 'Resta nella posizione più facile (per esempio in ginocchio) e carica solo una parte del peso, per meno tempo.',
      harder: 'Passa alla posizione successiva solo se quella di prima è senza dolore. Una cosa sola per volta.',
    },
    en: {
      easier: 'Stay in the easiest position (for example on your knees) and load only part of your weight, for less time.',
      harder: 'Move to the next position only if the previous one is pain-free. One thing at a time.',
    },
  },
  hold: {
    it: {
      easier: 'Riduci lo sforzo (circa la metà) e il tempo di tenuta. Nelle tenute con le gambe piegate, stai in una posizione più alta.',
      harder: 'Tieni più a lungo oppure aumenta lo sforzo a piccoli passi, mai tutte e due insieme.',
    },
    en: {
      easier: 'Reduce the effort (about half) and the hold time. In holds with bent legs, stay in a higher position.',
      harder: 'Hold for longer or increase the effort in small steps, never both together.',
    },
  },
  stretch: {
    it: {
      easier: 'Tensione leggera, mai fino al dolore, e tieni per meno tempo (circa 15-20 secondi).',
      harder: 'Allunga la tenuta poco alla volta (fino a circa 30 secondi), sempre senza arrivare al dolore.',
    },
    en: {
      easier: 'Light tension, never into pain, and hold for less time (about 15-20 seconds).',
      harder: 'Lengthen the hold little by little (up to about 30 seconds), always without going into pain.',
    },
  },
  mobility: {
    it: {
      easier: 'Muoviti in un arco più piccolo, senza arrivare a fine corsa.',
      harder: 'Allarga il movimento poco alla volta, restando a una tensione tollerabile e mai fino al dolore.',
    },
    en: {
      easier: 'Move through a smaller range, without going to the end of the range.',
      harder: 'Widen the movement little by little, staying at a tolerable tension and never into pain.',
    },
  },
  strength: {
    it: {
      easier: 'Meno serie e ripetizioni, movimento più corto e, se serve, un appoggio per tenerti.',
      harder: 'Rallenta la fase di discesa (3 secondi). Poi aggiungi ripetizioni. Poi, solo dopo, un po\' di peso. Una cosa sola per volta.',
    },
    en: {
      easier: 'Fewer sets and reps, a shorter movement and, if needed, a support to hold on to.',
      harder: 'Slow the lowering phase down (3 seconds). Then add reps. Then, only afterwards, a little weight. One thing at a time.',
    },
  },
  intensity: {
    it: {
      easier: 'Riduci velocità e intensità, fai meno ripetizioni e allunga i recuperi.',
      harder: 'Aumenta una sola cosa per volta (intensità, durata o difficoltà) e guarda come stai il giorno dopo.',
    },
    en: {
      easier: 'Reduce speed and intensity, do fewer reps and lengthen the rest.',
      harder: 'Increase just one thing at a time (intensity, duration or difficulty) and see how you feel the next day.',
    },
  },
};

export const LEVELS_COPY = {
  it: {
    title: 'Livelli',
    easier: 'Più facile',
    harder: 'Più difficile',
    hurts: 'Se fa male',
    hurtsText: 'Fastidio lieve (fino a circa 3 su 10) che passa in fretta: puoi continuare. Da 4 a 5: passa alla versione più facile e fai meno ripetizioni. Da 6 in su, dolore acuto o che peggiora il giorno dopo: fermati e salta l\'esercizio. Se si ripete, fai valutare la zona da un professionista.',
    footer: 'Cambia una cosa alla volta e aspetta il giorno dopo prima di salire di livello. Regola pratica, non un test clinico.',
    teaser: 'Livelli: più facile, più difficile, e cosa fare se fa male',
  },
  en: {
    title: 'Levels',
    easier: 'Easier',
    harder: 'Harder',
    hurts: 'If it hurts',
    hurtsText: 'Mild discomfort (up to about 3 out of 10) that fades quickly: you can carry on. 4 to 5: switch to the easier version and do fewer reps. 6 or more, sharp pain, or pain that is worse the next day: stop and skip the exercise. If it keeps happening, have the area checked by a professional.',
    footer: 'Change one thing at a time and wait until the next day before going up a level. A practical rule, not a clinical test.',
    teaser: 'Levels: easier, harder, and what to do if it hurts',
  },
};

// Testi dei livelli di una famiglia, nella lingua richiesta ({ easier, harder }), o null.
export function levelsFor(family, isEN) {
  const f = family && LEVELS[family];
  return f ? f[isEN ? 'en' : 'it'] : null;
}

export const LEVEL_FAMILIES = Object.keys(LEVELS);
