import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// SOSTITUISCI questo con il tuo vero Payment Link di Stripe una volta creato
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_dRmbJ1c2K3Zt1sB8mB7IY00';

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
  Snowflake, Bandage, ArrowUp, Trophy, Video, Lock, Download, CalendarPlus, Smartphone, User, Hand, Grip, MapPin, Phone, Mail, Stethoscope, ExternalLink, Search
} from 'lucide-react';

const colors = {
  paper: '#EEF3F8', card: '#FFFFFF', hairline: '#D7E1EA', ink: '#101B26',
  mutedInk: '#57697A', accent: '#22C55E', accentTint: '#DCFCE7', accentDark: '#15803D',
  red: '#AE3830', redTint: '#F6DEDB', laneBg: '#DFE7EF', orange: '#C96A22',
  prevention: '#14B8A6', preventionTint: '#CCFBF1', preventionDark: '#0F766E', preventionPaper: '#EDFCFA',
  premiumGold: '#F0B429', premiumGoldTint: 'rgba(240,180,41,0.18)',
};

const STORAGE_KEY = 'injury-recovery-progress-v3';

const catIcons = { balance: Scale, strength: Dumbbell, stretch: Move, run: Wind, hold: Timer, rest: Pause };
// Un video di riferimento generale per categoria, da fonti verificate (fisioterapisti/professionisti veri).
// "run" ha una fonte meno consolidata delle altre, verificarla prima di fidarsene al 100%. "rest" non ha un video adatto, resta il link di ricerca.
const catVideoIds = {
  balance: 'Dtgh2_LFkBQ',   // Ask Doctor Jo — Single Leg Balance
  strength: 'yQKxITLikiE',  // Ask Doctor Jo — 10 Best Knee Pain Strengthening Exercises
  stretch: 'y9fNh7cYo64',   // Ask Doctor Jo — Total Body Stretch
  run: 'zpZw26dYRVI',       // Agility Ladder Drills & Change of Direction Speed Drills
  hold: 'MWs2TaDWQVQ',      // Ask Doctor Jo — Knee & Hip Isometric Exercises
};
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
  shoulder_impingement: {
    relatedInjuries: ['ac_joint', 'bicep_tendinopathy'], relatedReason: 'Spalla, articolazione acromion-claveare e bicipite condividono lo stesso meccanismo di lancio/rinvio del portiere.',
    label: 'Conflitto di spalla', subtitle: 'Impingement subacromiale, spesso da rinvii ripetuti', icon: Grip, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [7, 21], totalEstimateDays: 35 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 63 },
      severo: { dayThresholds: [28, 63], totalEstimateDays: 120 },
    },
    specialRedFlags: [
      'Non riesci a sollevare il braccio sopra la testa per niente, nemmeno lentamente',
      'Senti formicolio o debolezza che scende lungo il braccio fino alla mano',
    ],
    phases: [
      { name: 'Riduzione carico', why: 'Il tendine è infiammato dal sovraccarico ripetuto (rinvii, lanci). I primi giorni servono a calmarlo, evitando movimenti sopra la testa.',
        exercises: [
          { text: 'Pendolo di Codman: lascia il braccio penzolare e oscillare leggermente, senza forzare', cat: 'stretch' },
          { text: 'Evita rinvii e lanci sopra la testa nei primi giorni', cat: 'rest' },
          { text: 'Mobilità leggera della spalla entro il dolore, senza sollevare oltre l\'orizzontale', cat: 'stretch' },
        ] },
      { name: 'Recupero attivo', why: 'Si inizia a rinforzare i muscoli della cuffia dei rotatori e della scapola, che spesso sono il vero punto debole dietro un conflitto di spalla.',
        criteriaToAdvance: ['Riesci a sollevare il braccio all\'altezza delle spalle senza dolore acuto', 'Il dolore a riposo è chiaramente diminuito'],
        exercises: [
          { text: 'Rotazione esterna con elastico, gomito fermo al fianco (3 serie da 12-15)', cat: 'strength' },
          { text: 'Rinforzo della scapola: stringi le scapole insieme e tieni (3 serie da 10, tenuta 5 secondi)', cat: 'hold' },
          { text: 'Sollevamenti laterali controllati sotto l\'altezza della spalla (2-3 serie da 12)', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a rinviare e lanciare a piena potenza, la spalla deve tollerare il movimento sopra la testa ripetuto senza dolore.',
        criteriaToAdvance: ['Riesci a sollevare il braccio completamente sopra la testa senza dolore', 'Nessun dolore dopo un rinvio leggero di prova'],
        exercises: [
          { text: 'Rinvii progressivi, partendo da distanza ridotta', cat: 'strength' },
          { text: 'Esercizi di lancio/presa a intensità crescente', cat: 'strength' },
          { text: 'Simulazione di tuffo con presa sopra la testa', cat: 'balance' },
        ] },
    ],
  },
  ac_joint: {
    relatedInjuries: ['shoulder_impingement'], relatedReason: 'Una caduta sulla spalla che coinvolge l\'acromion-claveare spesso lascia rigidità che assomiglia a un conflitto di spalla.',
    label: 'Trauma acromion-claveare', subtitle: 'Caduta sulla punta della spalla, tipico dei tuffi', icon: Grip, mechanismTags: ['acute', 'contact'],
    severityData: {
      lieve: { dayThresholds: [7, 14], totalEstimateDays: 21 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 56 },
      severo: { dayThresholds: [35, 70], totalEstimateDays: 126 },
    },
    specialRedFlags: [
      'Vedi una protuberanza o un gradino visibile sopra la spalla che prima non c\'era',
      'Non riesci a muovere il braccio per niente subito dopo il trauma',
    ],
    phases: [
      { name: 'Protezione', why: 'Dopo un impatto diretto sulla punta della spalla, il legamento acromion-claveare va protetto da ulteriori sollecitazioni nei primi giorni.',
        exercises: [
          { text: 'Tutore/fascia di supporto se consigliato, braccio a riposo vicino al corpo', cat: 'rest' },
          { text: 'Mobilità del gomito e della mano per non irrigidirli, senza muovere la spalla', cat: 'stretch' },
          { text: 'Ghiaccio sulla parte superiore della spalla nei primi giorni', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Il legamento inizia a tollerare movimento controllato. Si lavora per recuperare l\'ampiezza di movimento persa nei primi giorni.',
        criteriaToAdvance: ['Riesci a muovere il braccio all\'altezza della spalla senza dolore acuto', 'Il dolore alla pressione diretta sulla zona è diminuito'],
        exercises: [
          { text: 'Mobilità attiva della spalla in tutte le direzioni, entro il dolore', cat: 'stretch' },
          { text: 'Rinforzo isometrico leggero della spalla (tenuta 15-20 secondi, 3-4 volte)', cat: 'hold' },
          { text: 'Rinforzo della scapola con elastico leggero', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare ai tuffi e ai contatti fisici, la spalla deve tollerare un carico diretto sulla zona senza dolore.',
        criteriaToAdvance: ['Riesci ad appoggiarti sul braccio senza dolore alla spalla', 'Nessun dolore in un\'attività fisica moderata di prova'],
        exercises: [
          { text: 'Appoggi progressivi sul braccio (da terra in ginocchio, poi in piedi)', cat: 'strength' },
          { text: 'Simulazione di caduta/atterraggio controllata su superficie morbida', cat: 'balance' },
          { text: 'Ripresa graduale dei tuffi, da distanza ridotta', cat: 'run' },
        ] },
    ],
  },
  bicep_tendinopathy: {
    relatedInjuries: ['shoulder_impingement'], relatedReason: 'Il bicipite si inserisce vicino alla cuffia dei rotatori, quindi un sovraccarico dell\'uno spesso coinvolge l\'altra.',
    label: 'Tendinopatia del bicipite', subtitle: 'Da presa e lancio ripetuti', icon: Grip, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [7, 21], totalEstimateDays: 35 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 63 },
      severo: { dayThresholds: [28, 56], totalEstimateDays: 105 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Il tendine del bicipite è infiammato da prese e lanci ripetuti. Serve ridurre il carico prima di iniziare a rinforzarlo.',
        exercises: [
          { text: 'Evita prese e lanci ripetuti nei primi giorni', cat: 'rest' },
          { text: 'Mobilità leggera del gomito e della spalla entro il dolore', cat: 'stretch' },
          { text: 'Massaggio leggero con automassaggio o foam roller sul braccio', cat: 'stretch' },
        ] },
      { name: 'Recupero attivo', why: 'Il tendine risponde bene a un carico progressivo e controllato, in particolare nella fase di allungamento del movimento (eccentrica).',
        criteriaToAdvance: ['Riesci a piegare il gomito contro resistenza leggera senza dolore acuto', 'Il dolore alla pressione sul tendine è diminuito'],
        exercises: [
          { text: 'Curl del bicipite con enfasi sulla fase di discesa lenta (3 serie da 10-12)', cat: 'strength' },
          { text: 'Presa isometrica: stringi un oggetto e tieni (3 serie da 20 secondi)', cat: 'hold' },
          { text: 'Rinforzo della cuffia dei rotatori con elastico leggero', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a lanciare e parare a piena intensità, il tendine deve tollerare presa e trazione ripetute senza dolore.',
        criteriaToAdvance: ['Riesci a fare curl a pieno carico senza dolore', 'Nessun dolore dopo prese ripetute di prova'],
        exercises: [
          { text: 'Lanci e prese progressivi, da intensità ridotta', cat: 'strength' },
          { text: 'Simulazione di parata con presa del pallone', cat: 'balance' },
        ] },
    ],
  },
  wrist_sprain: {
    relatedInjuries: ['finger_jam', 'thumb_sprain'], relatedReason: 'Polso, dita e pollice spesso si infortunano insieme nella stessa caduta su mano aperta.',
    label: 'Distorsione di polso', subtitle: 'Caduta su mano aperta, comune nei tuffi', icon: Hand, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [4, 10], totalEstimateDays: 18 },
      moderato: { dayThresholds: [7, 21], totalEstimateDays: 35 },
      severo: { dayThresholds: [14, 42], totalEstimateDays: 84 },
    },
    specialRedFlags: [
      'Il polso appare visibilmente deformato o gonfio in modo marcato subito dopo la caduta',
      'Il dolore è concentrato in un punto preciso dell\'osso, non diffuso su tutto il polso',
    ],
    phases: [
      { name: 'Protezione', why: 'Dopo una caduta sulla mano aperta, i legamenti del polso sono infiammati. Si protegge il polso evitando l\'appoggio diretto.',
        exercises: [
          { text: 'Evita di appoggiarti sulla mano (niente flessioni, niente appoggi a terra)', cat: 'rest' },
          { text: 'Mobilità delle dita per non irrigidirle, senza muovere il polso', cat: 'stretch' },
          { text: 'Ghiaccio sul polso nei primi giorni', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Il legamento inizia a tollerare movimento controllato. Si lavora su ampiezza di movimento e forza di presa.',
        criteriaToAdvance: ['Riesci a muovere il polso in tutte le direzioni senza dolore acuto', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: 'Mobilità attiva del polso: flessione, estensione, rotazione', cat: 'stretch' },
          { text: 'Rinforzo di presa con una pallina morbida (3 serie da 15)', cat: 'strength' },
          { text: 'Rinforzo del polso con elastico leggero, tutte le direzioni', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a tuffarti e appoggiarti sulle mani, il polso deve tollerare un carico diretto senza dolore.',
        criteriaToAdvance: ['Riesci ad appoggiarti sulla mano a terra senza dolore', 'Nessun dolore dopo una parata di prova a bassa intensità'],
        exercises: [
          { text: 'Appoggi progressivi sulla mano (in ginocchio, poi in piedi)', cat: 'strength' },
          { text: 'Simulazione di parata e appoggio controllato', cat: 'balance' },
          { text: 'Ripresa graduale dei tuffi', cat: 'run' },
        ] },
    ],
  },
  finger_jam: {
    relatedInjuries: ['wrist_sprain', 'thumb_sprain'], relatedReason: 'Polso, dita e pollice spesso si infortunano insieme nello stesso impatto con il pallone.',
    label: 'Trauma alle dita', subtitle: 'Impatto diretto del pallone, "dito incastrato"', icon: Hand, mechanismTags: ['acute', 'contact'],
    severityData: {
      lieve: { dayThresholds: [3, 7], totalEstimateDays: 14 },
      moderato: { dayThresholds: [7, 14], totalEstimateDays: 28 },
      severo: { dayThresholds: [14, 35], totalEstimateDays: 63 },
    },
    specialRedFlags: [
      'Il dito appare storto o deformato rispetto agli altri',
      'Non riesci a stendere completamente il dito da solo',
    ],
    phases: [
      { name: 'Protezione', why: 'Dopo un impatto diretto, l\'articolazione del dito è infiammata. Si protegge nei primi giorni, spesso con un bendaggio al dito vicino (buddy taping).',
        exercises: [
          { text: 'Bendaggio al dito adiacente (buddy taping) se consigliato', cat: 'rest' },
          { text: 'Ghiaccio sul dito nei primi giorni', cat: 'rest' },
          { text: 'Evita prese dirette del pallone nei primi giorni', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Si recupera l\'ampiezza di movimento dell\'articolazione e si inizia a rinforzare la presa.',
        criteriaToAdvance: ['Riesci a piegare e stendere il dito senza dolore acuto', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: 'Mobilità attiva del dito, piega ed estendi lentamente', cat: 'stretch' },
          { text: 'Rinforzo di presa con una pallina morbida (3 serie da 15)', cat: 'strength' },
          { text: 'Esercizi di pinza tra pollice e dito infortunato', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a parare, il dito deve tollerare l\'impatto diretto del pallone senza dolore.',
        criteriaToAdvance: ['Riesci a stringere il pugno completamente senza dolore', 'Nessun dolore dopo prese leggere di prova'],
        exercises: [
          { text: 'Prese progressive del pallone, da distanza ridotta e velocità bassa', cat: 'strength' },
          { text: 'Simulazione di parate a mani aperte', cat: 'balance' },
        ] },
    ],
  },
  thumb_sprain: {
    relatedInjuries: ['wrist_sprain', 'finger_jam'], relatedReason: 'Polso, dita e pollice spesso si infortunano insieme nella stessa presa o caduta.',
    label: 'Distorsione del pollice', subtitle: 'Torsione in presa o caduta, coinvolge spesso il legamento interno', icon: Hand, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 14], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 42 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 90 },
    },
    specialRedFlags: [
      'Il pollice appare instabile, come se "cedesse" lateralmente sotto pressione leggera',
      'Non riesci a stringere niente tra pollice e indice per il dolore',
    ],
    phases: [
      { name: 'Protezione', why: 'Il legamento alla base del pollice è infiammato dalla torsione. Si protegge nei primi giorni, spesso con un tutore specifico.',
        exercises: [
          { text: 'Tutore/fascia per il pollice se consigliato', cat: 'rest' },
          { text: 'Ghiaccio sulla base del pollice nei primi giorni', cat: 'rest' },
          { text: 'Evita prese a pinza (pollice contro indice) nei primi giorni', cat: 'rest' },
        ] },
      { name: 'Recupero attivo', why: 'Si recupera l\'ampiezza di movimento e si inizia a rinforzare gradualmente la presa a pinza.',
        criteriaToAdvance: ['Riesci a muovere il pollice in tutte le direzioni senza dolore acuto', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: 'Mobilità attiva del pollice in tutte le direzioni', cat: 'stretch' },
          { text: 'Rinforzo di presa a pinza leggera con una pallina morbida', cat: 'strength' },
          { text: 'Rinforzo con elastico leggero attorno al pollice', cat: 'strength' },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a parare, il pollice deve tollerare la presa del pallone sotto pressione senza cedere.',
        criteriaToAdvance: ['Riesci a stringere a pinza con forza senza dolore', 'Nessuna sensazione di instabilità nella presa'],
        exercises: [
          { text: 'Prese progressive del pallone a due mani', cat: 'strength' },
          { text: 'Simulazione di parate con presa ferma', cat: 'balance' },
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
  shoulder_impingement: {
    relatedInjuries: ['ac_joint', 'bicep_tendinopathy'], relatedReason: 'The shoulder, AC joint, and bicep share the same throwing/clearing motion goalkeepers repeat constantly.',
    label: 'Shoulder impingement', subtitle: 'Subacromial impingement, often from repeated throws', icon: Grip, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [7, 21], totalEstimateDays: 35 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 63 },
      severo: { dayThresholds: [28, 63], totalEstimateDays: 120 },
    },
    specialRedFlags: [
      'You can\'t lift your arm above your head at all, even slowly',
      'You feel tingling or weakness running down your arm into your hand',
    ],
    phases: [
      { name: 'Load reduction', why: 'The tendon is inflamed from repeated overhead motion (throws, clearances). The first days are about calming it down, avoiding overhead movement.',
        exercises: [
          { text: 'Codman pendulum: let the arm hang and swing gently, no forcing', cat: 'stretch' },
          { text: 'Avoid overhead throws and clearances for the first few days', cat: 'rest' },
          { text: 'Gentle shoulder mobility within pain-free range, not above shoulder height', cat: 'stretch' },
        ] },
      { name: 'Active recovery', why: 'Start strengthening the rotator cuff and scapular muscles, often the real weak link behind shoulder impingement.',
        criteriaToAdvance: ['You can lift your arm to shoulder height without sharp pain', 'Pain at rest has clearly decreased'],
        exercises: [
          { text: 'External rotation with a band, elbow tucked at your side (3 sets of 12-15)', cat: 'strength' },
          { text: 'Scapular strengthening: squeeze shoulder blades together and hold (3 sets of 10, 5-second hold)', cat: 'hold' },
          { text: 'Controlled lateral raises below shoulder height (2-3 sets of 12)', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Before going back to full-power throws and clearances, the shoulder needs to tolerate repeated overhead movement pain-free.',
        criteriaToAdvance: ['You can lift your arm fully overhead without pain', 'No pain after a light test clearance'],
        exercises: [
          { text: 'Progressive clearances, starting from reduced distance', cat: 'strength' },
          { text: 'Throwing/catching drills at increasing intensity', cat: 'strength' },
          { text: 'Diving simulation with overhead catch', cat: 'balance' },
        ] },
    ],
  },
  ac_joint: {
    relatedInjuries: ['shoulder_impingement'], relatedReason: 'A fall onto the shoulder involving the AC joint often leaves stiffness that resembles shoulder impingement.',
    label: 'AC joint injury', subtitle: 'Fall onto the point of the shoulder, common on dives', icon: Grip, mechanismTags: ['acute', 'contact'],
    severityData: {
      lieve: { dayThresholds: [7, 14], totalEstimateDays: 21 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 56 },
      severo: { dayThresholds: [35, 70], totalEstimateDays: 126 },
    },
    specialRedFlags: [
      'You see a visible bump or step above the shoulder that wasn\'t there before',
      'You can\'t move the arm at all right after the impact',
    ],
    phases: [
      { name: 'Protection', why: 'After a direct impact on the point of the shoulder, the AC ligament needs protecting from further stress in the first few days.',
        exercises: [
          { text: 'Support sling/strap if advised, arm resting close to the body', cat: 'rest' },
          { text: 'Elbow and hand mobility to avoid stiffness, without moving the shoulder', cat: 'stretch' },
          { text: 'Ice on the top of the shoulder for the first few days', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'The ligament starts tolerating controlled movement. Work on regaining the range of motion lost in the first days.',
        criteriaToAdvance: ['You can move your arm to shoulder height without sharp pain', 'Pain on direct pressure over the area has decreased'],
        exercises: [
          { text: 'Active shoulder mobility in all directions, within pain-free range', cat: 'stretch' },
          { text: 'Light isometric shoulder holds (15-20 second holds, 3-4 times)', cat: 'hold' },
          { text: 'Scapular strengthening with a light band', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Before returning to dives and physical contact, the shoulder needs to tolerate direct load on the area without pain.',
        criteriaToAdvance: ['You can lean on your arm without shoulder pain', 'No pain during a moderate test activity'],
        exercises: [
          { text: 'Progressive weight-bearing on the arm (from kneeling, then standing)', cat: 'strength' },
          { text: 'Controlled fall/landing simulation on a soft surface', cat: 'balance' },
          { text: 'Gradual return to diving, from reduced distance', cat: 'run' },
        ] },
    ],
  },
  bicep_tendinopathy: {
    relatedInjuries: ['shoulder_impingement'], relatedReason: 'The bicep tendon attaches close to the rotator cuff, so overload in one often involves the other.',
    label: 'Bicep tendinopathy', subtitle: 'From repeated catching and throwing', icon: Grip, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [7, 21], totalEstimateDays: 35 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 63 },
      severo: { dayThresholds: [28, 56], totalEstimateDays: 105 },
    },
    phases: [
      { name: 'Load reduction', why: 'The bicep tendon is inflamed from repeated catching and throwing. Reduce load before starting to strengthen it.',
        exercises: [
          { text: 'Avoid repeated catching and throwing for the first few days', cat: 'rest' },
          { text: 'Gentle elbow and shoulder mobility within pain-free range', cat: 'stretch' },
          { text: 'Light self-massage or foam rolling on the arm', cat: 'stretch' },
        ] },
      { name: 'Active recovery', why: 'The tendon responds well to progressive, controlled loading, especially on the lengthening (eccentric) phase of the movement.',
        criteriaToAdvance: ['You can bend the elbow against light resistance without sharp pain', 'Pain on pressing the tendon has decreased'],
        exercises: [
          { text: 'Bicep curls emphasizing a slow lowering phase (3 sets of 10-12)', cat: 'strength' },
          { text: 'Isometric grip: squeeze an object and hold (3 sets of 20 seconds)', cat: 'hold' },
          { text: 'Rotator cuff strengthening with a light band', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Before returning to full-intensity throwing and saves, the tendon needs to tolerate repeated grip and pull without pain.',
        criteriaToAdvance: ['You can do full-load curls without pain', 'No pain after repeated test catches'],
        exercises: [
          { text: 'Progressive throws and catches, starting from reduced intensity', cat: 'strength' },
          { text: 'Save simulation with ball catch', cat: 'balance' },
        ] },
    ],
  },
  wrist_sprain: {
    relatedInjuries: ['finger_jam', 'thumb_sprain'], relatedReason: 'The wrist, fingers, and thumb are often injured together in the same fall onto an open hand.',
    label: 'Wrist sprain', subtitle: 'Fall onto an open hand, common on dives', icon: Hand, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [4, 10], totalEstimateDays: 18 },
      moderato: { dayThresholds: [7, 21], totalEstimateDays: 35 },
      severo: { dayThresholds: [14, 42], totalEstimateDays: 84 },
    },
    specialRedFlags: [
      'The wrist looks visibly deformed or markedly swollen right after the fall',
      'The pain is concentrated at one precise point on the bone, not spread across the wrist',
    ],
    phases: [
      { name: 'Protection', why: 'After a fall onto an open hand, the wrist ligaments are inflamed. Protect the wrist by avoiding direct weight-bearing.',
        exercises: [
          { text: 'Avoid leaning on the hand (no push-ups, no bearing weight on the ground)', cat: 'rest' },
          { text: 'Finger mobility to avoid stiffness, without moving the wrist', cat: 'stretch' },
          { text: 'Ice on the wrist for the first few days', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'The ligament starts tolerating controlled movement. Work on range of motion and grip strength.',
        criteriaToAdvance: ['You can move the wrist in every direction without sharp pain', 'Swelling has clearly decreased'],
        exercises: [
          { text: 'Active wrist mobility: flexion, extension, rotation', cat: 'stretch' },
          { text: 'Grip strengthening with a soft ball (3 sets of 15)', cat: 'strength' },
          { text: 'Wrist strengthening with a light band, all directions', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Before returning to dives and hand-supported movements, the wrist needs to tolerate direct load without pain.',
        criteriaToAdvance: ['You can lean on your hand on the ground without pain', 'No pain after a low-intensity test save'],
        exercises: [
          { text: 'Progressive weight-bearing on the hand (kneeling, then standing)', cat: 'strength' },
          { text: 'Controlled save and landing simulation', cat: 'balance' },
          { text: 'Gradual return to diving', cat: 'run' },
        ] },
    ],
  },
  finger_jam: {
    relatedInjuries: ['wrist_sprain', 'thumb_sprain'], relatedReason: 'The wrist, fingers, and thumb are often injured together in the same impact with the ball.',
    label: 'Jammed finger', subtitle: 'Direct ball impact', icon: Hand, mechanismTags: ['acute', 'contact'],
    severityData: {
      lieve: { dayThresholds: [3, 7], totalEstimateDays: 14 },
      moderato: { dayThresholds: [7, 14], totalEstimateDays: 28 },
      severo: { dayThresholds: [14, 35], totalEstimateDays: 63 },
    },
    specialRedFlags: [
      'The finger looks crooked or deformed compared to the others',
      'You can\'t straighten the finger fully on your own',
    ],
    phases: [
      { name: 'Protection', why: 'After a direct impact, the finger joint is inflamed. Protect it for the first few days, often with buddy taping to the next finger.',
        exercises: [
          { text: 'Buddy taping to the adjacent finger if advised', cat: 'rest' },
          { text: 'Ice on the finger for the first few days', cat: 'rest' },
          { text: 'Avoid direct ball catches for the first few days', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Regain the joint\'s range of motion and start rebuilding grip strength.',
        criteriaToAdvance: ['You can bend and straighten the finger without sharp pain', 'Swelling has clearly decreased'],
        exercises: [
          { text: 'Active finger mobility, bend and extend slowly', cat: 'stretch' },
          { text: 'Grip strengthening with a soft ball (3 sets of 15)', cat: 'strength' },
          { text: 'Pinch exercises between thumb and the injured finger', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Before returning to saves, the finger needs to tolerate direct ball impact without pain.',
        criteriaToAdvance: ['You can make a full fist without pain', 'No pain after light test catches'],
        exercises: [
          { text: 'Progressive ball catches, from reduced distance and low speed', cat: 'strength' },
          { text: 'Open-hand save simulation', cat: 'balance' },
        ] },
    ],
  },
  thumb_sprain: {
    relatedInjuries: ['wrist_sprain', 'finger_jam'], relatedReason: 'The wrist, fingers, and thumb are often injured together in the same catch or fall.',
    label: 'Thumb sprain', subtitle: 'Twisting on a catch or fall, often involves the inner ligament', icon: Hand, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 14], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 28], totalEstimateDays: 42 },
      severo: { dayThresholds: [21, 56], totalEstimateDays: 90 },
    },
    specialRedFlags: [
      'The thumb feels unstable, like it "gives way" sideways under light pressure',
      'You can\'t pinch anything between thumb and index finger due to pain',
    ],
    phases: [
      { name: 'Protection', why: 'The ligament at the base of the thumb is inflamed from the twist. Protect it for the first few days, often with a specific brace.',
        exercises: [
          { text: 'Thumb brace/strap if advised', cat: 'rest' },
          { text: 'Ice on the base of the thumb for the first few days', cat: 'rest' },
          { text: 'Avoid pinch grips (thumb against index) for the first few days', cat: 'rest' },
        ] },
      { name: 'Active recovery', why: 'Regain range of motion and gradually start rebuilding pinch grip strength.',
        criteriaToAdvance: ['You can move the thumb in every direction without sharp pain', 'Swelling has clearly decreased'],
        exercises: [
          { text: 'Active thumb mobility in every direction', cat: 'stretch' },
          { text: 'Light pinch grip strengthening with a soft ball', cat: 'strength' },
          { text: 'Strengthening with a light band around the thumb', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Before returning to saves, the thumb needs to tolerate gripping the ball under pressure without giving way.',
        criteriaToAdvance: ['You can pinch firmly without pain', 'No feeling of instability in the grip'],
        exercises: [
          { text: 'Progressive two-handed ball catches', cat: 'strength' },
          { text: 'Firm-grip save simulation', cat: 'balance' },
        ] },
    ],
  },
};

// Elenco fisioterapisti sportivi. Vuoto per ora — aggiungi qui ogni fisioterapista reclutato, stesso formato.
// Esempio: { id: 'mario-rossi', name: 'Mario Rossi', city: 'Vicenza', specialization: 'Riabilitazione sportiva, ginocchio', bio: 'Breve presentazione.', contactType: 'instagram', contactValue: '@mariorossifisio' }
// contactType può essere: 'instagram' (contactValue senza @ o con, es. 'mariorossifisio'), 'email', 'phone', 'website'
const physiosData = [];

const regions = {
  ankle_foot: { label: 'Caviglia e piede', icon: Footprints, injuries: ['ankle', 'achilles', 'plantarfasciitis', 'blisters'] },
  knee: { label: 'Ginocchio', icon: CircleDot, injuries: ['knee', 'mcl', 'lcl', 'patellar', 'meniscus', 'itband', 'osgood'] },
  thigh: { label: 'Coscia', icon: Zap, injuries: ['hamstring', 'quad', 'contusion'] },
  calf_region: { label: 'Gamba e polpaccio', icon: Activity, injuries: ['calf', 'shinsplints', 'cramps'] },
  hip_groin: { label: 'Anca e inguine', icon: ArrowLeftRight, injuries: ['groin', 'hipflexor', 'piriformis', 'trochanteric'] },
  lower_back: { label: 'Zona lombare', icon: PersonStanding, injuries: ['lowback'] },
  shoulder_arm: { label: 'Spalla e braccio', icon: Grip, injuries: ['shoulder_impingement', 'ac_joint', 'bicep_tendinopathy'] },
  hand_wrist: { label: 'Mano e polso', icon: Hand, injuries: ['wrist_sprain', 'finger_jam', 'thumb_sprain'] },
};
const regionLabelsIT = { ankle_foot: 'Caviglia e piede', knee: 'Ginocchio', thigh: 'Coscia', calf_region: 'Gamba e polpaccio', hip_groin: 'Anca e inguine', lower_back: 'Zona lombare', shoulder_arm: 'Spalla e braccio', hand_wrist: 'Mano e polso' };
const regionLabelsEN = { ankle_foot: 'Ankle and foot', knee: 'Knee', thigh: 'Thigh', calf_region: 'Leg and calf', hip_groin: 'Hip and groin', lower_back: 'Lower back', shoulder_arm: 'Shoulder and arm', hand_wrist: 'Hand and wrist' };

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
  shoulder_arm: {
    label: 'Spalla e braccio',
    why: 'La spalla di chi para lavora costantemente sopra la testa, nei rinvii e nei tuffi — la stabilità della cuffia dei rotatori e della scapola è quello che previene il sovraccarico nel tempo.',
    exercises: [
      { text: 'Rotazione esterna con elastico, gomito fermo al fianco (2-3 serie da 12-15)', cat: 'strength' },
      { text: 'Rinforzo della scapola: stringi le scapole insieme e tieni (2-3 serie da 10, tenuta 5 secondi)', cat: 'hold' },
      { text: 'Pendolo di Codman per la mobilità della spalla', cat: 'stretch' },
      { text: 'Sollevamenti laterali controllati sotto l\'altezza della spalla (2-3 serie da 12)', cat: 'strength' },
      { text: 'Rinforzo isometrico in rotazione interna ed esterna (tenuta 15-20 secondi, 3-4 volte)', cat: 'hold' },
    ],
  },
  hand_wrist: {
    label: 'Mano e polso',
    why: 'Cadute su mano aperta e prese ripetute mettono sotto stress polso e dita — forza di presa e mobilità sono la prima difesa contro distorsioni che si ripetono nel tempo.',
    exercises: [
      { text: 'Rinforzo di presa con una pallina morbida (2-3 serie da 15)', cat: 'strength' },
      { text: 'Mobilità attiva del polso in tutte le direzioni', cat: 'stretch' },
      { text: 'Rinforzo del polso con elastico leggero, tutte le direzioni (2-3 serie da 12-15)', cat: 'strength' },
      { text: 'Flessioni sulle nocche invece che sul palmo, se comodo (2-3 serie da 8-10)', cat: 'strength' },
      { text: 'Esercizi di pinza tra pollice e dita', cat: 'strength' },
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
  shoulder_arm: {
    label: 'Shoulder and arm',
    why: 'A goalkeeper\'s shoulder works constantly overhead, on clearances and dives — rotator cuff and scapular stability is what prevents overload building up over time.',
    exercises: [
      { text: 'External rotation with a band, elbow tucked at your side (2-3 sets of 12-15)', cat: 'strength' },
      { text: 'Scapular strengthening: squeeze shoulder blades together and hold (2-3 sets of 10, 5-second hold)', cat: 'hold' },
      { text: 'Codman pendulum for shoulder mobility', cat: 'stretch' },
      { text: 'Controlled lateral raises below shoulder height (2-3 sets of 12)', cat: 'strength' },
      { text: 'Isometric holds in internal and external rotation (15-20 second holds, 3-4 times)', cat: 'hold' },
    ],
  },
  hand_wrist: {
    label: 'Hand and wrist',
    why: 'Falls onto an open hand and repeated catches put the wrist and fingers under stress — grip strength and mobility are the first defense against sprains that keep coming back.',
    exercises: [
      { text: 'Grip strengthening with a soft ball (2-3 sets of 15)', cat: 'strength' },
      { text: 'Active wrist mobility in every direction', cat: 'stretch' },
      { text: 'Wrist strengthening with a light band, all directions (2-3 sets of 12-15)', cat: 'strength' },
      { text: 'Knuckle push-ups instead of flat palm, if comfortable (2-3 sets of 8-10)', cat: 'strength' },
      { text: 'Pinch exercises between thumb and fingers', cat: 'strength' },
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

const playerLevelsIT = [
  { key: 'giovanili', label: 'Giovanili' },
  { key: 'amatoriale', label: 'Amatoriale' },
  { key: 'dilettanti', label: 'Dilettanti' },
  { key: 'semipro', label: 'Semi-pro / Pro' },
];
const playerLevelsEN = [
  { key: 'giovanili', label: 'Youth' },
  { key: 'amatoriale', label: 'Amateur' },
  { key: 'dilettanti', label: 'Competitive amateur' },
  { key: 'semipro', label: 'Semi-pro / Pro' },
];

const regionRoleExercisesIT = {
  ankle_foot: {
    portiere: { why: 'Nei tuffi la caviglia assorbe il carico in appoggio instabile — la tecnica di atterraggio conta quanto la forza.', exercises: [
      'Tecnica di atterraggio da un tuffo laterale, caviglia stabile all\'impatto (3 serie da 5 per lato)',
      'Spinta esplosiva laterale da fermo (3 serie da 5 per lato)',
      'Equilibrio monopodalico su superficie instabile (3 volte da 20-30 secondi)',
    ]},
    difensore: { why: 'Nei duelli aerei l\'atterraggio spesso avviene su un solo piede, magari in contatto — la caviglia deve reggere il carico anche fuori equilibrio.', exercises: [
      'Tecnica di atterraggio da un colpo di testa, un piede solo (3 serie da 6 per lato)',
      'Affondi laterali con controllo della caviglia (3 serie da 10 per lato)',
      'Stabilità della caviglia sotto leggera spinta esterna (3 serie da 8)',
    ]},
    centrocampista: { why: 'Frenate e ripartenze ripetute per novanta minuti mettono la caviglia sotto stress cumulativo, non solo un singolo picco di carico.', exercises: [
      'Tecnica di frenata e ripartenza ripetuta (6-8 ripetizioni)',
      'Equilibrio monopodalico con leggero affaticamento pregresso (3 serie da 20 secondi)',
      'Mobilità della caviglia in tutte le direzioni, a fine sessione (2 minuti)',
    ]},
    attaccante: { why: 'Il cambio di direzione esplosivo per superare un avversario carica la caviglia lateralmente in modo brusco.', exercises: [
      'Tecnica di cambio di direzione esplosivo, taglio a 45° (3 serie da 6 per lato)',
      'Reattività: parti in scatto dopo un segnale imprevisto (5-6 ripetizioni)',
      'Rinforzo con elastico in tutte le direzioni (2-3 serie da 12 per direzione)',
    ]},
  },
  knee: {
    portiere: { why: 'La spinta laterale per il tuffo carica il ginocchio d\'appoggio in modo asimmetrico e improvviso.', exercises: [
      'Tecnica di spinta laterale per il tuffo, ginocchio allineato (3 serie da 5 per lato)',
      'Squat monopodalico controllato (3 serie da 8 per lato)',
      'Rinforzo del gluteo medio con elastico (2-3 serie da 15)',
    ]},
    difensore: { why: 'Nel contrasto il ginocchio spesso lavora in posizione flessa e ruotata contemporaneamente — la tecnica riduce il rischio più della sola forza.', exercises: [
      'Tecnica di affondo nel contrasto, ginocchio mai oltre la punta del piede (3 serie da 8 per lato)',
      'Step-up controllati (3 serie da 10 per lato)',
      'Stabilità in appoggio singolo con perturbazione (3 serie da 8)',
    ]},
    centrocampista: { why: 'Decine di decelerazioni ripetute in una partita sollecitano il ginocchio più del numero di sprint in sé.', exercises: [
      'Tecnica di decelerazione ripetuta in tre appoggi (6-8 ripetizioni)',
      'Squat controllati ad alto volume (3 serie da 15)',
      'Resistenza in appoggio monopodalico (3 serie da 30 secondi)',
    ]},
    attaccante: { why: 'Il perno su un piede solo per proteggere palla o saltare l\'avversario mette il ginocchio sotto torsione.', exercises: [
      'Tecnica di perno su un piede solo, controllato (3 serie da 6 per lato)',
      'Salti con atterraggio stabile su una gamba (3 serie da 6 per lato)',
      'Rinforzo eccentrico del quadricipite (2-3 serie da 8-10)',
    ]},
  },
  thigh: {
    portiere: { why: 'La spinta esplosiva da fermo per il tuffo richiede potenza immediata, senza una vera fase di preparazione.', exercises: [
      'Tecnica di spinta esplosiva da fermo (5-6 ripetizioni)',
      'Affondi con enfasi sulla fase di spinta (3 serie da 8 per lato)',
      'Nordic curl assistito (2-3 serie da 5-6)',
    ]},
    difensore: { why: 'Lo stacco per il duello aereo è un gesto esplosivo che carica la coscia in modo simile a un salto verticale puro.', exercises: [
      'Tecnica di stacco per il duello aereo, spinta bilanciata (5-6 ripetizioni)',
      'Squat con salto controllato (3 serie da 6)',
      'Ponte glutei/hamstring (3 serie da 12-15)',
    ]},
    centrocampista: { why: 'Correre a intensità sostenuta per gran parte della partita è più una questione di resistenza muscolare che di velocità pura.', exercises: [
      'Tecnica di corsa a intensità sostenuta, passo efficiente (8-10 minuti a ritmo costante)',
      'Affondi in circuito, alto volume (3 serie da 12 per lato)',
      'Rinforzo eccentrico del quadricipite, discesa lenta (2-3 serie da 8-10)',
    ]},
    attaccante: { why: 'Decelerare subito dopo uno scatto massimale è spesso il momento più a rischio per la coscia, non lo scatto in sé.', exercises: [
      'Tecnica di decelerazione dopo lo scatto, tre appoggi controllati (5-6 ripetizioni)',
      'Accelerazione esplosiva da fermo (5-6 ripetizioni da 10 metri)',
      'Nordic curl assistito (2-3 serie da 5-6)',
    ]},
  },
  calf_region: {
    portiere: { why: 'Il polpaccio genera la spinta laterale esplosiva per coprire distanza nel tuffo in pochissimo tempo.', exercises: [
      'Tecnica di spinta esplosiva laterale dal polpaccio (3 serie da 5 per lato)',
      'Calf raises esplosivi (3 serie da 10)',
      'Equilibrio su una gamba con piccoli rimbalzi (3 serie da 15 secondi)',
    ]},
    difensore: { why: 'Lo stacco verticale per il colpo di testa dipende in gran parte dalla potenza del polpaccio nell\'ultimo istante prima del salto.', exercises: [
      'Tecnica di stacco verticale, spinta rapida dal polpaccio (5-6 ripetizioni)',
      'Calf raises progressivi (3 serie da 15)',
      'Salti verticali ripetuti, atterraggio controllato (3 serie da 6)',
    ]},
    centrocampista: { why: 'Correre a lungo in modo efficiente richiede un polpaccio che lavora bene anche quando è già affaticato.', exercises: [
      'Tecnica di corsa prolungata, contatto rapido col terreno (8-10 minuti)',
      'Calf raises ad alto volume (3 serie da 20)',
      'Salti su corda o simili, ritmo costante (2 minuti)',
    ]},
    attaccante: { why: 'La prima falcata dopo il fermo è quella che decide se stacchi davvero dall\'avversario — dipende dalla potenza esplosiva del polpaccio.', exercises: [
      'Tecnica di prima falcata esplosiva da fermo (5-6 ripetizioni)',
      'Calf raises eccentrici su una gamba (3 serie da 10-12)',
      'Balzi orizzontali brevi, massima esplosività (3 serie da 5)',
    ]},
  },
  hip_groin: {
    portiere: { why: 'Il tuffo laterale richiede un\'apertura dell\'anca ampia e improvvisa, spesso oltre il range di movimento usato normalmente.', exercises: [
      'Tecnica di apertura dell\'anca nel tuffo, controllata (3 serie da 6 per lato)',
      'Mobilità dell\'anca in tutte le direzioni (2-3 minuti)',
      'Rinforzo isometrico degli adduttori (3-4 serie da 8-10 secondi)',
    ]},
    difensore: { why: 'Il posizionamento nel contrasto richiede stabilità dell\'anca sotto pressione laterale diretta.', exercises: [
      'Tecnica di posizionamento nel contrasto, bacino stabile (3 serie da 8 per lato)',
      'Plank laterale con schiacciata dell\'adduttore, tipo Copenhagen (2-3 serie da 6-8 per lato)',
      'Cammino laterale con elastico (2-3 serie da 12-15 passi per lato)',
    ]},
    centrocampista: { why: 'Cambiare direzione decine di volte per partita richiede che anca e adduttori reggano il carico ripetuto, non solo un singolo sforzo.', exercises: [
      'Tecnica di cambio di direzione ripetuto, passo corto e controllato (6-8 ripetizioni)',
      'Rinforzo dei flessori dell\'anca con elastico (2-3 serie da 12-15)',
      'Mobilità dinamica dell\'anca prima dello sforzo (2 minuti)',
    ]},
    attaccante: { why: 'Il tiro potente nasce in gran parte dall\'apertura e chiusura rapida dell\'anca, non solo dalla gamba.', exercises: [
      'Tecnica di apertura dell\'anca nel gesto del tiro, a vuoto (3 serie da 8 per lato)',
      'Rinforzo isometrico degli adduttori (3-4 serie da 8-10 secondi)',
      'Cammino laterale con elastico (2-3 serie da 12-15 passi per lato)',
    ]},
  },
  lower_back: {
    portiere: { why: 'Il tuffo spesso combina torsione del busto e allungamento nello stesso istante — il core deve reggere entrambe le cose insieme.', exercises: [
      'Tecnica di torsione controllata nel tuffo, core attivo (3 serie da 6 per lato)',
      'Plank con rotazione (3 serie da 8-10 per lato)',
      'Bird-dog (2-3 serie da 8-10 per lato)',
    ]},
    difensore: { why: 'Il salto per il colpo di testa richiede che il core resti stabile mentre il resto del corpo si estende verso l\'alto.', exercises: [
      'Tecnica di tenuta del core nel salto per il duello aereo (5-6 ripetizioni)',
      'Plank (3 serie da 30 secondi)',
      'Ponte glutei a due gambe (3 serie da 12-15)',
    ]},
    centrocampista: { why: 'Mantenere una postura efficiente per novanta minuti, anche affaticati, è ciò che protegge la zona lombare a lungo termine.', exercises: [
      'Tecnica di postura sotto affaticamento, autocontrollo a metà sforzo (durante la sessione)',
      'Plank ad alto volume (3 serie da 30-40 secondi)',
      'Bird-dog con leggero affaticamento pregresso (2-3 serie da 8-10 per lato)',
    ]},
    attaccante: { why: 'La rotazione del busto nel tiro potente scarica forza importante sulla zona lombare in un solo gesto esplosivo.', exercises: [
      'Tecnica di rotazione del busto nel tiro, a vuoto e controllata (3 serie da 8 per lato)',
      'Plank con rotazione (3 serie da 8-10 per lato)',
      'Rinforzo rotazionale del core con resistenza leggera (2-3 serie da 10 per lato)',
    ]},
  },
  shoulder_arm: {
    portiere: { why: 'La spalla del portiere lavora sopra la testa nei rinvii e assorbe l\'impatto diretto nei tuffi laterali — potenza di lancio e stabilità nell\'atterraggio vanno allenate insieme.', exercises: [
      'Tecnica di rinvio progressivo, potenza controllata (8-10 ripetizioni)',
      'Atterraggio controllato sul lato dopo un tuffo simulato (3 serie da 5 per lato)',
      'Rinforzo della cuffia dei rotatori con elastico (2-3 serie da 12-15)',
    ]},
    difensore: { why: 'Nei duelli aerei e nei blocchi, la spalla assorbe contatto diretto — la stabilità conta quanto la forza pura.', exercises: [
      'Tecnica di blocco/schermatura con la spalla, controllata (3 serie da 8 per lato)',
      'Rinforzo della scapola sotto leggero carico (2-3 serie da 12)',
      'Stabilità della spalla sotto contatto esterno leggero (3 serie da 8)',
    ]},
    centrocampista: { why: 'Meno centrale rispetto ad altri ruoli, ma i duelli fisici prolungati per novanta minuti mettono comunque sotto stress la spalla nel tempo.', exercises: [
      'Rinforzo generale della cuffia dei rotatori (2-3 serie da 15)',
      'Resistenza della spalla sotto carico ripetuto e leggero (2-3 serie da 15-20)',
    ]},
    attaccante: { why: 'Schermare il pallone con il braccio contro un difensore è un gesto ripetuto che richiede stabilità della spalla sotto pressione.', exercises: [
      'Tecnica di schermatura del pallone, braccio stabile (3 serie da 8 per lato)',
      'Rinforzo isometrico della spalla sotto pressione esterna (3 serie da 15-20 secondi)',
    ]},
  },
  hand_wrist: {
    portiere: { why: 'Presa e controllo del pallone dipendono dalla forza di dita e polso — è la base tecnica di ogni parata, non solo un dettaglio.', exercises: [
      'Tecnica di presa progressiva su palloni a velocità crescente (10-12 ripetizioni)',
      'Rinforzo delle dita con una pallina morbida (3 serie da 15)',
      'Appoggio controllato della mano dopo un tuffo simulato (3 serie da 6)',
    ]},
    difensore: { why: 'Le cadute durante i contrasti mettono spesso il polso sotto stress improvviso — la forza di base riduce il rischio di una distorsione.', exercises: [
      'Rinforzo di presa generale con una pallina morbida (2-3 serie da 15)',
      'Mobilità del polso in tutte le direzioni, a fine sessione',
    ]},
    centrocampista: { why: 'Come per gli altri ruoli di movimento, le cadute occasionali durante il gioco beneficiano di un polso più forte e mobile.', exercises: [
      'Rinforzo di presa generale con una pallina morbida (2-3 serie da 15)',
      'Mobilità del polso in tutte le direzioni, a fine sessione',
    ]},
    attaccante: { why: 'Il contatto fisico continuo e le cadute occasionali beneficiano di un polso più forte e mobile, anche se non è il fattore principale per questo ruolo.', exercises: [
      'Rinforzo di presa generale con una pallina morbida (2-3 serie da 15)',
      'Mobilità del polso in tutte le direzioni, a fine sessione',
    ]},
  },
};
const techniqueDataIT = {
  portiere: { why: 'Il primo tocco di un portiere spesso è già l\'inizio dell\'azione — precisione e rapidità contano quanto le parate.', exercises: [
    { text: 'Distribuzione con i piedi su bersagli a diverse distanze (15-20 palloni, corto/medio/lungo)', cat: 'strength' },
    { text: 'Controllo orientato sotto pressione simulata, poi rinvio rapido (10-12 ripetizioni)', cat: 'balance' },
    { text: 'Rinvio di precisione su corridoi stretti (10 tentativi per lato)', cat: 'strength' },
    { text: 'Uscite basse con controllo del rimbalzo (8-10 ripetizioni)', cat: 'balance' },
  ]},
  difensore: { why: 'Il primo tocco dopo un recupero palla decide se la squadra riparte bene o perde di nuovo possesso.', exercises: [
    { text: 'Primo tocco orientato in avanti, subito dopo un contrasto simulato (10-12 ripetizioni)', cat: 'balance' },
    { text: 'Controllo sotto pressione avversaria diretta (8-10 ripetizioni per lato)', cat: 'balance' },
    { text: 'Passaggio lungo di precisione su bersaglio (15 tentativi)', cat: 'strength' },
    { text: 'Conduzione palla in spazio stretto sotto pressing (5-6 serie brevi)', cat: 'run' },
  ]},
  centrocampista: { why: 'Il centrocampista tocca il pallone più di chiunque altro — la qualità del primo controllo in spazi stretti fa la differenza.', exercises: [
    { text: 'Controllo orientato in spazio stretto, un tocco per liberarsi (12-15 ripetizioni)', cat: 'balance' },
    { text: 'Cambio di gioco su lunga distanza, precisione (12 tentativi)', cat: 'strength' },
    { text: 'Passaggio e movimento (dai e vai), ritmo sostenuto (8-10 sequenze)', cat: 'run' },
    { text: 'Ricezione spalle alla porta e giro in un tocco (10-12 ripetizioni)', cat: 'balance' },
  ]},
  attaccante: { why: 'In area il tempo per pensare è quasi zero — il primo tocco verso la porta spesso vale più del tiro stesso.', exercises: [
    { text: 'Controllo orientato in area sotto pressione, subito verso la porta (10-12 ripetizioni)', cat: 'balance' },
    { text: 'Primo tocco su cross da diverse angolazioni (15 palloni)', cat: 'balance' },
    { text: 'Finalizzazione dopo conduzione rapida (8-10 ripetizioni)', cat: 'run' },
    { text: 'Tiro di prima intenzione su assist (12-15 tentativi)', cat: 'strength' },
  ]},
};
const techniqueDataEN = {
  portiere: { why: 'A goalkeeper\'s first touch is often already the start of the attack — precision and speed matter as much as saves.', exercises: [
    { text: 'Distribution with the feet to targets at different distances (15-20 balls, short/medium/long)', cat: 'strength' },
    { text: 'Oriented control under simulated pressure, then quick clearance (10-12 reps)', cat: 'balance' },
    { text: 'Precision clearance through narrow lanes (10 attempts per side)', cat: 'strength' },
    { text: 'Low saves with rebound control (8-10 reps)', cat: 'balance' },
  ]},
  difensore: { why: 'The first touch after winning the ball decides whether the team breaks out well or loses possession again.', exercises: [
    { text: 'Forward-oriented first touch, right after a simulated tackle (10-12 reps)', cat: 'balance' },
    { text: 'Control under direct opponent pressure (8-10 reps per side)', cat: 'balance' },
    { text: 'Long precision pass to a target (15 attempts)', cat: 'strength' },
    { text: 'Ball carrying in tight space under pressing (5-6 short sets)', cat: 'run' },
  ]},
  centrocampista: { why: 'A midfielder touches the ball more than anyone else — the quality of the first touch in tight spaces makes the difference.', exercises: [
    { text: 'Oriented control in tight space, one touch to get free (12-15 reps)', cat: 'balance' },
    { text: 'Long-distance switch of play, precision (12 attempts)', cat: 'strength' },
    { text: 'Pass and move, sustained rhythm (8-10 sequences)', cat: 'run' },
    { text: 'Receiving back to goal and turning in one touch (10-12 reps)', cat: 'balance' },
  ]},
  attaccante: { why: 'In the box there\'s almost no time to think — the first touch toward goal is often worth more than the shot itself.', exercises: [
    { text: 'Oriented control in the box under pressure, straight toward goal (10-12 reps)', cat: 'balance' },
    { text: 'First touch on crosses from different angles (15 balls)', cat: 'balance' },
    { text: 'Finishing after a quick carry (8-10 reps)', cat: 'run' },
    { text: 'First-time shot on an assist (12-15 attempts)', cat: 'strength' },
  ]},
};
const regionRoleExercisesEN = {
  ankle_foot: {
    portiere: { why: 'On dives, the ankle absorbs load on unstable footing — landing technique matters as much as raw strength.', exercises: [
      'Landing technique from a lateral dive, stable ankle on impact (3 sets of 5 per side)',
      'Explosive lateral push-off from standing (3 sets of 5 per side)',
      'Single-leg balance on an unstable surface (3 sets of 20-30 seconds)',
    ]},
    difensore: { why: 'In aerial duels the landing often happens on one foot, sometimes in contact — the ankle needs to hold up even off-balance.', exercises: [
      'Landing technique from a header duel, single leg (3 sets of 6 per side)',
      'Lateral lunges with ankle control (3 sets of 10 per side)',
      'Ankle stability under light external push (3 sets of 8)',
    ]},
    centrocampista: { why: 'Repeated braking and restarting over ninety minutes puts the ankle under cumulative stress, not just a single load spike.', exercises: [
      'Braking and restarting technique, repeated (6-8 reps)',
      'Single-leg balance with pre-existing light fatigue (3 sets of 20 seconds)',
      'Ankle mobility in all directions, end of session (2 minutes)',
    ]},
    attaccante: { why: 'The explosive change of direction to beat a defender loads the ankle sharply and sideways.', exercises: [
      'Explosive change of direction technique, 45° cut (3 sets of 6 per side)',
      'Reactivity: sprint off on an unpredictable cue (5-6 reps)',
      'Resistance band work in all directions (2-3 sets of 12 per direction)',
    ]},
  },
  knee: {
    portiere: { why: 'The lateral push for a dive loads the standing knee asymmetrically and suddenly.', exercises: [
      'Lateral push-off technique for diving, knee aligned (3 sets of 5 per side)',
      'Controlled single-leg squat (3 sets of 8 per side)',
      'Glute medius strengthening with a band (2-3 sets of 15)',
    ]},
    difensore: { why: 'In a tackle the knee often works flexed and rotated at the same time — technique reduces risk more than strength alone.', exercises: [
      'Tackling lunge technique, knee never past the toes (3 sets of 8 per side)',
      'Controlled step-ups (3 sets of 10 per side)',
      'Single-leg stability with perturbation (3 sets of 8)',
    ]},
    centrocampista: { why: 'Dozens of repeated decelerations in a match stress the knee more than the number of sprints itself.', exercises: [
      'Repeated deceleration technique in three steps (6-8 reps)',
      'High-volume controlled squats (3 sets of 15)',
      'Single-leg standing endurance (3 sets of 30 seconds)',
    ]},
    attaccante: { why: 'Pivoting on one leg to shield the ball or beat a defender puts the knee under rotational load.', exercises: [
      'Controlled single-leg pivot technique (3 sets of 6 per side)',
      'Jumps with stable single-leg landing (3 sets of 6 per side)',
      'Eccentric quadriceps strengthening (2-3 sets of 8-10)',
    ]},
  },
  thigh: {
    portiere: { why: 'The explosive push-off from standing for a dive needs immediate power, with no real run-up.', exercises: [
      'Explosive push-off technique from standing (5-6 reps)',
      'Lunges emphasizing the push phase (3 sets of 8 per side)',
      'Assisted Nordic curls (2-3 sets of 5-6)',
    ]},
    difensore: { why: 'The jump for an aerial duel is an explosive action that loads the thigh similarly to a pure vertical jump.', exercises: [
      'Aerial duel take-off technique, balanced push (5-6 reps)',
      'Controlled jump squats (3 sets of 6)',
      'Glute/hamstring bridge (3 sets of 12-15)',
    ]},
    centrocampista: { why: 'Running at sustained intensity for most of the match is more about muscular endurance than pure speed.', exercises: [
      'Sustained-intensity running technique, efficient stride (8-10 minutes at a steady pace)',
      'Circuit lunges, high volume (3 sets of 12 per side)',
      'Eccentric quadriceps work, slow lowering (2-3 sets of 8-10)',
    ]},
    attaccante: { why: 'Decelerating right after a maximal sprint is often the riskiest moment for the thigh, not the sprint itself.', exercises: [
      'Post-sprint deceleration technique, three controlled steps (5-6 reps)',
      'Explosive acceleration from standing (5-6 reps of 10 meters)',
      'Assisted Nordic curls (2-3 sets of 5-6)',
    ]},
  },
  calf_region: {
    portiere: { why: 'The calf generates the explosive lateral push to cover distance on a dive in a split second.', exercises: [
      'Explosive lateral push-off technique from the calf (3 sets of 5 per side)',
      'Explosive calf raises (3 sets of 10)',
      'Single-leg balance with small bounces (3 sets of 15 seconds)',
    ]},
    difensore: { why: 'The vertical take-off for a header depends largely on calf power in the instant before the jump.', exercises: [
      'Vertical take-off technique, quick calf drive (5-6 reps)',
      'Progressive calf raises (3 sets of 15)',
      'Repeated vertical jumps, controlled landing (3 sets of 6)',
    ]},
    centrocampista: { why: 'Running efficiently for a long time requires a calf that still works well even when already fatigued.', exercises: [
      'Sustained running technique, quick ground contact (8-10 minutes)',
      'High-volume calf raises (3 sets of 20)',
      'Rope-style jumps, steady rhythm (2 minutes)',
    ]},
    attaccante: { why: 'The first stride after standing still is what decides whether you actually get ahead of the defender — it depends on calf explosiveness.', exercises: [
      'Explosive first-stride technique from standing (5-6 reps)',
      'Single-leg eccentric calf raises (3 sets of 10-12)',
      'Short horizontal bounds, maximum explosiveness (3 sets of 5)',
    ]},
  },
  hip_groin: {
    portiere: { why: 'The lateral dive requires a wide, sudden hip opening, often beyond the range used in normal movement.', exercises: [
      'Controlled hip-opening technique for diving (3 sets of 6 per side)',
      'Hip mobility in all directions (2-3 minutes)',
      'Isometric adductor strengthening (3-4 sets of 8-10 second holds)',
    ]},
    difensore: { why: 'Tackling positioning requires hip stability under direct lateral pressure.', exercises: [
      'Tackling positioning technique, stable pelvis (3 sets of 8 per side)',
      'Side plank with adductor squeeze, Copenhagen-style (2-3 sets of 6-8 per side)',
      'Lateral band walks (2-3 sets of 12-15 steps per side)',
    ]},
    centrocampista: { why: 'Changing direction dozens of times per match requires the hip and adductors to handle repeated load, not just a single effort.', exercises: [
      'Repeated change of direction technique, short controlled steps (6-8 reps)',
      'Hip flexor strengthening with a band (2-3 sets of 12-15)',
      'Dynamic hip mobility before effort (2 minutes)',
    ]},
    attaccante: { why: 'A powerful shot largely comes from rapid hip opening and closing, not just the leg.', exercises: [
      'Hip-opening technique for the shooting motion, no ball (3 sets of 8 per side)',
      'Isometric adductor strengthening (3-4 sets of 8-10 second holds)',
      'Lateral band walks (2-3 sets of 12-15 steps per side)',
    ]},
  },
  lower_back: {
    portiere: { why: 'A dive often combines trunk rotation and extension at the same instant — the core has to handle both together.', exercises: [
      'Controlled rotation technique for diving, core engaged (3 sets of 6 per side)',
      'Rotational plank (3 sets of 8-10 per side)',
      'Bird-dog (2-3 sets of 8-10 per side)',
    ]},
    difensore: { why: 'Jumping for a header requires the core to stay stable while the rest of the body extends upward.', exercises: [
      'Core bracing technique for aerial duel jumps (5-6 reps)',
      'Plank (3 sets of 30 seconds)',
      'Two-leg glute bridge (3 sets of 12-15)',
    ]},
    centrocampista: { why: 'Maintaining an efficient posture for ninety minutes, even fatigued, is what protects the lower back long-term.', exercises: [
      'Posture-under-fatigue technique, self-check mid-effort (during the session)',
      'High-volume plank (3 sets of 30-40 seconds)',
      'Bird-dog with pre-existing light fatigue (2-3 sets of 8-10 per side)',
    ]},
    attaccante: { why: 'Trunk rotation in a powerful shot puts significant force through the lower back in one explosive motion.', exercises: [
      'Trunk rotation technique for shooting, controlled and unloaded (3 sets of 8 per side)',
      'Rotational plank (3 sets of 8-10 per side)',
      'Rotational core strengthening with light resistance (2-3 sets of 10 per side)',
    ]},
  },
  shoulder_arm: {
    portiere: { why: 'A goalkeeper\'s shoulder works overhead on clearances and absorbs direct impact on lateral dives — throwing power and landing stability need training together.', exercises: [
      'Progressive clearance technique, controlled power (8-10 reps)',
      'Controlled landing on the side after a simulated dive (3 sets of 5 per side)',
      'Rotator cuff strengthening with a band (2-3 sets of 12-15)',
    ]},
    difensore: { why: 'In aerial duels and blocking, the shoulder absorbs direct contact — stability matters as much as raw strength.', exercises: [
      'Shoulder blocking/shielding technique, controlled (3 sets of 8 per side)',
      'Scapular strengthening under light load (2-3 sets of 12)',
      'Shoulder stability under light external contact (3 sets of 8)',
    ]},
    centrocampista: { why: 'Less central than for other roles, but prolonged physical duels over ninety minutes still stress the shoulder over time.', exercises: [
      'General rotator cuff strengthening (2-3 sets of 15)',
      'Shoulder endurance under light repeated load (2-3 sets of 15-20)',
    ]},
    attaccante: { why: 'Shielding the ball with the arm against a defender is a repeated action that requires shoulder stability under pressure.', exercises: [
      'Ball-shielding technique, stable arm (3 sets of 8 per side)',
      'Isometric shoulder strengthening under external pressure (3 sets of 15-20 seconds)',
    ]},
  },
  hand_wrist: {
    portiere: { why: 'Catching and controlling the ball depend on finger and wrist strength — it\'s the technical foundation of every save, not just a detail.', exercises: [
      'Progressive catching technique on balls at increasing speed (10-12 reps)',
      'Finger strengthening with a soft ball (3 sets of 15)',
      'Controlled hand landing after a simulated dive (3 sets of 6)',
    ]},
    difensore: { why: 'Falls during tackles often put the wrist under sudden stress — baseline strength reduces the risk of a sprain.', exercises: [
      'General grip strengthening with a soft ball (2-3 sets of 15)',
      'Wrist mobility in every direction, end of session',
    ]},
    centrocampista: { why: 'As with other outfield roles, occasional falls during play benefit from a stronger, more mobile wrist.', exercises: [
      'General grip strengthening with a soft ball (2-3 sets of 15)',
      'Wrist mobility in every direction, end of session',
    ]},
    attaccante: { why: 'Constant physical contact and occasional falls benefit from a stronger, more mobile wrist, even though it isn\'t the main factor for this role.', exercises: [
      'General grip strengthening with a soft ball (2-3 sets of 15)',
      'Wrist mobility in every direction, end of session',
    ]},
  },
};

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

function BottomNav({ screen, isEN, onNavigate }) {
  const items = [
    { key: 'regions', label: isEN ? 'Home' : 'Home', icon: Compass, screens: ['regions', 'triage', 'injuries', 'firstaid'] },
    { key: 'tracker', label: isEN ? 'Recovery' : 'Percorso', icon: Activity, screens: ['tracker'] },
    { key: 'physios', label: isEN ? 'Physio' : 'Fisio', icon: Stethoscope, screens: ['physios'] },
    { key: 'premium', label: 'Premium', icon: TrendingUp, screens: ['premium'] },
  ];
  return (
    <div style={{ backgroundColor: colors.card, borderTop: `1px solid ${colors.hairline}`, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} className="fixed bottom-0 left-0 right-0 flex items-stretch z-20 shadow-[0_-2px_10px_rgba(16,27,38,0.06)]">
      {items.map((item) => {
        const isActive = item.screens.includes(screen);
        const Icon = item.icon;
        return (
          <button key={item.key} onClick={() => onNavigate(item.key)} className="os-focus flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5" style={{ color: isActive ? colors.accentDark : colors.mutedInk }}>
            <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: isActive ? 700 : 500 }} className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PlayerMascot({ stage = 0, size = 28, color = colors.accent }) {
  const poses = [
    // 0 — in piedi, pronto
    { head: { cx: 20, cy: 8 }, torso: 'M20 12 L20 27', armL: 'M20 15 L14 20', armR: 'M20 15 L26 20', legL: 'M20 27 L15 40', legR: 'M20 27 L25 40', ball: { cx: 20, cy: 44 }, trail: null },
    // 1 — leggera rincorsa
    { head: { cx: 19, cy: 8 }, torso: 'M19 12 L21 27', armL: 'M21 15 L15 18', armR: 'M21 15 L28 22', legL: 'M21 27 L14 40', legR: 'M21 27 L27 38', ball: { cx: 22, cy: 42 }, trail: null },
    // 2 — gamba indietro, carica il tiro
    { head: { cx: 18, cy: 8 }, torso: 'M18 12 L22 26', armL: 'M22 15 L14 12', armR: 'M22 15 L30 20', legL: 'M22 26 L16 38', legR: 'M22 26 L32 22', ball: { cx: 20, cy: 42 }, trail: null },
    // 3 — contatto con il pallone
    { head: { cx: 19, cy: 8 }, torso: 'M19 12 L21 26', armL: 'M21 15 L13 18', armR: 'M21 15 L29 14', legL: 'M21 26 L15 40', legR: 'M21 26 L28 38', ball: { cx: 31, cy: 40 }, trail: null },
    // 4 — pallone in volo, gesto finale
    { head: { cx: 20, cy: 7 }, torso: 'M20 11 L20 25', armL: 'M20 14 L12 10', armR: 'M20 14 L28 10', legL: 'M20 25 L14 39', legR: 'M20 25 L30 30', ball: { cx: 37, cy: 19 }, trail: 'M32 26 L28 30 M34 22 L30 25' },
  ];
  const p = poses[Math.min(stage, poses.length - 1)];
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 40 48" fill="none" aria-hidden="true" style={{ transition: 'all 0.3s ease' }}>
      <circle cx={p.head.cx} cy={p.head.cy} r="4" fill={color} />
      <path d={p.torso} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d={p.armL} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d={p.armR} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d={p.legL} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d={p.legR} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={p.ball.cx} cy={p.ball.cy} r="3" fill="none" stroke={color} strokeWidth="1.8" />
      {p.trail && <path d={p.trail} stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />}
    </svg>
  );
}

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
  { region: 'shoulder_arm', label: 'Spalla/braccio sx', shape: 'rect', center: { cx: 60, cy: 97 }, props: { x: 53, y: 58, width: 14, height: 78, rx: 7 } },
  { region: 'shoulder_arm', label: 'Spalla/braccio dx', shape: 'rect', center: { cx: 140, cy: 97 }, props: { x: 133, y: 58, width: 14, height: 78, rx: 7 } },
  { region: 'hand_wrist', label: 'Mano/polso sx', shape: 'ellipse', center: { cx: 60, cy: 141 }, props: { cx: 60, cy: 141, rx: 8, ry: 9 } },
  { region: 'hand_wrist', label: 'Mano/polso dx', shape: 'ellipse', center: { cx: 140, cy: 141 }, props: { cx: 140, cy: 141, rx: 8, ry: 9 } },
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
        @keyframes os-breathe { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
        .os-breathe { animation: os-breathe 2.6s ease-in-out infinite; }
      `}</style>
      <defs>
        <linearGradient id="os-body-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E4EBF2" />
          <stop offset="100%" stopColor="#CBD8E3" />
        </linearGradient>
        <filter id="os-body-shadow" x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor={colors.ink} floodOpacity="0.12" />
        </filter>
      </defs>
      <ellipse cx="100" cy="300" rx="52" ry="8" fill={colors.ink} opacity="0.06" />
      <g filter="url(#os-body-shadow)">
        <ellipse cx="100" cy="25" rx="15" ry="17" fill="url(#os-body-gradient)" />
        <rect x="95" y="39" width="10" height="10" rx="4" fill="url(#os-body-gradient)" />
        <path d="M72 58 Q100 44 128 58 L131 108 Q100 124 69 108 Z" fill="url(#os-body-gradient)" />
        <rect x="53" y="58" width="14" height="78" rx="7" fill="url(#os-body-gradient)" />
        <rect x="133" y="58" width="14" height="78" rx="7" fill="url(#os-body-gradient)" />
        <ellipse cx="60" cy="141" rx="8" ry="9" fill="url(#os-body-gradient)" />
        <ellipse cx="140" cy="141" rx="8" ry="9" fill="url(#os-body-gradient)" />
      </g>

      {bodyZones.map((zone, i) => {
        const isPressed = pressed === i;
        const commonProps = {
          fill: isPressed ? accentColor : tintColor,
          stroke: accentColor,
          strokeWidth: 1.3,
          className: isPressed ? '' : 'os-breathe',
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

function InstallBanner({ isEN, onInstallClick, canInstall, onDismiss }) {
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  return (
    <div style={{ backgroundColor: colors.accentTint }} className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4">
      <Smartphone size={14} color={colors.accentDark} className="flex-shrink-0" />
      <p style={{ color: colors.accentDark }} className="flex-1 text-[11px] leading-snug">
        {isIOS
          ? (isEN ? 'Tap Share → "Add to Home Screen" to find Offside instantly' : 'Tocca Condividi → "Aggiungi a Home" per ritrovarla subito')
          : (isEN ? 'Add Offside to your home screen' : 'Aggiungi Offside alla schermata Home')}
      </p>
      {canInstall && !isIOS && (
        <button onClick={onInstallClick} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full">{isEN ? 'Install' : 'Installa'}</button>
      )}
      <button onClick={onDismiss} style={{ color: colors.accentDark }} className="os-focus flex-shrink-0"><X size={13} /></button>
    </div>
  );
}

function SetupSection({ id, currentSection, onToggle, icon: Icon, label, badge, gold, children }) {
  const isOpen = currentSection === id;
  const accentColor = gold ? colors.premiumGold : colors.accent;
  return (
    <div style={{ backgroundColor: colors.card, border: `1.5px solid ${isOpen ? accentColor + '66' : colors.hairline}` }} className="rounded-xl overflow-hidden shadow-sm mb-2.5 transition-colors">
      <button onClick={() => onToggle(isOpen ? null : id)} className="os-focus w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div style={{ backgroundColor: gold ? colors.premiumGoldTint : colors.accentTint }} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
          <Icon size={16} color={gold ? colors.premiumGold : colors.accentDark} />
        </div>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: colors.ink }} className="flex-1 text-sm font-semibold">{label}</span>
        {badge}
        <ChevronDown size={16} color={colors.mutedInk} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>
      {isOpen && <div className="px-4 pb-4 os-fadein">{children}</div>}
    </div>
  );
}

function PremiumBanner({ text, onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)', border: `1px solid ${colors.premiumGold}50` }} className="os-focus w-full flex items-center gap-3.5 rounded-2xl p-4 mb-5 text-left hover:opacity-90 transition-opacity shadow-sm">
      <div style={{ backgroundColor: colors.premiumGoldTint }} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
        <TrendingUp size={22} color={colors.premiumGold} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#FFFFFF' }} className="text-sm font-semibold leading-snug">{text}</p>
      </div>
      <ChevronRight size={18} color={colors.premiumGold} className="flex-shrink-0" />
    </button>
  );
}

function ExerciseHelp({ ex, isEN }) {
  const query = ex.text.replace(/\([^)]*\)/g, '').trim();
  const searchSuffix = isEN ? ' exercise correct technique' : ' esercizio tecnica corretta';
  const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + searchSuffix)}`;
  const tips = (isEN ? formCuesEN : formCuesIT)[ex.cat] || [];
  const embedId = catVideoIds[ex.cat];
  return (
    <div style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}` }} className="mt-2.5 rounded-xl p-3 space-y-2.5">
      {tips.length > 0 && (
        <ul className="space-y-1">
          {tips.map((tip, ti) => (
            <li key={ti} style={{ color: colors.mutedInk }} className="text-xs flex gap-1.5"><span style={{ color: colors.accent }}>—</span><span>{tip}</span></li>
          ))}
        </ul>
      )}
      {embedId ? (
        <>
          <div style={{ aspectRatio: '16/9', backgroundColor: colors.ink }} className="w-full rounded-lg overflow-hidden">
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`}
              title={isEN ? 'Exercise demonstration video' : 'Video dimostrativo esercizio'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
          <p style={{ color: colors.mutedInk }} className="text-[10px] text-center leading-relaxed">{isEN ? 'General reference for this type of movement, not this exact exercise' : 'Riferimento generale per questo tipo di movimento, non l\'esercizio esatto'}</p>
        </>
      ) : (
        <>
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
        </>
      )}
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
function buildChartData(injuryLog, isEN) {
  const feelingMap = { male: 1, cosi: 2, bene: 3 };
  const stiffnessMap = { si: 1, poca: 2, no: 3 };
  const dates = Object.keys(injuryLog).sort();
  return dates
    .filter((d) => injuryLog[d].feeling || injuryLog[d].stiffness)
    .map((d) => {
      const entry = injuryLog[d];
      const dateObj = new Date(d + 'T00:00:00');
      const label = dateObj.toLocaleDateString(isEN ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'short' });
      return {
        date: label,
        feeling: entry.feeling ? feelingMap[entry.feeling] : null,
        stiffness: entry.stiffness ? stiffnessMap[entry.stiffness] : null,
      };
    });
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
  if (!log) return { count: 0, graceUsed: false };
  let streak = 0;
  let d = new Date();
  let graceUsed = false;
  const isDone = (key) => log[key] && log[key].done;
  if (!isDone(toISODate(d))) d.setDate(d.getDate() - 1);
  while (true) {
    if (isDone(toISODate(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (!graceUsed && streak > 0) {
      graceUsed = true;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return { count: streak, graceUsed };
}
function downloadRecoveryReminders(isEN) {
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 15 * 60000);
  const summary = isEN ? 'Recovery session — Offside' : 'Sessione di recupero — Offside';
  const description = isEN ? 'Open Offside and log today\'s session' : 'Apri Offside e segna la sessione di oggi';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Offside//Recovery Reminders//IT',
    'BEGIN:VEVENT',
    `UID:offside-${Date.now()}@offside.app`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    'RRULE:FREQ=DAILY;COUNT=28',
    `SUMMARY:${summary}`, `DESCRIPTION:${description}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'offside-promemoria.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function mascotStageForScreen(screen) {
  const stages = {
    cover: 0, onboarding: 0,
    regions: 1,
    triage: 2, injuries: 2, firstaid: 2,
    tracker: 3, profile: 3,
    premium: 4,
  };
  return stages[screen] ?? 1;
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
  const [criteriaChecked, setCriteriaChecked] = useState({});
  const [injuryDates, setInjuryDates] = useState({});
  const [injurySeverities, setInjurySeverities] = useState({});
  const [dailyLog, setDailyLog] = useState({});
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [editingSetup, setEditingSetup] = useState(false);
  const [showSeverityInfo, setShowSeverityInfo] = useState(false);
  const [setupSection, setSetupSection] = useState('gravita');
  const [injuryRecurrence, setInjuryRecurrence] = useState({});
  const [trackerSection, setTrackerSection] = useState('esercizi');
  const [physioSearch, setPhysioSearch] = useState('');
  const [restoreEmail, setRestoreEmail] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('idle');
  const [showRestoreBox, setShowRestoreBox] = useState(false);
  const [pendingDate, setPendingDate] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [language, setLanguage] = useState('it');
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [userProfile, setUserProfile] = useState({ age: '', weight: '', height: '', sex: '', level: '' });
  const [onboardingProfileDone, setOnboardingProfileDone] = useState(false);
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
  const playerLevels = isEN ? playerLevelsEN : playerLevelsIT;
  const regionRoleExercises = isEN ? regionRoleExercisesEN : regionRoleExercisesIT;
  const techniqueData = isEN ? techniqueDataEN : techniqueDataIT;
  const dateChips = isEN ? dateChipsEN : dateChipsIT;
  const mechanismOptions = isEN ? mechanismOptionsEN : mechanismOptionsIT;
  const popOptions = isEN ? popOptionsEN : popOptionsIT;
  const weightOptions = isEN ? weightOptionsEN : weightOptionsIT;
  const regionLabels = isEN ? regionLabelsEN : regionLabelsIT;
  const [shareCopied, setShareCopied] = useState(false);
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
    const params = new URLSearchParams(window.location.search);
    if (params.get('premium') === 'unlocked') {
      setPremiumUnlocked(true);
      persist(snapshot({ premiumUnlocked: true }));
      trackEvent('premium_unlocked_via_redirect');
      params.delete('premium');
      const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '') + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  useEffect(() => {
    loadFontsOnce();
    (async () => {
      let loaded = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          loaded = JSON.parse(raw);
          const injuryKey = loaded.selectedInjury || null;
          if (injuryKey && injuriesData[injuryKey]) {
            setSelectedInjury(injuryKey);
            setSelectedRegion(regionOfInjury(injuryKey, injuriesData));
          }
          setActivePhase(loaded.activePhase || 0);
          setProgress(loaded.progress || {});
          setInjuryDates(loaded.injuryDates || {});
          setInjurySeverities(loaded.injurySeverities || {});
          setDailyLog(loaded.dailyLog || {});
          setPlayerPosition(loaded.playerPosition || null);
          setPreventionProgress(loaded.preventionProgress || {});
          setLanguage(loaded.language || 'it');
          setPremiumUnlocked(!!loaded.premiumUnlocked);
          setCriteriaChecked(loaded.criteriaChecked || {});
          setInstallDismissed(!!loaded.installDismissed);
          setUserProfile(loaded.userProfile || { age: '', weight: '', height: '', sex: '', level: '' });
          setOnboardingProfileDone(!!loaded.onboardingProfileDone);
          setInjuryRecurrence(loaded.injuryRecurrence || {});
        }
      } catch (err) {} finally {
        setLoading(false);
      }

      // Ritorno da un pagamento Stripe riuscito: sblocca e salva, poi pulisci l'URL
      const params = new URLSearchParams(window.location.search);
      if (params.get('premium') === 'unlocked') {
        setPremiumUnlocked(true);
        const next = { ...loaded, premiumUnlocked: true };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (err) {}
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPromptEvent(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (screen === 'physios') trackEvent('physio_directory_viewed');
  }, [screen]);

  const persist = useCallback(async (next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (err) {
      setSaveError(true);
    }
  }, []);

  const snapshot = (overrides = {}) => ({ selectedInjury, activePhase, progress, injuryDates, injurySeverities, dailyLog, playerPosition, preventionProgress, language, premiumUnlocked, criteriaChecked, installDismissed, userProfile, onboardingProfileDone, injuryRecurrence, ...overrides });

  const goBack = () => {
    if (screen === 'tracker') setScreen('injuries');
    else if (screen === 'injuries') { setScreen('regions'); setSelectedRegion(null); setTriageTag(null); }
    else if (screen === 'triage') setScreen('regions');
    else if (screen === 'firstaid') setScreen('regions');
    else if (screen === 'premium') setScreen('tracker');
    else if (screen === 'profile') setScreen('regions');
    else if (screen === 'physios') setScreen('regions');
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
    setPendingDate('');
    persist(snapshot({ injuryDates: nextDates, activePhase: suggested }));
  };

  const skipDate = () => { setEditingSetup(false); setPendingDate(''); };

  const restorePremium = async () => {
    if (!restoreEmail.trim() || !restoreEmail.includes('@')) { setRestoreStatus('error'); return; }
    setRestoreStatus('checking');
    try {
      const res = await fetch('/api/verify-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: restoreEmail }),
      });
      const data = await res.json();
      if (data.premium) {
        setPremiumUnlocked(true);
        persist(snapshot({ premiumUnlocked: true }));
        setRestoreStatus('success');
      } else {
        setRestoreStatus('notfound');
      }
    } catch (err) {
      setRestoreStatus('error');
    }
  };
  const changePhase = (idx) => { setActivePhase(idx); setActiveVideo(null); persist(snapshot({ activePhase: idx })); };

  const renderRestoreBox = () => (
    <div className="mt-3">
      {!showRestoreBox ? (
        <button onClick={() => setShowRestoreBox(true)} style={{ color: colors.mutedInk }} className="os-focus text-xs underline hover:opacity-70">
          {isEN ? 'Already have Premium? Restore it' : 'Hai già Premium? Ripristinalo'}
        </button>
      ) : (
        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-3.5">
          <p style={{ color: colors.mutedInk }} className="text-xs mb-2">{isEN ? 'Enter the email you used to pay' : 'Inserisci l\'email che hai usato per pagare'}</p>
          <div className="flex gap-2">
            <input type="email" value={restoreEmail} onChange={(e) => { setRestoreEmail(e.target.value); setRestoreStatus('idle'); }} placeholder="email@esempio.com" style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus flex-1 min-w-0 rounded-lg px-3 py-2 text-sm" />
            <button onClick={restorePremium} disabled={restoreStatus === 'checking'} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0">
              {restoreStatus === 'checking' ? '...' : (isEN ? 'Check' : 'Verifica')}
            </button>
          </div>
          {restoreStatus === 'success' && <p style={{ color: colors.accentDark }} className="text-xs mt-2 flex items-center gap-1"><CheckCircle2 size={13} />{isEN ? 'Premium restored!' : 'Premium ripristinato!'}</p>}
          {restoreStatus === 'notfound' && <p style={{ color: colors.red }} className="text-xs mt-2">{isEN ? 'No Premium found for this email.' : 'Nessun Premium trovato per questa email.'}</p>}
          {restoreStatus === 'error' && <p style={{ color: colors.red }} className="text-xs mt-2">{isEN ? 'Something went wrong, try again.' : 'Qualcosa è andato storto, riprova.'}</p>}
        </div>
      )}
    </div>
  );


  const toggleExercise = (exIdx) => {
    if (!selectedInjury) return;
    const pKey = `${selectedInjury}-${activePhase}`;
    const current = progress[pKey] || {};
    const nextForPhase = { ...current, [exIdx]: !current[exIdx] };
    const nextProgress = { ...progress, [pKey]: nextForPhase };
    setProgress(nextProgress);
    persist(snapshot({ progress: nextProgress }));
  };

  const toggleCriterion = (cIdx) => {
    if (!selectedInjury) return;
    const pKey = `${selectedInjury}-${activePhase}`;
    const current = criteriaChecked[pKey] || {};
    const nextForPhase = { ...current, [cIdx]: !current[cIdx] };
    const nextChecked = { ...criteriaChecked, [pKey]: nextForPhase };
    setCriteriaChecked(nextChecked);
    persist(snapshot({ criteriaChecked: nextChecked }));
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
      streak.count > 0 ? `Current streak: ${streak.count} consecutive days` : null,
    ] : [
      'OFFSIDE — Riepilogo recupero',
      '',
      `Infortunio: ${injury.label}`,
      `Gravità: ${severityLabels[severity]}`,
      currentDate ? `Giorno di recupero: ${dayCount}` : null,
      `Fase attuale: ${phase.name} (Fase ${activePhase + 1} di ${injury.phases.length})`,
      `Esercizi completati in questa fase: ${completedCount}/${phase.exercises.length}`,
      `Sessioni giornaliere registrate: ${doneDays}`,
      streak.count > 0 ? `Serie attuale: ${streak.count} giorni consecutivi` : null,
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
    .os-print-only { display: none; }
    @media print {
      body * { visibility: hidden; }
      .os-print-only, .os-print-only * { visibility: visible; }
      .os-print-only { display: block; position: absolute; top: 0; left: 0; width: 100%; padding: 24px; font-family: 'Inter', sans-serif; color: #101B26; }
      .os-print-only h1 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin-bottom: 16px; }
      .os-print-only p { font-size: 13px; line-height: 1.5; margin-bottom: 8px; }
      .os-print-only ul { margin: 4px 0 12px 20px; font-size: 13px; }
      .os-print-only table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
      .os-print-only th, .os-print-only td { border: 1px solid #D7E1EA; padding: 6px 8px; text-align: left; }
    }
  `;

  if (screen === 'cover') {
    return (
      <div style={{ background: `linear-gradient(165deg, ${colors.preventionPaper} 0%, ${colors.paper} 55%, #FFFFFF 100%)`, ...bodyFont }} className="w-full min-h-[100dvh] relative flex flex-col overflow-hidden">
        <style>{sharedStyle}</style>
        <svg className="absolute pointer-events-none" style={{ top: '8%', right: '-22%', width: '150%', height: 'auto', opacity: 0.05, transform: 'rotate(-8deg)' }} viewBox="0 0 512 512" fill="none">
          <circle cx="140" cy="256" r="32" fill={colors.ink} />
          <path d="M178 256 H222 L270 104 L322 408 L374 256 H428" stroke={colors.ink} strokeWidth="30" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="relative px-6 sm:px-10 pt-12 pb-8 flex flex-col flex-1">
          <div className="flex items-center justify-between mb-5">
            <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)', border: `2px solid ${colors.accent}44` }} className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm">
              <LogoMark size={30} color={colors.accent} />
            </div>
            <div className="flex items-center gap-2">
              <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="flex items-center rounded-full p-0.5 shadow-sm">
                <button onClick={() => { setLanguage('it'); persist(snapshot({ language: 'it' })); }} style={{ backgroundColor: !isEN ? colors.accentTint : 'transparent', opacity: !isEN ? 1 : 0.45 }} className="os-focus w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors" aria-label="Italiano">🇮🇹</button>
                <button onClick={() => { setLanguage('en'); persist(snapshot({ language: 'en' })); }} style={{ backgroundColor: isEN ? colors.accentTint : 'transparent', opacity: isEN ? 1 : 0.45 }} className="os-focus w-8 h-8 rounded-full flex items-center justify-center text-base transition-colors" aria-label="English">🇬🇧</button>
              </div>
              <span style={{ ...displayFont, backgroundColor: colors.ink, color: colors.accent, letterSpacing: '0.1em' }} className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-sm">Beta</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ ...displayFont, color: colors.accentDark, letterSpacing: '0.16em' }} className="text-[11px] font-bold uppercase mb-2">{isEN ? 'For amateur footballers' : 'Per il calcio amatoriale'}</p>
                <h1 style={{ ...displayFont, letterSpacing: '0.01em' }} className="text-[64px] sm:text-[80px] font-bold leading-[0.95] mb-1">
                  <span style={{ color: colors.ink }}>OFF</span><span style={{ color: colors.accent }}>SIDE</span>
                </h1>
              </div>
              <PlayerMascot stage={0} size={30} color={colors.accent} />
            </div>
          </div>

          <div className="mb-6 space-y-3">
            {(isEN ? [
              'Prevent the most common injuries, before they happen.',
              'Know what to do in the first few minutes, if you get hurt.',
              'Follow a tailored recovery plan, step by step.',
            ] : [
              'Previeni gli infortuni più comuni, prima che succedano.',
              'Sai cosa fare nei primi minuti, se ti fai male.',
              'Segui un percorso di recupero fatto su misura, passo dopo passo.'
            ]).map((text, i) => (
              <div key={i} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="flex items-center gap-3 rounded-xl px-3.5 py-3 shadow-sm">
                <span style={{ ...displayFont, backgroundColor: colors.accentTint, color: colors.accentDark }} className="os-tabular text-sm font-bold flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center">{String(i + 1).padStart(2, '0')}</span>
                <p style={{ color: colors.ink }} className="text-[14px] leading-snug font-medium">{text}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setDisclaimerAccepted(!disclaimerAccepted)} role="checkbox" aria-checked={disclaimerAccepted} className="os-focus w-full flex items-start gap-2.5 mb-4 text-left">
            <div style={{ backgroundColor: disclaimerAccepted ? colors.accent : colors.card, border: `1.5px solid ${disclaimerAccepted ? colors.accent : colors.hairline}` }} className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5">
              {disclaimerAccepted && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
            </div>
            <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">
              {isEN
                ? 'I understand that Offside provides general information about common injuries, not a diagnosis or a personalized treatment plan, and that it does not replace an assessment by a healthcare professional.'
                : 'Ho capito che Offside fornisce informazioni generali su infortuni comuni, non una diagnosi o un piano di trattamento personalizzato, e non sostituisce una valutazione da un professionista sanitario.'}
            </p>
          </button>

          <button
            onClick={() => { if (disclaimerAccepted) { trackEvent('disclaimer_accepted'); setScreen(onboardingProfileDone ? 'regions' : 'onboarding'); } }}
            disabled={!disclaimerAccepted}
            style={{ backgroundColor: disclaimerAccepted ? colors.accent : colors.hairline, color: disclaimerAccepted ? '#FFFFFF' : colors.mutedInk }}
            className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium transition-colors shadow-sm"
          >
            <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Start your recovery' : 'Inizia il tuo percorso'}</span><ArrowRight size={16} />
          </button>

          <div className="text-center mt-3">{renderRestoreBox()}</div>
        </div>
      </div>
    );
  }

  if (screen === 'onboarding') {
    const finishOnboarding = () => { setOnboardingProfileDone(true); persist(snapshot({ onboardingProfileDone: true })); setScreen('regions'); };
    return (
      <div style={{ backgroundColor: colors.paper, ...bodyFont }} className="w-full min-h-[100dvh] relative flex flex-col">
        <style>{sharedStyle}</style>
        <div className="px-6 sm:px-10 pt-14 pb-8 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <p style={{ ...displayFont, color: colors.accentDark, letterSpacing: '0.14em' }} className="text-[11px] font-bold uppercase">{isEN ? 'One quick thing' : 'Una cosa veloce'}</p>
            <button onClick={finishOnboarding} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Skip' : 'Salta'}>
              <X size={17} color={colors.mutedInk} />
            </button>
          </div>
          <h1 style={{ ...displayFont, color: colors.ink }} className="text-2xl font-bold mb-2">{isEN ? 'What level do you play at?' : 'A che livello giochi?'}</h1>
          <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed mb-8">{isEN ? 'Helps set the right tone for your recovery. You can skip this and add it later.' : 'Aiuta a impostare il tono giusto per il tuo recupero. Puoi saltarlo e aggiungerlo più tardi.'}</p>

          <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2.5">{isEN ? 'Playing level' : 'Categoria'}</p>
          <div className="flex flex-wrap gap-2 mb-8">
            {playerLevels.map((lvl) => (
              <button key={lvl.key} onClick={() => { const next = { ...userProfile, level: lvl.key }; setUserProfile(next); }} style={{ backgroundColor: userProfile.level === lvl.key ? colors.accent : colors.card, color: userProfile.level === lvl.key ? '#FFFFFF' : colors.ink, border: `1.5px solid ${userProfile.level === lvl.key ? colors.accent : colors.hairline}` }} className="os-focus px-4 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm">
                {lvl.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            <Lock size={13} color={colors.premiumGold} />
            <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? 'Position (Premium)' : 'Ruolo (Premium)'}</p>
          </div>
          <div className="relative mb-2">
            <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }} className="grid grid-cols-2 gap-2.5" aria-hidden="true">
              {playerPositions.map((pos) => (
                <div key={pos.key} style={{ backgroundColor: colors.card, border: `1.5px solid ${colors.hairline}`, color: colors.ink }} className="rounded-xl py-3.5 text-sm font-semibold text-center shadow-sm">
                  {pos.label}
                </div>
              ))}
            </div>
            <button onClick={() => { finishOnboarding(); setScreen('premium'); }} className="os-focus absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-xl" style={{ backgroundColor: 'rgba(238,243,248,0.55)' }}>
              <span style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-sm">{isEN ? 'Unlock Premium' : 'Sblocca Premium'}</span>
            </button>
          </div>
          <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mb-8">{isEN ? 'Premium tailors training and recovery tips to your exact position.' : 'Premium adatta allenamento e consigli di recupero al tuo ruolo esatto.'}</p>

          <div className="flex-1" />

          <button onClick={finishOnboarding} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium shadow-sm hover:opacity-90 transition-opacity mb-3">
            <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Continue without Premium' : 'Continua senza Premium'}</span><ArrowRight size={16} />
          </button>
          <p style={{ color: colors.mutedInk }} className="text-[11px] text-center">{isEN ? 'You can unlock Premium anytime from your profile.' : 'Puoi sbloccare Premium quando vuoi dal tuo profilo.'}</p>
        </div>
      </div>
    );
  }

  const activeInjuryKeys = Object.keys(injuryDates).filter((k) => injuryDates[k] && injuriesData[k]);

  const handleBottomNav = (key) => {
    if (key === 'regions') { setScreen('regions'); }
    else if (key === 'tracker') {
      if (activeInjuryKeys.length > 0) resumeInjury(activeInjuryKeys[0]);
      else { setRegionsTab('injury'); setScreen('regions'); }
    }
    else if (key === 'physios') { setScreen('physios'); }
    else if (key === 'premium') { setScreen('premium'); }
  };

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
            {screen === 'regions' ? (regionsTab === 'prevention' ? (isEN ? 'Prevention' : 'Prevenzione') : (isEN ? 'Where does it hurt?' : 'Dove senti il problema?')) : screen === 'triage' ? (isEN ? 'Not sure what it is?' : 'Non sai cosa hai?') : screen === 'firstaid' ? (isEN ? 'First aid' : 'Primi soccorsi') : screen === 'premium' ? 'Premium' : screen === 'profile' ? (isEN ? 'Your profile' : 'Il tuo profilo') : screen === 'physios' ? (isEN ? 'Physiotherapists' : 'Fisioterapisti') : screen === 'injuries' ? (selectedRegion && regionLabels[selectedRegion] ? regionLabels[selectedRegion] : (isEN ? 'Injuries' : 'Infortuni')) : (isEN ? 'Your recovery' : 'Il tuo percorso')}
          </h1>
        </div>
        {screen === 'tracker' && injury && (
          <button onClick={shareProgress} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Share your progress' : 'Condividi il tuo percorso'}>
            {shareCopied ? <Check size={15} color={colors.accentDark} /> : <Share2 size={15} color={colors.accentDark} />}
          </button>
        )}
        <div className="flex-shrink-0" style={{ width: 20 }}>
          <PlayerMascot stage={mascotStageForScreen(screen)} size={20} color={colors.accentDark} />
        </div>
        {screen !== 'profile' && (
          <button onClick={() => setScreen('profile')} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Your profile' : 'Il tuo profilo'}>
            <User size={17} color={colors.accentDark} />
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
              <button onClick={() => setScreen('physios')} style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: colors.red, border: `1px solid ${colors.red}33` }} className="os-focus w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold mt-3 hover:opacity-80 transition-opacity">
                <Stethoscope size={13} />{isEN ? 'Find a physiotherapist near you' : 'Trova un fisioterapista vicino a te'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div key={screen} className="px-5 sm:px-8 py-6 os-fadein">
        {screen === 'regions' && (
          <>
            {!installDismissed && !(typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) && (
              <InstallBanner
                isEN={isEN}
                canInstall={!!installPromptEvent}
                onInstallClick={async () => { if (installPromptEvent) { installPromptEvent.prompt(); await installPromptEvent.userChoice; setInstallPromptEvent(null); } }}
                onDismiss={() => { setInstallDismissed(true); persist(snapshot({ installDismissed: true })); }}
              />
            )}

            <div style={{ backgroundColor: colors.laneBg }} className="flex gap-1 p-1 rounded-full mb-5">
              <button onClick={() => setRegionsTab('injury')} style={{ backgroundColor: regionsTab === 'injury' ? colors.card : 'transparent', color: regionsTab === 'injury' ? colors.ink : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">
                <Snowflake size={14} />{isEN ? 'Injury' : 'Infortunio'}
              </button>
              <button onClick={() => setRegionsTab('prevention')} style={{ backgroundColor: regionsTab === 'prevention' ? colors.card : 'transparent', color: regionsTab === 'prevention' ? colors.preventionDark : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">
                <ShieldCheck size={14} />{isEN ? 'Prevention' : 'Prevenzione'}
              </button>
              <button onClick={() => setRegionsTab('technique')} style={{ backgroundColor: regionsTab === 'technique' ? colors.card : 'transparent', color: regionsTab === 'technique' ? colors.premiumGold : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">
                {!premiumUnlocked && <Lock size={11} />}<CircleDot size={14} />{isEN ? 'Technique' : 'Tecnica'}
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
                        <div key={key} style={{ backgroundColor: colors.ink }} className="flex items-stretch rounded-2xl overflow-hidden shadow-sm">
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
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {Object.entries(regions).map(([key, data]) => {
                    const Icon = data.icon;
                    return (
                      <button key={key} onClick={() => openRegion(key)} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus flex flex-col items-center gap-2.5 px-3 py-5 rounded-2xl text-center hover:shadow-md hover:border-green-300 transition-all">
                        <div style={{ backgroundColor: colors.accentTint, border: `1.5px solid ${colors.accent}40` }} className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"><Icon size={24} color={colors.accentDark} strokeWidth={2} /></div>
                        <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.01em' }} className="text-sm font-semibold uppercase leading-tight">{regionLabels[key]}</p>
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
            ) : regionsTab === 'prevention' ? (
              <>
                {selectedInjury && injuriesData[selectedInjury] && (
                  <button onClick={() => resumeInjury(selectedInjury)} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-left shadow-sm hover:opacity-90 transition-opacity">
                    <ArrowLeft size={15} color={colors.accentDark} className="flex-shrink-0" />
                    <span style={{ color: colors.accentDark }} className="text-sm font-medium">{isEN ? `Back to ${injuriesData[selectedInjury].label}` : `Torna a ${injuriesData[selectedInjury].label}`}</span>
                  </button>
                )}
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
                      <div key={key} id={`prevention-${key}`} style={{ backgroundColor: colors.card, border: `1.5px solid ${isExpanded ? colors.prevention + '55' : colors.hairline}` }} className="rounded-2xl overflow-hidden shadow-sm scroll-mt-4">
                        <button onClick={() => setExpandedPrevention(isExpanded ? null : key)} className="os-focus w-full flex items-center gap-4 px-4 py-4.5 text-left">
                          <div style={{ backgroundColor: colors.preventionTint, border: `1.5px solid ${colors.prevention}40` }} className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"><RegionIcon size={24} color={colors.preventionDark} strokeWidth={2} /></div>
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
            ) : (
              <>
                {!premiumUnlocked ? (
                  <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)', border: `1px solid ${colors.premiumGold}40` }} className="rounded-2xl p-6 text-center shadow-sm">
                    <Lock size={28} color={colors.premiumGold} className="mx-auto mb-3" />
                    <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-base font-bold mb-2">{isEN ? 'Technical training, by role' : 'Allenamento tecnico, per ruolo'}</p>
                    <p style={{ color: '#A9B7C4' }} className="text-sm leading-relaxed mb-4">{isEN ? 'Ball control, passing, finishing — exercises built for your position on the pitch.' : 'Controllo palla, passaggio, finalizzazione — esercizi pensati per il tuo ruolo in campo.'}</p>
                    <button onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="os-focus px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide">
                      {isEN ? 'Unlock Premium' : 'Sblocca Premium'}
                    </button>
                  </div>
                ) : !playerPosition ? (
                  <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-2xl p-4 shadow-sm">
                    <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-3">{isEN ? 'Pick your position to see the right drills' : 'Scegli il tuo ruolo per vedere gli esercizi giusti'}</p>
                    <div className="flex flex-wrap gap-2">
                      {playerPositions.map((pos) => (
                        <button key={pos.key} onClick={() => { setPlayerPosition(pos.key); persist(snapshot({ playerPosition: pos.key })); }} style={{ backgroundColor: colors.premiumGoldTint, color: colors.ink, border: `1px solid ${colors.premiumGold}60` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-80 transition-colors">
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ ...displayFont, color: colors.ink }} className="text-base font-bold">{playerPositions.find((p) => p.key === playerPosition)?.label}</p>
                      <button onClick={() => setPlayerPosition(null)} style={{ color: colors.mutedInk }} className="os-focus text-[11px] underline hover:opacity-70">{isEN ? 'Change' : 'Cambia'}</button>
                    </div>
                    <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed mb-4">{techniqueData[playerPosition].why}</p>
                    <div className="space-y-2.5">
                      {techniqueData[playerPosition].exercises.map((ex, i) => {
                        const CatIcon = catIcons[ex.cat] || Circle;
                        const techKey = `tech-${i}`;
                        const tipOpen = activeVideo === techKey;
                        return (
                          <div key={i} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl overflow-hidden shadow-sm">
                            <div className="flex items-start gap-3 p-3">
                              <div style={{ backgroundColor: colors.premiumGoldTint, color: colors.ink }} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</div>
                              <div className="flex-1 min-w-0">
                                <p style={{ color: colors.ink }} className="text-sm leading-snug mb-1">{ex.text}</p>
                                <span style={{ backgroundColor: colors.paper, color: colors.ink, fontWeight: 600 }} className="text-[11px] px-1.5 py-0.5 rounded inline-flex items-center gap-1"><CatIcon size={10} />{catLabels[ex.cat]}</span>
                              </div>
                            </div>
                            <button onClick={() => setActiveVideo(tipOpen ? null : techKey)} style={{ color: '#B8860B', borderTop: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-1.5 px-3 py-2 text-xs font-semibold hover:opacity-70">
                              <ChevronDown size={11} style={{ transform: tipOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                              {isEN ? 'How do I do this?' : 'Come si fa?'}
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
              </>
            )}

            <div style={{ borderTop: `1px solid ${colors.hairline}` }} className="pt-5 mt-2">
              {regionsTab !== 'technique' && (
                <PremiumBanner onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} text={isEN ? 'Premium: exercises for your role AND this area' : 'Premium: esercizi per il tuo ruolo E questa zona'} />
              )}
            </div>

            <button onClick={() => setScreen('cover')} style={{ color: colors.mutedInk }} className="os-focus text-xs underline hover:opacity-70 mt-5 block mx-auto">{isEN ? 'Back to cover' : 'Torna alla copertina'}</button>
          </>
        )}

        {screen === 'premium' && (
          <div>
            {!premiumUnlocked ? (
              <>
                <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)', border: `1px solid ${colors.premiumGold}40` }} className="rounded-2xl p-6 mb-5 text-center">
                  <TrendingUp size={32} color={colors.premiumGold} className="mx-auto mb-3" />
                  <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-lg font-bold mb-2">{isEN ? 'Train like your role and injury need' : 'Allenati come richiedono ruolo e infortunio'}</p>
                  <p style={{ color: '#A9B7C4' }} className="text-sm leading-relaxed">{isEN ? 'Exercises tailored to your position AND the specific area — plus your real progress over time.' : 'Esercizi su misura per il tuo ruolo E la zona specifica — più il tuo vero andamento nel tempo.'}</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 size={18} color={colors.premiumGold} className="flex-shrink-0 mt-0.5" />
                    <p style={{ color: colors.ink }} className="text-sm">{isEN ? 'Training that combines your position AND the specific area' : 'Allenamento che unisce il tuo ruolo E la zona specifica'}</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 size={18} color={colors.premiumGold} className="flex-shrink-0 mt-0.5" />
                    <p style={{ color: colors.ink }} className="text-sm">{isEN ? 'Feeling and stiffness trends, visualized day by day' : 'Andamento di feeling e rigidità, giorno per giorno'}</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 size={18} color={colors.premiumGold} className="flex-shrink-0 mt-0.5" />
                    <p style={{ color: colors.ink }} className="text-sm">{isEN ? 'A printable summary for your physio or coach' : 'Un riepilogo stampabile per il tuo fisioterapista o allenatore'}</p>
                  </div>
                </div>
                <a href={STRIPE_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('premium_unlock_clicked')} style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium shadow-sm hover:opacity-90 transition-opacity">
                  <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Unlock Premium' : 'Sblocca Premium'}</span>
                </a>
                <div className="text-center mt-3">{renderRestoreBox()}</div>
              </>
            ) : (
              <>
                {(() => {
                  const roleRegion = injury ? regionOfInjury(selectedInjury, injuriesData) : selectedRegion;
                  return (
                    <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)', border: `1px solid ${colors.premiumGold}40` }} className="rounded-2xl p-4 mb-5 shadow-sm">
                      <p style={{ ...displayFont, color: colors.premiumGold, letterSpacing: '0.1em' }} className="text-[10px] font-bold uppercase mb-2">{isEN ? 'Training for your area + role' : 'Allenamento per zona + ruolo'}</p>
                      {!roleRegion ? (
                        <p style={{ color: '#D7E1EA' }} className="text-sm leading-relaxed">{isEN ? 'Select an injury or area first, to see training built specifically for it.' : 'Scegli prima un infortunio o una zona, per vedere l\'allenamento pensato apposta per quella.'}</p>
                      ) : !playerPosition ? (
                        <>
                          <p style={{ color: '#D7E1EA' }} className="text-sm mb-3">{isEN ? `Pick your position to see exercises for ${regionLabels[roleRegion].toLowerCase()}, built for your role.` : `Scegli il tuo ruolo per vedere gli esercizi per ${regionLabels[roleRegion].toLowerCase()}, pensati per te.`}</p>
                          <div className="flex flex-wrap gap-2">
                            {playerPositions.map((pos) => (
                              <button key={pos.key} onClick={() => { setPlayerPosition(pos.key); persist(snapshot({ playerPosition: pos.key })); }} style={{ backgroundColor: colors.premiumGoldTint, color: '#FFFFFF', border: `1px solid ${colors.premiumGold}60` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium hover:opacity-80 transition-colors">
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2.5">
                            <div>
                              <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-base font-bold">{playerPositions.find((p) => p.key === playerPosition)?.label}</p>
                              <p style={{ color: colors.premiumGold }} className="text-[11px] font-semibold uppercase">{regionLabels[roleRegion]}</p>
                            </div>
                            <button onClick={() => setPlayerPosition(null)} style={{ color: '#A9B7C4' }} className="os-focus text-[11px] underline hover:opacity-70">{isEN ? 'Change' : 'Cambia'}</button>
                          </div>
                          {regionRoleExercises[roleRegion]?.[playerPosition] ? (
                            <>
                              <p style={{ color: '#A9B7C4' }} className="text-xs leading-relaxed mb-3">{regionRoleExercises[roleRegion][playerPosition].why}</p>
                              <div className="space-y-2">
                                {regionRoleExercises[roleRegion][playerPosition].exercises.map((ex, i) => (
                                  <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} className="flex items-start gap-2.5 rounded-lg p-2.5">
                                    <div style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</div>
                                    <p style={{ color: '#EEF3F8' }} className="text-sm leading-snug">{ex}</p>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <p style={{ color: '#A9B7C4' }} className="text-xs leading-relaxed">{isEN ? 'Role-specific training for this area is coming soon.' : 'L\'allenamento per ruolo per questa zona arriva presto.'}</p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
                {!injury ? (
                  <p style={{ color: colors.mutedInk }} className="text-sm text-center py-6 leading-relaxed">{isEN ? 'Select an injury too, to also see your charts and printable summary.' : 'Scegli anche un infortunio per vedere pure i tuoi grafici e il riepilogo stampabile.'}</p>
                ) : (() => {
              const chartData = buildChartData(injuryLog, isEN);
              const feelingLabel = (v) => ({ 3: isEN ? 'Good' : 'Bene', 2: isEN ? 'So-so' : 'Così così', 1: isEN ? 'Bad' : 'Male' }[v] || '');
              const stiffnessLabel = (v) => ({ 3: isEN ? 'None' : 'Nessuna', 2: isEN ? 'A little' : 'Un po\'', 1: isEN ? 'A lot' : 'Tanta' }[v] || '');
              return (
                <>
                  {chartData.length === 0 ? (
                    <p style={{ color: colors.mutedInk }} className="text-sm text-center py-10 leading-relaxed">{isEN ? 'Not enough data yet — log a few daily sessions first, then come back here.' : 'Non ci sono ancora abbastanza dati — registra qualche sessione giornaliera, poi torna qui.'}</p>
                  ) : (
                    <>
                      <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-4 shadow-sm">
                        <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-3">{isEN ? 'How you\'ve been feeling' : 'Come ti sei sentito'}</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.hairline} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.mutedInk }} />
                            <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tickFormatter={feelingLabel} tick={{ fontSize: 11, fill: colors.mutedInk }} width={70} />
                            <Tooltip formatter={feelingLabel} />
                            <Line type="monotone" dataKey="feeling" stroke={colors.accent} strokeWidth={2.5} dot={{ r: 4, fill: colors.accent }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm">
                        <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-3">{isEN ? 'Stiffness trend' : 'Andamento rigidità'}</p>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.hairline} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: colors.mutedInk }} />
                            <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tickFormatter={stiffnessLabel} tick={{ fontSize: 11, fill: colors.mutedInk }} width={70} />
                            <Tooltip formatter={stiffnessLabel} />
                            <Line type="monotone" dataKey="stiffness" stroke={colors.orange} strokeWidth={2.5} dot={{ r: 4, fill: colors.orange }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}

                  <button onClick={() => { trackEvent('premium_print_clicked'); window.print(); }} style={{ backgroundColor: colors.ink, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-medium shadow-sm hover:opacity-90 transition-opacity mb-2">
                    <Share2 size={16} />
                    <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Print / Export PDF' : 'Stampa / Esporta PDF'}</span>
                  </button>
                  <p style={{ color: colors.mutedInk }} className="text-[11px] text-center mb-4">{isEN ? 'Opens your device\'s print dialog — choose "Save as PDF" to download it.' : 'Apre la finestra di stampa del dispositivo — scegli "Salva come PDF" per scaricarlo.'}</p>

                  <div className="os-print-only">
                    <h1>{isEN ? 'Recovery Summary' : 'Riepilogo del percorso'} — OFFSIDE</h1>
                    {(userProfile.age || userProfile.weight || userProfile.height || userProfile.sex || userProfile.level || playerPosition) && (
                      <p>
                        {[
                          userProfile.age && `${isEN ? 'Age' : 'Età'}: ${userProfile.age}`,
                          userProfile.weight && `${isEN ? 'Weight' : 'Peso'}: ${userProfile.weight} kg`,
                          userProfile.height && `${isEN ? 'Height' : 'Altezza'}: ${userProfile.height} cm`,
                          userProfile.sex && `${isEN ? 'Sex' : 'Sesso'}: ${{ m: isEN ? 'Male' : 'Maschio', f: isEN ? 'Female' : 'Femmina', na: '—' }[userProfile.sex]}`,
                          userProfile.level && `${isEN ? 'Level' : 'Livello'}: ${playerLevels.find((l) => l.key === userProfile.level)?.label}`,
                          playerPosition && `${isEN ? 'Position' : 'Ruolo'}: ${playerPositions.find((p) => p.key === playerPosition)?.label}`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p><strong>{isEN ? 'Injury' : 'Infortunio'}:</strong> {injury.label}</p>
                    <p><strong>{isEN ? 'Severity' : 'Gravità'}:</strong> {severityLabels[severity]}</p>
                    {currentDate && <p><strong>{isEN ? 'Started on' : 'Iniziato il'}:</strong> {currentDate} ({isEN ? 'day' : 'giorno'} {dayCount})</p>}
                    <p><strong>{isEN ? 'Current phase' : 'Fase attuale'}:</strong> {phase.name} ({isEN ? 'Phase' : 'Fase'} {activePhase + 1}/{injury.phases.length})</p>
                    <p>{phase.why}</p>
                    {phase.criteriaToAdvance && (
                      <>
                        <p><strong>{isEN ? 'Criteria to advance' : 'Criteri per avanzare'}:</strong></p>
                        <ul>{phase.criteriaToAdvance.map((c, i) => <li key={i}>{c}</li>)}</ul>
                      </>
                    )}
                    <p><strong>{isEN ? 'Exercises in this phase' : 'Esercizi in questa fase'}:</strong></p>
                    <ul>{phase.exercises.map((ex, i) => <li key={i}>{ex.text}</li>)}</ul>
                    {chartData.length > 0 && (
                      <>
                        <p><strong>{isEN ? 'Daily log' : 'Diario giornaliero'}:</strong></p>
                        <table>
                          <thead><tr><th>{isEN ? 'Date' : 'Data'}</th><th>{isEN ? 'Feeling' : 'Feeling'}</th><th>{isEN ? 'Stiffness' : 'Rigidità'}</th></tr></thead>
                          <tbody>
                            {chartData.map((d, i) => (
                              <tr key={i}>
                                <td>{d.date}</td>
                                <td>{d.feeling ? feelingLabel(d.feeling) : '—'}</td>
                                <td>{d.stiffness ? stiffnessLabel(d.stiffness) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
              </>
            )}
          </div>
        )}

        {screen === 'physios' && (
          <div>
            <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed mb-5">
              {isEN ? 'A directory of sports physiotherapists, to make it easier to find real help nearby. This is a simple listing, not a vetted or verified recommendation — always check credentials yourself.' : 'Un elenco di fisioterapisti sportivi, per rendere più facile trovare un aiuto vero vicino a te. È un semplice elenco, non una raccomandazione verificata — controlla sempre tu le credenziali.'}
            </p>

            <div className="relative mb-5">
              <Search size={16} color={colors.mutedInk} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={physioSearch}
                onChange={(e) => setPhysioSearch(e.target.value)}
                placeholder={isEN ? 'Search by city...' : 'Cerca per città...'}
                style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }}
                className="os-focus w-full rounded-xl pl-10 pr-4 py-3 text-sm"
              />
            </div>

            {(() => {
              const filtered = physiosData.filter((p) => !physioSearch.trim() || p.city.toLowerCase().includes(physioSearch.trim().toLowerCase()));
              if (physiosData.length === 0) {
                return (
                  <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-2xl p-6 text-center shadow-sm">
                    <div style={{ backgroundColor: colors.accentTint }} className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Stethoscope size={26} color={colors.accentDark} />
                    </div>
                    <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: colors.ink }} className="text-base font-bold mb-2">{isEN ? 'Coming soon' : 'Arriva presto'}</p>
                    <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed">{isEN ? 'We\'re building this list one physiotherapist at a time. Check back soon.' : 'Stiamo costruendo questo elenco un fisioterapista alla volta. Torna a trovarci presto.'}</p>
                  </div>
                );
              }
              if (filtered.length === 0) {
                return (
                  <p style={{ color: colors.mutedInk }} className="text-sm text-center py-8">{isEN ? 'No physiotherapists found for this city yet.' : 'Nessun fisioterapista trovato per questa città, per ora.'}</p>
                );
              }
              return (
                <div className="space-y-3">
                  {filtered.map((p) => {
                    const href = p.contactType === 'instagram' ? `https://instagram.com/${p.contactValue.replace('@', '')}` : p.contactType === 'email' ? `mailto:${p.contactValue}` : p.contactType === 'phone' ? `tel:${p.contactValue}` : p.contactValue;
                    const ContactIcon = p.contactType === 'email' ? Mail : p.contactType === 'phone' ? Phone : ExternalLink;
                    return (
                      <div key={p.id} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 shadow-sm">
                        <div className="flex items-start gap-3 mb-2.5">
                          <div style={{ backgroundColor: colors.accentTint }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center">
                            <Stethoscope size={20} color={colors.accentDark} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: colors.ink }} className="text-sm font-bold">{p.name}</p>
                            <p style={{ color: colors.mutedInk }} className="text-xs flex items-center gap-1"><MapPin size={11} />{p.city}</p>
                          </div>
                        </div>
                        <span style={{ backgroundColor: colors.paper, color: colors.ink }} className="text-xs font-medium px-2.5 py-1 rounded-full inline-block mb-2.5">{p.specialization}</span>
                        {p.bio && <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed mb-3">{p.bio}</p>}
                        <a
                          href={href}
                          target={p.contactType === 'instagram' || p.contactType === 'website' ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          style={{ backgroundColor: colors.accent, color: '#FFFFFF' }}
                          className="os-focus w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          <ContactIcon size={13} />{isEN ? 'Contact' : 'Contatta'}
                        </a>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <a href="mailto:manuelegusella@icloud.com?subject=Fisioterapista%20-%20Offside" style={{ color: colors.accentDark, borderTop: `1px solid ${colors.hairline}` }} className="os-focus flex items-center justify-center gap-1.5 mt-6 pt-4 text-xs font-medium hover:underline">
              <Stethoscope size={13} />{isEN ? 'Are you a sports physiotherapist? Get in touch to be listed' : 'Sei un fisioterapista sportivo? Scrivimi per essere inserito'}
            </a>
          </div>
        )}

        {screen === 'profile' && (
          <div>
            <p style={{ color: colors.mutedInk }} className="text-sm mb-6 leading-relaxed">
              {isEN ? 'Optional — helps make the app feel a bit more yours, and gets added to your printable summary for a professional. Stays only on this device.' : 'Facoltativo — aiuta a rendere l\'app un po\' più tua, e viene aggiunto al riepilogo stampabile per un professionista. Resta solo su questo dispositivo.'}
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div>
                <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">{isEN ? 'Age' : 'Età'}</label>
                <input type="number" inputMode="numeric" min="5" max="99" value={userProfile.age} onChange={(e) => { const next = { ...userProfile, age: e.target.value }; setUserProfile(next); persist(snapshot({ userProfile: next })); }} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-2.5 py-2.5 text-sm text-center" placeholder="—" />
              </div>
              <div>
                <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">{isEN ? 'Weight (kg)' : 'Peso (kg)'}</label>
                <input type="number" inputMode="numeric" min="20" max="200" value={userProfile.weight} onChange={(e) => { const next = { ...userProfile, weight: e.target.value }; setUserProfile(next); persist(snapshot({ userProfile: next })); }} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-2.5 py-2.5 text-sm text-center" placeholder="—" />
              </div>
              <div>
                <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">{isEN ? 'Height (cm)' : 'Altezza (cm)'}</label>
                <input type="number" inputMode="numeric" min="100" max="220" value={userProfile.height} onChange={(e) => { const next = { ...userProfile, height: e.target.value }; setUserProfile(next); persist(snapshot({ userProfile: next })); }} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-2.5 py-2.5 text-sm text-center" placeholder="—" />
              </div>
            </div>

            <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2.5">{isEN ? 'Sex' : 'Sesso'}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {[{ key: 'm', label: isEN ? 'Male' : 'Maschio' }, { key: 'f', label: isEN ? 'Female' : 'Femmina' }, { key: 'na', label: isEN ? 'Prefer not to say' : 'Preferisco non dire' }].map((opt) => (
                <button key={opt.key} onClick={() => { const next = { ...userProfile, sex: opt.key }; setUserProfile(next); persist(snapshot({ userProfile: next })); }} style={{ backgroundColor: userProfile.sex === opt.key ? colors.accent : colors.card, color: userProfile.sex === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${userProfile.sex === opt.key ? colors.accent : colors.hairline}` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                  {opt.label}
                </button>
              ))}
            </div>

            <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2.5">{isEN ? 'Playing level' : 'Livello di gioco'}</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {playerLevels.map((lvl) => (
                <button key={lvl.key} onClick={() => { const next = { ...userProfile, level: lvl.key }; setUserProfile(next); persist(snapshot({ userProfile: next })); }} style={{ backgroundColor: userProfile.level === lvl.key ? colors.accent : colors.card, color: userProfile.level === lvl.key ? '#FFFFFF' : colors.ink, border: `1px solid ${userProfile.level === lvl.key ? colors.accent : colors.hairline}` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                  {lvl.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-2.5">
              {!premiumUnlocked && <Lock size={12} color={colors.premiumGold} />}
              <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? 'Position' : 'Ruolo'}{!premiumUnlocked ? ' (Premium)' : ''}</p>
            </div>
            {!premiumUnlocked ? (
              <button onClick={() => setScreen('premium')} className="os-focus w-full text-left">
                <div className="relative mb-2">
                  <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }} className="flex flex-wrap gap-2" aria-hidden="true">
                    {playerPositions.map((pos) => (
                      <div key={pos.key} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="px-3 py-1.5 rounded-full text-xs font-medium">{pos.label}</div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
                    <span style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">{isEN ? 'Unlock' : 'Sblocca'}</span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex flex-wrap gap-2 mb-2">
                {playerPositions.map((pos) => (
                  <button key={pos.key} onClick={() => { setPlayerPosition(pos.key); persist(snapshot({ playerPosition: pos.key })); }} style={{ backgroundColor: playerPosition === pos.key ? colors.accent : colors.card, color: playerPosition === pos.key ? '#FFFFFF' : colors.ink, border: `1px solid ${playerPosition === pos.key ? colors.accent : colors.hairline}` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                    {pos.label}
                  </button>
                ))}
              </div>
            )}
            <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed">{isEN ? 'Used for role-specific training in Premium, and for return-to-play tips in your recovery.' : 'Usato per l\'allenamento per ruolo in Premium, e per i consigli sul rientro nel tuo percorso.'}</p>
          </div>
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

            <PremiumBanner onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} text={isEN ? 'When you\'re ready to return, Premium has the right training for your role' : 'Quando sarai pronto a tornare in campo, Premium ha l\'allenamento giusto per il tuo ruolo'} />
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
                <div key={key} style={{ backgroundColor: colors.card, border: `1.5px solid ${matches ? colors.accent : colors.hairline}` }} className="rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <button onClick={() => chooseInjury(key)} className="os-focus w-full flex items-center gap-4 px-4 py-4.5 text-left">
                    <div style={{ backgroundColor: colors.accentTint, border: `1.5px solid ${colors.accent}40` }} className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"><Icon size={24} color={colors.accentDark} strokeWidth={2} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.01em' }} className="text-base font-semibold uppercase">{data.label}</p>
                        {matches && <span style={{ backgroundColor: colors.accentTint, color: colors.accentDark }} className="text-[10px] px-2 py-0.5 rounded-full font-medium">Probabilmente questo</span>}
                      </div>
                      <p style={{ color: colors.mutedInk }} className="text-sm mb-1.5">{data.subtitle}{hasProgress ? ' · in corso' : ''}</p>
                      <span style={{ backgroundColor: colors.paper, color: colors.accentDark, border: `1px solid ${colors.accent}30` }} className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full">{data.mechanismTags.map((t) => mechanismLabels[t]).join(' o ')}</span>
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
            <PremiumBanner onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} text={isEN ? 'Premium: training designed for each injury, matched to your role' : 'Premium: allenamento pensato per ogni infortunio, in base al tuo ruolo'} />
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
              <div className="mb-5">
                <SetupSection id="gravita" currentSection={setupSection} onToggle={setSetupSection} icon={Gauge} label={isEN ? 'Severity' : 'Gravità'} badge={<span style={{ color: colors.accentDark, fontWeight: 600 }} className="text-xs mr-1">{severityLabels[severity]}</span>}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <button onClick={() => setShowSeverityInfo(!showSeverityInfo)} style={{ color: colors.mutedInk }} className="os-focus flex items-center gap-1 text-[11px] hover:opacity-70"><Info size={12} />{isEN ? 'What each level means' : 'Cosa significa ogni livello'}</button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    {Object.keys(severityLabels).map((sev) => (
                      <button key={sev} onClick={() => setSeverity(sev)} style={{ backgroundColor: severity === sev ? colors.accent : colors.paper, color: severity === sev ? '#FFFFFF' : colors.ink, border: `1px solid ${severity === sev ? colors.accent : colors.hairline}` }} className="os-focus flex-1 rounded-lg py-2 text-sm font-medium transition-colors">{severityLabels[sev]}</button>
                    ))}
                  </div>
                  {showSeverityInfo && (
                    <div style={{ backgroundColor: colors.paper }} className="rounded-lg p-3 space-y-2 mt-2">
                      {Object.keys(severityLabels).map((sev) => (
                        <p key={sev} style={{ color: colors.mutedInk }} className="text-xs leading-relaxed"><span style={{ color: colors.ink, fontWeight: 600 }}>{severityLabels[sev]}: </span>{severityInfo[sev]}</p>
                      ))}
                    </div>
                  )}
                  {severity === 'severo' && (
                    <div style={{ backgroundColor: colors.redTint }} className="rounded-lg p-3 flex gap-2 mt-3">
                      <AlertTriangle size={15} color={colors.red} className="flex-shrink-0 mt-0.5" />
                      <p style={{ color: colors.red }} className="text-xs leading-relaxed">{isEN ? 'With severe severity, we recommend seeing a professional before starting this plan on your own.' : 'Con gravità severa ti consigliamo di sentire un professionista prima di iniziare da solo questo percorso.'}</p>
                    </div>
                  )}
                </SetupSection>

                <SetupSection id="come" currentSection={setupSection} onToggle={setSetupSection} icon={Zap} label={isEN ? 'How it usually happens' : 'Come succede di solito'}>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {injury.mechanismTags.map((tag) => (
                      <span key={tag} style={{ backgroundColor: colors.accentTint, color: colors.accentDark }} className="text-xs font-medium px-3 py-1.5 rounded-full">{mechanismLabels[tag]}</span>
                    ))}
                  </div>
                  <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed mb-3">{isEN ? 'This reflects how this injury typically occurs, not necessarily your specific case.' : 'Riflette come questo infortunio si presenta tipicamente, non necessariamente il tuo caso specifico.'}</p>
                  <button
                    onClick={() => {
                      const region = regionOfInjury(selectedInjury, injuriesData);
                      setRegionsTab('prevention');
                      setScreen('regions');
                      if (region) { setExpandedPrevention(region); setTimeout(() => scrollToId(`prevention-${region}`), 200); }
                    }}
                    style={{ backgroundColor: colors.preventionTint, color: colors.preventionDark }}
                    className="os-focus w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold hover:opacity-80 transition-opacity"
                  >
                    <ShieldCheck size={14} />{isEN ? 'See how to prevent it next time' : 'Vedi come prevenirlo la prossima volta'}
                  </button>
                </SetupSection>

                <SetupSection id="quando" currentSection={setupSection} onToggle={setSetupSection} icon={Calendar} label={isEN ? 'When it started' : 'Quando è iniziato'} badge={currentDate && <CheckCircle2 size={15} color={colors.accent} className="mr-1" />}>
                  {currentDate && (
                    <div style={{ backgroundColor: colors.accentTint }} className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3">
                      <CheckCircle2 size={15} color={colors.accentDark} className="flex-shrink-0" />
                      <p style={{ color: colors.accentDark }} className="text-xs font-medium">{isEN ? 'Set to' : 'Impostata al'} {currentDate}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {dateChips.map((chip) => {
                      const chipDate = (() => { const d = new Date(); d.setDate(d.getDate() - chip.days); return toISODate(d); })();
                      const isChosen = currentDate === chipDate;
                      return (
                        <button key={chip.label} onClick={() => commitDate(chipDate)} style={{ backgroundColor: isChosen ? colors.accent : colors.accentTint, color: isChosen ? '#FFFFFF' : colors.accentDark, border: `1.5px solid ${isChosen ? colors.accent : 'transparent'}` }} className="os-focus px-3 py-2 rounded-lg text-sm text-center font-medium hover:opacity-80 transition-colors flex items-center justify-center gap-1">
                          {isChosen && <Check size={13} strokeWidth={3} />}{chip.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={pendingDate} className="os-date os-focus text-sm px-3 py-1.5 rounded-lg flex-1" style={{ border: `1px solid ${colors.hairline}`, color: colors.ink }} max={toISODate(new Date())} onChange={(e) => setPendingDate(e.target.value)} />
                    <button onClick={() => pendingDate && commitDate(pendingDate)} disabled={!pendingDate} style={{ backgroundColor: pendingDate ? colors.accent : colors.hairline, color: pendingDate ? '#FFFFFF' : colors.mutedInk }} className="os-focus px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">{isEN ? 'Confirm' : 'Conferma'}</button>
                  </div>
                  <button onClick={skipDate} style={{ color: colors.mutedInk }} className="os-focus text-xs underline hover:opacity-70 mt-2 block">{isEN ? 'I\'d rather not say' : 'Preferisco non specificarla'}</button>
                </SetupSection>

                <SetupSection id="ruolo" currentSection={setupSection} onToggle={setSetupSection} icon={User} label={isEN ? 'Your role' : 'Il tuo ruolo'} gold={!premiumUnlocked} badge={premiumUnlocked && playerPosition && <span style={{ color: colors.accentDark, fontWeight: 600 }} className="text-xs mr-1">{playerPositions.find((p) => p.key === playerPosition)?.label}</span>}>
                  {premiumUnlocked ? (
                    <div className="flex flex-wrap gap-2">
                      {playerPositions.map((pos) => (
                        <button key={pos.key} onClick={() => { setPlayerPosition(pos.key); persist(snapshot({ playerPosition: pos.key })); }} style={{ backgroundColor: playerPosition === pos.key ? colors.accent : colors.paper, color: playerPosition === pos.key ? '#FFFFFF' : colors.ink, border: `1px solid ${playerPosition === pos.key ? colors.accent : colors.hairline}` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }} className="flex flex-wrap gap-2" aria-hidden="true">
                        {playerPositions.map((pos) => (
                          <div key={pos.key} style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="px-3 py-1.5 rounded-full text-xs font-medium">{pos.label}</div>
                        ))}
                      </div>
                      <button onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} className="os-focus absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>
                        <span style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shadow-sm">{isEN ? 'Unlock Premium' : 'Sblocca Premium'}</span>
                      </button>
                    </div>
                  )}
                  <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mt-2.5">{isEN ? 'Training built specifically for your position on the pitch.' : 'Allenamento pensato apposta per il tuo ruolo in campo.'}</p>
                </SetupSection>

                <SetupSection id="grafico" currentSection={setupSection} onToggle={setSetupSection} icon={TrendingUp} label={isEN ? 'Recovery chart' : 'Grafico del percorso'} gold={!premiumUnlocked}>
                  {premiumUnlocked ? (() => {
                    const chartData = buildChartData(injuryLog, isEN);
                    return chartData.length === 0 ? (
                      <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'Log a few daily sessions first, then your chart appears here.' : 'Registra qualche sessione giornaliera, poi il grafico compare qui.'}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={colors.hairline} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.mutedInk }} />
                          <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tick={{ fontSize: 10, fill: colors.mutedInk }} width={60} />
                          <Tooltip />
                          <Line type="monotone" dataKey="feeling" stroke={colors.accent} strokeWidth={2.5} dot={{ r: 3, fill: colors.accent }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    );
                  })() : (
                    <div className="relative">
                      <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }} aria-hidden="true">
                        <div style={{ backgroundColor: colors.paper }} className="rounded-lg p-3">
                          <p style={{ color: colors.ink }} className="text-xs font-medium mb-2">{isEN ? 'Feeling and stiffness, over time' : 'Feeling e rigidità, nel tempo'}</p>
                          <svg width="100%" height="60" viewBox="0 0 200 44" preserveAspectRatio="none">
                            <path d="M0 34 L30 26 L60 30 L90 14 L120 20 L150 8 L180 12 L200 4" stroke={colors.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="30" cy="26" r="2.5" fill={colors.accent} /><circle cx="90" cy="14" r="2.5" fill={colors.accent} /><circle cx="150" cy="8" r="2.5" fill={colors.accent} /><circle cx="200" cy="4" r="2.5" fill={colors.accent} />
                          </svg>
                        </div>
                      </div>
                      <button onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} className="os-focus absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>
                        <span style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shadow-sm">{isEN ? 'Unlock Premium' : 'Sblocca Premium'}</span>
                      </button>
                    </div>
                  )}
                  <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mt-2.5">{isEN ? 'Your real progress over time — useful to track and to share with a professional.' : 'Il tuo vero andamento nel tempo — utile da tracciare e da mostrare a un professionista.'}</p>
                </SetupSection>

                <SetupSection id="recidiva" currentSection={setupSection} onToggle={setSetupSection} icon={RotateCcw} label={isEN ? 'First time?' : 'Prima volta?'} badge={injuryRecurrence[selectedInjury] && <CheckCircle2 size={15} color={colors.accent} className="mr-1" />}>
                  <div className="flex gap-2 mb-2.5">
                    {[{ key: 'prima', label: isEN ? 'First time' : 'Prima volta' }, { key: 'recidiva', label: isEN ? 'Happened before' : 'Già successo prima' }].map((opt) => (
                      <button key={opt.key} onClick={() => { const next = { ...injuryRecurrence, [selectedInjury]: opt.key }; setInjuryRecurrence(next); persist(snapshot({ injuryRecurrence: next })); }} style={{ backgroundColor: injuryRecurrence[selectedInjury] === opt.key ? colors.accent : colors.paper, color: injuryRecurrence[selectedInjury] === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${injuryRecurrence[selectedInjury] === opt.key ? colors.accent : colors.hairline}` }} className="os-focus flex-1 rounded-lg py-2 text-sm font-medium transition-colors">{opt.label}</button>
                    ))}
                  </div>
                  {injuryRecurrence[selectedInjury] === 'recidiva' && (
                    <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'A repeat injury is worth extra caution on the return-to-play criteria, and a chat with a professional if it keeps happening.' : 'Un infortunio che si ripete merita più attenzione sui criteri di rientro, e magari una parola con un professionista se continua a succedere.'}</p>
                  )}
                </SetupSection>

                <SetupSection id="fasi" currentSection={setupSection} onToggle={setSetupSection} icon={Activity} label={isEN ? 'Phases and progression' : 'Fasi e decorso'}>
                  <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mb-2.5">{isEN ? 'Tap the phase that matches where you actually are — useful if you\'re starting the app partway through recovery.' : 'Tocca la fase che corrisponde a dove sei davvero — utile se inizi a usare l\'app a metà del recupero.'}</p>
                  <div className="space-y-2">
                    {injury.phases.map((p, i) => {
                      const isChosen = i === activePhase;
                      return (
                        <button key={i} onClick={() => changePhase(i)} style={{ backgroundColor: isChosen ? colors.accentTint : colors.paper, border: `1.5px solid ${isChosen ? colors.accent : 'transparent'}` }} className="os-focus w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors">
                          <div style={{ backgroundColor: isChosen ? colors.accent : colors.card, color: isChosen ? '#FFFFFF' : colors.accentDark }} className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">{isChosen ? <Check size={13} strokeWidth={3} /> : i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p style={{ color: colors.ink }} className="text-sm font-medium">{p.name}</p>
                            <p style={{ color: colors.mutedInk }} className="text-[11px] os-tabular">{phaseRangeLabel(i, injury.severityData[severity].dayThresholds, isEN)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SetupSection>

                <SetupSection id="resoconto" currentSection={setupSection} onToggle={setSetupSection} icon={Lock} label={isEN ? 'Full report' : 'Resoconto completo'} gold>
                  {!premiumUnlocked ? (
                    <div className="relative">
                      <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }} className="space-y-1.5" aria-hidden="true">
                        <p style={{ color: colors.ink }} className="text-xs">{isEN ? 'Injury' : 'Infortunio'}: {injury.label}</p>
                        <p style={{ color: colors.ink }} className="text-xs">{isEN ? 'Severity' : 'Gravità'}: {severityLabels[severity]}</p>
                        <p style={{ color: colors.ink }} className="text-xs">{isEN ? 'Full phase breakdown, printable' : 'Scomposizione completa delle fasi, stampabile'}</p>
                      </div>
                      <button onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} className="os-focus absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.55)' }}>
                        <span style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shadow-sm">{isEN ? 'Unlock' : 'Sblocca'}</span>
                      </button>
                    </div>
                  ) : (
                    <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'Find your full printable summary (with charts and role-specific training) in the Percorso tab, once you start tracking.' : 'Trovi il riepilogo completo stampabile (con grafici e allenamento per ruolo) nella scheda Percorso, una volta iniziato a tracciare.'}</p>
                  )}
                </SetupSection>

                <button onClick={skipDate} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-medium shadow-sm hover:opacity-90 transition-opacity mt-2">
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif" }} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Go to my recovery' : 'Vai al mio percorso'}</span><ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: 'linear-gradient(135deg, #1D3348, #101B26)' }} className="rounded-xl p-4 mb-3 shadow-sm relative">
                  <button onClick={() => setEditingSetup(true)} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} className="os-focus absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors" aria-label={isEN ? 'Edit severity, date and more' : 'Modifica gravità, data e altro'}>
                    <Pencil size={13} color={colors.accent} />
                  </button>
                  <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.12em' }} className="text-[10px] font-bold uppercase mb-1">{isEN ? `Phase ${activePhase + 1} of ${injury.phases.length}` : `Fase ${activePhase + 1} di ${injury.phases.length}`}</p>
                  <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-xl font-bold uppercase mb-1.5">{phase.name}</p>
                  <p style={{ color: '#A9B7C4' }} className="text-sm">{phaseRangeLabel(activePhase, dayThresholds, isEN)} · {isEN ? 'severity' : 'gravità'} {severityLabels[severity].toLowerCase()}{premiumUnlocked && playerPosition && ` · ${playerPositions.find((p) => p.key === playerPosition)?.label}`}</p>
                  {currentDate && (
                    <div className="flex gap-1 relative pt-3">
                      {segments.map((seg, i) => (
                        <div key={i} className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)', flexGrow: seg.span, flexBasis: 0 }}>
                          <div className="os-fill absolute inset-y-0 left-0 rounded-full" style={{ width: `${seg.fill}%`, backgroundColor: colors.accent }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: todayEntry.done ? colors.accentDark : colors.card, border: `1px solid ${todayEntry.done ? colors.accentDark : colors.hairline}` }} className="rounded-xl p-3.5 mb-5 shadow-sm transition-colors">
                  {!currentDate ? (
                    <button onClick={() => setEditingSetup(true)} className="os-focus w-full flex items-center justify-between gap-2">
                      <span style={{ color: colors.accentDark, fontWeight: 500 }} className="text-sm">{isEN ? 'Add a date to start tracking daily sessions' : 'Aggiungi una data per iniziare a tracciare le sessioni'}</span>
                      <ChevronRight size={16} color={colors.accentDark} />
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ ...displayFont, color: todayEntry.done ? '#FFFFFF' : colors.ink }} className="text-sm font-semibold capitalize">{isEN ? 'Day' : 'Giorno'} {dayCount} · {formatTodayLabel(isEN)}</span>
                        {streak.count > 0 && (
                          <span style={{ ...displayFont, color: todayEntry.done ? '#FFD9A0' : colors.orange }} className="flex items-center gap-1 text-sm font-bold os-tabular">
                            <Flame size={14} strokeWidth={2.5} />{streak.count}
                          </span>
                        )}
                      </div>
                      {streak.graceUsed && (
                        <p style={{ color: todayEntry.done ? '#C9D8E5' : colors.mutedInk }} className="text-[11px] mb-2 -mt-1">❄️ {isEN ? 'A missed day doesn\'t break your streak — picked up right where you left off.' : 'Un giorno saltato non rompe la serie — ripresa da dove l\'avevi lasciata.'}</p>
                      )}
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span style={{ color: todayEntry.done ? '#C9D8E5' : colors.mutedInk }} className="text-[11px] font-medium flex-shrink-0 w-14">{isEN ? 'Feeling' : 'Come va'}</span>
                        <div className="flex gap-1 flex-1">
                          {feelingOptions.map((opt) => (
                            <button key={opt.key} onClick={() => setTodayFeeling(opt.key)} style={{ backgroundColor: todayEntry.feeling === opt.key ? colors.accent : (todayEntry.done ? 'rgba(255,255,255,0.1)' : colors.paper), color: todayEntry.feeling === opt.key ? '#FFFFFF' : (todayEntry.done ? '#D7E1EA' : colors.ink) }} className="os-focus flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors">
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <span style={{ color: todayEntry.done ? '#C9D8E5' : colors.mutedInk }} className="text-[11px] font-medium flex-shrink-0 w-14">{isEN ? 'Stiffness' : 'Rigidità'}</span>
                        <div className="flex gap-1 flex-1">
                          {stiffnessOptions.map((opt) => (
                            <button key={opt.key} onClick={() => setTodayStiffness(opt.key)} style={{ backgroundColor: todayEntry.stiffness === opt.key ? colors.orange : (todayEntry.done ? 'rgba(255,255,255,0.1)' : colors.paper), color: todayEntry.stiffness === opt.key ? '#FFFFFF' : (todayEntry.done ? '#D7E1EA' : colors.ink) }} className="os-focus flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors">
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {todayEntry.feeling === 'male' && (
                        <p style={{ color: todayEntry.done ? '#FFD0CC' : colors.red }} className="text-[11px] mb-2.5 leading-relaxed">
                          {isEN ? 'Take it easy today — review the warning signs above if the pain feels different than usual.' : 'Vacci piano oggi — rivedi i segnali d\'allarme in alto se il dolore ti sembra diverso dal solito.'}
                        </p>
                      )}

                      <button
                        onClick={toggleToday}
                        style={{ backgroundColor: todayEntry.done ? 'rgba(255,255,255,0.15)' : colors.accentTint, color: todayEntry.done ? '#FFFFFF' : colors.accentDark, border: todayEntry.done ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                        className="os-focus w-full flex items-center justify-center gap-2 rounded-lg py-2.5 transition-all hover:opacity-90"
                      >
                        {todayEntry.done ? <CheckCircle2 size={16} strokeWidth={2.25} /> : <Circle size={16} strokeWidth={1.75} />}
                        <span style={displayFont} className="text-xs font-semibold uppercase tracking-wide">
                          {todayEntry.done ? (isEN ? 'Today\'s session completed' : 'Sessione di oggi completata') : (isEN ? 'Mark today\'s session as done' : 'Segna sessione di oggi come fatta')}
                        </span>
                      </button>

                      <button
                        onClick={() => { trackEvent('calendar_reminders_downloaded'); downloadRecoveryReminders(isEN); }}
                        style={{ color: todayEntry.done ? '#C9D8E5' : colors.mutedInk }}
                        className="os-focus w-full flex items-center justify-center gap-1.5 pt-2.5 text-[11px] font-medium hover:opacity-70 transition-opacity"
                      >
                        <CalendarPlus size={12} />{isEN ? 'Add daily reminders to your calendar' : 'Aggiungi promemoria giornalieri al calendario'}
                      </button>
                    </>
                  )}
                </div>

                <p style={{ ...displayFont, color: colors.mutedInk, letterSpacing: '0.08em' }} className="text-[11px] font-semibold uppercase mb-2">{isEN ? 'Phase' : 'Fase'}</p>
                <div className="flex items-stretch gap-1.5 mb-5">
                  {injury.phases.map((p, i) => {
                    const isActive = i === activePhase;
                    const pKey = `${selectedInjury}-${i}`;
                    const pProgress = progress[pKey] || {};
                    const pDone = p.exercises.length > 0 && p.exercises.filter((_, ei) => pProgress[ei]).length === p.exercises.length;
                    return (
                      <button key={i} onClick={() => changePhase(i)} style={{ backgroundColor: isActive ? colors.accent : colors.card, border: `1px solid ${isActive ? colors.accent : colors.hairline}`, color: isActive ? '#FFFFFF' : colors.mutedInk }} className="os-focus flex-1 flex flex-col items-center justify-center gap-0.5 rounded-lg py-2 transition-colors shadow-sm">
                        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide">{isEN ? `Phase ${i + 1}` : `Fase ${i + 1}`}{pDone && <CheckCircle2 size={12} strokeWidth={2.5} />}</span>
                        <span style={{ color: isActive ? 'rgba(255,255,255,0.85)' : colors.mutedInk }} className="text-[10px] font-normal normal-case os-tabular">{phaseRangeLabel(i, dayThresholds, isEN)}</span>
                      </button>
                    );
                  })}
                </div>

                <SetupSection id="perche" currentSection={trackerSection} onToggle={setTrackerSection} icon={Info} label={isEN ? 'Why this phase' : 'Perché questa fase'}>
                  <p style={{ color: colors.ink }} className="text-sm leading-relaxed">{phase.why}</p>
                </SetupSection>

                {phase.criteriaToAdvance && (() => {
                  const pKey = `${selectedInjury}-${activePhase}`;
                  const checkedForPhase = criteriaChecked[pKey] || {};
                  const checkedCount = phase.criteriaToAdvance.filter((_, i) => checkedForPhase[i]).length;
                  const allChecked = checkedCount === phase.criteriaToAdvance.length;
                  const isLastPhase = activePhase === injury.phases.length - 1;
                  return (
                    <SetupSection id="criteri" currentSection={trackerSection} onToggle={setTrackerSection} icon={ClipboardCheck} label={isEN ? 'Ready to advance?' : 'Pronto ad avanzare?'} badge={<span style={{ color: allChecked ? colors.accent : colors.mutedInk, fontWeight: 600 }} className="text-xs mr-1 os-tabular">{checkedCount}/{phase.criteriaToAdvance.length}</span>}>
                      <div className="space-y-2 mb-1">
                        {phase.criteriaToAdvance.map((c, i) => {
                          const checked = !!checkedForPhase[i];
                          return (
                            <button key={i} onClick={() => toggleCriterion(i)} className="os-focus w-full flex items-start gap-2.5 text-left">
                              <div style={{ backgroundColor: checked ? colors.accent : colors.paper, border: `1.5px solid ${checked ? colors.accent : colors.hairline}` }} className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5 transition-colors">
                                {checked && <Check size={12} strokeWidth={3} color="#FFFFFF" />}
                              </div>
                              <span style={{ color: colors.ink, textDecoration: checked ? 'line-through' : 'none' }} className="text-sm leading-snug">{c}</span>
                            </button>
                          );
                        })}
                      </div>
                      {allChecked ? (
                        <div style={{ backgroundColor: colors.accentTint, borderTop: `1px solid ${colors.hairline}` }} className="rounded-lg p-3 mt-3">
                          <p style={{ color: colors.accentDark, fontWeight: 600 }} className="text-sm mb-2.5">{isEN ? 'Looks like you\'re ready.' : 'Sembra che tu sia pronto.'}</p>
                          {!isLastPhase && (
                            <button onClick={() => changePhase(activePhase + 1)} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-opacity">
                              {isEN ? 'Move to the next phase' : 'Passa alla fase successiva'}<ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <p style={{ color: colors.mutedInk, fontWeight: 500 }} className="text-xs mt-2">{isEN ? 'A self-check, not a clinical test.' : 'Un autocontrollo, non un test clinico.'}</p>
                      )}
                      {userProfile.level && (() => {
                        const levelNotes = {
                          giovanili: isEN ? 'At youth level, it\'s worth involving a coach or parent in this decision too, not just yourself.' : 'A livello giovanile, vale la pena coinvolgere anche un allenatore o un genitore in questa decisione, non solo te stesso.',
                          amatoriale: isEN ? 'Amateur football usually means less outside pressure to rush back — use that time, don\'t force it.' : 'Il calcio amatoriale di solito vuol dire meno pressione esterna per rientrare — usa questo tempo, non forzarlo.',
                          dilettanti: isEN ? 'Even at a competitive level, healing follows its own timeline — the criteria above matter more than the calendar.' : 'Anche a livello dilettantistico serio, la guarigione segue i suoi tempi — i criteri qui sopra contano più del calendario.',
                          semipro: isEN ? 'At this level the pressure to return quickly is real — but your body heals on the same timeline regardless of category.' : 'A questo livello la pressione a rientrare presto è reale — ma il corpo guarisce secondo gli stessi tempi, a prescindere dalla categoria.',
                        };
                        return (
                          <p style={{ color: colors.mutedInk, borderTop: `1px solid ${colors.hairline}` }} className="text-xs leading-relaxed mt-3 pt-3 flex gap-2">
                            <span style={{ color: colors.accentDark }} className="flex-shrink-0">—</span>
                            <span>{levelNotes[userProfile.level]}</span>
                          </p>
                        );
                      })()}
                    </SetupSection>
                  );
                })()}

                {activePhase === injury.phases.length - 1 && (
                  <SetupSection id="ruolo-percorso" currentSection={trackerSection} onToggle={setTrackerSection} icon={User} label={isEN ? 'What position do you play?' : 'Che ruolo giochi?'} gold={!premiumUnlocked} badge={premiumUnlocked && playerPosition && <span style={{ color: colors.accentDark, fontWeight: 600 }} className="text-xs mr-1">{playerPositions.find((p) => p.key === playerPosition)?.label}</span>}>
                    {!premiumUnlocked ? (
                      <>
                        <div className="relative mb-1">
                          <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }} className="flex flex-wrap gap-2" aria-hidden="true">
                            {playerPositions.map((pos) => (
                              <div key={pos.key} style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="px-3 py-1.5 rounded-full text-xs font-medium">{pos.label}</div>
                            ))}
                          </div>
                          <button onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} className="os-focus absolute inset-0 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
                            <span style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">{isEN ? 'Unlock' : 'Sblocca'}</span>
                          </button>
                        </div>
                        <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed">{isEN ? 'Get a return-to-play tip built for your exact position.' : 'Ricevi un consiglio sul rientro pensato per il tuo ruolo esatto.'}</p>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </SetupSection>
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
                        <button
                          onClick={() => {
                            const region = regionOfInjury(selectedInjury, injuriesData);
                            setRegionsTab('prevention');
                            setScreen('regions');
                            if (region) { setExpandedPrevention(region); setTimeout(() => scrollToId(`prevention-${region}`), 200); }
                          }}
                          style={{ color: colors.accent }}
                          className="os-focus block mx-auto mt-3 text-xs font-medium underline hover:opacity-70"
                        >
                          {isEN ? 'Don\'t let it happen again — see prevention exercises for this area' : 'Non farlo ripetere — vedi gli esercizi di prevenzione per questa zona'}
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

                <SetupSection id="esercizi" currentSection={trackerSection} onToggle={setTrackerSection} icon={Dumbbell} label={isEN ? 'Exercises' : 'Esercizi'} badge={<span style={{ ...displayFont, color: colors.accentDark }} className="os-tabular text-sm font-bold mr-1">{completedCount}<span style={{ color: colors.mutedInk }} className="text-xs font-normal"> /{phase.exercises.length}</span></span>}>
                  <p style={{ color: colors.mutedInk }} className="text-[11px] mb-3">{isEN ? 'Adjust them to how your body responds, don\'t push through sharp pain.' : 'Adattali a come risponde il tuo corpo, non forzare sul dolore acuto.'}</p>
                  <div>
                  {phase.exercises.map((ex, i) => {
                    const done = !!phaseProgress[i];
                    const exKey = `${activePhase}-${i}`;
                    const isVideoOpen = activeVideo === exKey;
                    const CatIcon = catIcons[ex.cat] || Circle;

                    return (
                      <div key={i} style={{ backgroundColor: done ? colors.accentTint : colors.card, border: `1px solid ${done ? colors.accent + '55' : colors.hairline}` }} className="rounded-xl overflow-hidden shadow-sm mb-2.5 transition-colors">
                        <div className="flex items-start gap-3 p-3.5">
                          <button onClick={() => toggleExercise(i)} style={{ backgroundColor: done ? colors.accent : colors.paper, border: `2px solid ${done ? colors.accent : colors.hairline}` }} className="os-focus w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                            {done ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : <span style={{ ...displayFont, color: colors.mutedInk }} className="text-xs font-bold">{i + 1}</span>}
                          </button>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <button onClick={() => toggleExercise(i)} className="os-focus text-left w-full">
                              <span style={{ color: done ? colors.accentDark : colors.ink, textDecoration: done ? 'line-through' : 'none', textDecorationColor: colors.accent + '99' }} className="text-sm leading-snug block mb-1.5">{ex.text}</span>
                            </button>
                            <span style={{ backgroundColor: done ? 'rgba(255,255,255,0.6)' : colors.paper, color: colors.ink, fontWeight: 600 }} className="text-[11px] px-1.5 py-0.5 rounded inline-flex items-center gap-1"><CatIcon size={10} />{catLabels[ex.cat]}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveVideo(isVideoOpen ? null : exKey)}
                          style={{ color: colors.accentDark, borderTop: `1px solid ${done ? colors.accent + '30' : colors.hairline}` }}
                          className="os-focus w-full flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold hover:opacity-70 transition-opacity"
                        >
                          <ChevronDown size={11} style={{ transform: isVideoOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                          {isEN ? 'How do I do this?' : 'Come si fa?'}
                        </button>

                        {isVideoOpen && (
                          <div className="px-3.5 pb-3.5 os-fadein">
                            <ExerciseHelp ex={ex} isEN={isEN} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </SetupSection>

                <PremiumBanner onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} text={isEN ? 'Premium: your progress over time + a document for your physio' : 'Premium: il tuo andamento nel tempo + un documento per il fisio'} />

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
      </div>

      <div style={{ borderTop: `1px solid ${colors.hairline}`, color: colors.mutedInk }} className="px-5 sm:px-8 py-4 pb-24 text-xs leading-relaxed text-center">
        {isEN ? 'General informational content. Not a substitute for a medical assessment. If in doubt, see a professional.' : 'Contenuto informativo generale. Non sostituisce una valutazione medica. In caso di dubbi rivolgiti a un professionista.'}
        {saveError && <div style={{ color: colors.red }} className="mt-2 flex items-center justify-center gap-1.5"><X size={13} /> {isEN ? 'Data could not be saved.' : 'Salvataggio dati non riuscito.'}</div>}
        <a href="mailto:manuelegusella@icloud.com?subject=Feedback%20Offside" style={{ color: colors.accentDark }} className="os-focus flex items-center justify-center gap-1.5 mt-3 hover:underline">
          <Share2 size={11} />{isEN ? 'Found a problem or have a suggestion? Let me know' : 'Hai trovato un problema o hai un suggerimento? Scrivimelo'}
        </a>
      </div>

      <BottomNav screen={screen} isEN={isEN} onNavigate={handleBottomNav} />
    </div>
  );
}