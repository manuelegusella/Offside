import React, { useState, useEffect, useCallback, useMemo } from 'react';

function trackEvent(name, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
import {
  Footprints, Zap, CircleDot, Activity, ArrowLeftRight, Shield, Anchor,
  ShieldCheck, Disc, TrendingUp, Compass, AlertTriangle, CheckCircle2,
  Circle, ChevronRight, ChevronDown, ArrowLeft, ArrowRight, Info, RotateCcw, X,
  Calendar, Scale, Dumbbell, Move, Wind, Timer, Pause, Pencil, Target,
  HelpCircle, PlayCircle, Flame, Share2, ClipboardCheck, Check, Gauge, Waves,
  Aperture, PersonStanding, Ruler, Sprout, RotateCw, CircleDashed, ShieldAlert,
  Snowflake, Bandage, ArrowUp, Trophy, Video
} from 'lucide-react';

const colors = {
  paper: '#EEF3F8', card: '#FFFFFF', hairline: '#D7E1EA', ink: '#101B26',
  mutedInk: '#57697A', accent: '#22C55E', accentTint: '#DCFCE7', accentDark: '#15803D',
  red: '#AE3830', redTint: '#F6DEDB', laneBg: '#DFE7EF', orange: '#C96A22',
  prevention: '#14B8A6', preventionTint: '#CCFBF1', preventionDark: '#0F766E', preventionPaper: '#EDFCFA',
};

const STORAGE_KEY = 'injury-recovery-progress-v3';

const catIcons = { balance: Scale, strength: Dumbbell, stretch: Move, run: Wind, hold: Timer, rest: Pause };
const catLabelsIT = { balance: 'Equilibrio', strength: 'Rinforzo', stretch: 'Mobilità', run: 'Corsa/agilità', hold: 'Tenuta isometrica', rest: 'Scarico' };
const catLabelsEN = { balance: 'Balance', strength: 'Strength', stretch: 'Mobility', run: 'Running/agility', hold: 'Isometric hold', rest: 'Offload' };
const mechanismLabelsIT = { acute: 'Trauma improvviso', overuse: 'Da sovraccarico', contact: 'Da contatto' };
const mechanismLabelsEN = { acute: 'Sudden trauma', overuse: 'Overuse', contact: 'Contact' };
const formCuesIT = {
  balance: ['Sguardo fisso in avanti, non guardare giù', 'Ginocchio leggermente piegato, non bloccato', 'Se perdi l\'equilibrio, tocca terra e riparti — fa parte dell\'esercizio'],
  strength: ['Movimento lento e controllato, soprattutto in discesa', 'Respira normalmente, non trattenere il fiato', 'Fermati se senti dolore acuto, non il normale fastidio muscolare'],
  stretch: ['Allunga fino a sentire tensione, mai dolore', 'Mantieni la posizione ferma, senza rimbalzare', 'Respira lentamente durante l\'allungamento'],
  run: ['Parti più piano di quanto pensi sia necessario', 'Fermati subito se il dolore cambia natura o intensità', 'Aumenta gradualmente, non tutto insieme'],
  hold: ['Contrai senza muovere l\'articolazione', 'Mantieni una respirazione regolare', 'Rilascia lentamente, non di scatto'],
  rest: ['Il movimento leggero spesso aiuta quanto il riposo assoluto', 'Ascolta il corpo: dolore acuto e fastidio normale sono segnali diversi'],
};
const formCuesEN = {
  balance: ['Keep your eyes forward, not looking down', 'Knee slightly bent, not locked', 'If you lose balance, touch down and restart — that\'s part of the exercise'],
  strength: ['Slow, controlled movement, especially on the way down', 'Breathe normally, don\'t hold your breath', 'Stop if you feel sharp pain, not normal muscle fatigue'],
  stretch: ['Stretch until you feel tension, never pain', 'Hold the position still, don\'t bounce', 'Breathe slowly through the stretch'],
  run: ['Start slower than you think you need to', 'Stop immediately if the pain changes in nature or intensity', 'Build up gradually, not all at once'],
  hold: ['Contract without moving the joint', 'Keep your breathing steady', 'Release slowly, not suddenly'],
  rest: ['Light movement often helps as much as full rest', 'Listen to your body: sharp pain and normal soreness are different signals'],
};

const severityLabelsIT = { lieve: 'Lieve', moderato: 'Moderato', severo: 'Severo' };
const severityLabelsEN = { lieve: 'Mild', moderato: 'Moderate', severo: 'Severe' };
const severityInfoIT = {
  lieve: 'Dolore lieve, riesci a muoverti e camminare quasi normalmente. Gonfiore minimo o assente.',
  moderato: 'Dolore evidente, difficoltà a muoverti liberamente nei primi giorni. Gonfiore visibile.',
  severo: 'Dolore intenso, molta difficoltà o impossibilità a muoverti o appoggiare il peso. Gonfiore importante. Consigliata una valutazione professionale prima di iniziare da soli.',
};
const severityInfoEN = {
  lieve: 'Mild pain, you can move and walk almost normally. Minimal or no swelling.',
  moderato: 'Noticeable pain, trouble moving freely in the first few days. Visible swelling.',
  severo: 'Intense pain, a lot of difficulty or inability to move or bear weight. Significant swelling. A professional assessment is recommended before starting on your own.',
};

const feelingOptionsIT = [
  { key: 'bene', label: 'Bene' },
  { key: 'cosi', label: 'Così così' },
  { key: 'male', label: 'Male' },
];
const feelingOptionsEN = [
  { key: 'bene', label: 'Good' },
  { key: 'cosi', label: 'So-so' },
  { key: 'male', label: 'Bad' },
];

const stiffnessOptionsIT = [
  { key: 'no', label: 'No' },
  { key: 'poca', label: 'Un po\'' },
  { key: 'si', label: 'Sì, tanta' },
];
const stiffnessOptionsEN = [
  { key: 'no', label: 'No' },
  { key: 'poca', label: 'A little' },
  { key: 'si', label: 'Yes, a lot' },
];

function dailyGuidanceIT(feeling, stiffness) {
  if (!feeling && !stiffness) return null;
  if (feeling === 'male' || stiffness === 'si') {
    return { label: 'Oggi vacci piano', detail: 'Punta su mobilità leggera, senza forzare — e ricontrolla i segnali d\'allarme qui sopra.' };
  }
  if (feeling === 'cosi' || stiffness === 'poca') {
    return { label: 'Oggi con attenzione', detail: 'Procedi pure, ma resta sotto la tua soglia abituale se qualcosa tira più del solito.' };
  }
  if (feeling === 'bene' && (stiffness === 'no' || !stiffness)) {
    return { label: 'Oggi puoi lavorare normalmente', detail: 'Nessun segnale di allerta dalle tue risposte — procedi con gli esercizi previsti.' };
  }
  return null;
}
function dailyGuidanceEN(feeling, stiffness) {
  if (!feeling && !stiffness) return null;
  if (feeling === 'male' || stiffness === 'si') {
    return { label: 'Take it easy today', detail: 'Stick to light mobility, don\'t force it — and re-check the warning signs above.' };
  }
  if (feeling === 'cosi' || stiffness === 'poca') {
    return { label: 'Proceed with care today', detail: 'Go ahead, but stay under your usual threshold if something feels tighter than normal.' };
  }
  if (feeling === 'bene' && (stiffness === 'no' || !stiffness)) {
    return { label: 'You can work normally today', detail: 'No warning signs from your answers — go ahead with the planned exercises.' };
  }
  return null;
}

const injuriesDataIT = {
  ankle: {
    relatedInjuries: ['calf', 'knee'], relatedReason: 'La caviglia instabile fa lavorare di più polpaccio e ginocchio per compensare l\'equilibrio.',
    label: 'Distorsione di caviglia', subtitle: 'Legamenti della caviglia', icon: Footprints, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [4, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [7, 21], totalEstimateDays: 42 },
      severo: { dayThresholds: [14, 45], totalEstimateDays: 140 },
    },
    phases: [
      { name: 'Protezione', why: 'Nei primi giorni il legamento è infiammato. L\'obiettivo è proteggere il tessuto e ridurre il gonfiore, non riabilitarlo ancora attivamente.',
        exercises: [
          { text: 'Alfabeto con la caviglia: disegna le lettere muovendo il piede, senza carico', cat: 'stretch' },
          { text: 'Elevazione della gamba quando possibile', cat: 'rest' },
          { text: 'Cammina solo nei limiti del dolore (stampelle nei primi giorni se serve)', cat: 'rest' },
          { text: 'Contrazioni isometriche leggere: spingi il piede contro una resistenza ferma (tenuta 20-30 secondi, 3-4 volte)', cat: 'hold' },
        ] },
      { name: 'Recupero attivo', why: 'Il legamento inizia a tollerare carico progressivo. Qui si lavora su forza e propriocezione: il senso di equilibrio della caviglia, spesso il fattore chiave per non farsi male di nuovo.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare in modo evidente', 'Il gonfiore è chiaramente diminuito rispetto ai primi giorni'],
        exercises: [
          { text: 'Equilibrio su una gamba sola, 30 secondi (poi a occhi chiusi se comodo)', cat: 'balance' },
          { text: 'Rinforzo con elastico in tutte le direzioni (2-3 serie da 12-15 per direzione)', cat: 'strength' },
          { text: 'Calf raises a corpo libero (3 serie da 12-15, aumenta se non c\'è dolore)', cat: 'strength' },
          { text: 'Cammino su superfici leggermente instabili', cat: 'balance' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a correre e calciare, la caviglia deve tollerare carichi improvvisi e cambi di direzione senza cedere.',
        criteriaToAdvance: ['Riesci a stare in equilibrio su una gamba sola per 10+ secondi senza dolore', 'Riesci a fare i calf raises senza dolore acuto'],
        exercises: [
          { text: 'Corsa leggera in linea retta', cat: 'run' },
          { text: 'Cambi di direzione graduali', cat: 'run' },
          { text: 'Salti bipodalici, poi monopodalici', cat: 'strength' },
          { text: 'Dribbling leggero prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  achilles: {
    relatedInjuries: ['calf', 'plantarfasciitis'], relatedReason: 'Achille, polpaccio e fascia plantare condividono lo stesso sistema muscolo-tendineo del piede.',
    label: 'Tendinopatia achillea', subtitle: 'Tendine d\'Achille, spesso da sovraccarico', icon: Anchor, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 56], totalEstimateDays: 98 },
      severo: { dayThresholds: [28, 84], totalEstimateDays: 240 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'I tendini rispondono male al riposo totale ma peggiorano con carichi ripetuti eccessivi (salti, sprint). Si cerca il livello di carico tollerato senza dolore che persiste il giorno dopo.',
        exercises: [
          { text: 'Riduci temporaneamente salti, sprint e scale se scatenano dolore persistente', cat: 'rest' },
          { text: 'Cammina normalmente se ben tollerato', cat: 'rest' },
          { text: 'Isometria: sollevati leggermente sulle punte e mantieni la posizione (30-45 secondi, 4-5 volte)', cat: 'hold' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo eccentrico (allungamento del tendine sotto carico) ha più evidenza scientifica per i tendini, ma va introdotto con gradualità.',
        criteriaToAdvance: ['Riesci a camminare normalmente senza dolore a riposo', 'Il dolore nelle attività quotidiane resta lieve'],
        exercises: [
          { text: 'Calf raises eccentrici: sali su due gambe, scendi lentamente su una sola (3 serie da 10-15)', cat: 'strength' },
          { text: 'Aumenta gradualmente carico e ripetizioni settimana dopo settimana', cat: 'strength' },
          { text: 'Stretching dolce del polpaccio, senza forzare', cat: 'stretch' },
        ] },
      { name: 'Ritorno allo sport', why: 'Anche senza dolore, il tendine potrebbe non essere ancora pronto per sprint e salti ripetuti: qui più che altrove vale la regola di non affrettare.',
        criteriaToAdvance: ['Riesci a fare calf raises su due gambe senza dolore significativo', 'Il dolore il giorno dopo l\'allenamento non peggiora'],
        exercises: [
          { text: 'Corsa progressiva, aumentando distanza e intensità con calma', cat: 'run' },
          { text: 'Salti e cambi di direzione introdotti per ultimi', cat: 'strength' },
          { text: 'Torna agli allenamenti completi solo se stabile senza dolore da 1-2 settimane', cat: 'run' },
        ] },
    ],
  },
  knee: {
    relatedInjuries: ['trochanteric', 'quad'], relatedReason: 'Un\'anca debole, soprattutto il gluteo medio, è tra le cause più comuni di dolore femoro-rotuleo.',
    label: 'Dolore femoro-rotuleo', subtitle: 'Dolore anteriore al ginocchio', icon: CircleDot, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 35 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 70 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Spesso è un sovraccarico più che un trauma singolo. Prima si capisce quali movimenti scatenano il dolore (salti, scale, squat profondi) e si riducono, senza fermare tutto.',
        exercises: [
          { text: 'Riduci temporaneamente salti e scale se scatenano dolore', cat: 'rest' },
          { text: 'Mantieni attività ben tollerate (spesso la bici leggera va bene)', cat: 'rest' },
          { text: 'Squat isometrico a parete, breve durata (20-30 secondi, 3-4 volte)', cat: 'hold' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo di quadricipite E anca/gluteo è centrale — spesso l\'anca viene trascurata ma è molto rilevante.',
        criteriaToAdvance: ['Riesci a salire/scendere le scale con dolore lieve o assente', 'Lo squat isometrico a parete non scatena dolore acuto'],
        exercises: [
          { text: 'Squat controllati, aumenta gradualmente la profondità (2-3 serie da 10-12)', cat: 'strength' },
          { text: 'Step-up bassi (2-3 serie da 10-12 per gamba)', cat: 'strength' },
          { text: 'Rinforzo abduttori e gluteo medio (2-3 serie da 15)', cat: 'strength' },
          { text: 'Leg press a range parziale se disponibile (3 serie da 10-12)', cat: 'strength' },
        ] },
      { name: 'Ritorno allo sport', why: 'Salti e cambi di direzione vanno reintrodotti gradualmente, mantenendo il rinforzo anche dopo la scomparsa del dolore per evitare ricadute.',
        criteriaToAdvance: ['Riesci a fare squat a media profondità senza dolore significativo', 'Nessun peggioramento del dolore il giorno dopo l\'allenamento'],
        exercises: [
          { text: 'Salti e atterraggi controllati', cat: 'run' },
          { text: 'Cambi di direzione progressivi', cat: 'run' },
          { text: 'Corsa progressiva fino a intensità di gara', cat: 'run' },
        ] },
    ],
  },
  mcl: {
    relatedInjuries: ['lcl', 'meniscus'], relatedReason: 'Legamenti e cartilagine del ginocchio lavorano insieme: un trauma spesso coinvolge più strutture.',
    label: 'Distorsione collaterale mediale', subtitle: 'Legamento interno del ginocchio', icon: ShieldCheck, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 21], totalEstimateDays: 35 },
      severo: { dayThresholds: [21, 42], totalEstimateDays: 84 },
    },
    phases: [
      { name: 'Protezione', why: 'Il legamento collaterale mediale stabilizza il ginocchio nei movimenti laterali. Nei primi giorni serve proteggerlo da stress laterali.',
        exercises: [
          { text: 'Cammino nei limiti del dolore, evita torsioni e movimenti laterali bruschi', cat: 'rest' },
          { text: 'Elevazione della gamba quando possibile', cat: 'rest' },
          { text: 'Contrazioni isometriche leggere del quadricipite (tenuta 20-30 secondi, 3-4 volte)', cat: 'hold' },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce movimento e carico controllato, senza ancora sollecitare il ginocchio con stress laterali importanti.',
        criteriaToAdvance: ['Riesci a camminare senza sensazione di cedimento del ginocchio', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: 'Squat controllati in range limitato (2-3 serie da 10)', cat: 'strength' },
          { text: 'Rinforzo di quadricipite e ischiocrurali (2-3 serie da 12)', cat: 'strength' },
          { text: 'Equilibrio su una gamba sola, senza torsioni', cat: 'balance' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare ai contrasti e ai cambi di direzione, il ginocchio deve tollerare stress laterali senza cedere.',
        criteriaToAdvance: ['Riesci a fare squat senza dolore sul lato interno del ginocchio', 'Nessuna instabilità percepita nei movimenti quotidiani'],
        exercises: [
          { text: 'Cambi di direzione progressivi, partendo da angoli ampi', cat: 'run' },
          { text: 'Corsa con curve controllate', cat: 'run' },
          { text: 'Contatti leggeri e contrasti controllati prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  patellar: {
    relatedInjuries: ['quad', 'knee'], relatedReason: 'Il tendine rotuleo prosegue il quadricipite: un quadricipite debole lo sovraccarica direttamente.',
    label: 'Tendinopatia rotulea', subtitle: '"Ginocchio del saltatore"', icon: Disc, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 90 },
      severo: { dayThresholds: [28, 84], totalEstimateDays: 220 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Come ogni tendine, quello rotuleo peggiora con salti ripetuti ma non ama il riposo totale. Si cerca il livello di attività che non lascia dolore il giorno dopo.',
        exercises: [
          { text: 'Riduci temporaneamente salti e scale se scatenano dolore persistente', cat: 'rest' },
          { text: 'Mantieni attività a basso impatto se tollerate (bici leggera)', cat: 'rest' },
          { text: 'Isometria del quadricipite: squat isometrico a parete (30-45 secondi, 4-5 volte)', cat: 'hold' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo del quadricipite, in particolare con esercizi lenti e controllati, è centrale per far tollerare di nuovo il carico al tendine.',
        criteriaToAdvance: ['Il dolore a riposo è assente o minimo', 'Lo squat isometrico non scatena dolore acuto'],
        exercises: [
          { text: 'Squat lenti e controllati, aumenta gradualmente il carico (3 serie da 8-10, scendi lentamente in 3-4 secondi)', cat: 'strength' },
          { text: 'Leg extension a range parziale se disponibile (3 serie da 10-12)', cat: 'strength' },
          { text: 'Step-down controllati, scendere lentamente da un gradino (2-3 serie da 8-10 per gamba)', cat: 'strength' },
        ] },
      { name: 'Ritorno allo sport', why: 'Salti e atterraggi vanno reintrodotti per ultimi: sono i gesti che sollecitano di più il tendine rotuleo.',
        criteriaToAdvance: ['Riesci a fare squat a media profondità senza dolore significativo', 'Nessun peggioramento del dolore il giorno dopo'],
        exercises: [
          { text: 'Salti bipodalici controllati, poi monopodalici', cat: 'strength' },
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Allenamento completo solo dopo assenza di dolore stabile da 1-2 settimane', cat: 'run' },
        ] },
    ],
  },
  meniscus: {
    relatedInjuries: ['mcl', 'lcl'], relatedReason: 'Le torsioni del ginocchio spesso coinvolgono insieme menisco e legamenti collaterali.',
    label: 'Lesione del menisco', subtitle: 'Cartilagine del ginocchio, spesso da torsione', icon: Aperture, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 90 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    specialRedFlags: [
      'Il ginocchio si blocca e non riesci a stenderlo completamente',
      'Il ginocchio cede improvvisamente durante il movimento',
      'Senti uno scatto o click doloroso ripetuto durante il movimento',
    ],
    phases: [
      { name: 'Riduzione carico', why: 'Dopo una torsione del ginocchio con possibile coinvolgimento del menisco, i primi giorni servono a calmare l\'infiammazione ed evitare movimenti che scatenano dolore.',
        exercises: [
          { text: 'Riduci temporaneamente torsioni, squat profondi e accovacciamenti', cat: 'rest' },
          { text: 'Cammina nei limiti del dolore', cat: 'rest' },
          { text: 'Contrazioni isometriche leggere del quadricipite (tenuta 20-30 secondi, 3-4 volte)', cat: 'hold' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo di quadricipite e muscolatura circostante aiuta a stabilizzare il ginocchio e a distribuire meglio il carico sulla cartilagine residua.',
        criteriaToAdvance: ['Riesci a piegare e stendere completamente il ginocchio senza blocchi', 'Nessuna sensazione di cedimento nei movimenti quotidiani'],
        exercises: [
          { text: 'Squat controllati in range limitato, senza dolore (2-3 serie da 10-12)', cat: 'strength' },
          { text: 'Rinforzo degli ischiocrurali', cat: 'strength' },
          { text: 'Equilibrio su una gamba sola', cat: 'balance' },
        ] },
      { name: 'Ritorno allo sport', why: 'Cambi di direzione e torsioni vanno reintrodotti per ultimi: sono i movimenti che sollecitano di più il menisco.',
        criteriaToAdvance: ['Riesci a fare squat completi senza dolore o blocchi', 'Nessun gonfiore dopo attività più intense'],
        exercises: [
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Cambi di direzione graduali', cat: 'run' },
          { text: 'Contrasti e torsioni controllate prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  itband: {
    relatedInjuries: ['trochanteric', 'knee'], relatedReason: 'La bandelletta collega anca e ginocchio: un gluteo debole la sovraccarica lungo tutto il tragitto.',
    label: 'Bandelletta ileotibiale', subtitle: 'Dolore laterale al ginocchio, da sovraccarico', icon: Ruler, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 77 },
      severo: { dayThresholds: [30, 70], totalEstimateDays: 160 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'La bandelletta ileotibiale scorre lungo il lato esterno della coscia fino al ginocchio: il dolore da sovraccarico peggiora con la corsa ripetuta, specialmente in discesa.',
        exercises: [
          { text: 'Riduci temporaneamente la corsa, specialmente in discesa, se scatena dolore persistente', cat: 'rest' },
          { text: 'Sostituisci con attività a basso impatto se tollerate (bici con sella alta)', cat: 'rest' },
          { text: 'Massaggio leggero o foam roller sulla coscia laterale, se disponibile', cat: 'stretch' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo dell\'anca, in particolare del gluteo medio, è centrale: una debolezza qui è tra le cause più comuni di questo tipo di dolore.',
        criteriaToAdvance: ['Riesci a camminare senza dolore laterale al ginocchio', 'La corsa leggera in piano non scatena dolore acuto'],
        exercises: [
          { text: 'Rinforzo del gluteo medio: clamshell o abduzioni laterali (2-3 serie da 15)', cat: 'strength' },
          { text: 'Squat monopodalico controllato, range limitato (2-3 serie da 8-10)', cat: 'strength' },
          { text: 'Stretching dolce della fascia laterale della coscia', cat: 'stretch' },
        ] },
      { name: 'Ritorno alla corsa', why: 'Le discese e i cambi di direzione vanno reintrodotti per ultimi: sono i movimenti che sollecitano di più la bandelletta.',
        criteriaToAdvance: ['Riesci a correre in piano senza dolore durante o dopo', 'Nessun dolore il giorno dopo un allenamento più lungo'],
        exercises: [
          { text: 'Corsa progressiva in piano, poi introduci dolcemente le discese', cat: 'run' },
          { text: 'Cambi di direzione graduali', cat: 'run' },
          { text: 'Ritorno agli allenamenti completi solo dopo assenza di dolore stabile', cat: 'run' },
        ] },
    ],
  },
  osgood: {
    relatedInjuries: ['patellar', 'quad'], relatedReason: 'Osgood-Schlatter coinvolge lo stesso tendine rotuleo e quadricipite, in una fase di crescita più sensibile.',
    label: 'Osgood-Schlatter', subtitle: 'Dolore sotto il ginocchio, tipico in età di crescita', icon: Sprout, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [14, 28], totalEstimateDays: 56 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 98 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Osgood-Schlatter è un\'infiammazione del punto in cui il tendine rotuleo si attacca alla tibia, tipica durante la crescita. Non è una lesione grave, ma richiede gestione del carico.',
        exercises: [
          { text: 'Riduci temporaneamente salti e sprint se scatenano dolore persistente', cat: 'rest' },
          { text: 'Applica ghiaccio dopo l\'attività se il dolore è presente', cat: 'rest' },
          { text: 'Stretching dolce del quadricipite', cat: 'stretch' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo controllato del quadricipite, evitando carichi eccessivi sul tendine rotuleo, aiuta a tollerare meglio l\'attività sportiva nel frattempo.',
        criteriaToAdvance: ['Il dolore nelle attività quotidiane è lieve o assente', 'Riesci a fare stretching del quadricipite senza dolore acuto'],
        exercises: [
          { text: 'Rinforzo isometrico del quadricipite (2-3 serie da 20-30 secondi)', cat: 'hold' },
          { text: 'Squat controllati in range limitato, senza dolore (2-3 serie da 10)', cat: 'strength' },
          { text: 'Stretching quotidiano di quadricipite e ischiocrurali', cat: 'stretch' },
        ] },
      { name: 'Gestione del rientro', why: 'L\'obiettivo realistico è gestire i sintomi durante lo sport, non eliminarli del tutto finché la crescita non è completa.',
        criteriaToAdvance: ['Riesci ad allenarti senza dolore che peggiora nei giorni successivi', 'Il dolore non compare più a riposo'],
        exercises: [
          { text: 'Corsa e salti reintrodotti gradualmente, monitorando la risposta il giorno dopo', cat: 'run' },
          { text: 'Riduci temporaneamente l\'attività nei periodi di dolore più acuto', cat: 'rest' },
          { text: 'Parlane con un fisioterapista se il dolore limita spesso l\'attività', cat: 'rest' },
        ] },
    ],
  },
  hamstring: {
    relatedInjuries: ['lowback', 'piriformis'], relatedReason: 'Hamstring, glutei e zona lombare formano la catena posteriore: una debolezza qui si ripercuote sulle altre.',
    label: 'Stiramento hamstring', subtitle: 'Posteriore della coscia', icon: Zap, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 49 },
      severo: { dayThresholds: [21, 60], totalEstimateDays: 130 },
    },
    phases: [
      { name: 'Protezione', why: 'Il muscolo ha una micro-lesione. Serve calmare l\'infiammazione ed evitare l\'allungamento eccessivo, che potrebbe peggiorare lo strappo.',
        exercises: [
          { text: 'Cammino leggero entro i limiti del dolore', cat: 'rest' },
          { text: 'Isometria leggera: da seduto, spingi il tallone contro il pavimento (tenuta 20-30 secondi, 3-4 volte)', cat: 'hold' },
          { text: 'Evita stretching aggressivo in questi giorni', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Gli hamstring hanno il tasso di recidiva più alto tra tutti gli strappi muscolari se il rientro è troppo affrettato. Si reintroduce gradualmente carico e allungamento.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare', 'L\'isometria leggera non scatena dolore acuto'],
        exercises: [
          { text: 'Nordic curl assistito, range limitato all\'inizio (2-3 serie da 5-6)', cat: 'strength' },
          { text: 'Ponte glutei/hamstring, bridge (3 serie da 12-15)', cat: 'strength' },
          { text: 'Stretching dolce e progressivo, mai fino al dolore acuto', cat: 'stretch' },
          { text: 'Rinforzo eccentrico leggero', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Gli hamstring lavorano ad alta velocità nello sprint: vanno riportati a tollerare quella velocità in modo graduale.',
        criteriaToAdvance: ['Riesci a fare il ponte glutei senza dolore', 'Lo stretching dolce provoca solo tensione normale, non dolore acuto'],
        exercises: [
          { text: 'Jog leggero → corsa media → sprint al 70% → sprint pieno', cat: 'run' },
          { text: 'Accelerazioni e decelerazioni controllate', cat: 'run' },
          { text: 'Sprint al 100% senza dolore prima di tornare in partita', cat: 'run' },
        ] },
    ],
  },
  quad: {
    relatedInjuries: ['patellar', 'knee'], relatedReason: 'Un quadricipite sovraccarico o debole influenza direttamente tendine rotuleo e rotula.',
    label: 'Stiramento del quadricipite', subtitle: 'Anteriore della coscia', icon: TrendingUp, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [4, 9], totalEstimateDays: 18 },
      moderato: { dayThresholds: [9, 24], totalEstimateDays: 42 },
      severo: { dayThresholds: [18, 49], totalEstimateDays: 110 },
    },
    phases: [
      { name: 'Protezione', why: 'Come ogni strappo muscolare, i primi giorni servono a calmare l\'infiammazione ed evitare l\'allungamento eccessivo.',
        exercises: [
          { text: 'Cammino leggero entro i limiti del dolore', cat: 'rest' },
          { text: 'Isometria leggera del quadricipite, senza movimento (tenuta 20-30 secondi, 3-4 volte)', cat: 'hold' },
          { text: 'Evita calci e sprint in questi giorni', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce gradualmente carico e allungamento controllato del quadricipite.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare', 'L\'isometria del quadricipite non scatena dolore acuto'],
        exercises: [
          { text: 'Squat controllati in range limitato, aumenta gradualmente (2-3 serie da 10-12)', cat: 'strength' },
          { text: 'Stretching dolce, mai fino al dolore acuto', cat: 'stretch' },
          { text: 'Rinforzo progressivo con resistenza leggera (2-3 serie da 12-15)', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Il quadricipite è centrale in ogni calcio e scatto: va riportato a tollerare quello sforzo gradualmente.',
        criteriaToAdvance: ['Riesci a fare squat in range limitato senza dolore significativo', 'Nessun peggioramento il giorno dopo l\'allenamento'],
        exercises: [
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Calci a bassa intensità, poi progressivi', cat: 'strength' },
          { text: 'Cambi di ritmo prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  contusion: {
    relatedInjuries: ['quad', 'hamstring'], relatedReason: 'Una contusione può indebolire temporaneamente i muscoli vicini: vale la pena monitorarli.',
    label: 'Contusione muscolare', subtitle: 'Trauma da contatto (es. calcio/ginocchiata)', icon: Shield, mechanismTags: ['contact'],
    severityData: {
      lieve: { dayThresholds: [3, 7], totalEstimateDays: 14 },
      moderato: { dayThresholds: [5, 14], totalEstimateDays: 28 },
      severo: { dayThresholds: [10, 28], totalEstimateDays: 84 },
    },
    phases: [
      { name: 'Protezione', why: 'A differenza di uno strappo, qui il danno viene da un urto diretto. Nei primi giorni l\'obiettivo è limitare il sanguinamento interno, non massaggiare o allungare la zona.',
        exercises: [
          { text: 'Ghiaccio a intervalli nelle prime 24–48 ore, mai a contatto diretto con la pelle', cat: 'rest' },
          { text: 'Evita stretching e massaggi energici: possono peggiorare il sanguinamento interno', cat: 'rest' },
          { text: 'Cammino leggero se ben tollerato', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Passata la fase acuta, si reintroduce movimento e carico in modo dolce, senza mai forzare sul dolore.',
        criteriaToAdvance: ['Il gonfiore acuto è stabile o in diminuzione, non più in aumento', 'Riesci a muovere l\'articolazione vicina senza dolore acuto'],
        exercises: [
          { text: 'Mobilità dolce e progressiva della zona colpita', cat: 'stretch' },
          { text: 'Rinforzo leggero quando il dolore lo permette (2 serie da 12-15)', cat: 'strength' },
          { text: 'Stretching gentile, mai forzato', cat: 'stretch' },
        ] },
      { name: 'Rientro in campo', why: 'Le contusioni importanti alla coscia hanno un rischio di miosite ossificante se il rientro è troppo affrettato.',
        criteriaToAdvance: ['Riesci a fare stretching gentile della zona senza dolore acuto', 'La forza sta tornando, anche se non ancora completa'],
        exercises: [
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Contatti leggeri e controllati prima del rientro in allenamento di gruppo', cat: 'run' },
        ] },
    ],
  },
  calf: {
    relatedInjuries: ['achilles', 'ankle'], relatedReason: 'Polpaccio, Achille e caviglia condividono lo stesso meccanismo di spinta nella corsa.',
    label: 'Stiramento del polpaccio', subtitle: 'Gastrocnemio/soleo', icon: Activity, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 42 },
      severo: { dayThresholds: [21, 60], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Protezione', why: 'Come ogni strappo, i primi giorni servono a calmare l\'infiammazione. Punte di velocità e salti vanno evitati: il polpaccio lavora proprio lì.',
        exercises: [
          { text: 'Cammino leggero entro i limiti del dolore', cat: 'rest' },
          { text: 'Isometria leggera: spingi la punta del piede contro una resistenza, senza muoverla (tenuta 20-30 secondi, 3-4 volte)', cat: 'hold' },
          { text: 'Evita punte di velocità e salti in questi giorni', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce il carico sul tricipite surale in modo progressivo, prima assistito poi a corpo libero.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare', 'L\'isometria leggera non scatena dolore acuto'],
        exercises: [
          { text: 'Calf raises assistiti con supporto, poi a corpo libero (3 serie da 12-15)', cat: 'strength' },
          { text: 'Stretching dolce del polpaccio, mai fino al dolore acuto', cat: 'stretch' },
          { text: 'Cammino in leggera salita', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Il polpaccio è decisivo in ogni scatto: va riportato a tollerare quello sforzo prima di rientrare in gruppo.',
        criteriaToAdvance: ['Riesci a fare calf raises assistiti senza dolore significativo', 'Nessun peggioramento il giorno dopo'],
        exercises: [
          { text: 'Corsa progressiva: jog leggero → media intensità → sprint', cat: 'run' },
          { text: 'Salti sul posto, poi in movimento', cat: 'strength' },
          { text: 'Cambi di ritmo controllati prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  shinsplints: {
    relatedInjuries: ['calf', 'plantarfasciitis'], relatedReason: 'Stress tibiale, polpaccio e fascia plantare spesso condividono la stessa causa: un carico di corsa aumentato troppo in fretta.',
    label: 'Sindrome da stress tibiale', subtitle: 'Dolore lungo la tibia, da sovraccarico', icon: Gauge, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 70 },
      severo: { dayThresholds: [28, 70], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Il dolore lungo la tibia da sovraccarico peggiora con l\'impatto ripetuto della corsa. Ridurre temporaneamente il volume, senza fermarsi del tutto, è il primo passo.',
        exercises: [
          { text: 'Riduci temporaneamente volume e intensità della corsa se il dolore persiste il giorno dopo', cat: 'rest' },
          { text: 'Sostituisci parte degli allenamenti con attività a basso impatto (bici, nuoto) se tollerate', cat: 'rest' },
          { text: 'Stretching dolce del polpaccio', cat: 'stretch' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo dei muscoli della gamba, in particolare tibiale anteriore e polpaccio, aiuta ad assorbire meglio l\'impatto ripetuto e riduce il rischio di ricadute.',
        criteriaToAdvance: ['Il dolore a riposo è assente', 'Riesci a camminare senza dolore che peggiora nelle ore successive'],
        exercises: [
          { text: 'Rinforzo del tibiale anteriore: sollevamento della punta del piede (2-3 serie da 15-20)', cat: 'strength' },
          { text: 'Calf raises progressivi (3 serie da 12-15)', cat: 'strength' },
          { text: 'Esercizi propriocettivi su una gamba', cat: 'balance' },
        ] },
      { name: 'Ritorno alla corsa', why: 'Il volume di corsa va reintrodotto molto gradualmente: un aumento troppo rapido è la causa più comune di ricaduta in questo infortunio.',
        criteriaToAdvance: ['Riesci a correre a bassa intensità senza dolore durante o dopo', 'Nessun dolore il giorno successivo a un allenamento più lungo'],
        exercises: [
          { text: 'Corsa progressiva, aumenta il volume settimanale con calma (non più del 10% circa)', cat: 'run' },
          { text: 'Alterna superfici morbide quando possibile nelle prime settimane', cat: 'run' },
          { text: 'Ritorno agli allenamenti completi solo dopo assenza di dolore stabile', cat: 'run' },
        ] },
    ],
  },
  plantarfasciitis: {
    relatedInjuries: ['calf', 'achilles'], relatedReason: 'La fascia plantare è collegata al tricipite surale: la tensione del polpaccio si trasmette fino alla pianta del piede.',
    label: 'Fascite plantare', subtitle: 'Dolore sotto il tallone, tipico al primo passo', icon: Waves, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [14, 28], totalEstimateDays: 56 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 98 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'La fascia plantare è irritata, tipicamente più dolorosa nei primi passi del mattino. Ridurre temporaneamente gli impatti ripetuti aiuta a calmare l\'irritazione iniziale.',
        exercises: [
          { text: 'Riduci temporaneamente corsa e salti se scatenano dolore persistente', cat: 'rest' },
          { text: 'Fai rotolare dolcemente un oggetto rotondo sotto il piede', cat: 'stretch' },
          { text: 'Stretching del polpaccio, spesso collegato alla tensione della fascia', cat: 'stretch' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo dei muscoli intrinseci del piede e del polpaccio aiuta la fascia plantare a tollerare meglio il carico.',
        criteriaToAdvance: ['Il dolore al primo passo del mattino è chiaramente diminuito', 'Riesci a camminare senza dolore significativo'],
        exercises: [
          { text: 'Rinforzo dei muscoli del piede: raccogli un asciugamano con le dita (2-3 serie)', cat: 'strength' },
          { text: 'Calf raises progressivi (3 serie da 12-15)', cat: 'strength' },
          { text: 'Stretching della fascia prima di alzarti dal letto al mattino', cat: 'stretch' },
        ] },
      { name: 'Ritorno allo sport', why: 'Corsa e salti vanno reintrodotti gradualmente: la fascia plantare risponde bene al carico progressivo ma male agli aumenti improvvisi.',
        criteriaToAdvance: ['Riesci a correre leggero senza dolore durante o dopo', 'Nessun dolore al mattino dopo un allenamento'],
        exercises: [
          { text: 'Corsa progressiva su superfici non troppo dure', cat: 'run' },
          { text: 'Salti e scatti introdotti per ultimi', cat: 'run' },
          { text: 'Valuta calzature con un buon supporto dell\'arco durante il recupero', cat: 'rest' },
        ] },
    ],
  },
  groin: {
    relatedInjuries: ['hipflexor', 'piriformis'], relatedReason: 'Adduttori, flessori dell\'anca e piriforme lavorano insieme in ogni gesto di calcio e corsa.',
    label: 'Pubalgia / stiramento adduttori', subtitle: 'Inguine e adduttori', icon: ArrowLeftRight, mechanismTags: ['acute', 'overuse'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 56 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 168 },
    },
    phases: [
      { name: 'Protezione', why: 'La zona inguinale è sollecitata in ogni calcio e cambio di direzione. Serve ridurre i movimenti che scatenano dolore prima di provare a rinforzare.',
        exercises: [
          { text: 'Riduci i movimenti che scatenano dolore (calci, cambi di direzione bruschi)', cat: 'rest' },
          { text: 'Isometria leggera: da sdraiato, schiaccia dolcemente un cuscino tra le ginocchia (tenuta 15-20 secondi, 4-5 volte)', cat: 'hold' },
          { text: 'Cammino nei limiti del dolore', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'La pubalgia tende a cronicizzare se il rientro è affrettato — è tra gli infortuni dove la pazienza conta di più: qui il rinforzo va aumentato con calma, insieme alla stabilità del bacino.',
        criteriaToAdvance: ['Riesci a camminare senza dolore evidente', 'L\'isometria leggera degli adduttori non scatena dolore acuto'],
        exercises: [
          { text: 'Rinforzo isometrico degli adduttori, intensità crescente (3-4 serie da 8-10 tenute)', cat: 'strength' },
          { text: 'Stretching dolce degli adduttori', cat: 'stretch' },
          { text: 'Esercizi di stabilità del bacino e del core (2-3 serie da 30-45 secondi)', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Calci, sprint e cambi di direzione laterali vanno reintrodotti per ultimi: sono i gesti che sollecitano di più questa zona.',
        criteriaToAdvance: ['Riesci a fare rinforzo isometrico a intensità moderata senza dolore', 'Nessun peggioramento il giorno dopo — qui affrettarsi rischia di più'],
        exercises: [
          { text: 'Cambi di direzione progressivi', cat: 'run' },
          { text: 'Calci a bassa intensità, poi progressivi', cat: 'strength' },
          { text: 'Sprint e accelerazioni laterali prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  hipflexor: {
    relatedInjuries: ['groin', 'quad'], relatedReason: 'Il flessore dell\'anca lavora a stretto contatto con adduttori e quadricipite nel gesto del calcio.',
    label: 'Stiramento flessore dell\'anca', subtitle: 'Ileopsoas, gesto del calcio', icon: Compass, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 24], totalEstimateDays: 42 },
      severo: { dayThresholds: [18, 49], totalEstimateDays: 120 },
    },
    phases: [
      { name: 'Protezione', why: 'Il flessore dell\'anca è il muscolo principale nel gesto del calcio al pallone: dopo uno stiramento serve ridurre quel movimento nei primi giorni.',
        exercises: [
          { text: 'Riduci calci e movimenti di flessione dell\'anca ripetuti', cat: 'rest' },
          { text: 'Isometria leggera: solleva il ginocchio verso il petto contro una leggera resistenza (tenuta 15-20 secondi, 4-5 volte)', cat: 'hold' },
          { text: 'Cammino nei limiti del dolore', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce gradualmente il movimento di flessione dell\'anca sotto carico controllato.',
        criteriaToAdvance: ['Riesci a camminare senza dolore evidente', 'L\'isometria leggera non scatena dolore acuto'],
        exercises: [
          { text: 'Rinforzo progressivo del flessore dell\'anca con elastico (2-3 serie da 12-15)', cat: 'strength' },
          { text: 'Stretching dolce, mai forzato', cat: 'stretch' },
          { text: 'Esercizi di stabilità del bacino (2-3 serie da 30-45 secondi)', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Il calcio al pallone e lo sprint richiedono al flessore dell\'anca di lavorare velocemente: va riportato a tollerare quella velocità gradualmente.',
        criteriaToAdvance: ['Riesci a fare il rinforzo con elastico senza dolore significativo', 'Nessun peggioramento il giorno dopo'],
        exercises: [
          { text: 'Calci a bassa intensità, poi progressivi', cat: 'strength' },
          { text: 'Corsa progressiva con affondo del ginocchio', cat: 'run' },
          { text: 'Sprint e cambi di ritmo prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  piriformis: {
    relatedInjuries: ['lowback', 'trochanteric'], relatedReason: 'Piriforme, lombare e anca esterna sono strettamente collegati nella stabilità del bacino.',
    label: 'Sindrome del piriforme', subtitle: 'Muscolo dei glutei, spesso confuso con la lombalgia', icon: CircleDashed, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [7, 14], totalEstimateDays: 28 },
      moderato: { dayThresholds: [14, 28], totalEstimateDays: 56 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Il muscolo piriforme, quando irritato, può comprimere il nervo sciatico e dare dolore che scende lungo la gamba — spesso viene scambiato per un problema lombare. Nei primi giorni si riduce quello che scatena il dolore, senza fermarsi del tutto.',
        exercises: [
          { text: 'Riduci temporaneamente stare seduto a lungo o correre se scatenano dolore', cat: 'rest' },
          { text: 'Stretching dolce: da sdraiato, porta il ginocchio verso il petto e leggermente verso il lato opposto (tenuta 20-30 secondi, 3-4 volte)', cat: 'stretch' },
          { text: 'Ghiaccio nei momenti più dolorosi', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Il rinforzo dei glutei e la mobilità dell\'anca aiutano a scaricare il piriforme dal lavoro eccessivo che spesso lo irrita.',
        criteriaToAdvance: ['Il dolore che scende lungo la gamba è chiaramente diminuito', 'Riesci a stare seduto per periodi normali senza dolore che peggiora'],
        exercises: [
          { text: 'Rinforzo del gluteo medio con elastico (2-3 serie da 15 per lato)', cat: 'strength' },
          { text: 'Stretching della muscolatura glutea e dell\'anca', cat: 'stretch' },
          { text: 'Auto-massaggio con pallina o rullo sulla zona, se tollerato', cat: 'stretch' },
        ] },
      { name: 'Ritorno allo sport', why: 'Corsa e cambi di direzione vanno reintrodotti gradualmente, mantenendo il rinforzo dei glutei per evitare che il piriforme torni a sovraccaricarsi.',
        criteriaToAdvance: ['Riesci a correre leggero senza dolore che scende lungo la gamba', 'Nessun peggioramento dopo attività quotidiane più intense'],
        exercises: [
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Cambi di direzione graduali', cat: 'run' },
          { text: 'Mantieni il rinforzo dei glutei anche dopo la scomparsa del dolore, per prevenire ricadute', cat: 'strength' },
        ] },
    ],
  },
  trochanteric: {
    relatedInjuries: ['knee', 'itband'], relatedReason: 'Un gluteo medio debole non stabilizza solo l\'anca: si ripercuote fino al ginocchio.',
    label: 'Borsite trocanterica', subtitle: 'Fianco esterno, dolore da sdraiato su un lato', icon: Target, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 84 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'La borsa che protegge l\'anca esterna si infiamma per attrito ripetuto. Ridurre temporaneamente le posizioni che comprimono la zona (stare sdraiati su quel lato, stare a lungo in piedi) aiuta a calmarla.',
        exercises: [
          { text: 'Evita di dormire sul lato dolente per qualche notte', cat: 'rest' },
          { text: 'Riduci temporaneamente corsa e scale se scatenano dolore', cat: 'rest' },
          { text: 'Ghiaccio sulla zona esterna dell\'anca, a intervalli', cat: 'rest' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo del gluteo medio è centrale: un\'anca debole in quella zona fa lavorare di più la borsa a ogni passo.',
        criteriaToAdvance: ['Riesci a stare sdraiato sul fianco senza dolore acuto', 'Il dolore camminando è chiaramente diminuito'],
        exercises: [
          { text: 'Rinforzo del gluteo medio: sollevamento gamba laterale (2-3 serie da 15 per lato)', cat: 'strength' },
          { text: 'Stretching della banda ileotibiale', cat: 'stretch' },
          { text: 'Cammino su superficie piana, aumenta gradualmente la distanza', cat: 'rest' },
        ] },
      { name: 'Ritorno allo sport', why: 'Corsa e salti vanno reintrodotti con calma, mantenendo il rinforzo dell\'anca per evitare che il sovraccarico si ripresenti.',
        criteriaToAdvance: ['Riesci a correre leggero senza dolore sul fianco', 'Nessun dolore dopo attività quotidiane più intense'],
        exercises: [
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Salti e cambi di direzione introdotti per ultimi', cat: 'run' },
          { text: 'Mantieni il rinforzo del gluteo medio anche dopo la scomparsa del dolore', cat: 'strength' },
        ] },
    ],
  },
  lcl: {
    relatedInjuries: ['mcl', 'meniscus'], relatedReason: 'Come il collaterale mediale, lavora insieme al menisco per stabilizzare il ginocchio nei movimenti laterali.',
    label: 'Distorsione collaterale laterale', subtitle: 'Legamento esterno del ginocchio', icon: ShieldAlert, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [7, 18], totalEstimateDays: 35 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 70 },
      severo: { dayThresholds: [21, 49], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Protezione', why: 'Il legamento collaterale laterale stabilizza il ginocchio contro le sollecitazioni verso l\'interno. Rispetto al collaterale mediale è meno comune ma tende a essere seguito più da vicino: se senti instabilità vera, non solo dolore, vale la pena farlo controllare presto.',
        exercises: [
          { text: 'Cammino nei limiti del dolore, evita torsioni', cat: 'rest' },
          { text: 'Elevazione della gamba quando possibile', cat: 'rest' },
          { text: 'Contrazioni isometriche leggere del quadricipite (tenuta 20-30 secondi, 3-4 volte)', cat: 'hold' },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce movimento e carico controllato, senza ancora sollecitare il ginocchio con stress verso l\'interno.',
        criteriaToAdvance: ['Riesci a camminare senza sensazione di cedimento del ginocchio', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: 'Squat controllati in range limitato (2-3 serie da 10)', cat: 'strength' },
          { text: 'Rinforzo di quadricipite e ischiocrurali (2-3 serie da 12)', cat: 'strength' },
          { text: 'Equilibrio su una gamba sola, senza torsioni', cat: 'balance' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare ai contrasti e ai cambi di direzione, il ginocchio deve tollerare stress laterali senza cedere.',
        criteriaToAdvance: ['Riesci a fare squat senza dolore sul lato esterno del ginocchio', 'Nessuna instabilità percepita nei movimenti quotidiani'],
        exercises: [
          { text: 'Cambi di direzione progressivi, partendo da angoli ampi', cat: 'run' },
          { text: 'Corsa con curve controllate', cat: 'run' },
          { text: 'Contatti leggeri e contrasti controllati prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  cramps: {
    label: 'Crampi muscolari', subtitle: 'Contrazione improvvisa e dolorosa, spesso a fine partita', icon: RotateCw, mechanismTags: ['overuse'],
    symptoms: [
      'Contrazione improvvisa e involontaria del muscolo, spesso dolorosa',
      'Il muscolo si sente "duro" al tatto durante l\'episodio',
      'Capita più spesso verso la fine della partita o con caldo intenso',
      'Passa nel giro di minuti, a differenza di uno strappo vero',
    ],
    severityData: {
      lieve: { dayThresholds: [1, 2], totalEstimateDays: 3 },
      moderato: { dayThresholds: [1, 3], totalEstimateDays: 5 },
      severo: { dayThresholds: [2, 5], totalEstimateDays: 10 },
    },
    phases: [
      { name: 'Gestione immediata', why: 'Un crampo è una contrazione muscolare involontaria, spesso legata a fatica, disidratazione o squilibrio di sali minerali — non è un danno strutturale come uno strappo, ma va gestito subito senza forzare il muscolo mentre è contratto.',
        exercises: [
          { text: 'Stretching dolce e prolungato del muscolo colpito', cat: 'stretch' },
          { text: 'Massaggio leggero della zona', cat: 'stretch' },
          { text: 'Idratazione, possibilmente con acqua e sali minerali', cat: 'rest' },
        ] },
      { name: 'Nelle ore successive', why: 'Dopo un crampo il muscolo può restare leggermente indolenzito — è normale, ma vale la pena andarci piano prima di tornare a sforzi intensi.',
        criteriaToAdvance: ['Il muscolo non è più dolente al tocco', 'Riesci a muoverti normalmente senza tensione residua'],
        exercises: [
          { text: 'Stretching leggero, senza forzare', cat: 'stretch' },
          { text: 'Cammino normale, attività leggera', cat: 'rest' },
          { text: 'Reintegra liquidi e sali minerali nelle ore successive', cat: 'rest' },
        ] },
      { name: 'Prevenzione per la prossima volta', why: 'I crampi spesso si ripetono se non si affronta la causa — quasi sempre una combinazione di fatica, caldo, e idratazione insufficiente nei giorni prima della partita, non solo durante.',
        criteriaToAdvance: ['Ti senti completamente normale, nessuna tensione residua'],
        exercises: [
          { text: 'Idratati regolarmente nei giorni prima della partita, non solo durante', cat: 'rest' },
          { text: 'Rinforzo e stretching regolare dei muscoli più soggetti', cat: 'strength' },
          { text: 'Attenzione al carico di allenamento nei giorni caldi', cat: 'rest' },
        ] },
    ],
  },
  blisters: {
    label: 'Vesciche', subtitle: 'Lesione da attrito sulla pelle, comune con scarpe nuove', icon: Circle, mechanismTags: ['overuse'],
    symptoms: [
      'Zona arrossata e dolorante, spesso su tallone o dita',
      'Può formarsi una bolla piena di liquido chiaro',
      'Capita più spesso con scarpe nuove o non allacciate bene',
      'Il dolore è localizzato alla pelle, non all\'articolazione o al muscolo',
    ],
    severityData: {
      lieve: { dayThresholds: [1, 2], totalEstimateDays: 3 },
      moderato: { dayThresholds: [2, 4], totalEstimateDays: 7 },
      severo: { dayThresholds: [3, 7], totalEstimateDays: 14 },
    },
    phases: [
      { name: 'Protezione immediata', why: 'Una vescica è una lesione superficiale della pelle causata da attrito ripetuto — l\'importante è proteggerla ed evitare che si rompa in modo scoperto, per non rischiare infezioni.',
        exercises: [
          { text: 'Copri con un cerotto specifico o una benda, senza stringere troppo', cat: 'rest' },
          { text: 'Evita di forare la vescica se non necessario', cat: 'rest' },
          { text: 'Cambia le calzature se sono la causa, quando possibile', cat: 'rest' },
        ] },
      { name: 'Nei giorni successivi', why: 'La pelle guarisce da sola in pochi giorni se protetta bene — il rischio vero è l\'infezione, non il dolore in sé.',
        criteriaToAdvance: ['La zona non è più arrossata o infiammata', 'Nessun segno di infezione: pus, calore, rossore che si allarga'],
        exercises: [
          { text: 'Mantieni la zona pulita e coperta', cat: 'rest' },
          { text: 'Osserva segni di infezione: rossore che si allarga, calore, pus', cat: 'rest' },
          { text: 'Usa calzature comode finché non guarisce', cat: 'rest' },
        ] },
      { name: 'Prevenzione', why: 'Le vesciche si ripetono facilmente se non si cambia qualcosa — scarpe, calze, o la zona di attrito.',
        criteriaToAdvance: ['La pelle è guarita completamente'],
        exercises: [
          { text: 'Prova calze tecniche senza cuciture spesse', cat: 'rest' },
          { text: 'Rodaggio graduale delle scarpe nuove, non usarle subito per una partita intera', cat: 'rest' },
          { text: 'Cerotti preventivi sulle zone più soggette, se sai già dove', cat: 'rest' },
        ] },
    ],
  },
  lowback: {
    relatedInjuries: ['hamstring', 'piriformis'], relatedReason: 'Zona lombare, glutei e hamstring si sostengono a vicenda nella stabilità del bacino.',
    label: 'Lombalgia muscolare', subtitle: 'Dolore lombare meccanico, senza sintomi alla gamba', icon: PersonStanding, mechanismTags: ['acute', 'overuse'],
    severityData: {
      lieve: { dayThresholds: [5, 14], totalEstimateDays: 28 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 56 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 140 },
    },
    specialRedFlags: [
      'Dolore che si irradia sotto il ginocchio, con formicolio o intorpidimento alla gamba o al piede',
      'Perdita di forza in una gamba, o difficoltà a camminare sui talloni o sulle punte',
      'Intorpidimento nella zona genitale, o difficoltà a controllare vescica o intestino: cerca attenzione medica immediata',
      'Febbre associata al mal di schiena, o storia recente di trauma significativo',
      'Dolore che non migliora per niente restando a riposo, specialmente di notte',
    ],
    phases: [
      { name: 'Protezione', why: 'Nella fase acuta il dolore lombare migliora più in fretta restando leggermente attivi, piuttosto che con riposo a letto prolungato: il riposo totale rallenta il recupero più di quanto lo aiuti.',
        exercises: [
          { text: 'Cammina a passo leggero più volte al giorno, quanto tollerato', cat: 'rest' },
          { text: 'Evita di stare seduto o a letto per periodi troppo lunghi: alterna le posizioni', cat: 'rest' },
          { text: 'Mobilità lombare dolce da sdraiato (flessione/estensione del bacino), senza forzare', cat: 'stretch' },
        ] },
      { name: 'Recupero attivo', why: 'Il rinforzo del core e della muscolatura lombare aiuta a stabilizzare la colonna e riduce il rischio di episodi futuri — è la parte che fa la differenza nel lungo periodo, più della fase acuta stessa.',
        criteriaToAdvance: ['Riesci a stare seduto o in piedi per periodi normali senza dolore che peggiora', 'Riesci a fare la mobilità dolce senza dolore acuto'],
        exercises: [
          { text: 'Plank a ginocchia appoggiate, poi progressione a plank completo (2-3 serie da 20-30 secondi)', cat: 'strength' },
          { text: 'Bird-dog: da carponi, estendi braccio e gamba opposti (2-3 serie da 8-10 per lato)', cat: 'strength' },
          { text: 'Stretching dolce di ischiocrurali e flessori dell\'anca', cat: 'stretch' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a scatti, contrasti e cambi di direzione, la colonna deve tollerare carichi asimmetrici e rotazioni senza scatenare dolore.',
        criteriaToAdvance: ['Riesci a fare rinforzo del core senza dolore lombare', 'Nessun peggioramento dopo attività quotidiane più intense'],
        exercises: [
          { text: 'Rinforzo progressivo del core con esercizi rotazionali controllati', cat: 'strength' },
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Cambi di direzione e contrasti controllati prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
};
const injuriesDataEN = {
  ankle: {
    relatedInjuries: ['calf', 'knee'], relatedReason: 'An unstable ankle makes the calf and knee work harder to compensate for balance.',
    label: 'Ankle sprain', subtitle: 'Ankle ligaments', icon: Footprints, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [4, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [7, 21], totalEstimateDays: 42 },
      severo: { dayThresholds: [14, 45], totalEstimateDays: 140 },
    },
    phases: [
      { name: 'Protection', why: 'In the first few days the ligament is inflamed. The goal is to protect the tissue and reduce swelling, not to actively rehab it yet.',
        exercises: [
          { text: 'Ankle alphabet: draw the letters by moving your foot, no weight-bearing', cat: 'stretch' },
          { text: 'Elevate the leg when possible', cat: 'rest' },
          { text: 'Walk only within pain limits (crutches in the first days if needed)', cat: 'rest' },
          { text: 'Light isometric contractions: push your foot against a fixed resistance (hold 20-30 seconds, 3-4 times)', cat: 'hold' },
        ] },
      { name: 'Active recovery', why: 'The ligament starts tolerating progressive load. Here the focus is strength and proprioception: the ankle\'s sense of balance, often the key factor in not getting hurt again.',
        criteriaToAdvance: ['You can walk without an obvious limp', 'Swelling has clearly gone down compared to the first days'],
        exercises: [
          { text: 'Single-leg balance, 30 seconds (then eyes closed if comfortable)', cat: 'balance' },
          { text: 'Resistance band work in all directions (2-3 sets of 12-15 per direction)', cat: 'strength' },
          { text: 'Bodyweight calf raises (3 sets of 12-15, increase if pain-free)', cat: 'strength' },
          { text: 'Walking on slightly unstable surfaces', cat: 'balance' },
        ] },
      { name: 'Return to play', why: 'Before returning to running and kicking, the ankle needs to tolerate sudden loads and changes of direction without giving way.',
        criteriaToAdvance: ['You can balance on one leg for 10+ seconds without pain', 'You can do calf raises without sharp pain'],
        exercises: [
          { text: 'Light straight-line running', cat: 'run' },
          { text: 'Gradual changes of direction', cat: 'run' },
          { text: 'Two-leg jumps, then single-leg', cat: 'strength' },
          { text: 'Light dribbling before returning to group training', cat: 'run' },
        ] },
    ],
  },
  achilles: {
    relatedInjuries: ['calf', 'plantarfasciitis'], relatedReason: 'The Achilles, calf, and plantar fascia share the same muscle-tendon system of the foot.',
    label: 'Achilles tendinopathy', subtitle: 'Achilles tendon, often from overuse', icon: Anchor, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 56], totalEstimateDays: 98 },
      severo: { dayThresholds: [28, 84], totalEstimateDays: 240 },
    },
    phases: [
      { name: 'Load reduction', why: 'Tendons respond poorly to total rest but get worse with excessive repeated load (jumps, sprints). The goal is finding the load level that\'s tolerated without pain that persists the next day.',
        exercises: [
          { text: 'Temporarily cut back on jumps, sprints, and stairs if they trigger lasting pain', cat: 'rest' },
          { text: 'Walk normally if well tolerated', cat: 'rest' },
          { text: 'Isometrics: rise slightly onto your toes and hold the position (30-45 seconds, 4-5 times)', cat: 'hold' },
        ] },
      { name: 'Progressive strengthening', why: 'Eccentric strengthening (lengthening the tendon under load) has the strongest scientific evidence for tendons, but needs to be introduced gradually.',
        criteriaToAdvance: ['You can walk normally with no pain at rest', 'Pain during daily activities stays mild'],
        exercises: [
          { text: 'Eccentric calf raises: rise on two legs, lower slowly on one (3 sets of 10-15)', cat: 'strength' },
          { text: 'Gradually increase load and reps week by week', cat: 'strength' },
          { text: 'Gentle calf stretching, without forcing it', cat: 'stretch' },
        ] },
      { name: 'Return to sport', why: 'Even without pain, the tendon might not yet be ready for repeated sprints and jumps: more than anywhere else, don\'t rush this stage.',
        criteriaToAdvance: ['You can do two-leg calf raises without significant pain', 'Pain the day after training doesn\'t get worse'],
        exercises: [
          { text: 'Progressive running, calmly increasing distance and intensity', cat: 'run' },
          { text: 'Jumps and changes of direction introduced last', cat: 'strength' },
          { text: 'Return to full training only if stable and pain-free for 1-2 weeks', cat: 'run' },
        ] },
    ],
  },
  knee: {
    relatedInjuries: ['trochanteric', 'quad'], relatedReason: 'A weak hip, especially the glute medius, is among the most common causes of patellofemoral pain.',
    label: 'Patellofemoral pain', subtitle: 'Pain at the front of the knee', icon: CircleDot, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 35 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 70 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Load reduction', why: 'This is often overuse rather than a single trauma. First you figure out which movements trigger the pain (jumps, stairs, deep squats) and reduce them, without stopping everything.',
        exercises: [
          { text: 'Temporarily cut back on jumps and stairs if they trigger pain', cat: 'rest' },
          { text: 'Keep up well-tolerated activity (light cycling is often fine)', cat: 'rest' },
          { text: 'Wall-sit isometric squat, short duration (20-30 seconds, 3-4 times)', cat: 'hold' },
        ] },
      { name: 'Progressive strengthening', why: 'Strengthening BOTH the quadriceps and the hip/glutes is central — the hip is often overlooked but is highly relevant.',
        criteriaToAdvance: ['You can go up/down stairs with mild or no pain', 'The wall-sit isometric doesn\'t trigger sharp pain'],
        exercises: [
          { text: 'Controlled squats, gradually increase depth (2-3 sets of 10-12)', cat: 'strength' },
          { text: 'Shallow step-ups (2-3 sets of 10-12 per leg)', cat: 'strength' },
          { text: 'Hip abductor and glute medius strengthening (2-3 sets of 15)', cat: 'strength' },
          { text: 'Partial-range leg press if available (3 sets of 10-12)', cat: 'strength' },
        ] },
      { name: 'Return to sport', why: 'Jumps and changes of direction should be reintroduced gradually, keeping up the strengthening work even after the pain is gone to avoid relapse.',
        criteriaToAdvance: ['You can do mid-depth squats without significant pain', 'No worsening of pain the day after training'],
        exercises: [
          { text: 'Controlled jumps and landings', cat: 'run' },
          { text: 'Progressive changes of direction', cat: 'run' },
          { text: 'Progressive running up to match intensity', cat: 'run' },
        ] },
    ],
  },
  mcl: {
    relatedInjuries: ['lcl', 'meniscus'], relatedReason: 'The knee\'s ligaments and cartilage work together: a single trauma often involves more than one structure.',
    label: 'MCL sprain', subtitle: 'Inner knee ligament', icon: ShieldCheck, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 21], totalEstimateDays: 35 },
      severo: { dayThresholds: [21, 42], totalEstimateDays: 84 },
    },
    phases: [
      { name: 'Protection', why: 'The medial collateral ligament stabilizes the knee during sideways movement. In the first days it needs protecting from lateral stress.',
        exercises: [
          { text: 'Walk within pain limits, avoid twisting and sudden lateral movement', cat: 'rest' },
          { text: 'Elevate the leg when possible', cat: 'rest' },
          { text: 'Light isometric quad contractions (hold 20-30 seconds, 3-4 times)', cat: 'hold' },
        ] },
      { name: 'Active recovery', why: 'Movement and controlled load are reintroduced, without yet stressing the knee with significant lateral force.',
        criteriaToAdvance: ['You can walk without a feeling of the knee giving way', 'Swelling has clearly gone down'],
        exercises: [
          { text: 'Controlled squats in a limited range (2-3 sets of 10)', cat: 'strength' },
          { text: 'Quadriceps and hamstring strengthening (2-3 sets of 12)', cat: 'strength' },
          { text: 'Single-leg balance, no twisting', cat: 'balance' },
        ] },
      { name: 'Return to play', why: 'Before returning to tackles and changes of direction, the knee must tolerate lateral stress without giving way.',
        criteriaToAdvance: ['You can squat without pain on the inner side of the knee', 'No instability felt during daily movement'],
        exercises: [
          { text: 'Progressive changes of direction, starting from wide angles', cat: 'run' },
          { text: 'Running with controlled curves', cat: 'run' },
          { text: 'Light contact and controlled tackles before returning to group training', cat: 'run' },
        ] },
    ],
  },
  patellar: {
    relatedInjuries: ['quad', 'knee'], relatedReason: 'The patellar tendon is a continuation of the quadriceps: a weak quadriceps loads it directly.',
    label: 'Patellar tendinopathy', subtitle: '"Jumper\'s knee"', icon: Disc, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 90 },
      severo: { dayThresholds: [28, 84], totalEstimateDays: 220 },
    },
    phases: [
      { name: 'Load reduction', why: 'Like any tendon, the patellar tendon gets worse with repeated jumping but doesn\'t like total rest either. The goal is finding the activity level that leaves no pain the next day.',
        exercises: [
          { text: 'Temporarily cut back on jumps and stairs if they trigger lasting pain', cat: 'rest' },
          { text: 'Keep up low-impact activity if tolerated (light cycling)', cat: 'rest' },
          { text: 'Quad isometrics: wall-sit squat (30-45 seconds, 4-5 times)', cat: 'hold' },
        ] },
      { name: 'Progressive strengthening', why: 'Quadriceps strengthening, especially with slow, controlled exercises, is central to getting the tendon to tolerate load again.',
        criteriaToAdvance: ['Pain at rest is absent or minimal', 'The wall-sit isometric doesn\'t trigger sharp pain'],
        exercises: [
          { text: 'Slow, controlled squats, gradually increase load (3 sets of 8-10, lower slowly over 3-4 seconds)', cat: 'strength' },
          { text: 'Partial-range leg extension if available (3 sets of 10-12)', cat: 'strength' },
          { text: 'Controlled step-downs, lower slowly from a step (2-3 sets of 8-10 per leg)', cat: 'strength' },
        ] },
      { name: 'Return to sport', why: 'Jumps and landings should be reintroduced last: they\'re the movements that load the patellar tendon the most.',
        criteriaToAdvance: ['You can do mid-depth squats without significant pain', 'No worsening of pain the day after'],
        exercises: [
          { text: 'Controlled two-leg jumps, then single-leg', cat: 'strength' },
          { text: 'Progressive running', cat: 'run' },
          { text: 'Full training only after 1-2 weeks stable and pain-free', cat: 'run' },
        ] },
    ],
  },
  meniscus: {
    relatedInjuries: ['mcl', 'lcl'], relatedReason: 'Knee twists often involve the meniscus and the collateral ligaments together.',
    label: 'Meniscus tear', subtitle: 'Knee cartilage, often from twisting', icon: Aperture, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 90 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    specialRedFlags: [
      'The knee locks and you can\'t fully straighten it',
      'The knee suddenly gives way during movement',
      'You feel a repeated painful catch or click during movement',
    ],
    phases: [
      { name: 'Load reduction', why: 'After a knee twist with possible meniscus involvement, the first days are for calming inflammation and avoiding movements that trigger pain.',
        exercises: [
          { text: 'Temporarily cut back on twisting, deep squats, and crouching', cat: 'rest' },
          { text: 'Walk within pain limits', cat: 'rest' },
          { text: 'Light isometric quad contractions (hold 20-30 seconds, 3-4 times)', cat: 'hold' },
        ] },
      { name: 'Progressive strengthening', why: 'Strengthening the quadriceps and surrounding muscles helps stabilize the knee and better distribute load on the remaining cartilage.',
        criteriaToAdvance: ['You can fully bend and straighten the knee without locking', 'No feeling of giving way during daily movement'],
        exercises: [
          { text: 'Controlled squats in a limited, pain-free range (2-3 sets of 10-12)', cat: 'strength' },
          { text: 'Hamstring strengthening', cat: 'strength' },
          { text: 'Single-leg balance', cat: 'balance' },
        ] },
      { name: 'Return to sport', why: 'Changes of direction and twisting should be reintroduced last: they\'re the movements that load the meniscus the most.',
        criteriaToAdvance: ['You can do full squats without pain or locking', 'No swelling after more intense activity'],
        exercises: [
          { text: 'Progressive running', cat: 'run' },
          { text: 'Gradual changes of direction', cat: 'run' },
          { text: 'Controlled tackles and twisting before returning to group training', cat: 'run' },
        ] },
    ],
  },
  itband: {
    relatedInjuries: ['trochanteric', 'knee'], relatedReason: 'The IT band connects the hip and knee: a weak glute overloads it along its whole length.',
    label: 'IT band syndrome', subtitle: 'Outer knee pain, from overuse', icon: Ruler, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 77 },
      severo: { dayThresholds: [30, 70], totalEstimateDays: 160 },
    },
    phases: [
      { name: 'Load reduction', why: 'The iliotibial band runs along the outside of the thigh down to the knee: overuse pain gets worse with repeated running, especially downhill.',
        exercises: [
          { text: 'Temporarily cut back on running, especially downhill, if it triggers lasting pain', cat: 'rest' },
          { text: 'Replace with low-impact activity if tolerated (cycling with a high saddle)', cat: 'rest' },
          { text: 'Light massage or foam roller on the outer thigh, if available', cat: 'stretch' },
        ] },
      { name: 'Progressive strengthening', why: 'Hip strengthening, especially the glute medius, is central: weakness here is among the most common causes of this type of pain.',
        criteriaToAdvance: ['You can walk without pain on the outer side of the knee', 'Light flat running doesn\'t trigger sharp pain'],
        exercises: [
          { text: 'Glute medius strengthening: clamshells or lateral raises (2-3 sets of 15)', cat: 'strength' },
          { text: 'Controlled single-leg squat, limited range (2-3 sets of 8-10)', cat: 'strength' },
          { text: 'Gentle stretching of the outer thigh band', cat: 'stretch' },
        ] },
      { name: 'Return to running', why: 'Downhills and changes of direction should be reintroduced last: they\'re the movements that load the IT band the most.',
        criteriaToAdvance: ['You can run on flat ground without pain during or after', 'No pain the day after a longer session'],
        exercises: [
          { text: 'Progressive flat running, then gently introduce downhills', cat: 'run' },
          { text: 'Gradual changes of direction', cat: 'run' },
          { text: 'Return to full training only after stable, pain-free running', cat: 'run' },
        ] },
    ],
  },
  osgood: {
    relatedInjuries: ['patellar', 'quad'], relatedReason: 'Osgood-Schlatter involves the same patellar tendon and quadriceps, during a more sensitive growth phase.',
    label: 'Osgood-Schlatter', subtitle: 'Pain below the knee, typical during growth', icon: Sprout, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [14, 28], totalEstimateDays: 56 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 98 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Load reduction', why: 'Osgood-Schlatter is inflammation where the patellar tendon attaches to the shin bone, typical during growth. It\'s not a serious injury, but it does require load management.',
        exercises: [
          { text: 'Temporarily cut back on jumps and sprints if they trigger lasting pain', cat: 'rest' },
          { text: 'Apply ice after activity if pain is present', cat: 'rest' },
          { text: 'Gentle quadriceps stretching', cat: 'stretch' },
        ] },
      { name: 'Progressive strengthening', why: 'Controlled quadriceps strengthening, avoiding excessive load on the patellar tendon, helps tolerate sport activity better in the meantime.',
        criteriaToAdvance: ['Pain during daily activities is mild or absent', 'You can stretch the quadriceps without sharp pain'],
        exercises: [
          { text: 'Isometric quadriceps strengthening (2-3 sets of 20-30 seconds)', cat: 'hold' },
          { text: 'Controlled squats in a limited, pain-free range (2-3 sets of 10)', cat: 'strength' },
          { text: 'Daily quadriceps and hamstring stretching', cat: 'stretch' },
        ] },
      { name: 'Managing return to play', why: 'The realistic goal is managing symptoms during sport, not eliminating them entirely until growth is complete.',
        criteriaToAdvance: ['You can train without pain that gets worse in the following days', 'Pain no longer appears at rest'],
        exercises: [
          { text: 'Running and jumping reintroduced gradually, monitoring the response the next day', cat: 'run' },
          { text: 'Temporarily reduce activity during periods of more acute pain', cat: 'rest' },
          { text: 'Talk to a physiotherapist if pain often limits activity', cat: 'rest' },
        ] },
    ],
  },
  hamstring: {
    relatedInjuries: ['lowback', 'piriformis'], relatedReason: 'Hamstrings, glutes, and lower back form the posterior chain: weakness here affects the others.',
    label: 'Hamstring strain', subtitle: 'Back of the thigh', icon: Zap, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 49 },
      severo: { dayThresholds: [21, 60], totalEstimateDays: 130 },
    },
    phases: [
      { name: 'Protection', why: 'The muscle has a micro-tear. It needs calming the inflammation and avoiding excessive stretching, which could make the tear worse.',
        exercises: [
          { text: 'Light walking within pain limits', cat: 'rest' },
          { text: 'Light isometric: seated, press your heel into the floor (hold 20-30 seconds, 3-4 times)', cat: 'hold' },
          { text: 'Avoid aggressive stretching during these days', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Hamstrings have the highest re-injury rate of any muscle strain if the return is rushed. Load and stretching are reintroduced gradually.',
        criteriaToAdvance: ['You can walk without limping', 'The light isometric doesn\'t trigger sharp pain'],
        exercises: [
          { text: 'Assisted Nordic curl, limited range at first (2-3 sets of 5-6)', cat: 'strength' },
          { text: 'Glute/hamstring bridge (3 sets of 12-15)', cat: 'strength' },
          { text: 'Gentle, progressive stretching, never to sharp pain', cat: 'stretch' },
          { text: 'Light eccentric strengthening', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Hamstrings work at high speed when sprinting: they need to be brought back to tolerating that speed gradually.',
        criteriaToAdvance: ['You can do the glute bridge without pain', 'Gentle stretching only causes normal tension, not sharp pain'],
        exercises: [
          { text: 'Light jog → medium running → 70% sprint → full sprint', cat: 'run' },
          { text: 'Controlled accelerations and decelerations', cat: 'run' },
          { text: '100% sprint pain-free before returning to a match', cat: 'run' },
        ] },
    ],
  },
  quad: {
    relatedInjuries: ['patellar', 'knee'], relatedReason: 'An overloaded or weak quadriceps directly affects the patellar tendon and kneecap.',
    label: 'Quad strain', subtitle: 'Front of the thigh', icon: TrendingUp, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [4, 9], totalEstimateDays: 18 },
      moderato: { dayThresholds: [9, 24], totalEstimateDays: 42 },
      severo: { dayThresholds: [18, 49], totalEstimateDays: 110 },
    },
    phases: [
      { name: 'Protection', why: 'Like any muscle strain, the first days are for calming inflammation and avoiding excessive stretching.',
        exercises: [
          { text: 'Light walking within pain limits', cat: 'rest' },
          { text: 'Light quadriceps isometric, no movement (hold 20-30 seconds, 3-4 times)', cat: 'hold' },
          { text: 'Avoid kicking and sprinting during these days', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Load and controlled stretching of the quadriceps are gradually reintroduced.',
        criteriaToAdvance: ['You can walk without limping', 'The quadriceps isometric doesn\'t trigger sharp pain'],
        exercises: [
          { text: 'Controlled squats in a limited range, increase gradually (2-3 sets of 10-12)', cat: 'strength' },
          { text: 'Gentle stretching, never to sharp pain', cat: 'stretch' },
          { text: 'Progressive strengthening with light resistance (2-3 sets of 12-15)', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'The quadriceps is central to every kick and sprint: it needs to be brought back to tolerating that effort gradually.',
        criteriaToAdvance: ['You can squat in a limited range without significant pain', 'No worsening the day after training'],
        exercises: [
          { text: 'Progressive running', cat: 'run' },
          { text: 'Low-intensity kicks, then progressive', cat: 'strength' },
          { text: 'Changes of pace before returning to group training', cat: 'run' },
        ] },
    ],
  },
  contusion: {
    relatedInjuries: ['quad', 'hamstring'], relatedReason: 'A contusion can temporarily weaken nearby muscles: worth keeping an eye on them.',
    label: 'Muscle contusion', subtitle: 'Contact trauma (e.g. kick/knee)', icon: Shield, mechanismTags: ['contact'],
    severityData: {
      lieve: { dayThresholds: [3, 7], totalEstimateDays: 14 },
      moderato: { dayThresholds: [5, 14], totalEstimateDays: 28 },
      severo: { dayThresholds: [10, 28], totalEstimateDays: 84 },
    },
    phases: [
      { name: 'Protection', why: 'Unlike a strain, here the damage comes from a direct blow. In the first days the goal is limiting internal bleeding, not massaging or stretching the area.',
        exercises: [
          { text: 'Interval icing in the first 24-48 hours, never directly on the skin', cat: 'rest' },
          { text: 'Avoid stretching and vigorous massage: they can worsen internal bleeding', cat: 'rest' },
          { text: 'Light walking if well tolerated', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Once the acute phase has passed, movement and load are gently reintroduced, never forcing through pain.',
        criteriaToAdvance: ['Acute swelling is stable or decreasing, not still increasing', 'You can move the nearby joint without sharp pain'],
        exercises: [
          { text: 'Gentle, progressive mobility of the affected area', cat: 'stretch' },
          { text: 'Light strengthening when pain allows (2 sets of 12-15)', cat: 'strength' },
          { text: 'Gentle stretching, never forced', cat: 'stretch' },
        ] },
      { name: 'Return to play', why: 'Significant thigh contusions carry a risk of myositis ossificans if the return is rushed.',
        criteriaToAdvance: ['You can gently stretch the area without sharp pain', 'Strength is returning, even if not complete yet'],
        exercises: [
          { text: 'Progressive running', cat: 'run' },
          { text: 'Light, controlled contact before returning to group training', cat: 'run' },
        ] },
    ],
  },
  calf: {
    relatedInjuries: ['achilles', 'ankle'], relatedReason: 'The calf, Achilles, and ankle share the same push-off mechanism when running.',
    label: 'Calf strain', subtitle: 'Gastrocnemius/soleus', icon: Activity, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 42 },
      severo: { dayThresholds: [21, 60], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Protection', why: 'Like any strain, the first days are for calming inflammation. Sprinting and jumping should be avoided: that\'s exactly where the calf works.',
        exercises: [
          { text: 'Light walking within pain limits', cat: 'rest' },
          { text: 'Light isometric: press the ball of your foot against resistance, without moving it (hold 20-30 seconds, 3-4 times)', cat: 'hold' },
          { text: 'Avoid sprinting and jumping during these days', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Load on the calf muscles is reintroduced progressively, first assisted then unassisted.',
        criteriaToAdvance: ['You can walk without limping', 'The light isometric doesn\'t trigger sharp pain'],
        exercises: [
          { text: 'Assisted calf raises with support, then unassisted (3 sets of 12-15)', cat: 'strength' },
          { text: 'Gentle calf stretching, never to sharp pain', cat: 'stretch' },
          { text: 'Walking on a slight incline', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'The calf is decisive in every sprint: it needs to be brought back to tolerating that effort before returning to group training.',
        criteriaToAdvance: ['You can do assisted calf raises without significant pain', 'No worsening the day after'],
        exercises: [
          { text: 'Progressive running: light jog → medium intensity → sprint', cat: 'run' },
          { text: 'Jumps on the spot, then moving', cat: 'strength' },
          { text: 'Controlled changes of pace before returning to group training', cat: 'run' },
        ] },
    ],
  },
  shinsplints: {
    relatedInjuries: ['calf', 'plantarfasciitis'], relatedReason: 'Shin splints, calf, and plantar fascia often share the same cause: running load increased too quickly.',
    label: 'Shin splints', subtitle: 'Pain along the shin, from overuse', icon: Gauge, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 70 },
      severo: { dayThresholds: [28, 70], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Load reduction', why: 'Overuse pain along the shin gets worse with repeated running impact. Temporarily reducing volume, without stopping completely, is the first step.',
        exercises: [
          { text: 'Temporarily reduce running volume and intensity if pain persists the next day', cat: 'rest' },
          { text: 'Replace part of training with low-impact activity (cycling, swimming) if tolerated', cat: 'rest' },
          { text: 'Gentle calf stretching', cat: 'stretch' },
        ] },
      { name: 'Progressive strengthening', why: 'Strengthening the lower leg muscles, especially the tibialis anterior and calf, helps absorb repeated impact better and reduces the risk of relapse.',
        criteriaToAdvance: ['No pain at rest', 'You can walk without pain worsening in the hours after'],
        exercises: [
          { text: 'Tibialis anterior strengthening: lifting the front of the foot (2-3 sets of 15-20)', cat: 'strength' },
          { text: 'Progressive calf raises (3 sets of 12-15)', cat: 'strength' },
          { text: 'Single-leg proprioceptive exercises', cat: 'balance' },
        ] },
      { name: 'Return to running', why: 'Running volume should be reintroduced very gradually: too rapid an increase is the most common cause of relapse in this injury.',
        criteriaToAdvance: ['You can run at low intensity without pain during or after', 'No pain the day after a longer session'],
        exercises: [
          { text: 'Progressive running, calmly increase weekly volume (no more than about 10%)', cat: 'run' },
          { text: 'Alternate soft surfaces when possible in the first weeks', cat: 'run' },
          { text: 'Return to full training only after stable, pain-free running', cat: 'run' },
        ] },
    ],
  },
  plantarfasciitis: {
    relatedInjuries: ['calf', 'achilles'], relatedReason: 'The plantar fascia is connected to the calf muscles: tension in the calf transmits down to the sole of the foot.',
    label: 'Plantar fasciitis', subtitle: 'Heel pain, typically worst with first steps', icon: Waves, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [14, 28], totalEstimateDays: 56 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 98 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Load reduction', why: 'The plantar fascia is irritated, typically most painful during the first steps in the morning. Temporarily reducing repeated impact helps calm the initial irritation.',
        exercises: [
          { text: 'Temporarily cut back on running and jumping if they trigger lasting pain', cat: 'rest' },
          { text: 'Gently roll a round object under your foot', cat: 'stretch' },
          { text: 'Calf stretching, often linked to fascia tension', cat: 'stretch' },
        ] },
      { name: 'Progressive strengthening', why: 'Strengthening the small foot muscles and the calf helps the plantar fascia tolerate load better.',
        criteriaToAdvance: ['First-step morning pain has clearly decreased', 'You can walk without significant pain'],
        exercises: [
          { text: 'Foot muscle strengthening: scrunch a towel with your toes (2-3 sets)', cat: 'strength' },
          { text: 'Progressive calf raises (3 sets of 12-15)', cat: 'strength' },
          { text: 'Stretch the fascia before getting out of bed in the morning', cat: 'stretch' },
        ] },
      { name: 'Return to sport', why: 'Running and jumping should be reintroduced gradually: the plantar fascia responds well to progressive load but poorly to sudden increases.',
        criteriaToAdvance: ['You can run lightly without pain during or after', 'No pain in the morning after training'],
        exercises: [
          { text: 'Progressive running on surfaces that aren\'t too hard', cat: 'run' },
          { text: 'Jumps and sprints introduced last', cat: 'run' },
          { text: 'Consider footwear with good arch support during recovery', cat: 'rest' },
        ] },
    ],
  },
  groin: {
    relatedInjuries: ['hipflexor', 'piriformis'], relatedReason: 'Adductors, hip flexors, and the piriformis work together in every kicking and running motion.',
    label: 'Groin strain / adductor strain', subtitle: 'Groin and adductors', icon: ArrowLeftRight, mechanismTags: ['acute', 'overuse'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 56 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 168 },
    },
    phases: [
      { name: 'Protection', why: 'The groin area is loaded on every kick and change of direction. It needs reducing the movements that trigger pain before trying to strengthen.',
        exercises: [
          { text: 'Reduce movements that trigger pain (kicks, sudden changes of direction)', cat: 'rest' },
          { text: 'Light isometric: lying down, gently squeeze a pillow between your knees (hold 15-20 seconds, 4-5 times)', cat: 'hold' },
          { text: 'Walk within pain limits', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Groin strains tend to become chronic if the return is rushed — this is among the injuries where patience matters most: strengthening should increase slowly, along with pelvic stability.',
        criteriaToAdvance: ['You can walk without noticeable pain', 'Light adductor isometrics don\'t trigger sharp pain'],
        exercises: [
          { text: 'Isometric adductor strengthening, increasing intensity (3-4 sets of 8-10 second holds)', cat: 'strength' },
          { text: 'Gentle adductor stretching', cat: 'stretch' },
          { text: 'Pelvic and core stability exercises (2-3 sets of 30-45 seconds)', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Kicking, sprinting, and lateral changes of direction should be reintroduced last: they\'re the movements that load this area the most.',
        criteriaToAdvance: ['You can do moderate-intensity isometric strengthening without pain', 'No worsening the day after — rushing here carries more risk'],
        exercises: [
          { text: 'Progressive changes of direction', cat: 'run' },
          { text: 'Low-intensity kicks, then progressive', cat: 'strength' },
          { text: 'Sprints and lateral accelerations before returning to group training', cat: 'run' },
        ] },
    ],
  },
  hipflexor: {
    relatedInjuries: ['groin', 'quad'], relatedReason: 'The hip flexor works closely with the adductors and quadriceps in the kicking motion.',
    label: 'Hip flexor strain', subtitle: 'Iliopsoas, kicking motion', icon: Compass, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 24], totalEstimateDays: 42 },
      severo: { dayThresholds: [18, 49], totalEstimateDays: 120 },
    },
    phases: [
      { name: 'Protection', why: 'The hip flexor is the main muscle in the kicking motion: after a strain, that movement needs reducing in the first days.',
        exercises: [
          { text: 'Reduce kicking and repeated hip flexion movements', cat: 'rest' },
          { text: 'Light isometric: lift your knee toward your chest against light resistance (hold 15-20 seconds, 4-5 times)', cat: 'hold' },
          { text: 'Walk within pain limits', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Hip flexion movement under controlled load is gradually reintroduced.',
        criteriaToAdvance: ['You can walk without noticeable pain', 'The light isometric doesn\'t trigger sharp pain'],
        exercises: [
          { text: 'Progressive hip flexor strengthening with a band (2-3 sets of 12-15)', cat: 'strength' },
          { text: 'Gentle stretching, never forced', cat: 'stretch' },
          { text: 'Pelvic stability exercises (2-3 sets of 30-45 seconds)', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Kicking the ball and sprinting require the hip flexor to work fast: it needs to be brought back to tolerating that speed gradually.',
        criteriaToAdvance: ['You can do the band strengthening without significant pain', 'No worsening the day after'],
        exercises: [
          { text: 'Low-intensity kicks, then progressive', cat: 'strength' },
          { text: 'Progressive running with knee drive', cat: 'run' },
          { text: 'Sprints and changes of pace before returning to group training', cat: 'run' },
        ] },
    ],
  },
  piriformis: {
    relatedInjuries: ['lowback', 'trochanteric'], relatedReason: 'The piriformis, lower back, and outer hip are closely linked in pelvic stability.',
    label: 'Piriformis syndrome', subtitle: 'Glute muscle, often mistaken for lower back pain', icon: CircleDashed, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [7, 14], totalEstimateDays: 28 },
      moderato: { dayThresholds: [14, 28], totalEstimateDays: 56 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Load reduction', why: 'The piriformis muscle, when irritated, can compress the sciatic nerve and cause pain that travels down the leg — it\'s often mistaken for a lower back problem. In the first days you reduce what triggers the pain, without stopping completely.',
        exercises: [
          { text: 'Temporarily reduce prolonged sitting or running if they trigger pain', cat: 'rest' },
          { text: 'Gentle stretching: lying down, bring your knee toward your chest and slightly across (hold 20-30 seconds, 3-4 times)', cat: 'stretch' },
          { text: 'Ice during the most painful moments', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Glute strengthening and hip mobility help take the excess workload off the piriformis that often irritates it.',
        criteriaToAdvance: ['Pain traveling down the leg has clearly decreased', 'You can sit for normal periods without worsening pain'],
        exercises: [
          { text: 'Glute medius strengthening with a band (2-3 sets of 15 per side)', cat: 'strength' },
          { text: 'Glute and hip stretching', cat: 'stretch' },
          { text: 'Self-massage with a ball or roller on the area, if tolerated', cat: 'stretch' },
        ] },
      { name: 'Return to sport', why: 'Running and changes of direction should be reintroduced gradually, keeping up glute strengthening to prevent the piriformis from becoming overloaded again.',
        criteriaToAdvance: ['You can run lightly without pain traveling down the leg', 'No worsening after more intense daily activity'],
        exercises: [
          { text: 'Progressive running', cat: 'run' },
          { text: 'Gradual changes of direction', cat: 'run' },
          { text: 'Keep up glute strengthening even after the pain is gone, to prevent relapse', cat: 'strength' },
        ] },
    ],
  },
  trochanteric: {
    relatedInjuries: ['knee', 'itband'], relatedReason: 'A weak glute medius doesn\'t just fail to stabilize the hip: it affects the knee too.',
    label: 'Trochanteric bursitis', subtitle: 'Outer hip, pain when lying on that side', icon: Target, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 84 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Load reduction', why: 'The bursa that protects the outer hip becomes inflamed from repeated friction. Temporarily reducing positions that compress the area (lying on that side, standing for long periods) helps calm it down.',
        exercises: [
          { text: 'Avoid sleeping on the painful side for a few nights', cat: 'rest' },
          { text: 'Temporarily cut back on running and stairs if they trigger pain', cat: 'rest' },
          { text: 'Ice on the outer hip, at intervals', cat: 'rest' },
        ] },
      { name: 'Progressive strengthening', why: 'Glute medius strengthening is central: a weak hip in that area makes the bursa work harder with every step.',
        criteriaToAdvance: ['You can lie on that side without sharp pain', 'Pain while walking has clearly decreased'],
        exercises: [
          { text: 'Glute medius strengthening: side-lying leg raises (2-3 sets of 15 per side)', cat: 'strength' },
          { text: 'IT band stretching', cat: 'stretch' },
          { text: 'Walking on flat ground, gradually increase distance', cat: 'rest' },
        ] },
      { name: 'Return to sport', why: 'Running and jumping should be reintroduced calmly, keeping up hip strengthening to prevent the overload from coming back.',
        criteriaToAdvance: ['You can run lightly without pain on that side', 'No pain after more intense daily activity'],
        exercises: [
          { text: 'Progressive running', cat: 'run' },
          { text: 'Jumps and changes of direction introduced last', cat: 'run' },
          { text: 'Keep up glute medius strengthening even after the pain is gone', cat: 'strength' },
        ] },
    ],
  },
  lcl: {
    relatedInjuries: ['mcl', 'meniscus'], relatedReason: 'Like the MCL, it works together with the meniscus to stabilize the knee during lateral movement.',
    label: 'LCL sprain', subtitle: 'Outer knee ligament', icon: ShieldAlert, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [7, 18], totalEstimateDays: 35 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 70 },
      severo: { dayThresholds: [21, 49], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Protection', why: 'The lateral collateral ligament stabilizes the knee against inward-directed stress. It\'s less common than an MCL sprain but tends to be watched more closely: if you feel real instability, not just pain, it\'s worth getting checked soon.',
        exercises: [
          { text: 'Walk within pain limits, avoid twisting', cat: 'rest' },
          { text: 'Elevate the leg when possible', cat: 'rest' },
          { text: 'Light isometric quad contractions (hold 20-30 seconds, 3-4 times)', cat: 'hold' },
        ] },
      { name: 'Active recovery', why: 'Movement and controlled load are reintroduced, without yet stressing the knee with inward-directed force.',
        criteriaToAdvance: ['You can walk without a feeling of the knee giving way', 'Swelling has clearly gone down'],
        exercises: [
          { text: 'Controlled squats in a limited range (2-3 sets of 10)', cat: 'strength' },
          { text: 'Quadriceps and hamstring strengthening (2-3 sets of 12)', cat: 'strength' },
          { text: 'Single-leg balance, no twisting', cat: 'balance' },
        ] },
      { name: 'Return to play', why: 'Before returning to tackles and changes of direction, the knee must tolerate lateral stress without giving way.',
        criteriaToAdvance: ['You can squat without pain on the outer side of the knee', 'No instability felt during daily movement'],
        exercises: [
          { text: 'Progressive changes of direction, starting from wide angles', cat: 'run' },
          { text: 'Running with controlled curves', cat: 'run' },
          { text: 'Light contact and controlled tackles before returning to group training', cat: 'run' },
        ] },
    ],
  },
  cramps: {
    label: 'Muscle cramps', subtitle: 'Sudden, painful contraction, often late in a match', icon: RotateCw, mechanismTags: ['overuse'],
    symptoms: [
      'A sudden, involuntary muscle contraction, often painful',
      'The muscle feels "hard" to the touch during the episode',
      'Happens more often late in a match or in intense heat',
      'Passes within minutes, unlike a real strain',
    ],
    severityData: {
      lieve: { dayThresholds: [1, 2], totalEstimateDays: 3 },
      moderato: { dayThresholds: [1, 3], totalEstimateDays: 5 },
      severo: { dayThresholds: [2, 5], totalEstimateDays: 10 },
    },
    phases: [
      { name: 'Immediate management', why: 'A cramp is an involuntary muscle contraction, often linked to fatigue, dehydration, or an electrolyte imbalance — it\'s not structural damage like a strain, but it needs handling right away without forcing the muscle while it\'s contracted.',
        exercises: [
          { text: 'Gentle, sustained stretching of the affected muscle', cat: 'stretch' },
          { text: 'Light massage of the area', cat: 'stretch' },
          { text: 'Hydration, ideally with water and electrolytes', cat: 'rest' },
        ] },
      { name: 'In the following hours', why: 'After a cramp the muscle can stay a little sore — that\'s normal, but it\'s worth taking it easy before going back to intense effort.',
        criteriaToAdvance: ['The muscle is no longer tender to the touch', 'You can move normally with no residual tension'],
        exercises: [
          { text: 'Light stretching, without forcing it', cat: 'stretch' },
          { text: 'Normal walking, light activity', cat: 'rest' },
          { text: 'Replenish fluids and electrolytes over the following hours', cat: 'rest' },
        ] },
      { name: 'Prevention for next time', why: 'Cramps often repeat if the cause isn\'t addressed — almost always a combination of fatigue, heat, and insufficient hydration in the days before the match, not just during it.',
        criteriaToAdvance: ['You feel completely normal, no residual tension'],
        exercises: [
          { text: 'Hydrate regularly in the days before the match, not just during it', cat: 'rest' },
          { text: 'Regular strengthening and stretching of the most affected muscles', cat: 'strength' },
          { text: 'Watch your training load on hot days', cat: 'rest' },
        ] },
    ],
  },
  blisters: {
    label: 'Blisters', subtitle: 'Skin friction injury, common with new boots', icon: Circle, mechanismTags: ['overuse'],
    symptoms: [
      'A red, painful area, often on the heel or toes',
      'A bubble filled with clear fluid may form',
      'Happens more often with new or poorly laced boots',
      'The pain is localized to the skin, not the joint or muscle',
    ],
    severityData: {
      lieve: { dayThresholds: [1, 2], totalEstimateDays: 3 },
      moderato: { dayThresholds: [2, 4], totalEstimateDays: 7 },
      severo: { dayThresholds: [3, 7], totalEstimateDays: 14 },
    },
    phases: [
      { name: 'Immediate protection', why: 'A blister is a superficial skin injury caused by repeated friction — the important thing is protecting it and avoiding an open tear, to prevent infection.',
        exercises: [
          { text: 'Cover with a specific plaster or bandage, not too tight', cat: 'rest' },
          { text: 'Avoid popping the blister unless necessary', cat: 'rest' },
          { text: 'Change footwear if it\'s the cause, when possible', cat: 'rest' },
        ] },
      { name: 'In the following days', why: 'The skin heals on its own within a few days if well protected — the real risk is infection, not the pain itself.',
        criteriaToAdvance: ['The area is no longer red or inflamed', 'No signs of infection: pus, warmth, spreading redness'],
        exercises: [
          { text: 'Keep the area clean and covered', cat: 'rest' },
          { text: 'Watch for signs of infection: spreading redness, warmth, pus', cat: 'rest' },
          { text: 'Wear comfortable footwear until it heals', cat: 'rest' },
        ] },
      { name: 'Prevention', why: 'Blisters easily come back if something doesn\'t change — shoes, socks, or the friction point.',
        criteriaToAdvance: ['The skin has completely healed'],
        exercises: [
          { text: 'Try technical socks without thick seams', cat: 'rest' },
          { text: 'Break in new boots gradually, don\'t use them for a full match right away', cat: 'rest' },
          { text: 'Preventive tape on your most affected spots, if you already know where', cat: 'rest' },
        ] },
    ],
  },
  lowback: {
    relatedInjuries: ['hamstring', 'piriformis'], relatedReason: 'The lower back, glutes, and hamstrings support each other for pelvic stability.',
    label: 'Lower back strain', subtitle: 'Mechanical lower back pain, no leg symptoms', icon: PersonStanding, mechanismTags: ['acute', 'overuse'],
    severityData: {
      lieve: { dayThresholds: [5, 14], totalEstimateDays: 28 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 56 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 140 },
    },
    specialRedFlags: [
      'Pain radiating below the knee, with tingling or numbness in the leg or foot',
      'Loss of strength in one leg, or difficulty walking on your heels or toes',
      'Numbness in the genital area, or difficulty controlling your bladder or bowel: seek immediate medical attention',
      'Fever associated with back pain, or a recent history of significant trauma',
      'Pain that doesn\'t improve at all with rest, especially at night',
    ],
    phases: [
      { name: 'Protection', why: 'In the acute phase, lower back pain improves faster by staying gently active rather than with prolonged bed rest: total rest slows recovery more than it helps.',
        exercises: [
          { text: 'Walk at an easy pace several times a day, as tolerated', cat: 'rest' },
          { text: 'Avoid sitting or lying down for too long: alternate positions', cat: 'rest' },
          { text: 'Gentle lower back mobility lying down (pelvic tilts), without forcing it', cat: 'stretch' },
        ] },
      { name: 'Active recovery', why: 'Strengthening the core and lower back muscles helps stabilize the spine and reduces the risk of future episodes — this is the part that makes the difference long-term, more than the acute phase itself.',
        criteriaToAdvance: ['You can sit or stand for normal periods without worsening pain', 'You can do the gentle mobility work without sharp pain'],
        exercises: [
          { text: 'Knee plank, then progress to a full plank (2-3 sets of 20-30 seconds)', cat: 'strength' },
          { text: 'Bird-dog: on all fours, extend opposite arm and leg (2-3 sets of 8-10 per side)', cat: 'strength' },
          { text: 'Gentle hamstring and hip flexor stretching', cat: 'stretch' },
        ] },
      { name: 'Return to play', why: 'Before returning to sprints, tackles, and changes of direction, the spine must tolerate asymmetric loads and rotation without triggering pain.',
        criteriaToAdvance: ['You can do core strengthening without lower back pain', 'No worsening after more intense daily activity'],
        exercises: [
          { text: 'Progressive core strengthening with controlled rotational exercises', cat: 'strength' },
          { text: 'Progressive running', cat: 'run' },
          { text: 'Controlled changes of direction and tackles before returning to group training', cat: 'run' },
        ] },
    ],
  },
};

const regions = {
  ankle_foot: { label: 'Caviglia e piede', icon: Footprints, injuries: ['ankle', 'achilles', 'plantarfasciitis', 'blisters'] },
  knee: { label: 'Ginocchio', icon: CircleDot, injuries: ['knee', 'mcl', 'lcl', 'patellar', 'meniscus', 'itband', 'osgood'] },
  thigh: { label: 'Coscia', icon: Zap, injuries: ['hamstring', 'quad', 'contusion'] },
  calf_region: { label: 'Gamba e polpaccio', icon: Activity, injuries: ['calf', 'shinsplints', 'cramps'] },
  hip_groin: { label: 'Anca e inguine', icon: ArrowLeftRight, injuries: ['groin', 'hipflexor', 'piriformis', 'trochanteric'] },
  lower_back: { label: 'Zona lombare', icon: PersonStanding, injuries: ['lowback'] },
};
const regionLabelsIT = { ankle_foot: 'Caviglia e piede', knee: 'Ginocchio', thigh: 'Coscia', calf_region: 'Gamba e polpaccio', hip_groin: 'Anca e inguine', lower_back: 'Zona lombare' };
const regionLabelsEN = { ankle_foot: 'Ankle and foot', knee: 'Knee', thigh: 'Thigh', calf_region: 'Leg and calf', hip_groin: 'Hip and groin', lower_back: 'Lower back' };

function regionOfInjury(injuryKey, data) {
  if (!injuryKey || !data[injuryKey]) return null;
  return Object.keys(regions).find((r) => regions[r].injuries.includes(injuryKey)) || null;
}

const redFlagsIT = [
  'Non riesci ad appoggiare il peso sulla gamba nemmeno parzialmente dopo 48–72 ore',
  'Gonfiore importante e immediato, entro pochi minuti dall\'infortunio',
  'Deformità visibile dell\'articolazione',
  'Hai sentito un "pop" forte seguito da instabilità marcata',
  'Intorpidimento, formicolio o cambio di colore della pelle nella zona',
  'Il dolore peggiora nel tempo invece di migliorare gradualmente',
  'Blocco meccanico: non riesci proprio a muovere l\'articolazione in un punto preciso',
];
const redFlagsEN = [
  'You can\'t put any weight on the leg at all after 48–72 hours',
  'Significant, immediate swelling within minutes of the injury',
  'Visible deformity of the joint',
  'You heard a loud "pop" followed by marked instability',
  'Numbness, tingling, or a color change in the skin of the area',
  'The pain gets worse over time instead of gradually improving',
  'Mechanical block: you genuinely can\'t move the joint past a certain point',
];

const riceStepsIT = [
  { letter: 'R', title: 'Riposo', icon: Pause, text: 'Smetti subito l\'attività. Continuare a giocare sul dolore rischia di peggiorare l\'infortunio.' },
  { letter: 'I', title: 'Ghiaccio', icon: Snowflake, text: 'Applica ghiaccio avvolto in un panno (mai direttamente sulla pelle) per 15-20 minuti, ogni 2-3 ore nelle prime 24-48 ore.' },
  { letter: 'C', title: 'Compressione', icon: Bandage, text: 'Una fascia elastica, non troppo stretta, aiuta a limitare il gonfiore.' },
  { letter: 'E', title: 'Elevazione', icon: ArrowUp, text: 'Tieni la zona sollevata sopra il livello del cuore quando possibile, specialmente nelle prime ore.' },
];
const riceStepsEN = [
  { letter: 'R', title: 'Rest', icon: Pause, text: 'Stop the activity right away. Continuing to play through the pain risks making the injury worse.' },
  { letter: 'I', title: 'Ice', icon: Snowflake, text: 'Apply ice wrapped in a cloth (never directly on skin) for 15-20 minutes, every 2-3 hours during the first 24-48 hours.' },
  { letter: 'C', title: 'Compression', icon: Bandage, text: 'An elastic bandage, not too tight, helps limit swelling.' },
  { letter: 'E', title: 'Elevation', icon: ArrowUp, text: 'Keep the area raised above heart level when possible, especially in the first hours.' },
];

const riceAvoidIT = [
  'Calore nelle prime 48 ore: può aumentare il gonfiore invece di ridurlo',
  'Massaggi energici o alcol nelle prime ore: favoriscono il gonfiore',
  'Continuare ad allenarti "per vedere se passa"',
];
const riceAvoidEN = [
  'Heat in the first 48 hours: it can increase swelling instead of reducing it',
  'Vigorous massage or alcohol in the first hours: they encourage swelling',
  'Continuing to train "to see if it goes away"',
];

const preventionDataIT = {
  ankle_foot: {
    label: 'Caviglia e piede',
    why: 'La caviglia è tra le articolazioni più soggette a infortuni nel calcio, specialmente se te la sei già fatta in passato. Lavorare su equilibrio e forza riduce concretamente il rischio di una nuova distorsione.',
    exercises: [
      { text: 'Equilibrio su una gamba sola, 30 secondi per lato (2-3 volte)', cat: 'balance' },
      { text: 'Calf raises a corpo libero (3 serie da 15)', cat: 'strength' },
      { text: 'Mobilità della caviglia in tutte le direzioni', cat: 'stretch' },
      { text: 'Rinforzo con elastico in tutte le direzioni (2-3 serie da 12-15 per direzione)', cat: 'strength' },
      { text: 'Equilibrio su superficie instabile, se disponibile (2-3 volte da 20-30 secondi)', cat: 'balance' },
    ],
  },
  knee: {
    label: 'Ginocchio',
    why: 'Il ginocchio lavora meglio quando i muscoli intorno — quadricipite, ischiocrurali, glutei — sono forti ed equilibrati tra loro: riduce lo stress sull\'articolazione nei cambi di direzione.',
    exercises: [
      { text: 'Squat controllati (2-3 serie da 12)', cat: 'strength' },
      { text: 'Rinforzo del gluteo medio con elastico (2-3 serie da 15)', cat: 'strength' },
      { text: 'Stretching di quadricipite e ischiocrurali', cat: 'stretch' },
      { text: 'Step-up controllati (2-3 serie da 10 per gamba)', cat: 'strength' },
      { text: 'Ponte glutei su una gamba (2-3 serie da 10-12 per lato)', cat: 'strength' },
    ],
  },
  thigh: {
    label: 'Coscia',
    why: 'Hamstring e quadricipite sono i muscoli più soggetti a stiramenti nello sprint. Il lavoro eccentrico, cioè sotto allungamento controllato, è quello con più prove scientifiche alle spalle per prevenire gli strappi.',
    exercises: [
      { text: 'Nordic curl assistito (2-3 serie da 5-6)', cat: 'strength' },
      { text: 'Affondi controllati (2-3 serie da 10 per gamba)', cat: 'strength' },
      { text: 'Stretching dinamico prima dell\'allenamento', cat: 'stretch' },
      { text: 'Ponte glutei/hamstring, bridge (3 serie da 12-15)', cat: 'strength' },
      { text: 'Rinforzo eccentrico del quadricipite, discesa lenta (2-3 serie da 8-10)', cat: 'strength' },
    ],
  },
  calf_region: {
    label: 'Gamba e polpaccio',
    why: 'Il polpaccio lavora a ogni scatto e ogni salto. Tenerlo forte ed elastico riduce il rischio di stiramenti, soprattutto quando aumenti i carichi di allenamento dopo una pausa.',
    exercises: [
      { text: 'Calf raises progressivi (3 serie da 15)', cat: 'strength' },
      { text: 'Stretching del polpaccio', cat: 'stretch' },
      { text: 'Salti leggeri controllati (2-3 serie da 10)', cat: 'strength' },
      { text: 'Calf raises eccentrici, scendi lentamente su una gamba (3 serie da 10-12)', cat: 'strength' },
      { text: 'Mobilità della caviglia prima e dopo l\'allenamento', cat: 'stretch' },
    ],
  },
  hip_groin: {
    label: 'Anca e inguine',
    why: 'Adduttori e flessori dell\'anca sono sollecitati in ogni calcio e cambio di direzione — tra le zone più soggette a infortuni da sovraccarico nel calcio amatoriale. Il rinforzo degli adduttori in particolare ha prove scientifiche solide alle spalle.',
    exercises: [
      { text: 'Rinforzo isometrico degli adduttori (3-4 serie da 8-10 tenute)', cat: 'strength' },
      { text: 'Mobilità dell\'anca in tutte le direzioni', cat: 'stretch' },
      { text: 'Rinforzo dei flessori dell\'anca con elastico (2-3 serie da 12-15)', cat: 'strength' },
      { text: 'Plank laterale con schiacciata dell\'adduttore, tipo Copenhagen (2-3 serie da 6-8 per lato)', cat: 'strength' },
      { text: 'Cammino laterale con elastico (2-3 serie da 12-15 passi per lato)', cat: 'strength' },
    ],
  },
  lower_back: {
    label: 'Zona lombare',
    why: 'Una zona lombare e un core forti stabilizzano tutto il resto del corpo — molti problemi alle gambe nascono da una base instabile più in alto, non dalla gamba stessa.',
    exercises: [
      { text: 'Plank (2-3 serie da 20-30 secondi)', cat: 'strength' },
      { text: 'Bird-dog: da carponi, estendi braccio e gamba opposti (2-3 serie da 8-10 per lato)', cat: 'strength' },
      { text: 'Mobilità lombare dolce da sdraiato', cat: 'stretch' },
      { text: 'Plank laterale (2-3 serie da 15-20 secondi per lato)', cat: 'strength' },
      { text: 'Ponte glutei a due gambe (3 serie da 12-15)', cat: 'strength' },
    ],
  },
};
const preventionDataEN = {
  ankle_foot: {
    label: 'Ankle and foot',
    why: 'The ankle is one of the joints most prone to injury in football, especially if you\'ve sprained it before. Working on balance and strength concretely reduces the risk of another sprain.',
    exercises: [
      { text: 'Single-leg balance, 30 seconds per side (2-3 times)', cat: 'balance' },
      { text: 'Bodyweight calf raises (3 sets of 15)', cat: 'strength' },
      { text: 'Ankle mobility in all directions', cat: 'stretch' },
      { text: 'Resistance band work in all directions (2-3 sets of 12-15 per direction)', cat: 'strength' },
      { text: 'Balance on an unstable surface, if available (2-3 sets of 20-30 seconds)', cat: 'balance' },
    ],
  },
  knee: {
    label: 'Knee',
    why: 'The knee works best when the muscles around it — quadriceps, hamstrings, glutes — are strong and balanced with each other: this reduces the stress on the joint during changes of direction.',
    exercises: [
      { text: 'Controlled squats (2-3 sets of 12)', cat: 'strength' },
      { text: 'Glute medius strengthening with a band (2-3 sets of 15)', cat: 'strength' },
      { text: 'Quadriceps and hamstring stretching', cat: 'stretch' },
      { text: 'Controlled step-ups (2-3 sets of 10 per leg)', cat: 'strength' },
      { text: 'Single-leg glute bridge (2-3 sets of 10-12 per side)', cat: 'strength' },
    ],
  },
  thigh: {
    label: 'Thigh',
    why: 'Hamstrings and quadriceps are the muscles most prone to strains when sprinting. Eccentric work — under controlled lengthening — is the type with the strongest scientific evidence behind it for preventing strains.',
    exercises: [
      { text: 'Assisted Nordic curls (2-3 sets of 5-6)', cat: 'strength' },
      { text: 'Controlled lunges (2-3 sets of 10 per leg)', cat: 'strength' },
      { text: 'Dynamic stretching before training', cat: 'stretch' },
      { text: 'Glute/hamstring bridge (3 sets of 12-15)', cat: 'strength' },
      { text: 'Eccentric quadriceps work, slow lowering (2-3 sets of 8-10)', cat: 'strength' },
    ],
  },
  calf_region: {
    label: 'Leg and calf',
    why: 'The calf works on every sprint and every jump. Keeping it strong and elastic reduces the risk of strains, especially when you increase training load after a break.',
    exercises: [
      { text: 'Progressive calf raises (3 sets of 15)', cat: 'strength' },
      { text: 'Calf stretching', cat: 'stretch' },
      { text: 'Controlled light jumps (2-3 sets of 10)', cat: 'strength' },
      { text: 'Eccentric calf raises, slow lowering on one leg (3 sets of 10-12)', cat: 'strength' },
      { text: 'Ankle mobility before and after training', cat: 'stretch' },
    ],
  },
  hip_groin: {
    label: 'Hip and groin',
    why: 'Adductors and hip flexors are worked on every kick and change of direction — among the areas most prone to overuse injuries in amateur football. Adductor strengthening in particular has solid scientific evidence behind it.',
    exercises: [
      { text: 'Isometric adductor strengthening (3-4 sets of 8-10 second holds)', cat: 'strength' },
      { text: 'Hip mobility in all directions', cat: 'stretch' },
      { text: 'Hip flexor strengthening with a band (2-3 sets of 12-15)', cat: 'strength' },
      { text: 'Side plank with adductor squeeze, Copenhagen-style (2-3 sets of 6-8 per side)', cat: 'strength' },
      { text: 'Lateral band walks (2-3 sets of 12-15 steps per side)', cat: 'strength' },
    ],
  },
  lower_back: {
    label: 'Lower back',
    why: 'A strong lower back and core stabilize the rest of the body — many leg problems start from an unstable base higher up, not from the leg itself.',
    exercises: [
      { text: 'Plank (2-3 sets of 20-30 seconds)', cat: 'strength' },
      { text: 'Bird-dog: on all fours, extend opposite arm and leg (2-3 sets of 8-10 per side)', cat: 'strength' },
      { text: 'Gentle lower back mobility lying down', cat: 'stretch' },
      { text: 'Side plank (2-3 sets of 15-20 seconds per side)', cat: 'strength' },
      { text: 'Two-leg glute bridge (3 sets of 12-15)', cat: 'strength' },
    ],
  },
};

const injuryScenariosIT = [
  { icon: Zap, label: 'Fitta improvvisa durante uno scatto', region: 'thigh', tag: 'acute' },
  { icon: Shield, label: 'Contrasto o colpo diretto', region: 'thigh', tag: 'contact' },
  { icon: Footprints, label: 'Atterrato male o storto la caviglia', region: 'ankle_foot', tag: 'acute' },
  { icon: RotateCw, label: 'Torsione al ginocchio', region: 'knee', tag: 'acute' },
];
const injuryScenariosEN = [
  { icon: Zap, label: 'Sudden sharp pain during a sprint', region: 'thigh', tag: 'acute' },
  { icon: Shield, label: 'Tackle or direct blow', region: 'thigh', tag: 'contact' },
  { icon: Footprints, label: 'Landed badly or twisted your ankle', region: 'ankle_foot', tag: 'acute' },
  { icon: RotateCw, label: 'Twisted your knee', region: 'knee', tag: 'acute' },
];

const playerPositionsIT = [
  { key: 'portiere', label: 'Portiere', tip: 'Per un portiere contano più i tuffi e gli atterraggi che la corsa pura: prima di sentirti pronto, assicurati di tollerare bene cadute e atterraggi controllati sul lato infortunato, non solo la corsa in linea.' },
  { key: 'difensore', label: 'Difensore', tip: 'Da difensore affronti molti contrasti e duelli aerei: oltre alla corsa, testa la tenuta durante contatti fisici controllati prima di sentirti davvero pronto.' },
  { key: 'centrocampista', label: 'Centrocampista', tip: 'Un centrocampista copre più chilometri di chiunque altro in campo: la resistenza su sforzi ripetuti conta quanto la velocità pura — non fermarti al primo sprint riuscito.' },
  { key: 'attaccante', label: 'Attaccante', tip: 'Da attaccante scatti brevi e accelerazioni improvvise sono il tuo pane quotidiano: assicurati di tollerare bene sprint ripetuti e cambi di ritmo esplosivi, non solo la corsa continua.' },
];
const playerPositionsEN = [
  { key: 'portiere', label: 'Goalkeeper', tip: 'For a goalkeeper, diving and landing matter more than pure running: before you feel ready, make sure you tolerate falls and controlled landings on the injured side well, not just running in a straight line.' },
  { key: 'difensore', label: 'Defender', tip: 'As a defender you face a lot of tackles and aerial duels: beyond running, test how you hold up during controlled physical contact before you feel truly ready.' },
  { key: 'centrocampista', label: 'Midfielder', tip: 'A midfielder covers more distance than anyone else on the pitch: endurance over repeated efforts matters as much as pure speed — don\'t stop at the first successful sprint.' },
  { key: 'attaccante', label: 'Forward', tip: 'As a forward, short bursts and sudden accelerations are your daily bread: make sure you tolerate repeated sprints and explosive changes of pace well, not just continuous running.' },
];

const dateChipsIT = [
  { label: 'Oggi', days: 0 }, { label: 'Ieri', days: 1 }, { label: '2–3 giorni fa', days: 2 },
  { label: 'Una settimana fa', days: 7 }, { label: '2+ settimane fa', days: 14 },
];
const dateChipsEN = [
  { label: 'Today', days: 0 }, { label: 'Yesterday', days: 1 }, { label: '2–3 days ago', days: 2 },
  { label: 'A week ago', days: 7 }, { label: '2+ weeks ago', days: 14 },
];

const mechanismOptionsIT = [
  { key: 'contatto', label: 'Contatto con un avversario', icon: Shield },
  { key: 'torsione', label: 'Movimento del corpo (torsione, scatto, salto)', icon: Zap },
  { key: 'sovraccarico', label: 'Iniziato gradualmente, senza un momento preciso', icon: TrendingUp },
];
const mechanismOptionsEN = [
  { key: 'contatto', label: 'Contact with an opponent', icon: Shield },
  { key: 'torsione', label: 'Body movement (twist, sprint, jump)', icon: Zap },
  { key: 'sovraccarico', label: 'Started gradually, no specific moment', icon: TrendingUp },
];
const popOptionsIT = [{ key: 'si', label: 'Sì' }, { key: 'no', label: 'No' }];
const popOptionsEN = [{ key: 'si', label: 'Yes' }, { key: 'no', label: 'No' }];
const weightOptionsIT = [
  { key: 'normale', label: 'Sì, normalmente' },
  { key: 'dolore', label: 'Sì, ma con dolore' },
  { key: 'fatica', label: 'A fatica o per niente' },
];
const weightOptionsEN = [
  { key: 'normale', label: 'Yes, normally' },
  { key: 'dolore', label: 'Yes, but with pain' },
  { key: 'fatica', label: 'With difficulty, or not at all' },
];

function LogoMark({ size = 32, color = colors.accent, strokeWidth = 3 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="11" cy="20" r="2.5" fill={color} />
      <path d="M13.5 20 H17.5 L21 8 L25 32 L29 20 H33.5" stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const bodyZones = [
  { region: 'lower_back', label: 'Schiena', shape: 'rect', center: { cx: 100, cy: 108 }, props: { x: 72, y: 96, width: 56, height: 24, rx: 12 } },
  { region: 'hip_groin', label: 'Anca/inguine', shape: 'rect', center: { cx: 100, cy: 138 }, props: { x: 74, y: 130, width: 52, height: 16, rx: 8 } },
  { region: 'thigh', label: 'Coscia sx', shape: 'rect', center: { cx: 87, cy: 176 }, props: { x: 78, y: 153, width: 18, height: 46, rx: 9 } },
  { region: 'thigh', label: 'Coscia dx', shape: 'rect', center: { cx: 113, cy: 176 }, props: { x: 104, y: 153, width: 18, height: 46, rx: 9 } },
  { region: 'knee', label: 'Ginocchio sx', shape: 'circle', center: { cx: 87, cy: 216 }, props: { cx: 87, cy: 216, r: 9 } },
  { region: 'knee', label: 'Ginocchio dx', shape: 'circle', center: { cx: 113, cy: 216 }, props: { cx: 113, cy: 216, r: 9 } },
  { region: 'calf_region', label: 'Polpaccio sx', shape: 'rect', center: { cx: 87, cy: 254.5 }, props: { x: 80, y: 233, width: 14, height: 43, rx: 7 } },
  { region: 'calf_region', label: 'Polpaccio dx', shape: 'rect', center: { cx: 113, cy: 254.5 }, props: { x: 106, y: 233, width: 14, height: 43, rx: 7 } },
  { region: 'ankle_foot', label: 'Caviglia sx', shape: 'ellipse', center: { cx: 87, cy: 292 }, props: { cx: 87, cy: 292, rx: 10, ry: 9 } },
  { region: 'ankle_foot', label: 'Caviglia dx', shape: 'ellipse', center: { cx: 113, cy: 292 }, props: { cx: 113, cy: 292, rx: 10, ry: 9 } },
];

function BodyDiagram({ onSelectRegion, accentColor = colors.accent, tintColor = colors.accentTint }) {
  const [pressed, setPressed] = useState(null);
  const [pinging, setPinging] = useState(null);
  const Shape = { rect: 'rect', circle: 'circle', ellipse: 'ellipse' };

  const handleSelect = (i, region) => {
    setPinging(i);
    setTimeout(() => { onSelectRegion(region); setPinging(null); }, 260);
  };

  return (
    <svg viewBox="0 0 200 312" className="w-full mx-auto" style={{ maxWidth: '220px', display: 'block' }} role="img" aria-label="Sagoma del corpo, tocca la zona dove senti dolore">
      <style>{`
        @keyframes os-radar { 0% { r: 4; opacity: 0.9; } 100% { r: 30; opacity: 0; } }
        .os-radar-ring { animation: os-radar 0.55s ease-out; transform-origin: center; }
      `}</style>
      <ellipse cx="100" cy="26" rx="16" ry="17" fill={colors.hairline} />
      <rect x="94" y="40" width="12" height="12" rx="4" fill={colors.hairline} />
      <rect x="70" y="50" width="60" height="70" rx="24" fill={colors.hairline} />
      <rect x="51" y="56" width="15" height="54" rx="8" fill={colors.hairline} />
      <rect x="134" y="56" width="15" height="54" rx="8" fill={colors.hairline} />

      {bodyZones.map((zone, i) => {
        const isPressed = pressed === i;
        const commonProps = {
          fill: isPressed ? accentColor : tintColor,
          stroke: accentColor,
          strokeWidth: 1.3,
          style: { cursor: 'pointer', transition: 'fill 0.12s ease' },
          onClick: () => handleSelect(i, zone.region),
          onMouseDown: () => setPressed(i),
          onMouseUp: () => setPressed(null),
          onMouseLeave: () => setPressed(null),
          onTouchStart: () => setPressed(i),
          onTouchEnd: () => setPressed(null),
          role: 'button',
          'aria-label': zone.label,
          tabIndex: 0,
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(i, zone.region); },
        };
        const ShapeTag = Shape[zone.shape];
        return <ShapeTag key={i} {...zone.props} {...commonProps} />;
      })}

      {pinging !== null && (
        <circle className="os-radar-ring" cx={bodyZones[pinging].center.cx} cy={bodyZones[pinging].center.cy} r="4" fill="none" stroke={accentColor} strokeWidth="2" />
      )}
    </svg>
  );
}

function ExerciseHelp({ ex, isEN }) {
  const query = ex.text.replace(/\([^)]*\)/g, '').trim();
  const searchSuffix = isEN ? ' exercise correct technique' : ' esercizio tecnica corretta';
  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + searchSuffix)}`;
  const tips = (isEN ? formCuesEN : formCuesIT)[ex.cat] || [];
  return (
    <div style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}` }} className="mt-2.5 rounded-xl p-3 space-y-2.5">
      {tips.length > 0 && (
        <ul className="space-y-1">
          {tips.map((tip, ti) => (
            <li key={ti} style={{ color: colors.mutedInk }} className="text-xs flex gap-1.5"><span style={{ color: colors.accent }}>—</span><span>{tip}</span></li>
          ))}
        </ul>
      )}
      <a
        href={videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ backgroundColor: colors.accentTint, color: colors.accentDark }}
        className="os-focus flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold w-full hover:opacity-80 transition-opacity"
      >
        <PlayCircle size={13} />{isEN ? 'Search video demonstrations' : 'Cerca dimostrazioni video'}
      </a>
      <p style={{ color: colors.mutedInk }} className="text-[10px] text-center leading-relaxed">{isEN ? 'Opens a YouTube search — you choose the video that looks clearest to you' : 'Apre una ricerca su YouTube — scegli tu il video che ti sembra più chiaro'}</p>
    </div>
  );
}

function loadFontsOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('os-fonts')) return;
  const link = document.createElement('link');
  link.id = 'os-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';
  document.head.appendChild(link);
}

function scrollToId(id) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toISODate(d) { return d.toISOString().slice(0, 10); }
function daysSince(isoDate) {
  const then = new Date(isoDate + 'T00:00:00');
  const now = new Date();
  return Math.floor((new Date(now.toDateString()) - new Date(then.toDateString())) / 86400000) + 1;
}
function suggestPhase(dayCount, thresholds) {
  if (dayCount <= thresholds[0]) return 0;
  if (dayCount <= thresholds[1]) return 1;
  return 2;
}
function phaseRangeLabel(index, thresholds, isEN) {
  if (index === 0) return isEN ? `Day 1 – ${thresholds[0]}` : `Giorno 1 – ${thresholds[0]}`;
  if (index === 1) return isEN ? `Day ${thresholds[0] + 1} – ${thresholds[1]}` : `Giorno ${thresholds[0] + 1} – ${thresholds[1]}`;
  return isEN ? `From day ${thresholds[1] + 1}` : `Da giorno ${thresholds[1] + 1}`;
}
function segmentFill(dayCount, segStart, segEnd) {
  if (!dayCount) return 0;
  if (dayCount <= segStart) return 0;
  if (dayCount >= segEnd) return 100;
  return Math.round(((dayCount - segStart) / (segEnd - segStart)) * 100);
}
function computeStreak(log) {
  if (!log) return 0;
  let streak = 0;
  let d = new Date();
  const isDone = (key) => log[key] && log[key].done;
  if (!isDone(toISODate(d))) d.setDate(d.getDate() - 1);
  while (isDone(toISODate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
function formatTodayLabel(isEN) {
  const d = new Date();
  const daysIT = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const monthsIT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const daysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = isEN ? daysEN : daysIT;
  const months = isEN ? monthsEN : monthsIT;
  return isEN ? `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}` : `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function Offside() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('cover');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [triageTag, setTriageTag] = useState(null);
  const [triageAnswers, setTriageAnswers] = useState({ mechanism: null, pop: null, weight: null });
  const [selectedInjury, setSelectedInjury] = useState(null);
  const [activePhase, setActivePhase] = useState(0);
  const [progress, setProgress] = useState({});
  const [injuryDates, setInjuryDates] = useState({});
  const [injurySeverities, setInjurySeverities] = useState({});
  const [dailyLog, setDailyLog] = useState({});
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [editingSetup, setEditingSetup] = useState(false);
  const [showSeverityInfo, setShowSeverityInfo] = useState(false);
  const [pendingDate, setPendingDate] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [language, setLanguage] = useState('it');
  const isEN = language === 'en';
  const injuriesData = isEN ? injuriesDataEN : injuriesDataIT;
  const preventionData = isEN ? preventionDataEN : preventionDataIT;
  const catLabels = isEN ? catLabelsEN : catLabelsIT;
  const mechanismLabels = isEN ? mechanismLabelsEN : mechanismLabelsIT;
  const formCues = isEN ? formCuesEN : formCuesIT;
  const severityLabels = isEN ? severityLabelsEN : severityLabelsIT;
  const severityInfo = isEN ? severityInfoEN : severityInfoIT;
  const feelingOptions = isEN ? feelingOptionsEN : feelingOptionsIT;
  const stiffnessOptions = isEN ? stiffnessOptionsEN : stiffnessOptionsIT;
  const dailyGuidance = isEN ? dailyGuidanceEN : dailyGuidanceIT;
  const redFlags = isEN ? redFlagsEN : redFlagsIT;
  const riceSteps = isEN ? riceStepsEN : riceStepsIT;
  const riceAvoid = isEN ? riceAvoidEN : riceAvoidIT;
  const injuryScenarios = isEN ? injuryScenariosEN : injuryScenariosIT;
  const playerPositions = isEN ? playerPositionsEN : playerPositionsIT;
  const dateChips = isEN ? dateChipsEN : dateChipsIT;
  const mechanismOptions = isEN ? mechanismOptionsEN : mechanismOptionsIT;
  const popOptions = isEN ? popOptionsEN : popOptionsIT;
  const weightOptions = isEN ? weightOptionsEN : weightOptionsIT;
  const regionLabels = isEN ? regionLabelsEN : regionLabelsIT;
  const [shareCopied, setShareCopied] = useState(false);
  const [trackerTab, setTrackerTab] = useState('oggi');
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [regionsTab, setRegionsTab] = useState('injury');
  const [expandedPrevention, setExpandedPrevention] = useState(null);
  const [preventionProgress, setPreventionProgress] = useState({});
  const [expandedPreventionTip, setExpandedPreventionTip] = useState(null);
  const [expandedSymptoms, setExpandedSymptoms] = useState(null);

  useEffect(() => {
    loadFontsOnce();
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          const injuryKey = data.selectedInjury || null;
          if (injuryKey && injuriesData[injuryKey]) {
            setSelectedInjury(injuryKey);
            setSelectedRegion(regionOfInjury(injuryKey, injuriesData));
          }
          setActivePhase(data.activePhase || 0);
          setProgress(data.progress || {});
          setInjuryDates(data.injuryDates || {});
          setInjurySeverities(data.injurySeverities || {});
          setDailyLog(data.dailyLog || {});
          setPlayerPosition(data.playerPosition || null);
          setPreventionProgress(data.preventionProgress || {});
          setLanguage(data.language || 'it');
        }
      } catch (err) {} finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (err) {
      setSaveError(true);
    }
  }, []);

  const snapshot = (overrides = {}) => ({ selectedInjury, activePhase, progress, injuryDates, injurySeverities, dailyLog, playerPosition, preventionProgress, language, ...overrides });

  const goBack = () => {
    if (screen === 'tracker') setScreen('injuries');
    else if (screen === 'injuries') { setScreen('regions'); setSelectedRegion(null); setTriageTag(null); }
    else if (screen === 'triage') setScreen('regions');
    else if (screen === 'firstaid') setScreen('regions');
    else if (screen === 'regions') setScreen('cover');
  };

  const openRegion = (key) => { trackEvent('region_selected', { region: key }); setSelectedRegion(key); setScreen('injuries'); };

  const resumeInjury = (key) => {
    if (!injuriesData[key]) return;
    const sev = injurySeverities[key] || 'moderato';
    const date = injuryDates[key];
    let suggested = 0;
    if (date) {
      const { dayThresholds } = injuriesData[key].severityData[sev];
      suggested = suggestPhase(daysSince(date), dayThresholds);
    }
    setSelectedInjury(key);
    setActivePhase(suggested);
    setSelectedRegion(regionOfInjury(key, injuriesData));
    setTrackerTab('oggi');
    setEditingSetup(false);
    setActiveVideo(null);
    setScreen('tracker');
    persist({ selectedInjury: key, activePhase: suggested, progress, injuryDates, injurySeverities, dailyLog, playerPosition });
  };
  
  const startTriage = () => { setTriageAnswers({ mechanism: null, pop: null, weight: null }); setTriageTag(null); setScreen('triage'); };
  const handleScenario = (scenario) => { setTriageTag(scenario.tag); openRegion(scenario.region); };

  const chooseInjury = (key) => {
    if (!injuriesData[key]) return;
    trackEvent('injury_selected', { injury: key });
    const severity = injurySeverities[key] || 'moderato';
    const nextSeverities = { ...injurySeverities, [key]: severity };
    setSelectedInjury(key);
    setActivePhase(0);
    setInjurySeverities(nextSeverities);
    setEditingSetup(!injuryDates[key]);
    setTrackerTab('oggi');
    setActiveVideo(null);
    setScreen('tracker');
    persist(snapshot({ selectedInjury: key, activePhase: 0, injurySeverities: nextSeverities }));
  };

  const setSeverity = (sev) => {
    if (!selectedInjury || !injuriesData[selectedInjury]) return;
    const nextSeverities = { ...injurySeverities, [selectedInjury]: sev };
    setInjurySeverities(nextSeverities);
    if (injuryDates[selectedInjury]) {
      const { dayThresholds } = injuriesData[selectedInjury].severityData[sev];
      const suggested = suggestPhase(daysSince(injuryDates[selectedInjury]), dayThresholds);
      setActivePhase(suggested);
      persist(snapshot({ injurySeverities: nextSeverities, activePhase: suggested }));
    } else {
      persist(snapshot({ injurySeverities: nextSeverities }));
    }
  };

  const commitDate = (isoDate) => {
    if (!selectedInjury || !injuriesData[selectedInjury]) return;
    const nextDates = { ...injuryDates, [selectedInjury]: isoDate };
    const sev = injurySeverities[selectedInjury] || 'moderato';
    const { dayThresholds } = injuriesData[selectedInjury].severityData[sev];
    const suggested = suggestPhase(daysSince(isoDate), dayThresholds);
    setInjuryDates(nextDates);
    setActivePhase(suggested);
    setEditingSetup(false);
    setPendingDate('');
    persist(snapshot({ injuryDates: nextDates, activePhase: suggested }));
  };

  const skipDate = () => { setEditingSetup(false); setPendingDate(''); };
  const changePhase = (idx) => { setActivePhase(idx); setActiveVideo(null); persist(snapshot({ activePhase: idx })); };

  const toggleExercise = (exIdx) => {
    if (!selectedInjury) return;
    const pKey = `${selectedInjury}-${activePhase}`;
    const current = progress[pKey] || {};
    const nextForPhase = { ...current, [exIdx]: !current[exIdx] };
    const nextProgress = { ...progress, [pKey]: nextForPhase };
    setProgress(nextProgress);
    persist(snapshot({ progress: nextProgress }));
  };

  const togglePreventionExercise = (regionKey, exIdx) => {
    const current = preventionProgress[regionKey] || {};
    const nextForRegion = { ...current, [exIdx]: !current[exIdx] };
    const next = { ...preventionProgress, [regionKey]: nextForRegion };
    setPreventionProgress(next);
    persist(snapshot({ preventionProgress: next }));
  };

  const todayKey = () => toISODate(new Date());

  const toggleToday = () => {
    if (!selectedInjury) return;
    const today = todayKey();
    const current = dailyLog[selectedInjury] || {};
    const todayEntry = current[today] || {};
    const willBeDone = !todayEntry.done;
    if (willBeDone) trackEvent('session_logged', { injury: selectedInjury });
    const nextEntry = { ...todayEntry, done: willBeDone };
    const nextForInjury = { ...current, [today]: nextEntry };
    const nextLog = { ...dailyLog, [selectedInjury]: nextForInjury };
    setDailyLog(nextLog);
    persist(snapshot({ dailyLog: nextLog }));
  };

  const setTodayFeeling = (feeling) => {
    if (!selectedInjury) return;
    const today = todayKey();
    const current = dailyLog[selectedInjury] || {};
    const todayEntry = current[today] || {};
    const nextEntry = { ...todayEntry, feeling };
    const nextForInjury = { ...current, [today]: nextEntry };
    const nextLog = { ...dailyLog, [selectedInjury]: nextForInjury };
    setDailyLog(nextLog);
    persist(snapshot({ dailyLog: nextLog }));
  };

  const setTodayStiffness = (stiffness) => {
    if (!selectedInjury) return;
    const today = todayKey();
    const current = dailyLog[selectedInjury] || {};
    const todayEntry = current[today] || {};
    const nextEntry = { ...todayEntry, stiffness };
    const nextForInjury = { ...current, [today]: nextEntry };
    const nextLog = { ...dailyLog, [selectedInjury]: nextForInjury };
    setDailyLog(nextLog);
    persist(snapshot({ dailyLog: nextLog }));
  };

  const resetInjury = () => {
    if (!selectedInjury) return;
    const nextProgress = { ...progress };
    injuriesData[selectedInjury].phases.forEach((_, i) => delete nextProgress[`${selectedInjury}-${i}`]);
    const nextDates = { ...injuryDates };
    delete nextDates[selectedInjury];
    const nextLog = { ...dailyLog };
    delete nextLog[selectedInjury];
    setProgress(nextProgress);
    setInjuryDates(nextDates);
    setDailyLog(nextLog);
    const region = selectedRegion;
    setSelectedInjury(null);
    setActivePhase(0);
    setScreen('injuries');
    setSelectedRegion(region);
    persist(snapshot({ selectedInjury: null, activePhase: 0, progress: nextProgress, injuryDates: nextDates, dailyLog: nextLog }));
  };

  const deleteInjuryData = (key) => {
    if (!injuriesData[key]) return;
    const nextProgress = { ...progress };
    injuriesData[key].phases.forEach((_, i) => delete nextProgress[`${key}-${i}`]);
    const nextDates = { ...injuryDates };
    delete nextDates[key];
    const nextLog = { ...dailyLog };
    delete nextLog[key];
    const nextSelected = selectedInjury === key ? null : selectedInjury;
    setProgress(nextProgress);
    setInjuryDates(nextDates);
    setDailyLog(nextLog);
    setSelectedInjury(nextSelected);
    setDeletingKey(null);
    persist({ selectedInjury: nextSelected, activePhase, progress: nextProgress, injuryDates: nextDates, injurySeverities, dailyLog: nextLog, playerPosition });
  };

  const answerTriage = (field, value) => setTriageAnswers({ ...triageAnswers, [field]: value });
  const triageComplete = triageAnswers.mechanism && triageAnswers.pop && triageAnswers.weight;
  const triageRedirect = triageAnswers.weight === 'fatica' || (triageAnswers.pop === 'si' && triageAnswers.mechanism === 'torsione');
  const finishTriage = () => {
    const tagMap = { contatto: 'contact', sovraccarico: 'overuse', torsione: 'acute' };
    setTriageTag(tagMap[triageAnswers.mechanism]);
    setScreen('regions');
  };

  const displayFont = { fontFamily: "'Space Grotesk', sans-serif" };
  const bodyFont = { fontFamily: "'Inter', sans-serif" };

  const injury = selectedInjury && injuriesData[selectedInjury] ? injuriesData[selectedInjury] : null;
  const severity = injury && selectedInjury ? (injurySeverities[selectedInjury] || 'moderato') : 'moderato';
  const { dayThresholds, totalEstimateDays } = injury ? injury.severityData[severity] : { dayThresholds: [0, 0], totalEstimateDays: 1 };
  const phase = injury && injury.phases[activePhase] ? injury.phases[activePhase] : null;
  const phaseKey = injury && selectedInjury ? `${selectedInjury}-${activePhase}` : null;
  const phaseProgress = phaseKey ? (progress[phaseKey] || {}) : {};
  const completedCount = phase && phase.exercises ? phase.exercises.filter((_, i) => phaseProgress[i]).length : 0;
  const currentDate = injury && selectedInjury ? injuryDates[selectedInjury] : null;
  const dayCount = currentDate ? daysSince(currentDate) : null;
  const injuryLog = selectedInjury ? (dailyLog[selectedInjury] || {}) : {};
  const todayEntry = injuryLog[todayKey()] || {};
  const streak = useMemo(() => computeStreak(injuryLog), [injuryLog]);

  const segments = useMemo(() => {
    if (!injury) return [];
    const bounds = [0, dayThresholds[0], dayThresholds[1], totalEstimateDays];
    return [0, 1, 2].map((i) => ({ span: bounds[i + 1] - bounds[i], fill: segmentFill(dayCount, bounds[i], bounds[i + 1]) }));
  }, [injury, dayThresholds, totalEstimateDays, dayCount]);

  const shareProgress = async () => {
    if (!injury || !phase) return;
    const doneDays = Object.values(injuryLog).filter((e) => e.done).length;
    const lines = isEN ? [
      'OFFSIDE — Recovery summary',
      '',
      `Injury: ${injury.label}`,
      `Severity: ${severityLabels[severity]}`,
      currentDate ? `Recovery day: ${dayCount}` : null,
      `Current phase: ${phase.name} (Phase ${activePhase + 1} of ${injury.phases.length})`,
      `Exercises completed in this phase: ${completedCount}/${phase.exercises.length}`,
      `Daily sessions logged: ${doneDays}`,
      streak > 0 ? `Current streak: ${streak} consecutive days` : null,
    ] : [
      'OFFSIDE — Riepilogo recupero',
      '',
      `Infortunio: ${injury.label}`,
      `Gravità: ${severityLabels[severity]}`,
      currentDate ? `Giorno di recupero: ${dayCount}` : null,
      `Fase attuale: ${phase.name} (Fase ${activePhase + 1} di ${injury.phases.length})`,
      `Esercizi completati in questa fase: ${completedCount}/${phase.exercises.length}`,
      `Sessioni giornaliere registrate: ${doneDays}`,
      streak > 0 ? `Serie attuale: ${streak} giorni consecutivi` : null,
    ];
    const text = lines.filter(Boolean).join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {}
  };

  if (loading) {
    const browserIsEN = typeof navigator !== 'undefined' && !navigator.language?.toLowerCase().startsWith('it');
    return (
      <div style={{ background: 'linear-gradient(160deg, #16283A 0%, #101B26 60%)', color: '#A9B7C4', fontFamily: "'Inter', sans-serif" }} className="w-full min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm">{browserIsEN ? 'Loading your data…' : 'Carico i tuoi dati…'}</p>
      </div>
    );
  }

  const sharedStyle = `
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
    .os-focus:focus-visible { outline: 2px solid ${colors.accent}; outline-offset: 2px; }
    .os-tabular { font-variant-numeric: tabular-nums; }
    .os-fill { transition: width 0.4s ease; }
    input[type="date"].os-date { font-family: 'Inter', sans-serif; color-scheme: light; }
    @keyframes os-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .os-fadein { animation: os-fadein 0.25s ease-out; }
  `;

  if (screen === 'cover') {
    return (
      <div style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #16283A 0%, #0A1118 65%)', ...bodyFont }} className="w-full min-h-[100dvh] relative flex flex-col">
        <style>{sharedStyle}</style>
        <svg className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none" viewBox="0 0 400 560" fill="none" preserveAspectRatio="xMidYMid slice">
          <circle cx="200" cy="300" r="170" stroke={colors.accent} strokeWidth="1.5" />
          <circle cx="200" cy="300" r="230" stroke={colors.accent} strokeWidth="1" />
          <line x1="-20" y1="300" x2="420" y2="300" stroke={colors.accent} strokeWidth="1.5" />
          <circle cx="200" cy="300" r="3" fill={colors.accent} />
        </svg>
        <div className="relative px-6 sm:px-10 pt-12 pb-8 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-5">
            <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)', border: `2px solid ${colors.accent}44` }} className="w-20 h-20 rounded-full flex items-center justify-center">
              <LogoMark size={38} color={colors.accent} />
            </div>
            <div className="flex items-center gap-2">
              <div style={{ backgroundColor: '#17293D', border: `1px solid ${colors.accent}33` }} className="flex items-center rounded-full p-0.5">
                <button onClick={() => { setLanguage('it'); persist(snapshot({ language: 'it' })); }} style={{ backgroundColor: !isEN ? colors.accent : 'transparent', opacity: !isEN ? 1 : 0.5 }} className="os-focus w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors" aria-label="Italiano">🇮🇹</button>
                <button onClick={() => { setLanguage('en'); persist(snapshot({ language: 'en' })); }} style={{ backgroundColor: isEN ? colors.accent : 'transparent', opacity: isEN ? 1 : 0.5 }} className="os-focus w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors" aria-label="English">🇬🇧</button>
              </div>
              <span style={{ ...displayFont, backgroundColor: '#17293D', color: colors.accent, letterSpacing: '0.1em' }} className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">Beta</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center mb-8">
            <h1 style={{ ...displayFont, letterSpacing: '0.02em' }} className="text-[72px] sm:text-[84px] font-bold leading-none mb-1">
              <span style={{ color: '#FFFFFF' }}>OFF</span><span style={{ color: colors.accent }}>SIDE</span>
            </h1>
          </div>
          
          <div className="mb-6">
            {(isEN ? [
              'Prevent the most common injuries, before they happen.',
              'Know what to do in the first few minutes, if you get hurt.',
              'Follow a tailored recovery plan, step by step.',
            ] : [
              'Previeni gli infortuni più comuni, prima che succedano.',
              'Sai cosa fare nei primi minuti, se ti fai male.',
              'Segui un percorso di recupero fatto su misura, passo dopo passo.'
            ]).map((text, i, arr) => (
              <div key={i} className="flex items-baseline gap-3.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${colors.accent}1A` : 'none', paddingBottom: '11px', marginBottom: i < arr.length - 1 ? '11px' : 0 }}>
                <span style={{ ...displayFont, color: colors.accent }} className="os-tabular text-xl font-bold flex-shrink-0 w-7">{String(i + 1).padStart(2, '0')}</span>
                <p style={{ color: '#D7E1EA' }} className="text-[15px] leading-snug font-medium">{text}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setDisclaimerAccepted(!disclaimerAccepted)} role="checkbox" aria-checked={disclaimerAccepted} className="os-focus w-full flex items-start gap-2.5 mb-4 text-left">
            <div style={{ backgroundColor: disclaimerAccepted ? colors.accent : 'transparent', border: `1.5px solid ${disclaimerAccepted ? colors.accent : '#4A5D6E'}` }} className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5">
              {disclaimerAccepted && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
            </div>
            <p style={{ color: '#94A3B3' }} className="text-xs leading-relaxed">
              {isEN
                ? 'I understand that Offside provides general information about common injuries, not a diagnosis or a personalized treatment plan, and that it does not replace an assessment by a healthcare professional.'
                : 'Ho capito che Offside fornisce informazioni generali su infortuni comuni, non una diagnosi o un piano di trattamento personalizzato, e non sostituisce una valutazione da un professionista sanitario.'}
            </p>
          </button>

          <button
            onClick={() => { if (disclaimerAccepted) { trackEvent('disclaimer_accepted'); setScreen('regions'); } }}
            disabled={!disclaimerAccepted}
            style={{ backgroundColor: disclaimerAccepted ? colors.accent : '#2A3A48', color: disclaimerAccepted ? '#FFFFFF' : '#6E7E8C' }}
            className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium transition-colors"
          >
            <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Start your recovery' : 'Inizia il tuo percorso'}</span><ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const activeInjuryKeys = Object.keys(injuryDates).filter((k) => injuryDates[k] && injuriesData[k]);

  return (
    <div style={{ backgroundColor: colors.paper, ...bodyFont }} className="w-full min-h-[100dvh] relative">
      <style>{sharedStyle}</style>
      <svg className="fixed inset-0 w-full h-full opacity-[0.035] pointer-events-none" viewBox="0 0 400 800" fill="none" preserveAspectRatio="xMidYMid slice">
        <circle cx="200" cy="160" r="150" stroke={colors.accent} strokeWidth="1.5" />
        <line x1="-20" y1="160" x2="420" y2="160" stroke={colors.accent} strokeWidth="1.5" />
      </svg>

      <div style={{ borderBottom: `1px solid ${colors.hairline}` }} className="relative px-5 sm:px-8 pt-5 pb-4 flex items-center gap-3">
        <button onClick={goBack} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Go back' : 'Torna indietro'}>
          <ArrowLeft size={16} color={colors.accentDark} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <LogoMark size={13} color={colors.accentDark} strokeWidth={2.5} />
            <p style={{ ...displayFont, color: colors.accentDark, letterSpacing: '0.14em' }} className="text-[10px] font-semibold uppercase">Offside</p>
          </div>
          <h1 style={{ ...displayFont, color: colors.ink }} className="text-lg sm:text-xl font-semibold truncate">
            {screen === 'regions' ? (regionsTab === 'prevention' ? (isEN ? 'Prevention' : 'Prevenzione') : (isEN ? 'Where does it hurt?' : 'Dove senti il problema?')) : screen === 'triage' ? (isEN ? 'Not sure what it is?' : 'Non sai cosa hai?') : screen === 'firstaid' ? (isEN ? 'First aid' : 'Primi soccorsi') : screen === 'injuries' ? (selectedRegion && regionLabels[selectedRegion] ? regionLabels[selectedRegion] : (isEN ? 'Injuries' : 'Infortuni')) : (isEN ? 'Your recovery' : 'Il tuo percorso')}
          </h1>
        </div>
        {screen === 'tracker' && injury && (
          <button onClick={shareProgress} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Share your progress' : 'Condividi il tuo percorso'}>
            {shareCopied ? <Check size={15} color={colors.accentDark} /> : <Share2 size={15} color={colors.accentDark} />}
          </button>
        )}
      </div>

      <div className="px-5 sm:px-8 pt-5">
        <div style={{ backgroundColor: colors.redTint, border: `1px solid ${colors.red}22` }} className="rounded-xl overflow-hidden">
          <button onClick={() => setShowRedFlags(!showRedFlags)} className="os-focus w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
            <span className="flex items-center gap-2">
              <AlertTriangle size={18} color={colors.red} strokeWidth={2.25} />
              <span style={{ ...displayFont, color: colors.red }} className="text-sm font-semibold uppercase tracking-wide">{isEN ? 'When to stop and call a professional' : 'Quando fermarti e chiamare un professionista'}</span>
            </span>
            <ChevronRight size={18} color={colors.red} style={{ transform: showRedFlags ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
          </button>
          {showRedFlags && (
            <div className="px-4 pb-4">
              <ul style={{ color: colors.ink }} className="space-y-1.5 text-sm">
                {redFlags.map((flag, i) => <li key={i} className="flex gap-2"><span style={{ color: colors.red }} className="mt-1 flex-shrink-0">●</span><span>{flag}</span></li>)}
              </ul>
              {screen === 'tracker' && injury && injury.specialRedFlags && (
                <>
                  <p style={{ ...displayFont, color: colors.red }} className="text-[11px] font-semibold uppercase tracking-wide mt-3 mb-1.5">{isEN ? 'Also, specific to this injury' : 'Inoltre, specifico per questo infortunio'}</p>
                  <ul style={{ color: colors.ink }} className="space-y-1.5 text-sm">
                    {injury.specialRedFlags.map((flag, i) => <li key={i} className="flex gap-2"><span style={{ color: colors.red }} className="mt-1 flex-shrink-0">●</span><span>{flag}</span></li>)}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div key={screen} className="px-5 sm:px-8 py-6 os-fadein">
        {screen === 'regions' && (
          <>
            <div style={{ backgroundColor: colors.laneBg }} className="flex gap-1 p-1 rounded-full mb-5">
              <button onClick={() => setRegionsTab('injury')} style={{ backgroundColor: regionsTab === 'injury' ? colors.card : 'transparent', color: regionsTab === 'injury' ? colors.ink : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">
                <Snowflake size={14} />{isEN ? 'Injury' : 'Infortunio'}
              </button>
              <button onClick={() => setRegionsTab('prevention')} style={{ backgroundColor: regionsTab === 'prevention' ? colors.card : 'transparent', color: regionsTab === 'prevention' ? colors.preventionDark : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">
                <ShieldCheck size={14} />{isEN ? 'Prevention' : 'Prevenzione'}
              </button>
            </div>

            {regionsTab === 'injury' ? (
              <>
                {activeInjuryKeys.length > 0 && (
                  <div className="mb-4">
                    <p style={{ ...displayFont, color: colors.mutedInk, letterSpacing: '0.08em' }} className="text-[11px] font-semibold uppercase mb-2">
                      {isEN
                        ? (activeInjuryKeys.length === 1 ? 'Your recovery' : `Your recoveries (${activeInjuryKeys.length})`)
                        : (activeInjuryKeys.length === 1 ? 'Il tuo percorso' : `I tuoi percorsi (${activeInjuryKeys.length})`)}
                    </p>
                    <div className="space-y-2">
                      {activeInjuryKeys.map((key) => (
                        <div key={key} style={{ backgroundColor: colors.ink }} className="flex items-stretch rounded-xl overflow-hidden shadow-sm">
                          <button onClick={() => resumeInjury(key)} className="os-focus flex-1 flex items-center gap-3 px-4 py-3.5 text-left hover:opacity-90 transition-opacity min-w-0">
                            <PlayCircle size={20} color={colors.accent} className="flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p style={{ color: '#FFFFFF' }} className="text-sm font-medium truncate">{injuriesData[key].label}</p>
                              <p style={{ color: '#A9B7C4' }} className="text-xs">{isEN ? 'Day' : 'Giorno'} {daysSince(injuryDates[key])}</p>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              if (deletingKey === key) deleteInjuryData(key);
                              else { setDeletingKey(key); setTimeout(() => setDeletingKey((k) => (k === key ? null : k)), 3000); }
                            }}
                            style={{ backgroundColor: deletingKey === key ? colors.red : 'rgba(255,255,255,0.05)' }}
                            className="os-focus flex-shrink-0 w-12 flex items-center justify-center transition-colors"
                            aria-label={deletingKey === key ? (isEN ? 'Confirm deletion' : 'Conferma eliminazione') : (isEN ? 'Delete this recovery' : 'Elimina questo percorso')}
                          >
                            <X size={16} color={deletingKey === key ? "#FFFFFF" : colors.mutedInk} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setScreen('firstaid')} style={{ backgroundColor: colors.accent }} className="os-focus w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left mb-6 hover:opacity-90 transition-opacity shadow-sm">
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"><Snowflake size={20} color="#FFFFFF" /></div>
                  <div className="flex-1">
                    <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-sm font-medium">{isEN ? 'Just got hurt?' : 'Ti sei appena fatto male?'}</p>
                    <p style={{ color: colors.ink, fontWeight: 500 }} className="text-xs opacity-80">{isEN ? 'What to do in the first few minutes' : 'Cosa fare nei primi minuti'}</p>
                  </div>
                  <ChevronRight size={18} color={colors.ink} className="opacity-60" />
                </button>

                <p style={{ ...displayFont, color: colors.mutedInk, letterSpacing: '0.08em' }} className="text-[11px] font-semibold uppercase text-center mb-3">{isEN ? 'Tap where it hurts' : 'Tocca dove senti il problema'}</p>
                <div className="mb-6">
                  <BodyDiagram onSelectRegion={openRegion} />
                </div>

                <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.1em' }} className="text-xs font-semibold uppercase mb-3">{isEN ? 'Or choose the area' : 'Oppure scegli il distretto'}</p>
                <div className="space-y-2.5 mb-6">
                  {Object.entries(regions).map(([key, data]) => {
                    const Icon = data.icon;
                    return (
                      <button key={key} onClick={() => openRegion(key)} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left hover:shadow-sm hover:border-gray-300 transition-all">
                        <div style={{ backgroundColor: colors.accentTint, border: `1px solid ${colors.accent}40` }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"><Icon size={19} color={colors.accentDark} strokeWidth={2} /></div>
                        <div className="flex-1 min-w-0"><p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.02em' }} className="text-base font-semibold uppercase">{regionLabels[key]}</p></div>
                        <ChevronRight size={20} color={colors.mutedInk} className="flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>

                <p style={{ ...displayFont, color: colors.mutedInk, letterSpacing: '0.08em' }} className="text-[11px] font-semibold uppercase mb-2.5">{isEN ? 'Or, what happened?' : 'Oppure, cos\'è successo?'}</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {injuryScenarios.map((sc, i) => (
                    <button key={i} onClick={() => handleScenario(sc)} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus flex flex-col items-start gap-2 p-3 rounded-xl text-left hover:border-green-400 transition-colors shadow-sm">
                      <sc.icon size={18} color={colors.accentDark} strokeWidth={2} />
                      <span style={{ color: colors.ink }} className="text-xs leading-snug font-medium">{sc.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={startTriage} style={{ color: colors.accentDark }} className="os-focus text-xs underline hover:opacity-70 mb-2 block">{isEN ? 'None of these — answer 3 questions' : 'Nessuno di questi — rispondi a 3 domande'}</button>
              </>
            ) : (
              <>
                <p style={{ color: colors.mutedInk }} className="text-sm mb-5 leading-relaxed">
                  {isEN ? 'The best time to work on an injury is before it happens. Choose an area — you don\'t need anything to actually hurt.' : 'Il momento migliore per lavorare su un infortunio è prima che succeda. Scegli una zona — non serve avere nulla che fa male.'}
                </p>

                <div className="mb-6">
                  <BodyDiagram onSelectRegion={(key) => { setExpandedPrevention(key); setTimeout(() => scrollToId(`prevention-${key}`), 120); }} accentColor={colors.prevention} tintColor={colors.preventionTint} />
                </div>

                <div className="space-y-2.5">
                  {Object.entries(preventionData).map(([key, data]) => {
                    const isExpanded = expandedPrevention === key;
                    const regionProgress = preventionProgress[key] || {};
                    const doneCount = data.exercises.filter((_, i) => regionProgress[i]).length;
                    const RegionIcon = regions[key]?.icon || ShieldCheck;
                    return (
                      <div key={key} id={`prevention-${key}`} style={{ backgroundColor: colors.card, border: `1px solid ${isExpanded ? colors.prevention + '55' : colors.hairline}` }} className="rounded-xl overflow-hidden shadow-sm scroll-mt-4">
                        <button onClick={() => setExpandedPrevention(isExpanded ? null : key)} className="os-focus w-full flex items-center gap-4 px-4 py-4 text-left">
                          <div style={{ backgroundColor: colors.preventionTint, border: `1.5px solid ${colors.prevention}40` }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"><RegionIcon size={19} color={colors.preventionDark} strokeWidth={2} /></div>
                          <div className="flex-1 min-w-0">
                            <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.02em' }} className="text-base font-semibold uppercase">{data.label}</p>
                            {doneCount > 0 && <p style={{ color: colors.preventionDark }} className="text-xs font-medium">{doneCount}/{data.exercises.length} fatti</p>}
                          </div>
                          <ChevronDown size={20} color={colors.mutedInk} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 os-fadein">
                            <p style={{ color: colors.mutedInk, borderBottom: `1px solid ${colors.hairline}` }} className="text-xs leading-relaxed mb-3 pb-3">{data.why}</p>
                            <div className="space-y-2">
                              {data.exercises.map((ex, i) => {
                                const done = !!regionProgress[i];
                                const CatIcon = catIcons[ex.cat] || Circle;
                                const tipKey = `${key}-${i}`;
                                const tipOpen = expandedPreventionTip === tipKey;
                                return (
                                  <div key={i} style={{ backgroundColor: done ? colors.preventionTint : colors.paper, border: `1px solid ${done ? colors.prevention + '55' : colors.hairline}` }} className="rounded-lg overflow-hidden">
                                    <button onClick={() => togglePreventionExercise(key, i)} className="os-focus w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors">
                                      {done ? <CheckCircle2 size={18} color={colors.prevention} className="flex-shrink-0 mt-0.5" strokeWidth={2.25} /> : <Circle size={18} color={colors.mutedInk} className="flex-shrink-0 mt-0.5" strokeWidth={1.75} />}
                                      <span className="flex-1">
                                        <span style={{ color: done ? colors.preventionDark : colors.ink, textDecoration: done ? 'line-through' : 'none' }} className="text-sm leading-snug block">{ex.text}</span>
                                        <span style={{ color: colors.mutedInk }} className="text-[11px] flex items-center gap-1 mt-0.5"><CatIcon size={11} />{catLabels[ex.cat]}</span>
                                      </span>
                                    </button>
                                    <button onClick={() => setExpandedPreventionTip(tipOpen ? null : tipKey)} style={{ color: colors.preventionDark }} className="os-focus flex items-center gap-1 text-[11px] font-medium px-3 pb-2.5 hover:opacity-70">
                                      <ChevronDown size={11} style={{ transform: tipOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                                      Come si fa?
                                    </button>
                                    {tipOpen && (
                                      <div className="px-3 pb-3 os-fadein">
                                        <ExerciseHelp ex={ex} isEN={isEN} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <button onClick={() => setScreen('cover')} style={{ color: colors.mutedInk }} className="os-focus text-xs underline hover:opacity-70 mt-5 block mx-auto">{isEN ? 'Back to cover' : 'Torna alla copertina'}</button>
          </>
        )}

        {screen === 'firstaid' && (
          <div>
            <p style={{ color: colors.mutedInk }} className="text-sm mb-5 leading-relaxed">
              {isEN ? 'In the first few minutes after an injury, this advice applies almost always, whatever the affected area.' : 'Nei primi minuti dopo un infortunio, queste indicazioni valgono quasi sempre, qualunque sia la zona colpita.'}
            </p>
            <div className="space-y-3 mb-6">
              {riceSteps.map((step, i) => (
                <div key={i} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 flex gap-3 shadow-sm">
                  <div style={{ backgroundColor: colors.accentTint }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center relative">
                    <step.icon size={20} color={colors.accentDark} strokeWidth={2} />
                    <span style={{ ...displayFont, backgroundColor: colors.accent, color: '#FFFFFF' }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">{step.letter}</span>
                  </div>
                  <div className="flex-1">
                    <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-0.5">{step.title}</p>
                    <p style={{ color: colors.mutedInk }} className="text-sm leading-snug">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-6 shadow-sm">
              <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2">{isEN ? 'Avoid in the first hours' : 'Da evitare nelle prime ore'}</p>
              <ul className="space-y-1">
                {riceAvoid.map((item, i) => (
                  <li key={i} style={{ color: colors.mutedInk }} className="text-sm flex gap-2"><span className="text-red-500">—</span><span>{item}</span></li>
                ))}
              </ul>
            </div>

            <button onClick={() => setScreen('regions')} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-medium shadow-sm hover:opacity-90 transition-opacity">
              <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Now choose where it hurts' : 'Ora scegli dove hai male'}</span><ArrowRight size={16} />
            </button>
          </div>
        )}

        {screen === 'triage' && (
          <div>
            <div className="flex gap-1.5 mb-6">
              {[triageAnswers.mechanism, triageAnswers.pop, triageAnswers.weight].map((answered, i) => (
                <div key={i} style={{ backgroundColor: answered ? colors.accent : colors.hairline }} className="flex-1 h-1 rounded-full transition-colors" />
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <p className="flex items-center gap-2.5 mb-3">
                  <span style={{ ...displayFont, backgroundColor: colors.accentTint, color: colors.accentDark }} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">1</span>
                  <span style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold">{isEN ? 'How did it happen?' : 'Com\'è successo?'}</span>
                </p>
                <div className="space-y-2">
                  {mechanismOptions.map((opt) => (
                    <button key={opt.key} onClick={() => answerTriage('mechanism', opt.key)}
                      style={{ backgroundColor: triageAnswers.mechanism === opt.key ? colors.accent : colors.card, color: triageAnswers.mechanism === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.mechanism === opt.key ? colors.accent : colors.hairline}` }}
                      className="os-focus w-full flex items-center gap-2.5 text-left px-4 py-3 rounded-lg text-sm transition-colors shadow-sm">
                      <opt.icon size={16} color={triageAnswers.mechanism === opt.key ? '#FFFFFF' : colors.accent} className="flex-shrink-0" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2.5 mb-3">
                  <span style={{ ...displayFont, backgroundColor: colors.accentTint, color: colors.accentDark }} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">2</span>
                  <span style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold">{isEN ? 'Did you hear a snap or "pop"?' : 'Hai sentito uno schiocco o un "pop"?'}</span>
                </p>
                <div className="flex gap-2">
                  {popOptions.map((opt) => (
                    <button key={opt.key} onClick={() => answerTriage('pop', opt.key)}
                      style={{ backgroundColor: triageAnswers.pop === opt.key ? colors.accent : colors.card, color: triageAnswers.pop === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.pop === opt.key ? colors.accent : colors.hairline}` }}
                      className="os-focus flex-1 text-center px-4 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm">{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2.5 mb-3">
                  <span style={{ ...displayFont, backgroundColor: colors.accentTint, color: colors.accentDark }} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">3</span>
                  <span style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold">{isEN ? 'Can you put weight on the leg?' : 'Riesci ad appoggiare il peso sulla gamba?'}</span>
                </p>
                <div className="space-y-2">
                  {weightOptions.map((opt) => (
                    <button key={opt.key} onClick={() => answerTriage('weight', opt.key)}
                      style={{ backgroundColor: triageAnswers.weight === opt.key ? colors.accent : colors.card, color: triageAnswers.weight === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.weight === opt.key ? colors.accent : colors.hairline}` }}
                      className="os-focus w-full text-left px-4 py-3 rounded-lg text-sm transition-colors shadow-sm">{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {triageComplete && triageRedirect && (
              <div style={{ backgroundColor: colors.redTint }} className="rounded-xl p-4 flex gap-2.5 mt-6">
                <AlertTriangle size={18} color={colors.red} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: colors.red, fontWeight: 600 }} className="text-sm mb-1">{isEN ? 'Better to get it checked by a professional' : 'Meglio farlo vedere da un professionista'}</p>
                  <p style={{ color: colors.red }} className="text-xs leading-relaxed mb-3">{isEN ? 'Based on what you indicated, we recommend a professional assessment before starting a recovery plan on your own.' : 'In base a quello che hai indicato, ti consigliamo una valutazione professionale prima di iniziare da soli un percorso di recupero.'}</p>
                  <button onClick={finishTriage} style={{ color: colors.red }} className="os-focus text-xs underline">{isEN ? 'Understood, I still want to see the general information' : 'Ho capito, voglio comunque vedere le informazioni generali'}</button>
                </div>
              </div>
            )}
            {triageComplete && !triageRedirect && (
              <button onClick={finishTriage} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-3.5 shadow-sm mt-6">
                <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Continue' : 'Continua'}</span><ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {screen === 'injuries' && selectedRegion && regions[selectedRegion] && (
          <div className="space-y-2.5">
            {regions[selectedRegion].injuries.map((key) => {
              const data = injuriesData[key];
              if (!data) return null;
              const Icon = data.icon;
              const hasProgress = injuryDates[key];
              const matches = triageTag && data.mechanismTags.includes(triageTag);
              const symptomsOpen = expandedSymptoms === key;
              return (
                <div key={key} style={{ backgroundColor: colors.card, border: `1px solid ${matches ? colors.accent : colors.hairline}` }} className="rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                  <button onClick={() => chooseInjury(key)} className="os-focus w-full flex items-center gap-4 px-4 py-4 text-left">
                    <div style={{ backgroundColor: colors.card, border: `1.5px solid ${colors.accent}40` }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"><Icon size={19} color={colors.accentDark} strokeWidth={2} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.01em' }} className="text-base font-semibold uppercase">{data.label}</p>
                        {matches && <span style={{ backgroundColor: colors.accentTint, color: colors.accentDark }} className="text-[10px] px-2 py-0.5 rounded-full font-medium">Probabilmente questo</span>}
                      </div>
                      <p style={{ color: colors.mutedInk }} className="text-sm">{data.subtitle}{hasProgress ? ' · in corso' : ''}</p>
                      <p style={{ color: colors.accentDark }} className="text-xs font-medium mt-0.5">{data.mechanismTags.map((t) => mechanismLabels[t]).join(' o ')}</p>
                    </div>
                    <ChevronRight size={20} color={colors.mutedInk} className="flex-shrink-0" />
                  </button>
                  {data.symptoms && (
                    <>
                      <button onClick={() => setExpandedSymptoms(symptomsOpen ? null : key)} style={{ color: colors.accentDark, borderTop: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold">
                        <ChevronDown size={12} style={{ transform: symptomsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                        {isEN ? 'Typical symptoms' : 'Sintomi tipici'}
                      </button>
                      {symptomsOpen && (
                        <div style={{ backgroundColor: colors.paper }} className="px-4 py-3 os-fadein">
                          <ul className="space-y-1 mb-2">
                            {data.symptoms.map((s, i) => (
                              <li key={i} style={{ color: colors.ink }} className="text-sm flex gap-2"><span style={{ color: colors.accentDark }}>—</span><span>{s}</span></li>
                            ))}
                          </ul>
                          <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed">{isEN ? 'For informational purposes only, not a diagnosis. If you think this might be it, talk to a physiotherapist or doctor for a real assessment.' : 'A titolo informativo, non una diagnosi. Se pensi possa essere questo, parlane con un fisioterapista o un medico per una valutazione vera.'}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {screen === 'tracker' && injury && phase && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span style={{ ...displayFont, color: colors.ink, letterSpacing: '0.01em' }} className="text-lg font-semibold uppercase">{injury.label}</span>
                <span style={{ color: colors.mutedInk }} className="text-sm ml-2 block sm:inline">{injury.subtitle}</span>
              </div>
              <button
                onClick={() => {
                  if (confirmingReset) { resetInjury(); setConfirmingReset(false); }
                  else { setConfirmingReset(true); setTimeout(() => setConfirmingReset(false), 3000); }
                }}
                style={{ color: confirmingReset ? colors.red : colors.mutedInk }}
                className="os-focus flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity flex-shrink-0"
              >
                <RotateCcw size={13} />{confirmingReset ? (isEN ? 'Tap to confirm' : 'Tocca per confermare') : (isEN ? 'Start over' : 'Ricomincia')}
              </button>
            </div>

            {editingSetup ? (
              <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 space-y-4 relative shadow-sm">
                <button onClick={skipDate} style={{ color: colors.mutedInk }} className="os-focus absolute top-3 right-3" aria-label={isEN ? 'Close' : 'Chiudi'}><X size={16} /></button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5 pr-6">
                    <span style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? 'Severity' : 'Gravità'}</span>
                    <button onClick={() => setShowSeverityInfo(!showSeverityInfo)} className="os-focus" aria-label={isEN ? 'What each level means' : 'Cosa significa ogni livello'}><Info size={14} color={colors.mutedInk} /></button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    {Object.keys(severityLabels).map((sev) => (
                      <button key={sev} onClick={() => setSeverity(sev)} style={{ backgroundColor: severity === sev ? colors.accent : colors.paper, color: severity === sev ? '#FFFFFF' : colors.ink, border: `1px solid ${severity === sev ? colors.accent : colors.hairline}` }} className="os-focus flex-1 rounded-lg py-2 text-sm font-medium transition-colors">{severityLabels[sev]}</button>
                    ))}
                  </div>
                  {showSeverityInfo && (
                    <div style={{ backgroundColor: colors.paper }} className="rounded-lg p-3 space-y-2 mt-3">
                      {Object.keys(severityLabels).map((sev) => (
                        <p key={sev} style={{ color: colors.mutedInk }} className="text-xs leading-relaxed"><span style={{ color: colors.ink, fontWeight: 600 }}>{severityLabels[sev]}: </span>{severityInfo[sev]}</p>
                      ))}
                    </div>
                  )}

                  <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)' }} className="rounded-xl p-4 mt-4 relative overflow-hidden">
                    <svg className="absolute bottom-0 left-0 w-full opacity-30" height="36" viewBox="0 0 200 36" preserveAspectRatio="none">
                      <path d="M0 34 Q 50 34 90 20 T 200 2" stroke={colors.accent} strokeWidth="2" fill="none" />
                    </svg>
                    <div className="relative">
                      <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.06em' }} className="text-[10px] font-semibold uppercase mb-1">{isEN ? `Recovery estimate, ${severityLabels[severity].toLowerCase()} severity` : `Stima di recupero, gravità ${severityLabels[severity].toLowerCase()}`}</p>
                      <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-2xl font-bold os-tabular mb-1">~{injury.severityData[severity].totalEstimateDays} {isEN ? 'days' : 'giorni'}</p>
                      <p style={{ color: '#A9B7C4' }} className="text-[11px] leading-relaxed mb-3">{isEN ? 'An indicative path, not a promise — it depends on how your body responds and how closely you follow it.' : 'Percorso indicativo, non una promessa — dipende da come risponde il tuo corpo e da quanto segui il percorso.'}</p>
                      <button
                        onClick={async () => {
                          const text = isEN
                            ? `I hurt my ${injury.label.toLowerCase()} (${severityLabels[severity].toLowerCase()} severity). On Offside the estimate is around ${injury.severityData[severity].totalEstimateDays} days, following the plan — let's see how it goes, I'll keep you posted.`
                            : `Mi sono fatto male: ${injury.label.toLowerCase()} (gravità ${severityLabels[severity].toLowerCase()}). Su Offside la stima indicativa è di circa ${injury.severityData[severity].totalEstimateDays} giorni, seguendo il percorso — vediamo come va, vi aggiorno.`;
                          try {
                            if (navigator.share) await navigator.share({ text });
                            else if (navigator.clipboard) { await navigator.clipboard.writeText(text); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
                          } catch (err) {}
                        }}
                        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                        className="os-focus flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium w-full hover:bg-white/20 transition-colors"
                      >
                        <Share2 size={13} />{shareCopied ? (isEN ? 'Copied' : 'Copiato') : (isEN ? 'Tell your team' : 'Dillo alla squadra')}
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid ${colors.hairline}` }} className="pt-4">
                  <p className="flex items-center gap-2 mb-3"><Calendar size={15} color={colors.accentDark} /><span style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? 'When did it happen?' : 'Quando è successo?'}</span></p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {dateChips.map((chip) => (
                      <button key={chip.label} onClick={() => { const d = new Date(); d.setDate(d.getDate() - chip.days); commitDate(toISODate(d)); }} style={{ backgroundColor: colors.accentTint, color: colors.accentDark }} className="os-focus px-3 py-1.5 rounded-full text-sm hover:opacity-80 transition-opacity">{chip.label}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={pendingDate} className="os-date os-focus text-sm px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${colors.hairline}`, color: colors.ink }} max={toISODate(new Date())} onChange={(e) => setPendingDate(e.target.value)} />
                    <button onClick={() => pendingDate && commitDate(pendingDate)} disabled={!pendingDate} style={{ backgroundColor: pendingDate ? colors.accent : colors.hairline, color: pendingDate ? '#FFFFFF' : colors.mutedInk }} className="os-focus px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">{isEN ? 'Confirm date' : 'Conferma data'}</button>
                  </div>
                  <button onClick={skipDate} style={{ color: colors.mutedInk }} className="os-focus text-sm underline hover:opacity-70 mt-2 block">{isEN ? 'I\'d rather not say' : 'Preferisco non specificarla'}</button>
                </div>
                {severity === 'severo' && (
                  <div style={{ backgroundColor: colors.redTint }} className="rounded-lg p-3 flex gap-2">
                    <AlertTriangle size={15} color={colors.red} className="flex-shrink-0 mt-0.5" />
                    <p style={{ color: colors.red }} className="text-xs leading-relaxed">{isEN ? 'With severe severity, we recommend seeing a professional before starting this plan on your own.' : 'Con gravità severa ti consigliamo di sentire un professionista prima di iniziare da solo questo percorso.'}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: colors.laneBg }} className="flex gap-1 p-1 rounded-full mb-4">
                  <button onClick={() => setTrackerTab('oggi')} style={{ backgroundColor: trackerTab === 'oggi' ? colors.card : 'transparent', color: trackerTab === 'oggi' ? colors.ink : colors.mutedInk }} className="os-focus flex-1 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm">{isEN ? 'Today' : 'Oggi'}</button>
                  <button onClick={() => setTrackerTab('percorso')} style={{ backgroundColor: trackerTab === 'percorso' ? colors.card : 'transparent', color: trackerTab === 'percorso' ? colors.ink : colors.mutedInk }} className="os-focus flex-1 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm">{isEN ? 'Recovery' : 'Percorso'}</button>
                </div>

                {trackerTab === 'oggi' ? (
                  currentDate ? (
                    <>
                      <button onClick={() => setEditingSetup(true)} className="os-focus w-full text-left mb-3">
                        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span style={{ ...displayFont, color: colors.mutedInk }} className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1">{isEN ? 'Recovery lane' : 'Corsia di recupero'} <Pencil size={11} className="ml-1" /></span>
                            <span style={{ ...displayFont, color: colors.accentDark }} className="os-tabular text-xl font-bold">{isEN ? 'Day' : 'Giorno'} {dayCount}</span>
                          </div>
                          <div className="flex gap-1 relative pt-1.5">
                            {segments.map((seg, i) => (
                              <div key={i} className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.laneBg, flexGrow: seg.span, flexBasis: 0 }}>
                                <div className="os-fill absolute inset-y-0 left-0 rounded-full" style={{ width: `${seg.fill}%`, backgroundColor: colors.accent }} />
                              </div>
                            ))}
                            <div
                              className="absolute rounded-full os-fill shadow-sm"
                              style={{
                                width: '10px', height: '10px', top: '1px', backgroundColor: colors.ink, border: `2px solid ${colors.accent}`,
                                left: `calc(${Math.min(100, (dayCount / totalEstimateDays) * 100)}% - 5px)`,
                              }}
                            />
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            {injury.phases.map((p, i) => (
                              <div key={i} style={{ flexGrow: segments[i]?.span || 1, flexBasis: 0 }} className="text-center">
                                <span style={{ ...displayFont, color: i === activePhase ? colors.accentDark : colors.mutedInk }} className="text-[10px] font-semibold uppercase">F{i + 1}</span>
                              </div>
                            ))}
                          </div>
                          <p style={{ color: colors.mutedInk }} className="text-[11px] mt-2">{isEN ? `${severityLabels[severity]} severity · indicative path over ~${totalEstimateDays} days` : `Gravità ${severityLabels[severity].toLowerCase()} · percorso indicativo su ~${totalEstimateDays} giorni`}</p>
                        </div>
                      </button>

                      <div style={{ backgroundColor: todayEntry.done ? colors.accentDark : colors.card, border: `1px solid ${todayEntry.done ? colors.accentDark : colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span style={{ ...displayFont, color: todayEntry.done ? '#FFFFFF' : colors.ink }} className="text-sm font-semibold capitalize">{formatTodayLabel(isEN)}</span>
                          {streak > 0 && (
                            <span style={{ ...displayFont, color: todayEntry.done ? '#FFD9A0' : colors.orange }} className="flex items-center gap-1 text-sm font-bold os-tabular">
                              <Flame size={15} strokeWidth={2.5} />{streak}
                            </span>
                          )}
                        </div>

                        <p style={{ color: todayEntry.done ? '#C9D8E5' : colors.mutedInk }} className="text-xs mb-2">{isEN ? 'How do you feel today?' : 'Come ti senti oggi?'}</p>
                        <div className="flex gap-1.5 mb-3">
                          {feelingOptions.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setTodayFeeling(opt.key)}
                              style={{
                                backgroundColor: todayEntry.feeling === opt.key ? colors.accent : (todayEntry.done ? 'rgba(255,255,255,0.1)' : colors.paper),
                                color: todayEntry.feeling === opt.key ? '#FFFFFF' : (todayEntry.done ? '#D7E1EA' : colors.ink),
                              }}
                              className="os-focus flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        <p style={{ color: todayEntry.done ? '#C9D8E5' : colors.mutedInk }} className="text-xs mb-2">{isEN ? 'Stiffness this morning?' : 'Rigidità stamattina?'}</p>
                        <div className="flex gap-1.5 mb-3">
                          {stiffnessOptions.map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setTodayStiffness(opt.key)}
                              style={{
                                backgroundColor: todayEntry.stiffness === opt.key ? colors.accent : (todayEntry.done ? 'rgba(255,255,255,0.1)' : colors.paper),
                                color: todayEntry.stiffness === opt.key ? '#FFFFFF' : (todayEntry.done ? '#D7E1EA' : colors.ink),
                              }}
                              className="os-focus flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {todayEntry.feeling === 'male' ? (
                          <p style={{ color: todayEntry.done ? '#FFD0CC' : colors.red }} className="text-xs mb-3 leading-relaxed">
                            {isEN
                              ? 'Maybe take it easy today — review the warning signs above, and if the pain is worse than usual consider waiting before loading it.'
                              : 'Magari oggi vacci piano — rivedi i segnali d\'allarme in alto, e se il dolore è più forte del solito considera di aspettare prima di caricare.'}
                          </p>
                        ) : dailyGuidance(todayEntry.feeling, todayEntry.stiffness) && (
                          <div style={{ backgroundColor: todayEntry.done ? 'rgba(255,255,255,0.1)' : colors.accentTint }} className="rounded-lg p-3 mb-3">
                            <p style={{ ...displayFont, color: todayEntry.done ? '#FFFFFF' : colors.accentDark }} className="text-xs font-semibold mb-0.5">{dailyGuidance(todayEntry.feeling, todayEntry.stiffness).label}</p>
                            <p style={{ color: todayEntry.done ? '#C9D8E5' : colors.accentDark }} className="text-[11px] leading-snug">{dailyGuidance(todayEntry.feeling, todayEntry.stiffness).detail}</p>
                          </div>
                        )}

                        <button
                          onClick={toggleToday}
                          style={{ backgroundColor: todayEntry.done ? 'rgba(255,255,255,0.15)' : colors.accentTint, color: todayEntry.done ? '#FFFFFF' : colors.accentDark, border: todayEntry.done ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                          className="os-focus w-full flex items-center justify-center gap-2 rounded-lg py-3 mt-2 transition-all hover:opacity-90"
                        >
                          {todayEntry.done ? <CheckCircle2 size={18} strokeWidth={2.25} /> : <Circle size={18} strokeWidth={1.75} />}
                          <span style={displayFont} className="text-sm font-semibold uppercase tracking-wide">
                            {todayEntry.done ? (isEN ? 'Today\'s session completed' : 'Sessione di oggi completata') : (isEN ? 'Mark today\'s session as done' : 'Segna sessione di oggi come fatta')}
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => setEditingSetup(true)} style={{ color: colors.accentDark, backgroundColor: colors.accentTint }} className="os-focus w-full justify-center rounded-xl p-4 flex items-center gap-2 text-sm font-medium mb-5 hover:opacity-80 transition-opacity">
                      <Calendar size={16} />Aggiungi data per sbloccare il tracker
                    </button>
                  )
                ) : (
                  <>
                    <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)' }} className="rounded-xl p-4 mb-3 shadow-sm">
                      <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.12em' }} className="text-[10px] font-bold uppercase mb-1">{isEN ? `Phase ${activePhase + 1} of ${injury.phases.length}` : `Fase ${activePhase + 1} di ${injury.phases.length}`}</p>
                      <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-xl font-bold uppercase mb-1.5">{phase.name}</p>
                      <p style={{ color: '#A9B7C4' }} className="text-sm">{phaseRangeLabel(activePhase, dayThresholds, isEN)} · {isEN ? 'severity' : 'gravità'} {severityLabels[severity].toLowerCase()}</p>
                    </div>

                    <div className="flex items-stretch gap-1.5 mb-5">
                      {injury.phases.map((p, i) => {
                        const isActive = i === activePhase;
                        const pKey = `${selectedInjury}-${i}`;
                        const pProgress = progress[pKey] || {};
                        const pDone = p.exercises.length > 0 && p.exercises.filter((_, ei) => pProgress[ei]).length === p.exercises.length;
                        return (
                          <button key={i} onClick={() => changePhase(i)} style={{ backgroundColor: isActive ? colors.accent : colors.card, border: `1px solid ${isActive ? colors.accent : colors.hairline}`, color: isActive ? '#FFFFFF' : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wide transition-colors shadow-sm">
                            F{i + 1}{pDone && <CheckCircle2 size={12} strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-4 shadow-sm">
                      <p className="flex items-center gap-2 mb-2"><Info size={15} color={colors.accentDark} /><span style={{ ...displayFont, color: colors.accentDark }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? 'Why this phase' : 'Perché questa fase'}</span></p>
                      <p style={{ color: colors.ink }} className="text-sm leading-relaxed">{phase.why}</p>
                    </div>

                    {phase.criteriaToAdvance && (
                      <div style={{ backgroundColor: colors.accentTint, border: `1px solid ${colors.accent}33` }} className="rounded-xl p-4 mb-4 shadow-sm">
                        <p className="flex items-center gap-2 mb-2">
                          <ClipboardCheck size={15} color={colors.accentDark} />
                          <span style={{ ...displayFont, color: colors.accentDark }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? 'Before moving on, ask yourself' : 'Prima di avanzare, chiediti'}</span>
                        </p>
                        <ul className="space-y-1 mb-1">
                          {phase.criteriaToAdvance.map((c, i) => (
                            <li key={i} style={{ color: colors.ink }} className="text-sm flex gap-2"><span style={{ color: colors.accentDark }}>—</span><span>{c}</span></li>
                          ))}
                        </ul>
                        <p style={{ color: colors.accentDark, fontWeight: 500 }} className="text-xs mt-2">{isEN ? 'A self-check, not a clinical test.' : 'Un autocontrollo, non un test clinico.'}</p>
                      </div>
                    )}

                    {activePhase === injury.phases.length - 1 && (
                      <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm">
                        <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2.5">{isEN ? 'What position do you play?' : 'Che ruolo giochi?'}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {playerPositions.map((pos) => (
                            <button key={pos.key} onClick={() => { setPlayerPosition(pos.key); persist(snapshot({ playerPosition: pos.key })); }} style={{ backgroundColor: playerPosition === pos.key ? colors.accent : colors.paper, color: playerPosition === pos.key ? '#FFFFFF' : colors.ink, border: `1px solid ${playerPosition === pos.key ? colors.accent : colors.hairline}` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                              {pos.label}
                            </button>
                          ))}
                        </div>
                        {playerPosition && (
                          <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{playerPositions.find((p) => p.key === playerPosition)?.tip}</p>
                        )}
                      </div>
                    )}

                    {completedCount === phase.exercises.length && phase.exercises.length > 0 && (
                      activePhase === injury.phases.length - 1 ? (
                        <div style={{ background: 'linear-gradient(160deg, #16283A 0%, #0A1118 100%)', border: `1px solid ${colors.accent}55` }} className="rounded-xl p-5 mb-4 relative overflow-hidden os-fadein shadow-lg">
                          <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 300 150" fill="none" preserveAspectRatio="xMidYMid slice">
                            <circle cx="150" cy="20" r="120" stroke={colors.accent} strokeWidth="1.5" />
                          </svg>
                          <div className="relative text-center">
                            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: `1.5px solid ${colors.accent}` }} className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Trophy size={26} color={colors.accent} strokeWidth={2} />
                            </div>
                            <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.1em' }} className="text-[10px] font-bold uppercase mb-1">{isEN ? 'Recovery completed' : 'Percorso completato'}</p>
                            <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-lg font-bold mb-2">{injury.label}</p>
                            <p style={{ color: '#A9B7C4' }} className="text-xs leading-relaxed mb-4 max-w-xs mx-auto">{isEN ? 'You\'ve completed every phase of the guided plan. If you feel ready for a full return, one last check with a professional never hurts.' : 'Hai portato a termine tutte le fasi del percorso guidato. Se ti senti pronto per il rientro pieno, un ultimo controllo con un professionista non fa mai male.'}</p>
                            <button
                              onClick={async () => {
                                const text = isEN
                                  ? `I completed my ${injury.label.toLowerCase()} recovery plan on Offside — every phase done. Back on the pitch! 💪`
                                  : `Ho completato il percorso di recupero da ${injury.label.toLowerCase()} su Offside — tutte le fasi fatte. Si torna in campo! 💪`;
                                try {
                                  if (navigator.share) await navigator.share({ text });
                                  else if (navigator.clipboard) { await navigator.clipboard.writeText(text); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }
                                } catch (err) {}
                              }}
                              style={{ backgroundColor: colors.accent, color: '#101B26' }}
                              className="os-focus flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold mx-auto"
                            >
                              <Share2 size={13} />{shareCopied ? (isEN ? 'Copied' : 'Copiato') : (isEN ? 'Share the milestone' : 'Condividi il traguardo')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)' }} className="rounded-xl p-4 mb-4 flex items-center gap-3 os-fadein shadow-md">
                          <div style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                            <Trophy size={19} color={colors.accent} strokeWidth={2} />
                          </div>
                          <div>
                            <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-sm font-semibold">{isEN ? 'Phase completed' : 'Fase completata'}</p>
                            <p style={{ color: '#B9C4CF' }} className="text-xs leading-snug">{isEN ? 'When you feel ready, move to the next phase above.' : 'Quando ti senti pronto, passa alla fase successiva in alto.'}</p>
                          </div>
                        </div>
                      )
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <span style={{ ...displayFont, color: colors.ink, letterSpacing: '0.08em' }} className="text-xs font-semibold uppercase">{isEN ? 'Exercises' : 'Esercizi'}</span>
                      <span style={{ ...displayFont, color: colors.accentDark }} className="os-tabular text-lg font-bold">{completedCount}<span style={{ color: colors.mutedInk }} className="text-sm font-normal"> / {phase.exercises.length}</span></span>
                    </div>
                    <p style={{ color: colors.mutedInk }} className="text-[11px] mb-4">{isEN ? 'Adjust them to how your body responds, don\'t push through sharp pain.' : 'Adattali a come risponde il tuo corpo, non forzare sul dolore acuto.'}</p>

                    <div>
                      {phase.exercises.map((ex, i) => {
                        const done = !!phaseProgress[i];
                        const isLast = i === phase.exercises.length - 1;
                        const exKey = `${activePhase}-${i}`;
                        const isVideoOpen = activeVideo === exKey;
                        
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center flex-shrink-0" style={{ width: '32px' }}>
                              <button onClick={() => toggleExercise(i)} style={{ backgroundColor: done ? colors.accent : colors.card, border: `2px solid ${done ? colors.accent : colors.hairline}` }} className="os-focus w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-colors">
                                {done ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : <span style={{ ...displayFont, color: colors.mutedInk }} className="text-xs font-bold">{i + 1}</span>}
                              </button>
                              {!isLast && <div style={{ backgroundColor: done ? colors.accent : colors.hairline }} className="flex-1 -my-1 w-0.5 transition-colors" />}
                            </div>
                            <div className="flex-1 min-w-0 pb-6 pt-1">
                              <div className="flex items-start justify-between gap-2">
                                <button onClick={() => toggleExercise(i)} className="os-focus text-left flex-1">
                                  <span style={{ color: done ? colors.accentDark : colors.ink, textDecoration: done ? 'line-through' : 'none', textDecorationColor: colors.accent + '99' }} className="text-sm leading-snug block">{ex.text}</span>
                                </button>
                                <span style={{ backgroundColor: colors.paper, color: colors.ink, fontWeight: 600 }} className="text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap mt-0.5">{catLabels[ex.cat]}</span>
                              </div>
                              
                              <button 
                                onClick={() => setActiveVideo(isVideoOpen ? null : exKey)} 
                                style={{ color: colors.accentDark, backgroundColor: colors.accentTint }} 
                                className="os-focus flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium mt-2 hover:opacity-80 transition-opacity"
                              >
                                {isVideoOpen ? <ChevronDown size={12} /> : <PlayCircle size={12} />} 
                                {isVideoOpen ? (isEN ? 'Close' : 'Chiudi') : (isEN ? 'How do I do this?' : 'Come si fa?')}
                              </button>

                              {isVideoOpen && (
                                <div className="os-fadein">
                                  <ExerciseHelp ex={ex} isEN={isEN} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {injury.relatedInjuries && injury.relatedInjuries.length > 0 && (
                      <div style={{ borderTop: `1px solid ${colors.hairline}` }} className="mt-6 pt-5">
                        <svg width="32" height="8" viewBox="0 0 32 8" className="mb-2">
                          <line x1="0" y1="4" x2="32" y2="4" stroke={colors.accent} strokeWidth="1.5" strokeDasharray="1 4" />
                          <circle cx="4" cy="4" r="2" fill={colors.accent} />
                          <circle cx="28" cy="4" r="2" fill={colors.accent} />
                        </svg>
                        <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.08em' }} className="text-xs font-semibold uppercase mb-1">{isEN ? 'Connected to' : 'Collegato a'}</p>
                        <p style={{ color: colors.mutedInk }} className="text-xs mb-3 leading-relaxed">{injury.relatedReason}</p>
                        <div className="flex flex-wrap gap-2">
                          {injury.relatedInjuries.map((relKey) => {
                            const rel = injuriesData[relKey];
                            if (!rel) return null;
                            const RelIcon = rel.icon;
                            return (
                              <button key={relKey} onClick={() => chooseInjury(relKey)} style={{ backgroundColor: colors.accentTint, color: colors.accentDark }} className="os-focus flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium hover:opacity-80 transition-opacity">
                                <RelIcon size={13} />{rel.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${colors.hairline}`, color: colors.mutedInk }} className="px-5 sm:px-8 py-4 text-xs leading-relaxed text-center">
        {isEN ? 'General informational content. Not a substitute for a medical assessment. If in doubt, see a professional.' : 'Contenuto informativo generale. Non sostituisce una valutazione medica. In caso di dubbi rivolgiti a un professionista.'}
        {saveError && <div style={{ color: colors.red }} className="mt-2 flex items-center justify-center gap-1.5"><X size={13} /> {isEN ? 'Data could not be saved.' : 'Salvataggio dati non riuscito.'}</div>}
        <a href="mailto:manuelegusella@icloud.com?subject=Feedback%20Offside" style={{ color: colors.accentDark }} className="os-focus flex items-center justify-center gap-1.5 mt-3 hover:underline">
          <Share2 size={11} />{isEN ? 'Found a problem or have a suggestion? Let me know' : 'Hai trovato un problema o hai un suggerimento? Scrivimelo'}
        </a>
      </div>
    </div>
  );
}