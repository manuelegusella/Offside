import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Footprints, Zap, CircleDot, Activity, ArrowLeftRight, Shield, Anchor,
  ShieldCheck, Disc, TrendingUp, Compass, AlertTriangle, CheckCircle2,
  Circle, ChevronRight, ChevronDown, ArrowLeft, ArrowRight, Info, RotateCcw, X,
  Calendar, Scale, Dumbbell, Move, Wind, Timer, Pause, Pencil, Target,
  HelpCircle, PlayCircle, Flame, Share2, ClipboardCheck, Check, Gauge, Waves,
  Aperture, PersonStanding, Ruler, Sprout, RotateCw, CircleDashed, ShieldAlert,
  Snowflake, Bandage, ArrowUp,
} from 'lucide-react';

const colors = {
  paper: '#EEF3F8', card: '#FFFFFF', hairline: '#D7E1EA', ink: '#101B26',
  mutedInk: '#57697A', accent: '#1B6FC9', accentTint: '#DCEAF9', accentDark: '#0F4A82',
  red: '#AE3830', redTint: '#F6DEDB', laneBg: '#DFE7EF', orange: '#C96A22',
};

const STORAGE_KEY = 'injury-recovery-progress-v3';

const catIcons = { balance: Scale, strength: Dumbbell, stretch: Move, run: Wind, hold: Timer, rest: Pause };
const catLabels = { balance: 'Equilibrio', strength: 'Rinforzo', stretch: 'Mobilità', run: 'Corsa/agilità', hold: 'Tenuta isometrica', rest: 'Scarico' };

const severityLabels = { lieve: 'Lieve', moderato: 'Moderato', severo: 'Severo' };
const severityInfo = {
  lieve: 'Dolore lieve, riesci a muoverti e camminare quasi normalmente. Gonfiore minimo o assente.',
  moderato: 'Dolore evidente, difficoltà a muoverti liberamente nei primi giorni. Gonfiore visibile.',
  severo: 'Dolore intenso, molta difficoltà o impossibilità a muoverti o appoggiare il peso. Gonfiore importante. Consigliata una valutazione professionale prima di iniziare da soli.',
};

const feelingOptions = [
  { key: 'bene', label: 'Bene' },
  { key: 'cosi', label: 'Così così' },
  { key: 'male', label: 'Male' },
];

// Tempistiche verificate su fonti ortopediche/fisioterapiche (ago 2026).
// I criteri di avanzamento sono un autocontrollo orientativo, non un test
// clinico. Alcuni infortuni hanno "specialRedFlags" aggiuntivi, mostrati
// insieme ai segnali generali quando quell'infortunio è selezionato.
const injuriesData = {
  ankle: {
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
          { text: 'Rinforzo con elastico in tutte le direzioni (2-3 serie da 12-15 per direzione, come punto di partenza)', cat: 'strength' },
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
      { name: 'Rinforzo progressivo', why: 'Il rinforzo eccentrico (allungamento del tendine sotto carico) ha più evidenza scientifica per i tendini, ma va introdotto con gradualità — i tendini si adattano molto più lentamente dei muscoli.',
        criteriaToAdvance: ['Riesci a camminare normalmente senza dolore a riposo', 'Il dolore nelle attività quotidiane resta lieve (non peggiora nel tempo)'],
        exercises: [
          { text: 'Calf raises eccentrici: sali su due gambe, scendi lentamente su una sola (3 serie da 10-15, come punto di partenza)', cat: 'strength' },
          { text: 'Aumenta gradualmente carico e ripetizioni settimana dopo settimana', cat: 'strength' },
          { text: 'Stretching dolce del polpaccio, senza forzare', cat: 'stretch' },
        ] },
      { name: 'Ritorno allo sport', why: 'Anche senza dolore, il tendine potrebbe non essere ancora pronto per sprint e salti ripetuti: qui più che altrove vale la regola di non affrettare.',
        criteriaToAdvance: ['Riesci a fare calf raises su due gambe senza dolore significativo', 'Il dolore il giorno dopo l\'allenamento non peggiora rispetto al giorno prima'],
        exercises: [
          { text: 'Corsa progressiva, aumentando distanza e intensità con calma', cat: 'run' },
          { text: 'Salti e cambi di direzione introdotti per ultimi', cat: 'strength' },
          { text: 'Torna agli allenamenti completi solo se stabile senza dolore da 1-2 settimane', cat: 'run' },
        ] },
    ],
  },
  knee: {
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
      { name: 'Rinforzo progressivo', why: 'Il rinforzo di quadricipite E anca/gluteo è centrale — spesso l\'anca viene trascurata ma è molto rilevante. Quanto più a lungo il dolore è presente prima di iniziare, tanto più lungo tende a essere il recupero.',
        criteriaToAdvance: ['Riesci a salire/scendere le scale con dolore lieve o assente', 'Lo squat isometrico a parete non scatena dolore acuto'],
        exercises: [
          { text: 'Squat controllati, aumenta gradualmente la profondità (2-3 serie da 10-12, come punto di partenza)', cat: 'strength' },
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
    label: 'Distorsione collaterale mediale', subtitle: 'Legamento interno del ginocchio', icon: ShieldCheck, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [5, 10], totalEstimateDays: 21 },
      moderato: { dayThresholds: [10, 21], totalEstimateDays: 35 },
      severo: { dayThresholds: [21, 42], totalEstimateDays: 84 },
    },
    phases: [
      { name: 'Protezione', why: 'Il legamento collaterale mediale stabilizza il ginocchio nei movimenti laterali, tipici dei contrasti. Nei primi giorni serve proteggerlo da stress laterali. Buona notizia: rispetto ad altri legamenti, guarisce relativamente bene anche nei casi più seri.',
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
    label: 'Bandelletta ileotibiale', subtitle: 'Dolore laterale al ginocchio, da sovraccarico', icon: Ruler, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 77 },
      severo: { dayThresholds: [30, 70], totalEstimateDays: 160 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'La bandelletta ileotibiale scorre lungo il lato esterno della coscia fino al ginocchio: il dolore da sovraccarico peggiora con la corsa ripetuta, specialmente in discesa. Ridurre temporaneamente il volume aiuta a calmare l\'irritazione.',
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
    label: 'Osgood-Schlatter', subtitle: 'Dolore sotto il ginocchio, tipico in età di crescita', icon: Sprout, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [14, 28], totalEstimateDays: 56 },
      moderato: { dayThresholds: [21, 49], totalEstimateDays: 98 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Osgood-Schlatter è un\'infiammazione del punto in cui il tendine rotuleo si attacca alla tibia, tipica durante la crescita, causata da sovraccarico ripetuto (salti, sprint). Non è una lesione grave, ma richiede gestione del carico più che riposo assoluto.',
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
      { name: 'Gestione del rientro', why: 'Osgood-Schlatter tende ad avere alti e bassi durante la crescita: l\'obiettivo realistico è gestire i sintomi durante lo sport, non eliminarli del tutto finché la crescita non è completa.',
        criteriaToAdvance: ['Riesci ad allenarti senza dolore che peggiora nei giorni successivi', 'Il dolore non compare più a riposo'],
        exercises: [
          { text: 'Corsa e salti reintrodotti gradualmente, monitorando la risposta il giorno dopo', cat: 'run' },
          { text: 'Riduci temporaneamente l\'attività nei periodi di dolore più acuto, anche a percorso avanzato', cat: 'rest' },
          { text: 'Parlane con un fisioterapista se il dolore limita spesso l\'attività: esistono strategie specifiche per l\'età di crescita', cat: 'rest' },
        ] },
    ],
  },
  hamstring: {
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
      { name: 'Recupero attivo', why: 'Si reintroduce gradualmente carico e allungamento controllato. Gli hamstring hanno il tasso di recidiva più alto tra tutti gli strappi muscolari se il rientro è troppo affrettato.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare', 'L\'isometria leggera non scatena dolore acuto'],
        exercises: [
          { text: 'Nordic curl assistito, range limitato all\'inizio (2-3 serie da 5-6, come punto di partenza)', cat: 'strength' },
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
          { text: 'Rinforzo leggero quando il dolore lo permette (2 serie da 12-15, solo se indolore)', cat: 'strength' },
          { text: 'Stretching gentile, mai forzato', cat: 'stretch' },
        ] },
      { name: 'Rientro in campo', why: 'Le contusioni importanti alla coscia hanno un rischio di miosite ossificante se il rientro è troppo affrettato: un motivo in più per non accelerare, specialmente nei casi più gonfi/dolorosi.',
        criteriaToAdvance: ['Riesci a fare stretching gentile della zona senza dolore acuto', 'La forza sta tornando, anche se non ancora completa'],
        exercises: [
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Contatti leggeri e controllati prima del rientro in allenamento di gruppo', cat: 'run' },
        ] },
    ],
  },
  calf: {
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
    label: 'Sindrome del piriforme', subtitle: 'Dolore al gluteo che può scendere lungo la gamba', icon: RotateCw, mechanismTags: ['acute', 'overuse'],
    severityData: {
      lieve: { dayThresholds: [7, 21], totalEstimateDays: 42 },
      moderato: { dayThresholds: [14, 35], totalEstimateDays: 70 },
      severo: { dayThresholds: [28, 63], totalEstimateDays: 150 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Il piriforme è un muscolo profondo del gluteo che può irritare il nervo sciatico quando è in tensione, causando dolore che a volte scende lungo la gamba — per questo va distinto da un problema lombare, e spesso serve un occhio esperto per la diagnosi differenziale. Nei primi giorni si riduce ciò che scatena il dolore.',
        exercises: [
          { text: 'Evita di stare seduto a lungo senza pause, specialmente su superfici dure', cat: 'rest' },
          { text: 'Riduci temporaneamente scatti e cambi di direzione se scatenano dolore', cat: 'rest' },
          { text: 'Stretching dolce: da sdraiato, porta il ginocchio verso il petto e verso il lato opposto', cat: 'stretch' },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo dei glutei nel loro complesso aiuta a ridurre il sovraccarico specifico sul piriforme.',
        criteriaToAdvance: ['Riesci a stare seduto per periodi normali senza dolore che peggiora', 'Lo stretching dolce non scatena dolore acuto lungo la gamba'],
        exercises: [
          { text: 'Rinforzo del gluteo medio: clamshell o ponte monopodalico (2-3 serie da 12-15)', cat: 'strength' },
          { text: 'Stretching progressivo del piriforme e dei rotatori dell\'anca', cat: 'stretch' },
          { text: 'Mobilità dell\'anca in tutte le direzioni', cat: 'stretch' },
        ] },
      { name: 'Rientro in campo', why: 'Scatti e cambi di direzione bruschi vanno reintrodotti per ultimi: sono i movimenti che sollecitano di più la rotazione dell\'anca.',
        criteriaToAdvance: ['Riesci a fare scatti e cambi di direzione senza dolore lungo la gamba', 'Nessun dolore residuo dopo attività più intense'],
        exercises: [
          { text: 'Corsa progressiva', cat: 'run' },
          { text: 'Cambi di direzione graduali', cat: 'run' },
          { text: 'Scatti e accelerazioni prima del rientro in gruppo', cat: 'run' },
        ] },
    ],
  },
  piriformis: {
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
  lowback: {
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

const regions = {
  ankle_foot: { label: 'Caviglia e piede', icon: Footprints, injuries: ['ankle', 'achilles', 'plantarfasciitis'] },
  knee: { label: 'Ginocchio', icon: CircleDot, injuries: ['knee', 'mcl', 'lcl', 'patellar', 'meniscus', 'itband', 'osgood'] },
  thigh: { label: 'Coscia', icon: Zap, injuries: ['hamstring', 'quad', 'contusion'] },
  calf_region: { label: 'Gamba e polpaccio', icon: Activity, injuries: ['calf', 'shinsplints'] },
  hip_groin: { label: 'Anca e inguine', icon: ArrowLeftRight, injuries: ['groin', 'hipflexor', 'piriformis', 'trochanteric'] },
  lower_back: { label: 'Zona lombare', icon: PersonStanding, injuries: ['lowback'] },
};

function regionOfInjury(injuryKey) {
  return Object.keys(regions).find((r) => regions[r].injuries.includes(injuryKey)) || null;
}

const redFlags = [
  'Non riesci ad appoggiare il peso sulla gamba nemmeno parzialmente dopo 48–72 ore',
  'Gonfiore importante e immediato, entro pochi minuti dall\'infortunio',
  'Deformità visibile dell\'articolazione',
  'Hai sentito un "pop" forte seguito da instabilità marcata',
  'Intorpidimento, formicolio o cambio di colore della pelle nella zona',
  'Il dolore peggiora nel tempo invece di migliorare gradualmente',
  'Blocco meccanico: non riesci proprio a muovere l\'articolazione in un punto preciso',
];

const riceSteps = [
  { letter: 'R', title: 'Riposo', icon: Pause, text: 'Smetti subito l\'attività. Continuare a giocare sul dolore rischia di peggiorare l\'infortunio.' },
  { letter: 'I', title: 'Ghiaccio', icon: Snowflake, text: 'Applica ghiaccio avvolto in un panno (mai direttamente sulla pelle) per 15-20 minuti, ogni 2-3 ore nelle prime 24-48 ore.' },
  { letter: 'C', title: 'Compressione', icon: Bandage, text: 'Una fascia elastica, non troppo stretta, aiuta a limitare il gonfiore.' },
  { letter: 'E', title: 'Elevazione', icon: ArrowUp, text: 'Tieni la zona sollevata sopra il livello del cuore quando possibile, specialmente nelle prime ore.' },
];

const riceAvoid = [
  'Calore nelle prime 48 ore: può aumentare il gonfiore invece di ridurlo',
  'Massaggi energici o alcol nelle prime ore: favoriscono il gonfiore',
  'Continuare ad allenarti "per vedere se passa"',
];

const dateChips = [
  { label: 'Oggi', days: 0 }, { label: 'Ieri', days: 1 }, { label: '2–3 giorni fa', days: 2 },
  { label: 'Una settimana fa', days: 7 }, { label: '2+ settimane fa', days: 14 },
];

const mechanismOptions = [
  { key: 'contatto', label: 'Contatto con un avversario' },
  { key: 'torsione', label: 'Movimento del corpo (torsione, scatto, salto)' },
  { key: 'sovraccarico', label: 'Iniziato gradualmente, senza un momento preciso' },
];
const popOptions = [{ key: 'si', label: 'Sì' }, { key: 'no', label: 'No' }];
const weightOptions = [
  { key: 'normale', label: 'Sì, normalmente' },
  { key: 'dolore', label: 'Sì, ma con dolore' },
  { key: 'fatica', label: 'A fatica o per niente' },
];

function LogoMark({ size = 32, color = colors.accent, strokeWidth = 3 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M4 20 H14 L18 8 L22 32 L26 20 H36" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const bodyZones = [
  { region: 'lower_back', label: 'Schiena', shape: 'circle', props: { cx: 100, cy: 116, r: 15 } },
  { region: 'hip_groin', label: 'Anca/inguine', shape: 'rect', props: { x: 72, y: 132, width: 56, height: 17, rx: 8.5 } },
  { region: 'thigh', label: 'Coscia sx', shape: 'rect', props: { x: 76, y: 150, width: 20, height: 60, rx: 10 } },
  { region: 'thigh', label: 'Coscia dx', shape: 'rect', props: { x: 104, y: 150, width: 20, height: 60, rx: 10 } },
  { region: 'knee', label: 'Ginocchio sx', shape: 'circle', props: { cx: 86, cy: 216, r: 11 } },
  { region: 'knee', label: 'Ginocchio dx', shape: 'circle', props: { cx: 114, cy: 216, r: 11 } },
  { region: 'calf_region', label: 'Polpaccio sx', shape: 'rect', props: { x: 77, y: 228, width: 18, height: 54, rx: 9 } },
  { region: 'calf_region', label: 'Polpaccio dx', shape: 'rect', props: { x: 105, y: 228, width: 18, height: 54, rx: 9 } },
  { region: 'ankle_foot', label: 'Caviglia sx', shape: 'ellipse', props: { cx: 86, cy: 290, rx: 13, ry: 10 } },
  { region: 'ankle_foot', label: 'Caviglia dx', shape: 'ellipse', props: { cx: 114, cy: 290, rx: 13, ry: 10 } },
];

function BodyDiagram({ onSelectRegion }) {
  const [pressed, setPressed] = useState(null);
  const Shape = { rect: 'rect', circle: 'circle', ellipse: 'ellipse' };
  return (
    <svg viewBox="0 0 200 312" className="w-full mx-auto" style={{ maxWidth: '220px', display: 'block' }} role="img" aria-label="Sagoma del corpo, tocca la zona dove senti dolore">
      {/* Corpo decorativo, non interattivo */}
      <circle cx="100" cy="26" r="19" fill={colors.hairline} />
      <rect x="94" y="43" width="12" height="9" fill={colors.hairline} />
      <rect x="68" y="51" width="64" height="72" rx="20" fill={colors.hairline} />
      <rect x="48" y="55" width="16" height="64" rx="8" fill={colors.hairline} />
      <rect x="136" y="55" width="16" height="64" rx="8" fill={colors.hairline} />

      {bodyZones.map((zone, i) => {
        const isPressed = pressed === i;
        const commonProps = {
          fill: isPressed ? colors.accent : colors.accentTint,
          stroke: colors.accent,
          strokeWidth: 1.3,
          style: { cursor: 'pointer', transition: 'fill 0.12s ease' },
          onClick: () => onSelectRegion(zone.region),
          onMouseDown: () => setPressed(i),
          onMouseUp: () => setPressed(null),
          onMouseLeave: () => setPressed(null),
          onTouchStart: () => setPressed(i),
          onTouchEnd: () => setPressed(null),
          role: 'button',
          'aria-label': zone.label,
          tabIndex: 0,
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') onSelectRegion(zone.region); },
        };
        const ShapeTag = Shape[zone.shape];
        return <ShapeTag key={i} {...zone.props} {...commonProps} />;
      })}
    </svg>
  );
}

function loadFontsOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('os-fonts')) return;
  const link = document.createElement('link');
  link.id = 'os-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap';
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
function phaseRangeLabel(index, thresholds) {
  if (index === 0) return `Giorno 1 – ${thresholds[0]}`;
  if (index === 1) return `Giorno ${thresholds[0] + 1} – ${thresholds[1]}`;
  return `Da giorno ${thresholds[1] + 1}`;
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
function formatTodayLabel() {
  const d = new Date();
  const days = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function Offside() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('cover'); // cover | regions | triage | injuries | tracker
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
  const [shareCopied, setShareCopied] = useState(false);
  const [trackerTab, setTrackerTab] = useState('oggi');
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    loadFontsOnce();
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setSelectedInjury(data.selectedInjury || null);
          setActivePhase(data.activePhase || 0);
          setProgress(data.progress || {});
          setInjuryDates(data.injuryDates || {});
          setInjurySeverities(data.injurySeverities || {});
          setDailyLog(data.dailyLog || {});
          if (data.selectedInjury) {
            setSelectedRegion(regionOfInjury(data.selectedInjury));
            setScreen('tracker');
          }
        }
      } catch (err) {
        // Nessun dato salvato: si parte da zero.
      } finally {
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

  const snapshot = (overrides = {}) => ({ selectedInjury, activePhase, progress, injuryDates, injurySeverities, dailyLog, ...overrides });

  const goBack = () => {
    if (screen === 'tracker') setScreen('injuries');
    else if (screen === 'injuries') { setScreen('regions'); setSelectedRegion(null); setTriageTag(null); }
    else if (screen === 'triage') setScreen('regions');
    else if (screen === 'firstaid') setScreen('regions');
    else if (screen === 'regions') setScreen('cover');
  };

  const openRegion = (key) => { setSelectedRegion(key); setScreen('injuries'); };

  const resumeInjury = (key) => {
    const sev = injurySeverities[key] || 'moderato';
    const date = injuryDates[key];
    let suggested = 0;
    if (date) {
      const { dayThresholds } = injuriesData[key].severityData[sev];
      suggested = suggestPhase(daysSince(date), dayThresholds);
    }
    setSelectedInjury(key);
    setActivePhase(suggested);
    setSelectedRegion(regionOfInjury(key));
    setTrackerTab('oggi');
    setEditingSetup(false);
    setScreen('tracker');
    persist({ selectedInjury: key, activePhase: suggested, progress, injuryDates, injurySeverities, dailyLog });
  };
  const startTriage = () => { setTriageAnswers({ mechanism: null, pop: null, weight: null }); setTriageTag(null); setScreen('triage'); };

  const chooseInjury = (key) => {
    const severity = injurySeverities[key] || 'moderato';
    const nextSeverities = { ...injurySeverities, [key]: severity };
    setSelectedInjury(key);
    setActivePhase(0);
    setInjurySeverities(nextSeverities);
    setEditingSetup(!injuryDates[key]);
    setTrackerTab('oggi');
    setScreen('tracker');
    persist(snapshot({ selectedInjury: key, activePhase: 0, injurySeverities: nextSeverities }));
  };

  const setSeverity = (sev) => {
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
  const changePhase = (idx) => { setActivePhase(idx); persist(snapshot({ activePhase: idx })); };

  const toggleExercise = (exIdx) => {
    const pKey = `${selectedInjury}-${activePhase}`;
    const current = progress[pKey] || {};
    const nextForPhase = { ...current, [exIdx]: !current[exIdx] };
    const nextProgress = { ...progress, [pKey]: nextForPhase };
    setProgress(nextProgress);
    persist(snapshot({ progress: nextProgress }));
  };

  const todayKey = () => toISODate(new Date());

  const toggleToday = () => {
    const today = todayKey();
    const current = dailyLog[selectedInjury] || {};
    const todayEntry = current[today] || {};
    const nextEntry = { ...todayEntry, done: !todayEntry.done };
    const nextForInjury = { ...current, [today]: nextEntry };
    const nextLog = { ...dailyLog, [selectedInjury]: nextForInjury };
    setDailyLog(nextLog);
    persist(snapshot({ dailyLog: nextLog }));
  };

  const setTodayFeeling = (feeling) => {
    const today = todayKey();
    const current = dailyLog[selectedInjury] || {};
    const todayEntry = current[today] || {};
    const nextEntry = { ...todayEntry, feeling };
    const nextForInjury = { ...current, [today]: nextEntry };
    const nextLog = { ...dailyLog, [selectedInjury]: nextForInjury };
    setDailyLog(nextLog);
    persist(snapshot({ dailyLog: nextLog }));
  };

  const resetInjury = () => {
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

  const answerTriage = (field, value) => setTriageAnswers({ ...triageAnswers, [field]: value });
  const triageComplete = triageAnswers.mechanism && triageAnswers.pop && triageAnswers.weight;
  const triageRedirect = triageAnswers.weight === 'fatica' || (triageAnswers.pop === 'si' && triageAnswers.mechanism === 'torsione');
  const finishTriage = () => {
    const tagMap = { contatto: 'contact', sovraccarico: 'overuse', torsione: 'acute' };
    setTriageTag(tagMap[triageAnswers.mechanism]);
    setScreen('regions');
  };

  const displayFont = { fontFamily: "'Oswald', sans-serif" };
  const bodyFont = { fontFamily: "'Inter', sans-serif" };

  const injury = selectedInjury ? injuriesData[selectedInjury] : null;
  const severity = selectedInjury ? (injurySeverities[selectedInjury] || 'moderato') : 'moderato';
  const { dayThresholds, totalEstimateDays } = injury ? injury.severityData[severity] : { dayThresholds: [0, 0], totalEstimateDays: 1 };
  const phase = injury ? injury.phases[activePhase] : null;
  const phaseKey = injury ? `${selectedInjury}-${activePhase}` : null;
  const phaseProgress = phaseKey ? (progress[phaseKey] || {}) : {};
  const completedCount = phase ? phase.exercises.filter((_, i) => phaseProgress[i]).length : 0;
  const currentDate = injury ? injuryDates[selectedInjury] : null;
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
    if (!injury) return;
    const doneDays = Object.values(injuryLog).filter((e) => e.done).length;
    const lines = [
      'OFFSIDE — Riepilogo recupero',
      '',
      `Infortunio: ${injury.label}`,
      `Gravità: ${severityLabels[severity]}`,
      currentDate ? `Giorno di recupero: ${dayCount}` : null,
      `Fase attuale: ${phase.name} (Fase ${activePhase + 1} di ${injury.phases.length})`,
      `Esercizi completati in questa fase: ${completedCount}/${phase.exercises.length}`,
      `Sessioni giornaliere registrate: ${doneDays}`,
      streak > 0 ? `Serie attuale: ${streak} giorni consecutivi` : null,
    ].filter(Boolean);
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch (err) {
      // Condivisione annullata dall'utente: nessuna azione necessaria.
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: colors.paper, color: colors.mutedInk, fontFamily: "'Inter', sans-serif" }} className="w-full min-h-[400px] flex items-center justify-center rounded-2xl">
        <p className="text-sm">Carico i tuoi dati…</p>
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
      <div style={{ backgroundColor: colors.ink, ...bodyFont }} className="w-full min-h-screen relative">
        <style>{sharedStyle}</style>
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 400 560" fill="none" preserveAspectRatio="xMidYMid slice">
          <circle cx="200" cy="300" r="170" stroke={colors.accent} strokeWidth="1.5" />
          <line x1="-20" y1="300" x2="420" y2="300" stroke={colors.accent} strokeWidth="1.5" />
          <circle cx="200" cy="300" r="3" fill={colors.accent} />
        </svg>
        <div className="relative px-6 sm:px-10 pt-12 pb-8 flex flex-col min-h-screen">
          <div className="flex items-center justify-between mb-5">
            <div style={{ backgroundColor: '#17293D', border: `2px solid ${colors.accent}44` }} className="w-20 h-20 rounded-full flex items-center justify-center">
              <LogoMark size={38} color={colors.accent} />
            </div>
            <span style={{ ...displayFont, backgroundColor: '#17293D', color: colors.accent, letterSpacing: '0.1em' }} className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">Beta</span>
          </div>
          <div className="flex-1">
            <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.2em' }} className="text-xs font-semibold uppercase mb-3">Per chi in campo non ha un fisio a casa</p>
            <h1 style={{ ...displayFont, letterSpacing: '0.01em' }} className="text-6xl sm:text-7xl font-bold leading-none mb-4">
              <span style={{ color: '#FFFFFF' }}>OFF</span><span style={{ color: colors.accent }}>SIDE</span>
            </h1>
            <p style={{ color: '#A9B7C4' }} className="text-sm sm:text-base leading-relaxed max-w-sm">Il percorso di recupero pensato per il calcio amatoriale. Sai sempre a che punto sei, cosa fare oggi, e quando è il momento di chiamare un professionista.</p>
          </div>
          <div className="mb-6">
            {['Ogni giorno una sessione. Costruisci la serie.',
              'Avanzi in base a come stai, non al calendario.',
              'Sai sempre quando è il momento di fermarti.'].map((text, i, arr) => (
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
              Ho capito che Offside fornisce informazioni generali su infortuni comuni, non una diagnosi o un piano di trattamento personalizzato, e non sostituisce una valutazione da un professionista sanitario.
            </p>
          </button>

          <button
            onClick={() => disclaimerAccepted && setScreen('regions')}
            disabled={!disclaimerAccepted}
            style={{ backgroundColor: disclaimerAccepted ? colors.accent : '#2A3A48', color: disclaimerAccepted ? '#FFFFFF' : '#6E7E8C' }}
            className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium transition-colors"
          >
            <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">Inizia il tuo percorso</span><ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const activeInjuryKeys = Object.keys(injuryDates).filter((k) => injuryDates[k]);

  return (
    <div style={{ backgroundColor: colors.paper, ...bodyFont }} className="w-full min-h-screen relative">
      <style>{sharedStyle}</style>
      <svg className="fixed inset-0 w-full h-full opacity-[0.035] pointer-events-none" viewBox="0 0 400 800" fill="none" preserveAspectRatio="xMidYMid slice">
        <circle cx="200" cy="160" r="150" stroke={colors.accent} strokeWidth="1.5" />
        <line x1="-20" y1="160" x2="420" y2="160" stroke={colors.accent} strokeWidth="1.5" />
      </svg>

      <div style={{ borderBottom: `1px solid ${colors.hairline}` }} className="relative px-5 sm:px-8 pt-5 pb-4 flex items-center gap-3">
        <button onClick={goBack} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" aria-label="Torna indietro">
          <ArrowLeft size={16} color={colors.accent} />
        </button>
        <div className="flex-1 min-w-0">
          <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.14em' }} className="text-[10px] font-semibold uppercase">Offside</p>
          <h1 style={{ ...displayFont, color: colors.ink }} className="text-lg sm:text-xl font-semibold truncate">
            {screen === 'regions' ? 'Dove senti il problema?' : screen === 'triage' ? 'Non sai cosa hai?' : screen === 'firstaid' ? 'Primi soccorsi' : screen === 'injuries' ? regions[selectedRegion].label : 'Il tuo percorso'}
          </h1>
        </div>
        {screen === 'tracker' && injury && (
          <button onClick={shareProgress} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" aria-label="Condividi il tuo percorso">
            {shareCopied ? <Check size={15} color={colors.accent} /> : <Share2 size={15} color={colors.accent} />}
          </button>
        )}
      </div>

      <div className="px-5 sm:px-8 pt-5">
        <div style={{ backgroundColor: colors.redTint, border: `1px solid ${colors.red}22` }} className="rounded-xl overflow-hidden">
          <button onClick={() => setShowRedFlags(!showRedFlags)} className="os-focus w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
            <span className="flex items-center gap-2">
              <AlertTriangle size={18} color={colors.red} strokeWidth={2.25} />
              <span style={{ ...displayFont, color: colors.red }} className="text-sm font-semibold uppercase tracking-wide">Quando fermarti e chiamare un professionista</span>
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
                  <p style={{ ...displayFont, color: colors.red }} className="text-[11px] font-semibold uppercase tracking-wide mt-3 mb-1.5">Inoltre, specifico per questo infortunio</p>
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
            {activeInjuryKeys.length > 0 && (
              <div className="mb-4">
                <p style={{ ...displayFont, color: colors.mutedInk, letterSpacing: '0.08em' }} className="text-[11px] font-semibold uppercase mb-2">
                  {activeInjuryKeys.length === 1 ? 'Il tuo percorso' : `I tuoi percorsi (${activeInjuryKeys.length})`}
                </p>
                <div className="space-y-2">
                  {activeInjuryKeys.map((key) => (
                    <button key={key} onClick={() => resumeInjury(key)} style={{ backgroundColor: colors.accentDark }} className="os-focus w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left hover:opacity-90 transition-opacity">
                      <PlayCircle size={20} color="#FFFFFF" className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p style={{ color: '#FFFFFF' }} className="text-sm font-medium truncate">{injuriesData[key].label}</p>
                        <p style={{ color: '#B9CDE0' }} className="text-xs">Giorno {daysSince(injuryDates[key])}</p>
                      </div>
                      <ChevronRight size={18} color="#B9CDE0" className="flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setScreen('firstaid')} style={{ backgroundColor: colors.accent }} className="os-focus w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left mb-3 hover:opacity-90 transition-opacity">
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"><Snowflake size={20} color="#FFFFFF" /></div>
              <div className="flex-1">
                <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-sm font-medium">Ti sei appena fatto male?</p>
                <p style={{ color: '#DCEAF9' }} className="text-xs">Cosa fare nei primi minuti</p>
              </div>
              <ChevronRight size={18} color="#DCEAF9" />
            </button>

            <button onClick={startTriage} style={{ backgroundColor: colors.ink }} className="os-focus w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left mb-4 hover:opacity-90 transition-opacity">
              <div style={{ backgroundColor: colors.accent }} className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"><HelpCircle size={20} color="#FFFFFF" /></div>

              <div className="flex-1">
                <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-sm font-medium">Non sai cosa hai?</p>
                <p style={{ color: '#A9B7C4' }} className="text-xs">Rispondi a 3 domande veloci</p>
              </div>
              <ChevronRight size={18} color="#A9B7C4" />
            </button>

            <p style={{ ...displayFont, color: colors.mutedInk, letterSpacing: '0.08em' }} className="text-[11px] font-semibold uppercase text-center mb-3">Tocca dove senti il problema</p>
            <div className="mb-6">
              <BodyDiagram onSelectRegion={openRegion} />
            </div>

            <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.1em' }} className="text-xs font-semibold uppercase mb-3">Oppure scegli il distretto</p>
            <div className="space-y-2.5">
              {Object.entries(regions).map(([key, data]) => {
                const Icon = data.icon;
                return (
                  <button key={key} onClick={() => openRegion(key)} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left hover:shadow-sm transition-shadow">
                    <div style={{ backgroundColor: colors.card, border: `1.5px solid ${colors.accent}40` }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"><Icon size={19} color={colors.accent} strokeWidth={1.75} /></div>
                    <div className="flex-1 min-w-0"><p style={{ ...displayFont, color: colors.ink }} className="text-base font-medium">{data.label}</p></div>
                    <ChevronRight size={20} color={colors.mutedInk} className="flex-shrink-0" />
                  </button>
                );
              })}
            </div>
            <button onClick={() => setScreen('cover')} style={{ color: colors.mutedInk }} className="os-focus text-xs underline hover:opacity-70 mt-5 block mx-auto">Torna alla copertina</button>
          </>
        )}

        {screen === 'firstaid' && (
          <div>
            <p style={{ color: colors.mutedInk }} className="text-sm mb-5 leading-relaxed">
              Nei primi minuti dopo un infortunio, queste indicazioni valgono quasi sempre, qualunque sia la zona colpita.
            </p>
            <div className="space-y-3 mb-6">
              {riceSteps.map((step, i) => (
                <div key={i} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 flex gap-3">
                  <div style={{ backgroundColor: colors.accentTint }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center relative">
                    <step.icon size={20} color={colors.accent} strokeWidth={1.75} />
                    <span style={{ ...displayFont, backgroundColor: colors.accent, color: '#FFFFFF' }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">{step.letter}</span>
                  </div>
                  <div className="flex-1">
                    <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-0.5">{step.title}</p>
                    <p style={{ color: colors.mutedInk }} className="text-sm leading-snug">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-6">
              <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2">Da evitare nelle prime ore</p>
              <ul className="space-y-1">
                {riceAvoid.map((item, i) => (
                  <li key={i} style={{ color: colors.mutedInk }} className="text-sm flex gap-2"><span>—</span><span>{item}</span></li>
                ))}
              </ul>
            </div>

            <button onClick={() => setScreen('regions')} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-medium">
              <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">Ora scegli dove hai male</span><ArrowRight size={16} />
            </button>
          </div>
        )}

        {screen === 'triage' && (
          <div className="space-y-5">
            <div>
              <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-2">Com'è successo?</p>
              <div className="space-y-2">
                {mechanismOptions.map((opt) => (
                  <button key={opt.key} onClick={() => answerTriage('mechanism', opt.key)}
                    style={{ backgroundColor: triageAnswers.mechanism === opt.key ? colors.accent : colors.card, color: triageAnswers.mechanism === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.mechanism === opt.key ? colors.accent : colors.hairline}` }}
                    className="os-focus w-full text-left px-4 py-3 rounded-lg text-sm transition-colors">{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-2">Hai sentito uno schiocco o un "pop"?</p>
              <div className="flex gap-2">
                {popOptions.map((opt) => (
                  <button key={opt.key} onClick={() => answerTriage('pop', opt.key)}
                    style={{ backgroundColor: triageAnswers.pop === opt.key ? colors.accent : colors.card, color: triageAnswers.pop === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.pop === opt.key ? colors.accent : colors.hairline}` }}
                    className="os-focus flex-1 text-center px-4 py-3 rounded-lg text-sm transition-colors">{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-2">Riesci ad appoggiare il peso sulla gamba?</p>
              <div className="space-y-2">
                {weightOptions.map((opt) => (
                  <button key={opt.key} onClick={() => answerTriage('weight', opt.key)}
                    style={{ backgroundColor: triageAnswers.weight === opt.key ? colors.accent : colors.card, color: triageAnswers.weight === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.weight === opt.key ? colors.accent : colors.hairline}` }}
                    className="os-focus w-full text-left px-4 py-3 rounded-lg text-sm transition-colors">{opt.label}</button>
                ))}
              </div>
            </div>

            {triageComplete && triageRedirect && (
              <div style={{ backgroundColor: colors.redTint }} className="rounded-xl p-4 flex gap-2.5">
                <AlertTriangle size={18} color={colors.red} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: colors.red, fontWeight: 600 }} className="text-sm mb-1">Meglio farlo vedere da un professionista</p>
                  <p style={{ color: colors.red }} className="text-xs leading-relaxed mb-3">In base a quello che hai indicato, ti consigliamo una valutazione professionale prima di iniziare da soli un percorso di recupero.</p>
                  <button onClick={finishTriage} style={{ color: colors.red }} className="os-focus text-xs underline">Ho capito, voglio comunque vedere le informazioni generali</button>
                </div>
              </div>
            )}
            {triageComplete && !triageRedirect && (
              <button onClick={finishTriage} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-3.5">
                <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">Continua</span><ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {screen === 'injuries' && (
          <div className="space-y-2.5">
            {regions[selectedRegion].injuries.map((key) => {
              const data = injuriesData[key];
              const Icon = data.icon;
              const hasProgress = injuryDates[key];
              const matches = triageTag && data.mechanismTags.includes(triageTag);
              return (
                <button key={key} onClick={() => chooseInjury(key)} style={{ backgroundColor: colors.card, border: `1px solid ${matches ? colors.accent : colors.hairline}` }} className="os-focus w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left hover:shadow-sm transition-shadow">
                  <div style={{ backgroundColor: colors.card, border: `1.5px solid ${colors.accent}40` }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"><Icon size={19} color={colors.accent} strokeWidth={1.75} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p style={{ ...displayFont, color: colors.ink }} className="text-base font-medium">{data.label}</p>
                      {matches && <span style={{ backgroundColor: colors.accentTint, color: colors.accentDark }} className="text-[10px] px-2 py-0.5 rounded-full font-medium">Probabilmente questo</span>}
                    </div>
                    <p style={{ color: colors.mutedInk }} className="text-sm">{data.subtitle}{hasProgress ? ' · in corso' : ''}</p>
                  </div>
                  <ChevronRight size={20} color={colors.mutedInk} className="flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {screen === 'tracker' && injury && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span style={{ ...displayFont, color: colors.ink }} className="text-lg font-semibold">{injury.label}</span>
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
                <RotateCcw size={13} />{confirmingReset ? 'Tocca per confermare' : 'Ricomincia'}
              </button>
            </div>

            {editingSetup ? (
              <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 space-y-4 relative">
                <button onClick={skipDate} style={{ color: colors.mutedInk }} className="os-focus absolute top-3 right-3" aria-label="Chiudi"><X size={16} /></button>
                <div>
                  <div className="flex items-center gap-2 mb-2.5 pr-6">
                    <span style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide">Gravità</span>
                    <button onClick={() => setShowSeverityInfo(!showSeverityInfo)} className="os-focus" aria-label="Cosa significa ogni livello"><Info size={14} color={colors.mutedInk} /></button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    {Object.keys(severityLabels).map((sev) => (
                      <button key={sev} onClick={() => setSeverity(sev)} style={{ backgroundColor: severity === sev ? colors.accent : colors.paper, color: severity === sev ? '#FFFFFF' : colors.ink, border: `1px solid ${severity === sev ? colors.accent : colors.hairline}` }} className="os-focus flex-1 rounded-lg py-2 text-sm font-medium transition-colors">{severityLabels[sev]}</button>
                    ))}
                  </div>
                  {showSeverityInfo && (
                    <div style={{ backgroundColor: colors.paper }} className="rounded-lg p-3 space-y-2">
                      {Object.keys(severityLabels).map((sev) => (
                        <p key={sev} style={{ color: colors.mutedInk }} className="text-xs leading-relaxed"><span style={{ color: colors.ink, fontWeight: 600 }}>{severityLabels[sev]}: </span>{severityInfo[sev]}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ borderTop: `1px solid ${colors.hairline}` }} className="pt-4">
                  <p className="flex items-center gap-2 mb-3"><Calendar size={15} color={colors.accent} /><span style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide">Quando è successo?</span></p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {dateChips.map((chip) => (
                      <button key={chip.label} onClick={() => { const d = new Date(); d.setDate(d.getDate() - chip.days); commitDate(toISODate(d)); }} style={{ backgroundColor: colors.accentTint, color: colors.accentDark }} className="os-focus px-3 py-1.5 rounded-full text-sm hover:opacity-80 transition-opacity">{chip.label}</button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="date" value={pendingDate} className="os-date os-focus text-sm px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${colors.hairline}`, color: colors.ink }} max={toISODate(new Date())} onChange={(e) => setPendingDate(e.target.value)} />
                    <button onClick={() => pendingDate && commitDate(pendingDate)} disabled={!pendingDate} style={{ backgroundColor: pendingDate ? colors.accent : colors.hairline, color: pendingDate ? '#FFFFFF' : colors.mutedInk }} className="os-focus px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Conferma data</button>
                  </div>
                  <button onClick={skipDate} style={{ color: colors.mutedInk }} className="os-focus text-sm underline hover:opacity-70 mt-2 block">Preferisco non specificarla</button>
                </div>
                {severity === 'severo' && (
                  <div style={{ backgroundColor: colors.redTint }} className="rounded-lg p-3 flex gap-2">
                    <AlertTriangle size={15} color={colors.red} className="flex-shrink-0 mt-0.5" />
                    <p style={{ color: colors.red }} className="text-xs leading-relaxed">Con gravità severa ti consigliamo di sentire un professionista prima di iniziare da solo questo percorso.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: colors.laneBg }} className="flex gap-1 p-1 rounded-full mb-4">
                  <button onClick={() => setTrackerTab('oggi')} style={{ backgroundColor: trackerTab === 'oggi' ? colors.card : 'transparent', color: trackerTab === 'oggi' ? colors.ink : colors.mutedInk }} className="os-focus flex-1 py-2 rounded-full text-sm font-semibold transition-colors">Oggi</button>
                  <button onClick={() => setTrackerTab('percorso')} style={{ backgroundColor: trackerTab === 'percorso' ? colors.card : 'transparent', color: trackerTab === 'percorso' ? colors.ink : colors.mutedInk }} className="os-focus flex-1 py-2 rounded-full text-sm font-semibold transition-colors">Percorso</button>
                </div>

                {trackerTab === 'oggi' ? (
                  currentDate ? (
                    <>
                      <button onClick={() => setEditingSetup(true)} className="os-focus w-full text-left mb-3">
                        <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span style={{ ...displayFont, color: colors.mutedInk }} className="text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1">Corsia di recupero <Pencil size={11} className="ml-1" /></span>
                            <span style={{ ...displayFont, color: colors.accent }} className="os-tabular text-xl font-bold">Giorno {dayCount}</span>
                          </div>
                          <div className="flex gap-1">
                            {segments.map((seg, i) => (
                              <div key={i} className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: colors.laneBg, flexGrow: seg.span, flexBasis: 0 }}>
                                <div className="os-fill absolute inset-y-0 left-0 rounded-full" style={{ width: `${seg.fill}%`, backgroundColor: colors.accent }} />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            {injury.phases.map((p, i) => (
                              <div key={i} style={{ flexGrow: segments[i]?.span || 1, flexBasis: 0 }} className="text-center">
                                <span style={{ ...displayFont, color: i === activePhase ? colors.accent : colors.mutedInk }} className="text-[10px] font-semibold uppercase">F{i + 1}</span>
                              </div>
                            ))}
                          </div>
                          <p style={{ color: colors.mutedInk }} className="text-[11px] mt-2">Gravità {severityLabels[severity].toLowerCase()} · percorso indicativo su ~{totalEstimateDays} giorni</p>
                        </div>
                      </button>

                      <div style={{ backgroundColor: todayEntry.done ? colors.accentDark : colors.card, border: `1px solid ${todayEntry.done ? colors.accentDark : colors.hairline}` }} className="rounded-xl p-4 mb-5">
                        <div className="flex items-center justify-between mb-3">
                          <span style={{ ...displayFont, color: todayEntry.done ? '#FFFFFF' : colors.ink }} className="text-sm font-semibold capitalize">{formatTodayLabel()}</span>
                          {streak > 0 && (
                            <span style={{ ...displayFont, color: todayEntry.done ? '#FFD9A0' : colors.orange }} className="flex items-center gap-1 text-sm font-bold os-tabular">
                              <Flame size={15} strokeWidth={2.5} />{streak}
                            </span>
                          )}
                        </div>

                        <p style={{ color: todayEntry.done ? '#C9D8E5' : colors.mutedInk }} className="text-xs mb-2">Come ti senti oggi?</p>
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
                        {todayEntry.feeling === 'male' && (
                          <p style={{ color: todayEntry.done ? '#FFD0CC' : colors.red }} className="text-xs mb-3 leading-relaxed">
                            Magari oggi vacci piano — rivedi i segnali d'allarme in alto, e se il dolore è più forte del solito considera di aspettare prima di caricare.
                          </p>
                        )}

                        <button
                          onClick={toggleToday}
                          style={{ backgroundColor: todayEntry.done ? 'rgba(255,255,255,0.15)' : colors.accentTint, color: todayEntry.done ? '#FFFFFF' : colors.accentDark, border: todayEntry.done ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                          className="os-focus w-full flex items-center justify-center gap-2 rounded-lg py-3 transition-colors"
                        >
                          {todayEntry.done ? <CheckCircle2 size={18} strokeWidth={2.25} /> : <Circle size={18} strokeWidth={1.75} />}
                          <span style={displayFont} className="text-sm font-semibold uppercase tracking-wide">
                            {todayEntry.done ? 'Sessione di oggi completata' : 'Segna sessione di oggi come fatta'}
                          </span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => setEditingSetup(true)} style={{ color: colors.accent }} className="os-focus flex items-center gap-1.5 text-sm mb-5 hover:opacity-70">
                      <Calendar size={14} />Aggiungi data e gravità per tracciare il recupero
                    </button>
                  )
                ) : (
                  <>
                    <div className="flex items-stretch gap-1 mb-4">
                      {injury.phases.map((p, i) => {
                        const isActive = i === activePhase;
                        const pKey = `${selectedInjury}-${i}`;
                        const pProgress = progress[pKey] || {};
                        const pDone = p.exercises.length > 0 && p.exercises.filter((_, ei) => pProgress[ei]).length === p.exercises.length;
                        return (
                          <button key={i} onClick={() => changePhase(i)} style={{ backgroundColor: isActive ? colors.accent : colors.card, border: `1px solid ${isActive ? colors.accent : colors.hairline}`, color: isActive ? '#FFFFFF' : colors.ink }} className="os-focus flex-1 rounded-lg px-2 py-2.5 text-center transition-colors">
                            <div style={displayFont} className="text-[11px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1">Fase {i + 1}{pDone && <CheckCircle2 size={12} strokeWidth={2.5} />}</div>
                            <div className="text-[13px] mt-0.5" style={bodyFont}>{p.name}</div>
                          </button>
                        );
                      })}
                    </div>

                    <p style={{ color: colors.mutedInk }} className="text-xs mb-4 flex items-center gap-1.5 flex-wrap">
                      <span style={displayFont} className="uppercase tracking-wide font-medium">{phaseRangeLabel(activePhase, dayThresholds)}</span>
                      <span>· tempistica indicativa per gravità {severityLabels[severity].toLowerCase()}</span>
                    </p>

                    {phase.criteriaToAdvance && (
                      <div style={{ backgroundColor: colors.accentTint, border: `1px solid ${colors.accent}33` }} className="rounded-xl p-4 mb-4">
                        <p className="flex items-center gap-2 mb-2">
                          <ClipboardCheck size={15} color={colors.accentDark} />
                          <span style={{ ...displayFont, color: colors.accentDark }} className="text-xs font-semibold uppercase tracking-wide">Prima di considerarti in questa fase, chiediti</span>
                        </p>
                        <ul className="space-y-1 mb-1">
                          {phase.criteriaToAdvance.map((c, i) => (
                            <li key={i} style={{ color: colors.ink }} className="text-sm flex gap-2"><span style={{ color: colors.accentDark }}>—</span><span>{c}</span></li>
                          ))}
                        </ul>
                        <p style={{ color: colors.accentDark }} className="text-[11px] mt-2">Un autocontrollo, non un test clinico — nel dubbio chiedi a un professionista.</p>
                      </div>
                    )}

                    <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5">
                      <p className="flex items-center gap-2 mb-2"><Info size={15} color={colors.accent} /><span style={{ ...displayFont, color: colors.accent }} className="text-xs font-semibold uppercase tracking-wide">Perché questa fase</span></p>
                      <p style={{ color: colors.ink }} className="text-sm leading-relaxed">{phase.why}</p>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span style={{ ...displayFont, color: colors.ink, letterSpacing: '0.08em' }} className="text-xs font-semibold uppercase">Esercizi</span>
                      <span style={{ ...displayFont, color: colors.accent }} className="os-tabular text-lg font-bold">{completedCount}<span style={{ color: colors.mutedInk }} className="text-sm font-normal"> / {phase.exercises.length}</span></span>
                    </div>
                    <p style={{ color: colors.mutedInk }} className="text-[11px] mb-3">I numeri sono un punto di partenza, non una prescrizione fissa — adattali a come risponde il tuo corpo</p>

                    <div>
                      {phase.exercises.map((ex, i) => {
                        const done = !!phaseProgress[i];
                        const isLast = i === phase.exercises.length - 1;
                        return (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center flex-shrink-0" style={{ width: '32px' }}>
                              <button onClick={() => toggleExercise(i)} style={{ backgroundColor: done ? colors.accent : colors.card, border: `2px solid ${done ? colors.accent : colors.hairline}` }} className="os-focus w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                                {done ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : <span style={{ ...displayFont, color: colors.mutedInk }} className="text-xs font-bold">{i + 1}</span>}
                              </button>
                              {!isLast && <div style={{ backgroundColor: done ? colors.accent : colors.hairline }} className="flex-1 my-1 w-0.5" />}
                            </div>
                            <button onClick={() => toggleExercise(i)} className="os-focus flex-1 text-left pb-5 pt-1 min-w-0">
                              <span className="flex items-start justify-between gap-2">
                                <span style={{ color: done ? colors.accentDark : colors.ink, textDecoration: done ? 'line-through' : 'none', textDecorationColor: colors.accent + '99' }} className="text-sm leading-snug">{ex.text}</span>
                                <span style={{ backgroundColor: colors.paper, color: colors.mutedInk }} className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap mt-0.5">{catLabels[ex.cat]}</span>
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${colors.hairline}`, color: colors.mutedInk }} className="px-5 sm:px-8 py-4 text-xs leading-relaxed">
        Contenuto informativo generale per infortuni lievi–moderati, con tempistiche indicative basate su letteratura fisioterapica/ortopedica generale. Non è una diagnosi né un piano di trattamento personalizzato — in caso di dubbio, o se riconosci uno dei segnali sopra, rivolgiti a un fisioterapista o medico.
        {saveError && <div style={{ color: colors.red }} className="mt-2 flex items-center gap-1.5"><X size={13} /> Il salvataggio dei progressi non è riuscito, ma puoi continuare a usare il tracker.</div>}
        <a href="mailto:tuaemail@esempio.com?subject=Feedback%20Offside" style={{ color: colors.accent }} className="os-focus flex items-center gap-1.5 mt-3 hover:underline w-fit">
          <Share2 size={11} />Hai trovato un problema o hai un suggerimento? Scrivimelo
        </a>
      </div>
    </div>
  );
}
