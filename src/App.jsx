import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// SOSTITUISCI questo con il tuo vero Payment Link di Stripe una volta creato
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/dRmbJ1c2K3Zt1sB8mB7IY00';

// Payment Link per l'abbonamento "Offside Squadre" (50€/mese) — da creare su Stripe come
// prodotto separato e incollare qui. Finché resta questo placeholder, il bottone di
// attivazione nella schermata Squadre non farà nulla di reale.
const STRIPE_TEAM_PAYMENT_LINK = 'https://buy.stripe.com/dRm8wP9UC3Zt1sB1Yd7IY01';

// Payment Link per il "Pass Stagionale" Squadre — pagamento UNICO (non ricorrente, non mensile)
// da creare su Stripe come prodotto a parte, valido fino a fine stagione. Finché resta questo
// placeholder, il bottone del Pass Stagionale non farà nulla di reale.
const STRIPE_TEAM_SEASON_PAYMENT_LINK = 'https://buy.stripe.com/14A5kDc2KcvZ2wFdGV7IY02';
// Prezzo pieno = mesi rimanenti fino a fine stagione x 50€/mese. Prezzo Pass Stagionale = scontato.
// Aggiorna questi due numeri (e il Payment Link sopra) se cambi l'offerta o l'anno.
const TEAM_SEASON_FULL_PRICE = 450;
const TEAM_SEASON_PASS_PRICE = 350;

const TEAM_SCREENS = ['teamRegister', 'teamLogin', 'teamDashboard'];
const TEAM_ROLE_OPTIONS = [
  { key: 'fisioterapista', labelIT: 'Fisioterapista', labelEN: 'Physiotherapist' },
  { key: 'preparatore', labelIT: 'Preparatore atletico', labelEN: 'Athletic trainer' },
  { key: 'allenatore', labelIT: 'Allenatore / Mister', labelEN: 'Coach' },
  { key: 'altro', labelIT: 'Altro membro dello staff', labelEN: 'Other staff member' },
];

function trackEvent(name, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
// Icone: Phosphor Icons (peso "bold" impostato globalmente in main.jsx via IconContext),
// aliasate ai nomi Lucide originali così tutto il resto del file resta invariato.
import {
  Footprints, Lightning as Zap, Pulse as Activity,
  ArrowsLeftRight as ArrowLeftRight, Shield, Anchor, ShieldCheck,
  Disc, TrendUp as TrendingUp, Compass, Warning as AlertTriangle, CheckCircle as CheckCircle2,
  Circle, CaretRight as ChevronRight, CaretDown as ChevronDown, ArrowLeft, ArrowRight, Info,
  ArrowCounterClockwise as RotateCcw, X,
  Scales as Scale, Barbell as Dumbbell, ArrowsOutCardinal as Move, Wind, Timer, Pause, Pencil, Target,
  Question as HelpCircle, PlayCircle, Flame, ShareNetwork as Share2, ListChecks as ClipboardCheck, Check, Gauge, Waves,
  Aperture, Camera, PersonSimple as PersonStanding, Ruler, Plant as Sprout, ArrowClockwise as RotateCw, CircleDashed, ShieldWarning as ShieldAlert,
  Snowflake, Bandaids as Bandage, ArrowUp, Trophy, Video, Lock, Download, CalendarPlus, DeviceMobile as Smartphone,
  User, Hand, DotsSixVertical as Grip, MapPin, Phone, Envelope as Mail, Stethoscope, ArrowSquareOut as ExternalLink, MagnifyingGlass as Search,
  Users, SignOut as LogOut, Copy, UserPlus, Buildings as Building2, Eye, EyeSlash as EyeOff, SoccerBall
} from '@phosphor-icons/react';

const colors = {
  paper: '#EEF3F8', card: '#FFFFFF', hairline: '#D7E1EA', ink: '#101B26',
  mutedInk: '#57697A', accent: '#2FA766', accentTint: '#E1F3E8', accentDark: '#0E7C43',
  red: '#AE3830', redTint: '#F6DEDB', laneBg: '#DFE7EF', orange: '#C96A22',
  prevention: '#1D8FA0', preventionTint: '#DAF1F3', preventionDark: '#0B6672', preventionPaper: '#EBF7F8',
  premiumGold: '#F0B429', premiumGoldTint: 'rgba(240,180,41,0.18)',
  heroBg: '#0C2B21',
};

const STORAGE_KEY = 'injury-recovery-progress-v3';

// Scelta dell'utente sul banner cookie/consenso analytics: null = non ancora scelto,
// 'granted' o 'denied'. Letta/scritta solo su questo dispositivo (localStorage).
const COOKIE_CONSENT_KEY = 'offside-cookie-consent';

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
          { text: `Alfabeto con la caviglia: disegna le lettere muovendo il piede, senza carico`, cat: 'stretch', howTo: `Siediti con la gamba sollevata e usa l'alluce come se fosse una penna: disegna nell'aria le lettere dell'alfabeto muovendo solo la caviglia, non il ginocchio. Vai lento e fermati a qualsiasi lettera se senti dolore acuto — l'obiettivo è coprire tutte le direzioni di movimento, non finire l'alfabeto.` },
          { text: `Elevazione della gamba quando possibile`, cat: 'rest', howTo: `Sdraiati e appoggia la gamba su un cuscino o il bracciolo del divano, tenendo la caviglia più in alto del cuore. Tienila così il più possibile nelle prime ore, soprattutto la sera: aiuta il liquido in eccesso a drenare invece di accumularsi.` },
          { text: `Cammina solo nei limiti del dolore (stampelle nei primi giorni se serve)`, cat: 'rest', howTo: `Cammina appoggiando il piede in modo naturale, solo quanto il dolore lo permette. Se ti accorgi di zoppicare in modo evidente, è il segnale di accorciare le distanze o usare le stampelle per qualche giorno: zoppicare a lungo scarica la caviglia ma sovraccarica ginocchio e schiena.` },
          { text: `Contrazioni isometriche leggere: spingi il piede contro una resistenza ferma (tenuta 20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Siediti e appoggia il piede contro un muro o la mano di qualcuno che fa resistenza, poi spingi in una direzione (dentro, fuori, in basso) senza che la caviglia si muova davvero. Tieni la spinta 20-30 secondi respirando normale, poi cambia direzione — deve essere una tensione controllata, mai dolore acuto.` },
          { text: `Ghiaccio nelle prime 48 ore: 15-20 minuti ogni 2-3 ore`, cat: 'rest', howTo: `Avvolgi il ghiaccio in un panno sottile — mai a contatto diretto con la pelle, rischi un'ustione da freddo — e tienilo sulla caviglia 15-20 minuti, ripetendo ogni 2-3 ore nelle prime 24-48 ore. Dopo i primi 2 giorni il beneficio del ghiaccio si riduce molto, quindi non serve continuare a oltranza.` },
        ] },
      { name: 'Recupero attivo', why: 'Il legamento inizia a tollerare carico progressivo. Qui si lavora su forza e propriocezione: il senso di equilibrio della caviglia, spesso il fattore chiave per non farsi male di nuovo.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare in modo evidente', 'Il gonfiore è chiaramente diminuito rispetto ai primi giorni'],
        exercises: [
          { text: `Equilibrio su una gamba sola, 30 secondi (poi a occhi chiusi se comodo)`, cat: 'balance', howTo: `Stai in piedi su una gamba sola su una superficie stabile, ginocchio leggermente piegato e sguardo fisso avanti, non giù verso il piede. Prova a reggere 30 secondi; quando diventa facile, prova a occhi chiusi o su un cuscino — qui si allena il senso di posizione della caviglia, non solo l'equilibrio in sé.` },
          { text: `Rinforzo con elastico in tutte le direzioni (2-3 serie da 12-15 per direzione)`, cat: 'strength', howTo: `Siediti con la gamba tesa, aggancia un elastico attorno all'avampiede e spingi contro la resistenza in ciascuna direzione — verso di te, in fuori, in basso, verso l'interno. Muovi solo la caviglia, non tutta la gamba, e curi il ritorno lento e controllato quanto la spinta.` },
          { text: `Calf raises a corpo libero (3 serie da 12-15, aumenta se non c'è dolore)`, cat: 'strength', howTo: `In piedi, sollevati sulle punte il più possibile, poi scendi lentamente in 2-3 secondi. Se la caviglia infortunata è ancora debole, appoggia le mani a un supporto all'inizio e togli l'appoggio appena riesci a farlo senza compensare con l'altra gamba.` },
          { text: `Cammino su superfici leggermente instabili`, cat: 'balance', howTo: `Cammina su erba, sabbia o un tappetino morbido invece che su pavimento liscio, con passi normali, non esagerati. Serve a far lavorare i piccoli muscoli stabilizzatori della caviglia in modo naturale, senza dover pensare a un esercizio specifico.` },
          { text: `Step-down laterale da un gradino basso (2-3 serie da 8-10)`, cat: 'strength', howTo: `Stai su un gradino basso o un rialzo di pochi centimetri con la gamba infortunata, e scendi lateralmente in modo controllato con l'altra gamba, sfiorando appena il pavimento prima di risalire. Conta la lentezza della discesa, non l'altezza del gradino: se perdi il controllo, usa un rialzo più basso.` },
          { text: `Lancio e presa di una palla mentre sei in equilibrio su una gamba`, cat: 'balance', howTo: `In equilibrio su una gamba sola, fatti lanciare una palla leggera da un compagno (o palleggiala contro un muro) mantenendo la posizione. Distrarre l'attenzione dall'equilibrio in sé è proprio il punto: è più vicino a quello che serve davvero in partita.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a correre e calciare, la caviglia deve tollerare carichi improvvisi e cambi di direzione senza cedere.',
        criteriaToAdvance: ['Riesci a stare in equilibrio su una gamba sola per 10+ secondi senza dolore', 'Riesci a fare i calf raises senza dolore acuto'],
        exercises: [
          { text: `Corsa leggera in linea retta`, cat: 'run', howTo: `Inizia con un jog leggero su una superficie piana e regolare, aumentando la distanza da un allenamento all'altro. Fermati se compare zoppia o dolore acuto, non basta un lieve fastidio per interrompere.` },
          { text: `Cambi di direzione graduali`, cat: 'run', howTo: `Parti da curve ampie e dolci prima di arrivare ai cambi secchi a 90°, aumentando l'angolo nell'arco di più sessioni. Rallenta l'andatura finché il cambio di direzione non ti viene naturale, senza un attimo di esitazione prima di girare.` },
          { text: `Salti bipodalici, poi monopodalici`, cat: 'strength', howTo: `Inizia con piccoli salti sul posto a due piedi, atterrando con le ginocchia morbide e in silenzio, poi passa a salti su una gamba sola quando i primi sono senza dolore. L'atterraggio controllato conta più dell'altezza del salto.` },
          { text: `Dribbling leggero prima del rientro in gruppo`, cat: 'run', howTo: `Palleggia a bassa velocità in linea retta prima di introdurre cambi di direzione con la palla. È un buon test intermedio: se la caviglia regge dribbling e piccole frenate senza cedere, di solito è pronta per l'allenamento con la squadra.` },
          { text: `Salti laterali oltre un cono o una linea (2-3 serie da 8-10)`, cat: 'strength', howTo: `Salta lateralmente oltre una linea a terra o un cono basso, atterrando in equilibrio prima di saltare di nuovo dall'altra parte. Parti lento e controllato: l'obiettivo è un atterraggio stabile su quella caviglia, non la velocità con cui salti.` },
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
          { text: `Riduci temporaneamente salti, sprint e scale se scatenano dolore persistente`, cat: 'rest', howTo: `Se salti, scatti o le scale scatenano un dolore che resta anche il giorno dopo, riducili temporaneamente — non serve fermarsi del tutto, ma abbassa il volume finché il dolore del giorno dopo non torna a livelli minimi.` },
          { text: `Cammina normalmente se ben tollerato`, cat: 'rest', howTo: `Cammina alla tua andatura abituale se il tendine lo permette senza dolore acuto: a differenza di uno strappo muscolare, l'Achille infiammato spesso peggiora più con il riposo assoluto che con un'attività leggera e regolare.` },
          { text: `Isometria: sollevati leggermente sulle punte e mantieni la posizione (30-45 secondi, 4-5 volte)`, cat: 'hold', howTo: `Sollevati lentamente sulle punte di entrambi i piedi fino a un'altezza comoda, poi resta fermo in quella posizione per 30-45 secondi senza oscillare. È normale sentire tensione nel tendine, non deve mai diventare dolore acuto.` },
          { text: `Automassaggio leggero del polpaccio, senza premere sul tendine`, cat: 'stretch', howTo: `Con le mani o un rullo, applica una pressione morbida e scorrevole sul polpaccio per 1-2 minuti, evitando di premere direttamente sul tendine se è dolente al tocco. Non è indispensabile, ma molti lo trovano utile per alleggerire la tensione muscolare attorno al tendine.` },
          { text: `Monitora il dolore la sera, confrontandolo col giorno prima`, cat: 'rest', howTo: `La sera, valuta da 0 a 10 quanto fa male il tendine rispetto al giorno precedente. Se il dolore il giorno dopo un'attività è chiaramente peggiore di quello durante l'attività stessa, hai esagerato con il carico: è il segnale più affidabile per calibrare quanto fare.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo eccentrico (allungamento del tendine sotto carico) ha più evidenza scientifica per i tendini, ma va introdotto con gradualità.',
        criteriaToAdvance: ['Riesci a camminare normalmente senza dolore a riposo', 'Il dolore nelle attività quotidiane resta lieve'],
        exercises: [
          { text: `Calf raises eccentrici: sali su due gambe, scendi lentamente su una sola (3 serie da 10-15)`, cat: 'strength', howTo: `In piedi su un gradino, sali sulle punte con entrambe le gambe, poi sposta il peso sulla gamba infortunata e scendi lentamente in 3-4 secondi, lasciando il tallone andare leggermente sotto il livello del gradino. Risali sempre con due gambe: è la discesa lenta su una gamba sola la parte che conta di più.` },
          { text: `Calf raises eccentrici a ginocchio piegato (stessa esecuzione, ginocchio flesso)`, cat: 'strength', howTo: `Esegui lo stesso movimento dei calf raises eccentrici ma con il ginocchio piegato invece che teso durante la discesa. Coinvolge un muscolo più profondo del polpaccio (il soleo) che l'esercizio a gamba tesa non allena bene, ed è una parte importante del recupero dell'Achille.` },
          { text: `Aumenta gradualmente carico e ripetizioni settimana dopo settimana`, cat: 'strength', howTo: `Tieni traccia di serie, ripetizioni ed eventuale peso aggiunto settimana per settimana, aumentando un solo parametro alla volta — prima le ripetizioni, poi il peso. Alzare più cose insieme troppo in fretta è la causa più comune di ricadute nei tendini.` },
          { text: `Stretching dolce del polpaccio, senza forzare`, cat: 'stretch', howTo: `In piedi davanti a un muro, gamba infortunata dietro con tallone a terra e ginocchio teso, piegati in avanti finché senti allungamento, non dolore, nel polpaccio. Tieni 20-30 secondi, poi ripeti con il ginocchio leggermente piegato per raggiungere anche il muscolo più profondo.` },
          { text: `Calf raises con peso aggiuntivo, lenti in salita e discesa`, cat: 'strength', howTo: `Quando i calf raises a corpo libero non sono più impegnativi, aggiungi peso (uno zaino carico, dei manubri) e rallenta ulteriormente sia la salita che la discesa, in 3-4 secondi ciascuna. Il tendine d'Achille risponde meglio a un carico pesante e lento che a tante ripetizioni leggere e veloci.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Anche senza dolore, il tendine potrebbe non essere ancora pronto per sprint e salti ripetuti: qui più che altrove vale la regola di non affrettare.',
        criteriaToAdvance: ['Riesci a fare calf raises su due gambe senza dolore significativo', 'Il dolore il giorno dopo l\'allenamento non peggiora'],
        exercises: [
          { text: `Corsa progressiva, aumentando distanza e intensità con calma`, cat: 'run', howTo: `Aumenta distanza o velocità in un allenamento su due, mai entrambe insieme, usando la regola delle 24 ore per decidere se puoi salire ancora. Ripartire da un volume più basso di quanto pensi è più sicuro che rischiare una ricaduta.` },
          { text: `Salti e cambi di direzione introdotti per ultimi`, cat: 'strength', howTo: `Reintroduci prima salti bipodalici sul posto, poi monopodalici, poi i cambi di direzione — un elemento nuovo per sessione, non tutti insieme. L'Achille è il tendine più sollecitato nei gesti esplosivi, quindi qui la gradualità conta più che altrove.` },
          { text: `Test di carico: 3-5 sprint brevi al 70-80% della velocità massima`, cat: 'run', howTo: `Fai 3-5 sprint da 20-30 metri al 70-80% della velocità massima, poi aspetta il giorno dopo per valutare la risposta del tendine prima di aumentare intensità o numero di sprint. Se il giorno dopo il dolore è invariato, sali gradualmente verso la velocità di gara.` },
          { text: `Torna agli allenamenti completi solo se stabile senza dolore da 1-2 settimane`, cat: 'run', howTo: `Prima di tornare agli allenamenti completi, verifica di aver avuto almeno 1-2 settimane senza che il dolore peggiori il giorno dopo un carico più alto. Un solo giorno senza dolore non basta: qui conta la costanza nel tempo, non un singolo buon giorno.` },
        ] },
    ],
  },
  achilles_rupture: {
    relatedInjuries: ['achilles', 'calf'], relatedReason: 'Una tendinopatia achillea trascurata è tra i principali fattori di rischio per la rottura vera e propria.',
    label: 'Rottura del tendine d\'Achille', subtitle: 'Lacerazione completa o parziale, spesso richiede intervento', icon: Anchor, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [28, 70], totalEstimateDays: 120 },
      moderato: { dayThresholds: [56, 140], totalEstimateDays: 210 },
      severo: { dayThresholds: [70, 168], totalEstimateDays: 280 },
    },
    specialRedFlags: [
      'Senti un altro "colpo" o cedimento improvviso nella gamba operata durante la riabilitazione',
      'Non riesci a sollevarti sulle punte nemmeno minimamente, molte settimane dopo l\'infortunio',
      'Inizi a sentire dolore, rigidità o gonfiore anche nell\'altro tendine d\'Achille',
    ],
    phases: [
      { name: 'Protezione', why: 'Nelle prime settimane il tendine riparato (chirurgicamente o no) è fragile: l\'obiettivo è proteggerlo mentre inizia a guarire, senza immobilizzarlo del tutto.',
        exercises: [
          { text: `Segui esattamente i tempi di carico indicati dal chirurgo o fisioterapista (spesso tutore/stivaletto)`, cat: 'rest', howTo: `Il programma di carico — quando puoi appoggiare il piede, quando togliere il tutore, quando muovere la caviglia — va seguito esattamente come indicato da chi ti ha operato, anche se ti senti pronto prima. I tempi biologici di guarigione del tendine non si accelerano con la buona volontà.` },
          { text: `Mobilità delle dita del piede e del ginocchio, senza muovere la caviglia`, cat: 'stretch', howTo: `Muovi attivamente le dita del piede e piega/stendi il ginocchio più volte al giorno, tenendo la caviglia ferma nella posizione indicata dal tutore. Serve a non irrigidire le altre articolazioni mentre la caviglia resta protetta.` },
          { text: `Evita qualsiasi movimento improvviso o inciampo: il rischio di ri-rottura è più alto proprio in questa fase`, cat: 'rest', howTo: `Presta attenzione extra su superfici irregolari, scale o pavimenti bagnati. Un passo falso o un recupero d'equilibrio improvviso in questa fase è il momento di massimo rischio di ri-rottura, più del semplice camminare con le stampelle.` },
        ] },
      { name: 'Carico progressivo e simmetria', why: 'Il tendine risponde bene a un carico graduale e controllato. Da qui in poi conta tanto quanto la gamba infortunata guarisce, quanto quanto l\'altra gamba viene protetta: dopo una rottura, l\'Achille "sano" lavora di più per compensare e va monitorato, non dato per scontato.',
        criteriaToAdvance: ['Riesci a camminare senza tutore su superficie piana, come indicato dal professionista', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: `Calf raises assistiti su due gambe, aumentando il carico sulla gamba infortunata con gradualità`, cat: 'strength', howTo: `Con l'aiuto delle braccia su un supporto, sollevati sulle punte spostando gradualmente più peso sulla gamba operata nell'arco delle settimane, seguendo la progressione indicata dal fisioterapista. Non passare a carico completo solo perché non fa più male: il tendine riparato ha bisogno di tempo anche quando è indolore.` },
          { text: `Esercizi di equilibrio su una gamba (propriocezione), non solo di forza — l'equilibrio si perde tanto quanto il muscolo`, cat: 'balance', howTo: `Stai in piedi sulla gamba operata con un appoggio leggero nelle vicinanze (un muro, una sedia) a cui aggrapparti se serve, riducendo l'appoggio man mano che ti senti sicuro. Dopo una rottura l'equilibrio spesso peggiora più della forza, e va riallenato apposta: non torna da solo.` },
          { text: `Conta quante volte riesci a sollevarti sulle punte per ciascuna gamba separatamente, e confronta: uno squilibrio marcato è normale all'inizio ma va ridotto nel tempo`, cat: 'strength', howTo: `Ogni 1-2 settimane, conta il numero massimo di calf raises su ciascuna gamba separatamente e segnati il numero. Uno squilibrio netto tra le due gambe è normale all'inizio, ma seguirne l'andamento ti dice se il recupero sta progredendo o si è fermato.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Il ritorno in campo richiede non solo forza ma sicurezza nel movimento: la paura di riusare la gamba infortunata è comune e reale, e finché resta cambia il modo in cui cammini e corri, sovraccaricando l\'altra gamba senza che te ne accorga.',
        criteriaToAdvance: ['I calf raises sulla gamba infortunata sono vicini al numero dell\'altra gamba', 'Corri, cambi direzione e salti senza esitazione o dolore'],
        exercises: [
          { text: `Corsa progressiva, partendo da linea retta prima di cambi di direzione`, cat: 'run', howTo: `Inizia con un jog leggero in linea retta su superficie regolare, aumentando gradualmente prima di introdurre curve o cambi di direzione. Dopo una rottura questo passaggio arriva in genere mesi dopo l'infortunio, non settimane: segui i tempi indicati dal fisioterapista.` },
          { text: `Salti bipodalici prima, poi monopodalici su entrambe le gambe, confrontando l'altezza/controllo`, cat: 'strength', howTo: `Salta prima con entrambe le gambe, poi su una gamba sola, confrontando altezza e controllo dell'atterraggio tra le due. Una differenza netta è il segnale per tornare a lavorare sulla gamba più debole prima di procedere oltre.` },
          { text: `Simulazioni di gesti specifici dello sport a intensità crescente`, cat: 'run', howTo: `Riproduci i movimenti tipici del tuo ruolo — scatti, cambi di ritmo, gesti tecnici — a intensità crescente nell'arco di più settimane, non di più giorni. Qui la progressione lenta è lo standard per questo tipo di infortunio, non un eccesso di prudenza.` },
          { text: `Se la paura di rifarti male condiziona ancora il movimento dopo mesi, parlane con un professionista: è un fattore di rischio reale, non solo mentale`, cat: 'rest', howTo: `Se ti accorgi di evitare istintivamente certi movimenti, esitare prima di un contrasto o frenare uno scatto per timore, segnalalo al tuo fisioterapista. È un fattore di rischio misurabile per il rientro in campo, non solo una sensazione da ignorare.` },
        ] },
    ],
  },
  knee: {
    relatedInjuries: ['trochanteric', 'quad'], relatedReason: 'Un\'anca debole, soprattutto il gluteo medio, è tra le cause più comuni di dolore femoro-rotuleo.',
    label: 'Dolore femoro-rotuleo', subtitle: 'Dolore anteriore al ginocchio', icon: Target, mechanismTags: ['overuse'],
    severityData: {
      lieve: { dayThresholds: [10, 21], totalEstimateDays: 35 },
      moderato: { dayThresholds: [21, 42], totalEstimateDays: 70 },
      severo: { dayThresholds: [35, 84], totalEstimateDays: 200 },
    },
    phases: [
      { name: 'Riduzione carico', why: 'Spesso è un sovraccarico più che un trauma singolo. Prima si capisce quali movimenti scatenano il dolore (salti, scale, squat profondi) e si riducono, senza fermare tutto.',
        exercises: [
          { text: `Riduci temporaneamente salti e scale se scatenano dolore`, cat: 'rest', howTo: `Se salti o scale scatenano dolore, riducili temporaneamente sostituendoli con alternative meno dolorose — ad esempio scendere le scale un gradino alla volta, di lato. Non serve smettere ogni attività, solo quella che scatena dolore in modo netto.` },
          { text: `Mantieni attività ben tollerate (spesso la bici leggera va bene)`, cat: 'rest', howTo: `Pedala con la sella alzata un po' più del solito, così il ginocchio lavora con un angolo meno acuto durante la pedalata. Molte persone con questo dolore tollerano bene la bici anche quando le scale danno fastidio.` },
          { text: `Squat isometrico a parete, breve durata (20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Con la schiena contro un muro, scendi fino ad avere le ginocchia piegate a circa 60-90°, come seduto su una sedia invisibile, e resta fermo 20-30 secondi. Se un angolo scatena dolore, prova uno meno profondo: cerca la posizione più bassa possibile senza dolore acuto.` },
          { text: `Attivazione del quadricipite interno: contrazione a ginocchio quasi teso (2-3 serie da 10-15)`, cat: 'hold', howTo: `Da seduto con la gamba quasi tesa, contrai il quadricipite come per spingere il ginocchio verso il basso, tenendo 5 secondi e ripetendo 10-15 volte. Punta a sentire la contrazione anche nella parte interna della coscia vicino al ginocchio, spesso il punto più debole in questo tipo di dolore.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo di quadricipite E anca/gluteo è centrale — spesso l\'anca viene trascurata ma è molto rilevante.',
        criteriaToAdvance: ['Riesci a salire/scendere le scale con dolore lieve o assente', 'Lo squat isometrico a parete non scatena dolore acuto'],
        exercises: [
          { text: `Squat controllati, aumenta gradualmente la profondità (2-3 serie da 10-12)`, cat: 'strength', howTo: `Scendi controllando la profondità, fermandoti appena prima del punto in cui compare dolore, e aumenta la profondità di settimana in settimana. Tieni le ginocchia allineate con la punta dei piedi, senza farle cadere verso l'interno.` },
          { text: `Step-up bassi (2-3 serie da 10-12 per gamba)`, cat: 'strength', howTo: `Sali su un gradino basso con la gamba interessata, spingendo attraverso il tallone più che sulla punta, e scendi controllando la discesa. Aumenta l'altezza del gradino solo quando quella attuale non dà dolore.` },
          { text: `Rinforzo abduttori e gluteo medio (2-3 serie da 15)`, cat: 'strength', howTo: `Da sdraiato su un fianco, ginocchia piegate, apri il ginocchio superiore mantenendo i piedi uniti (clamshell), oppure con un elastico attorno alle caviglie in piedi, allontana la gamba lateralmente. Un gluteo medio debole è tra le cause più comuni di questo dolore, perché lascia il ginocchio cadere verso l'interno durante corsa e salti.` },
          { text: `Leg press a range parziale se disponibile (3 serie da 10-12)`, cat: 'strength', howTo: `Usa la leg press limitando il movimento alla parte meno dolorosa del range, di solito evitando la flessione completa del ginocchio. Aumenta gradualmente il range quando è ben tollerato.` },
          { text: `Terminal knee extension con elastico (2-3 serie da 12-15)`, cat: 'strength', howTo: `Aggancia un elastico dietro il ginocchio a un supporto fisso e, partendo dal ginocchio leggermente piegato, distendilo completamente contro la resistenza. Rinforza proprio l'ultimo tratto dell'estensione del ginocchio, spesso il punto più debole dopo un dolore femoro-rotuleo.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Salti e cambi di direzione vanno reintrodotti gradualmente, mantenendo il rinforzo anche dopo la scomparsa del dolore per evitare ricadute.',
        criteriaToAdvance: ['Riesci a fare squat a media profondità senza dolore significativo', 'Nessun peggioramento del dolore il giorno dopo l\'allenamento'],
        exercises: [
          { text: `Salti e atterraggi controllati`, cat: 'run', howTo: `Salta e atterra con le ginocchia morbide e allineate con i piedi, evitando che cadano verso l'interno. Fatti guardare o filmare le prime volte: è un errore comune non accorgersene da soli.` },
          { text: `Cambi di direzione progressivi`, cat: 'run', howTo: `Parti da cambi di direzione ampi e a bassa velocità, aumentando gradualmente angolo e velocità nell'arco di più sessioni. Il dolore femoro-rotuleo spesso ricompare proprio quando si salta questo passaggio intermedio.` },
          { text: `Corsa progressiva fino a intensità di gara`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa, valutando il dolore sia durante che il giorno dopo. Solo quando la corsa a intensità di gara non dà dolore ha senso passare a salti e cambi di direzione a piena intensità.` },
          { text: `Test del salto su una gamba: confronta distanza e controllo tra le due gambe`, cat: 'balance', howTo: `Salta il più lontano possibile su una gamba sola, atterrando in equilibrio, e confronta la distanza tra gamba sana e gamba interessata. Una differenza superiore al 10-15% è il segnale per continuare a rinforzare prima di tornare a pieno regime.` },
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
          { text: `Cammino nei limiti del dolore, evita torsioni e movimenti laterali bruschi`, cat: 'rest', howTo: `Cammina alla tua andatura naturale, evitando di ruotare bruscamente sul ginocchio per cambiare direzione. Se senti una fitta sul lato interno del ginocchio durante un passo, accorcia il percorso e rallenta il ritmo per qualche giorno.` },
          { text: `Elevazione della gamba quando possibile`, cat: 'rest', howTo: `Quando sei seduto o sdraiato, appoggia la gamba su un cuscino in modo che il ginocchio resti più in alto del cuore. Ripetuto spesso durante la giornata aiuta a drenare il gonfiore nelle prime ore.` },
          { text: `Contrazioni isometriche leggere del quadricipite (tenuta 20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Da seduto con la gamba tesa, contrai il quadricipite come per spingere il ginocchio verso il basso contro il pavimento o un asciugamano arrotolato sotto il ginocchio. Tieni la contrazione 20-30 secondi senza muovere l'articolazione: serve a mantenere tono muscolare senza sollecitare il legamento.` },
          { text: `Ghiaccio sul lato interno del ginocchio nei primi giorni`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15-20 minuti, ripetendo ogni 2-3 ore nelle prime 48 ore. Concentrati sul lato interno del ginocchio, dove il legamento è più superficiale e il freddo agisce meglio.` },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce movimento e carico controllato, senza ancora sollecitare il ginocchio con stress laterali importanti.',
        criteriaToAdvance: ['Riesci a camminare senza sensazione di cedimento del ginocchio', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: `Squat controllati in range limitato (2-3 serie da 10)`, cat: 'strength', howTo: `Scendi solo fino al punto in cui non senti tensione sul lato interno del ginocchio, mantenendo le ginocchia allineate con i piedi senza farle cadere verso l'interno. Aumenta la profondità gradualmente, di settimana in settimana.` },
          { text: `Rinforzo di quadricipite e ischiocrurali (2-3 serie da 12)`, cat: 'strength', howTo: `Alterna esercizi per il quadricipite, come leg extension a range parziale, ed esercizi per gli ischiocrurali, come il ponte a una gamba, così i muscoli che attraversano il ginocchio lo sostengono da entrambi i lati. Aumenta il carico solo quando la serie precedente non ha dato dolore.` },
          { text: `Equilibrio su una gamba sola, senza torsioni`, cat: 'balance', howTo: `Stai in equilibrio sulla gamba interessata per 20-30 secondi, mantenendo il ginocchio leggermente piegato e stabile, senza lasciarlo ruotare verso l'interno. È un modo diretto per riallenare la stabilità che il legamento normalmente aiuta a fornire.` },
          { text: `Rinforzo del gluteo medio con elastico (2-3 serie da 15)`, cat: 'strength', howTo: `Con un elastico attorno alle caviglie, in piedi, allontana lateralmente una gamba alla volta mantenendo il busto stabile. Un gluteo medio forte controlla meglio il ginocchio nei movimenti laterali, alleggerendo il lavoro richiesto al legamento collaterale mediale.` },
          { text: `Mobilità attiva del ginocchio, flessione ed estensione complete`, cat: 'stretch', howTo: `Da seduto sul bordo di una sedia, piega ed estendi lentamente il ginocchio per tutto il range disponibile, senza forzare l'ultimo grado se è doloroso. Recuperare la mobilità completa prima di aggiungere carico riduce il rischio di compensi scorretti più avanti.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare ai contrasti e ai cambi di direzione, il ginocchio deve tollerare stress laterali senza cedere.',
        criteriaToAdvance: ['Riesci a fare squat senza dolore sul lato interno del ginocchio', 'Nessuna instabilità percepita nei movimenti quotidiani'],
        exercises: [
          { text: `Cambi di direzione progressivi, partendo da angoli ampi`, cat: 'run', howTo: `Inizia con cambi di direzione ad angoli ampi, quasi una curva, e bassa velocità, restringendo l'angolo solo quando quello attuale non dà fastidio. Gli angoli stretti sono quelli che sollecitano di più il lato interno del ginocchio.` },
          { text: `Corsa con curve controllate`, cat: 'run', howTo: `Corri descrivendo curve ampie invece che percorsi solo rettilinei, aumentando gradualmente la strettezza della curva. Simuli così, in modo controllato, le sollecitazioni laterali che il ginocchio incontrerà in partita.` },
          { text: `Contatti leggeri e contrasti controllati prima del rientro in gruppo`, cat: 'run', howTo: `Prova contrasti leggeri con un compagno, partendo da intensità bassa e aumentando gradualmente. Serve a verificare che il ginocchio tolleri una spinta laterale imprevista prima di tornare agli allenamenti di gruppo.` },
          { text: `Test di stabilità: affondo laterale controllato, valutando eventuale cedimento`, cat: 'balance', howTo: `Esegui un affondo laterale ampio, spostando il peso su una gamba alla volta e tornando al centro in modo controllato. Se senti il ginocchio cedere o instabile durante il movimento, non è ancora pronto per contrasti e cambi di direzione a piena intensità.` },
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
          { text: `Riduci temporaneamente salti e scale se scatenano dolore persistente`, cat: 'rest', howTo: `Se salti o scale lasciano dolore che dura più di 24 ore, riducili temporaneamente sostituendoli con alternative meno esplosive. L'obiettivo è restare sotto la soglia che infastidisce il tendine il giorno dopo, non eliminare ogni attività.` },
          { text: `Mantieni attività a basso impatto se tollerate (bici leggera)`, cat: 'rest', howTo: `Pedala a resistenza leggera mantenendo un buon numero di giri, così il tendine resta attivo senza il carico da impatto di corsa e salti. È un buon modo per non perdere condizione mentre riduci i gesti più esplosivi.` },
          { text: `Isometria del quadricipite: squat isometrico a parete (30-45 secondi, 4-5 volte)`, cat: 'hold', howTo: `Con la schiena contro un muro, scendi fino a un angolo del ginocchio di circa 60° e resta fermo 30-45 secondi, ripetendo 4-5 volte. Le contrazioni isometriche a questo carico spesso riducono il dolore del tendine rotuleo rapidamente ed sono un buon modo per allenare la forza senza il movimento che lo irrita.` },
          { text: `Applica ghiaccio dopo l'attività se il dolore persiste oltre le 24 ore`, cat: 'rest', howTo: `Se dopo un allenamento il dolore al tendine dura più del solito, applica ghiaccio per 15 minuti nelle ore successive. Non sostituisce la gestione del carico, ma aiuta a calmare la reazione infiammatoria acuta.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo del quadricipite, in particolare con esercizi lenti e controllati, è centrale per far tollerare di nuovo il carico al tendine.',
        criteriaToAdvance: ['Il dolore a riposo è assente o minimo', 'Lo squat isometrico non scatena dolore acuto'],
        exercises: [
          { text: `Squat lenti e controllati, aumenta gradualmente il carico (3 serie da 8-10, scendi lentamente in 3-4 secondi)`, cat: 'strength', howTo: `Scendi in accosciata contando mentalmente 3-4 secondi di discesa, poi risali in modo controllato, aumentando peso o profondità solo quando la serie precedente non ha lasciato dolore il giorno dopo. La fase lenta e controllata, più che il peso in sé, è ciò che fa tollerare di nuovo il carico al tendine.` },
          { text: `Leg extension a range parziale se disponibile (3 serie da 10-12)`, cat: 'strength', howTo: `Se hai accesso a un attrezzo per leg extension, lavora inizialmente nella parte di range meno dolorosa, di solito evitando l'estensione completa. Aumenta gradualmente range e carico seguendo sempre la regola del giorno dopo: se fa male il giorno successivo, hai aumentato troppo in fretta.` },
          { text: `Step-down controllati, scendere lentamente da un gradino (2-3 serie da 8-10 per gamba)`, cat: 'strength', howTo: `Da un gradino basso, scendi lentamente con la gamba interessata fino a sfiorare il pavimento con l'altro tallone, poi risali. Controlla che il ginocchio resti allineato con il piede durante la discesa, senza cadere verso l'interno.` },
          { text: `Stretching dolce del quadricipite dopo il carico`, cat: 'stretch', howTo: `In piedi, afferra la caviglia dietro di te e porta il tallone verso il gluteo, sentendo un leggero allungamento sulla parte anteriore della coscia. Fallo dopo gli esercizi di rinforzo, non prima: un tendine irritato tollera meglio lo stretching a muscolo già caldo.` },
          { text: `Affondo statico con enfasi sulla discesa controllata (2-3 serie da 8 per gamba)`, cat: 'strength', howTo: `Con un piede avanti e uno indietro, scendi lentamente piegando entrambe le ginocchia fino a un angolo comodo, poi risali spingendo con la gamba avanti. È un carico più vicino ai gesti di gara rispetto allo squat, utile come passaggio intermedio prima di salti e sprint.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Salti e atterraggi vanno reintrodotti per ultimi: sono i gesti che sollecitano di più il tendine rotuleo.',
        criteriaToAdvance: ['Riesci a fare squat a media profondità senza dolore significativo', 'Nessun peggioramento del dolore il giorno dopo'],
        exercises: [
          { text: `Salti bipodalici controllati, poi monopodalici`, cat: 'strength', howTo: `Inizia con piccoli salti a due piedi, atterrando in modo morbido e controllato, poi progredisci a salti su una gamba sola quando i primi non danno dolore. Il tendine rotuleo lavora moltissimo nell'atterraggio, quindi è qui che va testato con più gradualità.` },
          { text: `Corsa progressiva`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa, valutando sempre la risposta del tendine il giorno dopo, non solo durante. Un buon segnale è correre a intensità di gara senza dolore che dura oltre poche ore.` },
          { text: `Allenamento completo solo dopo assenza di dolore stabile da 1-2 settimane`, cat: 'run', howTo: `Torna agli allenamenti completi solo dopo 1-2 settimane in cui salti, corsa e cambi di direzione non hanno lasciato dolore il giorno dopo. Il tendine rotuleo è tra i più soggetti a ricadute se il rientro è affrettato, quindi vale la pena aspettare quel margine di sicurezza.` },
          { text: `Test di carico: salto in basso da un gradino, valutando il dolore il giorno dopo`, cat: 'strength', howTo: `Scendi da un gradino basso (15-20 cm) atterrando su entrambi i piedi in modo controllato, poi valuta il dolore al tendine nelle 24 ore successive. Se non c'è reazione, è un buon segnale che il tendine tollera il tipo di carico esplosivo richiesto in partita.` },
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
          { text: `Riduci temporaneamente torsioni, squat profondi e accovacciamenti`, cat: 'rest', howTo: `Evita nei primi giorni i movimenti che ruotano il ginocchio sotto carico, come accovacciarti per raccogliere qualcosa o girarti bruscamente con il piede fermo a terra. Sono proprio i gesti che possono irritare ulteriormente il menisco.` },
          { text: `Cammina nei limiti del dolore`, cat: 'rest', howTo: `Cammina alla tua andatura naturale finché il dolore lo permette, senza forzare per nascondere una leggera zoppia. Se il ginocchio inizia a bloccarsi o a cedere durante la camminata, fermati e valuta con un professionista prima di continuare.` },
          { text: `Contrazioni isometriche leggere del quadricipite (tenuta 20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Da seduto con la gamba tesa, contrai il quadricipite come per spingere il ginocchio verso il basso, tenendo 20-30 secondi. Mantenere tono muscolare in questa fase aiuta a proteggere l'articolazione anche mentre eviti carichi rotazionali.` },
          { text: `Ghiaccio ripetuto nelle prime 48 ore per contenere il gonfiore`, cat: 'rest', howTo: `Applica ghiaccio per 15-20 minuti ogni 2-3 ore nelle prime 48 ore, soprattutto se il ginocchio si gonfia visibilmente dopo il trauma. Un gonfiore che continua ad aumentare, invece di stabilizzarsi, è un segnale da far controllare da un professionista.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo di quadricipite e muscolatura circostante aiuta a stabilizzare il ginocchio e a distribuire meglio il carico sulla cartilagine residua.',
        criteriaToAdvance: ['Riesci a piegare e stendere completamente il ginocchio senza blocchi', 'Nessuna sensazione di cedimento nei movimenti quotidiani'],
        exercises: [
          { text: `Squat controllati in range limitato, senza dolore (2-3 serie da 10-12)`, cat: 'strength', howTo: `Scendi solo fino al punto in cui non senti dolore o blocco, aumentando la profondità gradualmente nell'arco delle settimane. Fermati subito se percepisci uno scatto doloroso: è diverso dalla normale tensione muscolare.` },
          { text: `Rinforzo degli ischiocrurali`, cat: 'strength', howTo: `Esegui il ponte a due gambe, poi a una gamba sola, spingendo attraverso il tallone per attivare la parte posteriore della coscia. Ischiocrurali forti aiutano a controllare la rotazione del ginocchio durante i cambi di direzione.` },
          { text: `Equilibrio su una gamba sola`, cat: 'balance', howTo: `Stai in equilibrio sulla gamba interessata per 20-30 secondi, con il ginocchio leggermente piegato e stabile. Una buona propriocezione riduce il rischio di torsioni accidentali che potrebbero ripetere il trauma iniziale.` },
          { text: `Mobilità attiva del ginocchio, senza forzare l'ultimo grado di flessione`, cat: 'stretch', howTo: `Piega ed estendi lentamente il ginocchio per tutto il range che riesci a raggiungere senza dolore, evitando di forzare gli ultimi gradi di flessione se provocano un blocco. Recuperare gradualmente il range è più sicuro che cercare di guadagnarlo tutto in una volta.` },
          { text: `Rinforzo del gluteo medio con elastico (2-3 serie da 15)`, cat: 'strength', howTo: `Con un elastico attorno alle caviglie, in piedi, allontana lateralmente una gamba alla volta mantenendo il bacino stabile. Un'anca forte controlla meglio la rotazione del ginocchio, riducendo il carico torsionale che arriva al menisco.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Cambi di direzione e torsioni vanno reintrodotti per ultimi: sono i movimenti che sollecitano di più il menisco.',
        criteriaToAdvance: ['Riesci a fare squat completi senza dolore o blocchi', 'Nessun gonfiore dopo attività più intense'],
        exercises: [
          { text: `Corsa progressiva`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza, restando su percorsi lineari all'inizio prima di introdurre curve o cambi di direzione. Valuta sempre la risposta del ginocchio nelle ore successive, non solo durante la corsa.` },
          { text: `Cambi di direzione graduali`, cat: 'run', howTo: `Parti da cambi di direzione ampi e lenti, restringendo l'angolo e aumentando la velocità solo quando quelli attuali non danno fastidio. Sono i cambi di direzione stretti e veloci a mettere più stress rotazionale sul menisco.` },
          { text: `Contrasti e torsioni controllate prima del rientro in gruppo`, cat: 'run', howTo: `Prova contrasti leggeri e piccole torsioni controllate con un compagno, aumentando gradualmente l'intensità. Serve a verificare che il ginocchio tolleri una sollecitazione rotazionale imprevista prima di tornare agli allenamenti completi.` },
          { text: `Test di squat completo con torsione leggera, valutando blocchi o dolore`, cat: 'balance', howTo: `Esegui uno squat completo e, in basso, ruota leggermente il busto da un lato mantenendo i piedi fermi. Se non compaiono blocchi, scatti dolorosi o cedimenti, è un buon segnale che il ginocchio tollera le sollecitazioni rotazionali tipiche del gioco.` },
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
          { text: `Riduci temporaneamente la corsa, specialmente in discesa, se scatena dolore persistente`, cat: 'rest', howTo: `Se la corsa, soprattutto in discesa, lascia un dolore che dura oltre la sessione, riducila temporaneamente o sostituiscila con percorsi pianeggianti. La discesa aumenta l'angolo di lavoro del ginocchio proprio nel punto dove la bandelletta è più sollecitata.` },
          { text: `Sostituisci con attività a basso impatto se tollerate (bici con sella alta)`, cat: 'rest', howTo: `Pedala con la sella alzata un po' più del solito, così il ginocchio lavora con un angolo di flessione meno ampio durante la pedalata. Molte persone con questo dolore tollerano bene la bici anche quando la corsa dà fastidio.` },
          { text: `Massaggio leggero o foam roller sulla coscia laterale, se disponibile`, cat: 'stretch', howTo: `Fai scorrere un foam roller lungo il lato esterno della coscia con pressione moderata, evitando di insistere direttamente sul punto più dolente vicino al ginocchio. Serve più a rilassare i tessuti attorno che a sciogliere la bandelletta stessa, che è molto poco elastica.` },
          { text: `Controlla l'usura delle scarpe e il volume di corsa recente`, cat: 'rest', howTo: `Guarda la suola delle scarpe da corsa e ripensa alle ultime settimane: un aumento improvviso di volume, un cambio di terreno o scarpe consumate sono le cause più comuni di questo dolore. Individuare la causa evita di ripetere lo stesso errore al rientro.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo dell\'anca, in particolare del gluteo medio, è centrale: una debolezza qui è tra le cause più comuni di questo tipo di dolore.',
        criteriaToAdvance: ['Riesci a camminare senza dolore laterale al ginocchio', 'La corsa leggera in piano non scatena dolore acuto'],
        exercises: [
          { text: `Rinforzo del gluteo medio: clamshell o abduzioni laterali (2-3 serie da 15)`, cat: 'strength', howTo: `Da sdraiato su un fianco, ginocchia piegate a 90°, apri il ginocchio superiore come una conchiglia mantenendo i piedi uniti. Un gluteo medio debole è la causa più comune di questo dolore, perché lascia il ginocchio cadere leggermente verso l'interno a ogni passo di corsa.` },
          { text: `Squat monopodalico controllato, range limitato (2-3 serie da 8-10)`, cat: 'strength', howTo: `Su una gamba sola, scendi in un mini-squat controllato mantenendo il ginocchio allineato con il piede, senza farlo cadere verso l'interno. Aumenta la profondità solo quando il movimento resta stabile e indolore.` },
          { text: `Stretching dolce della fascia laterale della coscia`, cat: 'stretch', howTo: `In piedi, incrocia la gamba dolente dietro l'altra e inclinati lateralmente dal lato opposto, sentendo un leggero allungamento lungo il fianco della coscia. La bandelletta è poco elastica, quindi lo stretching va inteso come mobilizzazione dolce dei tessuti attorno, non come un vero allungamento.` },
          { text: `Rinforzo degli abduttori d'anca in piedi con elastico (2-3 serie da 15 per lato)`, cat: 'strength', howTo: `Con un elastico attorno alle caviglie, in piedi su una gamba, allontana lateralmente l'altra gamba mantenendo il busto dritto e stabile. Rinforza lo stesso gruppo muscolare del clamshell ma in una posizione più simile alla corsa.` },
          { text: `Controllo del passo: aumenta leggermente la cadenza di corsa`, cat: 'run', howTo: `Prova a correre con passi leggermente più corti e frequenti invece che lunghi, il che spesso riduce l'oscillazione laterale del bacino a ogni falcata. Un piccolo aumento della cadenza è una delle strategie più efficaci per scaricare la bandelletta durante la corsa.` },
        ] },
      { name: 'Ritorno alla corsa', why: 'Le discese e i cambi di direzione vanno reintrodotti per ultimi: sono i movimenti che sollecitano di più la bandelletta.',
        criteriaToAdvance: ['Riesci a correre in piano senza dolore durante o dopo', 'Nessun dolore il giorno dopo un allenamento più lungo'],
        exercises: [
          { text: `Corsa progressiva in piano, poi introduci dolcemente le discese`, cat: 'run', howTo: `Ricomincia a correre solo su percorsi pianeggianti, aumentando gradualmente la distanza prima di reintrodurre le discese, che vanno inserite per ultime e in piccole quantità. Valuta sempre il dolore anche nelle ore successive alla corsa, non solo durante.` },
          { text: `Cambi di direzione graduali`, cat: 'run', howTo: `Introduci cambi di direzione partendo da angoli ampi e bassa velocità, aumentando gradualmente. Anche se la bandelletta è più legata alla corsa lineare ripetuta, i cambi di direzione vanno comunque reintrodotti con calma prima del rientro in gruppo.` },
          { text: `Ritorno agli allenamenti completi solo dopo assenza di dolore stabile`, cat: 'run', howTo: `Torna agli allenamenti completi solo dopo aver corso regolarmente per 1-2 settimane senza dolore che ricompare o peggiora il giorno dopo. La bandelletta tende a ripresentare lo stesso dolore se si aumenta il volume troppo in fretta.` },
          { text: `Test di carico: corsa in leggera discesa breve, valutando il dolore il giorno dopo`, cat: 'run', howTo: `Corri un breve tratto in leggera discesa a ritmo controllato, poi valuta il dolore laterale al ginocchio nelle 24 ore successive. Se non c'è reazione, è un buon segnale prima di tornare a percorsi con dislivelli più importanti.` },
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
          { text: `Riduci temporaneamente salti e sprint se scatenano dolore persistente`, cat: 'rest', howTo: `Se salti e sprint lasciano dolore che dura oltre la sessione, riducili temporaneamente senza smettere completamente l'attività sportiva. L'obiettivo in questa fase è restare sotto la soglia che scatena dolore importante, non fermarsi del tutto.` },
          { text: `Applica ghiaccio dopo l'attività se il dolore è presente`, cat: 'rest', howTo: `Applica ghiaccio sulla protuberanza sotto il ginocchio per 15 minuti dopo l'allenamento o la partita, se compare dolore. Aiuta a calmare l'infiammazione locale nella fase di crescita più attiva.` },
          { text: `Stretching dolce del quadricipite`, cat: 'stretch', howTo: `In piedi, afferra la caviglia dietro di te e porta il tallone verso il gluteo, sentendo un leggero allungamento sulla parte anteriore della coscia, senza forzare. Un quadricipite più elastico riduce la trazione diretta sul punto dolente sotto il ginocchio.` },
          { text: `Usa una ginocchiera a scarico (cinturino sottorotuleo) durante l'attività, se disponibile`, cat: 'rest', howTo: `Un cinturino elastico posizionato appena sotto la rotula, sopra il punto dolente, può ridurre la trazione diretta del tendine durante l'attività. Non è indispensabile, ma molti ragazzi lo trovano utile per allenarsi con meno fastidio.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo controllato del quadricipite, evitando carichi eccessivi sul tendine rotuleo, aiuta a tollerare meglio l\'attività sportiva nel frattempo.',
        criteriaToAdvance: ['Il dolore nelle attività quotidiane è lieve o assente', 'Riesci a fare stretching del quadricipite senza dolore acuto'],
        exercises: [
          { text: `Rinforzo isometrico del quadricipite (2-3 serie da 20-30 secondi)`, cat: 'hold', howTo: `Con la schiena contro un muro, scendi fino a un angolo comodo del ginocchio e resta fermo 20-30 secondi. Le contrazioni isometriche rinforzano senza il movimento ripetuto che irrita il punto di inserzione del tendine.` },
          { text: `Squat controllati in range limitato, senza dolore (2-3 serie da 10)`, cat: 'strength', howTo: `Scendi solo fino al punto in cui non senti dolore sotto il ginocchio, aumentando la profondità con molta calma nell'arco delle settimane. In questa condizione ha più senso restare cauti a lungo che accelerare i progressi.` },
          { text: `Stretching quotidiano di quadricipite e ischiocrurali`, cat: 'stretch', howTo: `Alterna lo stretching del quadricipite, tallone verso il gluteo, con quello degli ischiocrurali, gamba tesa e busto inclinato in avanti. Fatto quotidianamente, in molti casi riduce la tensione che tira sul tendine rotuleo durante la crescita.` },
          { text: `Rinforzo degli ischiocrurali con il ponte glutei`, cat: 'strength', howTo: `Esegui il ponte glutei, spingendo attraverso i talloni, per rinforzare la parte posteriore della coscia senza coinvolgere direttamente il tendine rotuleo. Una catena posteriore più forte aiuta a bilanciare il lavoro del quadricipite.` },
          { text: `Automassaggio leggero del quadricipite`, cat: 'stretch', howTo: `Con le mani o un rullo morbido, applica una pressione leggera sulla parte anteriore della coscia, evitando il punto dolente sotto il ginocchio. Aiuta a mantenere i tessuti più elastici durante le settimane di gestione del carico.` },
        ] },
      { name: 'Gestione del rientro', why: 'L\'obiettivo realistico è gestire i sintomi durante lo sport, non eliminarli del tutto finché la crescita non è completa.',
        criteriaToAdvance: ['Riesci ad allenarti senza dolore che peggiora nei giorni successivi', 'Il dolore non compare più a riposo'],
        exercises: [
          { text: `Corsa e salti reintrodotti gradualmente, monitorando la risposta il giorno dopo`, cat: 'run', howTo: `Reintroduci corsa e salti a intensità crescente, valutando sempre come si sente il ginocchio il giorno successivo, non solo durante l'attività. È il modo più affidabile per capire quanto carico il tendine sta davvero tollerando in questa fase della crescita.` },
          { text: `Riduci temporaneamente l'attività nei periodi di dolore più acuto`, cat: 'rest', howTo: `Nei periodi in cui il dolore aumenta, spesso in concomitanza con scatti di crescita, riduci temporaneamente il carico invece di insistere. È normale che l'intensità dei sintomi vari nel tempo finché la crescita è in corso.` },
          { text: `Parlane con un fisioterapista se il dolore limita spesso l'attività`, cat: 'rest', howTo: `Se il dolore condiziona spesso allenamenti e partite nonostante la gestione del carico, vale la pena farsi seguire da un fisioterapista per un programma su misura. Osgood-Schlatter si risolve quasi sempre da solo a fine crescita, ma un percorso guidato rende il periodo più gestibile.` },
          { text: `Comunica con allenatore e famiglia sul carico settimanale di allenamenti e partite`, cat: 'rest', howTo: `Parla con chi segue gli allenamenti per distribuire meglio il carico settimanale nei periodi di dolore più acuto, ad esempio riducendo qualche seduta invece di eliminarle tutte. Una comunicazione chiara evita sia il sovraccarico sia lo stop completo, spesso non necessario.` },
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
          { text: `Cammino leggero entro i limiti del dolore`, cat: 'rest', howTo: `Cammina alla tua andatura naturale, restando ben al di sotto della soglia di dolore, ed evita di allungare troppo il passo. Un passo più corto del solito riduce lo stiramento della parte posteriore della coscia a ogni falcata.` },
          { text: `Isometria leggera: da seduto, spingi il tallone contro il pavimento (tenuta 20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Da seduto con il ginocchio piegato, spingi il tallone contro il pavimento come per trascinarlo verso di te, senza che il piede si muova davvero. Tieni la contrazione 20-30 secondi: deve essere tensione controllata, mai una fitta nel punto esatto dello strappo.` },
          { text: `Evita stretching aggressivo in questi giorni`, cat: 'rest', howTo: `Nei primi giorni evita di allungare la parte posteriore della coscia fino a sentire tensione importante, anche se ti sembra che aiuterebbe a sciogliere il muscolo. Un muscolo appena strappato peggiora con l'allungamento eccessivo, non migliora.` },
          { text: `Ghiaccio nelle prime 48 ore, a intervalli di 15-20 minuti`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15-20 minuti, ripetendo ogni 2-3 ore nelle prime 48 ore. Aiuta a contenere gonfiore ed ematoma nella fase più acuta dello strappo.` },
        ] },
      { name: 'Recupero attivo', why: 'Gli hamstring hanno il tasso di recidiva più alto tra tutti gli strappi muscolari se il rientro è troppo affrettato. Si reintroduce gradualmente carico e allungamento.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare', 'L\'isometria leggera non scatena dolore acuto'],
        exercises: [
          { text: `Nordic curl assistito, range limitato all'inizio (2-3 serie da 5-6)`, cat: 'strength', howTo: `In ginocchio con qualcuno che ti blocca le caviglie, lasciati scendere in avanti molto lentamente, frenando il movimento con gli hamstring, e aiutati con le mani a terra quando non riesci più a controllarlo. È l'esercizio con più evidenze per ridurre il rischio di ricaduta, ma va introdotto con un range di movimento ridotto all'inizio.` },
          { text: `Ponte glutei/hamstring, bridge (3 serie da 12-15)`, cat: 'strength', howTo: `Sdraiato supino con le ginocchia piegate, spingi attraverso i talloni per sollevare il bacino, stringendo glutei e hamstring in alto. Aumenta la difficoltà passando a una gamba sola quando la versione a due gambe non dà più fastidio.` },
          { text: `Stretching dolce e progressivo, mai fino al dolore acuto`, cat: 'stretch', howTo: `Allunga la parte posteriore della coscia con la gamba tesa appoggiata su un rialzo basso, piegandoti in avanti finché senti una tensione leggera, mai dolore. Aumenta l'ampiezza molto gradualmente nell'arco dei giorni, senza forzare per recuperare tempo.` },
          { text: `Rinforzo eccentrico leggero`, cat: 'strength', howTo: `Usa esercizi come lo slider leg curl o il leg curl su macchina, enfatizzando la fase di allungamento controllato del muscolo sotto carico. Il lavoro eccentrico è quello che più prepara gli hamstring a tollerare lo sprint senza ricadere.` },
          { text: `Rinforzo con leg curl su macchina o resistenza elastica, se disponibile`, cat: 'strength', howTo: `Se hai accesso a una macchina per leg curl o a un elastico agganciato alla caviglia, esegui il movimento di flessione del ginocchio contro resistenza in modo controllato. Aggiunge un carico più specifico rispetto al solo bridge, utile prima di tornare a correre.` },
        ] },
      { name: 'Rientro in campo', why: 'Gli hamstring lavorano ad alta velocità nello sprint: vanno riportati a tollerare quella velocità in modo graduale.',
        criteriaToAdvance: ['Riesci a fare il ponte glutei senza dolore', 'Lo stretching dolce provoca solo tensione normale, non dolore acuto'],
        exercises: [
          { text: `Jog leggero → corsa media → sprint al 70% → sprint pieno`, cat: 'run', howTo: `Progredisci attraverso questi quattro livelli di intensità solo quando il precedente non ha lasciato dolore né durante né il giorno dopo. Saltare un gradino, soprattutto passando troppo presto allo sprint pieno, è la causa più comune di ricaduta negli hamstring.` },
          { text: `Accelerazioni e decelerazioni controllate`, cat: 'run', howTo: `Esegui accelerazioni progressive su 20-30 metri, prestando attenzione anche alla fase di decelerazione, spesso trascurata ma altrettanto impegnativa per gli hamstring. Aumenta l'intensità solo quando ogni ripetizione risulta fluida e senza esitazione.` },
          { text: `Sprint al 100% senza dolore prima di tornare in partita`, cat: 'run', howTo: `Esegui alcuni sprint a velocità massima su terreno regolare prima di considerarti pronto per la partita, valutando la risposta del muscolo anche nelle 24-48 ore successive. È l'ultimo vero test: la partita chiederà esattamente questo tipo di sforzo, spesso senza preavviso.` },
          { text: `Test di velocità: sprint progressivi con recupero completo tra le ripetute`, cat: 'run', howTo: `Esegui 4-6 sprint brevi e progressivi, dal 70% al 100% della velocità massima, recuperando completamente tra una ripetuta e l'altra. Un recupero incompleto affatica il muscolo e rende il test meno affidabile per capire se è davvero pronto.` },
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
          { text: `Cammino leggero entro i limiti del dolore`, cat: 'rest', howTo: `Cammina alla tua andatura naturale restando ben al di sotto della soglia di dolore, evitando falcate lunghe che allungano eccessivamente il quadricipite. Se noti anche solo una lieve zoppia, accorcia il passo.` },
          { text: `Isometria leggera del quadricipite, senza movimento (tenuta 20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Da seduto con la gamba tesa, contrai il quadricipite come per spingere il ginocchio verso il basso, senza muovere l'articolazione. Tieni 20-30 secondi: deve essere tensione muscolare controllata, mai una fitta nel punto dello strappo.` },
          { text: `Evita calci e sprint in questi giorni`, cat: 'rest', howTo: `Nei primi giorni evita qualsiasi gesto esplosivo come calciare o scattare, anche a bassa intensità. Il quadricipite lavora eccentricamente in questi gesti, proprio il tipo di sforzo che può riaprire una micro-lesione recente.` },
          { text: `Ghiaccio nelle prime 48 ore, a intervalli di 15-20 minuti`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15-20 minuti, ripetendo ogni 2-3 ore nelle prime 48 ore. Aiuta a limitare gonfiore ed ematoma nella parte anteriore della coscia.` },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce gradualmente carico e allungamento controllato del quadricipite.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare', 'L\'isometria del quadricipite non scatena dolore acuto'],
        exercises: [
          { text: `Squat controllati in range limitato, aumenta gradualmente (2-3 serie da 10-12)`, cat: 'strength', howTo: `Scendi solo fino al punto in cui non senti tensione nel punto dello strappo, aumentando la profondità gradualmente nell'arco dei giorni. Risali sempre in modo controllato, senza spingere di scatto.` },
          { text: `Stretching dolce, mai fino al dolore acuto`, cat: 'stretch', howTo: `In piedi, afferra la caviglia dietro di te e porta il tallone verso il gluteo, sentendo una tensione leggera sulla parte anteriore della coscia, mai dolore acuto. Aumenta l'ampiezza molto gradualmente nei giorni successivi.` },
          { text: `Rinforzo progressivo con resistenza leggera (2-3 serie da 12-15)`, cat: 'strength', howTo: `Usa un elastico attorno alla caviglia o un peso leggero alla caviglia per eseguire estensioni del ginocchio da seduto, aumentando il carico solo quando la serie precedente non ha lasciato dolore. Procedi con incrementi piccoli piuttosto che con salti importanti di carico.` },
          { text: `Mobilità dell'anca in flessione, senza forzare`, cat: 'stretch', howTo: `Da sdraiato, porta lentamente il ginocchio verso il petto aiutandoti con le mani, senza forzare l'ultimo tratto se compare tensione sulla parte anteriore della coscia. Recuperare la mobilità dell'anca facilita anche il movimento del quadricipite durante la corsa.` },
          { text: `Rinforzo eccentrico leggero: discesa controllata da uno step basso`, cat: 'strength', howTo: `Da un gradino basso, scendi lentamente con la gamba interessata controllando la discesa con il quadricipite, poi risali con l'altra gamba. La fase di discesa, lenta e controllata, è quella che meglio prepara il muscolo allo sforzo dello sprint.` },
        ] },
      { name: 'Rientro in campo', why: 'Il quadricipite è centrale in ogni calcio e scatto: va riportato a tollerare quello sforzo gradualmente.',
        criteriaToAdvance: ['Riesci a fare squat in range limitato senza dolore significativo', 'Nessun peggioramento il giorno dopo l\'allenamento'],
        exercises: [
          { text: `Corsa progressiva`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa, valutando la risposta del muscolo sia durante che nelle ore successive. Un buon segnale è correre a media intensità senza dolore che compare o peggiora dopo.` },
          { text: `Calci a bassa intensità, poi progressivi`, cat: 'strength', howTo: `Inizia calciando un pallone fermo a intensità ridotta, aumentando gradualmente la forza del gesto. Il calcio richiede una rapida estensione del ginocchio che sollecita il quadricipite in modo simile allo sprint, quindi va reintrodotto con la stessa gradualità.` },
          { text: `Cambi di ritmo prima del rientro in gruppo`, cat: 'run', howTo: `Alterna tratti a ritmo blando con brevi accelerazioni controllate, valutando come risponde la coscia nelle ore successive. Serve a verificare che il muscolo tolleri le variazioni di intensità tipiche di un allenamento di gruppo.` },
          { text: `Test di potenza: salti in leggera progressione, valutando dolore il giorno dopo`, cat: 'strength', howTo: `Esegui alcuni salti bipodalici controllati, poi monopodalici sulla gamba interessata, valutando il dolore nelle 24 ore successive. I salti richiedono al quadricipite uno sforzo esplosivo simile a quello di un contrasto o di un cambio di direzione in partita.` },
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
          { text: `Ghiaccio a intervalli nelle prime 24–48 ore, mai a contatto diretto con la pelle`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15-20 minuti, ripetendo ogni 2-3 ore nelle prime 24-48 ore. Il contatto diretto del ghiaccio sulla pelle può causare ustioni da freddo, quindi usa sempre un panno come barriera.` },
          { text: `Evita stretching e massaggi energici: possono peggiorare il sanguinamento interno`, cat: 'rest', howTo: `Nei primi giorni evita di allungare o massaggiare energicamente la zona colpita, anche se sembra sciogliere la tensione. In una contusione il sanguinamento interno è ancora in corso, e questi gesti possono aumentarlo invece di aiutare.` },
          { text: `Cammino leggero se ben tollerato`, cat: 'rest', howTo: `Cammina alla tua andatura naturale se il dolore lo permette, senza forzare per nascondere una zoppia evidente. Il movimento leggero, a differenza del riposo assoluto, favorisce il riassorbimento del gonfiore quando è ben tollerato.` },
          { text: `Bendaggio compressivo nelle prime 24-48 ore, se disponibile`, cat: 'rest', howTo: `Un bendaggio elastico applicato con una compressione moderata, non stretta al punto da intorpidire l'arto, aiuta a limitare l'espansione del sanguinamento interno nelle prime ore. Allentalo se noti formicolio, gonfiore oltre la fasciatura o cambio di colore della pelle.` },
        ] },
      { name: 'Recupero attivo', why: 'Passata la fase acuta, si reintroduce movimento e carico in modo dolce, senza mai forzare sul dolore.',
        criteriaToAdvance: ['Il gonfiore acuto è stabile o in diminuzione, non più in aumento', 'Riesci a muovere l\'articolazione vicina senza dolore acuto'],
        exercises: [
          { text: `Mobilità dolce e progressiva della zona colpita`, cat: 'stretch', howTo: `Muovi lentamente l'articolazione più vicina alla contusione per tutto il range che il dolore permette, senza forzare. Recuperare la mobilità gradualmente riduce il rischio di rigidità residua nella zona.` },
          { text: `Rinforzo leggero quando il dolore lo permette (2 serie da 12-15)`, cat: 'strength', howTo: `Introduci un rinforzo leggero del muscolo colpito solo quando i movimenti quotidiani non provocano più dolore acuto, aumentando il carico molto gradualmente. Fermati se compare una fitta localizzata, diversa dalla normale fatica muscolare.` },
          { text: `Stretching gentile, mai forzato`, cat: 'stretch', howTo: `Allunga dolcemente il muscolo colpito fino a sentire una tensione leggera, mai dolore, tenendo la posizione 15-20 secondi. Con una contusione importante lo stretching va introdotto con più cautela che con un semplice indolenzimento muscolare.` },
          { text: `Rinforzo isometrico leggero del muscolo colpito (tenuta 15-20 secondi)`, cat: 'hold', howTo: `Contrai il muscolo colpito contro una resistenza leggera senza muovere l'articolazione, tenendo 15-20 secondi. È un modo sicuro per riattivare il muscolo prima di passare a esercizi dinamici con movimento.` },
        ] },
      { name: 'Rientro in campo', why: 'Le contusioni importanti alla coscia hanno un rischio di miosite ossificante se il rientro è troppo affrettato.',
        criteriaToAdvance: ['Riesci a fare stretching gentile della zona senza dolore acuto', 'La forza sta tornando, anche se non ancora completa'],
        exercises: [
          { text: `Corsa progressiva`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa, valutando la risposta della zona colpita anche nelle ore successive, non solo durante. Fermati se compare una sensazione di tensione localizzata diversa dalla normale fatica.` },
          { text: `Contatti leggeri e controllati prima del rientro in allenamento di gruppo`, cat: 'run', howTo: `Prova contatti leggeri con un compagno, partendo da intensità bassa, proprio nella zona che ha subito il trauma. Serve a verificare che tolleri un nuovo urto controllato prima di tornare agli allenamenti completi.` },
          { text: `Cambi di direzione e contrasti leggeri`, cat: 'run', howTo: `Introduci cambi di direzione e piccoli contrasti a intensità crescente, valutando sempre la risposta della zona colpita. Le contusioni alla coscia in particolare traggono beneficio da un rientro al gioco molto graduale.` },
          { text: `Test di forza: confronta la forza tra le due gambe prima del rientro completo`, cat: 'strength', howTo: `Confronta la forza e la sensazione di sforzo tra la gamba colpita e quella sana in un esercizio semplice come lo squat su una gamba. Una differenza ancora evidente è un segnale per continuare a rinforzare prima di tornare a pieno regime, soprattutto per il rischio di miosite ossificante in caso di rientro troppo affrettato.` },
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
          { text: `Cammino leggero entro i limiti del dolore`, cat: 'rest', howTo: `Cammina alla tua andatura naturale finché il dolore lo permette, senza forzare il passo per nascondere una leggera zoppia. Se ti accorgi di zoppicare, accorcia le passeggiate per qualche giorno.` },
          { text: `Isometria leggera: spingi la punta del piede contro una resistenza, senza muoverla (tenuta 20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Siediti e spingi la punta del piede contro una resistenza ferma (un muro, la mano di qualcuno) senza che il piede si muova davvero. Tieni la spinta 20-30 secondi respirando normalmente: deve essere tensione, mai dolore acuto nel punto esatto dello strappo.` },
          { text: `Evita punte di velocità e salti in questi giorni`, cat: 'rest', howTo: `Nei primi giorni evita qualsiasi gesto che richieda un'accelerazione improvvisa o un salto, anche se il dolore a riposo è già basso: sono proprio i gesti esplosivi che causano questo tipo di strappo e possono farlo peggiorare.` },
          { text: `Ghiaccio nelle prime 48 ore, 15-20 minuti a intervalli`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno sottile per 15-20 minuti, ripetendo ogni 2-3 ore nelle prime 24-48 ore. Aiuta a contenere gonfiore e dolore nella fase più acuta, poi il beneficio si riduce.` },
          { text: `Isometria leggera anche a ginocchio piegato`, cat: 'hold', howTo: `Ripeti la stessa isometria della punta del piede ma con il ginocchio piegato invece che teso. Il polpaccio ha due parti — una che lavora di più a ginocchio teso, una a ginocchio piegato — ed è utile allenarle entrambe fin da subito, con carico leggero.` },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce il carico sul tricipite surale in modo progressivo, prima assistito poi a corpo libero.',
        criteriaToAdvance: ['Riesci a camminare senza zoppicare', 'L\'isometria leggera non scatena dolore acuto'],
        exercises: [
          { text: `Calf raises assistiti con supporto, poi a corpo libero (3 serie da 12-15)`, cat: 'strength', howTo: `Sollevati sulle punte aiutandoti con le mani su un supporto, riducendo l'appoggio man mano che il dolore lo permette, fino ad arrivare a farlo senza aiuto. Fermati se senti una fitta acuta nel punto esatto dello strappo, non solo tensione muscolare generale.` },
          { text: `Stretching dolce del polpaccio, mai fino al dolore acuto`, cat: 'stretch', howTo: `In piedi davanti a un muro, gamba infortunata dietro con tallone a terra, piegati in avanti finché senti un leggero allungamento, mai dolore. Con uno strappo vero è facile esagerare: vai più piano che con un semplice indolenzimento muscolare.` },
          { text: `Cammino in leggera salita`, cat: 'strength', howTo: `Cammina su un percorso in leggera pendenza o un tapis roulant inclinato: il polpaccio lavora con un carico maggiore ma controllato rispetto al piano. Aumenta la pendenza solo quando quella attuale non dà dolore.` },
          { text: `Calf raises eccentrici su una gamba, quando il carico base è ben tollerato`, cat: 'strength', howTo: `Sali sulle punte con entrambe le gambe, poi scendi lentamente sulla sola gamba infortunata in 3-4 secondi. È il passaggio che prepara il muscolo a tollerare gli sforzi improvvisi dello sprint.` },
          { text: `Equilibrio sulla gamba infortunata, 20-30 secondi`, cat: 'balance', howTo: `Stai in equilibrio sulla gamba infortunata mentre il polpaccio si rinforza col resto del programma. Un muscolo che ha subito uno strappo spesso perde anche un po' di coordinazione, non solo forza, e vale la pena riallenarla apposta.` },
        ] },
      { name: 'Rientro in campo', why: 'Il polpaccio è decisivo in ogni scatto: va riportato a tollerare quello sforzo prima di rientrare in gruppo.',
        criteriaToAdvance: ['Riesci a fare calf raises assistiti senza dolore significativo', 'Nessun peggioramento il giorno dopo'],
        exercises: [
          { text: `Corsa progressiva: jog leggero → media intensità → sprint`, cat: 'run', howTo: `Passa da jog leggero a corsa a media intensità solo quando la fase precedente non lascia dolore il giorno dopo, e riserva lo sprint pieno come ultimo gradino, non come primo test.` },
          { text: `Salti sul posto, poi in movimento`, cat: 'strength', howTo: `Inizia con piccoli salti sul posto a due piedi, poi progredisci a salti spostandoti in avanti o lateralmente. Il polpaccio lavora in modo esplosivo nei salti, quindi è un buon banco di prova prima dello sprint.` },
          { text: `Cambi di ritmo controllati prima del rientro in gruppo`, cat: 'run', howTo: `Alterna tratti a velocità moderata con brevi accelerazioni, decelerando in modo controllato invece di fermarti di colpo. Sono spesso le decelerazioni, più che le accelerazioni, a mettere sotto stress il polpaccio.` },
          { text: `Test di carico: 4-6 accelerazioni progressive dal 60% all'80% della velocità massima`, cat: 'run', howTo: `Fai 4-6 accelerazioni brevi e progressive, dal 60% all'80% della velocità massima, valutando la risposta del polpaccio il giorno dopo. Se non c'è dolore residuo, puoi considerarlo pronto per il rientro in gruppo.` },
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
          { text: `Riduci temporaneamente volume e intensità della corsa se il dolore persiste il giorno dopo`, cat: 'rest', howTo: `Se il dolore lungo la tibia persiste il giorno dopo la corsa, riduci temporaneamente il volume settimanale del 30-50% invece di continuare allo stesso ritmo. Il segnale del giorno dopo è più affidabile del dolore durante la corsa stessa.` },
          { text: `Sostituisci parte degli allenamenti con attività a basso impatto (bici, nuoto) se tollerate`, cat: 'rest', howTo: `Sostituisci una o due sedute di corsa con bici o nuoto, mantenendo l'allenamento cardiovascolare senza l'impatto ripetuto sulla tibia. Torna gradualmente alla corsa quando il dolore a riposo è assente.` },
          { text: `Stretching dolce del polpaccio`, cat: 'stretch', howTo: `In piedi davanti a un muro, gamba dietro con tallone a terra, piegati in avanti finché senti un leggero allungamento nel polpaccio. Un polpaccio rigido tira di più sulla tibia a ogni passo, quindi allungarlo aiuta a scaricare la zona dolente.` },
          { text: `Automassaggio leggero lungo il bordo interno della tibia`, cat: 'stretch', howTo: `Con le dita o un rullo piccolo, applica una pressione leggera lungo il bordo interno della tibia, evitando il punto più dolente se è acuto al tocco. Serve più a rilassare i tessuti attorno che a far sparire il dolore da solo.` },
          { text: `Controlla l'usura delle scarpe da corsa`, cat: 'rest', howTo: `Guarda la suola delle tue scarpe da corsa: un'usura marcatamente asimmetrica o più di 500-600 km percorsi spesso contribuisce a questo tipo di sovraccarico. Non serve sempre cambiarle, ma vale la pena controllare.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo dei muscoli della gamba, in particolare tibiale anteriore e polpaccio, aiuta ad assorbire meglio l\'impatto ripetuto e riduce il rischio di ricadute.',
        criteriaToAdvance: ['Il dolore a riposo è assente', 'Riesci a camminare senza dolore che peggiora nelle ore successive'],
        exercises: [
          { text: `Rinforzo del tibiale anteriore: sollevamento della punta del piede (2-3 serie da 15-20)`, cat: 'strength', howTo: `Siediti con la gamba tesa e solleva solo la punta del piede verso di te, mantenendo il tallone a terra, poi torna giù lentamente. È il muscolo davanti alla tibia, spesso trascurato rispetto al polpaccio, ed è centrale in questo tipo di dolore.` },
          { text: `Calf raises progressivi (3 serie da 12-15)`, cat: 'strength', howTo: `Sollevati sulle punte con entrambe le gambe, poi progredisci su una gamba sola quando è ben tollerato. Un polpaccio più forte assorbe meglio l'impatto della corsa, alleggerendo il carico che arriva alla tibia.` },
          { text: `Esercizi propriocettivi su una gamba`, cat: 'balance', howTo: `Stai in equilibrio su una gamba sola per 20-30 secondi, poi prova su una superficie leggermente instabile (un cuscino, l'erba). Una buona stabilità di caviglia e piede cambia il modo in cui il carico arriva alla tibia a ogni passo.` },
          { text: `Rinforzo del gluteo medio: clamshell o abduzioni laterali (2-3 serie da 15)`, cat: 'strength', howTo: `Anche se il dolore è alla tibia, un'anca debole cambia la meccanica di tutta la gamba durante la corsa. Da sdraiato su un fianco, ginocchia piegate a 90°, apri il ginocchio superiore come una conchiglia mantenendo i piedi uniti.` },
          { text: `Step-down controllato, mantenendo il ginocchio allineato`, cat: 'strength', howTo: `Da un gradino basso, scendi lentamente con la gamba interessata mantenendo il ginocchio allineato con il piede, senza farlo cadere verso l'interno. Ti aiuta a controllare meglio l'impatto ripetuto che la corsa scarica sulla tibia.` },
        ] },
      { name: 'Ritorno alla corsa', why: 'Il volume di corsa va reintrodotto molto gradualmente: un aumento troppo rapido è la causa più comune di ricaduta in questo infortunio.',
        criteriaToAdvance: ['Riesci a correre a bassa intensità senza dolore durante o dopo', 'Nessun dolore il giorno successivo a un allenamento più lungo'],
        exercises: [
          { text: `Corsa progressiva, aumenta il volume settimanale con calma (non più del 10% circa)`, cat: 'run', howTo: `Aumenta il volume settimanale di corsa di non più del 10% circa rispetto alla settimana precedente. Un aumento troppo rapido, anche se il dolore sembrava sparito, è la causa più comune di ricaduta in questo infortunio.` },
          { text: `Alterna superfici morbide quando possibile nelle prime settimane`, cat: 'run', howTo: `Quando possibile, corri su erba o terra battuta invece che su asfalto nelle prime settimane di ripresa. Riduce l'impatto ripetuto mentre il tessuto attorno alla tibia si riadatta al carico.` },
          { text: `Protocollo corsa-cammino se riprendi dopo una pausa lunga`, cat: 'run', howTo: `Alterna tratti di corsa leggera e cammino (ad esempio 2 minuti corsa, 1 minuto cammino) invece di correre in modo continuo, aumentando la quota di corsa settimana dopo settimana. È un modo più graduale di reintrodurre il volume rispetto a correre subito senza interruzioni.` },
          { text: `Ritorno agli allenamenti completi solo dopo assenza di dolore stabile`, cat: 'run', howTo: `Torna agli allenamenti completi solo dopo almeno 1-2 settimane di corsa regolare senza dolore che ricompare o peggiora il giorno dopo. Una singola buona sessione non garantisce che il tessuto abbia davvero recuperato.` },
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
          { text: `Riduci temporaneamente corsa e salti se scatenano dolore persistente`, cat: 'rest', howTo: `Se corsa o salti scatenano un dolore che resta anche dopo, riducili temporaneamente, in particolare su superfici dure come asfalto o cemento. Cammina normalmente se ben tollerato: non serve fermarsi del tutto.` },
          { text: `Fai rotolare dolcemente un oggetto rotondo sotto il piede`, cat: 'stretch', howTo: `Siediti e fai rotolare una pallina da tennis o una bottiglia d'acqua fredda sotto la pianta del piede per 1-2 minuti, con una pressione morbida. La bottiglia fredda aggiunge anche un piccolo effetto calmante sull'infiammazione.` },
          { text: `Stretching del polpaccio, spesso collegato alla tensione della fascia`, cat: 'stretch', howTo: `In piedi davanti a un muro, gamba dietro con tallone a terra, piegati in avanti finché senti un leggero allungamento nel polpaccio. La fascia plantare è collegata al tricipite surale, quindi un polpaccio più elastico scarica anche la pianta del piede.` },
          { text: `Stretching specifico della fascia: tira le dita del piede verso di te da seduto`, cat: 'stretch', howTo: `Da seduto, accavalla la gamba e tira le dita del piede verso di te con la mano, sentendo un allungamento sotto la pianta. È lo stretching più mirato per la fascia plantare, utile anche ripetuto più volte al giorno.` },
          { text: `Evita di camminare scalzo su superfici dure nei primi giorni`, cat: 'rest', howTo: `Cammina con scarpe comode o pantofole con un minimo di ammortizzazione anche in casa, evitando superfici dure a piedi nudi. Il primo carico della giornata è spesso il più fastidioso, e un po' di ammortizzazione fin dai primi passi aiuta.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo dei muscoli intrinseci del piede e del polpaccio aiuta la fascia plantare a tollerare meglio il carico.',
        criteriaToAdvance: ['Il dolore al primo passo del mattino è chiaramente diminuito', 'Riesci a camminare senza dolore significativo'],
        exercises: [
          { text: `Rinforzo dei muscoli del piede: raccogli un asciugamano con le dita (2-3 serie)`, cat: 'strength', howTo: `Siediti con un asciugamano steso a terra sotto il piede, e usa solo le dita per raggrinzirlo e tirarlo verso di te. Rinforza i piccoli muscoli della pianta che sostengono la fascia dall'interno.` },
          { text: `Calf raises progressivi (3 serie da 12-15)`, cat: 'strength', howTo: `Sollevati sulle punte con entrambe le gambe, poi progredisci su una gamba sola quando è ben tollerato. Un polpaccio e un tendine d'Achille più forti riducono la tensione trasmessa alla fascia plantare.` },
          { text: `Stretching della fascia prima di alzarti dal letto al mattino`, cat: 'stretch', howTo: `Prima di appoggiare il piede a terra, accavalla la gamba mentre sei ancora a letto e tira le dita verso di te per 20-30 secondi. Il dolore al primo passo è tipico di questa fascite, e allungarla prima di scendere dal letto spesso lo riduce in modo netto.` },
          { text: `Raccolta di biglie o tappi con le dita del piede (2-3 minuti)`, cat: 'strength', howTo: `Siediti con alcune biglie o tappi di bottiglia a terra, e usa le dita del piede per raccoglierli uno alla volta e spostarli in un contenitore. Rinforza gli stessi piccoli muscoli dell'esercizio con l'asciugamano, in modo più vario.` },
          { text: `Calf raises eccentrici su una gamba, quando il carico base non dà dolore`, cat: 'strength', howTo: `Sali sulle punte con entrambe le gambe, poi scendi lentamente sulla gamba interessata in 3-4 secondi. Rinforza tendine d'Achille e polpaccio insieme, entrambi collegati alla tensione della fascia plantare.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Corsa e salti vanno reintrodotti gradualmente: la fascia plantare risponde bene al carico progressivo ma male agli aumenti improvvisi.',
        criteriaToAdvance: ['Riesci a correre leggero senza dolore durante o dopo', 'Nessun dolore al mattino dopo un allenamento'],
        exercises: [
          { text: `Corsa progressiva su superfici non troppo dure`, cat: 'run', howTo: `Riprendi a correre su erba o terra battuta piuttosto che su asfalto, aumentando la distanza gradualmente. Le superfici più dure trasmettono più impatto diretto alla pianta del piede a ogni passo.` },
          { text: `Salti e scatti introdotti per ultimi`, cat: 'run', howTo: `Reintroduci prima la corsa leggera, poi accelerazioni brevi, e lascia salti e scatti a piena intensità come ultimo passaggio. Sono i gesti che caricano di più la fascia plantare in un singolo istante.` },
          { text: `Test di carico: 15-20 minuti tra camminata e corsa leggera, valuta il giorno dopo`, cat: 'run', howTo: `Fai una sessione di prova di 15-20 minuti tra camminata veloce e corsa leggera, poi valuta il dolore al risveglio del giorno dopo. Se il dolore al primo passo del mattino non è peggiorato, puoi aumentare gradualmente la sessione successiva.` },
          { text: `Valuta calzature con un buon supporto dell'arco durante il recupero`, cat: 'rest', howTo: `Durante il recupero, scegli scarpe con un buon supporto dell'arco plantare invece di suole completamente piatte o infradito. Non serve necessariamente un plantare su misura, ma una scarpa che sostenga l'arco fa una differenza reale.` },
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
          { text: `Riduci i movimenti che scatenano dolore (calci, cambi di direzione bruschi)`, cat: 'rest', howTo: `Evita nei primi giorni i gesti che scatenano dolore in modo netto, in particolare calciare con forza e cambiare direzione bruscamente. Non serve immobilità totale, solo evitare i movimenti che riproducono il dolore acuto.` },
          { text: `Isometria leggera: da sdraiato, schiaccia dolcemente un cuscino tra le ginocchia (tenuta 15-20 secondi, 4-5 volte)`, cat: 'hold', howTo: `Sdraiato supino con le ginocchia piegate, metti un cuscino tra le ginocchia e schiaccialo dolcemente per 15-20 secondi. Attiva gli adduttori senza il movimento dinamico che potrebbe irritare la zona inguinale in questa fase.` },
          { text: `Cammino nei limiti del dolore`, cat: 'rest', howTo: `Cammina alla tua andatura naturale finché il dolore lo permette, evitando passi troppo ampi che allungano eccessivamente l'inguine. Se senti dolore netto, accorcia il passo invece di fermarti del tutto.` },
          { text: `Ghiaccio sulla zona inguinale nei primi giorni, a intervalli`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sulla zona dolente, ripetendo alcune volte al giorno nei primi giorni. Aiuta a contenere l'infiammazione mentre inizi a muoverti con più libertà.` },
        ] },
      { name: 'Recupero attivo', why: 'La pubalgia tende a cronicizzare se il rientro è affrettato — è tra gli infortuni dove la pazienza conta di più: qui il rinforzo va aumentato con calma, insieme alla stabilità del bacino.',
        criteriaToAdvance: ['Riesci a camminare senza dolore evidente', 'L\'isometria leggera degli adduttori non scatena dolore acuto'],
        exercises: [
          { text: `Rinforzo isometrico degli adduttori, intensità crescente (3-4 serie da 8-10 tenute)`, cat: 'strength', howTo: `Con una palla morbida o un cuscino tra le ginocchia, aumenta gradualmente la forza con cui schiacci rispetto alla fase precedente, tenendo ogni contrazione 8-10 secondi. La pubalgia risponde bene a un carico isometrico che cresce con calma nel tempo, più che a incrementi rapidi.` },
          { text: `Stretching dolce degli adduttori`, cat: 'stretch', howTo: `Seduto con le piante dei piedi unite e le ginocchia aperte verso l'esterno, lascia che il peso delle gambe porti dolcemente le ginocchia verso il basso, senza spingere con le mani. Fermati appena senti una tensione leggera nella zona inguinale.` },
          { text: `Esercizi di stabilità del bacino e del core (2-3 serie da 30-45 secondi)`, cat: 'strength', howTo: `Esegui un plank frontale o laterale mantenendo bacino e colonna allineati, senza far cadere i fianchi. Un core stabile riduce lo stress che si scarica sugli adduttori durante calci e cambi di direzione.` },
          { text: `Adduzione dell'anca con elastico, controllata (2-3 serie da 12-15)`, cat: 'strength', howTo: `Con un elastico agganciato a un punto fisso e attorno alla caviglia, porta la gamba interessata verso il centro del corpo contro la resistenza, in modo controllato. Aggiunge un carico dinamico più specifico rispetto alla sola isometria con il cuscino.` },
          { text: `Copenhagen plank, versione facilitata con appoggio sul ginocchio`, cat: 'hold', howTo: `Di lato, con la gamba superiore appoggiata su un rialzo come una panca e il ginocchio della gamba inferiore a terra come appoggio, solleva il bacino mantenendolo allineato. È uno degli esercizi con più evidenze per prevenire le ricadute della pubalgia, da introdurre in versione facilitata prima della versione completa.` },
        ] },
      { name: 'Rientro in campo', why: 'Calci, sprint e cambi di direzione laterali vanno reintrodotti per ultimi: sono i gesti che sollecitano di più questa zona.',
        criteriaToAdvance: ['Riesci a fare rinforzo isometrico a intensità moderata senza dolore', 'Nessun peggioramento il giorno dopo — qui affrettarsi rischia di più'],
        exercises: [
          { text: `Cambi di direzione progressivi`, cat: 'run', howTo: `Parti da cambi di direzione ampi e a bassa velocità, restringendo l'angolo e aumentando la velocità solo quando quelli attuali non danno fastidio. La pubalgia è tra gli infortuni dove affrettare questo passaggio comporta il rischio maggiore di cronicizzare.` },
          { text: `Calci a bassa intensità, poi progressivi`, cat: 'strength', howTo: `Inizia calciando un pallone fermo a intensità ridotta, aumentando gradualmente la forza del gesto. Il calcio sollecita gli adduttori in modo diretto, quindi va reintrodotto con più cautela rispetto ad altri gesti.` },
          { text: `Sprint e accelerazioni laterali prima del rientro in gruppo`, cat: 'run', howTo: `Esegui sprint lineari e accelerazioni con cambio laterale a intensità crescente, valutando la risposta della zona inguinale anche il giorno dopo. Sono gli ultimi gesti da reintrodurre prima di tornare agli allenamenti completi.` },
          { text: `Test di carico: adduzione isometrica a piena intensità, valutando il dolore`, cat: 'hold', howTo: `Esegui la contrazione isometrica degli adduttori con la massima forza che riesci a esprimere, tenendo 8-10 secondi, e valuta se compare dolore. Se il test è negativo, è un buon segnale prima di tornare a calci e cambi di direzione a piena intensità.` },
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
          { text: `Riduci calci e movimenti di flessione dell'anca ripetuti`, cat: 'rest', howTo: `Evita nei primi giorni calci e movimenti che portano il ginocchio verso il petto con forza, come rincorse o scatti con partenza da fermo. Sono i gesti che sollecitano di più il flessore dell'anca appena stirato.` },
          { text: `Isometria leggera: solleva il ginocchio verso il petto contro una leggera resistenza (tenuta 15-20 secondi, 4-5 volte)`, cat: 'hold', howTo: `Da seduto, solleva il ginocchio verso il petto mentre con la mano opponi una leggera resistenza, tenendo la contrazione 15-20 secondi. Deve essere una tensione controllata, mai una fitta nel punto dello stiramento.` },
          { text: `Cammino nei limiti del dolore`, cat: 'rest', howTo: `Cammina alla tua andatura naturale finché il dolore lo permette, evitando di allungare troppo il passo all'indietro, movimento che estende l'anca e allunga il flessore. Se compare dolore netto, accorcia il passo.` },
          { text: `Ghiaccio sulla parte anteriore dell'anca nei primi giorni`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sulla parte anteriore dell'anca, ripetendo alcune volte al giorno. Aiuta a contenere l'infiammazione nella fase più acuta dello stiramento.` },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce gradualmente il movimento di flessione dell\'anca sotto carico controllato.',
        criteriaToAdvance: ['Riesci a camminare senza dolore evidente', 'L\'isometria leggera non scatena dolore acuto'],
        exercises: [
          { text: `Rinforzo progressivo del flessore dell'anca con elastico (2-3 serie da 12-15)`, cat: 'strength', howTo: `Con un elastico agganciato alla caviglia, solleva il ginocchio verso il petto contro la resistenza, in modo controllato. Aumenta la resistenza dell'elastico solo quando la serie attuale non lascia dolore il giorno dopo.` },
          { text: `Stretching dolce, mai forzato`, cat: 'stretch', howTo: `In affondo, con il ginocchio posteriore a terra, spingi dolcemente il bacino in avanti finché senti un leggero allungamento sulla parte anteriore dell'anca della gamba posteriore. Fermati alla prima sensazione di tensione, senza cercare di guadagnare range a ogni sessione.` },
          { text: `Esercizi di stabilità del bacino (2-3 serie da 30-45 secondi)`, cat: 'strength', howTo: `Esegui un plank frontale mantenendo il bacino allineato con la colonna, senza inarcare la zona lombare. Un bacino stabile riduce il carico che si scarica sul flessore dell'anca durante corsa e calci.` },
          { text: `Mobilità dell'anca in estensione, da sdraiato`, cat: 'stretch', howTo: `Sdraiato a pancia in giù, solleva lentamente una gamba tesa di pochi centimetri dal suolo e poi riabbassala, senza inarcare la schiena. Recuperi così il movimento di estensione dell'anca, opposto a quello di flessione lavorato con il rinforzo, in modo bilanciato.` },
          { text: `Rinforzo del core, in particolare degli addominali profondi`, cat: 'strength', howTo: `Esegui il dead bug: sdraiato supino con braccia e ginocchia sollevate a 90°, estendi lentamente un braccio e la gamba opposta mantenendo la zona lombare a contatto con il pavimento. Un core forte stabilizza il bacino, riducendo il lavoro compensatorio richiesto al flessore dell'anca.` },
        ] },
      { name: 'Rientro in campo', why: 'Il calcio al pallone e lo sprint richiedono al flessore dell\'anca di lavorare velocemente: va riportato a tollerare quella velocità gradualmente.',
        criteriaToAdvance: ['Riesci a fare il rinforzo con elastico senza dolore significativo', 'Nessun peggioramento il giorno dopo'],
        exercises: [
          { text: `Calci a bassa intensità, poi progressivi`, cat: 'strength', howTo: `Inizia calciando un pallone fermo a intensità ridotta, aumentando gradualmente la forza del gesto. Il calcio richiede una rapida flessione dell'anca, il movimento esatto coinvolto nello stiramento iniziale.` },
          { text: `Corsa progressiva con affondo del ginocchio`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa, prestando attenzione alla fase in cui il ginocchio si solleva in avanti a ogni falcata. È il momento del gesto in cui il flessore dell'anca lavora di più.` },
          { text: `Sprint e cambi di ritmo prima del rientro in gruppo`, cat: 'run', howTo: `Esegui sprint e variazioni di ritmo a intensità crescente, valutando la risposta dell'anca anche nelle ore successive. Sono gli ultimi gesti da reintrodurre prima di tornare agli allenamenti completi.` },
          { text: `Test di potenza: calcio a pieno sforzo su pallone fermo, valutando il dolore il giorno dopo`, cat: 'strength', howTo: `Calcia un pallone fermo con la massima forza che ti senti di esprimere, poi valuta il dolore all'anca nelle 24 ore successive. Se non c'è reazione, è un buon segnale che il flessore tollera lo sforzo esplosivo richiesto in partita.` },
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
          { text: `Riduci temporaneamente stare seduto a lungo o correre se scatenano dolore`, cat: 'rest', howTo: `Se stare seduto a lungo o correre scatenano il dolore che scende lungo la gamba, riduci temporaneamente queste attività senza eliminarle del tutto. L'obiettivo è restare sotto la soglia che irrita il nervo sciatico compresso dal muscolo.` },
          { text: `Stretching dolce: da sdraiato, porta il ginocchio verso il petto e leggermente verso il lato opposto (tenuta 20-30 secondi, 3-4 volte)`, cat: 'stretch', howTo: `Sdraiato supino, porta il ginocchio della gamba dolente verso il petto e poi leggermente verso la spalla opposta, sentendo un allungamento profondo nel gluteo. Tieni la posizione 20-30 secondi: è uno degli stretching più diretti per il muscolo piriforme.` },
          { text: `Ghiaccio nei momenti più dolorosi`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sulla zona del gluteo nei momenti in cui il dolore è più intenso. Non risolve la causa ma aiuta a gestire i picchi di fastidio nella fase iniziale.` },
          { text: `Alterna la posizione da seduto con pause in piedi ogni 30-45 minuti`, cat: 'rest', howTo: `Se il tuo lavoro o le lezioni ti tengono seduto a lungo, alzati e cammina qualche minuto ogni 30-45 minuti. Stare seduti a lungo comprime direttamente il piriforme contro il nervo sciatico, spesso la causa principale di questo dolore.` },
        ] },
      { name: 'Recupero attivo', why: 'Il rinforzo dei glutei e la mobilità dell\'anca aiutano a scaricare il piriforme dal lavoro eccessivo che spesso lo irrita.',
        criteriaToAdvance: ['Il dolore che scende lungo la gamba è chiaramente diminuito', 'Riesci a stare seduto per periodi normali senza dolore che peggiora'],
        exercises: [
          { text: `Rinforzo del gluteo medio con elastico (2-3 serie da 15 per lato)`, cat: 'strength', howTo: `Con un elastico attorno alle caviglie, in piedi, allontana lateralmente una gamba alla volta mantenendo il busto stabile. Un gluteo medio più forte riduce il lavoro di compenso richiesto al piriforme durante la corsa.` },
          { text: `Stretching della muscolatura glutea e dell'anca`, cat: 'stretch', howTo: `Da seduto, accavalla la caviglia della gamba dolente sopra il ginocchio opposto e piegati in avanti mantenendo la schiena dritta, sentendo l'allungamento nel gluteo. È una variante dello stretching del piriforme comoda da fare anche seduti a una scrivania.` },
          { text: `Auto-massaggio con pallina o rullo sulla zona, se tollerato`, cat: 'stretch', howTo: `Siediti su una pallina da tennis o da lacrosse posizionata sotto il gluteo dolente, spostando lentamente il peso per trovare i punti più tesi. Mantieni una pressione tollerabile: deve essere una sensazione di rilascio, non un dolore acuto che si irradia lungo la gamba.` },
          { text: `Rinforzo del gluteo massimo con ponte a una gamba`, cat: 'strength', howTo: `Sdraiato supino con le ginocchia piegate, solleva il bacino spingendo attraverso il tallone di una gamba sola, mantenendo l'altra sollevata. Un gluteo massimo forte lavora insieme al gluteo medio per scaricare il piriforme dal lavoro eccessivo.` },
          { text: `Mobilità dell'anca in rotazione, da seduto`, cat: 'stretch', howTo: `Seduto con le ginocchia piegate a 90°, ruota dolcemente le gambe da un lato all'altro mantenendo i piedi a terra, come un tergicristallo. Migliora la mobilità rotazionale dell'anca, spesso limitata quando il piriforme è irritato.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Corsa e cambi di direzione vanno reintrodotti gradualmente, mantenendo il rinforzo dei glutei per evitare che il piriforme torni a sovraccaricarsi.',
        criteriaToAdvance: ['Riesci a correre leggero senza dolore che scende lungo la gamba', 'Nessun peggioramento dopo attività quotidiane più intense'],
        exercises: [
          { text: `Corsa progressiva`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa, valutando se il dolore lungo la gamba resta assente anche nelle ore successive. Interrompi se il formicolio o il dolore ricompaiono durante la corsa stessa.` },
          { text: `Cambi di direzione graduali`, cat: 'run', howTo: `Introduci cambi di direzione partendo da angoli ampi e bassa velocità, aumentando gradualmente. Il piriforme lavora nella rotazione dell'anca, quindi questo tipo di movimento va reintrodotto con attenzione.` },
          { text: `Mantieni il rinforzo dei glutei anche dopo la scomparsa del dolore, per prevenire ricadute`, cat: 'strength', howTo: `Continua gli esercizi di rinforzo del gluteo medio e massimo anche quando il dolore è ormai assente, magari con una frequenza ridotta di mantenimento. La sindrome del piriforme tende a ripresentarsi se si abbandona il rinforzo non appena i sintomi migliorano.` },
          { text: `Test di carico: corsa a media intensità con curve, valutando il dolore lungo la gamba`, cat: 'run', howTo: `Corri a media intensità includendo alcune curve, poi valuta se compare dolore o formicolio lungo la gamba durante o dopo. Se il test è negativo, è un buon segnale prima di tornare ad allenamenti completi con cambi di direzione più frequenti.` },
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
          { text: `Evita di dormire sul lato dolente per qualche notte`, cat: 'rest', howTo: `Dormi sul fianco sano o supino, eventualmente con un cuscino tra le ginocchia se dormi su un fianco, per evitare di comprimere direttamente la borsa infiammata. Il dolore notturno da pressione diretta è uno dei sintomi più tipici di questa condizione.` },
          { text: `Riduci temporaneamente corsa e scale se scatenano dolore`, cat: 'rest', howTo: `Se corsa o scale scatenano dolore sul fianco esterno dell'anca, riducili temporaneamente sostituendoli con attività meno ripetitive come la bici. Non serve fermarsi del tutto, solo restare sotto la soglia che infastidisce la borsa.` },
          { text: `Ghiaccio sulla zona esterna dell'anca, a intervalli`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sulla parte esterna dell'anca, ripetendo alcune volte al giorno nei momenti più dolorosi. Aiuta a calmare l'infiammazione della borsa nella fase iniziale.` },
          { text: `Evita di stare troppo a lungo con le gambe accavallate o in piedi su un solo lato`, cat: 'rest', howTo: `Evita di accavallare le gambe per periodi lunghi o di stare in piedi appoggiato principalmente su un fianco, posizioni che comprimono la banda ileotibiale contro la borsa. Piccoli cambi di abitudine quotidiana spesso riducono l'irritazione più di quanto ci si aspetti.` },
        ] },
      { name: 'Rinforzo progressivo', why: 'Il rinforzo del gluteo medio è centrale: un\'anca debole in quella zona fa lavorare di più la borsa a ogni passo.',
        criteriaToAdvance: ['Riesci a stare sdraiato sul fianco senza dolore acuto', 'Il dolore camminando è chiaramente diminuito'],
        exercises: [
          { text: `Rinforzo del gluteo medio: sollevamento gamba laterale (2-3 serie da 15 per lato)`, cat: 'strength', howTo: `Sdraiato su un fianco con le gambe tese, solleva la gamba superiore mantenendo il bacino stabile, senza ruotarlo indietro. Un gluteo medio forte è la difesa principale contro il sovraccarico che irrita questa borsa a ogni passo.` },
          { text: `Stretching della banda ileotibiale`, cat: 'stretch', howTo: `In piedi, incrocia la gamba dolente dietro l'altra e inclinati lateralmente dal lato opposto, sentendo un allungamento lungo il fianco. La banda ileotibiale passa proprio sopra la borsa trocanterica, quindi mantenerla elastica riduce l'attrito.` },
          { text: `Cammino su superficie piana, aumenta gradualmente la distanza`, cat: 'rest', howTo: `Cammina su terreno piano aumentando la distanza gradualmente di giorno in giorno, evitando per ora percorsi con salite o discese ripetute. Una progressione lenta dà tempo alla borsa di adattarsi al carico ripetuto.` },
          { text: `Clamshell con elastico (2-3 serie da 15 per lato)`, cat: 'strength', howTo: `Sdraiato su un fianco con le ginocchia piegate e un elastico sopra le ginocchia, apri il ginocchio superiore come una conchiglia mantenendo i piedi uniti. Rinforza il gluteo medio con un angolo leggermente diverso rispetto al sollevamento gamba laterale, utile per lavorare il muscolo in modo più completo.` },
          { text: `Rinforzo del gluteo massimo con ponte a due gambe`, cat: 'strength', howTo: `Sdraiato supino con le ginocchia piegate, solleva il bacino spingendo attraverso i talloni, stringendo i glutei in alto. Un gluteo massimo forte lavora insieme al gluteo medio per stabilizzare l'anca e alleggerire la borsa dal sovraccarico.` },
        ] },
      { name: 'Ritorno allo sport', why: 'Corsa e salti vanno reintrodotti con calma, mantenendo il rinforzo dell\'anca per evitare che il sovraccarico si ripresenti.',
        criteriaToAdvance: ['Riesci a correre leggero senza dolore sul fianco', 'Nessun dolore dopo attività quotidiane più intense'],
        exercises: [
          { text: `Corsa progressiva`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa su terreno piano, valutando se il dolore sul fianco resta assente anche nelle ore successive. Introduci dislivelli solo più avanti, quando la corsa in piano non dà più fastidio.` },
          { text: `Salti e cambi di direzione introdotti per ultimi`, cat: 'run', howTo: `Reintroduci salti e cambi di direzione solo dopo che la corsa lineare non dà più dolore, aumentando gradualmente l'intensità. Sono i movimenti che caricano di più lateralmente l'anca e la borsa trocanterica.` },
          { text: `Mantieni il rinforzo del gluteo medio anche dopo la scomparsa del dolore`, cat: 'strength', howTo: `Continua gli esercizi per il gluteo medio anche quando il dolore è scomparso, con una frequenza di mantenimento di due volte a settimana. Questa borsite tende a ripresentarsi se l'anca torna a lavorare senza un adeguato supporto muscolare.` },
          { text: `Test di carico: sali e scendi le scale a ritmo normale, valutando il dolore sul fianco`, cat: 'run', howTo: `Sali e scendi una rampa di scale a ritmo normale, senza rallentare per proteggerti, e valuta se compare dolore sul fianco esterno. Se il test è negativo, è un buon segnale prima di tornare a corsa e allenamenti completi senza restrizioni.` },
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
          { text: `Cammino nei limiti del dolore, evita torsioni`, cat: 'rest', howTo: `Cammina alla tua andatura naturale, evitando di ruotare il ginocchio verso l'interno per cambiare direzione. Se senti dolore sul lato esterno durante un passo, accorcia il percorso per qualche giorno.` },
          { text: `Elevazione della gamba quando possibile`, cat: 'rest', howTo: `Quando sei seduto o sdraiato, appoggia la gamba su un cuscino così il ginocchio resta più in alto del cuore. Ripetuto più volte al giorno aiuta a contenere il gonfiore nella fase iniziale.` },
          { text: `Contrazioni isometriche leggere del quadricipite (tenuta 20-30 secondi, 3-4 volte)`, cat: 'hold', howTo: `Da seduto con la gamba tesa, contrai il quadricipite come per spingere il ginocchio verso il basso, tenendo la contrazione 20-30 secondi senza muovere l'articolazione. Mantiene tono muscolare senza sollecitare il legamento in via di guarigione.` },
          { text: `Ghiaccio sul lato esterno del ginocchio nei primi giorni`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15-20 minuti, ripetendo ogni 2-3 ore nelle prime 48 ore, concentrandoti sul lato esterno del ginocchio. Aiuta a contenere gonfiore e dolore nella fase più acuta.` },
        ] },
      { name: 'Recupero attivo', why: 'Si reintroduce movimento e carico controllato, senza ancora sollecitare il ginocchio con stress verso l\'interno.',
        criteriaToAdvance: ['Riesci a camminare senza sensazione di cedimento del ginocchio', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: `Squat controllati in range limitato (2-3 serie da 10)`, cat: 'strength', howTo: `Scendi solo fino al punto in cui non senti tensione sul lato esterno del ginocchio, mantenendo le ginocchia allineate con i piedi. Aumenta la profondità gradualmente, settimana dopo settimana.` },
          { text: `Rinforzo di quadricipite e ischiocrurali (2-3 serie da 12)`, cat: 'strength', howTo: `Alterna leg extension a range parziale per il quadricipite e ponte a una gamba per gli ischiocrurali, così il ginocchio è sostenuto da entrambi i lati. Procedi solo quando la serie precedente non ha lasciato dolore.` },
          { text: `Equilibrio su una gamba sola, senza torsioni`, cat: 'balance', howTo: `Stai in equilibrio sulla gamba interessata per 20-30 secondi, con il ginocchio leggermente piegato e stabile, senza lasciarlo ruotare verso l'esterno. Riallena direttamente la stabilità che il legamento collaterale normalmente fornisce.` },
          { text: `Rinforzo del gluteo medio con elastico (2-3 serie da 15)`, cat: 'strength', howTo: `Con un elastico attorno alle caviglie, in piedi, allontana lateralmente una gamba alla volta mantenendo il busto stabile. Un'anca forte controlla meglio il ginocchio nei movimenti laterali, alleggerendo il carico sul legamento collaterale laterale.` },
          { text: `Mobilità attiva del ginocchio, flessione ed estensione complete`, cat: 'stretch', howTo: `Da seduto sul bordo di una sedia, piega ed estendi lentamente il ginocchio per tutto il range disponibile, senza forzare se l'ultimo grado è doloroso. Recuperare la mobilità completa prima di aggiungere carico riduce compensi scorretti più avanti.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare ai contrasti e ai cambi di direzione, il ginocchio deve tollerare stress laterali senza cedere.',
        criteriaToAdvance: ['Riesci a fare squat senza dolore sul lato esterno del ginocchio', 'Nessuna instabilità percepita nei movimenti quotidiani'],
        exercises: [
          { text: `Cambi di direzione progressivi, partendo da angoli ampi`, cat: 'run', howTo: `Inizia con cambi di direzione ampi e a bassa velocità, restringendo l'angolo solo quando quello attuale non dà fastidio. Gli angoli stretti verso l'interno sono quelli che sollecitano di più il lato esterno del ginocchio.` },
          { text: `Corsa con curve controllate`, cat: 'run', howTo: `Corri descrivendo curve ampie in entrambe le direzioni, aumentando gradualmente la strettezza. Riproduce in modo controllato le sollecitazioni laterali che il ginocchio incontrerà in partita.` },
          { text: `Contatti leggeri e contrasti controllati prima del rientro in gruppo`, cat: 'run', howTo: `Prova contrasti leggeri con un compagno, partendo da intensità bassa e aumentando gradualmente. Verifica che il ginocchio tolleri una spinta laterale imprevista prima di tornare agli allenamenti di gruppo.` },
          { text: `Test di stabilità: affondo laterale controllato, valutando eventuale cedimento`, cat: 'balance', howTo: `Esegui un affondo laterale ampio, spostando il peso su una gamba alla volta e tornando al centro in modo controllato. Se percepisci il ginocchio cedere durante il movimento, non è ancora pronto per contrasti a piena intensità.` },
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
          { text: `Stretching dolce e prolungato del muscolo colpito`, cat: 'stretch', howTo: `Allunga lentamente il muscolo contratto, tenendo la posizione finché la contrazione non si allenta, di solito 20-30 secondi o più. Non forzare con uno strappo improvviso: un allungamento lento è più efficace su un crampo in corso.` },
          { text: `Massaggio leggero della zona`, cat: 'stretch', howTo: `Con le mani, applica una pressione leggera e progressiva sul muscolo contratto, senza premere con forza sul punto più duro. Un massaggio delicato aiuta a favorire il rilassamento insieme allo stretching.` },
          { text: `Idratazione, possibilmente con acqua e sali minerali`, cat: 'rest', howTo: `Bevi acqua, idealmente con l'aggiunta di sali minerali o una bevanda isotonica se disponibile. La disidratazione e lo squilibrio di sodio e potassio sono tra i fattori più comuni dietro un crampo a fine partita.` },
          { text: `Cammina lentamente per aiutare il muscolo a rilassarsi`, cat: 'rest', howTo: `Dopo lo stretching iniziale, cammina lentamente per qualche minuto invece di restare fermo o sederti subito. Il movimento leggero aiuta il muscolo a tornare al suo stato normale più rapidamente della sola immobilità.` },
        ] },
      { name: 'Nelle ore successive', why: 'Dopo un crampo il muscolo può restare leggermente indolenzito — è normale, ma vale la pena andarci piano prima di tornare a sforzi intensi.',
        criteriaToAdvance: ['Il muscolo non è più dolente al tocco', 'Riesci a muoverti normalmente senza tensione residua'],
        exercises: [
          { text: `Stretching leggero, senza forzare`, cat: 'stretch', howTo: `Nelle ore successive, ripeti uno stretching leggero del muscolo colpito, fermandoti alla prima sensazione di tensione. Il muscolo può restare sensibile per un po' dopo il crampo, quindi va trattato con più delicatezza del solito.` },
          { text: `Cammino normale, attività leggera`, cat: 'rest', howTo: `Riprendi le normali attività quotidiane a intensità leggera, evitando sforzi intensi nelle ore immediatamente successive al crampo. Il muscolo di solito torna alla normalità rapidamente, ma vale la pena dargli qualche ora di margine.` },
          { text: `Reintegra liquidi e sali minerali nelle ore successive`, cat: 'rest', howTo: `Continua a bere regolarmente nelle ore successive, non solo nel momento del crampo, per ripristinare l'equilibrio di liquidi e sali minerali. Una singola bevuta abbondante è meno efficace di un'idratazione distribuita nel tempo.` },
          { text: `Osserva se il crampo si ripete nella stessa zona`, cat: 'rest', howTo: `Nei giorni successivi, presta attenzione a eventuali segnali di tensione ricorrente nella stessa zona, come una sensazione di indurimento durante l'attività. Riconoscere il pattern in anticipo permette di intervenire prima che si trasformi in un nuovo crampo.` },
        ] },
      { name: 'Prevenzione per la prossima volta', why: 'I crampi spesso si ripetono se non si affronta la causa — quasi sempre una combinazione di fatica, caldo, e idratazione insufficiente nei giorni prima della partita, non solo durante.',
        criteriaToAdvance: ['Ti senti completamente normale, nessuna tensione residua'],
        exercises: [
          { text: `Idratati regolarmente nei giorni prima della partita, non solo durante`, cat: 'rest', howTo: `Bevi regolarmente nei due o tre giorni prima della partita, non solo nelle ore immediatamente precedenti. Un'idratazione costruita nei giorni prima è più efficace di un recupero last-minute.` },
          { text: `Rinforzo e stretching regolare dei muscoli più soggetti`, cat: 'strength', howTo: `Dedica una parte della settimana al rinforzo e allo stretching regolare del muscolo che tende a darti crampi, anche fuori dai periodi di gara. Un muscolo più forte e più abituato al carico tende a sviluppare crampi con minore frequenza.` },
          { text: `Attenzione al carico di allenamento nei giorni caldi`, cat: 'rest', howTo: `Nei giorni particolarmente caldi, riduci leggermente l'intensità degli allenamenti o aumenta la frequenza delle pause per bere. Il caldo aumenta la perdita di liquidi e sali minerali attraverso il sudore, favorendo i crampi.` },
          { text: `Valuta il carico di allenamento complessivo delle ultime settimane, non solo il giorno della partita`, cat: 'rest', howTo: `Ripensa al carico di allenamento delle ultime settimane: un affaticamento accumulato nel tempo predispone ai crampi tanto quanto la singola partita. Se noti che capitano spesso, vale la pena parlarne con chi segue la preparazione fisica.` },
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
          { text: `Copri con un cerotto specifico o una benda, senza stringere troppo`, cat: 'rest', howTo: `Applica un cerotto per vesciche o una benda morbida sulla zona, senza stringere troppo per non aumentare l'attrito. Un buon cerotto specifico riduce ulteriore sfregamento e protegge la pelle già irritata.` },
          { text: `Evita di forare la vescica se non necessario`, cat: 'rest', howTo: `Se la vescica non è troppo grande o dolorosa, lasciala intatta: la pelle sopra protegge da infezioni meglio di qualsiasi bendaggio. Se è molto grande e tesa, valuta con un professionista se drenarla in modo sterile, senza rimuovere la pelle superiore.` },
          { text: `Cambia le calzature se sono la causa, quando possibile`, cat: 'rest', howTo: `Se noti che la vescica si è formata per una scarpa nuova o non ben allacciata, cambia calzatura per i prossimi allenamenti finché non guarisce. Continuare con la stessa causa di attrito rallenta la guarigione e rischia di aggravare la zona.` },
          { text: `Se la vescica si rompe da sola, disinfetta con delicatezza`, cat: 'rest', howTo: `Se la vescica si rompe da sola, pulisci delicatamente la zona con un disinfettante non aggressivo e copri con una garza pulita. Evita di rimuovere completamente la pelle residua, che protegge ancora la zona sottostante mentre guarisce.` },
        ] },
      { name: 'Nei giorni successivi', why: 'La pelle guarisce da sola in pochi giorni se protetta bene — il rischio vero è l\'infezione, non il dolore in sé.',
        criteriaToAdvance: ['La zona non è più arrossata o infiammata', 'Nessun segno di infezione: pus, calore, rossore che si allarga'],
        exercises: [
          { text: `Mantieni la zona pulita e coperta`, cat: 'rest', howTo: `Cambia il cerotto o la benda ogni giorno, o prima se si sporca o si bagna, mantenendo la zona pulita e asciutta. Una medicazione pulita riduce nettamente il rischio di infezione.` },
          { text: `Osserva segni di infezione: rossore che si allarga, calore, pus`, cat: 'rest', howTo: `Controlla ogni giorno che il rossore non si estenda oltre l'area iniziale e che non compaiano calore locale o secrezione di pus. Se noti questi segni, è il momento di farla valutare da un medico invece di continuare a gestirla da solo.` },
          { text: `Usa calzature comode finché non guarisce`, cat: 'rest', howTo: `Scegli scarpe comode e ben ammortizzate per le attività quotidiane finché la pelle non è guarita, evitando quelle che hai identificato come causa. Dare tempo alla pelle di rigenerarsi senza pressione diretta accelera la guarigione.` },
          { text: `Applica una crema o pomata cicatrizzante se disponibile`, cat: 'rest', howTo: `Una volta che la fase più delicata è passata, una crema cicatrizzante o idratante può aiutare la pelle nuova a formarsi in modo più elastico. Non è indispensabile, ma molte persone la trovano utile nella fase finale di guarigione.` },
        ] },
      { name: 'Prevenzione', why: 'Le vesciche si ripetono facilmente se non si cambia qualcosa — scarpe, calze, o la zona di attrito.',
        criteriaToAdvance: ['La pelle è guarita completamente'],
        exercises: [
          { text: `Prova calze tecniche senza cuciture spesse`, cat: 'rest', howTo: `Scegli calze tecniche da corsa, senza cuciture spesse nei punti che ti hanno dato fastidio, magari in un tessuto che riduce l'umidità. L'attrito tra pelle e calza umida è tra le cause più comuni di vesciche ricorrenti.` },
          { text: `Rodaggio graduale delle scarpe nuove, non usarle subito per una partita intera`, cat: 'rest', howTo: `Indossa le scarpe nuove per allenamenti brevi prima di usarle in una partita intera, lasciando che si adattino gradualmente al piede. Un rodaggio troppo rapido è tra le cause più frequenti di vesciche con calzature nuove.` },
          { text: `Cerotti preventivi sulle zone più soggette, se sai già dove`, cat: 'rest', howTo: `Se sai già quali punti del piede tendono a formare vesciche, applica un cerotto preventivo prima di allenamenti o partite lunghe. Prevenire nel punto esatto è più efficace che intervenire dopo che si è già formata.` },
          { text: `Applica un lubrificante o talco antiattrito nelle zone a rischio prima della partita`, cat: 'rest', howTo: `Prima di allenamenti o partite lunghe, applica un lubrificante specifico o un talco antiattrito nelle zone più soggette a sfregamento. Riduce l'attrito diretto tra pelle, calza e scarpa, soprattutto in condizioni di caldo o sudorazione intensa.` },
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
          { text: `Cammina a passo leggero più volte al giorno, quanto tollerato`, cat: 'rest', howTo: `Fai brevi camminate a passo leggero più volte al giorno, invece di una sola camminata lunga o di restare fermo. Il movimento frequente e moderato aiuta la colonna a restare mobile senza sovraccaricarla.` },
          { text: `Evita di stare seduto o a letto per periodi troppo lunghi: alterna le posizioni`, cat: 'rest', howTo: `Cambia posizione ogni 20-30 minuti circa, alternando seduto, in piedi e cammino, invece di restare fermo a lungo in una sola posizione. Una posizione statica prolungata, anche a letto, tende a far aumentare la rigidità lombare più che a farla riposare.` },
          { text: `Mobilità lombare dolce da sdraiato (flessione/estensione del bacino), senza forzare`, cat: 'stretch', howTo: `Sdraiato supino con le ginocchia piegate, inclina dolcemente il bacino in avanti e indietro, appiattendo e poi inarcando leggermente la zona lombare contro il pavimento. Muoviti in un range piccolo e confortevole, senza cercare la massima ampiezza nei primi giorni.` },
          { text: `Applica calore locale se lo trovi più confortevole del ghiaccio`, cat: 'rest', howTo: `Prova una borsa dell'acqua calda o un termoforo sulla zona lombare per 15-20 minuti, se lo trovi più rilassante del ghiaccio. Per il dolore lombare muscolare non c'è una regola fissa: usa quello che senti alleviare di più la tensione.` },
        ] },
      { name: 'Recupero attivo', why: 'Il rinforzo del core e della muscolatura lombare aiuta a stabilizzare la colonna e riduce il rischio di episodi futuri — è la parte che fa la differenza nel lungo periodo, più della fase acuta stessa.',
        criteriaToAdvance: ['Riesci a stare seduto o in piedi per periodi normali senza dolore che peggiora', 'Riesci a fare la mobilità dolce senza dolore acuto'],
        exercises: [
          { text: `Plank a ginocchia appoggiate, poi progressione a plank completo (2-3 serie da 20-30 secondi)`, cat: 'strength', howTo: `Inizia in plank con le ginocchia a terra, mantenendo schiena e bacino allineati senza inarcare la zona lombare, poi progredisci al plank completo sulle punte dei piedi quando la versione facilitata non dà fastidio. Un core stabile è la base per proteggere la colonna durante ogni gesto sportivo.` },
          { text: `Bird-dog: da carponi, estendi braccio e gamba opposti (2-3 serie da 8-10 per lato)`, cat: 'strength', howTo: `A quattro zampe, estendi contemporaneamente un braccio e la gamba opposta, mantenendo il bacino fermo e la colonna neutra senza ruotare. Se il bacino oscilla, riduci l'ampiezza del movimento: la stabilità conta più della distanza raggiunta.` },
          { text: `Stretching dolce di ischiocrurali e flessori dell'anca`, cat: 'stretch', howTo: `Alterna lo stretching degli ischiocrurali, gamba tesa su un rialzo basso e busto inclinato in avanti, con quello dei flessori dell'anca in affondo. Muscoli tesi in queste zone aumentano spesso il carico che arriva alla zona lombare durante corsa e calci.` },
          { text: `Rinforzo dei glutei con il ponte a due gambe`, cat: 'strength', howTo: `Sdraiato supino con le ginocchia piegate, solleva il bacino spingendo attraverso i talloni, stringendo i glutei in alto senza inarcare eccessivamente la schiena. Glutei forti alleggeriscono il lavoro di compenso richiesto alla zona lombare.` },
          { text: `Cat-camel: mobilità della colonna a quattro zampe`, cat: 'stretch', howTo: `A quattro zampe, inarca dolcemente la schiena verso l'alto come un gatto spaventato, poi lasciala scendere verso il basso in un movimento fluido e lento. È un ottimo modo per mantenere la colonna mobile mentre costruisci forza con gli altri esercizi.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a scatti, contrasti e cambi di direzione, la colonna deve tollerare carichi asimmetrici e rotazioni senza scatenare dolore.',
        criteriaToAdvance: ['Riesci a fare rinforzo del core senza dolore lombare', 'Nessun peggioramento dopo attività quotidiane più intense'],
        exercises: [
          { text: `Rinforzo progressivo del core con esercizi rotazionali controllati`, cat: 'strength', howTo: `Introduci esercizi come la torsione con elastico o il colpo di ascia a bassa resistenza, controllando il movimento senza mai forzare sulla rotazione. La colonna deve reimparare a tollerare le rotazioni tipiche dei gesti calcistici in modo graduale.` },
          { text: `Corsa progressiva`, cat: 'run', howTo: `Aumenta gradualmente ritmo e distanza della corsa, valutando la risposta della zona lombare anche nelle ore successive. L'impatto ripetuto della corsa va reintrodotto con calma dopo un episodio di dolore lombare.` },
          { text: `Cambi di direzione e contrasti controllati prima del rientro in gruppo`, cat: 'run', howTo: `Introduci cambi di direzione e contrasti leggeri a intensità crescente, prestando attenzione a come risponde la schiena durante i movimenti rotazionali e asimmetrici. Sono gli ultimi gesti da reintrodurre prima di tornare agli allenamenti completi.` },
          { text: `Test di carico: sollevamento controllato da terra con tecnica corretta`, cat: 'strength', howTo: `Prova a sollevare un peso leggero da terra piegando le ginocchia e mantenendo la schiena dritta, non curva, valutando se compare dolore. Una buona tecnica di sollevamento nella vita quotidiana riduce il rischio di ricadute tanto quanto gli esercizi specifici.` },
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
          { text: `Pendolo di Codman: lascia il braccio penzolare e oscillare leggermente, senza forzare`, cat: 'stretch', howTo: `Piegati leggermente in avanti appoggiandoti con una mano a un tavolo, lascia il braccio dolente penzolare rilassato e oscillalo dolcemente in piccoli cerchi. Il peso del braccio stesso crea una trazione leggera che aiuta a mobilizzare l'articolazione senza sforzo muscolare attivo.` },
          { text: `Evita rinvii e lanci sopra la testa nei primi giorni`, cat: 'rest', howTo: `Nei primi giorni evita qualsiasi gesto che porti il braccio sopra la testa con forza, come rinvii lunghi o lanci. È proprio in quella posizione che il tendine infiammato viene compresso tra le ossa della spalla.` },
          { text: `Mobilità leggera della spalla entro il dolore, senza sollevare oltre l'orizzontale`, cat: 'stretch', howTo: `Solleva lentamente il braccio lateralmente o in avanti solo fino all'altezza della spalla, senza superare l'orizzontale nei primi giorni. Mantenere un po' di movimento evita rigidità, purché resti sotto la soglia che scatena dolore.` },
          { text: `Ghiaccio sulla spalla dopo l'attività se il dolore persiste`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sulla parte superiore della spalla dopo l'attività, se il dolore persiste. Aiuta a calmare l'infiammazione del tendine nella fase più acuta.` },
        ] },
      { name: 'Recupero attivo', why: 'Si inizia a rinforzare i muscoli della cuffia dei rotatori e della scapola, che spesso sono il vero punto debole dietro un conflitto di spalla.',
        criteriaToAdvance: ['Riesci a sollevare il braccio all\'altezza delle spalle senza dolore acuto', 'Il dolore a riposo è chiaramente diminuito'],
        exercises: [
          { text: `Rotazione esterna con elastico, gomito fermo al fianco (3 serie da 12-15)`, cat: 'strength', howTo: `Con il gomito piegato a 90° e fermo contro il fianco, tieni un elastico e ruota l'avambraccio verso l'esterno, mantenendo il gomito bloccato. Rinforza la cuffia dei rotatori, spesso il punto debole che permette alla testa dell'omero di risalire e comprimere il tendine.` },
          { text: `Rinforzo della scapola: stringi le scapole insieme e tieni (3 serie da 10, tenuta 5 secondi)`, cat: 'hold', howTo: `In piedi o seduto, stringi le scapole insieme come per tenere una matita tra di esse, tenendo la contrazione 5 secondi. Una buona attivazione della scapola crea più spazio per il tendine sotto l'acromion durante i movimenti del braccio.` },
          { text: `Sollevamenti laterali controllati sotto l'altezza della spalla (2-3 serie da 12)`, cat: 'strength', howTo: `Con un peso leggero o senza peso, solleva lateralmente il braccio fino a un'altezza appena sotto quella della spalla, controllando sia la salita che la discesa. Restare sotto l'altezza della spalla evita la posizione più critica per il conflitto in questa fase.` },
          { text: `Rotazione interna con elastico, gomito fermo al fianco (3 serie da 12-15)`, cat: 'strength', howTo: `Con il gomito piegato a 90° e fermo contro il fianco, tieni un elastico e ruota l'avambraccio verso l'interno, verso la pancia. Bilancia il lavoro della rotazione esterna, rinforzando la cuffia dei rotatori in entrambe le direzioni.` },
          { text: `Push-up plus contro il muro, per attivare il dentato anteriore`, cat: 'strength', howTo: `In piedi davanti a un muro, con le mani appoggiate all'altezza delle spalle, esegui una piccola flessione e, all'apice, spingi ulteriormente in avanti facendo sporgere le scapole. Il dentato anteriore, spesso debole in questo infortunio, aiuta a ruotare correttamente la scapola durante i movimenti sopra la testa.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a rinviare e lanciare a piena potenza, la spalla deve tollerare il movimento sopra la testa ripetuto senza dolore.',
        criteriaToAdvance: ['Riesci a sollevare il braccio completamente sopra la testa senza dolore', 'Nessun dolore dopo un rinvio leggero di prova'],
        exercises: [
          { text: `Rinvii progressivi, partendo da distanza ridotta`, cat: 'strength', howTo: `Inizia a rinviare il pallone su distanze brevi e a intensità ridotta, aumentando gradualmente la distanza e la forza del gesto. Valuta sempre come risponde la spalla nelle ore successive, non solo durante il gesto.` },
          { text: `Esercizi di lancio/presa a intensità crescente`, cat: 'strength', howTo: `Esegui lanci e prese con un compagno o contro un muro, partendo da un ritmo lento e aumentando gradualmente intensità e distanza. Ricostruisce la tolleranza della spalla al movimento ripetuto sopra la testa richiesto dal ruolo di portiere.` },
          { text: `Simulazione di tuffo con presa sopra la testa`, cat: 'balance', howTo: `Simula un tuffo laterale con presa del pallone sopra la testa, partendo su una superficie morbida e a bassa intensità. È il gesto più completo e specifico prima di tornare ad allenarti a pieno regime.` },
          { text: `Test di carico: rinvio a piena potenza, valutando il dolore nelle ore successive`, cat: 'strength', howTo: `Esegui alcuni rinvii a piena potenza, poi valuta il dolore alla spalla nelle ore e nel giorno successivi. Se non c'è reazione, è un buon segnale che la spalla tollera lo sforzo ripetuto sopra la testa richiesto in partita.` },
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
          { text: `Tutore/fascia di supporto se consigliato, braccio a riposo vicino al corpo`, cat: 'rest', howTo: `Se un professionista te lo ha consigliato, usa un tutore o una fascia che tenga il braccio vicino al corpo nei primi giorni. Limita il peso del braccio che tira sul legamento acromion-claveare mentre inizia a guarire.` },
          { text: `Mobilità del gomito e della mano per non irrigidirli, senza muovere la spalla`, cat: 'stretch', howTo: `Muovi liberamente gomito, polso e dita più volte al giorno, evitando invece qualsiasi movimento della spalla stessa. Mantenere mobili le articolazioni vicine previene rigidità mentre la spalla resta a riposo.` },
          { text: `Ghiaccio sulla parte superiore della spalla nei primi giorni`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sulla parte superiore della spalla, ripetendo alcune volte al giorno nei primi giorni. Aiuta a contenere gonfiore e dolore nella fase più acuta del trauma.` },
          { text: `Dormi con un cuscino di supporto sotto il braccio per limitare la trazione notturna`, cat: 'rest', howTo: `Di notte, appoggia il braccio interessato su un cuscino così da non lasciarlo cadere lateralmente nel sonno. Il peso del braccio non sostenuto crea una trazione continua sul legamento appena traumatizzato.` },
        ] },
      { name: 'Recupero attivo', why: 'Il legamento inizia a tollerare movimento controllato. Si lavora per recuperare l\'ampiezza di movimento persa nei primi giorni.',
        criteriaToAdvance: ['Riesci a muovere il braccio all\'altezza della spalla senza dolore acuto', 'Il dolore alla pressione diretta sulla zona è diminuito'],
        exercises: [
          { text: `Mobilità attiva della spalla in tutte le direzioni, entro il dolore`, cat: 'stretch', howTo: `Muovi attivamente il braccio in avanti, lateralmente e in rotazione, restando sempre entro il limite del dolore. Recuperare gradualmente il movimento in tutte le direzioni previene che la spalla si irrigidisca durante la guarigione del legamento.` },
          { text: `Rinforzo isometrico leggero della spalla (tenuta 15-20 secondi, 3-4 volte)`, cat: 'hold', howTo: `Spingi il braccio contro una resistenza fissa, come uno stipite di porta, in diverse direzioni, senza muovere l'articolazione. Le contrazioni isometriche mantengono tono muscolare senza sollecitare direttamente il legamento in via di guarigione.` },
          { text: `Rinforzo della scapola con elastico leggero`, cat: 'strength', howTo: `Con un elastico leggero, esegui trazioni orizzontali stringendo le scapole insieme, mantenendo il movimento controllato. Una scapola ben stabilizzata riduce lo stress che si scarica sull'articolazione acromion-claveare.` },
          { text: `Rotazione esterna e interna con elastico, gomito fermo al fianco`, cat: 'strength', howTo: `Con il gomito piegato a 90° e fermo contro il fianco, ruota l'avambraccio verso l'esterno e poi verso l'interno contro la resistenza di un elastico leggero. Rinforza la cuffia dei rotatori, utile per stabilizzare tutta la spalla durante il recupero.` },
          { text: `Stretching dolce della capsula posteriore della spalla`, cat: 'stretch', howTo: `Porta il braccio dolente di traverso davanti al petto, aiutandoti con l'altra mano per un leggero allungamento nella parte posteriore della spalla, senza forzare. Una capsula posteriore più elastica facilita un movimento di spalla più armonico durante il recupero.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare ai tuffi e ai contatti fisici, la spalla deve tollerare un carico diretto sulla zona senza dolore.',
        criteriaToAdvance: ['Riesci ad appoggiarti sul braccio senza dolore alla spalla', 'Nessun dolore in un\'attività fisica moderata di prova'],
        exercises: [
          { text: `Appoggi progressivi sul braccio (da terra in ginocchio, poi in piedi)`, cat: 'strength', howTo: `Esegui appoggi progressivi sul braccio, partendo in ginocchio con le mani a terra e avanzando verso un appoggio in piedi con più peso corporeo. Ricostruisce gradualmente la tolleranza a un carico diretto sulla zona traumatizzata.` },
          { text: `Simulazione di caduta/atterraggio controllata su superficie morbida`, cat: 'balance', howTo: `Su un materassino o superficie morbida, simula una caduta laterale controllata atterrando con la tecnica corretta, distribuendo l'impatto su avambraccio e fianco invece che sulla punta della spalla. Riduce il rischio di ricaduta insegnando ad assorbire meglio l'impatto.` },
          { text: `Ripresa graduale dei tuffi, da distanza ridotta`, cat: 'run', howTo: `Riprendi i tuffi partendo da distanze brevi e superfici morbide, aumentando gradualmente distanza e intensità. È il gesto più specifico del ruolo, quindi va reintrodotto con più cautela degli altri.` },
          { text: `Test di carico: piccolo salto con atterraggio su entrambe le mani, valutando il dolore`, cat: 'balance', howTo: `Esegui un piccolo salto in avanti atterrando in appoggio su entrambe le mani in modo controllato, poi valuta il dolore alla spalla. Se il test è negativo, è un buon segnale prima di tornare a tuffi e contatti fisici a piena intensità.` },
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
          { text: `Evita prese e lanci ripetuti nei primi giorni`, cat: 'rest', howTo: `Nei primi giorni evita di afferrare o lanciare ripetutamente il pallone, gesti che coinvolgono direttamente il tendine del bicipite nella zona della spalla. Non serve immobilizzare completamente il braccio, solo evitare i gesti ripetitivi che lo irritano.` },
          { text: `Mobilità leggera del gomito e della spalla entro il dolore`, cat: 'stretch', howTo: `Muovi gomito e spalla in tutte le direzioni disponibili, restando sempre entro il limite del dolore. Mantenere un po' di movimento evita rigidità mentre il tendine si calma.` },
          { text: `Massaggio leggero con automassaggio o foam roller sul braccio`, cat: 'stretch', howTo: `Con le mani o un rullo morbido, applica una pressione leggera lungo la parte anteriore del braccio, evitando di insistere direttamente sul punto più dolente vicino alla spalla. Aiuta a mantenere i tessuti attorno più elastici.` },
          { text: `Ghiaccio sul bicipite dopo l'attività se il dolore persiste`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sulla parte anteriore del braccio dopo l'attività, se il dolore persiste. Aiuta a calmare la reazione infiammatoria del tendine nella fase più acuta.` },
        ] },
      { name: 'Recupero attivo', why: 'Il tendine risponde bene a un carico progressivo e controllato, in particolare nella fase di allungamento del movimento (eccentrica).',
        criteriaToAdvance: ['Riesci a piegare il gomito contro resistenza leggera senza dolore acuto', 'Il dolore alla pressione sul tendine è diminuito'],
        exercises: [
          { text: `Curl del bicipite con enfasi sulla fase di discesa lenta (3 serie da 10-12)`, cat: 'strength', howTo: `Solleva il peso normalmente, poi conta 3-4 secondi nella fase di discesa, controllando il movimento invece di lasciarlo cadere. Il lavoro nella fase di allungamento sotto carico è quello che più aiuta i tendini a tollerare di nuovo lo sforzo.` },
          { text: `Presa isometrica: stringi un oggetto e tieni (3 serie da 20 secondi)`, cat: 'hold', howTo: `Stringi una pallina morbida o un oggetto con presa salda per 20 secondi, mantenendo gomito e polso fermi. Rinforza la presa senza il movimento ripetuto del gomito, utile nelle fasi iniziali del recupero.` },
          { text: `Rinforzo della cuffia dei rotatori con elastico leggero`, cat: 'strength', howTo: `Con il gomito piegato a 90° e fermo contro il fianco, ruota l'avambraccio verso l'esterno contro la resistenza di un elastico leggero. Una spalla ben stabilizzata riduce il carico di compenso che può ricadere sul tendine del bicipite.` },
          { text: `Rinforzo isometrico del bicipite a gomito piegato (tenuta 20-30 secondi)`, cat: 'hold', howTo: `Con il gomito piegato a circa 90°, spingi contro una resistenza fissa come uno stipite di porta, tenendo la contrazione 20-30 secondi. Le contrazioni isometriche spesso riducono il dolore del tendine rapidamente, preparando il terreno per il lavoro dinamico successivo.` },
          { text: `Mobilità attiva della spalla in flessione, senza forzare l'ultimo grado`, cat: 'stretch', howTo: `Solleva il braccio in avanti fino al punto in cui non senti dolore, senza forzare l'ultimo tratto di movimento. Il tendine del bicipite passa vicino all'articolazione della spalla, quindi una buona mobilità aiuta a scaricarlo durante i gesti sopra la testa.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a lanciare e parare a piena intensità, il tendine deve tollerare presa e trazione ripetute senza dolore.',
        criteriaToAdvance: ['Riesci a fare curl a pieno carico senza dolore', 'Nessun dolore dopo prese ripetute di prova'],
        exercises: [
          { text: `Lanci e prese progressivi, da intensità ridotta`, cat: 'strength', howTo: `Esegui lanci e prese con un compagno o contro un muro, partendo da un ritmo lento e aumentando gradualmente intensità e distanza. Ricostruisce la tolleranza del tendine al movimento ripetuto di presa e lancio.` },
          { text: `Simulazione di parata con presa del pallone`, cat: 'balance', howTo: `Simula parate con presa ferma del pallone a intensità crescente, partendo da palloni lanciati piano. È il gesto più specifico del ruolo di portiere, quindi va reintrodotto con gradualità prima del rientro completo.` },
          { text: `Curl a pieno carico prima del rientro completo`, cat: 'strength', howTo: `Esegui curl del bicipite con il carico che usavi prima dell'infortunio, valutando che non compaia dolore né durante né il giorno successivo. Un tendine che tollera il pieno carico in palestra è un buon indicatore che reggerà anche lo sforzo di gara.` },
          { text: `Test di carico: presa ripetuta del pallone a piena intensità, valutando il dolore il giorno dopo`, cat: 'strength', howTo: `Esegui una serie di prese ripetute del pallone a piena intensità, poi valuta il dolore al braccio nelle 24 ore successive. Se non c'è reazione, è un buon segnale prima di tornare a parate a piena intensità senza restrizioni.` },
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
          { text: `Evita di appoggiarti sulla mano (niente flessioni, niente appoggi a terra)`, cat: 'rest', howTo: `Evita nei primi giorni qualsiasi appoggio diretto sul palmo della mano, come flessioni o spinte a terra. È proprio la posizione con il polso esteso sotto carico a stressare di più i legamenti appena infiammati.` },
          { text: `Mobilità delle dita per non irrigidirle, senza muovere il polso`, cat: 'stretch', howTo: `Muovi liberamente le dita aprendo e chiudendo la mano più volte al giorno, evitando invece qualsiasi movimento del polso stesso. Mantenere mobili le dita previene rigidità mentre il polso resta protetto.` },
          { text: `Ghiaccio sul polso nei primi giorni`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 15 minuti sul polso, ripetendo alcune volte al giorno nei primi giorni. Aiuta a contenere gonfiore e dolore nella fase più acuta della distorsione.` },
          { text: `Tutore o fasciatura di supporto se consigliato`, cat: 'rest', howTo: `Se un professionista te lo ha consigliato, usa un tutore o una fasciatura che limiti i movimenti estremi del polso nei primi giorni. Aiuta a proteggere il legamento mentre inizia il processo di guarigione, senza immobilizzare completamente l'articolazione.` },
        ] },
      { name: 'Recupero attivo', why: 'Il legamento inizia a tollerare movimento controllato. Si lavora su ampiezza di movimento e forza di presa.',
        criteriaToAdvance: ['Riesci a muovere il polso in tutte le direzioni senza dolore acuto', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: `Mobilità attiva del polso: flessione, estensione, rotazione`, cat: 'stretch', howTo: `Muovi attivamente il polso piegandolo in avanti, indietro e ruotandolo, restando sempre entro il limite del dolore. Recuperare gradualmente il movimento in tutte le direzioni è il primo passo prima di aggiungere carico.` },
          { text: `Rinforzo di presa con una pallina morbida (3 serie da 15)`, cat: 'strength', howTo: `Stringi una pallina morbida con la mano interessata, aprendo e chiudendo la presa in modo controllato. Una buona forza di presa è centrale per un portiere e va ricostruita prima di tornare a parare.` },
          { text: `Rinforzo del polso con elastico leggero, tutte le direzioni`, cat: 'strength', howTo: `Con un elastico leggero, esegui movimenti di flessione, estensione e deviazione laterale del polso contro resistenza. Rinforza il polso in tutte le direzioni in cui dovrà lavorare durante una parata.` },
          { text: `Mobilità del gomito e dell'avambraccio, senza forzare il polso`, cat: 'stretch', howTo: `Ruota lentamente l'avambraccio con il palmo verso l'alto e poi verso il basso, mantenendo il polso rilassato. Una buona mobilità di gomito e avambraccio riduce il compenso che il polso deve fare durante i movimenti di presa.` },
          { text: `Rinforzo eccentrico del polso con peso leggero`, cat: 'strength', howTo: `Con un manubrio molto leggero o una bottiglia d'acqua, solleva il polso e poi abbassalo lentamente in 3-4 secondi, controllando la discesa. Il lavoro eccentrico prepara il polso a tollerare meglio gli impatti improvvisi di una parata.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a tuffarti e appoggiarti sulle mani, il polso deve tollerare un carico diretto senza dolore.',
        criteriaToAdvance: ['Riesci ad appoggiarti sulla mano a terra senza dolore', 'Nessun dolore dopo una parata di prova a bassa intensità'],
        exercises: [
          { text: `Appoggi progressivi sulla mano (in ginocchio, poi in piedi)`, cat: 'strength', howTo: `Esegui appoggi progressivi sul palmo della mano, partendo in ginocchio e avanzando verso un appoggio in piedi con più peso corporeo. Ricostruisce gradualmente la tolleranza a un carico diretto sul polso.` },
          { text: `Simulazione di parata e appoggio controllato`, cat: 'balance', howTo: `Simula parate con appoggio a terra a bassa intensità, aumentando gradualmente la forza dell'impatto. È il gesto più specifico del ruolo, quindi va reintrodotto con attenzione prima del rientro completo.` },
          { text: `Ripresa graduale dei tuffi`, cat: 'run', howTo: `Riprendi i tuffi partendo da distanze brevi e superfici morbide, aumentando gradualmente distanza e intensità. Il polso è spesso il primo punto di appoggio in un tuffo, quindi merita una progressione con calma.` },
          { text: `Test di carico: parata con presa e appoggio a piena intensità, valutando il dolore`, cat: 'strength', howTo: `Esegui alcune parate a piena intensità con presa e appoggio sulla mano, poi valuta il dolore al polso nelle ore successive. Se non c'è reazione, è un buon segnale prima di tornare senza restrizioni.` },
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
          { text: `Bendaggio al dito adiacente (buddy taping) se consigliato`, cat: 'rest', howTo: `Se consigliato, fissa il dito infortunato a quello adiacente sano con un cerotto, lasciando spazio per piegare entrambe le articolazioni. Il dito sano fa da stecca naturale, proteggendo quello infortunato durante i movimenti quotidiani.` },
          { text: `Ghiaccio sul dito nei primi giorni`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 10-15 minuti sul dito, ripetendo alcune volte al giorno nei primi giorni. Aiuta a contenere gonfiore e dolore nella fase più acuta del trauma.` },
          { text: `Evita prese dirette del pallone nei primi giorni`, cat: 'rest', howTo: `Nei primi giorni evita di afferrare direttamente il pallone con quella mano, anche a bassa intensità. L'impatto diretto sul dito appena infiammato può peggiorare il gonfiore e rallentare la guarigione.` },
          { text: `Tieni la mano elevata nelle prime ore per limitare il gonfiore`, cat: 'rest', howTo: `Nelle prime ore dopo il trauma, tieni la mano sollevata sopra il livello del cuore quando possibile, ad esempio appoggiata su un cuscino. Aiuta a limitare il gonfiore iniziale dell'articolazione.` },
        ] },
      { name: 'Recupero attivo', why: 'Si recupera l\'ampiezza di movimento dell\'articolazione e si inizia a rinforzare la presa.',
        criteriaToAdvance: ['Riesci a piegare e stendere il dito senza dolore acuto', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: `Mobilità attiva del dito, piega ed estendi lentamente`, cat: 'stretch', howTo: `Piega ed estendi lentamente il dito per tutto il range che riesci a raggiungere senza dolore acuto, ripetendo più volte al giorno. Recuperare la mobilità completa dell'articolazione riduce il rischio di rigidità residua, comune dopo questo tipo di trauma.` },
          { text: `Rinforzo di presa con una pallina morbida (3 serie da 15)`, cat: 'strength', howTo: `Stringi una pallina morbida con tutta la mano, aprendo e chiudendo la presa in modo controllato. Ricostruisce la forza generale della mano prima di tornare a prese più specifiche.` },
          { text: `Esercizi di pinza tra pollice e dito infortunato`, cat: 'strength', howTo: `Premi delicatamente la punta del pollice contro la punta del dito infortunato, aumentando gradualmente la forza della pinza. È un movimento fine ma importante per riprendere il controllo della presa del pallone.` },
          { text: `Massaggio leggero della zona una volta scomparso il gonfiore acuto`, cat: 'stretch', howTo: `Una volta che il gonfiore acuto è passato, massaggia delicatamente l'articolazione con piccoli movimenti circolari. Aiuta a mantenere i tessuti attorno più mobili durante la fase finale di guarigione.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a parare, il dito deve tollerare l\'impatto diretto del pallone senza dolore.',
        criteriaToAdvance: ['Riesci a stringere il pugno completamente senza dolore', 'Nessun dolore dopo prese leggere di prova'],
        exercises: [
          { text: `Prese progressive del pallone, da distanza ridotta e velocità bassa`, cat: 'strength', howTo: `Fatti lanciare il pallone da distanza ridotta e a bassa velocità, aumentando gradualmente entrambe. Ricostruisce la tolleranza del dito all'impatto diretto in modo progressivo.` },
          { text: `Simulazione di parate a mani aperte`, cat: 'balance', howTo: `Simula parate con le mani aperte a intensità crescente, prestando attenzione alla posizione delle dita nel momento dell'impatto. Una tecnica di presa corretta riduce anche il rischio di infortuni futuri alle dita.` },
          { text: `Test di carico: presa ferma del pallone lanciato a media velocità, valutando il dolore`, cat: 'strength', howTo: `Fatti lanciare il pallone a media velocità e prova a fermarlo con una presa ferma, poi valuta il dolore al dito. Se il test è negativo, è un buon segnale prima di tornare a parare senza restrizioni.` },
          { text: `Presa del pallone in tuffo laterale, per verificare la tenuta sotto sforzo dinamico`, cat: 'balance', howTo: `Fatti lanciare il pallone durante un tuffo laterale controllato, così da testare la presa non solo da fermo ma anche sotto lo sforzo dinamico di una parata vera. È un passaggio utile prima di considerarti pronto per la partita.` },
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
          { text: `Tutore/fascia per il pollice se consigliato`, cat: 'rest', howTo: `Se un professionista te lo ha consigliato, usa un tutore specifico per il pollice che limiti i movimenti laterali nei primi giorni. Protegge il legamento appena stirato senza immobilizzare completamente l'articolazione.` },
          { text: `Ghiaccio sulla base del pollice nei primi giorni`, cat: 'rest', howTo: `Applica ghiaccio avvolto in un panno per 10-15 minuti sulla base del pollice, ripetendo alcune volte al giorno nei primi giorni. Aiuta a contenere gonfiore e dolore nella fase più acuta.` },
          { text: `Evita prese a pinza (pollice contro indice) nei primi giorni`, cat: 'rest', howTo: `Nei primi giorni evita di stringere oggetti tra pollice e indice con forza, gesto che sollecita direttamente il legamento appena stirato. Usa il resto della mano quando possibile per afferrare oggetti.` },
          { text: `Tieni la mano elevata nelle prime ore per limitare il gonfiore`, cat: 'rest', howTo: `Nelle prime ore dopo il trauma, tieni la mano sollevata sopra il livello del cuore quando possibile. Aiuta a contenere il gonfiore iniziale attorno all'articolazione.` },
        ] },
      { name: 'Recupero attivo', why: 'Si recupera l\'ampiezza di movimento e si inizia a rinforzare gradualmente la presa a pinza.',
        criteriaToAdvance: ['Riesci a muovere il pollice in tutte le direzioni senza dolore acuto', 'Il gonfiore è chiaramente diminuito'],
        exercises: [
          { text: `Mobilità attiva del pollice in tutte le direzioni`, cat: 'stretch', howTo: `Muovi il pollice in flessione, estensione e opposizione verso ogni dito della mano, restando entro il limite del dolore. Recuperare il movimento completo è il primo passo prima di aggiungere carico alla presa.` },
          { text: `Rinforzo di presa a pinza leggera con una pallina morbida`, cat: 'strength', howTo: `Stringi delicatamente una pallina morbida tra pollice e indice, aumentando gradualmente la forza della presa. Ricostruisce in modo specifico il tipo di presa che userai per afferrare il pallone.` },
          { text: `Rinforzo con elastico leggero attorno al pollice`, cat: 'strength', howTo: `Metti un elastico leggero attorno al pollice e alle altre dita e allontana il pollice contro la resistenza. Rinforza i muscoli alla base del pollice, spesso indeboliti dopo un periodo di protezione.` },
          { text: `Rinforzo di presa generale della mano con una pallina morbida`, cat: 'strength', howTo: `Stringi una pallina morbida con tutta la mano, aprendo e chiudendo la presa in modo controllato. Una buona forza generale della mano supporta anche la stabilità specifica del pollice durante la presa del pallone.` },
        ] },
      { name: 'Rientro in campo', why: 'Prima di tornare a parare, il pollice deve tollerare la presa del pallone sotto pressione senza cedere.',
        criteriaToAdvance: ['Riesci a stringere a pinza con forza senza dolore', 'Nessuna sensazione di instabilità nella presa'],
        exercises: [
          { text: `Prese progressive del pallone a due mani`, cat: 'strength', howTo: `Fatti lanciare il pallone e afferralo a due mani, partendo da lanci lenti e aumentando gradualmente intensità e distanza. Ricostruisce la tolleranza del pollice alla pressione diretta del pallone durante la presa.` },
          { text: `Simulazione di parate con presa ferma`, cat: 'balance', howTo: `Simula parate con presa ferma del pallone a intensità crescente, prestando attenzione alla posizione del pollice nel momento dell'impatto. Una buona tecnica di presa riduce anche il rischio di infortuni futuri.` },
          { text: `Test di stabilità: pinza a piena forza contro resistenza, valutando eventuale cedimento`, cat: 'strength', howTo: `Stringi con tutta la forza possibile tra pollice e indice contro una resistenza, come la mano di un compagno, valutando se il pollice cede o resta stabile. Un test negativo, senza cedimento né dolore, è un buon segnale prima di tornare a pieno regime.` },
          { text: `Presa del pallone in tuffo laterale, per verificare la tenuta sotto sforzo dinamico`, cat: 'balance', howTo: `Fatti lanciare il pallone durante un tuffo laterale controllato, così da testare la presa non solo da fermo ma anche sotto lo sforzo dinamico di una parata vera. È un passaggio utile prima di considerarti pronto per la partita.` },
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
  achilles_rupture: {
    relatedInjuries: ['achilles', 'calf'], relatedReason: 'A neglected Achilles tendinopathy is among the main risk factors for a full rupture.',
    label: 'Achilles tendon rupture', subtitle: 'Full or partial tear, often needs surgery', icon: Anchor, mechanismTags: ['acute'],
    severityData: {
      lieve: { dayThresholds: [28, 70], totalEstimateDays: 120 },
      moderato: { dayThresholds: [56, 140], totalEstimateDays: 210 },
      severo: { dayThresholds: [70, 168], totalEstimateDays: 280 },
    },
    specialRedFlags: [
      'You feel another "pop" or sudden give in the repaired leg during rehab',
      'You can\'t rise onto your toes at all, even slightly, many weeks after the injury',
      'You start feeling pain, stiffness, or swelling in the other Achilles tendon too',
    ],
    phases: [
      { name: 'Protection', why: 'In the first weeks the repaired tendon (surgical or not) is fragile: the goal is to protect it while it starts healing, without fully immobilizing it.',
        exercises: [
          { text: 'Follow the exact weight-bearing timeline given by your surgeon or physio (often a boot/brace)', cat: 'rest' },
          { text: 'Toe and knee mobility, without moving the ankle', cat: 'stretch' },
          { text: 'Avoid any sudden movement or trip: re-rupture risk is highest in this exact phase', cat: 'rest' },
        ] },
      { name: 'Progressive load and symmetry', why: 'The tendon responds well to gradual, controlled loading. From here on, how the injured leg heals matters as much as how the other leg is protected: after a rupture, the "healthy" Achilles works harder to compensate and needs monitoring, not to be taken for granted.',
        criteriaToAdvance: ['You can walk without a brace on flat ground, as advised by your professional', 'Swelling has clearly decreased'],
        exercises: [
          { text: 'Assisted two-leg calf raises, gradually increasing load on the injured leg', cat: 'strength' },
          { text: 'Single-leg balance exercises (proprioception), not just strength — balance is lost as much as muscle is', cat: 'balance' },
          { text: 'Count how many calf raises you can do on each leg separately, and compare: a marked imbalance is normal early on but should shrink over time', cat: 'strength' },
        ] },
      { name: 'Return to play', why: 'Returning to the pitch takes not just strength but confidence in movement: fear of reusing the injured leg is common and real, and while it lingers it changes how you walk and run, quietly overloading the other leg.',
        criteriaToAdvance: ['Calf raises on the injured leg are close to the other leg\'s count', 'You run, change direction, and jump without hesitation or pain'],
        exercises: [
          { text: 'Progressive running, starting in a straight line before changes of direction', cat: 'run' },
          { text: 'Two-leg jumps first, then single-leg on both sides, comparing height/control', cat: 'strength' },
          { text: 'Sport-specific movement simulations at increasing intensity', cat: 'run' },
          { text: 'If fear of getting hurt again still affects your movement after months, talk to a professional: it\'s a real risk factor, not just a mental one', cat: 'rest' },
        ] },
    ],
  },
  knee: {
    relatedInjuries: ['trochanteric', 'quad'], relatedReason: 'A weak hip, especially the glute medius, is among the most common causes of patellofemoral pain.',
    label: 'Patellofemoral pain', subtitle: 'Pain at the front of the knee', icon: Target, mechanismTags: ['overuse'],
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
  ankle_foot: { label: 'Caviglia e piede', icon: Footprints, injuries: ['ankle', 'achilles', 'achilles_rupture', 'plantarfasciitis', 'blisters'] },
  knee: { label: 'Ginocchio', icon: Target, injuries: ['knee', 'mcl', 'lcl', 'patellar', 'meniscus', 'itband', 'osgood'] },
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
      { text: `Equilibrio su una gamba sola, 30 secondi per lato (2-3 volte)`, cat: 'balance', howTo: `Stai in equilibrio su una gamba sola per 30 secondi, con il ginocchio leggermente piegato e lo sguardo fisso in avanti. Una buona propriocezione della caviglia è uno dei fattori con più prove scientifiche per prevenire le distorsioni, soprattutto se te la sei già fatta in passato.` },
      { text: `Calf raises a corpo libero (3 serie da 15)`, cat: 'strength', howTo: `Sollevati sulle punte dei piedi con entrambe le gambe, poi scendi lentamente controllando la discesa. Un polpaccio forte assorbe meglio gli atterraggi e gli scatti improvvisi tipici del calcio.` },
      { text: `Mobilità della caviglia in tutte le direzioni`, cat: 'stretch', howTo: `Muovi il piede disegnando cerchi con la punta, poi piega e stendi la caviglia in tutte le direzioni. Una buona mobilità aiuta la caviglia ad assorbire meglio i cambi di direzione senza compensare con torsioni brusche.` },
      { text: `Rinforzo con elastico in tutte le direzioni (2-3 serie da 12-15 per direzione)`, cat: 'strength', howTo: `Con un elastico agganciato a un punto fisso e attorno al piede, muovi il piede verso l'interno, l'esterno, verso di te e in punta, in modo controllato in ogni direzione. Rinforzare la caviglia in tutte le direzioni, non solo avanti e indietro, la prepara meglio ai movimenti laterali imprevisti del gioco.` },
      { text: `Equilibrio su superficie instabile, se disponibile (2-3 volte da 20-30 secondi)`, cat: 'balance', howTo: `Se hai un cuscino propriocettivo o una superficie morbida, stai in equilibrio su una gamba sola sopra di essa per 20-30 secondi. L'instabilità della superficie allena i piccoli muscoli stabilizzatori della caviglia in modo più specifico rispetto al pavimento normale.` },
    ],
  },
  knee: {
    label: 'Ginocchio',
    why: 'Il ginocchio lavora meglio quando i muscoli intorno — quadricipite, ischiocrurali, glutei — sono forti ed equilibrati tra loro: riduce lo stress sull\'articolazione nei cambi di direzione.',
    exercises: [
      { text: `Squat controllati (2-3 serie da 12)`, cat: 'strength', howTo: `Scendi in accosciata mantenendo le ginocchia allineate con i piedi, senza farle cadere verso l'interno, e risali in modo controllato. È l'esercizio base per costruire la forza di quadricipite e glutei che protegge il ginocchio nei cambi di direzione.` },
      { text: `Rinforzo del gluteo medio con elastico (2-3 serie da 15)`, cat: 'strength', howTo: `Con un elastico attorno alle caviglie, in piedi, allontana lateralmente una gamba alla volta mantenendo il busto stabile. Un gluteo medio forte è tra i fattori di prevenzione più solidi contro il dolore al ginocchio, perché lo impedisce di cadere verso l'interno durante corsa e salti.` },
      { text: `Stretching di quadricipite e ischiocrurali`, cat: 'stretch', howTo: `Alterna lo stretching del quadricipite, tallone verso il gluteo, con quello degli ischiocrurali, gamba tesa e busto inclinato in avanti. Muscoli elastici intorno al ginocchio riducono lo stress che si scarica sull'articolazione a ogni passo.` },
      { text: `Step-up controllati (2-3 serie da 10 per gamba)`, cat: 'strength', howTo: `Sali su un gradino con una gamba, spingendo attraverso il tallone più che sulla punta, e scendi controllando la discesa. Allena la forza in modo specifico per i gesti asimmetrici del calcio, dove il peso è spesso su una gamba sola.` },
      { text: `Ponte glutei su una gamba (2-3 serie da 10-12 per lato)`, cat: 'strength', howTo: `Sdraiato supino con le ginocchia piegate, solleva il bacino spingendo attraverso il tallone di una gamba sola, mantenendo l'altra sollevata. Rinforza i glutei in modo mirato su una gamba sola, replicando meglio lo sforzo asimmetrico della corsa.` },
    ],
  },
  thigh: {
    label: 'Coscia',
    why: 'Hamstring e quadricipite sono i muscoli più soggetti a stiramenti nello sprint. Il lavoro eccentrico, cioè sotto allungamento controllato, è quello con più prove scientifiche alle spalle per prevenire gli strappi.',
    exercises: [
      { text: `Nordic curl assistito (2-3 serie da 5-6)`, cat: 'strength', howTo: `In ginocchio con qualcuno che ti blocca le caviglie, lasciati scendere in avanti molto lentamente, frenando il movimento con gli hamstring, aiutandoti con le mani a terra quando serve. È l'esercizio con più prove scientifiche a favore per ridurre il rischio di stiramento agli hamstring, il più frequente tra gli infortuni muscolari nel calcio.` },
      { text: `Affondi controllati (2-3 serie da 10 per gamba)`, cat: 'strength', howTo: `Con un piede avanti e uno indietro, scendi piegando entrambe le ginocchia fino a un angolo comodo, poi risali spingendo con la gamba avanti. Rinforza quadricipite e glutei in un gesto vicino a quelli richiesti da scatti e cambi di direzione.` },
      { text: `Stretching dinamico prima dell'allenamento`, cat: 'stretch', howTo: `Prima di allenarti, esegui slanci controllati delle gambe in avanti e lateralmente e affondi in movimento, invece di stretching statico prolungato. Uno stretching dinamico prepara i muscoli della coscia all'attività senza ridurne temporaneamente la potenza, come può fare lo stretching statico intenso a freddo.` },
      { text: `Ponte glutei/hamstring, bridge (3 serie da 12-15)`, cat: 'strength', howTo: `Sdraiato supino con le ginocchia piegate, spingi attraverso i talloni per sollevare il bacino, stringendo glutei e hamstring in alto. Rinforza la catena posteriore della coscia, la zona più soggetta a stiramenti nello sprint.` },
      { text: `Rinforzo eccentrico del quadricipite, discesa lenta (2-3 serie da 8-10)`, cat: 'strength', howTo: `Da un gradino basso, scendi lentamente con una gamba controllando la discesa con il quadricipite, poi risali con l'altra gamba. Il lavoro eccentrico, cioè sotto allungamento controllato, prepara il muscolo a tollerare meglio gli sforzi improvvisi di calci e scatti.` },
    ],
  },
  calf_region: {
    label: 'Gamba e polpaccio',
    why: 'Il polpaccio lavora a ogni scatto e ogni salto. Tenerlo forte ed elastico riduce il rischio di stiramenti, soprattutto quando aumenti i carichi di allenamento dopo una pausa.',
    exercises: [
      { text: `Calf raises progressivi (3 serie da 15)`, cat: 'strength', howTo: `Sollevati sulle punte dei piedi con entrambe le gambe, poi progredisci su una gamba sola quando la versione a due gambe non dà più fatica. Un polpaccio forte è la prima difesa contro stiramenti e sovraccarichi in ogni scatto.` },
      { text: `Stretching del polpaccio`, cat: 'stretch', howTo: `In piedi davanti a un muro, gamba dietro con tallone a terra, piegati in avanti finché senti un leggero allungamento nel polpaccio. Un polpaccio elastico riduce anche lo stress che si trasmette a tendine d'Achille e fascia plantare.` },
      { text: `Salti leggeri controllati (2-3 serie da 10)`, cat: 'strength', howTo: `Esegui piccoli salti sul posto atterrando in modo morbido e controllato, senza rigidità nelle caviglie. Il polpaccio lavora in modo esplosivo a ogni salto e scatto, quindi allenarlo su questo tipo di sforzo lo prepara meglio alla partita.` },
      { text: `Calf raises eccentrici, scendi lentamente su una gamba (3 serie da 10-12)`, cat: 'strength', howTo: `Sali sulle punte con entrambe le gambe, poi scendi lentamente sulla sola gamba interessata in 3-4 secondi. Il lavoro eccentrico è quello con più evidenze per prevenire gli stiramenti del polpaccio.` },
      { text: `Mobilità della caviglia prima e dopo l'allenamento`, cat: 'stretch', howTo: `Muovi il piede disegnando cerchi con la punta e piega/stendi la caviglia in tutte le direzioni prima e dopo l'allenamento. Una caviglia mobile riduce il carico compensativo che altrimenti ricade sul polpaccio a ogni passo.` },
    ],
  },
  hip_groin: {
    label: 'Anca e inguine',
    why: 'Adduttori e flessori dell\'anca sono sollecitati in ogni calcio e cambio di direzione — tra le zone più soggette a infortuni da sovraccarico nel calcio amatoriale. Il rinforzo degli adduttori in particolare ha prove scientifiche solide alle spalle.',
    exercises: [
      { text: `Rinforzo isometrico degli adduttori (3-4 serie da 8-10 tenute)`, cat: 'strength', howTo: `Con una palla morbida o un cuscino tra le ginocchia, schiaccialo con forza crescente per 8-10 secondi a ripetizione. Il rinforzo degli adduttori è tra gli interventi con più prove scientifiche solide per ridurre il rischio di pubalgia nel calcio.` },
      { text: `Mobilità dell'anca in tutte le direzioni`, cat: 'stretch', howTo: `Muovi l'anca in flessione, estensione, rotazione e apertura laterale, restando entro un'ampiezza confortevole. Un'anca mobile riduce il carico compensativo che altrimenti ricade su adduttori e flessori durante calci e cambi di direzione.` },
      { text: `Rinforzo dei flessori dell'anca con elastico (2-3 serie da 12-15)`, cat: 'strength', howTo: `Con un elastico agganciato alla caviglia, solleva il ginocchio verso il petto contro la resistenza, in modo controllato. Rinforza il muscolo principale nel gesto del calcio al pallone, riducendo il rischio di stiramento.` },
      { text: `Plank laterale con schiacciata dell'adduttore, tipo Copenhagen (2-3 serie da 6-8 per lato)`, cat: 'strength', howTo: `Di lato, con la gamba superiore appoggiata su un rialzo come una panca e il ginocchio della gamba inferiore a terra come appoggio, solleva il bacino mantenendolo allineato. È uno degli esercizi con più evidenze in assoluto per prevenire la pubalgia nei giocatori di calcio.` },
      { text: `Cammino laterale con elastico (2-3 serie da 12-15 passi per lato)`, cat: 'strength', howTo: `Con un elastico attorno alle caviglie, in leggero mezzo-squat, cammina lateralmente mantenendo tensione costante sull'elastico. Rinforza gluteo medio e adduttori insieme, replicando il tipo di stabilità richiesta nei cambi di direzione.` },
    ],
  },
  lower_back: {
    label: 'Zona lombare',
    why: 'Una zona lombare e un core forti stabilizzano tutto il resto del corpo — molti problemi alle gambe nascono da una base instabile più in alto, non dalla gamba stessa.',
    exercises: [
      { text: `Plank (2-3 serie da 20-30 secondi)`, cat: 'strength', howTo: `Mantieni il corpo dritto dai gomiti ai talloni, senza far cadere i fianchi né alzare il bacino. Un core stabile è la base che protegge la colonna lombare durante scatti, contrasti e cambi di direzione.` },
      { text: `Bird-dog: da carponi, estendi braccio e gamba opposti (2-3 serie da 8-10 per lato)`, cat: 'strength', howTo: `A quattro zampe, estendi contemporaneamente un braccio e la gamba opposta, mantenendo il bacino fermo e la colonna neutra senza ruotare. Allena la stabilità della colonna sotto un piccolo carico asimmetrico, simile a quello dei gesti sportivi.` },
      { text: `Mobilità lombare dolce da sdraiato`, cat: 'stretch', howTo: `Sdraiato supino con le ginocchia piegate, inclina dolcemente il bacino in avanti e indietro, appiattendo e poi inarcando leggermente la zona lombare contro il pavimento. Mantenere la colonna mobile, non solo forte, riduce il rischio di rigidità che precede molti episodi di lombalgia.` },
      { text: `Plank laterale (2-3 serie da 15-20 secondi per lato)`, cat: 'strength', howTo: `Di lato, in appoggio su un gomito e sul bordo del piede, solleva il bacino mantenendo il corpo allineato senza farlo cadere. Rinforza i muscoli laterali del tronco, spesso trascurati rispetto al plank frontale ma importanti per i movimenti asimmetrici del calcio.` },
      { text: `Ponte glutei a due gambe (3 serie da 12-15)`, cat: 'strength', howTo: `Sdraiato supino con le ginocchia piegate, solleva il bacino spingendo attraverso i talloni, stringendo i glutei in alto senza inarcare eccessivamente la schiena. Glutei forti alleggeriscono il lavoro di compenso che altrimenti ricade sulla zona lombare.` },
    ],
  },
  shoulder_arm: {
    label: 'Spalla e braccio',
    why: 'La spalla di chi para lavora costantemente sopra la testa, nei rinvii e nei tuffi — la stabilità della cuffia dei rotatori e della scapola è quello che previene il sovraccarico nel tempo.',
    exercises: [
      { text: `Rotazione esterna con elastico, gomito fermo al fianco (2-3 serie da 12-15)`, cat: 'strength', howTo: `Con il gomito piegato a 90° e fermo contro il fianco, tieni un elastico e ruota l'avambraccio verso l'esterno, mantenendo il gomito bloccato. Rinforza la cuffia dei rotatori, il gruppo muscolare che più previene il conflitto di spalla nei portieri che rinviano e lanciano spesso.` },
      { text: `Rinforzo della scapola: stringi le scapole insieme e tieni (2-3 serie da 10, tenuta 5 secondi)`, cat: 'hold', howTo: `In piedi o seduto, stringi le scapole insieme come per tenere una matita tra di esse, tenendo la contrazione 5 secondi. Una scapola ben stabilizzata crea più spazio nell'articolazione durante i movimenti sopra la testa, riducendo l'attrito ripetuto sui tendini.` },
      { text: `Pendolo di Codman per la mobilità della spalla`, cat: 'stretch', howTo: `Piegati leggermente in avanti appoggiandoti con una mano a un tavolo, lascia il braccio penzolare rilassato e oscillalo dolcemente in piccoli cerchi. Mantenere la spalla mobile, non solo forte, aiuta a distribuire meglio lo stress dei rinvii ripetuti.` },
      { text: `Sollevamenti laterali controllati sotto l'altezza della spalla (2-3 serie da 12)`, cat: 'strength', howTo: `Con un peso leggero o senza peso, solleva lateralmente il braccio fino a un'altezza appena sotto quella della spalla, controllando sia la salita che la discesa. Rinforza il deltoide in un range di movimento sicuro per l'articolazione.` },
      { text: `Rinforzo isometrico in rotazione interna ed esterna (tenuta 15-20 secondi, 3-4 volte)`, cat: 'hold', howTo: `Con il gomito piegato a 90°, spingi l'avambraccio contro una resistenza fissa sia verso l'interno che verso l'esterno, tenendo ogni contrazione 15-20 secondi. Le contrazioni isometriche rinforzano la cuffia dei rotatori in modo sicuro anche quando la spalla è già un po' affaticata dagli allenamenti.` },
    ],
  },
  hand_wrist: {
    label: 'Mano e polso',
    why: 'Cadute su mano aperta e prese ripetute mettono sotto stress polso e dita — forza di presa e mobilità sono la prima difesa contro distorsioni che si ripetono nel tempo.',
    exercises: [
      { text: `Rinforzo di presa con una pallina morbida (2-3 serie da 15)`, cat: 'strength', howTo: `Stringi una pallina morbida con la mano, aprendo e chiudendo la presa in modo controllato. Una buona forza di presa è la prima difesa contro le distorsioni di polso e dita quando il pallone arriva con forza.` },
      { text: `Mobilità attiva del polso in tutte le direzioni`, cat: 'stretch', howTo: `Muovi attivamente il polso piegandolo in avanti, indietro e ruotandolo in entrambe le direzioni. Un polso mobile assorbe meglio l'impatto di una caduta sulla mano aperta, uno dei meccanismi di infortunio più comuni per un portiere.` },
      { text: `Rinforzo del polso con elastico leggero, tutte le direzioni (2-3 serie da 12-15)`, cat: 'strength', howTo: `Con un elastico leggero, esegui movimenti di flessione, estensione e deviazione laterale del polso contro resistenza. Rinforza il polso in tutte le direzioni in cui dovrà lavorare durante una parata o un appoggio a terra.` },
      { text: `Flessioni sulle nocche invece che sul palmo, se comodo (2-3 serie da 8-10)`, cat: 'strength', howTo: `Se ti risulta comodo, esegui flessioni appoggiandoti sulle nocche invece che sul palmo aperto, mantenendo il polso in una posizione più neutra. Riduce lo stress sul polso in estensione completa, la posizione più a rischio in caso di caduta.` },
      { text: `Esercizi di pinza tra pollice e dita`, cat: 'strength', howTo: `Premi la punta del pollice contro la punta di ogni dito a turno, formando un piccolo cerchio, aumentando gradualmente la forza. Rinforza i piccoli muscoli della mano che stabilizzano pollice e dita durante la presa del pallone.` },
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

// Prevenzione, parte 2: per ogni zona quanto spesso allenarla, un test rapido per capire da che
// lato lavorare e qualche consiglio pratico. Niente soglie precise inventate: i test chiedono di
// confrontare i due lati, e dove c'è un riferimento è dichiarato come indicativo.
const preventionExtrasIT = {
  ankle_foot: {
    dose: 'Quando: 2–3 volte a settimana, 10 minuti. L\'equilibrio si può fare anche ogni giorno.',
    test: { title: 'Equilibrio a occhi chiusi', how: 'In piedi su una gamba, braccia incrociate: chiudi gli occhi e conta quanto resisti senza appoggiare l\'altro piede. Poi cambia gamba.', check: 'Confronta i due lati: se una caviglia cede molto prima dell\'altra, è quella su cui lavorare di più.' },
    tips: [
      'Se hai già avuto una distorsione, l\'equilibrio conta ancora di più: nei mesi successivi il rischio di rifarsela è più alto.',
      'Scarpini adatti al terreno: tacchetti troppo lunghi sul sintetico possono bloccare il piede nei cambi di direzione.',
      'Distorsioni ripetute? Chiedi a un professionista se in partita ti conviene un tape o una cavigliera.',
    ],
  },
  knee: {
    dose: 'Quando: 2–3 volte a settimana. Squat e ponte sono ottimi anche dentro il riscaldamento.',
    test: { title: 'Squat su una gamba allo specchio', how: 'Davanti a uno specchio, scendi lentamente in un mezzo squat su una gamba sola e risali. Ripeti 5 volte per lato.', check: 'Guarda il ginocchio: deve restare in linea con il piede. Se tende a cadere verso l\'interno, rinforza soprattutto gluteo e anca.' },
    tips: [
      'Atterra morbido dai salti: ginocchia piegate e in linea con le punte, mai verso l\'interno.',
      'Nei cambi di direzione abbassa il baricentro e accorcia i passi prima di girare.',
      'Aumenta salti e sprint gradualmente, soprattutto dopo una pausa (inizio stagione, vacanze).',
    ],
  },
  thigh: {
    dose: 'Quando: il Nordic 1–2 volte a settimana (bastano poche ripetizioni), gli altri 2–3 volte.',
    test: { title: 'Ponte su una gamba', how: 'Sdraiato, tallone su una sedia o un gradino e l\'altra gamba in alto: solleva il bacino e riscendi. Conta quante ripetizioni fai per lato fino a stanchezza.', check: 'Confronta i lati: una differenza marcata tra le due gambe è un segnale su cui lavorare.' },
    tips: [
      'Il Nordic è tra gli esercizi più studiati per prevenire gli stiramenti dei muscoli posteriori. I primi giorni l\'indolenzimento è normale: parti con poche ripetizioni.',
      'Non passare da zero agli sprint massimali: le corse veloci vanno reintrodotte un po\' alla volta, settimana dopo settimana.',
      'Riscaldati sempre bene prima di scatti e tiri: sono i gesti in cui la coscia si fa male più spesso.',
    ],
  },
  calf_region: {
    dose: 'Quando: 2–3 volte a settimana. I calf raises si possono fare anche tutti i giorni.',
    test: { title: 'Calf raise su una gamba', how: 'In piedi su una gamba, con una mano al muro solo per l\'equilibrio, sali sulle punte e scendi a ritmo regolare. Conta quante ripetizioni fai per lato.', check: 'Confronta i lati: se una gamba ne fa molte meno dell\'altra, è quella da rinforzare.' },
    tips: [
      'Aumenta la corsa gradualmente, soprattutto a inizio stagione o quando cambi terreno.',
      'Crampi frequenti? Controlla idratazione, sonno e quanto ti stai allenando.',
      'Dolore lungo la tibia che peggiora correndo: riduci impatti e salti, e fatti vedere se non passa.',
    ],
  },
  hip_groin: {
    dose: 'Quando: 2–3 volte a settimana. Il Copenhagen 1–2 volte, con poche ripetizioni.',
    test: { title: 'Pallone tra le ginocchia', how: 'Sdraiato a pancia in su con le ginocchia piegate, metti un pallone tra le ginocchia e stringilo forte per 5 secondi.', check: 'Se senti dolore all\'inguine è un segnale da non ignorare: riduci i carichi e parlane con un professionista.' },
    tips: [
      'Il Copenhagen è tra gli esercizi più studiati per prevenire i problemi all\'inguine nel calcio: inizia dalla versione corta, con il ginocchio appoggiato.',
      'Calci lunghi e cambi di direzione caricano molto gli adduttori: non esagerare con i tiri a freddo.',
      'Un fastidio all\'inguine che torna a ogni allenamento non va "giocato sopra": prima lo affronti, meno dura.',
    ],
  },
  lower_back: {
    dose: 'Quando: 3 volte a settimana, anche 10 minuti a fine allenamento.',
    test: { title: 'Plank', how: 'In appoggio su avambracci e punte, corpo dritto dalla testa ai talloni: resta finché riesci a tenere la posizione senza inarcare la schiena.', check: 'Come riferimento indicativo, un minuto pulito è un buon livello. Se senti dolore alla schiena, fermati.' },
    tips: [
      'Un busto stabile rende più efficaci tiri e contrasti, e protegge la schiena.',
      'Prima di giocare non restare seduto a lungo: muoviti e fai un po\' di mobilità.',
      'Dolore alla schiena con formicolii o debolezza alle gambe: fatti vedere presto.',
    ],
  },
  shoulder_arm: {
    dose: 'Quando: 2 volte a settimana, più spesso se sei portiere.',
    test: { title: 'Rotazione con il gomito al fianco', how: 'Gomito piegato a 90° e appoggiato al fianco: ruota l\'avambraccio verso l\'esterno più che puoi, senza staccare il gomito. Fallo con entrambe le braccia.', check: 'Confronta ampiezza e fastidio tra i due lati: una spalla più rigida o dolorante è quella da allenare.' },
    tips: [
      'Soprattutto per i portieri: tuffi e uscite sollecitano molto la spalla.',
      'Nelle cadute prova a rotolare invece di atterrare sulla mano con il braccio teso.',
      'Rinforza anche i muscoli tra le scapole, non solo quelli davanti: la spalla lavora meglio in equilibrio.',
    ],
  },
  hand_wrist: {
    dose: 'Quando: 2 volte a settimana; i portieri anche prima di ogni allenamento.',
    test: { title: 'Presa a confronto', how: 'Stringi forte una pallina morbida 10 volte con una mano, poi con l\'altra.', check: 'Noti meno forza o fastidio da un lato? È il polso da rinforzare; se fa male anche a riposo, fallo vedere.' },
    tips: [
      'Portieri: guanti della misura giusta e dita ben protette (tape se hai già avuto distorsioni).',
      'Nelle cadute evita di atterrare a mano tesa: rotola sulla spalla.',
      'Un dito gonfio o "storto" dopo una pallonata non va tirato: fallo controllare.',
    ],
  },
};

const preventionExtrasEN = {
  ankle_foot: {
    dose: 'When: 2–3 times a week, 10 minutes. Balance work can be done every day.',
    test: { title: 'Eyes-closed balance', how: 'Stand on one leg with arms crossed, close your eyes and count how long you last without putting the other foot down. Then switch legs.', check: 'Compare both sides: if one ankle gives way much sooner, that is the one to work on most.' },
    tips: [
      'If you have sprained it before, balance work matters even more: the risk of doing it again is higher in the following months.',
      'Boots that suit the surface: studs that are too long on artificial turf can lock your foot when you change direction.',
      'Repeated sprains? Ask a professional whether tape or an ankle brace makes sense for matches.',
    ],
  },
  knee: {
    dose: 'When: 2–3 times a week. Squats and bridges also work well inside your warm-up.',
    test: { title: 'Single-leg squat in the mirror', how: 'In front of a mirror, slowly lower into a half squat on one leg and come back up. Repeat 5 times per side.', check: 'Watch your knee: it should stay in line with your foot. If it drifts inwards, focus on glutes and hip strength.' },
    tips: [
      'Land softly from jumps: knees bent and in line with your toes, never caving inwards.',
      'When changing direction, lower your centre of gravity and shorten your steps before turning.',
      'Build up jumps and sprints gradually, especially after a break (pre-season, holidays).',
    ],
  },
  thigh: {
    dose: 'When: Nordics 1–2 times a week (a few reps are enough), the rest 2–3 times.',
    test: { title: 'Single-leg bridge', how: 'Lying down, heel on a chair or step and the other leg up: lift your hips and lower them. Count how many reps you do per side until tired.', check: 'Compare sides: a clear difference between your legs is something to work on.' },
    tips: [
      'The Nordic is one of the most studied exercises for preventing hamstring strains. Soreness in the first days is normal: start with a few reps.',
      'Don\'t go from zero to all-out sprints: bring fast running back a little at a time, week by week.',
      'Always warm up well before sprints and shots: they are the moves where thighs get hurt most often.',
    ],
  },
  calf_region: {
    dose: 'When: 2–3 times a week. Calf raises can be done every day.',
    test: { title: 'Single-leg calf raise', how: 'Standing on one leg, one hand on the wall only for balance, rise onto your toes and lower at a steady pace. Count your reps per side.', check: 'Compare sides: if one leg does far fewer, that is the one to strengthen.' },
    tips: [
      'Increase running gradually, especially at the start of the season or when you change surface.',
      'Frequent cramps? Check hydration, sleep and how much you are training.',
      'Pain along the shin that gets worse when running: cut down on impacts and jumps, and get it checked if it doesn\'t settle.',
    ],
  },
  hip_groin: {
    dose: 'When: 2–3 times a week. The Copenhagen 1–2 times, with a few reps.',
    test: { title: 'Ball between the knees', how: 'Lying on your back with knees bent, put a ball between your knees and squeeze it hard for 5 seconds.', check: 'If you feel groin pain, don\'t ignore it: reduce your load and talk to a professional.' },
    tips: [
      'The Copenhagen is one of the most studied exercises for preventing groin problems in football: start with the short version, knee supported.',
      'Long kicks and changes of direction load the adductors heavily: don\'t overdo shooting when you are cold.',
      'Groin discomfort that comes back every session shouldn\'t be "played through": the sooner you deal with it, the shorter it lasts.',
    ],
  },
  lower_back: {
    dose: 'When: 3 times a week, even 10 minutes at the end of training.',
    test: { title: 'Plank', how: 'On forearms and toes, body straight from head to heels: hold as long as you can keep the position without arching your back.', check: 'As an indicative reference, one clean minute is a good level. If your back hurts, stop.' },
    tips: [
      'A stable trunk makes shots and challenges more effective, and protects your back.',
      'Before playing, don\'t sit still for long: move around and do some mobility work.',
      'Back pain with tingling or weakness in the legs: get it checked soon.',
    ],
  },
  shoulder_arm: {
    dose: 'When: 2 times a week, more often if you are a goalkeeper.',
    test: { title: 'Rotation with elbow at your side', how: 'Elbow bent to 90° and resting against your side: rotate your forearm outwards as far as you can without lifting the elbow. Do it with both arms.', check: 'Compare range and discomfort between sides: a stiffer or sore shoulder is the one to train.' },
    tips: [
      'Especially for goalkeepers: dives and claims put a lot of stress on the shoulder.',
      'When you fall, try to roll instead of landing on your hand with a straight arm.',
      'Strengthen the muscles between your shoulder blades too, not just the front: the shoulder works better in balance.',
    ],
  },
  hand_wrist: {
    dose: 'When: 2 times a week; goalkeepers before every session too.',
    test: { title: 'Grip comparison', how: 'Squeeze a soft ball hard 10 times with one hand, then with the other.', check: 'Less strength or discomfort on one side? That wrist needs strengthening; if it hurts at rest too, get it checked.' },
    tips: [
      'Goalkeepers: gloves in the right size and well-protected fingers (tape if you have had sprains before).',
      'When you fall, avoid landing on an outstretched hand: roll onto your shoulder.',
      'A swollen or "bent" finger after a ball hit shouldn\'t be pulled: get it checked.',
    ],
  },
};

// Riscaldamento preventivo: 3 parti come nei programmi di riscaldamento studiati nel calcio
// (corsa di attivazione, forza/equilibrio/salti, corsa finale). Esercizi generici, parole nostre.
const warmupRoutineIT = [
  { part: 'Attivazione', minutes: 5, exercises: [
    { text: `Corsa leggera con apertura e chiusura dell'anca (2 andata e ritorno)`, cat: 'run', howTo: `Corri piano su 15-20 metri: a ogni passo alza un ginocchio e aprilo verso l'esterno all'andata, poi portalo verso l'interno al ritorno. Scalda anca e inguine prima dei gesti più veloci.` },
    { text: `Corsa laterale e incrociata (2 andata e ritorno)`, cat: 'run', howTo: `Corri di lato a passi accostati, poi incrociando le gambe davanti e dietro, con le ginocchia leggermente piegate. Prepara caviglie e anche ai movimenti laterali della partita.` },
    { text: `Skip e calciata dietro (2 andata e ritorno)`, cat: 'run', howTo: `Alterna ginocchia alte e talloni verso il sedere su 15-20 metri, con appoggi rapidi e busto dritto. Alza la temperatura dei muscoli di coscia e polpaccio.` },
  ] },
  { part: 'Forza, equilibrio e salti', minutes: 8, exercises: [
    { text: `Plank frontale (3 serie da 20-30 secondi)`, cat: 'hold', howTo: `Appoggiati su avambracci e punte, con il corpo dritto dalla testa ai talloni e la pancia contratta. Non lasciar cadere il bacino: meglio meno secondi fatti bene.` },
    { text: `Plank laterale (2 serie da 20 secondi per lato)`, cat: 'hold', howTo: `Su un avambraccio, con il gomito sotto la spalla, solleva il bacino finché il corpo è in linea. Allena i muscoli laterali di busto e anca che ti stabilizzano nei contrasti.` },
    { text: `Nordic curl (1 serie da 3-5)`, cat: 'strength', howTo: `In ginocchio, con un compagno che ti blocca le caviglie, lasciati cadere in avanti il più lentamente possibile frenando con i muscoli dietro la coscia; appoggiati con le mani e torna su. Poche ripetizioni fatte bene bastano.` },
    { text: `Equilibrio su una gamba passandoti la palla (2 serie da 30 secondi per lato)`, cat: 'balance', howTo: `In equilibrio su una gamba, ginocchio morbido, passa una palla da una mano all'altra o scambiala con un compagno. Distrarre l'attenzione allena i riflessi di caviglia e ginocchio.` },
    { text: `Squat con salita sulle punte (2 serie da 10)`, cat: 'strength', howTo: `Scendi in squat con le ginocchia in linea con le punte dei piedi, poi risali e sali sulle punte. Controlla che le ginocchia non cadano mai verso l'interno.` },
    { text: `Salti con atterraggio morbido (2 serie da 8-10)`, cat: 'strength', howTo: `Salta in alto o di lato e atterra sugli avampiedi con le ginocchia piegate e in linea con i piedi, fermandoti un attimo prima del salto successivo. Impari ad atterrare nel modo che protegge il ginocchio.` },
    { text: `Copenhagen corto (1 serie da 5 per lato)`, cat: 'strength', howTo: `Sdraiato su un fianco, appoggia l'interno del ginocchio della gamba sopra su una panca o sulle mani di un compagno e solleva il bacino; scendi piano. Rinforza gli adduttori, i muscoli dell'inguine.` },
  ] },
  { part: 'Corsa finale', minutes: 3, exercises: [
    { text: `Corsa progressiva fino alla velocità di gara (2 volte da 30-40 metri)`, cat: 'run', howTo: `Parti piano e accelera gradualmente fino a una velocità vicina a quella di partita, poi rallenta con calma. Prepara i muscoli agli sprint veri.` },
    { text: `Cambi di direzione controllati (2 andata e ritorno)`, cat: 'run', howTo: `Corri 4-5 passi, pianta il piede esterno con il ginocchio in linea e cambia direzione, alternando i lati. Conta la qualità dell'appoggio, non la velocità.` },
  ] },
];

const warmupRoutineEN = [
  { part: 'Activation', minutes: 5, exercises: [
    { text: `Easy jog with hip out and hip in (2 times there and back)`, cat: 'run', howTo: `Jog slowly over 15-20 metres: on each step lift a knee and open it outwards on the way there, then bring it inwards on the way back. It warms up hips and groin before faster moves.` },
    { text: `Sideways and crossover running (2 times there and back)`, cat: 'run', howTo: `Run sideways with side steps, then crossing your legs in front and behind, knees slightly bent. It prepares ankles and hips for the lateral moves of a match.` },
    { text: `High knees and heel kicks (2 times there and back)`, cat: 'run', howTo: `Alternate high knees and heels to your bottom over 15-20 metres, with quick contacts and an upright trunk. It raises the temperature of thigh and calf muscles.` },
  ] },
  { part: 'Strength, balance and jumps', minutes: 8, exercises: [
    { text: `Front plank (3 sets of 20-30 seconds)`, cat: 'hold', howTo: `Rest on forearms and toes, body straight from head to heels and tummy braced. Don't let your hips sag: fewer seconds done well is better.` },
    { text: `Side plank (2 sets of 20 seconds per side)`, cat: 'hold', howTo: `On one forearm, elbow under the shoulder, lift your hips until your body is in line. It trains the side muscles of trunk and hip that keep you stable in challenges.` },
    { text: `Nordic curl (1 set of 3-5)`, cat: 'strength', howTo: `Kneeling, with a teammate holding your ankles, lower yourself forwards as slowly as possible, braking with the muscles at the back of your thigh; catch yourself with your hands and come back up. A few good reps are enough.` },
    { text: `Single-leg balance passing the ball (2 sets of 30 seconds per side)`, cat: 'balance', howTo: `Balancing on one leg with a soft knee, pass a ball from hand to hand or swap it with a teammate. Taking your attention away trains ankle and knee reflexes.` },
    { text: `Squat to toe raise (2 sets of 10)`, cat: 'strength', howTo: `Squat down with your knees in line with your toes, then come up and rise onto your toes. Make sure your knees never cave inwards.` },
    { text: `Jumps with soft landing (2 sets of 8-10)`, cat: 'strength', howTo: `Jump up or sideways and land on the balls of your feet with knees bent and in line with your feet, pausing briefly before the next jump. You learn to land in the way that protects your knee.` },
    { text: `Short Copenhagen (1 set of 5 per side)`, cat: 'strength', howTo: `Lying on your side, rest the inside of your top knee on a bench or a teammate's hands and lift your hips; lower slowly. It strengthens the adductors, your groin muscles.` },
  ] },
  { part: 'Final running', minutes: 3, exercises: [
    { text: `Build-up run to match speed (2 times over 30-40 metres)`, cat: 'run', howTo: `Start slowly and speed up gradually to close to match pace, then slow down calmly. It prepares your muscles for real sprints.` },
    { text: `Controlled changes of direction (2 times there and back)`, cat: 'run', howTo: `Run 4-5 steps, plant your outside foot with the knee in line and change direction, alternating sides. Quality of the plant matters more than speed.` },
  ] },
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
      { text: `Tecnica di atterraggio da un tuffo laterale, caviglia stabile all'impatto (3 serie da 5 per lato)`, cat: 'balance', howTo: `Simula un tuffo laterale da fermo o da un passo, atterrando con la caviglia allineata sotto il ginocchio senza cedere verso l'interno. Il controllo nell'ultimo istante prima dell'atterraggio conta più della spinta stessa.` },
      { text: `Spinta esplosiva laterale da fermo (3 serie da 5 per lato)`, cat: 'strength', howTo: `Da fermo, spingi esplosivamente di lato come per iniziare un tuffo, caricando sulla gamba d'appoggio e tornando subito in posizione. Ricostruisce la potenza di spinta della caviglia senza il rischio dell'atterraggio vero e proprio.` },
      { text: `Equilibrio monopodalico su superficie instabile (3 volte da 20-30 secondi)`, cat: 'balance', howTo: `Stai in equilibrio su una gamba sola su un cuscinetto propriocettivo o una superficie morbida, con il ginocchio leggermente piegato. Riallena i piccoli aggiustamenti automatici che servono a reggere un appoggio instabile durante un tuffo.` },
      { text: `Salti laterali da un punto all'altro, atterraggio controllato (3 serie da 8)`, cat: 'balance', howTo: `Salta lateralmente da un piede all'altro tra due punti a circa 40-50 cm di distanza, atterrando ogni volta con la caviglia stabile prima di ripartire subito nell'altra direzione. Riproduce il carico laterale ripetuto tipico del reparto portieri, a un ritmo più vicino a quello di una partita.` },
    ]},
    difensore: { why: 'Nei duelli aerei l\'atterraggio spesso avviene su un solo piede, magari in contatto — la caviglia deve reggere il carico anche fuori equilibrio.', exercises: [
      { text: `Tecnica di atterraggio da un colpo di testa, un piede solo (3 serie da 6 per lato)`, cat: 'balance', howTo: `Salta come per un colpo di testa e atterra controllato su una gamba sola, piegando leggermente ginocchio e anca per assorbire l'impatto. È lo stesso schema motorio di un duello aereo reale, senza l'avversario a complicare l'atterraggio.` },
      { text: `Affondi laterali con controllo della caviglia (3 serie da 10 per lato)`, cat: 'strength', howTo: `Esegui un affondo laterale ampio, spingendo il bacino indietro e mantenendo il piede della gamba di lavoro ben piantato senza cedimenti verso l'interno. Rinforza la caviglia nella posizione di carico laterale tipica di un contrasto.` },
      { text: `Stabilità della caviglia sotto leggera spinta esterna (3 serie da 8)`, cat: 'balance', howTo: `In equilibrio su una gamba, fatti dare piccole spinte impreviste da un compagno su spalle o bacino e resisti senza perdere l'appoggio. Allena la reazione automatica della caviglia al contatto fisico imprevisto di un duello.` },
      { text: `Salto e atterraggio in contrasto simulato (3 serie da 6 per lato)`, cat: 'balance', howTo: `Salta per un colpo di testa mentre un compagno esercita un leggero contatto a metà salto, poi atterra controllando la caviglia nonostante lo squilibrio ricevuto. È il passo successivo rispetto all'atterraggio pulito da solo, perché introduce l'imprevedibilità reale di un duello.` },
    ]},
    centrocampista: { why: 'Frenate e ripartenze ripetute per novanta minuti mettono la caviglia sotto stress cumulativo, non solo un singolo picco di carico.', exercises: [
      { text: `Tecnica di frenata e ripartenza ripetuta (6-8 ripetizioni)`, cat: 'run', howTo: `Corri per alcuni metri, frena in modo controllato piantando bene l'appoggio e riparti subito nella stessa o in un'altra direzione. Allena la caviglia a reggere lo stesso gesto molte volte di fila, come accade davvero in partita.` },
      { text: `Equilibrio monopodalico con leggero affaticamento pregresso (3 serie da 20 secondi)`, cat: 'balance', howTo: `Dopo una breve serie di corsa o salti, mettiti subito in equilibrio su una gamba sola. L'equilibrio quando sei già un po' affaticato conta davvero al 70' di una partita, non quello a freddo.` },
      { text: `Mobilità della caviglia in tutte le direzioni, a fine sessione (2 minuti)`, cat: 'stretch', howTo: `A fine allenamento, muovi attivamente la caviglia in flessione, estensione e circonduzione in entrambe le direzioni. Una caviglia che recupera mobilità dopo lo sforzo tollera meglio il carico cumulativo di allenamenti ravvicinati.` },
      { text: `Cambi di ritmo su percorso a navetta (5-6 andate e ritorni)`, cat: 'run', howTo: `Su un tratto di 10-15 metri, alterna un ritmo di corsa blanda a un'accelerazione breve e un rallentamento controllato, ripetendo avanti e indietro. Riproduce i continui cambi di intensità che una caviglia da centrocampista deve reggere per novanta minuti.` },
    ]},
    attaccante: { why: 'Il cambio di direzione esplosivo per superare un avversario carica la caviglia lateralmente in modo brusco.', exercises: [
      { text: `Tecnica di cambio di direzione esplosivo, taglio a 45° (3 serie da 6 per lato)`, cat: 'run', howTo: `Corri qualche passo, poi taglia bruscamente a circa 45 gradi spingendo con decisione sulla gamba esterna, mantenendo la caviglia stabile nell'istante del cambio. È il gesto che più spesso mette a rischio la caviglia di un attaccante in un dribbling.` },
      { text: `Reattività: parti in scatto dopo un segnale imprevisto (5-6 ripetizioni)`, cat: 'run', howTo: `Resta fermo o in leggero movimento e scatta appena un compagno ti dà un segnale visivo o vocale imprevisto. Allena la caviglia a reggere un'accelerazione improvvisa senza il tempo di prepararsi, come capita davvero contro un difensore.` },
      { text: `Rinforzo con elastico in tutte le direzioni (2-3 serie da 12 per direzione)`, cat: 'strength', howTo: `Con un elastico attorno all'avampiede, muovi il piede contro resistenza in flessione, estensione e verso l'interno/esterno. Rinforza in modo mirato i muscoli che stabilizzano la caviglia nei cambi di direzione rapidi.` },
      { text: `Slalom stretto tra ostacoli a ritmo di gara (4-5 passaggi)`, cat: 'run', howTo: `Disponi 4-5 coni molto ravvicinati e superali con cambi di direzione rapidi, mantenendo il ritmo il più vicino possibile a quello di una vera azione offensiva. Allena la caviglia a stabilizzarsi ripetutamente in poco spazio e in poco tempo.` },
    ]},
  },
  knee: {
    portiere: { why: 'La spinta laterale per il tuffo carica il ginocchio d\'appoggio in modo asimmetrico e improvviso.', exercises: [
      { text: `Tecnica di spinta laterale per il tuffo, ginocchio allineato (3 serie da 5 per lato)`, cat: 'balance', howTo: `Simula la spinta laterale del tuffo controllando che il ginocchio della gamba d'appoggio resti allineato con piede e anca, senza cedere verso l'interno. È il controllo tecnico che protegge il ginocchio nel gesto più ripetuto del ruolo.` },
      { text: `Squat monopodalico controllato (3 serie da 8 per lato)`, cat: 'strength', howTo: `Scendi in squat su una gamba sola, il più lentamente possibile, mantenendo il ginocchio allineato sopra il piede. Ricostruisce la forza e il controllo necessari a reggere da soli il peso del corpo nella spinta del tuffo.` },
      { text: `Rinforzo del gluteo medio con elastico (2-3 serie da 15)`, cat: 'strength', howTo: `Con un elastico sopra le ginocchia, allontana lateralmente la gamba mantenendo il bacino stabile e il busto fermo. Un gluteo medio forte è ciò che impedisce al ginocchio di cedere verso l'interno durante la spinta.` },
      { text: `Affondo laterale con spinta di ritorno esplosiva (3 serie da 6 per lato)`, cat: 'strength', howTo: `Esegui un affondo laterale ampio e, dal punto più basso, spingi con decisione per tornare in posizione eretta. Riproduce in modo più dinamico e vicino al gesto reale la spinta laterale usata per il tuffo.` },
    ]},
    difensore: { why: 'Nel contrasto il ginocchio spesso lavora in posizione flessa e ruotata contemporaneamente — la tecnica riduce il rischio più della sola forza.', exercises: [
      { text: `Tecnica di affondo nel contrasto, ginocchio mai oltre la punta del piede (3 serie da 8 per lato)`, cat: 'balance', howTo: `Esegui un affondo in avanti come per intervenire in un contrasto, controllando che il ginocchio non superi mai la punta del piede e resti allineato. Riduce il carico torsionale sul ginocchio nel momento del contatto.` },
      { text: `Step-up controllati (3 serie da 10 per lato)`, cat: 'strength', howTo: `Sali su un gradino o un rialzo con una gamba sola, spingendo con il tallone e controllando la discesa altrettanto lentamente. Rinforza il ginocchio nel range di movimento usato quando ti stacchi da terra in un contrasto.` },
      { text: `Stabilità in appoggio singolo con perturbazione (3 serie da 8)`, cat: 'balance', howTo: `In equilibrio su una gamba, fatti dare piccole spinte impreviste mentre mantieni il ginocchio leggermente piegato e stabile. Allena la reazione del ginocchio a un carico improvviso e non allineato, come in un contrasto reale.` },
      { text: `Cambio di direzione con contatto simulato sulla gamba d'appoggio (3 serie da 6 per lato)`, cat: 'balance', howTo: `Cambia direzione di corsa mentre un compagno applica un leggero contatto sulla gamba d'appoggio nell'istante dell'appoggio a terra. Allena il ginocchio a restare stabile anche quando il contrasto arriva proprio mentre il peso è su una gamba sola.` },
    ]},
    centrocampista: { why: 'Decine di decelerazioni ripetute in una partita sollecitano il ginocchio più del numero di sprint in sé.', exercises: [
      { text: `Tecnica di decelerazione ripetuta in tre appoggi (6-8 ripetizioni)`, cat: 'run', howTo: `Corri e frena distribuendo il rallentamento su tre appoggi successivi invece che su uno solo, piegando progressivamente le ginocchia. Riduce il picco di carico su un singolo ginocchio su tante frenate ripetute in partita.` },
      { text: `Squat controllati ad alto volume (3 serie da 15)`, cat: 'strength', howTo: `Esegui squat a corpo libero con tecnica controllata, puntando su un numero di ripetizioni più alto del solito piuttosto che sul carico. Costruisce la resistenza muscolare attorno al ginocchio necessaria a reggere sforzi ripetuti per novanta minuti.` },
      { text: `Resistenza in appoggio monopodalico (3 serie da 30 secondi)`, cat: 'hold', howTo: `Mantieni l'equilibrio su una gamba sola il più a lungo possibile con tecnica corretta, ripetendo più serie. Un ginocchio che regge bene un appoggio prolungato tollera meglio l'affaticamento accumulato nella ripresa.` },
      { text: `Corsa con cambi di ritmo e frenate ravvicinate (8-10 minuti)`, cat: 'run', howTo: `Alterna tratti di corsa blanda a brevi accelerazioni seguite da frenate controllate, per una durata simile a quella di un vero sforzo prolungato in partita. Allena il ginocchio a reggere decelerazioni ripetute quando la fatica comincia a farsi sentire.` },
    ]},
    attaccante: { why: 'Il perno su un piede solo per proteggere palla o saltare l\'avversario mette il ginocchio sotto torsione.', exercises: [
      { text: `Tecnica di perno su un piede solo, controllato (3 serie da 6 per lato)`, cat: 'balance', howTo: `Ruota il corpo attorno a una gamba d'appoggio ferma, come per proteggere il pallone o saltare un avversario, mantenendo il ginocchio allineato durante la rotazione. Il controllo della torsione riduce il carico rotazionale improvviso sul ginocchio.` },
      { text: `Salti con atterraggio stabile su una gamba (3 serie da 6 per lato)`, cat: 'balance', howTo: `Salta in avanti o lateralmente e atterra su una gamba sola, assorbendo l'impatto piegando ginocchio e anca senza far cedere il ginocchio verso l'interno. Ricostruisce la capacità di atterrare in sicurezza dopo un salto o un contrasto aereo.` },
      { text: `Rinforzo eccentrico del quadricipite (2-3 serie da 8-10)`, cat: 'strength', howTo: `Scendi molto lentamente in uno squat o affondo, enfatizzando la fase di discesa più che quella di risalita. Il controllo eccentrico del quadricipite è ciò che frena il ginocchio nei gesti di decelerazione e cambio di direzione.` },
      { text: `Dribbling con cambio di appoggio rapido (5-6 sequenze)`, cat: 'balance', howTo: `Conduci il pallone cambiando rapidamente l'appoggio da una gamba all'altra come per superare un avversario immaginario, curando che il ginocchio resti stabile a ogni cambio. Riproduce il carico specifico del dribbling in velocità.` },
    ]},
  },
  thigh: {
    portiere: { why: 'La spinta esplosiva da fermo per il tuffo richiede potenza immediata, senza una vera fase di preparazione.', exercises: [
      { text: `Tecnica di spinta esplosiva da fermo (5-6 ripetizioni)`, cat: 'strength', howTo: `Da fermo, spingi con la massima decisione verso un lato come per lanciarti in un tuffo, senza alcun passo di rincorsa. Ricostruisce la capacità della coscia di generare potenza immediata, senza tempo per caricare il movimento.` },
      { text: `Affondi con enfasi sulla fase di spinta (3 serie da 8 per lato)`, cat: 'strength', howTo: `Esegui un affondo e, dal punto più basso, spingi con decisione per tornare in piedi il più rapidamente possibile. Allena proprio la fase esplosiva del gesto, quella più vicina alla spinta reale del tuffo.` },
      { text: `Nordic curl assistito (2-3 serie da 5-6)`, cat: 'strength', howTo: `In ginocchio con le caviglie bloccate da un compagno, scendi in avanti il più lentamente possibile, aiutandoti con le mani solo quando serve davvero. Rinforza i muscoli posteriori della coscia nella loro funzione di frenata, importante quanto la spinta.` },
      { text: `Salti in lunghezza da fermo, atterraggio controllato (4-5 ripetizioni)`, cat: 'strength', howTo: `Da fermo, salta in avanti il più lontano possibile e atterra in equilibrio su entrambi i piedi, piegando le ginocchia per assorbire l'impatto. Allena la stessa potenza esplosiva della coscia richiesta dal tuffo, con un gesto più semplice da controllare.` },
    ]},
    difensore: { why: 'Lo stacco per il duello aereo è un gesto esplosivo che carica la coscia in modo simile a un salto verticale puro.', exercises: [
      { text: `Tecnica di stacco per il duello aereo, spinta bilanciata (5-6 ripetizioni)`, cat: 'strength', howTo: `Salta verticalmente come per un colpo di testa, spingendo in modo bilanciato con entrambe le gambe e curando il tempismo dello stacco. Una spinta bilanciata riduce il sovraccarico su una singola coscia nei duelli ripetuti.` },
      { text: `Squat con salto controllato (3 serie da 6)`, cat: 'strength', howTo: `Scendi in squat e salta verticalmente con decisione, atterrando in modo controllato e ammortizzato. Ricostruisce la potenza della coscia nel gesto di stacco, con un atterraggio più semplice da gestire rispetto al duello reale.` },
      { text: `Ponte glutei/hamstring (3 serie da 12-15)`, cat: 'strength', howTo: `Sdraiato supino con i talloni appoggiati a terra, solleva il bacino contraendo glutei e parte posteriore della coscia, poi scendi controllato. Rinforza la catena posteriore che partecipa allo stacco tanto quanto il quadricipite.` },
      { text: `Duello aereo simulato con leggero contatto a mezz'aria (4-5 ripetizioni per lato)`, cat: 'strength', howTo: `Salta per un colpo di testa mentre un compagno esercita un leggerissimo contatto laterale durante il salto, così da abituare la coscia a stabilizzarsi anche quando l'equilibrio non è perfetto. Avvicina l'esercizio al duello aereo reale.` },
    ]},
    centrocampista: { why: 'Correre a intensità sostenuta per gran parte della partita è più una questione di resistenza muscolare che di velocità pura.', exercises: [
      { text: `Tecnica di corsa a intensità sostenuta, passo efficiente (8-10 minuti a ritmo costante)`, cat: 'run', howTo: `Corri a un ritmo sostenuto ma sostenibile, curando un passo regolare ed efficiente piuttosto che il più veloce possibile. Allena la coscia a lavorare bene su sforzi prolungati, la vera richiesta del ruolo più che lo scatto isolato.` },
      { text: `Affondi in circuito, alto volume (3 serie da 12 per lato)`, cat: 'strength', howTo: `Esegui affondi in successione, alternando le gambe, puntando su un volume alto di ripetizioni con tecnica ancora pulita. Costruisce la resistenza muscolare della coscia necessaria a reggere tanti gesti ripetuti senza calo di qualità.` },
      { text: `Rinforzo eccentrico del quadricipite, discesa lenta (2-3 serie da 8-10)`, cat: 'strength', howTo: `Scendi molto lentamente in uno squat, contando alcuni secondi nella sola fase di discesa. La capacità di frenare il movimento in modo controllato è ciò che protegge la coscia quando la fatica aumenta a fine partita.` },
      { text: `Corsa progressiva con variazioni di ritmo (10-12 minuti)`, cat: 'run', howTo: `Alterna alcuni minuti a ritmo blando a brevi tratti più veloci, senza mai arrivare allo sprint massimale, per una durata complessiva vicina a quella di un vero impegno di gara. Allena la coscia a passare da un'intensità all'altra senza perdere efficienza.` },
    ]},
    attaccante: { why: 'Decelerare subito dopo uno scatto massimale è spesso il momento più a rischio per la coscia, non lo scatto in sé.', exercises: [
      { text: `Tecnica di decelerazione dopo lo scatto, tre appoggi controllati (5-6 ripetizioni)`, cat: 'run', howTo: `Scatta per alcuni metri e frena distribuendo il rallentamento su tre appoggi progressivamente più corti, invece di fermarti di colpo. Decelerare bene, non solo accelerare bene, è ciò che protegge davvero la coscia di un attaccante.` },
      { text: `Accelerazione esplosiva da fermo (5-6 ripetizioni da 10 metri)`, cat: 'run', howTo: `Parti da fermo e accelera il più rapidamente possibile per circa 10 metri, recuperando bene tra una ripetizione e l'altra. Ricostruisce la potenza esplosiva della coscia nello scatto, il gesto offensivo più tipico del ruolo.` },
      { text: `Nordic curl assistito (2-3 serie da 5-6)`, cat: 'strength', howTo: `In ginocchio con le caviglie bloccate, scendi in avanti il più lentamente possibile, resistendo con i muscoli posteriori della coscia. Un buon controllo eccentrico qui riduce nettamente il rischio dello stiramento nella fase di decelerazione dopo lo scatto.` },
      { text: `Scatto e frenata su segnale improvviso (5-6 ripetizioni)`, cat: 'run', howTo: `Scatta al massimo e, a un segnale imprevisto di un compagno, frena il più rapidamente possibile mantenendo il controllo. Riproduce la combinazione reale di accelerazione e decelerazione improvvisa che mette più a rischio la coscia in partita.` },
    ]},
  },
  calf_region: {
    portiere: { why: 'Il polpaccio genera la spinta laterale esplosiva per coprire distanza nel tuffo in pochissimo tempo.', exercises: [
      { text: `Tecnica di spinta esplosiva laterale dal polpaccio (3 serie da 5 per lato)`, cat: 'strength', howTo: `Simula la spinta laterale del tuffo concentrandoti sulla spinta finale del polpaccio contro il terreno, non solo sulla gamba nel complesso. È l'ultimo elemento che genera velocità nel tuffo, spesso trascurato rispetto ad anca e ginocchio.` },
      { text: `Calf raises esplosivi (3 serie da 10)`, cat: 'strength', howTo: `Sali sulle punte dei piedi il più velocemente possibile e scendi in modo controllato, ripetendo con ritmo esplosivo. Costruisce la potenza rapida del polpaccio necessaria alla spinta immediata del tuffo.` },
      { text: `Equilibrio su una gamba con piccoli rimbalzi (3 serie da 15 secondi)`, cat: 'balance', howTo: `In equilibrio su una gamba, esegui piccoli rimbalzi sulle punte dei piedi mantenendo il controllo della caviglia. Allena il polpaccio a lavorare in modo reattivo sotto carico instabile, come nell'istante prima di un tuffo.` },
      { text: `Balzi laterali brevi, massima rapidità (3 serie da 6 per lato)`, cat: 'run', howTo: `Esegui piccoli balzi laterali da un piede all'altro, restando il più vicino possibile al terreno e puntando sulla rapidità del contatto più che sulla distanza. Riproduce il ritmo esplosivo e reattivo del polpaccio richiesto per coprire la porta lateralmente.` },
    ]},
    difensore: { why: 'Lo stacco verticale per il colpo di testa dipende in gran parte dalla potenza del polpaccio nell\'ultimo istante prima del salto.', exercises: [
      { text: `Tecnica di stacco verticale, spinta rapida dal polpaccio (5-6 ripetizioni)`, cat: 'strength', howTo: `Salta verticalmente enfatizzando la spinta finale delle caviglie e dei polpacci nell'ultimo istante prima di staccare da terra. È il dettaglio tecnico che spesso fa la differenza di qualche centimetro in un duello aereo.` },
      { text: `Calf raises progressivi (3 serie da 15)`, cat: 'strength', howTo: `Sali sulle punte dei piedi con tecnica controllata, aumentando gradualmente il numero di ripetizioni nelle serie successive. Costruisce la base di forza del polpaccio necessaria a reggere stacchi ripetuti durante la partita.` },
      { text: `Salti verticali ripetuti, atterraggio controllato (3 serie da 6)`, cat: 'strength', howTo: `Salta verticalmente più volte di fila, atterrando ogni volta in modo ammortizzato prima di risaltare. Allena il polpaccio a reggere il carico ripetuto di più duelli aerei ravvicinati, non solo uno isolato.` },
      { text: `Salto da fermo su rialzo con spinta rapida (3 serie da 5)`, cat: 'strength', howTo: `Salta da fermo su un rialzo basso e stabile, atterrando con i piedi ben piantati e scendendo con controllo. Aggiunge un elemento di precisione all'esplosività del polpaccio, utile quando il colpo di testa richiede anche di staccare nel punto giusto.` },
    ]},
    centrocampista: { why: 'Correre a lungo in modo efficiente richiede un polpaccio che lavora bene anche quando è già affaticato.', exercises: [
      { text: `Tecnica di corsa prolungata, contatto rapido col terreno (8-10 minuti)`, cat: 'run', howTo: `Corri a ritmo blando o moderato curando un contatto rapido e leggero del piede a terra, senza appoggiare troppo a lungo. Un contatto breve ed efficiente riduce lo stress cumulativo sul polpaccio durante una corsa prolungata.` },
      { text: `Calf raises ad alto volume (3 serie da 20)`, cat: 'strength', howTo: `Sali e scendi sulle punte dei piedi con tecnica pulita, puntando su un numero alto di ripetizioni piuttosto che sulla velocità. Costruisce la resistenza muscolare del polpaccio necessaria a chilometri di corsa in una partita.` },
      { text: `Salti su corda o simili, ritmo costante (2 minuti)`, cat: 'run', howTo: `Salta la corda (o simula il gesto) mantenendo un ritmo costante e regolare per tutta la durata. Allena il polpaccio a lavorare in modo efficiente e ripetitivo senza affaticarsi rapidamente.` },
      { text: `Corsa in leggera salita, passo breve (6-8 minuti)`, cat: 'run', howTo: `Se hai a disposizione una leggera pendenza, corri in salita con passi brevi e rapidi; altrimenti simula lo stesso passo corto su piano. La salita aumenta il lavoro richiesto al polpaccio ad ogni appoggio, utile per costruire resistenza extra.` },
    ]},
    attaccante: { why: 'La prima falcata dopo il fermo è quella che decide se stacchi davvero dall\'avversario — dipende dalla potenza esplosiva del polpaccio.', exercises: [
      { text: `Tecnica di prima falcata esplosiva da fermo (5-6 ripetizioni)`, cat: 'strength', howTo: `Da fermo, esegui la prima falcata di uno scatto concentrandoti sulla spinta immediata del polpaccio contro il terreno. La qualità di questo primo appoggio spesso decide se stacchi davvero dall'avversario o resti al suo fianco.` },
      { text: `Calf raises eccentrici su una gamba (3 serie da 10-12)`, cat: 'strength', howTo: `Sali sulle punte con entrambe le gambe, poi scendi lentamente sulla sola gamba di lavoro, controllando bene la fase di discesa. Il controllo eccentrico su una gamba sola si avvicina di più al carico reale di uno scatto singolo.` },
      { text: `Balzi orizzontali brevi, massima esplosività (3 serie da 5)`, cat: 'run', howTo: `Esegui piccoli balzi in avanti, uno dopo l'altro, cercando la massima distanza con un contatto a terra il più breve possibile. Allena la stessa esplosività orizzontale del polpaccio richiesta nella prima falcata di uno scatto.` },
      { text: `Ripetute brevi con recupero incompleto (6-8 scatti da 10-15 metri)`, cat: 'run', howTo: `Esegui scatti brevi con un recupero più corto del solito tra una ripetizione e l'altra, così che il polpaccio lavori anche in condizione di leggero affaticamento. Riproduce gli scatti ravvicinati che capitano quando un'azione si ripete più volte in poco tempo.` },
    ]},
  },
  hip_groin: {
    portiere: { why: 'Il tuffo laterale richiede un\'apertura dell\'anca ampia e improvvisa, spesso oltre il range di movimento usato normalmente.', exercises: [
      { text: `Tecnica di apertura dell'anca nel tuffo, controllata (3 serie da 6 per lato)`, cat: 'stretch', howTo: `Simula l'apertura dell'anca del tuffo laterale a velocità controllata, senza buttarti a terra, curando l'ampiezza del movimento. Allenare il gesto a velocità ridotta permette di costruire il range di movimento in sicurezza prima di riportarlo a piena velocità.` },
      { text: `Mobilità dell'anca in tutte le direzioni (2-3 minuti)`, cat: 'stretch', howTo: `Muovi attivamente l'anca in flessione, estensione, apertura e rotazione, in entrambe le direzioni. Un'anca mobile tollera meglio l'ampiezza di movimento improvvisa richiesta dal tuffo laterale.` },
      { text: `Rinforzo isometrico degli adduttori (3-4 serie da 8-10 secondi)`, cat: 'hold', howTo: `Stringi un pallone o un cuscino tra le ginocchia e spingi con decisione senza muovere le gambe, mantenendo la contrazione per alcuni secondi. Gli adduttori forti stabilizzano l'anca nel momento in cui si riporta la gamba dopo l'apertura del tuffo.` },
      { text: `Affondo laterale ampio con ritorno controllato (3 serie da 6 per lato)`, cat: 'stretch', howTo: `Esegui un affondo laterale il più ampio possibile mantenendo il controllo, poi torna in posizione spingendo con l'anca e la gamba interessata. Lavora l'anca nello stesso range ampio del tuffo, ma con un ritmo più lento e gestibile.` },
    ]},
    difensore: { why: 'Il posizionamento nel contrasto richiede stabilità dell\'anca sotto pressione laterale diretta.', exercises: [
      { text: `Tecnica di posizionamento nel contrasto, bacino stabile (3 serie da 8 per lato)`, cat: 'balance', howTo: `Assumi la posizione tipica del contrasto laterale, bacino basso e stabile, e mantieni la posizione per qualche secondo prima di tornare eretto. Un bacino stabile riduce il carico improvviso sull'anca quando il contatto arriva davvero.` },
      { text: `Plank laterale con schiacciata dell'adduttore, tipo Copenhagen (2-3 serie da 6-8 per lato)`, cat: 'hold', howTo: `In plank laterale con la gamba superiore appoggiata su un rialzo, solleva la gamba inferiore verso quella superiore contraendo l'adduttore. Uno degli esercizi più efficaci per rinforzare l'inguine nella posizione di carico laterale del contrasto.` },
      { text: `Cammino laterale con elastico (2-3 serie da 12-15 passi per lato)`, cat: 'strength', howTo: `Con un elastico sopra le caviglie, cammina lateralmente mantenendo una leggera flessione di anche e ginocchia. Rinforza i muscoli che stabilizzano l'anca nei movimenti laterali ripetuti tipici della fase difensiva.` },
      { text: `Contrasto laterale simulato con resistenza di un compagno (3 serie da 6 per lato)`, cat: 'balance', howTo: `Affiancati a un compagno spalla contro spalla e spingi lateralmente in modo controllato mantenendo la posizione, poi cambia lato. Riproduce il carico reale di un contrasto laterale in modo progressivo e sicuro.` },
    ]},
    centrocampista: { why: 'Cambiare direzione decine di volte per partita richiede che anca e adduttori reggano il carico ripetuto, non solo un singolo sforzo.', exercises: [
      { text: `Tecnica di cambio di direzione ripetuto, passo corto e controllato (6-8 ripetizioni)`, cat: 'run', howTo: `Cambia direzione più volte di fila su un percorso breve, usando passi corti e controllati invece di un unico taglio ampio. Un passo più corto riduce il carico su un singolo cambio di direzione quando la sequenza si ripete molte volte.` },
      { text: `Rinforzo dei flessori dell'anca con elastico (2-3 serie da 12-15)`, cat: 'strength', howTo: `Con un elastico attorno alla caviglia, porta il ginocchio verso il petto contro resistenza, controllando anche il ritorno. I flessori dell'anca lavorano in continuazione nei cambi di direzione ripetuti di un centrocampista.` },
      { text: `Mobilità dinamica dell'anca prima dello sforzo (2 minuti)`, cat: 'stretch', howTo: `Esegui slanci controllati della gamba in avanti, indietro e lateralmente, aumentando gradualmente l'ampiezza. Un'anca ben mobilizzata prima dello sforzo tollera meglio i tanti cambi di direzione di una partita.` },
      { text: `Percorso a otto tra coni, ritmo sostenuto (4-5 giri)`, cat: 'run', howTo: `Disponi due coni a qualche metro di distanza e percorri un otto attorno ad essi a ritmo sostenuto, curando l'anca nei cambi di direzione continui. Riproduce da vicino il tipo di sforzo ripetuto e vario richiesto dal ruolo.` },
    ]},
    attaccante: { why: 'Il tiro potente nasce in gran parte dall\'apertura e chiusura rapida dell\'anca, non solo dalla gamba.', exercises: [
      { text: `Tecnica di apertura dell'anca nel gesto del tiro, a vuoto (3 serie da 8 per lato)`, cat: 'stretch', howTo: `Simula il gesto del tiro a vuoto, senza pallone, concentrandoti sull'apertura e chiusura rapida dell'anca della gamba calciante. Allenare il gesto a vuoto permette di lavorare sull'ampiezza e la velocità senza il sovraccarico del contatto col pallone.` },
      { text: `Rinforzo isometrico degli adduttori (3-4 serie da 8-10 secondi)`, cat: 'hold', howTo: `Stringi un pallone tra le ginocchia e spingi con decisione mantenendo la contrazione per alcuni secondi. Adduttori forti stabilizzano l'anca della gamba d'appoggio mentre l'altra gamba calcia con potenza.` },
      { text: `Cammino laterale con elastico (2-3 serie da 12-15 passi per lato)`, cat: 'strength', howTo: `Con un elastico sopra le caviglie, cammina lateralmente con anche e ginocchia leggermente flesse. Rinforza la stabilità dell'anca anche nei movimenti laterali usati per smarcarsi o proteggere il pallone.` },
      { text: `Tiro di potenza dopo corsa di avvicinamento (8-10 tiri)`, cat: 'strength', howTo: `Avvicinati al pallone con qualche passo di rincorsa e calcia con la massima potenza controllata, curando l'apertura dell'anca nel gesto completo. Riporta il lavoro isometrico e di mobilità fatto negli altri esercizi dentro il gesto reale e a piena velocità.` },
    ]},
  },
  lower_back: {
    portiere: { why: 'Il tuffo spesso combina torsione del busto e allungamento nello stesso istante — il core deve reggere entrambe le cose insieme.', exercises: [
      { text: `Tecnica di torsione controllata nel tuffo, core attivo (3 serie da 6 per lato)`, cat: 'balance', howTo: `Simula la torsione del busto di un tuffo mantenendo il core attivo e contratto per tutta la durata del movimento. Un core attivo protegge la zona lombare quando torsione ed estensione avvengono nello stesso istante.` },
      { text: `Plank con rotazione (3 serie da 8-10 per lato)`, cat: 'hold', howTo: `Da plank sugli avambracci, ruota il bacino verso un lato avvicinandolo al pavimento senza perdere l'allineamento generale, poi torna al centro e ripeti dall'altro lato. Allena il controllo della rotazione del busto mantenendo comunque stabilità.` },
      { text: `Bird-dog (2-3 serie da 8-10 per lato)`, cat: 'balance', howTo: `In appoggio su mani e ginocchia, estendi contemporaneamente un braccio e la gamba opposta mantenendo la schiena piatta e stabile. Rinforza il controllo lombare nei movimenti che coinvolgono braccia e gambe insieme, come nel tuffo.` },
      { text: `Estensione controllata del busto da proni (2-3 serie da 10)`, cat: 'strength', howTo: `Sdraiato a pancia in giù, solleva leggermente il busto contraendo i muscoli della zona lombare, senza forzare in iperestensione. Rinforza la capacità della zona lombare di reggere l'estensione del busto tipica dell'ultima fase del tuffo.` },
    ]},
    difensore: { why: 'Il salto per il colpo di testa richiede che il core resti stabile mentre il resto del corpo si estende verso l\'alto.', exercises: [
      { text: `Tecnica di tenuta del core nel salto per il duello aereo (5-6 ripetizioni)`, cat: 'balance', howTo: `Salta verticalmente mantenendo il core attivo per tutta la durata del movimento, dalla spinta all'atterraggio. Un core stabile nel salto protegge la zona lombare quando il corpo si estende verso l'alto per il colpo di testa.` },
      { text: `Plank (3 serie da 30 secondi)`, cat: 'hold', howTo: `Mantieni la posizione di plank sugli avambracci con schiena dritta e bacino allineato, senza farlo cadere né sollevarlo troppo. Costruisce la resistenza di base del core necessaria a proteggere la zona lombare durante tutta la partita.` },
      { text: `Ponte glutei a due gambe (3 serie da 12-15)`, cat: 'strength', howTo: `Sdraiato supino con i piedi a terra, solleva il bacino contraendo i glutei fino ad allineare bacino, tronco e ginocchia. Glutei forti scaricano parte del lavoro che altrimenti ricadrebbe sulla zona lombare durante il salto.` },
      { text: `Salto verticale con leggero contatto in volo (4-5 ripetizioni)`, cat: 'balance', howTo: `Salta verticalmente mentre un compagno esercita un leggerissimo contatto durante il volo, mantenendo il core attivo per restare stabile. Avvicina l'esercizio alla realtà del duello aereo, dove il contatto imprevisto è la norma.` },
    ]},
    centrocampista: { why: 'Mantenere una postura efficiente per novanta minuti, anche affaticati, è ciò che protegge la zona lombare a lungo termine.', exercises: [
      { text: `Tecnica di postura sotto affaticamento, autocontrollo a metà sforzo (durante la sessione)`, cat: 'balance', howTo: `A metà di una sessione di corsa, fermati un istante e verifica consapevolmente la tua postura, raddrizzando bacino e schiena se necessario. Mantenere una buona postura anche quando la stanchezza sale è ciò che protegge davvero la zona lombare.` },
      { text: `Plank ad alto volume (3 serie da 30-40 secondi)`, cat: 'hold', howTo: `Mantieni il plank per una durata leggermente superiore al solito, con tecnica pulita per tutta la serie. Costruisce la resistenza del core necessaria a mantenere la postura per novanta minuti, non solo per pochi secondi.` },
      { text: `Bird-dog con leggero affaticamento pregresso (2-3 serie da 8-10 per lato)`, cat: 'balance', howTo: `Dopo una breve serie di corsa o salti, esegui subito il bird-dog controllando che la schiena resti stabile nonostante la fatica. Il controllo lombare quando sei già affaticato conta più di quello a freddo.` },
      { text: `Corsa prolungata con controllo posturale (10-12 minuti)`, cat: 'run', howTo: `Corri a ritmo blando o moderato per una durata prolungata, controllando periodicamente che il busto non si inclini troppo in avanti man mano che la fatica aumenta. Allena direttamente la resistenza posturale nel contesto in cui conta di più.` },
    ]},
    attaccante: { why: 'La rotazione del busto nel tiro potente scarica forza importante sulla zona lombare in un solo gesto esplosivo.', exercises: [
      { text: `Tecnica di rotazione del busto nel tiro, a vuoto e controllata (3 serie da 8 per lato)`, cat: 'balance', howTo: `Simula la rotazione del busto del tiro potente senza pallone, controllando il movimento sia nella fase di carico che di rilascio. Lavorare il gesto a vuoto permette di costruire ampiezza e controllo prima di riportarlo a piena potenza.` },
      { text: `Plank con rotazione (3 serie da 8-10 per lato)`, cat: 'hold', howTo: `Da plank sugli avambracci, ruota il bacino verso un lato senza perdere l'allineamento generale, poi torna al centro e ripeti dall'altro lato. Allena lo stesso schema di rotazione controllata richiesto dal tiro, ma a intensità più bassa.` },
      { text: `Rinforzo rotazionale del core con resistenza leggera (2-3 serie da 10 per lato)`, cat: 'strength', howTo: `Con un elastico o un peso leggero tenuto davanti al petto, ruota il busto da un lato all'altro mantenendo bacino e gambe stabili. Rinforza in modo specifico la muscolatura che genera e controlla la rotazione del tiro potente.` },
      { text: `Tiro di potenza con enfasi sul controllo del busto (8-10 tiri)`, cat: 'strength', howTo: `Calcia con la massima potenza controllata, prestando attenzione a non lasciare che il busto ruoti in modo scomposto oltre il necessario. Riporta il controllo costruito negli esercizi precedenti dentro il gesto reale e a piena velocità.` },
    ]},
  },
  shoulder_arm: {
    portiere: { why: 'La spalla del portiere lavora sopra la testa nei rinvii e assorbe l\'impatto diretto nei tuffi laterali — potenza di lancio e stabilità nell\'atterraggio vanno allenate insieme.', exercises: [
      { text: `Tecnica di rinvio progressivo, potenza controllata (8-10 ripetizioni)`, cat: 'strength', howTo: `Esegui rinvii con le mani aumentando gradualmente la potenza da un rinvio all'altro, senza forzare fin da subito al massimo. Costruire potenza in modo progressivo protegge la spalla nel gesto sopra la testa più ripetuto del ruolo.` },
      { text: `Atterraggio controllato sul lato dopo un tuffo simulato (3 serie da 5 per lato)`, cat: 'balance', howTo: `Simula un tuffo laterale a bassa intensità e atterra controllando l'impatto con il lato del corpo, senza scaricare tutto il peso di colpo sulla spalla. La tecnica di caduta è ciò che protegge davvero la spalla dall'impatto ripetuto dei tuffi.` },
      { text: `Rinforzo della cuffia dei rotatori con elastico (2-3 serie da 12-15)`, cat: 'strength', howTo: `Con un elastico, ruota l'avambraccio verso l'esterno mantenendo il gomito piegato e vicino al fianco. La cuffia dei rotatori stabilizza la spalla sia nel lancio sia nell'assorbire l'impatto di una caduta.` },
      { text: `Lancio e presa a distanza crescente (10-12 ripetizioni)`, cat: 'strength', howTo: `Lancia il pallone a un compagno aumentando gradualmente la distanza tra un lancio e il successivo, curando la tecnica del gesto sopra la testa. Ricostruisce in modo progressivo la tolleranza della spalla al lancio a piena potenza.` },
    ]},
    difensore: { why: 'Nei duelli aerei e nei blocchi, la spalla assorbe contatto diretto — la stabilità conta quanto la forza pura.', exercises: [
      { text: `Tecnica di blocco/schermatura con la spalla, controllata (3 serie da 8 per lato)`, cat: 'balance', howTo: `Simula il blocco o la schermatura di un avversario con la spalla a intensità controllata, mantenendo una posizione stabile. Allena la spalla a reggere un contatto diretto in modo tecnico piuttosto che passivo.` },
      { text: `Rinforzo della scapola sotto leggero carico (2-3 serie da 12)`, cat: 'strength', howTo: `Con un elastico o un peso leggero, esegui retrazioni della scapola tirando i gomiti indietro e stringendo le scapole. Una scapola ben controllata è la base su cui la spalla può assorbire un contatto diretto in sicurezza.` },
      { text: `Stabilità della spalla sotto contatto esterno leggero (3 serie da 8)`, cat: 'balance', howTo: `Con il braccio disteso contro un muro o la mano di un compagno, mantieni la posizione mentre ricevi una leggera pressione variabile. Allena la spalla a restare stabile quando il contatto arriva in modo imprevisto, come in un duello reale.` },
      { text: `Duello fisico simulato con braccio in appoggio (3 serie da 6 per lato)`, cat: 'balance', howTo: `Affiancati a un compagno e usa il braccio per mantenere la distanza mentre entrambi vi spingete leggermente, come in un duello fisico reale. Riporta il lavoro di stabilità fatto negli esercizi precedenti dentro un contesto più vicino al gioco.` },
    ]},
    centrocampista: { why: 'Meno centrale rispetto ad altri ruoli, ma i duelli fisici prolungati per novanta minuti mettono comunque sotto stress la spalla nel tempo.', exercises: [
      { text: `Rinforzo generale della cuffia dei rotatori (2-3 serie da 15)`, cat: 'strength', howTo: `Con un elastico leggero, ruota l'avambraccio verso l'esterno e verso l'interno mantenendo il gomito fermo al fianco. Un lavoro generale sulla cuffia dei rotatori protegge la spalla dai piccoli traumi ripetuti dei contatti fisici prolungati.` },
      { text: `Resistenza della spalla sotto carico ripetuto e leggero (2-3 serie da 15-20)`, cat: 'strength', howTo: `Esegui piccoli movimenti circolari o di elevazione del braccio con un peso leggero, puntando su tante ripetizioni piuttosto che sul carico. Costruisce la resistenza necessaria a reggere contatti fisici ripetuti per tutta la partita.` },
      { text: `Caduta controllata e appoggio sul braccio (3 serie da 5 per lato)`, cat: 'balance', howTo: `Simula una caduta laterale a bassa intensità su un tappetino, imparando ad ammortizzare l'impatto con l'avambraccio invece che con la mano rigida. Anche se meno centrale per questo ruolo, sapersi appoggiare bene riduce il rischio nei contatti occasionali.` },
      { text: `Mobilità della spalla in tutte le direzioni, a fine sessione (2 minuti)`, cat: 'stretch', howTo: `Muovi attivamente il braccio in elevazione, rotazione interna ed esterna, in entrambe le direzioni. Una spalla mobile recupera meglio dopo i contatti fisici prolungati subiti nel corso della partita.` },
    ]},
    attaccante: { why: 'Schermare il pallone con il braccio contro un difensore è un gesto ripetuto che richiede stabilità della spalla sotto pressione.', exercises: [
      { text: `Tecnica di schermatura del pallone, braccio stabile (3 serie da 8 per lato)`, cat: 'balance', howTo: `Proteggi un pallone fermo con il corpo mentre un compagno cerca di raggiungerlo, tenendo il braccio steso ma non rigido per mantenere la distanza. Un braccio stabile ma non teso al massimo riduce il rischio nella schermatura ripetuta del pallone.` },
      { text: `Rinforzo isometrico della spalla sotto pressione esterna (3 serie da 15-20 secondi)`, cat: 'hold', howTo: `Con il braccio disteso lateralmente, fatti applicare una pressione costante da un compagno e resisti senza muovere la spalla. Un buon controllo isometrico è ciò che permette di schermare il pallone a lungo senza cedere al contatto.` },
      { text: `Presa di posizione con contatto laterale leggero (3 serie da 8 per lato)`, cat: 'balance', howTo: `Affiancati a un compagno e mantieni la posizione tra lui e il pallone usando il tronco e la spalla, senza spingere con le braccia. Allena la spalla a reggere il contatto laterale continuo tipico di chi protegge palla con le spalle alla porta.` },
      { text: `Mobilità della spalla in tutte le direzioni, a fine sessione (2 minuti)`, cat: 'stretch', howTo: `Muovi attivamente il braccio in elevazione e rotazione, in entrambe le direzioni, a fine allenamento. Una spalla mobile recupera meglio dal contatto fisico ripetuto subito durante la protezione del pallone.` },
    ]},
  },
  hand_wrist: {
    portiere: { why: 'Presa e controllo del pallone dipendono dalla forza di dita e polso — è la base tecnica di ogni parata, non solo un dettaglio.', exercises: [
      { text: `Tecnica di presa progressiva su palloni a velocità crescente (10-12 ripetizioni)`, cat: 'strength', howTo: `Fatti lanciare palloni a velocità crescente, curando la presa sicura ad ogni intensità prima di passare alla successiva. La progressione graduale costruisce fiducia e forza di presa senza forzare subito al massimo.` },
      { text: `Rinforzo delle dita con una pallina morbida (3 serie da 15)`, cat: 'strength', howTo: `Stringi e rilascia una pallina morbida con le dita in modo ritmico e controllato. Dita forti sono la base di ogni presa sicura del pallone, specialmente su tiri potenti o bagnati.` },
      { text: `Appoggio controllato della mano dopo un tuffo simulato (3 serie da 6)`, cat: 'balance', howTo: `Simula un tuffo a bassa intensità e appoggia la mano a terra in modo controllato, con il polso leggermente flesso per assorbire l'impatto. La tecnica di appoggio riduce lo stress improvviso sul polso nelle cadute ripetute.` },
      { text: `Presa e rilascio rapido su rimbalzo (10-12 ripetizioni)`, cat: 'strength', howTo: `Fai rimbalzare il pallone contro un muro a distanza ravvicinata e prendilo al volo, rilasciandolo subito per il tentativo successivo. Allena la rapidità di presa richiesta nelle respinte ravvicinate e nei rimpalli in area.` },
    ]},
    difensore: { why: 'Le cadute durante i contrasti mettono spesso il polso sotto stress improvviso — la forza di base riduce il rischio di una distorsione.', exercises: [
      { text: `Rinforzo di presa generale con una pallina morbida (2-3 serie da 15)`, cat: 'strength', howTo: `Stringi e rilascia una pallina morbida con le dita in modo ritmico. Una presa di base più forte riduce il rischio quando la mano tocca terra in una caduta improvvisa durante un contrasto.` },
      { text: `Mobilità del polso in tutte le direzioni, a fine sessione`, cat: 'stretch', howTo: `Muovi attivamente il polso in flessione, estensione e rotazione in entrambe le direzioni, a fine allenamento. Un polso mobile assorbe meglio l'impatto di un appoggio improvviso a terra.` },
      { text: `Appoggio controllato della mano durante una caduta simulata (3 serie da 5 per lato)`, cat: 'balance', howTo: `Simula una caduta laterale a bassa intensità su un tappetino, imparando ad appoggiare la mano con il polso leggermente flesso invece che rigido. La tecnica di caduta riduce di molto lo stress improvviso sul polso rispetto a un appoggio istintivo e rigido.` },
      { text: `Push-up sulle nocche o su superficie morbida (2-3 serie da 8-10)`, cat: 'strength', howTo: `Esegui piegamenti sulle braccia appoggiando le nocche invece dei palmi, oppure su una superficie morbida come un tappetino. Rinforza polso e avambraccio nella posizione di carico che si verifica in un appoggio a terra.` },
    ]},
    centrocampista: { why: 'Come per gli altri ruoli di movimento, le cadute occasionali durante il gioco beneficiano di un polso più forte e mobile.', exercises: [
      { text: `Rinforzo di presa generale con una pallina morbida (2-3 serie da 15)`, cat: 'strength', howTo: `Stringi e rilascia una pallina morbida con le dita in modo ritmico e controllato. Una presa di base più forte riduce il rischio quando la mano tocca terra in una caduta occasionale durante il gioco.` },
      { text: `Mobilità del polso in tutte le direzioni, a fine sessione`, cat: 'stretch', howTo: `Muovi attivamente il polso in flessione, estensione e rotazione in entrambe le direzioni, a fine allenamento. Un polso mobile e pronto assorbe meglio l'impatto di un appoggio a terra imprevisto.` },
      { text: `Appoggio controllato della mano durante una caduta simulata (3 serie da 5 per lato)`, cat: 'balance', howTo: `Simula una caduta laterale a bassa intensità, imparando ad appoggiare la mano con il polso leggermente flesso invece che rigido. Utile soprattutto nei contrasti a centrocampo, dove le cadute imprevedibili sono frequenti.` },
      { text: `Mobilità delle dita e presa alternata (2-3 serie da 12)`, cat: 'stretch', howTo: `Apri e chiudi le dita al massimo range possibile, alternando con una breve presa su una pallina morbida. Mantiene mano e polso pronti senza richiedere un lavoro specifico aggiuntivo importante per questo ruolo.` },
    ]},
    attaccante: { why: 'Il contatto fisico continuo e le cadute occasionali beneficiano di un polso più forte e mobile, anche se non è il fattore principale per questo ruolo.', exercises: [
      { text: `Rinforzo di presa generale con una pallina morbida (2-3 serie da 15)`, cat: 'strength', howTo: `Stringi e rilascia una pallina morbida con le dita in modo ritmico. Anche se non centrale per il ruolo, una presa di base solida aiuta nelle cadute occasionali durante i contrasti fisici.` },
      { text: `Mobilità del polso in tutte le direzioni, a fine sessione`, cat: 'stretch', howTo: `Muovi attivamente il polso in flessione, estensione e rotazione, a fine allenamento. Un polso mobile riduce il rischio nelle cadute occasionali legate al contatto fisico continuo.` },
      { text: `Appoggio controllato della mano durante una caduta simulata (3 serie da 5 per lato)`, cat: 'balance', howTo: `Simula una caduta a bassa intensità, imparando ad appoggiare la mano con il polso leggermente flesso invece che rigido. Riduce il rischio nelle cadute che capitano nei contrasti fisici in area o a centrocampo.` },
      { text: `Mobilità delle dita e presa alternata (2-3 serie da 12)`, cat: 'stretch', howTo: `Apri e chiudi le dita al massimo range possibile, alternando con una breve presa su una pallina morbida. Un piccolo lavoro di mantenimento, utile anche se il polso non è la priorità principale per questo ruolo.` },
    ]},
  },
};
const techniqueDataIT = {
  portiere: { why: 'Il primo tocco di un portiere spesso è già l\'inizio dell\'azione — precisione e rapidità contano quanto le parate.', exercises: [
    { text: `Distribuzione con i piedi su bersagli a diverse distanze (15-20 palloni, corto/medio/lungo)`, cat: 'strength', howTo: `Posiziona tre bersagli a distanza corta, media e lunga (coni, sagome o compagni) e distribuisci il pallone con i piedi verso ciascuno, alternando le distanze. Punta sulla precisione prima che sulla potenza: un rinvio preciso a media distanza vale più di uno lungo ma impreciso.` },
    { text: `Controllo orientato sotto pressione simulata, poi rinvio rapido (10-12 ripetizioni)`, cat: 'balance', howTo: `Fatti pressare da un compagno che si avvicina mentre ricevi un retropassaggio, e controlla il pallone orientandolo subito verso lo spazio libero prima di rinviarlo rapidamente. Allena la rapidità di lettura sotto pressione, la situazione più comune negli errori di retropassaggio.` },
    { text: `Rinvio di precisione su corridoi stretti (10 tentativi per lato)`, cat: 'strength', howTo: `Delimita due corridoi stretti con dei coni, uno a sinistra e uno a destra, e prova a far arrivare il rinvio dentro il corridoio invece che in un'area generica. Restringere il bersaglio ti costringe a curare tecnica e precisione, non solo la distanza.` },
    { text: `Uscite basse con controllo del rimbalzo (8-10 ripetizioni)`, cat: 'balance', howTo: `Fatti lanciare palloni bassi e rasoterra da diverse angolazioni, uscendo per bloccarli o deviarli con la tecnica corretta di caduta laterale. Il controllo del rimbalzo su terreni irregolari è spesso ciò che fa la differenza tra un blocco pulito e una respinta corta pericolosa.` },
    { text: `Gioco con i piedi in superiorità numerica 2v1 (8-10 minuti)`, cat: 'balance', howTo: `Insieme a due compagni che si scambiano un pressing leggero, gestisci il possesso con i piedi cercando sempre l'appoggio libero. Allena la lettura rapida dello spazio richiesta oggi a un portiere che partecipa attivamente alla costruzione.` },
    { text: `Comunicazione e organizzazione della barriera su punizione (6-8 ripetizioni)`, cat: 'balance', howTo: `Su una punizione simulata dal limite dell'area, posiziona verbalmente la barriera e te stesso rispetto alla porta, correggendo la posizione se necessario. È un gesto più mentale che fisico, ma decisivo quanto una parata sui palloni inattivi.` },
    { text: `Uscite alte su cross, scelta tra presa e pugno (10-12 palloni)`, cat: 'strength', howTo: `Fatti crossare palloni alti da diverse posizioni e decidi in ogni caso se uscire in presa o respingere di pugno, in base a traiettoria e pressione avversaria simulata. Allena il giudizio rapido, spesso più determinante della sola elevazione fisica.` },
    { text: `Lettura e anticipo su lancio in profondità (8-10 ripetizioni)`, cat: 'run', howTo: `Fatti lanciare palloni in profondità alle spalle della linea difensiva e valuta ogni volta se uscire per anticipare o restare sulla porta. Un portiere moderno deve leggere questa situazione in una frazione di secondo, non solo saper parare da fermo.` },
  ]},
  difensore: { why: 'Il primo tocco dopo un recupero palla decide se la squadra riparte bene o perde di nuovo possesso.', exercises: [
    { text: `Primo tocco orientato in avanti, subito dopo un contrasto simulato (10-12 ripetizioni)`, cat: 'balance', howTo: `Fai un contrasto leggero simulato con un compagno, poi ricevi immediatamente un pallone e orientalo con il primo tocco verso lo spazio libero in avanti. Allena il passaggio mentale dal recupero palla al rilancio dell'azione, spesso il momento in cui si perde di nuovo il possesso.` },
    { text: `Controllo sotto pressione avversaria diretta (8-10 ripetizioni per lato)`, cat: 'balance', howTo: `Fatti marcare da vicino da un compagno mentre ricevi il pallone, e cerca di controllarlo proteggendolo con il corpo prima di girarti o passarlo. Riproduce la pressione reale che un difensore riceve appena tocca palla in fase di possesso.` },
    { text: `Passaggio lungo di precisione su bersaglio (15 tentativi)`, cat: 'strength', howTo: `Posiziona un bersaglio, un cono, una sagoma o un compagno, a 25-30 metri e prova a colpirlo con un passaggio lungo, variando l'angolo di partenza. Un passaggio lungo preciso permette alla squadra di saltare la pressione avversaria e ripartire velocemente.` },
    { text: `Conduzione palla in spazio stretto sotto pressing (5-6 serie brevi)`, cat: 'run', howTo: `In uno spazio delimitato stretto, conduci il pallone mentre un compagno cerca di pressarti, cercando di uscire dalla zona senza perdere il controllo. Allena la sicurezza nella conduzione quando il pressing avversario è alto e lo spazio per pensare è minimo.` },
    { text: `Marcatura e anticipo su palla scoperta (8-10 ripetizioni)`, cat: 'run', howTo: `Parti affiancato a un attaccante simulato e, al lancio di un compagno, cerca di anticiparlo sulla palla scoperta invece di aspettarlo. Il tempismo dell'anticipo è ciò che distingue un difensore che previene l'azione da uno che rincorre.` },
    { text: `Impostazione sotto pressing avversario alto (6-8 sequenze)`, cat: 'balance', howTo: `Ricevi il pallone dal portiere o da un compagno mentre un avversario simulato ti pressa da vicino, e decidi rapidamente se giocare corto, lungo o portare palla. Allena la capacità di restare lucido nella costruzione anche quando il pressing è alto, sempre più richiesta al ruolo.` },
    { text: `Duello aereo con tempismo di stacco (6-8 ripetizioni per lato)`, cat: 'strength', howTo: `Su un pallone crossato o lanciato, cura il tempismo dello stacco per arrivare al punto più alto del salto nell'istante dell'impatto con il pallone. Il tempismo, più della sola elevazione, decide la maggior parte dei duelli aerei.` },
    { text: `Copertura e diagonale difensiva (6-8 ripetizioni)`, cat: 'run', howTo: `Quando un compagno esce a pressare l'avversario, muoviti in diagonale per coprire lo spazio alle sue spalle, mantenendo la giusta distanza sia dal compagno che dall'attaccante. È un movimento poco visibile ma centrale per non lasciare spazi quando un compagno si sbilancia.` },
  ]},
  centrocampista: { why: 'Il centrocampista tocca il pallone più di chiunque altro — la qualità del primo controllo in spazi stretti fa la differenza.', exercises: [
    { text: `Controllo orientato in spazio stretto, un tocco per liberarsi (12-15 ripetizioni)`, cat: 'balance', howTo: `In uno spazio ridotto, ricevi il pallone e orientalo con un solo tocco nella direzione che ti libera dalla pressione più vicina. È il gesto che decide se il centrocampista guadagna tempo o perde subito il possesso.` },
    { text: `Cambio di gioco su lunga distanza, precisione (12 tentativi)`, cat: 'strength', howTo: `Da un lato del campo, prova a cambiare gioco con un passaggio lungo verso un bersaglio sul lato opposto, curando l'altezza e il peso del pallone perché arrivi giocabile. Un cambio di gioco preciso apre spazi che il pressing avversario aveva chiuso su un lato.` },
    { text: `Passaggio e movimento (dai e vai), ritmo sostenuto (8-10 sequenze)`, cat: 'run', howTo: `Passa il pallone a un compagno e muoviti immediatamente in uno spazio libero per ricevere il ritorno al primo tocco, mantenendo un ritmo sostenuto per tutta la sequenza. Il movimento dopo il passaggio, non il passaggio in sé, è spesso quello che sblocca l'azione.` },
    { text: `Ricezione spalle alla porta e giro in un tocco (10-12 ripetizioni)`, cat: 'balance', howTo: `Ricevi il pallone con le spalle rivolte alla porta avversaria e, con un solo tocco, giralo per orientarti verso l'azione offensiva. Allena un gesto tecnico che i centrocampisti usano di continuo per far ripartire l'azione senza perdere tempi preziosi.` },
    { text: `Scanning: controllo dello spazio prima di ricevere (10-12 ripetizioni)`, cat: 'balance', howTo: `Prima che il pallone arrivi, gira la testa per controllare posizione di avversari e compagni, poi ricevi orientandoti già in base a ciò che hai visto. Guardarsi intorno prima di ricevere, non dopo, è ciò che distingue un centrocampista che ha sempre tempo da uno sempre in affanno.` },
    { text: `Pressing e recupero palla in coppia (6-8 sequenze)`, cat: 'run', howTo: `Insieme a un compagno, pressa in modo coordinato un avversario che gestisce il pallone, chiudendo insieme le linee di passaggio più semplici. Il pressing efficace è quasi sempre un lavoro di squadra, non un inseguimento individuale.` },
    { text: `Inserimento senza palla in area (8-10 ripetizioni)`, cat: 'run', howTo: `Parti da centrocampo e inserisciti in area con tempismo, coordinandoti con il momento in cui un compagno riceve palla sull'esterno. L'inserimento giusto al momento giusto è un gesto tattico allenabile quanto un tiro o un passaggio.` },
    { text: `Copertura della profondità dopo una perdita di palla (6-8 ripetizioni)`, cat: 'run', howTo: `Subito dopo aver perso il possesso in fase offensiva, scatta indietro per coprire lo spazio più pericoloso invece di inseguire subito il pallone. La reazione immediata dopo una perdita di palla è spesso ciò che decide se la squadra subisce una ripartenza.` },
  ]},
  attaccante: { why: 'In area il tempo per pensare è quasi zero — il primo tocco verso la porta spesso vale più del tiro stesso.', exercises: [
    { text: `Controllo orientato in area sotto pressione, subito verso la porta (10-12 ripetizioni)`, cat: 'balance', howTo: `In area di rigore, ricevi il pallone con un difensore che ti pressa da dietro e orientalo con il primo tocco già verso la porta. In area il tempo per pensare è quasi nullo, quindi il primo tocco deve fare già gran parte del lavoro.` },
    { text: `Primo tocco su cross da diverse angolazioni (15 palloni)`, cat: 'balance', howTo: `Fatti crossare palloni da diverse angolazioni, fondo, mezzaluna, cross basso, e lavora il primo controllo per orientarti subito verso la conclusione. Cross diversi richiedono un primo tocco diverso, quindi vale la pena allenare più varianti, non solo una.` },
    { text: `Finalizzazione dopo conduzione rapida (8-10 ripetizioni)`, cat: 'run', howTo: `Conduci il pallone a ritmo sostenuto per alcuni metri e concludi a rete senza rallentare prima del tiro. Allena la capacità di tirare con precisione anche quando il corpo è ancora in movimento, come capita nella maggior parte delle occasioni reali.` },
    { text: `Tiro di prima intenzione su assist (12-15 tentativi)`, cat: 'strength', howTo: `Fatti servire assist da diverse posizioni e calcia al volo o di prima intenzione, senza controllare prima il pallone. È un gesto tecnico che richiede tempismo, e va allenato a parte perché diverso dal tiro dopo un controllo.` },
    { text: `Movimento ad aggirare il difensore (attacco alla profondità) (8-10 ripetizioni)`, cat: 'run', howTo: `Parti leggermente defilato rispetto al difensore e attacca lo spazio alle sue spalle nel momento in cui un compagno è pronto a servirti in profondità. Il movimento giusto prima del passaggio conta quanto la finalizzazione stessa.` },
    { text: `Gioco spalle alla porta e sponda per un compagno (10-12 ripetizioni)`, cat: 'strength', howTo: `Ricevi il pallone spalle alla porta sotto la pressione di un difensore e gioca una sponda pulita per un compagno in inserimento. Proteggere palla e far salire la squadra è un contributo importante quanto il gol per un attaccante che gioca spesso da riferimento.` },
    { text: `Finalizzazione di testa su cross (10-12 palloni)`, cat: 'balance', howTo: `Fatti crossare palloni da diverse posizioni e attacca la porta di testa, curando il tempismo dello stacco rispetto alla traiettoria. La finalizzazione aerea è un gesto tecnico a sé, che merita un allenamento specifico oltre al tiro con i piedi.` },
    { text: `Pressing offensivo sul portiere/primo difensore (6-8 ripetizioni)`, cat: 'run', howTo: `Dopo una perdita di palla in fase offensiva, pressa immediatamente il portiere o il primo difensore che riceve, chiudendo l'appoggio più semplice. Il primo a pressare dopo una perdita di palla è quasi sempre un attaccante, ed è un gesto che si allena quanto il tiro.` },
  ]},
};
const techniqueDataEN = {
  portiere: { why: 'A goalkeeper\'s first touch is often already the start of the attack — precision and speed matter as much as saves.', exercises: [
    { text: `Distribution with the feet to targets at different distances (15-20 balls, short/medium/long)`, cat: 'strength', howTo: `Set up three targets at short, medium and long distance (cones, mannequins or teammates) and distribute the ball with your feet to each, alternating distances. Prioritise precision over power: an accurate medium pass is worth more than a long, wayward one.` },
    { text: `Oriented control under simulated pressure, then quick clearance (10-12 reps)`, cat: 'balance', howTo: `Have a teammate close you down as you receive a back-pass, controlling the ball toward open space before clearing it quickly. Trains quick decision-making under pressure, the most common situation behind back-pass errors.` },
    { text: `Precision clearance through narrow lanes (10 attempts per side)`, cat: 'strength', howTo: `Mark out two narrow lanes with cones, one left and one right, and try to land the clearance inside the lane rather than a general area. Narrowing the target forces you to focus on technique and accuracy, not just distance.` },
    { text: `Low saves with rebound control (8-10 reps)`, cat: 'balance', howTo: `Have low, ground-level balls played to you from different angles, coming out to smother or parry them with correct lateral-fall technique. Controlling the bounce on uneven ground often decides between a clean save and a dangerous short rebound.` },
    { text: `Playing out with the feet in a 2v1 (8-10 minutes)`, cat: 'balance', howTo: `With two teammates taking turns to press lightly, manage possession with your feet, always looking for the free option. Trains the quick spatial reading required of a modern ball-playing goalkeeper.` },
    { text: `Communication and organizing the wall on a free kick (6-8 reps)`, cat: 'balance', howTo: `On a simulated edge-of-the-box free kick, verbally position the wall and yourself relative to the goal, correcting as needed. A more mental than physical skill, but just as decisive as a save on set pieces.` },
    { text: `High crosses, choosing between catching and punching (10-12 balls)`, cat: 'strength', howTo: `Have high crosses played in from different positions and decide each time whether to catch or punch, based on trajectory and simulated pressure. Trains quick judgment, often more decisive than jumping ability alone.` },
    { text: `Reading and anticipating a through-ball (8-10 reps)`, cat: 'run', howTo: `Have through-balls played in behind the defensive line and judge each time whether to rush out or stay on your line. A modern goalkeeper must read this in a split second, not just make saves from a standing position.` },
  ]},
  difensore: { why: 'The first touch after winning the ball decides whether the team breaks out well or loses possession again.', exercises: [
    { text: `Forward-oriented first touch, right after a simulated tackle (10-12 reps)`, cat: 'balance', howTo: `Do a light simulated tackle with a teammate, then immediately receive a ball and direct your first touch toward free space ahead. Trains the mental switch from winning the ball to starting the attack, often when possession is lost again.` },
    { text: `Control under direct opponent pressure (8-10 reps per side)`, cat: 'balance', howTo: `Have a teammate mark you tightly as you receive the ball, controlling it while shielding with your body before turning or passing. Reproduces the real pressure a defender feels the instant they touch the ball in possession.` },
    { text: `Long precision pass to a target (15 attempts)`, cat: 'strength', howTo: `Place a target — a cone, a mannequin or a teammate — 25-30 metres away and try to hit it with a long pass, varying your starting angle. An accurate long pass lets the team skip the opponent's press and break forward quickly.` },
    { text: `Ball carrying in tight space under pressing (5-6 short sets)`, cat: 'run', howTo: `In a tight marked-off space, carry the ball while a teammate tries to press you, trying to get out of the zone without losing control. Trains confident ball-carrying when the opponent's press is high and there's little time to think.` },
    { text: `Marking and anticipating on an exposed ball (8-10 reps)`, cat: 'run', howTo: `Start alongside a simulated attacker and, as a teammate plays a long ball, try to beat them to it instead of waiting. The timing of the interception is what separates a defender who prevents the play from one who chases it.` },
    { text: `Playing out under a high opponent press (6-8 sequences)`, cat: 'balance', howTo: `Receive the ball from the keeper or a teammate while a simulated opponent presses closely, and quickly decide whether to play short, go long, or carry it. Trains staying composed in build-up under a high press, an increasingly common demand of the role.` },
    { text: `Aerial duel with take-off timing (6-8 reps per side)`, cat: 'strength', howTo: `On a crossed or thrown ball, time your take-off to reach the highest point of your jump right as the ball arrives. Timing, more than jumping ability alone, decides most aerial duels.` },
    { text: `Cover and defensive diagonal run (6-8 reps)`, cat: 'run', howTo: `When a teammate steps up to press an opponent, move diagonally to cover the space behind them, keeping the right distance from both teammate and attacker. A subtle but crucial movement to avoid leaving gaps when a teammate is drawn out of position.` },
  ]},
  centrocampista: { why: 'A midfielder touches the ball more than anyone else — the quality of the first touch in tight spaces makes the difference.', exercises: [
    { text: `Oriented control in tight space, one touch to get free (12-15 reps)`, cat: 'balance', howTo: `In a small space, receive the ball and direct it with a single touch toward whatever side frees you from the nearest pressure. The action that decides whether a midfielder buys time or loses the ball immediately.` },
    { text: `Long-distance switch of play, precision (12 attempts)`, cat: 'strength', howTo: `From one side of the pitch, try switching play with a long pass to a target on the opposite side, minding height and weight so it's playable on arrival. An accurate switch opens space the opponent's press had closed off on one side.` },
    { text: `Pass and move, sustained rhythm (8-10 sequences)`, cat: 'run', howTo: `Pass the ball to a teammate and immediately move into free space to receive the first-time return, keeping a sustained rhythm throughout. The movement after the pass, not the pass itself, is often what unlocks the play.` },
    { text: `Receiving back to goal and turning in one touch (10-12 reps)`, cat: 'balance', howTo: `Receive the ball with your back to the opponent's goal and, in one touch, turn it to face the attacking play. Trains a technique midfielders use constantly to restart the attack without losing precious time.` },
    { text: `Scanning: checking space before receiving (10-12 reps)`, cat: 'balance', howTo: `Before the ball arrives, turn your head to check the position of opponents and teammates, then receive already oriented by what you saw. Scanning before receiving, not after, is what separates a midfielder who always seems to have time from one who's always under pressure.` },
    { text: `Pressing and winning the ball in a pair (6-8 sequences)`, cat: 'run', howTo: `Together with a teammate, press an opponent in possession in a coordinated way, jointly closing off the easiest passing lanes. Effective pressing is almost always teamwork, not an individual chase.` },
    { text: `Off-the-ball run into the box (8-10 reps)`, cat: 'run', howTo: `Start from midfield and time a run into the box, coordinating with the moment a teammate receives the ball wide. The right run at the right time is a tactical skill just as trainable as a shot or a pass.` },
    { text: `Covering depth after losing the ball (6-8 reps)`, cat: 'run', howTo: `Right after losing possession in attack, sprint back to cover the most dangerous space instead of immediately chasing the ball. The immediate reaction after losing the ball often decides whether the team concedes a counter-attack.` },
  ]},
  attaccante: { why: 'In the box there\'s almost no time to think — the first touch toward goal is often worth more than the shot itself.', exercises: [
    { text: `Oriented control in the box under pressure, straight toward goal (10-12 reps)`, cat: 'balance', howTo: `In the box, receive the ball with a defender pressing from behind and direct your first touch straight toward goal. There's almost no time to think in the box, so the first touch has to do most of the work.` },
    { text: `First touch on crosses from different angles (15 balls)`, cat: 'balance', howTo: `Have crosses played in from different angles — byline, edge of the box, low cross — and work your first touch to orient straight toward a finish. Different crosses need a different first touch, so it's worth training several variants, not just one.` },
    { text: `Finishing after a quick carry (8-10 reps)`, cat: 'run', howTo: `Carry the ball at pace for a few metres and finish on goal without slowing down before the shot. Trains shooting accurately while the body is still moving, as happens in most real chances.` },
    { text: `First-time shot on an assist (12-15 attempts)`, cat: 'strength', howTo: `Have assists played to you from different positions and strike first-time, without controlling the ball first. A technique that requires timing and needs dedicated practice, since it differs from shooting off a controlled touch.` },
    { text: `Movement around the defender (attacking depth) (8-10 reps)`, cat: 'run', howTo: `Start slightly offset from the defender and attack the space behind them the moment a teammate is ready to play you through. The right movement before the pass matters as much as the finish itself.` },
    { text: `Playing with your back to goal and laying it off (10-12 reps)`, cat: 'strength', howTo: `Receive the ball with your back to goal under a defender's pressure and lay off a clean pass for an onrushing teammate. Holding the ball up and bringing the team forward is as valuable as a goal for a target-man forward.` },
    { text: `Heading finish from a cross (10-12 balls)`, cat: 'balance', howTo: `Have crosses played in from different positions and attack the goal with your head, timing your jump to the flight of the ball. Aerial finishing is its own skill, worth dedicated practice alongside shooting with the feet.` },
    { text: `Offensive press on the goalkeeper/first defender (6-8 reps)`, cat: 'run', howTo: `After losing the ball in attack, immediately press the goalkeeper or first defender who receives it, cutting off the easiest option. The first player to press after losing the ball is almost always a forward, and it's a skill worth training as much as shooting.` },
  ]},
};
const regionRoleExercisesEN = {
  ankle_foot: {
    portiere: { why: 'On dives, the ankle absorbs load on unstable footing — landing technique matters as much as raw strength.', exercises: [
      { text: `Landing technique from a lateral dive, stable ankle on impact (3 sets of 5 per side)`, cat: 'balance', howTo: `Simulate a lateral dive from standing or a single step, landing with the ankle aligned under the knee without collapsing inward. Control in the last instant before landing matters more than the push itself.` },
      { text: `Explosive lateral push-off from standing (3 sets of 5 per side)`, cat: 'strength', howTo: `From standing, push off explosively to the side as if starting a dive, loading the standing leg and resetting right away. Rebuilds the ankle's push-off power without the risk of a real landing.` },
      { text: `Single-leg balance on an unstable surface (3 sets of 20-30 seconds)`, cat: 'balance', howTo: `Balance on one leg on a wobble cushion or soft surface, knee slightly bent. Retrains the small automatic adjustments needed to hold an unstable landing during a dive.` },
      { text: `Side-to-side hops between two points, controlled landing (3 sets of 8)`, cat: 'balance', howTo: `Hop sideways from foot to foot between two points about 40-50cm apart, landing with a stable ankle each time before immediately going the other way. Reproduces the repeated lateral load typical of goalkeeping, at a match-like rhythm.` },
    ]},
    difensore: { why: 'In aerial duels the landing often happens on one foot, sometimes in contact — the ankle needs to hold up even off-balance.', exercises: [
      { text: `Landing technique from a header duel, single leg (3 sets of 6 per side)`, cat: 'balance', howTo: `Jump as if for a header and land in a controlled way on one leg, bending knee and hip slightly to absorb the impact. Same movement pattern as a real aerial duel, without an opponent complicating the landing.` },
      { text: `Lateral lunges with ankle control (3 sets of 10 per side)`, cat: 'strength', howTo: `Perform a wide lateral lunge, pushing the hips back and keeping the working foot firmly planted without collapsing inward. Strengthens the ankle in the lateral loading position typical of a tackle.` },
      { text: `Ankle stability under light external push (3 sets of 8)`, cat: 'balance', howTo: `Balancing on one leg, have a teammate give small unexpected pushes on your shoulders or hips while you resist without losing your footing. Trains the ankle's automatic reaction to the unpredictable contact of a duel.` },
      { text: `Jump and land under simulated contact (3 sets of 6 per side)`, cat: 'balance', howTo: `Jump for a header while a teammate applies light contact mid-air, then land keeping the ankle controlled despite the imbalance. The next step up from landing cleanly alone, since it adds the real unpredictability of a duel.` },
    ]},
    centrocampista: { why: 'Repeated braking and restarting over ninety minutes puts the ankle under cumulative stress, not just a single load spike.', exercises: [
      { text: `Braking and restarting technique, repeated (6-8 reps)`, cat: 'run', howTo: `Run a few metres, brake in a controlled way planting the foot firmly, and set off again immediately in the same or a different direction. Trains the ankle to handle the same action many times in a row, as really happens in a match.` },
      { text: `Single-leg balance with pre-existing light fatigue (3 sets of 20 seconds)`, cat: 'balance', howTo: `After a short set of running or jumps, immediately balance on one leg. Balance while already somewhat fatigued is what actually matters at minute 70 of a match, not balance when fresh.` },
      { text: `Ankle mobility in all directions, end of session (2 minutes)`, cat: 'stretch', howTo: `At the end of training, actively move the ankle through flexion, extension and circles in both directions. An ankle that regains mobility after effort tolerates the cumulative load of frequent sessions better.` },
      { text: `Pace changes on a shuttle course (5-6 there-and-back reps)`, cat: 'run', howTo: `Over 10-15 metres, alternate an easy jog with a short acceleration and a controlled slow-down, repeating back and forth. Reproduces the constant intensity changes a midfielder's ankle must handle for ninety minutes.` },
    ]},
    attaccante: { why: 'The explosive change of direction to beat a defender loads the ankle sharply and sideways.', exercises: [
      { text: `Explosive change of direction technique, 45° cut (3 sets of 6 per side)`, cat: 'run', howTo: `Run a few steps, then cut sharply at about 45 degrees pushing firmly off the outside leg, keeping the ankle stable at the moment of the change. The action that most often puts a forward's ankle at risk during a dribble.` },
      { text: `Reactivity: sprint off on an unpredictable cue (5-6 reps)`, cat: 'run', howTo: `Stand still or move lightly and sprint off as soon as a teammate gives an unpredictable visual or verbal cue. Trains the ankle to handle a sudden acceleration with no time to prepare, as really happens against a defender.` },
      { text: `Resistance band work in all directions (2-3 sets of 12 per direction)`, cat: 'strength', howTo: `With a band around the forefoot, move the foot against resistance into flexion, extension and inward/outward. Targets the muscles that stabilise the ankle during rapid changes of direction.` },
      { text: `Tight slalom through markers at match pace (4-5 passes)`, cat: 'run', howTo: `Set up 4-5 markers close together and weave through them with quick changes of direction, keeping the pace as close as possible to a real attacking move. Trains the ankle to restabilise repeatedly in a small space and little time.` },
    ]},
  },
  knee: {
    portiere: { why: 'The lateral push for a dive loads the standing knee asymmetrically and suddenly.', exercises: [
      { text: `Lateral push-off technique for diving, knee aligned (3 sets of 5 per side)`, cat: 'balance', howTo: `Simulate the lateral push of a dive, checking that the standing knee stays aligned with foot and hip, without caving inward. The technical control that protects the knee in the role's most repeated action.` },
      { text: `Controlled single-leg squat (3 sets of 8 per side)`, cat: 'strength', howTo: `Lower into a single-leg squat as slowly as possible, keeping the knee aligned over the foot. Rebuilds the strength and control needed to bear body weight alone during the push for a dive.` },
      { text: `Glute medius strengthening with a band (2-3 sets of 15)`, cat: 'strength', howTo: `With a band above the knees, move the leg out to the side while keeping the hips stable and the trunk still. A strong glute medius is what stops the knee from caving inward during the push.` },
      { text: `Lateral lunge with explosive return push (3 sets of 6 per side)`, cat: 'strength', howTo: `Perform a wide lateral lunge and, from the lowest point, push firmly back up to standing. A more dynamic version of the lateral push used for diving, closer to the real action.` },
    ]},
    difensore: { why: 'In a tackle the knee often works flexed and rotated at the same time — technique reduces risk more than strength alone.', exercises: [
      { text: `Tackling lunge technique, knee never past the toes (3 sets of 8 per side)`, cat: 'balance', howTo: `Perform a forward lunge as if going into a tackle, keeping the knee from ever passing the toes and staying aligned. Reduces the twisting load on the knee at the moment of contact.` },
      { text: `Controlled step-ups (3 sets of 10 per side)`, cat: 'strength', howTo: `Step up onto a box or step with one leg, pushing through the heel and controlling the way down just as slowly. Strengthens the knee through the range used when pushing off the ground in a tackle.` },
      { text: `Single-leg stability with perturbation (3 sets of 8)`, cat: 'balance', howTo: `Balancing on one leg, have small unexpected pushes applied while keeping the knee slightly bent and stable. Trains the knee's reaction to a sudden, off-axis load, as in a real tackle.` },
      { text: `Change of direction with simulated contact on the standing leg (3 sets of 6 per side)`, cat: 'balance', howTo: `Change running direction while a teammate applies light contact on the standing leg right at footstrike. Trains the knee to stay stable even when contact arrives exactly as your weight is on one leg.` },
    ]},
    centrocampista: { why: 'Dozens of repeated decelerations in a match stress the knee more than the number of sprints itself.', exercises: [
      { text: `Repeated deceleration technique in three steps (6-8 reps)`, cat: 'run', howTo: `Run and brake, spreading the slow-down across three successive steps instead of one, bending the knees progressively. Reduces the peak load on a single knee across the many repeated braking actions of a match.` },
      { text: `High-volume controlled squats (3 sets of 15)`, cat: 'strength', howTo: `Perform bodyweight squats with controlled technique, aiming for higher reps rather than added load. Builds the muscular endurance around the knee needed for repeated efforts over ninety minutes.` },
      { text: `Single-leg standing endurance (3 sets of 30 seconds)`, cat: 'hold', howTo: `Hold your balance on one leg for as long as possible with good technique, over several sets. A knee that handles a prolonged single-leg stance well tolerates accumulated fatigue better in the second half.` },
      { text: `Running with pace changes and close-together braking (8-10 minutes)`, cat: 'run', howTo: `Alternate easy jogging with short accelerations followed by controlled braking, for a duration similar to a real prolonged match effort. Trains the knee to handle repeated deceleration as fatigue sets in, not just when fresh.` },
    ]},
    attaccante: { why: 'Pivoting on one leg to shield the ball or beat a defender puts the knee under rotational load.', exercises: [
      { text: `Controlled single-leg pivot technique (3 sets of 6 per side)`, cat: 'balance', howTo: `Rotate the body around a planted standing leg, as if shielding the ball or beating a defender, keeping the knee aligned through the turn. Controlling the twist reduces sudden rotational load on the knee.` },
      { text: `Jumps with stable single-leg landing (3 sets of 6 per side)`, cat: 'balance', howTo: `Jump forward or sideways and land on one leg, absorbing the impact by bending knee and hip without letting the knee cave in. Rebuilds the ability to land safely after a jump or an aerial challenge.` },
      { text: `Eccentric quadriceps strengthening (2-3 sets of 8-10)`, cat: 'strength', howTo: `Lower very slowly into a squat or lunge, emphasising the descent over the way back up. Eccentric quadriceps control is what brakes the knee during deceleration and changes of direction.` },
      { text: `Dribbling with rapid change of standing leg (5-6 sequences)`, cat: 'balance', howTo: `Dribble the ball switching your standing leg rapidly as if beating an imaginary defender, making sure the knee stays stable on each switch. Reproduces the specific load of dribbling at speed.` },
    ]},
  },
  thigh: {
    portiere: { why: 'The explosive push-off from standing for a dive needs immediate power, with no real run-up.', exercises: [
      { text: `Explosive push-off technique from standing (5-6 reps)`, cat: 'strength', howTo: `From standing, push off firmly to one side as if launching into a dive, with no run-up at all. Rebuilds the thigh's ability to produce immediate power with no time to load the movement.` },
      { text: `Lunges emphasizing the push phase (3 sets of 8 per side)`, cat: 'strength', howTo: `Perform a lunge and, from the lowest point, push firmly back to standing as fast as possible. Trains exactly the explosive phase of the movement, closest to the real push of a dive.` },
      { text: `Assisted Nordic curls (2-3 sets of 5-6)`, cat: 'strength', howTo: `Kneeling with ankles held by a teammate, lower forward as slowly as possible, only helping with your hands when truly needed. Strengthens the hamstrings in their braking role, as important as the push itself.` },
      { text: `Standing long jumps, controlled landing (4-5 reps)`, cat: 'strength', howTo: `From standing, jump forward as far as possible and land balanced on both feet, bending the knees to absorb impact. Trains the same explosive thigh power required for diving, with an easier action to control.` },
    ]},
    difensore: { why: 'The jump for an aerial duel is an explosive action that loads the thigh similarly to a pure vertical jump.', exercises: [
      { text: `Aerial duel take-off technique, balanced push (5-6 reps)`, cat: 'strength', howTo: `Jump vertically as if for a header, pushing evenly with both legs and timing the take-off carefully. A balanced push reduces overload on a single thigh across repeated duels.` },
      { text: `Controlled jump squats (3 sets of 6)`, cat: 'strength', howTo: `Lower into a squat and jump vertically with intent, landing in a controlled, cushioned way. Rebuilds thigh power for the take-off, with a landing that's easier to manage than the real duel.` },
      { text: `Glute/hamstring bridge (3 sets of 12-15)`, cat: 'strength', howTo: `Lying on your back with heels on the floor, lift the hips by squeezing glutes and hamstrings, then lower with control. Strengthens the posterior chain, which contributes to the take-off as much as the quadriceps.` },
      { text: `Simulated aerial duel with light mid-air contact (4-5 reps per side)`, cat: 'strength', howTo: `Jump for a header while a teammate applies very light lateral contact mid-jump, so the thigh gets used to stabilising even when balance isn't perfect. Brings the drill closer to a real aerial duel.` },
    ]},
    centrocampista: { why: 'Running at sustained intensity for most of the match is more about muscular endurance than pure speed.', exercises: [
      { text: `Sustained-intensity running technique, efficient stride (8-10 minutes at a steady pace)`, cat: 'run', howTo: `Run at a sustained but sustainable pace, focusing on a regular, efficient stride rather than top speed. Trains the thigh to work well over prolonged effort, the role's real demand more than an isolated sprint.` },
      { text: `Circuit lunges, high volume (3 sets of 12 per side)`, cat: 'strength', howTo: `Perform lunges back to back, alternating legs, aiming for a high number of reps while keeping clean technique. Builds the muscular endurance the thigh needs to repeat actions without a drop in quality.` },
      { text: `Eccentric quadriceps work, slow lowering (2-3 sets of 8-10)`, cat: 'strength', howTo: `Lower very slowly into a squat, counting several seconds on the descent alone. The ability to brake the movement in a controlled way is what protects the thigh as fatigue builds late in a match.` },
      { text: `Progressive running with pace variations (10-12 minutes)`, cat: 'run', howTo: `Alternate a few easy minutes with short faster bursts, never reaching a maximal sprint, for a total duration close to a real match effort. Trains the thigh to switch intensity repeatedly without losing efficiency.` },
    ]},
    attaccante: { why: 'Decelerating right after a maximal sprint is often the riskiest moment for the thigh, not the sprint itself.', exercises: [
      { text: `Post-sprint deceleration technique, three controlled steps (5-6 reps)`, cat: 'run', howTo: `Sprint a few metres and brake by spreading the slow-down across three progressively shorter steps, instead of stopping abruptly. Decelerating well, not just accelerating well, is what really protects a forward's thigh.` },
      { text: `Explosive acceleration from standing (5-6 reps of 10 meters)`, cat: 'run', howTo: `Start from standing and accelerate as fast as possible over about 10 metres, recovering well between reps. Rebuilds the thigh's explosive power for sprinting, the role's most typical attacking action.` },
      { text: `Assisted Nordic curls (2-3 sets of 5-6)`, cat: 'strength', howTo: `Kneeling with ankles held, lower forward as slowly as possible, resisting with the hamstrings. Good eccentric control here clearly reduces strain risk during deceleration after a sprint.` },
      { text: `Sprint and brake on a sudden cue (5-6 reps)`, cat: 'run', howTo: `Sprint at full speed and, on an unpredictable cue from a teammate, brake as quickly as possible while staying in control. Reproduces the real combination of acceleration and sudden deceleration that most risks the thigh in a match.` },
    ]},
  },
  calf_region: {
    portiere: { why: 'The calf generates the explosive lateral push to cover distance on a dive in a split second.', exercises: [
      { text: `Explosive lateral push-off technique from the calf (3 sets of 5 per side)`, cat: 'strength', howTo: `Simulate the lateral push of a dive focusing on the final push of the calf against the ground, not just the whole leg. The last element that generates speed in a dive, often overlooked compared to hip and knee.` },
      { text: `Explosive calf raises (3 sets of 10)`, cat: 'strength', howTo: `Rise onto your toes as fast as possible and lower under control, repeating at an explosive rhythm. Builds the rapid calf power needed for the immediate push of a dive.` },
      { text: `Single-leg balance with small bounces (3 sets of 15 seconds)`, cat: 'balance', howTo: `Balancing on one leg, do small bounces on your toes while keeping the ankle controlled. Trains the calf to work reactively under unstable load, as in the instant before a dive.` },
      { text: `Short lateral bounds, maximum quickness (3 sets of 6 per side)`, cat: 'run', howTo: `Do small lateral bounds from foot to foot, staying as low to the ground as possible and prioritising quick ground contact over distance. Reproduces the explosive, reactive calf rhythm needed to cover the goal side to side.` },
    ]},
    difensore: { why: 'The vertical take-off for a header depends largely on calf power in the instant before the jump.', exercises: [
      { text: `Vertical take-off technique, quick calf drive (5-6 reps)`, cat: 'strength', howTo: `Jump vertically emphasising the final ankle and calf drive in the last instant before leaving the ground. The technical detail that often makes the difference of a few centimetres in an aerial duel.` },
      { text: `Progressive calf raises (3 sets of 15)`, cat: 'strength', howTo: `Rise onto your toes with controlled technique, gradually increasing reps across sets. Builds the base calf strength needed to handle repeated take-offs during a match.` },
      { text: `Repeated vertical jumps, controlled landing (3 sets of 6)`, cat: 'strength', howTo: `Jump vertically several times in a row, landing softly each time before jumping again. Trains the calf to handle the repeated load of several close aerial duels, not just one.` },
      { text: `Standing jump onto a low box with a quick push (3 sets of 5)`, cat: 'strength', howTo: `Jump from standing onto a low, stable box, landing with feet firmly planted and stepping down under control. Adds a precision element to calf explosiveness, useful when a header also needs the right take-off spot.` },
    ]},
    centrocampista: { why: 'Running efficiently for a long time requires a calf that still works well even when already fatigued.', exercises: [
      { text: `Sustained running technique, quick ground contact (8-10 minutes)`, cat: 'run', howTo: `Run at an easy to moderate pace with quick, light ground contact, not lingering on each step. A short, efficient contact reduces cumulative stress on the calf during prolonged running.` },
      { text: `High-volume calf raises (3 sets of 20)`, cat: 'strength', howTo: `Rise and lower onto your toes with clean technique, aiming for high reps rather than speed. Builds the calf endurance needed for the kilometres covered in a match.` },
      { text: `Rope-style jumps, steady rhythm (2 minutes)`, cat: 'run', howTo: `Skip rope (or simulate the motion) keeping a steady, regular rhythm throughout. Trains the calf to work efficiently and repetitively without tiring quickly.` },
      { text: `Light uphill running, short strides (6-8 minutes)`, cat: 'run', howTo: `If you have a gentle slope available, run uphill with short, quick strides; otherwise mimic the same short stride on flat ground. The incline increases the calf's workload on every step, useful for building extra endurance.` },
    ]},
    attaccante: { why: 'The first stride after standing still is what decides whether you actually get ahead of the defender — it depends on calf explosiveness.', exercises: [
      { text: `Explosive first-stride technique from standing (5-6 reps)`, cat: 'strength', howTo: `From standing, take the first stride of a sprint focusing on an immediate calf push against the ground. The quality of this first step often decides whether you truly get away from a defender or stay level.` },
      { text: `Single-leg eccentric calf raises (3 sets of 10-12)`, cat: 'strength', howTo: `Rise onto your toes with both legs, then lower slowly on the working leg alone, controlling the descent well. Single-leg eccentric control is closer to the real load of a single sprint.` },
      { text: `Short horizontal bounds, maximum explosiveness (3 sets of 5)`, cat: 'run', howTo: `Do small forward bounds, one after another, seeking maximum distance with the shortest possible ground contact. Trains the same horizontal calf explosiveness needed for the first stride of a sprint.` },
      { text: `Short repeats with incomplete recovery (6-8 sprints of 10-15 meters)`, cat: 'run', howTo: `Do short sprints with shorter-than-usual recovery between reps, so the calf also works while somewhat fatigued. Reproduces the closely-spaced sprints that happen when an attacking move repeats within a short span.` },
    ]},
  },
  hip_groin: {
    portiere: { why: 'The lateral dive requires a wide, sudden hip opening, often beyond the range used in normal movement.', exercises: [
      { text: `Controlled hip-opening technique for diving (3 sets of 6 per side)`, cat: 'stretch', howTo: `Simulate the hip-opening of a lateral dive at controlled speed, without actually going to ground, focusing on range of motion. Training the action at reduced speed builds range safely before returning it to full speed.` },
      { text: `Hip mobility in all directions (2-3 minutes)`, cat: 'stretch', howTo: `Actively move the hip through flexion, extension, opening and rotation, in both directions. A mobile hip tolerates the sudden range of motion required by a lateral dive better.` },
      { text: `Isometric adductor strengthening (3-4 sets of 8-10 second holds)`, cat: 'hold', howTo: `Squeeze a ball or cushion between your knees and press firmly without moving your legs, holding the contraction for a few seconds. Strong adductors stabilise the hip when bringing the leg back after a dive's opening.` },
      { text: `Wide lateral lunge with controlled return (3 sets of 6 per side)`, cat: 'stretch', howTo: `Perform as wide a lateral lunge as you can control, then return to standing by pushing through the hip and working leg. Works the hip through the same wide range as a dive, at a slower, manageable pace.` },
    ]},
    difensore: { why: 'Tackling positioning requires hip stability under direct lateral pressure.', exercises: [
      { text: `Tackling positioning technique, stable pelvis (3 sets of 8 per side)`, cat: 'balance', howTo: `Take up the typical low, stable-pelvis position of a lateral tackle, holding it for a few seconds before standing back up. A stable pelvis reduces the sudden hip load when contact actually arrives.` },
      { text: `Side plank with adductor squeeze, Copenhagen-style (2-3 sets of 6-8 per side)`, cat: 'hold', howTo: `In a side plank with the top leg resting on a raised surface, lift the bottom leg up toward it by squeezing the adductor. One of the most effective exercises for the groin in the lateral loading position of a tackle.` },
      { text: `Lateral band walks (2-3 sets of 12-15 steps per side)`, cat: 'strength', howTo: `With a band above the ankles, walk sideways keeping hips and knees slightly bent. Strengthens the muscles that stabilise the hip during the repeated lateral movements typical of defending.` },
      { text: `Simulated lateral tackle with a teammate's resistance (3 sets of 6 per side)`, cat: 'balance', howTo: `Stand shoulder to shoulder with a teammate and push sideways in a controlled way while holding your position, then switch sides. Reproduces the real load of a lateral tackle progressively and safely.` },
    ]},
    centrocampista: { why: 'Changing direction dozens of times per match requires the hip and adductors to handle repeated load, not just a single effort.', exercises: [
      { text: `Repeated change of direction technique, short controlled steps (6-8 reps)`, cat: 'run', howTo: `Change direction repeatedly over a short course, using short controlled steps instead of one wide cut. A shorter step reduces the load on any single change of direction when the sequence repeats many times.` },
      { text: `Hip flexor strengthening with a band (2-3 sets of 12-15)`, cat: 'strength', howTo: `With a band around the ankle, bring the knee toward the chest against resistance, controlling the return too. Hip flexors work continuously through a midfielder's repeated changes of direction.` },
      { text: `Dynamic hip mobility before effort (2 minutes)`, cat: 'stretch', howTo: `Perform controlled leg swings forward, backward and sideways, gradually increasing the range. A hip that's well mobilised before effort tolerates a match's many changes of direction better.` },
      { text: `Figure-eight course around markers, sustained pace (4-5 laps)`, cat: 'run', howTo: `Place two markers a few metres apart and run a figure eight around them at a sustained pace, minding the hip through the constant changes of direction. Closely reproduces the varied, repeated effort the role demands.` },
    ]},
    attaccante: { why: 'A powerful shot largely comes from rapid hip opening and closing, not just the leg.', exercises: [
      { text: `Hip-opening technique for the shooting motion, no ball (3 sets of 8 per side)`, cat: 'stretch', howTo: `Simulate the shooting motion with no ball, focusing on the rapid opening and closing of the kicking hip. Training the motion empty-legged lets you work on range and speed without the extra load of ball contact.` },
      { text: `Isometric adductor strengthening (3-4 sets of 8-10 second holds)`, cat: 'hold', howTo: `Squeeze a ball between your knees and press firmly, holding the contraction for a few seconds. Strong adductors stabilise the standing hip while the other leg strikes with power.` },
      { text: `Lateral band walks (2-3 sets of 12-15 steps per side)`, cat: 'strength', howTo: `With a band above the ankles, walk sideways with hips and knees slightly bent. Strengthens hip stability in the lateral movements used to lose a marker or shield the ball.` },
      { text: `Power shot after an approach run (8-10 shots)`, cat: 'strength', howTo: `Approach the ball with a short run-up and strike with full controlled power, minding the hip opening through the whole motion. Brings the isometric and mobility work from the other drills into the real action at full speed.` },
    ]},
  },
  lower_back: {
    portiere: { why: 'A dive often combines trunk rotation and extension at the same instant — the core has to handle both together.', exercises: [
      { text: `Controlled rotation technique for diving, core engaged (3 sets of 6 per side)`, cat: 'balance', howTo: `Simulate the trunk rotation of a dive keeping the core engaged for the whole movement. An active core protects the lower back when rotation and extension happen at the same instant.` },
      { text: `Rotational plank (3 sets of 8-10 per side)`, cat: 'hold', howTo: `From a forearm plank, rotate the hips toward one side, lowering them close to the floor without losing overall alignment, then return to centre and repeat the other side. Trains rotational control while keeping overall stability.` },
      { text: `Bird-dog (2-3 sets of 8-10 per side)`, cat: 'balance', howTo: `On hands and knees, extend one arm and the opposite leg at the same time, keeping the back flat and stable. Strengthens lower-back control in movements that combine arms and legs, as in a dive.` },
      { text: `Controlled trunk extension lying face down (2-3 sets of 10)`, cat: 'strength', howTo: `Lying face down, lift the chest slightly by contracting the lower-back muscles, without forcing into hyperextension. Strengthens the lower back's ability to handle the trunk extension typical of the final phase of a dive.` },
    ]},
    difensore: { why: 'Jumping for a header requires the core to stay stable while the rest of the body extends upward.', exercises: [
      { text: `Core bracing technique for aerial duel jumps (5-6 reps)`, cat: 'balance', howTo: `Jump vertically keeping the core braced throughout, from push-off to landing. A stable core during the jump protects the lower back as the body extends upward for a header.` },
      { text: `Plank (3 sets of 30 seconds)`, cat: 'hold', howTo: `Hold a forearm plank with a straight back and level hips, neither sagging nor piking up. Builds the base core endurance needed to protect the lower back throughout a match.` },
      { text: `Two-leg glute bridge (3 sets of 12-15)`, cat: 'strength', howTo: `Lying on your back with feet on the floor, lift the hips by squeezing the glutes until hips, trunk and knees line up. Strong glutes take on work that would otherwise fall on the lower back during a jump.` },
      { text: `Vertical jump with light mid-air contact (4-5 reps)`, cat: 'balance', howTo: `Jump vertically while a teammate applies very light contact mid-air, keeping the core engaged to stay stable. Brings the drill closer to the reality of an aerial duel, where unexpected contact is the norm.` },
    ]},
    centrocampista: { why: 'Maintaining an efficient posture for ninety minutes, even fatigued, is what protects the lower back long-term.', exercises: [
      { text: `Posture-under-fatigue technique, self-check mid-effort (during the session)`, cat: 'balance', howTo: `Midway through a running session, pause a moment and consciously check your posture, straightening hips and back if needed. Keeping good posture as fatigue rises is what really protects the lower back.` },
      { text: `High-volume plank (3 sets of 30-40 seconds)`, cat: 'hold', howTo: `Hold the plank slightly longer than usual, with clean technique throughout. Builds the core endurance needed to hold posture for ninety minutes, not just a few seconds.` },
      { text: `Bird-dog with pre-existing light fatigue (2-3 sets of 8-10 per side)`, cat: 'balance', howTo: `After a short set of running or jumps, do the bird-dog right away, checking the back stays stable despite fatigue. Lower-back control while already tired matters more than when fresh.` },
      { text: `Prolonged running with postural control (10-12 minutes)`, cat: 'run', howTo: `Run at an easy to moderate pace for a prolonged duration, periodically checking the trunk doesn't lean too far forward as fatigue builds. Directly trains postural endurance in the context where it matters most.` },
    ]},
    attaccante: { why: 'Trunk rotation in a powerful shot puts significant force through the lower back in one explosive motion.', exercises: [
      { text: `Trunk rotation technique for shooting, controlled and unloaded (3 sets of 8 per side)`, cat: 'balance', howTo: `Simulate the trunk rotation of a powerful shot with no ball, controlling both the loading and release phases. Working the motion unloaded builds range and control before returning it to full power.` },
      { text: `Rotational plank (3 sets of 8-10 per side)`, cat: 'hold', howTo: `From a forearm plank, rotate the hips to one side without losing overall alignment, then return to centre and repeat the other side. Trains the same controlled rotation pattern a shot requires, at lower intensity.` },
      { text: `Rotational core strengthening with light resistance (2-3 sets of 10 per side)`, cat: 'strength', howTo: `With a band or light weight held in front of the chest, rotate the trunk from side to side keeping the hips and legs stable. Specifically strengthens the muscles that generate and control the rotation of a powerful shot.` },
      { text: `Power shot with emphasis on trunk control (8-10 shots)`, cat: 'strength', howTo: `Strike with full controlled power, taking care not to let the trunk over-rotate beyond what's needed. Brings the control built in the previous drills into the real action at full speed.` },
    ]},
  },
  shoulder_arm: {
    portiere: { why: 'A goalkeeper\'s shoulder works overhead on clearances and absorbs direct impact on lateral dives — throwing power and landing stability need training together.', exercises: [
      { text: `Progressive clearance technique, controlled power (8-10 reps)`, cat: 'strength', howTo: `Throw clearances with your hands, gradually increasing power from one to the next, without forcing maximum effort right away. Building power progressively protects the shoulder in the role's most repeated overhead action.` },
      { text: `Controlled landing on the side after a simulated dive (3 sets of 5 per side)`, cat: 'balance', howTo: `Simulate a low-intensity lateral dive and land controlling the impact through the side of the body, not dumping all your weight onto the shoulder at once. Landing technique is what really protects the shoulder from repeated dive impacts.` },
      { text: `Rotator cuff strengthening with a band (2-3 sets of 12-15)`, cat: 'strength', howTo: `With a band, rotate the forearm outward keeping the elbow bent and close to the side. The rotator cuff stabilises the shoulder both when throwing and when absorbing the impact of a fall.` },
      { text: `Throw and catch at increasing distance (10-12 reps)`, cat: 'strength', howTo: `Throw the ball to a teammate, gradually increasing the distance between throws while minding overhead technique. Progressively rebuilds the shoulder's tolerance for a full-power throw.` },
    ]},
    difensore: { why: 'In aerial duels and blocking, the shoulder absorbs direct contact — stability matters as much as raw strength.', exercises: [
      { text: `Shoulder blocking/shielding technique, controlled (3 sets of 8 per side)`, cat: 'balance', howTo: `Simulate blocking or shielding an opponent with the shoulder at controlled intensity, keeping a stable position. Trains the shoulder to handle direct contact technically rather than passively.` },
      { text: `Scapular strengthening under light load (2-3 sets of 12)`, cat: 'strength', howTo: `With a band or light weight, do scapular retractions by pulling the elbows back and squeezing the shoulder blades together. A well-controlled shoulder blade is the base that lets the shoulder absorb direct contact safely.` },
      { text: `Shoulder stability under light external contact (3 sets of 8)`, cat: 'balance', howTo: `With your arm extended against a wall or a teammate's hand, hold position while receiving light, varying pressure. Trains the shoulder to stay stable when contact arrives unpredictably, as in a real duel.` },
      { text: `Simulated physical duel with a bracing arm (3 sets of 6 per side)`, cat: 'balance', howTo: `Stand alongside a teammate and use your arm to hold distance while you both push lightly, as in a real physical duel. Brings the stability work from the earlier drills into a more game-like context.` },
    ]},
    centrocampista: { why: 'Less central than for other roles, but prolonged physical duels over ninety minutes still stress the shoulder over time.', exercises: [
      { text: `General rotator cuff strengthening (2-3 sets of 15)`, cat: 'strength', howTo: `With a light band, rotate the forearm outward and inward keeping the elbow fixed at your side. General rotator cuff work protects the shoulder from the small repeated knocks of prolonged physical contact.` },
      { text: `Shoulder endurance under light repeated load (2-3 sets of 15-20)`, cat: 'strength', howTo: `Do small circular or raising movements of the arm with a light weight, aiming for many reps rather than heavy load. Builds the endurance needed to handle repeated physical contact throughout a match.` },
      { text: `Controlled fall and forearm landing (3 sets of 5 per side)`, cat: 'balance', howTo: `Simulate a low-intensity lateral fall on a mat, learning to cushion the impact with the forearm instead of a rigid hand. Even if less central for this role, landing well reduces risk during occasional contact.` },
      { text: `Shoulder mobility in all directions, end of session (2 minutes)`, cat: 'stretch', howTo: `Actively move the arm through elevation and internal/external rotation, in both directions. A mobile shoulder recovers better after the prolonged physical contact of a match.` },
    ]},
    attaccante: { why: 'Shielding the ball with the arm against a defender is a repeated action that requires shoulder stability under pressure.', exercises: [
      { text: `Ball-shielding technique, stable arm (3 sets of 8 per side)`, cat: 'balance', howTo: `Shield a stationary ball with your body while a teammate tries to reach it, keeping the arm extended but not rigid to hold distance. A stable but not maximally tensed arm reduces risk during repeated ball-shielding.` },
      { text: `Isometric shoulder strengthening under external pressure (3 sets of 15-20 seconds)`, cat: 'hold', howTo: `With your arm extended to the side, have a teammate apply steady pressure while you resist without moving the shoulder. Good isometric control is what lets you shield the ball for a long time without yielding to contact.` },
      { text: `Holding position under light lateral contact (3 sets of 8 per side)`, cat: 'balance', howTo: `Stand alongside a teammate and hold your position between them and the ball using trunk and shoulder, without pushing with your arms. Trains the shoulder for the continuous lateral contact typical of holding the ball up with your back to goal.` },
      { text: `Shoulder mobility in all directions, end of session (2 minutes)`, cat: 'stretch', howTo: `Actively move the arm through elevation and rotation, in both directions, at the end of training. A mobile shoulder recovers better from the repeated contact of holding the ball up.` },
    ]},
  },
  hand_wrist: {
    portiere: { why: 'Catching and controlling the ball depend on finger and wrist strength — it\'s the technical foundation of every save, not just a detail.', exercises: [
      { text: `Progressive catching technique on balls at increasing speed (10-12 reps)`, cat: 'strength', howTo: `Have balls thrown to you at increasing speed, making sure the catch is secure at each level before moving to the next. Gradual progression builds grip confidence and strength without forcing maximum effort right away.` },
      { text: `Finger strengthening with a soft ball (3 sets of 15)`, cat: 'strength', howTo: `Squeeze and release a soft ball with your fingers in a rhythmic, controlled way. Strong fingers are the foundation of every secure catch, especially on powerful or wet shots.` },
      { text: `Controlled hand landing after a simulated dive (3 sets of 6)`, cat: 'balance', howTo: `Simulate a low-intensity dive and place your hand on the ground in a controlled way, wrist slightly flexed to absorb impact. This landing technique reduces sudden wrist stress across repeated falls.` },
      { text: `Quick catch and release off a rebound (10-12 reps)`, cat: 'strength', howTo: `Bounce the ball off a wall at close range and catch it on the fly, releasing it right away for the next attempt. Trains the quick catching needed for close-range saves and rebounds in the box.` },
    ]},
    difensore: { why: 'Falls during tackles often put the wrist under sudden stress — baseline strength reduces the risk of a sprain.', exercises: [
      { text: `General grip strengthening with a soft ball (2-3 sets of 15)`, cat: 'strength', howTo: `Squeeze and release a soft ball with your fingers rhythmically. A stronger baseline grip reduces risk when the hand hits the ground in a sudden fall during a tackle.` },
      { text: `Wrist mobility in every direction, end of session`, cat: 'stretch', howTo: `Actively move the wrist through flexion, extension and rotation in both directions, at the end of training. A mobile wrist absorbs the impact of a sudden fall better.` },
      { text: `Controlled hand landing during a simulated fall (3 sets of 5 per side)`, cat: 'balance', howTo: `Simulate a low-intensity lateral fall on a mat, learning to land on the hand with the wrist slightly flexed rather than rigid. This falling technique greatly reduces sudden wrist stress compared to an instinctive, rigid landing.` },
      { text: `Push-ups on knuckles or a soft surface (2-3 sets of 8-10)`, cat: 'strength', howTo: `Do push-ups resting on your knuckles instead of your palms, or on a soft surface like a mat. Strengthens the wrist and forearm in the loading position that occurs when landing on the ground.` },
    ]},
    centrocampista: { why: 'As with other outfield roles, occasional falls during play benefit from a stronger, more mobile wrist.', exercises: [
      { text: `General grip strengthening with a soft ball (2-3 sets of 15)`, cat: 'strength', howTo: `Squeeze and release a soft ball with your fingers rhythmically and under control. A stronger baseline grip reduces risk when the hand hits the ground in an occasional fall during play.` },
      { text: `Wrist mobility in every direction, end of session`, cat: 'stretch', howTo: `Actively move the wrist through flexion, extension and rotation in both directions, at the end of training. A mobile, ready wrist absorbs an unexpected ground landing better.` },
      { text: `Controlled hand landing during a simulated fall (3 sets of 5 per side)`, cat: 'balance', howTo: `Simulate a low-intensity lateral fall, learning to land on the hand with the wrist slightly flexed rather than rigid. Especially useful in midfield challenges, where unpredictable falls are frequent.` },
      { text: `Finger mobility and alternating grip (2-3 sets of 12)`, cat: 'stretch', howTo: `Open and close the fingers through their full range, alternating with a brief squeeze on a soft ball. Keeps hand and wrist ready without requiring much extra dedicated work for this role.` },
    ]},
    attaccante: { why: 'Constant physical contact and occasional falls benefit from a stronger, more mobile wrist, even though it isn\'t the main factor for this role.', exercises: [
      { text: `General grip strengthening with a soft ball (2-3 sets of 15)`, cat: 'strength', howTo: `Squeeze and release a soft ball with your fingers rhythmically. Even though not central to this role, a solid baseline grip helps during occasional falls in physical challenges.` },
      { text: `Wrist mobility in every direction, end of session`, cat: 'stretch', howTo: `Actively move the wrist through flexion, extension and rotation, at the end of training. A mobile wrist reduces risk during the occasional falls that come with continuous physical contact.` },
      { text: `Controlled hand landing during a simulated fall (3 sets of 5 per side)`, cat: 'balance', howTo: `Simulate a low-intensity fall, learning to land on the hand with the wrist slightly flexed rather than rigid. Reduces risk in the falls that happen during physical challenges in the box or midfield.` },
      { text: `Finger mobility and alternating grip (2-3 sets of 12)`, cat: 'stretch', howTo: `Open and close the fingers through their full range, alternating with a brief squeeze on a soft ball. A small maintenance drill, useful even though the wrist isn't the main priority for this role.` },
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

// Profilo tipico di presentazione per ciascun infortunio, usato per ordinare i risultati del triage per probabilità.
// weight usa le stesse chiavi delle risposte: 'normale' (impatto minimo), 'dolore' (doloroso ma possibile), 'fatica' (molto difficile).
const triageProfiles = {
  ankle: { pop: true, swelling: true, weight: 'fatica' },
  achilles: { pop: false, swelling: false, weight: 'dolore' },
  achilles_rupture: { pop: true, swelling: true, weight: 'fatica' },
  knee: { pop: false, swelling: false, weight: 'dolore' },
  mcl: { pop: true, swelling: true, weight: 'dolore' },
  patellar: { pop: false, swelling: false, weight: 'dolore' },
  meniscus: { pop: true, swelling: true, weight: 'dolore' },
  itband: { pop: false, swelling: false, weight: 'dolore' },
  osgood: { pop: false, swelling: true, weight: 'dolore' },
  hamstring: { pop: true, swelling: true, weight: 'dolore' },
  quad: { pop: true, swelling: true, weight: 'dolore' },
  contusion: { pop: false, swelling: true, weight: 'dolore' },
  calf: { pop: true, swelling: true, weight: 'dolore' },
  shinsplints: { pop: false, swelling: false, weight: 'dolore' },
  plantarfasciitis: { pop: false, swelling: false, weight: 'dolore' },
  groin: { pop: false, swelling: false, weight: 'dolore' },
  hipflexor: { pop: false, swelling: false, weight: 'dolore' },
  piriformis: { pop: false, swelling: false, weight: 'dolore' },
  trochanteric: { pop: false, swelling: false, weight: 'dolore' },
  lcl: { pop: true, swelling: true, weight: 'dolore' },
  cramps: { pop: false, swelling: false, weight: 'normale' },
  blisters: { pop: false, swelling: false, weight: 'dolore' },
  lowback: { pop: false, swelling: false, weight: 'dolore' },
  shoulder_impingement: { pop: false, swelling: false, weight: 'normale' },
  ac_joint: { pop: false, swelling: true, weight: 'dolore' },
  bicep_tendinopathy: { pop: false, swelling: false, weight: 'normale' },
  wrist_sprain: { pop: false, swelling: true, weight: 'dolore' },
  finger_jam: { pop: false, swelling: true, weight: 'dolore' },
  thumb_sprain: { pop: false, swelling: true, weight: 'dolore' },
};

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
const swellingOptionsIT = [{ key: 'si', label: 'Sì' }, { key: 'no', label: 'No' }, { key: 'nonso', label: 'Non so / non ancora visibile' }];
const weightOptionsEN = [
  { key: 'normale', label: 'Yes, normally' },
  { key: 'dolore', label: 'Yes, but with pain' },
  { key: 'fatica', label: 'With difficulty, or not at all' },
];
const swellingOptionsEN = [{ key: 'si', label: 'Yes' }, { key: 'no', label: 'No' }, { key: 'nonso', label: 'Not sure / not visible yet' }];

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
          <button key={item.key} onClick={() => onNavigate(item.key)} className="os-focus flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-2.5" style={{ color: isActive ? colors.accentDark : colors.mutedInk }} aria-current={isActive ? 'page' : undefined}>
            <span style={{ backgroundColor: isActive ? colors.accentTint : 'transparent' }} className="flex items-center justify-center w-14 h-7 rounded-full transition-colors">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            </span>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: isActive ? 700 : 500 }} className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Banner di consenso cookie/analytics, mostrato finché l'utente non fa una scelta.
// Google Analytics parte in modalità "denied" di default (vedi index.html): qui l'utente
// può accettare o rifiutare la misurazione. La scelta resta solo su questo dispositivo.
function CookieBanner({ isEN, onChoice }) {
  return (
    <div
      role="dialog"
      aria-label={isEN ? 'Cookie preferences' : 'Preferenze cookie'}
      style={{ backgroundColor: colors.ink, paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
      className="fixed bottom-0 left-0 right-0 z-40 px-5 pt-4 sm:px-8 shadow-[0_-4px_16px_rgba(16,27,38,0.25)]"
    >
      <div className="max-w-md mx-auto">
        <p style={{ color: '#EEF3F8', fontFamily: "'Public Sans', sans-serif" }} className="text-xs leading-relaxed mb-3">
          {isEN
            ? 'We use Google Analytics to understand how the app is used. Your recovery diary and personal notes are never included. '
            : 'Usiamo Google Analytics per capire come viene usata l\'app. Il tuo diario di recupero e le tue note personali non vengono mai inclusi. '}
          <a href="/privacy.html" style={{ color: colors.accent }} className="underline font-medium">
            {isEN ? 'Privacy Policy' : 'Leggi la Privacy Policy'}
          </a>
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={() => onChoice(false)}
            style={{ backgroundColor: 'transparent', color: '#EEF3F8', border: '1px solid rgba(255,255,255,0.3)' }}
            className="os-focus flex-1 rounded-lg py-2.5 text-xs font-semibold hover:opacity-80 transition-opacity"
          >
            {isEN ? 'Decline' : 'Rifiuta'}
          </button>
          <button
            onClick={() => onChoice(true)}
            style={{ backgroundColor: colors.accent, color: '#FFFFFF' }}
            className="os-focus flex-1 rounded-lg py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {isEN ? 'Accept' : 'Accetta'}
          </button>
        </div>
      </div>
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

// Frammento del cerchio di centrocampo, a bassa opacità, che sanguina fuori da un angolo
// della card: un dettaglio da "campo da gioco" al posto del solito glow/gradiente generico.
function PitchArc({ size = 176 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 176 176" fill="none" className="absolute -top-10 -right-10 pointer-events-none" aria-hidden="true">
      <circle cx="88" cy="88" r="64" stroke="#FFFFFF" strokeOpacity="0.07" strokeWidth="1.5" />
      <circle cx="88" cy="88" r="2.5" fill="#FFFFFF" fillOpacity="0.14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------------------
// "Matchday": il recupero raccontato come una partita, per dare a chi apre l'app un motivo
// visibile per tornare domani (il minuto che avanza, la sessione di oggi, il gol quando la fai).
// ---------------------------------------------------------------------------------------

// Sfondo "campo di notte": righe del taglio dell'erba + luce dei riflettori da un angolo.
const PITCH_BG = `radial-gradient(130% 90% at 0% 0%, rgba(125,255,168,0.14), rgba(125,255,168,0) 55%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 36px, rgba(255,255,255,0) 36px 72px), ${colors.heroBg}`;
const LED_GREEN = '#7DFFA8';

// Il tabellone del cambio del quarto uomo: quanti giorni mancano al rientro stimato.
// Superata la stima mostra 90' in giallo, senza mai dire "rientra ora": quella decisione
// va presa con un professionista (lo dice il testo sotto il cronometro).
function SubBoard({ daysLeft, isEN }) {
  const past = daysLeft <= 0;
  return (
    <div style={{ backgroundColor: '#050B08', border: '1px solid rgba(255,255,255,0.14)', boxShadow: 'inset 0 0 14px rgba(0,0,0,0.65)' }} className="flex-shrink-0 rounded-lg px-3 pt-1.5 pb-2 text-center min-w-[84px]">
      <p style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em', fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-[9px] font-bold uppercase mb-1">{isEN ? 'Est. return' : 'Rientro stimato'}</p>
      {past ? (
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", color: colors.premiumGold, textShadow: `0 0 10px ${colors.premiumGold}99` }} className="text-[34px] leading-none">90'</p>
      ) : (
        <p className="leading-none flex items-baseline justify-center gap-1">
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: LED_GREEN, textShadow: '0 0 10px rgba(125,255,168,0.75)' }} className="text-[34px] os-tabular">{daysLeft}</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: LED_GREEN, opacity: 0.8 }} className="text-base">{isEN ? (daysLeft === 1 ? 'DAY' : 'DAYS') : 'GG'}</span>
        </p>
      )}
    </div>
  );
}

// Il cronometro della partita di recupero: il minuto (0'–90') mappa i giorni sulla stima
// totale, con il 45' a metà. Sotto, la timeline dei due tempi con le fasi; a destra il
// tabellone del cambio. È la stessa idea del vecchio "numero da tabellone", ma con le
// etichette che servono a capirlo al primo sguardo.
function MatchClock({ minute, overtime, segments, daysLeft, isEN }) {
  const pct = Math.min(100, Math.max(0, (minute / 90) * 100));
  const fillColor = overtime ? colors.premiumGold : colors.accent;
  const label = { fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '0.1em' };
  return (
    <div className="relative">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#FFFFFF' }} className="text-[88px] leading-[0.8] os-tabular">{minute}{overtime ? '+' : ''}</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: fillColor }} className="text-4xl leading-none">'</span>
          </div>
          <p style={{ ...label, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.14em' }} className="text-[10px] font-bold uppercase mt-2">{isEN ? 'Minute of your recovery' : 'Minuto del tuo recupero'}</p>
        </div>
        <SubBoard daysLeft={daysLeft} isEN={isEN} />
      </div>
      <div className="mt-5">
        <div className="relative">
          <div className="flex gap-1">
            {segments.map((seg, i) => (
              <div key={i} className="relative h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.14)', flexGrow: seg.span, flexBasis: 0 }}>
                <div className="os-fill absolute inset-y-0 left-0" style={{ width: `${seg.fill}%`, backgroundColor: fillColor }} />
              </div>
            ))}
          </div>
          <div className="absolute w-px" style={{ left: '50%', top: -5, bottom: -5, backgroundColor: 'rgba(255,255,255,0.6)' }} aria-hidden="true" />
          <div className={`absolute w-3.5 h-3.5 rounded-full ${overtime ? '' : 'os-playhead'}`} style={{ left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#FFFFFF', boxShadow: `0 0 0 3px ${fillColor}66, 0 0 14px ${fillColor}` }} aria-hidden="true" />
        </div>
        <div style={{ ...label, color: 'rgba(255,255,255,0.5)' }} className="grid grid-cols-5 mt-2 text-[10px] font-semibold uppercase">
          <span className="text-left">0'</span>
          <span className="text-center">{isEN ? '1st half' : '1° tempo'}</span>
          <span className="text-center">45'</span>
          <span className="text-center">{isEN ? '2nd half' : '2° tempo'}</span>
          <span className="text-right">90'</span>
        </div>
      </div>
      {daysLeft <= 0 && (
        <p style={{ color: '#FFE3A3' }} className="text-[11px] leading-snug mt-3">
          {isEN ? 'You have reached the indicative estimate: decide your return with a professional.' : 'Hai raggiunto la stima indicativa: decidi il rientro insieme a un professionista.'}
        </p>
      )}
    </div>
  );
}

// Il "GOL" dopo aver segnato la sessione di oggi: il pallone entra in rete, la scritta esplode,
// sotto la serie di presenze. Si chiude da solo o con un tocco. Con "riduci movimento" attivo
// le animazioni sono spente (regola globale) e resta la schermata ferma, già leggibile.
function GoalCelebration({ streak, isEN, onClose }) {
  return (
    <div onClick={onClose} role="status" aria-live="polite" className="fixed inset-0 z-[60] flex items-center justify-center os-gol-backdrop cursor-pointer" style={{ background: `radial-gradient(70% 55% at 50% 45%, rgba(47,167,102,0.28), rgba(47,167,102,0) 70%), rgba(5,16,11,0.94)`, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div className="text-center px-6">
        <svg width="220" height="124" viewBox="0 0 220 124" className="mx-auto mb-1" aria-hidden="true">
          <g className="os-net" stroke="rgba(255,255,255,0.4)" strokeWidth="1.1" fill="none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <line key={`v${i}`} x1={40 + i * 14} y1="22" x2={40 + i * 14} y2="112" />)}
            {[1, 2, 3, 4, 5].map((i) => <line key={`h${i}`} x1="40" y1={22 + i * 15} x2="180" y2={22 + i * 15} />)}
            <path d="M40 112 L40 22 L180 22 L180 112" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g className="os-ball" style={{ transform: 'translate(112px, 66px)' }}>
            <circle cx="0" cy="0" r="12" fill="#FFFFFF" />
            <path d="M0 -5.5 L5.2 -1.7 L3.2 4.4 L-3.2 4.4 L-5.2 -1.7 Z" fill={colors.ink} />
            <circle cx="0" cy="0" r="12" fill="none" stroke={colors.ink} strokeOpacity="0.25" strokeWidth="1" />
          </g>
        </svg>
        <p className="os-gol-text" style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#FFFFFF', letterSpacing: '0.04em', textShadow: `0 0 28px ${colors.accent}` }}>
          <span className="text-[104px] leading-none">{isEN ? 'GOAL!' : 'GOL!'}</span>
        </p>
        <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#FFFFFF' }} className="text-base font-semibold mt-1">{isEN ? "Today's session is in the net" : 'Sessione di oggi in rete'}</p>
        {streak > 1 && (
          <p style={{ color: '#FFD9A0', fontFamily: "'Bricolage Grotesque', sans-serif" }} className="flex items-center justify-center gap-1.5 mt-2 text-sm font-bold">
            <Flame size={16} strokeWidth={2.5} />{isEN ? `${streak}-session streak` : `${streak} presenze di fila`}
          </p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-[11px] mt-5">{isEN ? 'Tap to continue' : 'Tocca per continuare'}</p>
      </div>
    </div>
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

// ---------------------------------------------------------------------------------------
// Lavagna tattica: il manichino diventa la lavagna dello spogliatoio. Sagoma del giocatore in
// gesso (maglia, pantaloncini, calzettoni), zone che si accendono come LED ed etichette tirate
// con una riga, come nelle grafiche sugli infortuni delle dirette. La logica non cambia: tocchi
// una zona (o il suo nome) e si apre la lista, il triage o la prevenzione di quella zona.
// ---------------------------------------------------------------------------------------

const LED_TEAL = '#72E6F2';
const BEBAS = "'Bebas Neue', sans-serif";
const BRICOLAGE = "'Bricolage Grotesque', sans-serif";
// Variante "prevenzione" del campo di notte: stessa luce da riflettore, ma sul verde acqua.
const PITCH_BG_TEAL = `radial-gradient(130% 90% at 0% 0%, rgba(114,230,242,0.16), rgba(114,230,242,0) 55%), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 36px, rgba(255,255,255,0) 36px 72px), #06282D`;
// Premium: notte blu con la luce oro di un riflettore dall'alto.
const PREMIUM_BG = `radial-gradient(90% 70% at 100% 0%, rgba(240,180,41,0.26), rgba(240,180,41,0) 60%), radial-gradient(80% 60% at 0% 100%, rgba(47,167,102,0.12), rgba(47,167,102,0) 60%), #0B121A`;
const GOLD_GRADIENT = 'linear-gradient(135deg, #F9DD85 0%, #F0B429 45%, #C98A0B 100%)';

// Colori della lavagna per tono: LED = zone e scritte accese, kit = maglia/pantaloncini.
const BOARD_TONES = {
  green: { led: LED_GREEN, bg: PITCH_BG, skin: '#123A2C', kit: '#1A4D3B', shorts: '#23604A', boot: '#06140F' },
  teal: { led: LED_TEAL, bg: PITCH_BG_TEAL, skin: '#0B363B', kit: '#114A54', shorts: '#185C68', boot: '#03171A' },
};

// Tracciati della sagoma, nelle stesse coordinate di bodyZones (0–200 x 0–312).
const CHALK_PATHS = {
  torso: 'M70 58 C78 52 88 50 100 50 C112 50 122 52 130 58 L134 70 C132 88 131 100 130 110 C122 118 110 121 100 121 C90 121 78 118 70 110 C69 100 68 88 66 70 Z',
  shorts: 'M70 110 C78 118 90 121 100 121 C110 121 122 118 130 110 L132 150 L103 153 L100 146 L97 153 L68 150 Z',
  neck: 'M93 37 L107 37 L108 51 L92 51 Z',
  armL: 'M67 60 C59 60 53 67 53 78 L53 104 C53 116 54 126 55 134 C56 138 64 138 65 134 C66 124 67 112 68 102 L69 82 C70 72 71 63 67 60 Z',
  armR: 'M133 60 C141 60 147 67 147 78 L147 104 C147 116 146 126 145 134 C144 138 136 138 135 134 C134 124 133 112 132 102 L131 82 C130 72 129 63 133 60 Z',
  sleeveL: 'M67 59 C59 59 52 66 52 77 L52 90 L68 91 L69 80 C70 71 71 62 67 59 Z',
  sleeveR: 'M133 59 C141 59 148 66 148 77 L148 90 L132 91 L131 80 C130 71 129 62 133 59 Z',
  legL: 'M71 150 L97 153 C97 170 96 190 95 206 C94 214 94 222 94 230 C94 250 92 268 91 286 L81 286 C80 268 78 250 78 230 C78 220 77 212 76 204 C74 186 71 168 71 150 Z',
  legR: 'M129 150 L103 153 C103 170 104 190 105 206 C106 214 106 222 106 230 C106 250 108 268 109 286 L119 286 C120 268 122 250 122 230 C122 220 123 212 124 204 C126 186 129 168 129 150 Z',
  sockL: 'M78.4 257 L93.6 257 C93 266 92 276 91 286 L81 286 C80 276 79 266 78.4 257 Z',
  sockR: 'M121.6 257 L106.4 257 C107 266 108 276 109 286 L119 286 C120 276 121 266 121.6 257 Z',
  bootL: 'M79 285 L93 285 C94 291 96 295 96 298 C96 301 94 302 91 302 L81 302 C78 302 76 301 76 298 C76 295 78 291 79 285 Z',
  bootR: 'M121 285 L107 285 C106 291 104 295 104 298 C104 301 106 302 109 302 L119 302 C122 302 124 301 124 298 C124 295 122 291 121 285 Z',
};

// Il giocatore disegnato col gesso. Riempimenti pieni (non trasparenti) così le linee delle
// parti dietro non si vedono attraverso: resta una sagoma pulita, con il contorno bianco.
function ChalkPlayer({ tone = 'green', strokeOpacity = 0.5, strokeWidth = 1.2 }) {
  const t = BOARD_TONES[tone] || BOARD_TONES.green;
  const P = CHALK_PATHS;
  return (
    <g stroke={`rgba(255,255,255,${strokeOpacity})`} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
      <path d={P.legL} fill={t.skin} />
      <path d={P.legR} fill={t.skin} />
      <path d={P.sockL} fill={t.kit} />
      <path d={P.sockR} fill={t.kit} />
      <path d={P.bootL} fill={t.boot} />
      <path d={P.bootR} fill={t.boot} />
      <path d={P.armL} fill={t.skin} />
      <path d={P.armR} fill={t.skin} />
      <ellipse cx="60" cy="142" rx="7" ry="8.5" fill={t.skin} />
      <ellipse cx="140" cy="142" rx="7" ry="8.5" fill={t.skin} />
      <path d={P.neck} fill={t.skin} />
      <path d={P.shorts} fill={t.shorts} />
      <path d={P.torso} fill={t.kit} />
      <path d={P.sleeveL} fill={t.kit} />
      <path d={P.sleeveR} fill={t.kit} />
      <ellipse cx="100" cy="24" rx="14" ry="16.5" fill={t.skin} />
      <path d="M93 51 L100 59 L107 51" fill="none" />
      <path d="M79.3 265 L92.8 265 M107.2 265 L120.7 265" fill="none" strokeOpacity="0.8" />
    </g>
  );
}

function ZoneShape({ zone, ...rest }) {
  const Tag = zone.shape;
  return <Tag {...zone.props} {...rest} />;
}

// Dove va l'etichetta di ogni zona: lato (L/R), altezza della scritta e punto della zona a cui
// arriva la riga. Scelti perché le righe non si incrocino tra loro e passino fuori dalla sagoma.
const BODY_CALLOUTS = [
  { region: 'shoulder_arm', side: 'L', y: 64, tx: 56, ty: 80 },
  { region: 'lower_back', side: 'L', y: 108, tx: 78, ty: 109 },
  { region: 'thigh', side: 'L', y: 182, tx: 82, ty: 177 },
  { region: 'calf_region', side: 'L', y: 250, tx: 84, ty: 252 },
  { region: 'hand_wrist', side: 'R', y: 128, tx: 144, ty: 140 },
  { region: 'hip_groin', side: 'R', y: 170, tx: 122, ty: 142 },
  { region: 'knee', side: 'R', y: 212, tx: 120, ty: 216 },
  { region: 'ankle_foot', side: 'R', y: 288, tx: 121, ty: 292 },
];

function BodyDiagram({ onSelectRegion, labels = regionLabelsIT, isEN = false, title, caption, tone = 'green' }) {
  const [pressed, setPressed] = useState(null);
  const [pinging, setPinging] = useState(null);
  const [focused, setFocused] = useState(null);
  const t = BOARD_TONES[tone] || BOARD_TONES.green;
  const led = t.led;

  const handleSelect = (region) => {
    if (pinging) return;
    setPinging(region);
    setTimeout(() => { onSelectRegion(region); setPinging(null); }, 280);
  };
  // Acceso = premuto, appena scelto o col focus da tastiera (fa da indicatore di focus visibile).
  const lit = (region) => pressed === region || pinging === region || focused === region;

  return (
    <div style={{ background: t.bg }} className="relative overflow-hidden rounded-3xl px-2 pt-4 pb-2 shadow-lg">
      {(title || caption) && (
        <div className="relative px-3 mb-1">
          {title && <p style={{ fontFamily: BEBAS, color: led, letterSpacing: '0.06em', textShadow: `0 0 12px ${led}55` }} className="text-[22px] leading-none">{title}</p>}
          {caption && <p style={{ fontFamily: BRICOLAGE, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em' }} className="text-[9px] font-bold uppercase leading-tight mt-1.5">{caption}</p>}
        </div>
      )}
      <svg viewBox="-76 -6 352 318" className="relative w-full block" role="group" aria-label={isEN ? 'Player outline: tap where it hurts' : 'Sagoma del giocatore: tocca dove senti il problema'}>
        {/* Righe del campo e segni tattici col gesso, appena accennati. */}
        <g stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" fill="none" aria-hidden="true">
          <line x1="-80" y1="152" x2="280" y2="152" />
          <circle cx="100" cy="152" r="68" />
        </g>
        <g stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" fill="none" strokeLinecap="round" aria-hidden="true">
          <circle cx="236" cy="22" r="6.5" />
          <path d="M198 60 L209 71 M209 60 L198 71" />
          <path d="M229 32 Q227 52 214 60" strokeDasharray="3 4" />
          <path d="M214 60 L220 60 M214 60 L216 54" />
          <path d="M-60 282 L-49 293 M-49 282 L-60 293" />
          <circle cx="-14" cy="297" r="6.5" />
          <path d="M-44 296 Q-34 306 -23 299" strokeDasharray="3 4" />
        </g>

        <ChalkPlayer tone={tone} />

        {/* Etichette con la riga: toccabili quanto la zona, e sono loro i bottoni per tastiera e lettori di schermo. */}
        {BODY_CALLOUTS.map((c) => {
          const on = lit(c.region);
          const left = c.side === 'L';
          const lineY = c.y + 5;
          const elbowX = left ? 36 : 164;
          const label = labels[c.region] || regionLabelsIT[c.region];
          return (
            <g
              key={c.region}
              role="button"
              tabIndex={0}
              aria-label={label}
              className="os-focus"
              style={{ cursor: 'pointer', outline: 'none' }}
              onClick={() => handleSelect(c.region)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(c.region); } }}
              onFocus={() => setFocused(c.region)}
              onBlur={() => setFocused(null)}
              onMouseDown={() => setPressed(c.region)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              onTouchStart={() => setPressed(c.region)}
              onTouchEnd={() => setPressed(null)}
            >
              <rect x={left ? -74 : 158} y={c.y - 16} width="118" height="26" fill="transparent" />
              <path d={`M${left ? -70 : 270} ${lineY} L${elbowX} ${lineY} L${c.tx} ${c.ty}`} fill="none" stroke={on ? led : 'rgba(255,255,255,0.34)'} strokeWidth={on ? 1.6 : 1} style={{ transition: 'stroke 0.15s ease' }} />
              <circle cx={c.tx} cy={c.ty} r={on ? 6 : 4.5} fill={led} opacity={on ? 0.35 : 0.18} />
              <circle cx={c.tx} cy={c.ty} r="2.3" fill={on ? led : '#FFFFFF'} />
              <text x={left ? -70 : 270} y={c.y} textAnchor={left ? 'start' : 'end'} fill={on ? led : 'rgba(255,255,255,0.9)'} style={{ fontFamily: BEBAS, fontSize: 15, letterSpacing: '0.05em', transition: 'fill 0.15s ease' }}>
                {label}
              </text>
            </g>
          );
        })}

        {/* Le zone: si accendono a onda dalla testa ai piedi, e piene quando le tocchi. */}
        {bodyZones.map((zone, i) => {
          const on = lit(zone.region);
          return (
            <ZoneShape
              key={i}
              zone={zone}
              fill={led}
              fillOpacity={on ? 0.85 : 0.24}
              stroke={led}
              strokeOpacity={on ? 1 : 0.85}
              strokeWidth={on ? 1.8 : 1.2}
              className={on ? '' : 'os-breathe'}
              style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s ease', animationDelay: `${((zone.center.cy / 300) * 2.6).toFixed(2)}s` }}
              onClick={() => handleSelect(zone.region)}
              onMouseDown={() => setPressed(zone.region)}
              onMouseUp={() => setPressed(null)}
              onMouseLeave={() => setPressed(null)}
              onTouchStart={() => setPressed(zone.region)}
              onTouchEnd={() => setPressed(null)}
              aria-hidden="true"
            />
          );
        })}

        {pinging && bodyZones.filter((z) => z.region === pinging).map((z, i) => (
          <circle key={i} className="os-radar-ring" cx={z.center.cx} cy={z.center.cy} r="22" fill="none" stroke={led} strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

// La "figurina" di una zona: il giocatore in piccolo con solo quella zona accesa. Serve a far
// capire al volo dove si trova, nelle card delle zone, nell'intestazione degli infortuni e
// nell'elenco della prevenzione.
function RegionFigure({ region, tone = 'green', height = 80 }) {
  const t = BOARD_TONES[tone] || BOARD_TONES.green;
  const zones = bodyZones.filter((z) => z.region === region);
  const width = Math.round((height * 108) / 306);
  return (
    <svg viewBox="46 2 108 306" width={width} height={height} aria-hidden="true" style={{ overflow: 'visible', display: 'block' }}>
      <ChalkPlayer tone={tone} strokeOpacity={0.4} strokeWidth={1.6} />
      {zones.map((z, i) => <circle key={`h${i}`} cx={z.center.cx} cy={z.center.cy} r="22" fill={t.led} opacity="0.16" />)}
      {zones.map((z, i) => <ZoneShape key={i} zone={z} fill={t.led} fillOpacity="0.92" stroke={t.led} strokeWidth="1.5" />)}
    </svg>
  );
}

// Icona per il tipo di meccanismo, le stesse del triage ("Com'è successo?").
const mechanismIcons = { acute: Zap, overuse: TrendingUp, contact: Shield };

// Tempi di rientro indicativi di un infortunio, dal grado lieve al severo (i totalEstimateDays
// già usati dal cronometro). Unità scelta per essere leggibile: giorni, settimane o mesi.
function recoveryRangeLabel(sd, isEN) {
  if (!sd || !sd.lieve || !sd.severo) return '';
  const min = sd.lieve.totalEstimateDays;
  const max = sd.severo.totalEstimateDays;
  const u = isEN ? { d: 'days', w: 'wks', m: 'mo' } : { d: 'gg', w: 'sett.', m: 'mesi' };
  const wk = (d) => Math.max(1, Math.round(d / 7));
  const mo = (d) => Math.max(1, Math.round(d / 30));
  if (max <= 21) return `${min}–${max} ${u.d}`;
  if (max < 180) return `${wk(min)}–${wk(max)} ${u.w}`;
  if (min < 60) return `${wk(min)} ${u.w}–${mo(max)} ${u.m}`;
  return `${mo(min)}–${mo(max)} ${u.m}`;
}

// Separa il nome dell'esercizio dalla parentesi finale: se è un dosaggio ("3 serie da 12-15",
// "tenuta 20-30 secondi, 3-4 volte") diventa il chip del tabellone; se è un'indicazione
// ("poi a occhi chiusi se comodo") resta sotto come nota. Il testo non cambia, solo come appare.
function splitDose(text) {
  const m = typeof text === 'string' ? text.match(/^(.*\S)\s*\(([^()]*)\)\s*$/) : null;
  if (!m) return { main: text, dose: null, note: null };
  const inner = m[2].trim();
  const isDosePart = (p) => /^\d/.test(p) || /^(tenuta|hold)\b/i.test(p);
  if (!isDosePart(inner)) return { main: m[1], dose: null, note: inner };
  const parts = inner.split(/,\s*/);
  let i = 1;
  while (i < parts.length && isDosePart(parts[i])) i += 1;
  return { main: m[1], dose: parts.slice(0, i).join(', '), note: parts.slice(i).join(', ') || null };
}

const DRILL_TONES = {
  green: { main: colors.accent, tint: colors.accentTint, dark: colors.accentDark, led: LED_GREEN, board: colors.heroBg },
  teal: { main: colors.prevention, tint: colors.preventionTint, dark: colors.preventionDark, led: LED_TEAL, board: '#06282D' },
  gold: { main: colors.premiumGold, tint: '#FCF1D6', dark: '#8A5A00', led: colors.premiumGold, board: '#0B121A' },
};

// La card di un esercizio, uguale in percorso, prevenzione, tecnica e Premium: numero grande
// a sinistra, nome in chiaro, dosaggio sul "tabellone" LED, spunta tonda a destra e il
// "Come si fa" sotto. Senza onToggle (tecnica) non c'è la spunta; con dark va su fondo scuro.
function DrillCard({ index, ex, catLabel, done = false, onToggle, helpOpen = false, onToggleHelp, isEN, tone = 'green', dark = false }) {
  const t = DRILL_TONES[tone] || DRILL_TONES.green;
  const { main, dose, note } = splitDose(ex.text);
  const CatIcon = catIcons[ex.cat] || Circle;
  const checkable = typeof onToggle === 'function';
  const num = String(index + 1).padStart(2, '0');
  const ink = dark ? '#EEF3F8' : colors.ink;
  const muted = dark ? '#A9B7C4' : colors.mutedInk;
  const cardBg = dark ? 'rgba(255,255,255,0.06)' : done ? t.tint : colors.card;
  const border = dark ? 'rgba(255,255,255,0.09)' : done ? `${t.main}66` : colors.hairline;
  const railBg = done ? t.main : dark ? 'rgba(240,180,41,0.14)' : t.tint;
  const railInk = done ? '#FFFFFF' : dark ? t.led : t.dark;
  return (
    <div style={{ backgroundColor: cardBg, border: `1px solid ${border}` }} className={`rounded-2xl overflow-hidden transition-colors ${dark ? '' : 'shadow-sm'}`}>
      <div className="flex items-stretch">
        <div style={{ backgroundColor: railBg }} className="flex-shrink-0 w-11 flex justify-center pt-3 transition-colors" aria-hidden="true">
          <span style={{ fontFamily: BEBAS, color: railInk }} className="text-[26px] leading-none os-tabular">{num}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 px-3 pt-3 pb-2">
            <div onClick={checkable ? onToggle : undefined} className={`flex-1 min-w-0 ${checkable ? 'cursor-pointer select-none' : ''}`}>
              <p style={{ color: dark ? t.led : t.dark, fontFamily: BRICOLAGE, letterSpacing: '0.1em' }} className="flex items-center gap-1 text-[10px] font-bold uppercase mb-1"><CatIcon size={11} />{catLabel}</p>
              <p style={{ color: ink, opacity: done ? 0.62 : 1 }} className="text-[14.5px] font-semibold leading-snug transition-opacity">{main}</p>
              {(dose || note) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
                  {dose && <span style={{ backgroundColor: dark ? 'rgba(0,0,0,0.4)' : t.board, color: t.led, fontFamily: BEBAS, letterSpacing: '0.05em' }} className="text-[14px] leading-none px-2 py-1 rounded-md">{dose}</span>}
                  {note && <span style={{ color: muted }} className="text-[11.5px] leading-snug">{note}</span>}
                </div>
              )}
            </div>
            {checkable && (
              <button
                type="button"
                onClick={onToggle}
                aria-pressed={done}
                aria-label={done ? (isEN ? `Mark as not done: ${main}` : `Segna come da fare: ${main}`) : (isEN ? `Mark as done: ${main}` : `Segna come fatto: ${main}`)}
                style={{ backgroundColor: done ? t.main : dark ? 'rgba(255,255,255,0.06)' : colors.card, border: `2px solid ${done ? t.main : dark ? 'rgba(255,255,255,0.22)' : colors.hairline}`, boxShadow: done ? `0 4px 12px ${t.main}55` : 'none' }}
                className="os-focus flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              >
                {done ? <Check size={18} color="#FFFFFF" className="os-check-pop" /> : <Check size={16} color={dark ? 'rgba(255,255,255,0.3)' : colors.hairline} />}
              </button>
            )}
          </div>
          <button type="button" onClick={onToggleHelp} aria-expanded={helpOpen} style={{ color: dark ? t.led : t.dark }} className="os-focus flex items-center gap-1.5 px-3 pb-3 text-[12px] font-semibold hover:opacity-75 transition-opacity">
            <PlayCircle size={14} />{isEN ? 'How to do it' : 'Come si fa'}
            <ChevronDown size={12} style={{ transform: helpOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>
          {helpOpen && (
            <div className="px-3 pb-3 os-fadein">
              {dark ? (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} className="rounded-xl p-3">
                  <p style={{ color: '#D7E1EA' }} className="text-xs leading-relaxed">{ex.howTo || main}</p>
                </div>
              ) : (
                <ExerciseHelp ex={ex} isEN={isEN} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Barra a segmenti "formazione": un segmento per esercizio, pieno quando è fatto.
function DrillProgress({ doneFlags, tone = 'green', isEN, showCount = true }) {
  const t = DRILL_TONES[tone] || DRILL_TONES.green;
  const done = doneFlags.filter(Boolean).length;
  return (
    <div className="flex items-center gap-3" role="img" aria-label={isEN ? `${done} of ${doneFlags.length} exercises done` : `${done} esercizi fatti su ${doneFlags.length}`}>
      <div className="flex-1 flex gap-1">
        {doneFlags.map((f, i) => <span key={i} style={{ backgroundColor: f ? t.main : colors.hairline }} className="h-1.5 flex-1 rounded-full transition-colors" />)}
      </div>
      {showCount && <span style={{ fontFamily: BEBAS, color: done ? t.dark : colors.mutedInk, letterSpacing: '0.04em' }} className="text-[15px] leading-none os-tabular">{done}/{doneFlags.length}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Ordine: titoli di sezione e tappe del percorso, per dividere ogni schermata in "comparti"
// riconoscibili e far vedere sempre dove sei e dove stai andando.
// ---------------------------------------------------------------------------------------

// Titolo di un comparto: etichetta piccola (di che parte si tratta), titolo (cosa trovi qui)
// e, se serve, una riga di spiegazione. Stesso aspetto in tutta l'app.
function SectionTitle({ id, kicker, title, hint, tone = 'green', className = '' }) {
  const kColor = { green: colors.accentDark, teal: colors.preventionDark, gold: '#8A5A00' }[tone] || colors.accentDark;
  return (
    <div id={id} className={`mb-3 scroll-mt-4 ${className}`}>
      {kicker && (
        <p style={{ fontFamily: BRICOLAGE, color: kColor, letterSpacing: '0.14em' }} className="flex items-center gap-1.5 text-[10px] font-bold uppercase mb-1">
          <span style={{ backgroundColor: kColor }} className="w-3 h-[2px] rounded-full" aria-hidden="true" />{kicker}
        </p>
      )}
      <h2 style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="text-[18px] font-bold leading-tight">{title}</h2>
      {hint && <p style={{ color: colors.mutedInk }} className="text-[12.5px] leading-snug mt-1">{hint}</p>}
    </div>
  );
}

// Le 4 tappe per arrivare al percorso: Zona → Infortunio → Imposta → Percorso. Le tappe già
// fatte sono toccabili per tornare indietro (se la schermata passa onStep).
function FlowSteps({ current, isEN, onStep }) {
  const steps = isEN ? ['Area', 'Injury', 'Set up', 'Recovery'] : ['Zona', 'Infortunio', 'Imposta', 'Percorso'];
  return (
    <nav aria-label={isEN ? 'Steps to your recovery plan' : 'Tappe verso il tuo percorso'} className="mb-5">
      <ol className="flex items-start">
        {steps.map((label, i) => {
          const done = i < current;
          const now = i === current;
          const clickable = done && typeof onStep === 'function';
          const dot = (
            <span style={{ backgroundColor: done ? colors.accent : now ? colors.heroBg : colors.card, border: `2px solid ${done ? colors.accent : now ? colors.heroBg : colors.hairline}`, boxShadow: now ? `0 0 0 4px ${colors.accent}33` : 'none' }} className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center">
              {done ? <Check size={13} color="#FFFFFF" /> : <span style={{ fontFamily: BEBAS, color: now ? LED_GREEN : colors.mutedInk }} className="text-[15px] leading-none">{i + 1}</span>}
            </span>
          );
          const text = <span style={{ fontFamily: BRICOLAGE, color: now ? colors.ink : done ? colors.accentDark : colors.mutedInk }} className={`mt-1.5 text-[11px] leading-none ${now ? 'font-bold' : 'font-semibold'}`}>{label}</span>;
          return (
            <li key={label} className="relative flex-1 flex flex-col items-center" aria-current={now ? 'step' : undefined}>
              {i > 0 && <span aria-hidden="true" style={{ backgroundColor: i <= current ? colors.accent : colors.hairline }} className="absolute top-[13px] right-1/2 w-full h-0.5" />}
              {clickable
                ? <button type="button" onClick={() => onStep(i)} className="os-focus flex flex-col items-center rounded-lg" aria-label={isEN ? `Back to: ${label}` : `Torna a: ${label}`}>{dot}{text}</button>
                : <>{dot}{text}</>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// "In questa pagina": le sezioni di una schermata lunga come chip toccabili, per vedere
// subito cosa c'è e saltarci direttamente.
function SectionNav({ items, isEN, tone = 'green' }) {
  const tc = tone === 'teal' ? colors.preventionDark : colors.accentDark;
  return (
    <nav aria-label={isEN ? 'On this page' : 'In questa pagina'} className="mt-4">
      <p style={{ fontFamily: BRICOLAGE, color: colors.mutedInk, letterSpacing: '0.12em' }} className="text-[9.5px] font-bold uppercase mb-2">{isEN ? 'On this page' : 'In questa pagina'}</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {items.map((it) => (
          <button key={it.id} type="button" onClick={it.onClick} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus flex-shrink-0 flex items-center gap-1 rounded-full pl-2 pr-2.5 py-1.5 text-[11.5px] font-semibold shadow-sm hover:border-green-300 active:scale-[0.97] transition">
            <it.icon size={13} color={tc} />{it.label}
            {it.badge && <span style={{ color: tc, fontFamily: BEBAS, letterSpacing: '0.04em' }} className="text-[13px] leading-none">{it.badge}</span>}
          </button>
        ))}
      </div>
    </nav>
  );
}

// Intestazione di un passaggio numerato (1, 2…) dentro una schermata guidata.
function StepHeading({ n, title, hint, done = false }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <span style={{ backgroundColor: done ? colors.accent : colors.heroBg, fontFamily: BEBAS }} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
        {done ? <Check size={15} color="#FFFFFF" /> : <span style={{ color: LED_GREEN }} className="text-[17px] leading-none">{n}</span>}
      </span>
      <div className="min-w-0 pt-0.5">
        <p style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="text-[16px] font-bold leading-tight">{title}</p>
        {hint && <p style={{ color: colors.mutedInk }} className="text-xs leading-snug mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

// Una durata indicativa leggibile: giorni, settimane o mesi.
function durationLabel(days, isEN) {
  if (days <= 21) return isEN ? `${days} days` : `${days} gg`;
  if (days < 120) return isEN ? `${Math.round(days / 7)} wks` : `${Math.round(days / 7)} sett.`;
  return isEN ? `${Math.round(days / 30)} mo` : `${Math.round(days / 30)} mesi`;
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
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: colors.ink }} className="flex-1 text-sm font-semibold">{label}</span>
        {badge}
        <ChevronDown size={16} color={colors.mutedInk} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </button>
      {isOpen && <div className="px-4 pb-4 os-fadein">{children}</div>}
    </div>
  );
}

// Bottone oro di Premium, con un riflesso di luce che ci passa sopra ogni tanto.
function GoldButton({ children, onClick, href, full = false }) {
  const cls = `os-focus relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-wide shadow-md hover:brightness-105 active:scale-[0.98] transition ${full ? 'w-full py-4 text-sm' : 'px-5 py-3 text-xs'}`;
  const style = { background: GOLD_GRADIENT, color: '#0B121A', fontFamily: BRICOLAGE, letterSpacing: '0.06em', boxShadow: '0 8px 22px rgba(240,180,41,0.28)' };
  const inner = <>{children}<span className="os-sheen" aria-hidden="true" /></>;
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} style={style} className={cls}>{inner}</a>
    : <button type="button" onClick={onClick} style={style} className={cls}>{inner}</button>;
}

// Il banner che porta a Premium, in stile "biglietto oro": cornice sfumata oro, etichetta
// PREMIUM e il vantaggio concreto. Il prefisso "Premium:" dei testi esistenti diventa
// l'etichetta, così non si ripete.
function PremiumBanner({ text, onClick }) {
  const body = String(text || '').replace(/^Premium:\s*/i, '');
  const label = body.charAt(0).toUpperCase() + body.slice(1);
  return (
    <button onClick={onClick} style={{ background: 'linear-gradient(120deg, #F9DD85, #8A6414 38%, #F0B429 70%, #6B4D0C)' }} className="os-focus relative w-full overflow-hidden rounded-2xl p-[1.5px] mb-5 text-left shadow-md hover:brightness-110 active:scale-[0.99] transition">
      <div style={{ background: 'radial-gradient(120% 140% at 0% 0%, rgba(240,180,41,0.24), rgba(240,180,41,0) 55%), #0E1620' }} className="relative flex items-center gap-3.5 overflow-hidden rounded-[15px] px-4 py-3.5">
        <div style={{ background: GOLD_GRADIENT }} className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm">
          <Trophy size={20} color="#0E1620" />
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: BEBAS, letterSpacing: '0.14em' }} className="os-gold-text text-[14px] leading-none mb-1">Premium</p>
          <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="text-sm font-semibold leading-snug">{label}</p>
        </div>
        <ChevronRight size={18} color={colors.premiumGold} className="flex-shrink-0" />
        <span className="os-sheen" aria-hidden="true" />
      </div>
    </button>
  );
}

// Contenuto Premium bloccato: dietro si intravede (sfocato) il contenuto vero, davanti il
// lucchetto oro, cosa sblocchi e il bottone. Senza anteprima diventa una card normale.
function PremiumLockCard({ title, text, cta, onUnlock, preview = [], icon: Icon = Lock, badge }) {
  const hasPreview = preview.length > 0;
  return (
    <div style={{ background: PREMIUM_BG, border: '1px solid rgba(240,180,41,0.35)' }} className="relative overflow-hidden rounded-3xl shadow-lg">
      {hasPreview && (
        <div aria-hidden="true" style={{ filter: 'blur(3px)', opacity: 0.5 }} className="p-4 space-y-2 min-h-[300px] pointer-events-none select-none">
          {preview.map((line, i) => (
            <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <span style={{ fontFamily: BEBAS, color: colors.premiumGold }} className="text-xl leading-none">{String(i + 1).padStart(2, '0')}</span>
              <span style={{ color: '#EEF3F8' }} className="text-sm leading-snug">{line}</span>
            </div>
          ))}
        </div>
      )}
      <div style={hasPreview ? { background: 'linear-gradient(180deg, rgba(11,18,26,0.05) 0%, rgba(11,18,26,0.55) 28%, rgba(11,18,26,0.92) 58%)' } : undefined} className={`${hasPreview ? 'absolute inset-0' : 'relative'} flex flex-col items-center justify-center text-center px-6 py-7`}>
        <div style={{ background: GOLD_GRADIENT, boxShadow: '0 6px 20px rgba(240,180,41,0.35)' }} className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
          <Icon size={22} color="#0B121A" />
        </div>
        {badge && <span style={{ border: '1px solid rgba(240,180,41,0.5)', color: colors.premiumGold }} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2">{badge}</span>}
        <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="text-[17px] font-bold leading-snug mb-1.5">{title}</p>
        <p style={{ color: '#A9B7C4' }} className="text-sm leading-relaxed mb-4 max-w-xs">{text}</p>
        <GoldButton onClick={onUnlock}><Lock size={13} />{cta}</GoldButton>
      </div>
    </div>
  );
}

// Scelta del ruolo come "maglie" numerate (numeri classici: 1 portiere, 5 difensore,
// 8 centrocampista, 9 attaccante). Solo grafica: il ruolo salvato resta la stessa chiave.
const POSITION_NUMBERS = { portiere: 1, difensore: 5, centrocampista: 8, attaccante: 9 };
function PositionPicker({ positions, value, onPick, dark = false }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {positions.map((pos) => {
        const on = value === pos.key;
        return (
          <button
            key={pos.key}
            type="button"
            onClick={() => onPick(pos.key)}
            aria-pressed={on}
            style={{
              backgroundColor: on ? colors.premiumGold : dark ? 'rgba(255,255,255,0.06)' : colors.card,
              border: `1.5px solid ${on ? colors.premiumGold : dark ? 'rgba(240,180,41,0.35)' : colors.premiumGold + '66'}`,
              color: on ? '#0B121A' : dark ? '#FFFFFF' : colors.ink,
            }}
            className="os-focus flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors"
          >
            <span style={{ fontFamily: BEBAS, color: on ? '#0B121A' : colors.premiumGold }} className="text-[26px] leading-none w-6 text-center">{POSITION_NUMBERS[pos.key] || '•'}</span>
            <span style={{ fontFamily: BRICOLAGE }} className="text-[13px] font-bold leading-tight">{pos.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ExerciseHelp({ ex, isEN }) {
  // Quando l'esercizio ha una spiegazione specifica scritta (howTo), la mostriamo al posto
  // del vecchio video: i video erano assegnati per categoria generica (es. tutti gli esercizi
  // "strength" condividevano lo stesso video), quindi spesso non c'entravano con l'esercizio
  // mostrato. Il fallback sotto resta per le sezioni non ancora arricchite (prevenzione, tecnica).
  if (ex.howTo) {
    return (
      <div style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}` }} className="mt-2.5 rounded-xl p-3">
        <p style={{ color: colors.ink }} className="text-xs leading-relaxed">{ex.howTo}</p>
      </div>
    );
  }
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
  link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Public+Sans:wght@400..700&family=Bebas+Neue&display=swap';
  document.head.appendChild(link);
}

function scrollToId(id) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toISODate(d) { return d.toISOString().slice(0, 10); }
// Giorno di calendario locale (a mezzogiorno, così il fuso non lo sposta al giorno prima).
function localDayKey(date = new Date()) { return toISODate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)); }
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
// Classifica la disponibilità di un giocatore per la prossima partita, in modo puramente
// indicativo a partire dai dati già condivisi: la decisione finale spetta sempre allo staff medico.
function classifyPlayerAvailability(player) {
  const s = player && player.status;
  if (!s || !s.injuryLabel) return 'available';
  if (Number.isFinite(s.phaseIndex) && Number.isFinite(s.totalPhases) && s.phaseIndex >= s.totalPhases - 1) {
    return 'doubtful';
  }
  return 'out';
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
// Livelli di carico ordinabili, usati solo per confrontare "quanto" un giorno rispetto a un altro.
const WELLNESS_LOAD_ORDER = { riposo: 0, leggero: 1, normale: 2, intenso: 3 };

// Calcola un segnale settimanale di attenzione (verde/giallo/rosso) dagli ultimi check-in di
// benessere completi (sonno + indolenzimento + carico, tutti e tre compilati per quel giorno).
// È volutamente una regola semplice e leggibile, non un modello predittivo: incrocia solo
// pattern noti in letteratura sportiva di base (sonno scarso + indolenzimento persistente,
// picco di carico dopo giorni di scarico, accumulo senza mai scaricare). Serve a suggerire
// allo staff chi vale la pena chiedere come sta — non è una diagnosi né una previsione.
// Richiede almeno 3 giornate complete negli ultimi 7 giorni disponibili, altrimenti i dati
// non bastano per dire nulla di sensato.
function computeWellnessRisk(checkins) {
  const days = [];
  for (let i = 0; i < 7 && days.length < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const entry = checkins[toISODate(d)];
    if (entry && entry.sleep && entry.soreness && entry.load) days.push(entry);
  }
  // days[0] è la giornata completa più recente, in ordine decrescente nel tempo.
  if (days.length < 3) return { level: 'insufficiente', daysTracked: days.length };

  const last3 = days.slice(0, 3);
  const badSleepStreak = last3.filter((d) => d.sleep === 'male').length;
  const highSorenessStreak = last3.filter((d) => d.soreness === 'molto').length;

  // Picco di carico: la giornata più recente è "intenso" dopo almeno 2 giornate di scarico/leggero.
  const last4Loads = days.slice(0, 4).map((d) => d.load);
  const loadSpike = last4Loads.length >= 3 && last4Loads[0] === 'intenso'
    && last4Loads.slice(1, 3).every((l) => WELLNESS_LOAD_ORDER[l] <= 1);

  // Accumulo senza scarico: 4 giornate di fila tutte "normale" o "intenso", mai sotto.
  const noOffloadStreak = last4Loads.length === 4 && last4Loads.every((l) => WELLNESS_LOAD_ORDER[l] >= 2);

  const today = days[0];
  const todayDoubleSignal = today.sleep === 'male' && today.soreness === 'molto';

  if ((badSleepStreak >= 2 && highSorenessStreak >= 2) || loadSpike || todayDoubleSignal) {
    return { level: 'rosso', daysTracked: days.length };
  }
  if (badSleepStreak >= 2 || highSorenessStreak >= 2 || noOffloadStreak) {
    return { level: 'giallo', daysTracked: days.length };
  }
  return { level: 'verde', daysTracked: days.length };
}

// ============================================================================
// Screening del movimento (fotocamera + pose estimation on-device)
// ============================================================================
// Idea: usare la fotocamera del telefono per dare un'occhiata a simmetria e controllo
// del movimento (squat, equilibrio monopodalico) tramite un modello di stima della posa
// (MoveNet, via TensorFlow.js) che gira INTERAMENTE nel browser, sul dispositivo.
// Nessun fotogramma/video/immagine lascia mai il telefono — né verso i nostri server né
// verso terzi — e a differenza del check-in di benessere qui non c'è NESSUNA sincronizzazione,
// nemmeno di un segnale riassuntivo: il risultato resta solo su questo dispositivo.
// È deliberatamente uno screening euristico/indicativo (le soglie qui sotto sono stime di
// buon senso, non validate clinicamente): serve a far notare per tempo eventuali compensi,
// non a diagnosticare né prevenire con certezza un infortunio. Vedi i testi in
// movementVerdictCopy per come questo limite viene comunicato all'utente.

const POSE_CONF_THRESHOLD = 0.4;
const POSE_TRACK_NAMES = ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
const POSE_SKELETON_EDGES = [
  ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'], ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];
const SQUAT_MIN_REPS = 3;
const SQUAT_DOWN_RATIO = 0.85;
const SQUAT_UP_RATIO = 0.93;
const SQUAT_CALIBRATION_MS = 1200;
const BALANCE_HOLD_MS = 10000;
const BALANCE_MIN_SAMPLES = 40;

function poseKeypointsToMap(keypoints) {
  const map = {};
  for (const kp of keypoints) map[kp.name] = kp;
  return map;
}
function poseAvgConfidence(map, names) {
  let sum = 0;
  for (const n of names) sum += map[n]?.score || 0;
  return sum / names.length;
}
function poseDist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function poseMid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function poseMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function poseStdDev(arr) {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}
// Stima di quanto un ginocchio si sposta rispetto alla retta anca-caviglia, all'altezza del
// ginocchio stesso — una versione semplificata del "frontal plane projection angle" usato in
// alcuni screening del movimento in fisioterapia, qui ridotto a uno scostamento orizzontale.
function poseKneeLineDeviation(hip, knee, ankle) {
  if (Math.abs(ankle.y - hip.y) < 1e-3) return 0;
  const t = (knee.y - hip.y) / (ankle.y - hip.y);
  const lineX = hip.x + (ankle.x - hip.x) * t;
  return knee.x - lineX;
}
function drawPoseSkeleton(canvas, videoWidth, videoHeight, pose) {
  if (!canvas || !videoWidth || !videoHeight) return;
  if (canvas.width !== videoWidth) canvas.width = videoWidth;
  if (canvas.height !== videoHeight) canvas.height = videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!pose) return;
  const map = poseKeypointsToMap(pose.keypoints);
  ctx.lineWidth = Math.max(3, videoWidth / 200);
  ctx.strokeStyle = 'rgba(47,167,102,0.9)';
  for (const [a, b] of POSE_SKELETON_EDGES) {
    const pa = map[a], pb = map[b];
    if (pa && pb && pa.score > POSE_CONF_THRESHOLD && pb.score > POSE_CONF_THRESHOLD) {
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
  }
  ctx.fillStyle = '#F0B429';
  const r = Math.max(4, videoWidth / 160);
  for (const name of POSE_TRACK_NAMES) {
    const p = map[name];
    if (p && p.score > POSE_CONF_THRESHOLD) {
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// Aggrega le ripetizioni di squat raccolte in un verdetto. Pura funzione (nessun accesso a
// stato React), così da poter essere testata con dati sintetici.
function aggregateSquatResult(repSamples) {
  if (repSamples.length < SQUAT_MIN_REPS) return { level: 'insufficiente', reps: repSamples.length };
  const leftValgus = Math.max(0, poseMedian(repSamples.map((r) => -r.leftDev)));
  const rightValgus = Math.max(0, poseMedian(repSamples.map((r) => r.rightDev)));
  const hipDiff = poseMedian(repSamples.map((r) => r.hipDiffY));
  const maxValgus = Math.max(leftValgus, rightValgus);

  let level = 'verde';
  if (maxValgus > 0.16 || hipDiff > 0.12) level = 'rosso';
  else if (maxValgus > 0.08 || hipDiff > 0.06) level = 'giallo';

  let side = null;
  if (level !== 'verde') {
    side = leftValgus > rightValgus * 1.3 ? 'left' : rightValgus > leftValgus * 1.3 ? 'right' : 'both';
  }
  return { level, reps: repSamples.length, side, maxValgus, hipDiff };
}

// Aggrega le due serie (destra/sinistra) del test di equilibrio monopodalico in un verdetto.
function aggregateBalanceResult(rightSamples, leftSamples) {
  if (rightSamples.length < BALANCE_MIN_SAMPLES || leftSamples.length < BALANCE_MIN_SAMPLES) {
    return { level: 'insufficiente', rightSamples: rightSamples.length, leftSamples: leftSamples.length };
  }
  const swayR = poseStdDev(rightSamples.map((s) => s.hipMidX));
  const swayL = poseStdDev(leftSamples.map((s) => s.hipMidX));
  const dropR = rightSamples.reduce((a, s) => a + s.pelvicDrop, 0) / rightSamples.length;
  const dropL = leftSamples.reduce((a, s) => a + s.pelvicDrop, 0) / leftSamples.length;
  const swayRatio = Math.max(swayR, swayL) / Math.max(Math.min(swayR, swayL), 0.01);
  const worseDrop = Math.max(dropR, dropL);
  const worseDropSide = dropR >= dropL ? 'right' : 'left';

  let level = 'verde';
  if (worseDrop > 0.09 || swayRatio > 2.2) level = 'rosso';
  else if (worseDrop > 0.05 || swayRatio > 1.6) level = 'giallo';

  let side = null;
  if (level !== 'verde') side = worseDrop > 0.05 ? worseDropSide : (swayR >= swayL ? 'right' : 'left');
  return { level, side, swayR, swayL, dropR, dropL };
}

function movementSideLabel(side, isEN) {
  if (side === 'left') return isEN ? 'left' : 'sinistro';
  if (side === 'right') return isEN ? 'right' : 'destro';
  return isEN ? 'both sides' : 'entrambi i lati';
}
// Testi non diagnostici per ciascun verdetto: descrivono cosa è stato osservato, mai una
// diagnosi, e per giallo/rosso invitano a parlarne con un professionista invece di allarmare.
function movementVerdictCopy(test, result, isEN) {
  const { level, side } = result;
  if (level === 'insufficiente') {
    return {
      title: isEN ? 'Not enough data' : 'Dati insufficienti',
      body: test === 'squat'
        ? (isEN ? 'I couldn\'t capture enough clean reps (at least 3 are needed). Try again with more light or staying steadier in frame.' : 'Non sono riuscito a registrare abbastanza ripetizioni pulite (ne servono almeno 3). Riprova con più luce o restando più stabile nell\'inquadratura.')
        : (isEN ? 'I couldn\'t track you closely enough on one or both legs. Try again, staying steady and fully in frame.' : 'Non sono riuscito a seguirti abbastanza da vicino su una o entrambe le gambe. Riprova restando fermo e ben inquadrato.'),
    };
  }
  if (test === 'squat') {
    if (level === 'verde') {
      return { title: isEN ? 'No clear asymmetry' : 'Nessuna asimmetria evidente', body: isEN ? 'Your knees seem to track well on both sides through the squat. Keep it up.' : 'Il ginocchio sembra restare ben allineato su entrambi i lati durante lo squat. Continua così.' };
    }
    const s = movementSideLabel(side, isEN);
    if (level === 'giallo') {
      return { title: isEN ? 'Slight asymmetry noticed' : 'Leggera asimmetria rilevata', body: isEN ? `Your ${s} knee tends to drift slightly inward during the squat. It happens, especially under fatigue — worth mentioning to a physio or trainer if you want a second opinion.` : `Durante lo squat il ginocchio ${s} tende a spostarsi leggermente verso l'interno. Può capitare, specialmente sotto fatica: se vuoi, parlane con un fisioterapista o un preparatore.` };
    }
    return { title: isEN ? 'More noticeable asymmetry' : 'Asimmetria più marcata rilevata', body: isEN ? `Your ${s} knee moves noticeably inward during the squat. Worth having a physio take a look, especially if you train with load or high intensity.` : `Durante lo squat il ginocchio ${s} si sposta in modo evidente verso l'interno. Vale la pena farlo osservare da un fisioterapista, soprattutto se alleni con carichi o ad alta intensità.` };
  }
  if (level === 'verde') {
    return { title: isEN ? 'Good stability on both sides' : 'Buona stabilità su entrambi i lati', body: isEN ? 'Your hips stay stable and sway is similar on both legs.' : 'Il bacino resta stabile e l\'oscillazione è simile tra destra e sinistra.' };
  }
  const s2 = movementSideLabel(side, isEN);
  if (level === 'giallo') {
    return { title: isEN ? 'Slight difference between sides' : 'Leggera differenza tra i due lati', body: isEN ? `Your ${s2} side shows a bit more sway or hip drop than the other. Can be normal, especially if you have a dominant leg.` : `Il lato ${s2} mostra un po' più di oscillazione o un lieve cedimento del bacino rispetto all'altro. Può essere normale, specialmente se hai una gamba dominante.` };
  }
  return { title: isEN ? 'More noticeable difference between sides' : 'Differenza più marcata tra i due lati', body: isEN ? `Your ${s2} side shows clearly more sway or hip drop than the other. Worth discussing with a physio, especially after any past injury to that leg or ankle.` : `Il lato ${s2} mostra un'oscillazione o un cedimento del bacino nettamente maggiore rispetto all'altro. Vale la pena parlarne con un fisioterapista, soprattutto se hai avuto infortuni a quella gamba o caviglia.` };
}
function movementVerdictMeta(level) {
  if (level === 'verde') return { color: colors.accent, tint: colors.accentTint, Icon: CheckCircle2 };
  if (level === 'giallo') return { color: colors.orange, tint: 'rgba(201,106,34,0.14)', Icon: AlertTriangle };
  if (level === 'rosso') return { color: colors.red, tint: colors.redTint, Icon: AlertTriangle };
  return { color: colors.mutedInk, tint: colors.laneBg, Icon: HelpCircle };
}

// Overlay a schermo intero che gestisce fotocamera, modello di pose estimation e la macchina a
// stati dello screening (posizionamento -> calibrazione -> registrazione -> risultato).
// Tutto ciò che serve al calcolo (campioni per-frame, fase corrente, ecc.) vive in ref mutabili
// per non forzare un render ad ogni fotogramma: lo stato React viene aggiornato solo quando
// cambia qualcosa che l'utente deve vedere (conteggio ripetizioni, secondi rimasti, ecc.).
function MovementCameraOverlay({ test, isEN, onCancel, onComplete }) {
  // displayFont vive normalmente nel componente App (non è un modulo condiviso): essendo
  // questo un componente a parte, viene ridefinito qui identico per restare coerente con il
  // resto dell'app (titoli in Bricolage Grotesque).
  const displayFont = { fontFamily: "'Bricolage Grotesque', sans-serif" };
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const trackingOkRef = useRef(false);
  const balancePhaseRef = useRef('right');
  const dataRef = useRef({});

  const [stage, setStage] = useState('loading');
  const [errorKind, setErrorKind] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [trackingOk, setTrackingOk] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [balancePhase, setBalancePhase] = useState('right');
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [result, setResult] = useState(null);

  const resetMeasurement = () => {
    dataRef.current = { squat: null, balance: { right: [], left: [], elapsedInPhase: 0 } };
    balancePhaseRef.current = 'right';
    setBalancePhase('right');
    setSecondsLeft(10);
    setRepCount(0);
    setResult(null);
  };

  // Avvio: carica il modello (TensorFlow.js + MoveNet) e la fotocamera. Si rifà da capo se
  // l'utente cambia fotocamera (facingMode) o se questa istanza viene smontata.
  useEffect(() => {
    let cancelled = false;
    resetMeasurement();
    setStage('loading');
    setErrorKind(null);
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) { setErrorKind('unsupported'); setStage('error'); }
        return;
      }
      try {
        const tf = await import('@tensorflow/tfjs-core');
        await import('@tensorflow/tfjs-backend-webgl');
        const poseDetection = await import('@tensorflow-models/pose-detection');
        await tf.setBackend('webgl');
        await tf.ready();
        if (cancelled) return;
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        });
        if (cancelled) { detector.dispose?.(); return; }
        detectorRef.current = detector;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if (!cancelled) setStage('positioning');
      } catch (err) {
        if (cancelled) return;
        console.error('Errore avvio screening movimento:', err);
        setErrorKind(err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' ? 'permission' : 'generic');
        setStage('error');
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      detectorRef.current?.dispose?.();
      detectorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };

  const finishSquat = () => {
    const res = aggregateSquatResult((dataRef.current.squat?.repSamples) || []);
    setResult(res);
    setStage('result');
    stopCamera();
  };

  // Ciclo di stima della posa: gira mentre la fotocamera è attiva e non siamo ancora al
  // risultato finale. Guida la macchina a stati (calibrazione -> registrazione) e aggiorna lo
  // stato React SOLO quando un valore visibile all'utente cambia davvero.
  useEffect(() => {
    if (stage !== 'positioning' && stage !== 'calibrating' && stage !== 'recording') return;
    let active = true;
    const loop = async () => {
      if (!active) return;
      const video = videoRef.current;
      const detector = detectorRef.current;
      if (!detector || !video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const now = performance.now();
      const dt = lastFrameTimeRef.current == null ? 16 : Math.min(now - lastFrameTimeRef.current, 100);
      lastFrameTimeRef.current = now;

      try {
        const poses = await detector.estimatePoses(video, { flipHorizontal: false });
        if (!active) return;
        const pose = poses[0] || null;
        drawPoseSkeleton(canvasRef.current, video.videoWidth, video.videoHeight, pose);
        const map = pose ? poseKeypointsToMap(pose.keypoints) : {};
        const conf = pose ? poseAvgConfidence(map, POSE_TRACK_NAMES) : 0;
        const ok = conf > POSE_CONF_THRESHOLD;
        if (ok !== trackingOkRef.current) { trackingOkRef.current = ok; setTrackingOk(ok); }

        if (stage === 'calibrating' && ok) {
          if (test === 'squat') {
            const d = dataRef.current;
            if (!d.squat) d.squat = { calibElapsed: 0, calibSamples: [], standingLegLen: null, phase: 'up', repMin: null, repSamples: [] };
            const lS = map.left_shoulder, rS = map.right_shoulder, lH = map.left_hip, rH = map.right_hip, lA = map.left_ankle, rA = map.right_ankle;
            const scale = poseDist(lS, rS) || 1;
            const hipMid = poseMid(lH, rH);
            const ankleMid = poseMid(lA, rA);
            const legLen = (ankleMid.y - hipMid.y) / scale;
            d.squat.calibElapsed += dt;
            d.squat.calibSamples.push(legLen);
            if (d.squat.calibElapsed >= SQUAT_CALIBRATION_MS) {
              d.squat.standingLegLen = poseMedian(d.squat.calibSamples);
              setStage('recording');
            }
          } else {
            dataRef.current.calibElapsed = (dataRef.current.calibElapsed || 0) + dt;
            if (dataRef.current.calibElapsed >= 900) setStage('recording');
          }
        } else if (stage === 'recording' && test === 'squat' && ok) {
          const s = dataRef.current.squat;
          if (s && s.standingLegLen != null) {
            const lS = map.left_shoulder, rS = map.right_shoulder, lH = map.left_hip, rH = map.right_hip;
            const lK = map.left_knee, rK = map.right_knee, lA = map.left_ankle, rA = map.right_ankle;
            const scale = poseDist(lS, rS) || 1;
            const hipMid = poseMid(lH, rH);
            const ankleMid = poseMid(lA, rA);
            const ratio = ((ankleMid.y - hipMid.y) / scale) / s.standingLegLen;
            const sampleNow = () => ({ leftDev: poseKneeLineDeviation(lH, lK, lA) / scale, rightDev: poseKneeLineDeviation(rH, rK, rA) / scale, hipDiffY: Math.abs(lH.y - rH.y) / scale });
            if (s.phase === 'up' && ratio < SQUAT_DOWN_RATIO) {
              s.phase = 'down';
              s.repMin = { ratio, ...sampleNow() };
            } else if (s.phase === 'down') {
              if (ratio < s.repMin.ratio) s.repMin = { ratio, ...sampleNow() };
              if (ratio > SQUAT_UP_RATIO) {
                s.phase = 'up';
                s.repSamples.push(s.repMin);
                setRepCount(s.repSamples.length);
              }
            }
          }
        } else if (stage === 'recording' && test === 'balance') {
          const b = dataRef.current.balance;
          if (ok) {
            const lH = map.left_hip, rH = map.right_hip, lS = map.left_shoulder, rS = map.right_shoulder;
            const scale = poseDist(lS, rS) || 1;
            const hipMidX = (lH.x + rH.x) / 2 / scale;
            if (balancePhaseRef.current === 'right') b.right.push({ hipMidX, pelvicDrop: (lH.y - rH.y) / scale });
            else b.left.push({ hipMidX, pelvicDrop: (rH.y - lH.y) / scale });
          }
          b.elapsedInPhase += dt;
          const nextSeconds = Math.max(0, Math.ceil((BALANCE_HOLD_MS - b.elapsedInPhase) / 1000));
          setSecondsLeft((prev) => (prev !== nextSeconds ? nextSeconds : prev));
          if (b.elapsedInPhase >= BALANCE_HOLD_MS) {
            if (balancePhaseRef.current === 'right') {
              balancePhaseRef.current = 'left';
              setBalancePhase('left');
              setSecondsLeft(10);
              b.elapsedInPhase = 0;
            } else {
              const res = aggregateBalanceResult(b.right, b.left);
              setResult(res);
              setStage('result');
              stopCamera();
            }
          }
        }
      } catch (err) {
        // Un fotogramma occasionale non riuscito non deve interrompere lo screening.
      }
      if (active) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { active = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, test]);

  const startCalibration = () => {
    if (test === 'squat') dataRef.current.squat = { calibElapsed: 0, calibSamples: [], standingLegLen: null, phase: 'up', repMin: null, repSamples: [] };
    else { dataRef.current.calibElapsed = 0; dataRef.current.balance = { right: [], left: [], elapsedInPhase: 0 }; balancePhaseRef.current = 'right'; setBalancePhase('right'); setSecondsLeft(10); }
    setRepCount(0);
    setStage('calibrating');
  };
  const retry = () => { resetMeasurement(); setStage('positioning'); };

  const T = {
    positioningTitle: isEN ? 'Get in frame' : 'Mettiti in posizione',
    positioningBodySquat: isEN ? 'Stand about 2m (6ft) from the phone, facing it, so your whole body is visible.' : 'Mettiti a circa 2 metri dal telefono, di fronte, in modo che tutto il corpo sia visibile.',
    positioningBodyBalance: isEN ? 'Stand about 2m (6ft) from the phone, facing it. You\'ll balance on your right leg first, then your left.' : 'Mettiti a circa 2 metri dal telefono, di fronte. Farai prima equilibrio sulla gamba destra, poi sulla sinistra.',
    trackingGood: isEN ? 'I can see you clearly' : 'Ti vedo bene',
    trackingBad: isEN ? 'Can\'t see you well — adjust distance or light' : 'Non riesco a vederti bene: correggi distanza o luce',
    ready: isEN ? 'I\'m ready' : 'Sono pronto',
    calibratingSquat: isEN ? 'Stand still for a second...' : 'Rimani fermo in piedi un secondo...',
    calibratingBalance: isEN ? 'Get ready...' : 'Preparati...',
    repLabel: isEN ? 'reps' : 'ripetizioni',
    squatHint: isEN ? 'Do a few unhurried squats. Tap Done when finished (at least 3, ideally 5-6).' : 'Fai qualche squat con calma. Premi Fine quando hai finito (almeno 3, meglio 5-6).',
    done: isEN ? 'Done' : 'Fine',
    balanceOn: isEN ? 'Balancing on:' : 'In equilibrio su:',
    right: isEN ? 'right leg' : 'gamba destra',
    left: isEN ? 'left leg' : 'gamba sinistra',
    loading: isEN ? 'Getting the analysis tool ready...' : 'Sto preparando lo strumento di analisi...',
    errPermission: isEN ? 'This screening needs camera access. Check your browser permissions and try again.' : 'Per lo screening serve accedere alla fotocamera. Controlla i permessi del browser e riprova.',
    errUnsupported: isEN ? 'Your browser doesn\'t support camera-based screening. Try updating it or use another device.' : 'Il tuo browser non supporta lo screening tramite fotocamera. Prova ad aggiornarlo o usa un altro dispositivo.',
    errGeneric: isEN ? 'Couldn\'t start the screening. Please try again in a moment.' : 'Non sono riuscito ad avviare lo screening. Riprova tra poco.',
    tryAgain: isEN ? 'Try again' : 'Riprova',
    close: isEN ? 'Close' : 'Chiudi',
    saveClose: isEN ? 'Save and close' : 'Salva e chiudi',
    redo: isEN ? 'Redo the test' : 'Rifai il test',
    disclaimer: isEN ? 'A heuristic screening based on computer vision, not a clinical assessment. It does not diagnose or reliably prevent injuries.' : 'Screening euristico basato su computer vision, non una valutazione clinica. Non diagnostica infortuni né li previene con certezza.',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: stage === 'result' ? colors.paper : '#000000' }}>
      <style>{`@keyframes os-movement-spin { to { transform: rotate(360deg); } } .os-movement-spinner { animation: os-movement-spin 0.9s linear infinite; }`}</style>
      {stage !== 'result' && (
        <div className="relative flex-1 overflow-hidden">
          <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />

          <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4">
            <button onClick={onCancel} style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} className="os-focus w-10 h-10 rounded-full flex items-center justify-center" aria-label={T.close}>
              <X size={20} color="#FFFFFF" />
            </button>
            {stage === 'positioning' && (
              <button onClick={() => setFacingMode((f) => (f === 'environment' ? 'user' : 'environment'))} style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} className="os-focus w-10 h-10 rounded-full flex items-center justify-center" aria-label={isEN ? 'Switch camera' : 'Cambia fotocamera'}>
                <RotateCw size={18} color="#FFFFFF" />
              </button>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 p-5 pb-8" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.5) 60%, transparent)' }}>
            {stage === 'loading' && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="os-movement-spinner w-8 h-8 rounded-full" style={{ border: '3px solid rgba(255,255,255,0.25)', borderTopColor: colors.accent }} />
                <p className="text-sm text-center" style={{ color: '#FFFFFF' }}>{T.loading}</p>
              </div>
            )}
            {stage === 'error' && (
              <div className="text-center py-2">
                <AlertTriangle size={24} color={colors.orange} className="mx-auto mb-2" />
                <p className="text-sm mb-4" style={{ color: '#FFFFFF' }}>
                  {errorKind === 'permission' ? T.errPermission : errorKind === 'unsupported' ? T.errUnsupported : T.errGeneric}
                </p>
                {errorKind !== 'unsupported' && (
                  <button onClick={() => setFacingMode((f) => f)} style={{ backgroundColor: colors.accent }} className="os-focus px-5 py-2.5 rounded-lg text-sm font-semibold" >
                    {T.tryAgain}
                  </button>
                )}
              </div>
            )}
            {stage === 'positioning' && (
              <div>
                <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-base font-semibold mb-1">{T.positioningTitle}</p>
                <p style={{ color: 'rgba(255,255,255,0.85)' }} className="text-sm leading-relaxed mb-3">{test === 'squat' ? T.positioningBodySquat : T.positioningBodyBalance}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ backgroundColor: trackingOk ? colors.accent : colors.orange }} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                  <span style={{ color: '#FFFFFF' }} className="text-xs font-medium">{trackingOk ? T.trackingGood : T.trackingBad}</span>
                </div>
                <button onClick={startCalibration} disabled={!trackingOk} style={{ backgroundColor: trackingOk ? colors.accent : 'rgba(255,255,255,0.25)', color: '#FFFFFF' }} className="os-focus w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-colors">
                  {T.ready}
                </button>
              </div>
            )}
            {stage === 'calibrating' && (
              <p className="text-center text-sm py-4" style={{ color: '#FFFFFF' }}>{test === 'squat' ? T.calibratingSquat : T.calibratingBalance}</p>
            )}
            {stage === 'recording' && test === 'squat' && (
              <div className="text-center">
                <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-5xl font-bold mb-1 os-tabular">{repCount}</p>
                <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-xs uppercase tracking-wide mb-3">{T.repLabel}</p>
                <p style={{ color: 'rgba(255,255,255,0.85)' }} className="text-xs leading-relaxed mb-4">{T.squatHint}</p>
                <button onClick={finishSquat} disabled={repCount === 0} style={{ backgroundColor: repCount > 0 ? colors.accent : 'rgba(255,255,255,0.25)', color: '#FFFFFF' }} className="os-focus w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wide transition-colors">
                  {T.done}
                </button>
              </div>
            )}
            {stage === 'recording' && test === 'balance' && (
              <div className="text-center">
                <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-5xl font-bold mb-1 os-tabular">{secondsLeft}</p>
                <p style={{ color: 'rgba(255,255,255,0.85)' }} className="text-sm mb-2">{T.balanceOn} <strong>{balancePhase === 'right' ? T.right : T.left}</strong></p>
                <div className="flex items-center justify-center gap-2">
                  <span style={{ backgroundColor: trackingOk ? colors.accent : colors.orange }} className="w-2 h-2 rounded-full flex-shrink-0" />
                  <span style={{ color: 'rgba(255,255,255,0.7)' }} className="text-[11px]">{trackingOk ? T.trackingGood : T.trackingBad}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {stage === 'result' && result && (() => {
        const copy = movementVerdictCopy(test, result, isEN);
        const meta = movementVerdictMeta(result.level);
        const VIcon = meta.Icon;
        return (
          <div className="flex-1 overflow-y-auto p-5 pt-8">
            <div style={{ backgroundColor: meta.tint, border: `1.5px solid ${meta.color}40` }} className="rounded-2xl p-5 mb-5">
              <div style={{ backgroundColor: '#FFFFFF' }} className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm">
                <VIcon size={24} color={meta.color} />
              </div>
              <p style={{ ...displayFont, color: meta.color }} className="text-lg font-bold mb-2">{copy.title}</p>
              <p style={{ color: colors.ink }} className="text-sm leading-relaxed">{copy.body}</p>
            </div>
            <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed text-center mb-6">{T.disclaimer}</p>
            <div className="space-y-2.5">
              {result.level !== 'insufficiente' && (
                <button onClick={() => onComplete(result)} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus w-full py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wide">
                  {T.saveClose}
                </button>
              )}
              <button onClick={retry} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full py-3.5 rounded-xl text-sm font-semibold">
                {T.redo}
              </button>
              {result.level === 'insufficiente' && (
                <button onClick={onCancel} style={{ color: colors.mutedInk }} className="os-focus w-full text-xs underline text-center py-2">
                  {T.close}
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
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
    premium: 4, teamRegister: 4, teamLogin: 4, teamDashboard: 4,
    movementScreen: 1,
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
  const [triageAnswers, setTriageAnswers] = useState({ mechanism: null, pop: null, weight: null, swelling: null });
  const [triageRegion, setTriageRegion] = useState(null);
  const [triageCandidateIndex, setTriageCandidateIndex] = useState(0);
  const [selectedInjury, setSelectedInjury] = useState(null);
  const [activePhase, setActivePhase] = useState(0);
  const [progress, setProgress] = useState({});
  const [criteriaChecked, setCriteriaChecked] = useState({});
  const [injuryDates, setInjuryDates] = useState({});
  const [injurySeverities, setInjurySeverities] = useState({});
  const [dailyLog, setDailyLog] = useState({});
  // Check-in di benessere giornaliero (sonno/indolenzimento/carico), separato dal diario
  // di recupero: esiste anche per chi non ha nessun infortunio attivo, perché serve a
  // prevenire — non solo a monitorare un infortunio già in corso. Le risposte grezze
  // restano SEMPRE solo su questo dispositivo (vedi computeWellnessRisk più sotto):
  // alla squadra arriva solo un livello sintetico calcolato, mai i singoli valori.
  const [wellnessCheckins, setWellnessCheckins] = useState({});
  // Storico locale degli screening del movimento (squat/equilibrio, vedi MovementCameraOverlay
  // più sopra): SOLO su questo dispositivo. A differenza del check-in di benessere, qui non
  // c'è alcuna sincronizzazione — nemmeno un segnale riassuntivo — perché non esiste una
  // squadra/staff a cui servirebbe vederlo: resta un'analisi personale, punto.
  const [movementScreenings, setMovementScreenings] = useState([]);
  const [movementActive, setMovementActive] = useState(null); // null | 'squat' | 'balance'
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [editingSetup, setEditingSetup] = useState(false);
  const [setupSection, setSetupSection] = useState('gravita');
  const [injuryRecurrence, setInjuryRecurrence] = useState({});
  const [trackerSection, setTrackerSection] = useState('esercizi');
  const [physioSearch, setPhysioSearch] = useState('');
  const [restoreEmail, setRestoreEmail] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('idle');
  const [showRestoreBox, setShowRestoreBox] = useState(false);
  const [pendingDate, setPendingDate] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  // Quando l'utente ha accettato l'avviso della copertina. Salvato, così chi torna atterra
  // direttamente sulla sua Home invece di dover rispuntare l'avviso a ogni apertura.
  const [disclaimerAcceptedAt, setDisclaimerAcceptedAt] = useState(null);
  // Festeggiamento dopo aver segnato la sessione di oggi (null quando non è visibile).
  const [celebration, setCelebration] = useState(null);
  const [language, setLanguage] = useState('it');
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [userProfile, setUserProfile] = useState({ age: '', weight: '', height: '', sex: '', level: '' });
  const [onboardingProfileDone, setOnboardingProfileDone] = useState(false);
  const [cookieChoice, setCookieChoice] = useState(() => {
    try { return localStorage.getItem(COOKIE_CONSENT_KEY); } catch (err) { return null; }
  });
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
  const swellingOptions = isEN ? swellingOptionsEN : swellingOptionsIT;
  const regionLabels = isEN ? regionLabelsEN : regionLabelsIT;
  const [shareCopied, setShareCopied] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingTeamRevoke, setConfirmingTeamRevoke] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [regionsTab, setRegionsTab] = useState('injury');
  const [premiumTab, setPremiumTab] = useState('individual'); // 'individual' | 'team'
  const [expandedPrevention, setExpandedPrevention] = useState(null);
  const [preventionProgress, setPreventionProgress] = useState({});
  const [warmupLog, setWarmupLog] = useState([]); // giorni (YYYY-MM-DD) in cui è stato fatto il riscaldamento preventivo
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [expandedPreventionTip, setExpandedPreventionTip] = useState(null);
  const [expandedSymptoms, setExpandedSymptoms] = useState(null);

  // --- Offside Squadre: stato del responsabile (fisio/preparatore) ---
  const [teamAuth, setTeamAuth] = useState(null); // { token, teamId, teamName, responsibleName, responsibleRole, inviteCode, subscriptionActive }
  const [teamForm, setTeamForm] = useState({ teamName: '', responsibleName: '', responsibleRole: 'fisioterapista', email: '', password: '', confirmPassword: '', minorConsentAttested: false });
  const [teamFormStatus, setTeamFormStatus] = useState('idle'); // idle | submitting | error
  const [teamFormError, setTeamFormError] = useState('');
  const [showTeamPassword, setShowTeamPassword] = useState(false);
  const [teamDashboardData, setTeamDashboardData] = useState(null);
  const [teamDashboardLoading, setTeamDashboardLoading] = useState(false);
  const [teamInviteCopied, setTeamInviteCopied] = useState(false);

  // --- Offside Squadre: stato del giocatore che aderisce a una squadra ---
  const [myTeamMembership, setMyTeamMembership] = useState(null); // { playerId, teamId, teamName, playerName, consentedAt }
  const [showJoinTeamBox, setShowJoinTeamBox] = useState(false);
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [joinTeamPlayerName, setJoinTeamPlayerName] = useState('');
  const [joinTeamConsent, setJoinTeamConsent] = useState(false);
  const [joinTeamStatus, setJoinTeamStatus] = useState('idle'); // idle | submitting | error | notfound

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
          setWellnessCheckins(loaded.wellnessCheckins || {});
          setMovementScreenings(loaded.movementScreenings || []);
          setPlayerPosition(loaded.playerPosition || null);
          setPreventionProgress(loaded.preventionProgress || {});
          setWarmupLog(Array.isArray(loaded.warmupLog) ? loaded.warmupLog : []);
          setLanguage(loaded.language || 'it');
          setPremiumUnlocked(!!loaded.premiumUnlocked);
          setCriteriaChecked(loaded.criteriaChecked || {});
          setInstallDismissed(!!loaded.installDismissed);
          setUserProfile(loaded.userProfile || { age: '', weight: '', height: '', sex: '', level: '' });
          setOnboardingProfileDone(!!loaded.onboardingProfileDone);
          setInjuryRecurrence(loaded.injuryRecurrence || {});
          setTeamAuth(loaded.teamAuth || null);
          setMyTeamMembership(loaded.myTeamMembership || null);
          if (loaded.disclaimerAcceptedAt) {
            setDisclaimerAcceptedAt(loaded.disclaimerAcceptedAt);
            setDisclaimerAccepted(true);
            // Chi torna va dritto alla sua Home. Solo se nessun link (es. un invito) ha già
            // portato l'app su un'altra schermata.
            if (loaded.onboardingProfileDone) setScreen((s) => (s === 'cover' ? 'regions' : s));
          }
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

      // Ritorno da un pagamento Squadre riuscito (mensile o Pass Stagionale): torna dritti alla
      // dashboard, che si aggiorna da sola non appena "screen" e "teamAuth" sono pronti (vedi
      // l'useEffect più sotto che chiama loadTeamDashboard quando entrambi sono impostati).
      if (params.get('team') === 'activated' && loaded.teamAuth) {
        trackEvent('team_payment_redirect');
        setScreen('teamDashboard');
        params.delete('team');
        const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '') + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
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

  // Ogni cambio di schermata parte dall'alto: senza questo, lo scroll della schermata
  // precedente resta invariato e si "eredita" su quella nuova (es. entrare nel tracker
  // già a metà pagina se prima si era scrollato in basso in Home).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // Sincronizza la scelta cookie con Google Consent Mode: in index.html il consenso
  // di default è "denied", quindi ad ogni caricamento riapplichiamo la scelta salvata
  // (se l'utente aveva già accettato/rifiutato in una visita precedente).
  useEffect(() => {
    if (!cookieChoice) return;
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: cookieChoice === 'granted' ? 'granted' : 'denied' });
    }
  }, [cookieChoice]);

  const handleCookieChoice = (accepted) => {
    const value = accepted ? 'granted' : 'denied';
    try { localStorage.setItem(COOKIE_CONSENT_KEY, value); } catch (err) {}
    setCookieChoice(value);
    if (accepted) trackEvent('cookie_consent_granted');
  };

  const persist = useCallback(async (next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (err) {
      setSaveError(true);
    }
  }, []);

  const snapshot = (overrides = {}) => ({ selectedInjury, activePhase, progress, injuryDates, injurySeverities, dailyLog, wellnessCheckins, movementScreenings, playerPosition, preventionProgress, warmupLog, language, premiumUnlocked, criteriaChecked, installDismissed, userProfile, onboardingProfileDone, injuryRecurrence, teamAuth, myTeamMembership, disclaimerAcceptedAt, ...overrides });

  // Salva un nuovo screening del movimento nello storico locale (max 20, i più vecchi cadono).
  // Non tocca mai la rete: né qui né altrove per questa funzione, coerentemente con il fatto
  // che l'intero screening gira sul dispositivo (vedi commento sopra MovementCameraOverlay).
  const saveMovementResult = (test, result) => {
    const entry = { id: `${Date.now()}`, date: toISODate(new Date()), test, result };
    const nextList = [entry, ...movementScreenings].slice(0, 20);
    setMovementScreenings(nextList);
    persist(snapshot({ movementScreenings: nextList }));
    trackEvent('movement_screening_completed', { test, level: result.level });
  };

  const goBack = () => {
    if (screen === 'tracker') setScreen('injuries');
    else if (screen === 'injuries') { setScreen('regions'); setSelectedRegion(null); setTriageTag(null); }
    else if (screen === 'triage') setScreen('regions');
    else if (screen === 'triageResults') setScreen('triage');
    else if (screen === 'firstaid') setScreen('regions');
    else if (screen === 'premium') setScreen('tracker');
    else if (screen === 'movementScreen') { setScreen('regions'); setRegionsTab('prevention'); }
    else if (screen === 'profile') setScreen('regions');
    else if (screen === 'physios') setScreen('regions');
    else if (screen === 'teamRegister') setScreen('premium');
    else if (screen === 'teamLogin') setScreen('premium');
    else if (screen === 'teamDashboard') setScreen('premium');
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
    // Sempre snapshot completo: salvare solo questi campi cancellava dal telefono Premium,
    // squadra, lingua, onboarding e check-in a chiunque apriva un percorso e poi chiudeva l'app.
    persist(snapshot({ selectedInjury: key, activePhase: suggested }));
  };
  
  const startTriage = () => { setTriageAnswers({ mechanism: null, pop: null, weight: null, swelling: null }); setTriageRegion(null); setTriageTag(null); setTriageCandidateIndex(0); setScreen('triage'); };
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

  // --- Offside Squadre: giocatore che aderisce a una squadra ---
  const joinTeam = async () => {
    if (!joinTeamCode.trim() || !joinTeamPlayerName.trim() || !joinTeamConsent) { setJoinTeamStatus('error'); return; }
    setJoinTeamStatus('submitting');
    try {
      const res = await fetch('/api/team-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinTeamCode.trim(), playerName: joinTeamPlayerName.trim(), consent: true }),
      });
      const data = await res.json();
      if (res.ok && data.playerId) {
        const membership = { playerId: data.playerId, teamId: data.teamId, teamName: data.teamName, playerName: joinTeamPlayerName.trim(), consentedAt: new Date().toISOString() };
        setMyTeamMembership(membership);
        persist(snapshot({ myTeamMembership: membership }));
        trackEvent('team_joined');
        setJoinTeamStatus('idle');
        setJoinTeamCode(''); setJoinTeamPlayerName(''); setJoinTeamConsent(false); setShowJoinTeamBox(false);
      } else {
        setJoinTeamStatus('notfound');
      }
    } catch (err) {
      setJoinTeamStatus('error');
    }
  };

  const revokeTeamConsent = async () => {
    if (!myTeamMembership) return;
    const playerId = myTeamMembership.playerId;
    setMyTeamMembership(null);
    persist(snapshot({ myTeamMembership: null }));
    trackEvent('team_consent_revoked');
    try {
      await fetch('/api/team-player-revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    } catch (err) {}
  };

  // Tiene sincronizzato il riepilogo condiviso con la squadra (mai il diario) ogni volta
  // che qualcosa di rilevante cambia. Se il giocatore non ha aderito a nessuna squadra, non fa nulla.
  useEffect(() => {
    if (!myTeamMembership || !myTeamMembership.playerId) return;
    const syncTeamStatus = async () => {
      let statusPayload = null;
      const inj = selectedInjury ? injuriesData[selectedInjury] : null;
      if (inj) {
        const sev = injurySeverities[selectedInjury] || 'moderato';
        const sevData = inj.severityData ? inj.severityData[sev] : null;
        const date = injuryDates[selectedInjury];
        const dayOfRecovery = date ? daysSince(date) : null;
        const phaseIdx = (dayOfRecovery !== null && sevData) ? suggestPhase(dayOfRecovery, sevData.dayThresholds) : activePhase;
        statusPayload = {
          injuryLabel: inj.label,
          injuryKey: selectedInjury,
          phaseLabel: (inj.phases && inj.phases[phaseIdx]) ? inj.phases[phaseIdx].name : null,
          phaseIndex: phaseIdx,
          totalPhases: inj.phases ? inj.phases.length : null,
          dayOfRecovery,
          estimateDays: sevData ? sevData.totalEstimateDays : null,
          severity: sev,
          needsAttention: !!(dayOfRecovery !== null && sevData && dayOfRecovery > sevData.totalEstimateDays),
        };
      }
      // Solo il livello calcolato (verde/giallo/rosso/insufficiente) lascia il dispositivo:
      // le risposte del check-in restano in wellnessCheckins, mai incluse in questo payload.
      const wellnessPayload = computeWellnessRisk(wellnessCheckins);

      try {
        await fetch('/api/team-player-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: myTeamMembership.playerId, status: statusPayload, wellness: wellnessPayload }),
        });
      } catch (err) {
        // Sync silenzioso: se fallisce ora, riparte al prossimo cambiamento rilevante.
      }
    };
    syncTeamStatus();
  }, [myTeamMembership, selectedInjury, injurySeverities, injuryDates, wellnessCheckins]);

  // --- Offside Squadre: responsabile (fisio/preparatore) ---
  const submitTeamRegister = async () => {
    const f = teamForm;
    if (!f.teamName.trim() || !f.responsibleName.trim() || !f.email.includes('@') || f.password.length < 8) {
      setTeamFormStatus('error');
      setTeamFormError(isEN ? 'Fill in all fields (password: at least 8 characters).' : 'Compila tutti i campi (password: almeno 8 caratteri).');
      return;
    }
    if (f.password !== f.confirmPassword) {
      setTeamFormStatus('error');
      setTeamFormError(isEN ? "Passwords don't match." : 'Le due password non coincidono.');
      return;
    }
    if (!f.minorConsentAttested) {
      setTeamFormStatus('error');
      setTeamFormError(isEN ? 'You need to confirm the statement about minors to continue.' : 'Devi confermare la dichiarazione sui minorenni per continuare.');
      return;
    }
    setTeamFormStatus('submitting');
    try {
      const res = await fetch('/api/team-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: f.teamName.trim(), responsibleName: f.responsibleName.trim(), responsibleRole: f.responsibleRole,
          email: f.email.trim(), password: f.password, minorConsentAttested: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const auth = { token: data.token, teamId: data.teamId, teamName: data.teamName, responsibleName: f.responsibleName.trim(), responsibleRole: f.responsibleRole, email: f.email.trim(), inviteCode: data.inviteCode, subscriptionActive: false };
        setTeamAuth(auth);
        persist(snapshot({ teamAuth: auth }));
        trackEvent('team_registered');
        setTeamFormStatus('idle');
        setTeamForm({ teamName: '', responsibleName: '', responsibleRole: 'fisioterapista', email: '', password: '', confirmPassword: '', minorConsentAttested: false });
        setScreen('teamDashboard');
      } else {
        setTeamFormStatus('error');
        setTeamFormError(data.error || (isEN ? 'Something went wrong.' : 'Qualcosa è andato storto.'));
      }
    } catch (err) {
      setTeamFormStatus('error');
      setTeamFormError(isEN ? 'Something went wrong, try again.' : 'Qualcosa è andato storto, riprova.');
    }
  };

  const submitTeamLogin = async () => {
    const f = teamForm;
    if (!f.email.includes('@') || !f.password) {
      setTeamFormStatus('error');
      setTeamFormError(isEN ? 'Enter your email and password.' : 'Inserisci email e password.');
      return;
    }
    setTeamFormStatus('submitting');
    try {
      const res = await fetch('/api/team-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.trim(), password: f.password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        const auth = { token: data.token, teamId: data.teamId, teamName: data.teamName, responsibleName: data.responsibleName, responsibleRole: data.responsibleRole, email: f.email.trim(), inviteCode: data.inviteCode, subscriptionActive: !!data.subscriptionActive };
        setTeamAuth(auth);
        persist(snapshot({ teamAuth: auth }));
        setTeamFormStatus('idle');
        setTeamForm({ teamName: '', responsibleName: '', responsibleRole: 'fisioterapista', email: '', password: '', confirmPassword: '', minorConsentAttested: false });
        setScreen('teamDashboard');
      } else {
        setTeamFormStatus('error');
        setTeamFormError(data.error || (isEN ? 'Incorrect email or password.' : 'Email o password non corretti.'));
      }
    } catch (err) {
      setTeamFormStatus('error');
      setTeamFormError(isEN ? 'Something went wrong, try again.' : 'Qualcosa è andato storto, riprova.');
    }
  };

  const shareTeamInviteCode = async () => {
    if (!teamAuth) return;
    const text = isEN
      ? `Join our team on Offside to share your injury updates: code ${teamAuth.inviteCode} — offside.app`
      : `Unisciti alla nostra squadra su Offside per condividere gli aggiornamenti sui tuoi infortuni: codice ${teamAuth.inviteCode} — myoffside.com`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(teamAuth.inviteCode);
        setTeamInviteCopied(true);
        setTimeout(() => setTeamInviteCopied(false), 2000);
      }
    } catch (err) {}
  };

  const logoutTeam = () => {
    setTeamAuth(null);
    setTeamDashboardData(null);
    persist(snapshot({ teamAuth: null }));
    setScreen('premium');
  };

  const loadTeamDashboard = useCallback(async () => {
    if (!teamAuth || !teamAuth.token) return;
    setTeamDashboardLoading(true);
    try {
      const res = await fetch('/api/team-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: teamAuth.token }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeamDashboardData(data);
        if (data.subscriptionActive !== teamAuth.subscriptionActive) {
          const nextAuth = { ...teamAuth, subscriptionActive: data.subscriptionActive };
          setTeamAuth(nextAuth);
          persist(snapshot({ teamAuth: nextAuth }));
        }
      } else if (res.status === 401) {
        setTeamAuth(null);
        persist(snapshot({ teamAuth: null }));
        setScreen('teamLogin');
      }
    } catch (err) {
      // Sync silenzioso: la dashboard resta con i dati dell'ultimo caricamento riuscito.
    } finally {
      setTeamDashboardLoading(false);
    }
  }, [teamAuth]);

  useEffect(() => {
    if (screen === 'teamDashboard' && teamAuth) {
      loadTeamDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

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

  const toggleWarmupToday = () => {
    const today = localDayKey();
    const had = warmupLog.includes(today);
    const next = had ? warmupLog.filter((d) => d !== today) : [...warmupLog, today].sort().slice(-120);
    setWarmupLog(next);
    persist(snapshot({ warmupLog: next }));
    if (!had) {
      trackEvent('warmup_done');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(30);
    }
  };

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
    if (willBeDone) {
      setCelebration({ streak: computeStreak(nextForInjury).count });
      try { if (navigator.vibrate) navigator.vibrate([30, 40, 70]); } catch (err) {}
      setTimeout(() => setCelebration(null), 2600);
    }
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

  // Aggiorna la risposta di oggi per un campo del check-in di benessere (sonno/soreness/carico).
  // Un solo check-in al giorno: se richiami di nuovo lo stesso giorno, sovrascrive quello di oggi.
  const setTodayWellness = (field, value) => {
    const today = todayKey();
    const current = wellnessCheckins[today] || {};
    const nextEntry = { ...current, [field]: value };
    // Tiene solo le ultime 28 giornate: basta e avanza per il calcolo del segnale settimanale,
    // e non serve accumulare mesi di dati grezzi solo sul dispositivo.
    const dates = Object.keys(wellnessCheckins).sort();
    const nextLog = { ...wellnessCheckins, [today]: nextEntry };
    while (Object.keys(nextLog).length > 28) delete nextLog[dates.shift()];
    setWellnessCheckins(nextLog);
    persist(snapshot({ wellnessCheckins: nextLog }));
    trackEvent('wellness_checkin_field', { field });
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
    persist(snapshot({ selectedInjury: nextSelected, progress: nextProgress, injuryDates: nextDates, dailyLog: nextLog }));
  };

  const answerTriage = (field, value) => { setTriageAnswers({ ...triageAnswers, [field]: value }); setTriageCandidateIndex(0); };
  const triageComplete = triageRegion && triageAnswers.mechanism && triageAnswers.pop && triageAnswers.weight && triageAnswers.swelling;
  const triageRedirect = triageAnswers.weight === 'fatica' || (triageAnswers.pop === 'si' && triageAnswers.mechanism === 'torsione');
  const triageMechanismTagMap = { contatto: 'contact', sovraccarico: 'overuse', torsione: 'acute' };
  const computeTriageScore = (injuryKey) => {
    const profile = triageProfiles[injuryKey];
    const data = injuriesData[injuryKey];
    if (!profile || !data) return 0;
    let score = 0;
    if (data.mechanismTags.includes(triageMechanismTagMap[triageAnswers.mechanism])) score += 2;
    if ((triageAnswers.pop === 'si') === profile.pop) score += 1;
    if (triageAnswers.weight === profile.weight) score += 1;
    if (triageAnswers.swelling !== 'nonso' && (triageAnswers.swelling === 'si') === profile.swelling) score += 1;
    return score;
  };
  const triageResults = triageRegion && regions[triageRegion]
    ? [...regions[triageRegion].injuries].sort((a, b) => computeTriageScore(b) - computeTriageScore(a))
    : [];
  const finishTriage = () => {
    setTriageTag(triageMechanismTagMap[triageAnswers.mechanism]);
    setTriageCandidateIndex(0);
    setScreen('triageResults');
  };

  const displayFont = { fontFamily: "'Bricolage Grotesque', sans-serif" };
  const bodyFont = { fontFamily: "'Public Sans', sans-serif" };

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
      <div style={{ background: 'linear-gradient(160deg, #16283A 0%, #101B26 60%)', color: '#A9B7C4', fontFamily: "'Public Sans', sans-serif" }} className="w-full min-h-[100dvh] flex items-center justify-center">
        <p className="text-sm">{browserIsEN ? 'Loading your data…' : 'Carico i tuoi dati…'}</p>
      </div>
    );
  }

  const sharedStyle = `
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
    .os-focus:focus-visible { outline: 2px solid ${colors.accent}; outline-offset: 2px; }
    .os-tabular { font-variant-numeric: tabular-nums; }
    .os-fill { transition: width 0.4s ease; }
    input[type="date"].os-date { font-family: 'Public Sans', sans-serif; color-scheme: light; }
    @keyframes os-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .os-fadein { animation: os-fadein 0.25s ease-out; }
    @keyframes os-gol-backdrop { from { opacity: 0; } to { opacity: 1; } }
    .os-gol-backdrop { animation: os-gol-backdrop 0.2s ease-out; }
    @keyframes os-ball-shot { 0% { transform: translate(18px, 150px) scale(0.55) rotate(0deg); } 100% { transform: translate(112px, 66px) scale(1) rotate(300deg); } }
    .os-ball { animation: os-ball-shot 0.5s cubic-bezier(0.2, 0.75, 0.3, 1) both; }
    @keyframes os-net-shake { 0%, 100% { transform: translateY(0) scaleY(1); } 35% { transform: translateY(3px) scaleY(1.04); } 70% { transform: translateY(-1px) scaleY(0.99); } }
    .os-net { transform-origin: 110px 22px; animation: os-net-shake 0.45s ease-out 0.45s both; }
    @keyframes os-gol-pop { 0% { opacity: 0; transform: scale(0.35); } 60% { opacity: 1; transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
    .os-gol-text { display: inline-block; animation: os-gol-pop 0.5s cubic-bezier(0.2, 1.3, 0.4, 1) 0.35s both; }
    @keyframes os-playhead { 0%, 100% { box-shadow: 0 0 0 3px rgba(47,167,102,0.45), 0 0 10px rgba(47,167,102,0.9); } 50% { box-shadow: 0 0 0 6px rgba(47,167,102,0.15), 0 0 18px rgba(47,167,102,1); } }
    .os-playhead { animation: os-playhead 2.4s ease-in-out infinite; }
    @keyframes os-radar { 0% { transform: scale(0.15); opacity: 0.95; } 100% { transform: scale(1.5); opacity: 0; } }
    .os-radar-ring { transform-box: fill-box; transform-origin: center; animation: os-radar 0.6s ease-out both; }
    @keyframes os-breathe { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
    .os-breathe { animation: os-breathe 2.6s ease-in-out infinite; }
    @keyframes os-check-pop { 0% { transform: scale(0.6); } 55% { transform: scale(1.18); } 100% { transform: scale(1); } }
    .os-check-pop { animation: os-check-pop 0.35s cubic-bezier(0.2, 1.3, 0.4, 1) both; }
    @keyframes os-sheen { 0%, 62% { transform: translateX(-130%) skewX(-18deg); } 100% { transform: translateX(330%) skewX(-18deg); } }
    .os-sheen { position: absolute; top: 0; bottom: 0; left: 0; width: 40%; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.3), rgba(255,255,255,0)); transform: translateX(-130%); animation: os-sheen 4s ease-in-out infinite; pointer-events: none; }
    @keyframes os-live { 0%, 100% { box-shadow: 0 0 0 0 rgba(125,255,168,0.65); } 50% { box-shadow: 0 0 0 4px rgba(125,255,168,0); } }
    .os-live-dot { animation: os-live 1.8s ease-in-out infinite; }
    .os-gold-text { background: linear-gradient(180deg, #FFF3C9 0%, #F7D774 38%, #F0B429 66%, #B7800A 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
    @media (prefers-reduced-motion: reduce) { .os-sheen { display: none; } }
    .os-print-only { display: none; }
    @media print {
      body * { visibility: hidden; }
      .os-print-only, .os-print-only * { visibility: visible; }
      .os-print-only { display: block; position: absolute; top: 0; left: 0; width: 100%; padding: 24px; font-family: 'Public Sans', sans-serif; color: #101B26; }
      .os-print-only h1 { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; margin-bottom: 16px; }
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
                <p style={{ ...displayFont, color: colors.accentDark, letterSpacing: '0.16em' }} className="text-[11px] font-bold uppercase mb-2">{isEN ? 'For players and teams' : 'Per giocatori e squadre'}</p>
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
            onClick={() => {
              if (!disclaimerAccepted) return;
              trackEvent('disclaimer_accepted');
              const acceptedAt = disclaimerAcceptedAt || new Date().toISOString();
              setDisclaimerAcceptedAt(acceptedAt);
              persist(snapshot({ disclaimerAcceptedAt: acceptedAt }));
              setScreen(onboardingProfileDone ? 'regions' : 'onboarding');
            }}
            disabled={!disclaimerAccepted}
            style={{ backgroundColor: disclaimerAccepted ? colors.accent : colors.hairline, color: disclaimerAccepted ? '#FFFFFF' : colors.mutedInk }}
            className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium transition-colors shadow-sm"
          >
            <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Start your recovery' : 'Inizia il tuo percorso'}</span><ArrowRight size={16} />
          </button>

          <div className="text-center mt-3">{renderRestoreBox()}</div>
          <p className="text-center mt-4">
            <a href="/privacy.html" style={{ color: colors.mutedInk }} className="os-focus text-[11px] underline hover:opacity-70">
              {isEN ? 'Privacy Policy' : 'Informativa sulla Privacy'}
            </a>
          </p>
        </div>
        {!cookieChoice && <CookieBanner isEN={isEN} onChoice={handleCookieChoice} />}
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
        {!cookieChoice && <CookieBanner isEN={isEN} onChoice={handleCookieChoice} />}
      </div>
    );
  }

  const activeInjuryKeys = Object.keys(injuryDates).filter((k) => injuryDates[k] && injuriesData[k]);

  // Riepilogo disponibilità per la dashboard squadra: quanti giocatori disponibili / in dubbio / fuori.
  const teamAvailabilityCounts = (teamDashboardData && teamDashboardData.players)
    ? teamDashboardData.players.reduce((acc, p) => {
        acc[classifyPlayerAvailability(p)]++;
        return acc;
      }, { available: 0, doubtful: 0, out: 0 })
    : { available: 0, doubtful: 0, out: 0 };

  // Giocatori da segnalare allo staff per il check-in di benessere: rosso prima, poi giallo.
  const wellnessOrder = { rosso: 0, giallo: 1 };
  const wellnessToWatch = (teamDashboardData && teamDashboardData.players)
    ? teamDashboardData.players
        .filter((p) => p.wellness && (p.wellness.level === 'rosso' || p.wellness.level === 'giallo'))
        .sort((a, b) => wellnessOrder[a.wellness.level] - wellnessOrder[b.wellness.level])
    : [];

  const handleBottomNav = (key) => {
    if (key === 'regions') { setScreen('regions'); }
    else if (key === 'tracker') {
      if (activeInjuryKeys.length > 0) resumeInjury(activeInjuryKeys[0]);
      else { setRegionsTab('injury'); setScreen('regions'); }
    }
    else if (key === 'physios') { setScreen('physios'); }
    else if (key === 'premium') { setScreen('premium'); }
  };

  // Segnali d'allarme: sempre raggiungibili dove conta (percorso, infortuni, triage, primo
  // soccorso e Home di chi è in recupero), ma in una riga compatta invece che come primo
  // blocco rosso in maiuscolo in cima a ogni schermata.
  const RED_FLAG_SCREENS = ['tracker', 'injuries', 'triage', 'triageResults', 'firstaid'];
  const renderRedFlags = () => (
    <div style={{ backgroundColor: colors.redTint, border: `1px solid ${colors.red}22` }} className="rounded-xl overflow-hidden">
      <button onClick={() => setShowRedFlags(!showRedFlags)} className="os-focus w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left" aria-expanded={showRedFlags}>
        <span className="flex items-center gap-2">
          <AlertTriangle size={15} color={colors.red} strokeWidth={2.25} />
          <span style={{ ...displayFont, color: colors.red }} className="text-[13px] font-semibold">{isEN ? 'When to stop and call a professional' : 'Quando fermarti e chiamare un professionista'}</span>
        </span>
        <ChevronRight size={16} color={colors.red} style={{ transform: showRedFlags ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
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
  );

  // Dati per il protagonista della Home: il percorso aperto (o il primo attivo), con il minuto
  // della partita di recupero, i giorni al rientro stimato e la sessione di oggi.
  const heroKey = (selectedInjury && injuryDates[selectedInjury] && injuriesData[selectedInjury]) ? selectedInjury : (activeInjuryKeys[0] || null);
  const hero = heroKey ? (() => {
    const inj = injuriesData[heroKey];
    const sevData = inj.severityData[injurySeverities[heroKey] || 'moderato'];
    const dayNum = daysSince(injuryDates[heroKey]);
    const phaseIdx = suggestPhase(dayNum, sevData.dayThresholds);
    const rawMinute = Math.round((dayNum / sevData.totalEstimateDays) * 90);
    const bounds = [0, sevData.dayThresholds[0], sevData.dayThresholds[1], sevData.totalEstimateDays];
    const log = dailyLog[heroKey] || {};
    const todayLog = log[toISODate(new Date())] || {};
    const phaseExercises = (inj.phases[phaseIdx] && inj.phases[phaseIdx].exercises) || [];
    const phaseDone = progress[`${heroKey}-${phaseIdx}`] || {};
    return {
      key: heroKey, inj, dayNum, phaseIdx,
      minute: Math.min(rawMinute, 90), overtime: rawMinute > 90,
      segments: [0, 1, 2].map((i) => ({ span: bounds[i + 1] - bounds[i], fill: segmentFill(dayNum, bounds[i], bounds[i + 1]) })),
      daysLeft: sevData.totalEstimateDays - dayNum,
      doneToday: !!todayLog.done,
      streakCount: computeStreak(log).count,
      exDone: phaseExercises.filter((_, i) => phaseDone[i]).length,
      exTotal: phaseExercises.length,
    };
  })() : null;
  const otherActiveKeys = activeInjuryKeys.filter((k) => k !== heroKey);
  const preventionDoneCount = Object.values(preventionProgress || {}).reduce((sum, region) => sum + Object.values(region || {}).filter(Boolean).length, 0);
  const totalInjuryCount = Object.values(regions).reduce((sum, r) => sum + r.injuries.filter((k) => injuriesData[k]).length, 0);
  const preventionExtras = isEN ? preventionExtrasEN : preventionExtrasIT;
  const warmupRoutine = isEN ? warmupRoutineEN : warmupRoutineIT;
  const warmupExerciseCount = warmupRoutine.reduce((n, part) => n + part.exercises.length, 0);
  const warmupMinutes = warmupRoutine.reduce((n, part) => n + part.minutes, 0);
  const localToday = localDayKey();
  const weekDays = (() => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7), 12);
    const labels = isEN ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
    return labels.map((label, i) => {
      const iso = localDayKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12));
      return { label, iso, done: warmupLog.includes(iso), isToday: iso === localToday, future: iso > localToday };
    });
  })();
  const warmupWeekCount = weekDays.filter((d) => d.done).length;
  const warmupDoneToday = warmupLog.includes(localToday);
  const coveredRegions = Object.keys(preventionData).filter((k) => Object.values(preventionProgress[k] || {}).some(Boolean));
  const historyRegions = [...new Set(Object.keys(injuryDates).filter((k) => injuriesData[k]).map((k) => regionOfInjury(k, injuriesData)).filter(Boolean))];
  const recommendedRegions = (historyRegions.length ? historyRegions : ['thigh', 'hip_groin', 'knee', 'ankle_foot']).slice(0, 4);
  const seasonLabel = (() => { const d = new Date(); const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1; return `${y}/${String((y + 1) % 100).padStart(2, '0')}`; })();

  return (
    <div style={{ backgroundColor: colors.paper, ...bodyFont }} className="w-full min-h-[100dvh] relative">
      <style>{sharedStyle}</style>
      <svg className="fixed inset-0 w-full h-full opacity-[0.035] pointer-events-none" viewBox="0 0 400 800" fill="none" preserveAspectRatio="xMidYMid slice">
        <circle cx="200" cy="160" r="150" stroke={colors.accent} strokeWidth="1.5" />
        <line x1="-20" y1="160" x2="420" y2="160" stroke={colors.accent} strokeWidth="1.5" />
      </svg>

      <div style={{ borderBottom: `1px solid ${colors.hairline}` }} className="relative px-5 sm:px-8 pt-5 pb-4 flex items-center gap-3">
        {screen !== 'regions' && (
          <button onClick={goBack} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Go back' : 'Torna indietro'}>
            <ArrowLeft size={16} color={colors.accentDark} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <LogoMark size={13} color={colors.accentDark} strokeWidth={2.5} />
            <p style={{ ...displayFont, color: colors.accentDark, letterSpacing: '0.14em' }} className="text-[10px] font-semibold uppercase">
              {screen === 'regions' ? `Offside · ${formatTodayLabel(isEN)}` : 'Offside'}
            </p>
          </div>
          <h1 style={{ ...displayFont, color: colors.ink }} className="text-lg sm:text-xl font-semibold truncate">
            {screen === 'regions' ? (regionsTab === 'prevention' ? (isEN ? 'Prevention' : 'Prevenzione') : regionsTab === 'technique' ? (isEN ? 'Technique' : 'Tecnica') : (isEN ? 'Today' : 'Oggi')) : screen === 'triage' ? (isEN ? 'Not sure what it is?' : 'Non sai cosa hai?') : screen === 'triageResults' ? (isEN ? 'Most likely matches' : 'Probabilmente è questo') : screen === 'firstaid' ? (isEN ? 'First aid' : 'Primi soccorsi') : screen === 'premium' ? 'Premium' : screen === 'profile' ? (isEN ? 'Your profile' : 'Il tuo profilo') : screen === 'physios' ? (isEN ? 'Physiotherapists' : 'Fisioterapisti') : screen === 'movementScreen' ? (isEN ? 'Movement screening' : 'Screening del movimento') : screen === 'teamRegister' ? (isEN ? 'Register your team' : 'Registra la squadra') : screen === 'teamLogin' ? (isEN ? 'Team login' : 'Accedi alla squadra') : screen === 'teamDashboard' ? (teamAuth?.teamName || 'Offside Squadre') : screen === 'injuries' ? (selectedRegion && regionLabels[selectedRegion] ? regionLabels[selectedRegion] : (isEN ? 'Injuries' : 'Infortuni')) : (isEN ? 'Your recovery' : 'Il tuo percorso')}
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
        {screen !== 'profile' && !TEAM_SCREENS.includes(screen) && (
          <button onClick={() => setScreen('profile')} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Your profile' : 'Il tuo profilo'}>
            <User size={17} color={colors.accentDark} />
          </button>
        )}
        {screen === 'teamDashboard' && teamAuth && (
          <button onClick={logoutTeam} style={{ backgroundColor: colors.accentTint }} className="os-focus flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" aria-label={isEN ? 'Log out' : 'Esci'}>
            <LogOut size={16} color={colors.accentDark} />
          </button>
        )}
      </div>

      {RED_FLAG_SCREENS.includes(screen) && (
        <div className="px-5 sm:px-8 pt-5">{renderRedFlags()}</div>
      )}

      <div key={screen} className="px-5 sm:px-8 py-6 os-fadein">
        {screen === 'regions' && (
          <>
            {hero ? (
              <div className="mb-4">
                <div style={{ background: PITCH_BG }} className="rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <PitchArc size={190} />
                  <button
                    onClick={() => {
                      if (deletingKey === hero.key) deleteInjuryData(hero.key);
                      else { setDeletingKey(hero.key); setTimeout(() => setDeletingKey((k) => (k === hero.key ? null : k)), 3000); }
                    }}
                    style={{ backgroundColor: deletingKey === hero.key ? colors.red : 'rgba(255,255,255,0.1)' }}
                    className="os-focus absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all z-10"
                    aria-label={deletingKey === hero.key ? (isEN ? 'Confirm deletion' : 'Conferma eliminazione') : (isEN ? 'Delete this recovery' : 'Elimina questo percorso')}
                  >
                    <X size={14} color={deletingKey === hero.key ? '#FFFFFF' : colors.accent} />
                  </button>
                  <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.14em' }} className="relative text-[11px] font-bold uppercase mb-1 pr-10">
                    {isEN ? `Phase ${hero.phaseIdx + 1} of ${hero.inj.phases.length} · day ${hero.dayNum}` : `Fase ${hero.phaseIdx + 1} di ${hero.inj.phases.length} · giorno ${hero.dayNum}`}
                  </p>
                  <p style={{ ...displayFont, color: '#FFFFFF', letterSpacing: '-0.01em' }} className="relative text-lg font-bold uppercase leading-tight mb-4 pr-10 line-clamp-2">{hero.inj.label}</p>
                  <div className="relative">
                    <MatchClock minute={hero.minute} overtime={hero.overtime} segments={hero.segments} daysLeft={hero.daysLeft} isEN={isEN} />
                  </div>
                  {(hero.streakCount > 0 || hero.exTotal > 0) && (
                    <div className="relative flex flex-wrap items-center gap-2 mt-5">
                      {hero.streakCount > 0 && (
                        <span style={{ backgroundColor: 'rgba(255,217,160,0.14)', color: '#FFD9A0' }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold">
                          <Flame size={12} strokeWidth={2.5} />{isEN ? `${hero.streakCount}-session streak` : `${hero.streakCount} presenze di fila`}
                        </span>
                      )}
                      {hero.exTotal > 0 && (
                        <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }} className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold os-tabular">
                          {isEN ? `Phase exercises ${hero.exDone}/${hero.exTotal}` : `Esercizi della fase ${hero.exDone}/${hero.exTotal}`}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => resumeInjury(hero.key)}
                    style={{ backgroundColor: hero.doneToday ? 'rgba(125,255,168,0.12)' : colors.accent, color: hero.doneToday ? LED_GREEN : '#FFFFFF', border: hero.doneToday ? `1px solid ${LED_GREEN}55` : '1px solid transparent' }}
                    className="os-focus relative w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 mt-4 shadow-md hover:opacity-95 active:scale-[0.99] transition-all"
                  >
                    {hero.doneToday ? <CheckCircle2 size={18} strokeWidth={2.4} /> : <PlayCircle size={18} strokeWidth={2.2} />}
                    <span style={displayFont} className="text-sm font-bold uppercase tracking-wide">
                      {hero.doneToday ? (isEN ? "Today's session is in the net" : 'Sessione di oggi in rete') : (isEN ? "Today's session" : 'Allenamento di oggi')}
                    </span>
                  </button>
                  {hero.doneToday && (
                    <p style={{ color: 'rgba(255,255,255,0.6)' }} className="relative text-[11px] text-center mt-2">{isEN ? 'See you tomorrow: the clock keeps running.' : 'Ci vediamo domani: il cronometro va avanti.'}</p>
                  )}
                </div>
                {otherActiveKeys.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    <p style={{ ...displayFont, color: colors.mutedInk, letterSpacing: '0.08em' }} className="text-[11px] font-semibold uppercase">{isEN ? 'Other recoveries' : 'Altri percorsi'}</p>
                    {otherActiveKeys.map((key) => {
                      const inj = injuriesData[key];
                      const sevData = inj.severityData[injurySeverities[key] || 'moderato'];
                      const dayNum = daysSince(injuryDates[key]);
                      const raw = Math.round((dayNum / sevData.totalEstimateDays) * 90);
                      return (
                        <div key={key} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-2xl flex items-center gap-2 pl-4 pr-2 py-2.5 shadow-sm">
                          <button onClick={() => resumeInjury(key)} className="os-focus flex-1 min-w-0 flex items-center gap-3 text-left">
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", color: colors.accentDark }} className="text-[30px] leading-none os-tabular w-14 flex-shrink-0">{Math.min(raw, 90)}{raw > 90 ? '+' : ''}'</span>
                            <span className="min-w-0">
                              <span style={{ ...displayFont, color: colors.ink }} className="block text-sm font-semibold truncate">{inj.label}</span>
                              <span style={{ color: colors.mutedInk }} className="block text-[11px]">{isEN ? `Day ${dayNum}` : `Giorno ${dayNum}`}</span>
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              if (deletingKey === key) deleteInjuryData(key);
                              else { setDeletingKey(key); setTimeout(() => setDeletingKey((k) => (k === key ? null : k)), 3000); }
                            }}
                            style={{ backgroundColor: deletingKey === key ? colors.red : colors.paper }}
                            className="os-focus flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all"
                            aria-label={deletingKey === key ? (isEN ? 'Confirm deletion' : 'Conferma eliminazione') : (isEN ? 'Delete this recovery' : 'Elimina questo percorso')}
                          >
                            <X size={14} color={deletingKey === key ? '#FFFFFF' : colors.mutedInk} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-3">{renderRedFlags()}</div>
              </div>
            ) : (selectedInjury && injuriesData[selectedInjury] && !injuryDates[selectedInjury]) ? (
              <div style={{ background: PITCH_BG }} className="rounded-3xl p-5 mb-4 shadow-lg relative overflow-hidden">
                <PitchArc size={190} />
                <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.14em' }} className="relative text-[11px] font-bold uppercase mb-1">{isEN ? 'Recovery to start' : 'Percorso da avviare'}</p>
                <p style={{ ...displayFont, color: '#FFFFFF' }} className="relative text-lg font-bold uppercase leading-tight mb-2">{injuriesData[selectedInjury].label}</p>
                <p style={{ color: 'rgba(255,255,255,0.75)' }} className="relative text-sm leading-relaxed">{isEN ? 'Add the date you got hurt to start the clock of your recovery.' : 'Aggiungi la data dell\'infortunio per far partire il cronometro del tuo recupero.'}</p>
                <button onClick={() => chooseInjury(selectedInjury)} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus relative w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 mt-4 shadow-md hover:opacity-95 active:scale-[0.99] transition-all">
                  <Timer size={18} strokeWidth={2.2} />
                  <span style={displayFont} className="text-sm font-bold uppercase tracking-wide">{isEN ? 'Start the clock' : 'Avvia il cronometro'}</span>
                </button>
              </div>
            ) : (
              <div style={{ background: PITCH_BG }} className="rounded-3xl p-5 mb-4 shadow-lg relative overflow-hidden">
                <PitchArc size={190} />
                <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.14em' }} className="relative text-[11px] font-bold uppercase mb-2">{isEN ? `Season ${seasonLabel}` : `Stagione ${seasonLabel}`}</p>
                <p style={{ fontFamily: "'Bebas Neue', sans-serif", color: '#FFFFFF' }} className="relative text-[64px] leading-[0.85]">{isEN ? 'On the pitch' : 'In campo'}</p>
                <p style={{ color: 'rgba(255,255,255,0.75)' }} className="relative text-sm leading-relaxed mt-2">
                  {isEN ? 'No active injury. Keep it that way: a few minutes of prevention are enough.' : 'Nessun infortunio in corso. Tienilo così: bastano pochi minuti di prevenzione.'}
                </p>
                <div className="relative flex flex-wrap gap-1.5 mt-3">
                  <span style={{ backgroundColor: 'rgba(125,255,168,0.12)', color: LED_GREEN }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold os-tabular">
                    <Flame size={12} strokeWidth={2.5} />{warmupWeekCount >= 2 ? (isEN ? `Warm-up: weekly goal reached (${warmupWeekCount})` : `Riscaldamento: obiettivo settimana raggiunto (${warmupWeekCount})`) : (isEN ? `Warm-up: ${warmupWeekCount}/2 this week` : `Riscaldamento: ${warmupWeekCount}/2 questa settimana`)}
                  </span>
                  {coveredRegions.length > 0 && (
                    <span style={{ backgroundColor: 'rgba(125,255,168,0.12)', color: LED_GREEN }} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold os-tabular">
                      <ShieldCheck size={12} strokeWidth={2.5} />{isEN ? `${coveredRegions.length}/8 areas trained` : `${coveredRegions.length}/8 zone allenate`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setRegionsTab('prevention'); setTimeout(() => scrollToId('prev-warmup'), 120); }}
                  style={{ backgroundColor: colors.accent, color: '#FFFFFF' }}
                  className="os-focus relative w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 mt-4 shadow-md hover:opacity-95 active:scale-[0.99] transition-all"
                >
                  <ShieldCheck size={18} strokeWidth={2.2} />
                  <span style={displayFont} className="text-sm font-bold uppercase tracking-wide">{isEN ? "Today's prevention" : 'Prevenzione di oggi'}</span>
                </button>
              </div>
            )}

            {!installDismissed && !(typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) && (
              <InstallBanner
                isEN={isEN}
                canInstall={!!installPromptEvent}
                onInstallClick={async () => { if (installPromptEvent) { installPromptEvent.prompt(); await installPromptEvent.userChoice; setInstallPromptEvent(null); } }}
                onDismiss={() => { setInstallDismissed(true); persist(snapshot({ installDismissed: true })); }}
              />
            )}

            {myTeamMembership && (() => {
              const todayW = wellnessCheckins[todayKey()] || {};
              const wellnessDone = !!(todayW.sleep && todayW.soreness && todayW.load);
              const sleepOptions = [
                { key: 'male', it: 'Male', en: 'Bad' },
                { key: 'cosi', it: 'Così così', en: 'So-so' },
                { key: 'bene', it: 'Bene', en: 'Good' },
              ];
              const sorenessOptions = [
                { key: 'poco', it: 'Per niente', en: 'Not at all' },
                { key: 'medio', it: 'Un po\'', en: 'A bit' },
                { key: 'molto', it: 'Molto', en: 'A lot' },
              ];
              const loadOptions = [
                { key: 'riposo', it: 'Riposo', en: 'Rest' },
                { key: 'leggero', it: 'Leggero', en: 'Light' },
                { key: 'normale', it: 'Normale', en: 'Normal' },
                { key: 'intenso', it: 'Intenso', en: 'Intense' },
              ];
              const wellnessRow = (label, field, options, activeColor) => (
                <div className="flex items-center gap-2">
                  <span style={{ color: colors.mutedInk }} className="text-[11px] font-medium flex-shrink-0 w-16">{label}</span>
                  <div className="flex-1 flex gap-1.5">
                    {options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setTodayWellness(field, opt.key)}
                        style={{ backgroundColor: todayW[field] === opt.key ? activeColor : colors.paper, color: todayW[field] === opt.key ? '#FFFFFF' : colors.ink }}
                        className="os-focus flex-1 py-1.5 rounded-lg text-[10.5px] font-medium transition-colors"
                      >
                        {isEN ? opt.en : opt.it}
                      </button>
                    ))}
                  </div>
                </div>
              );
              return (
                <div style={{ backgroundColor: wellnessDone ? colors.accentTint : colors.card, border: `1px solid ${wellnessDone ? colors.accent : colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Gauge size={14} color={wellnessDone ? colors.accentDark : colors.ink} />
                      <p style={{ ...displayFont, color: wellnessDone ? colors.accentDark : colors.ink }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? "Today's check-in" : 'Check-in di oggi'}</p>
                    </div>
                    {wellnessDone && <CheckCircle2 size={16} color={colors.accentDark} />}
                  </div>
                  <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mb-3">
                    {isEN
                      ? 'Half a minute, so your staff knows when it\'s worth checking in with you. Only a summary signal is ever shared — never your answers.'
                      : 'Mezzo minuto, così il tuo staff sa quando vale la pena chiederti come stai. Viene condiviso solo un segnale riassuntivo — mai le tue risposte.'}
                  </p>
                  <div className="space-y-2.5">
                    {wellnessRow(isEN ? 'Sleep' : 'Sonno', 'sleep', sleepOptions, colors.accent)}
                    {wellnessRow(isEN ? 'Soreness' : 'Dolori', 'soreness', sorenessOptions, colors.orange)}
                    {wellnessRow(isEN ? 'Session' : 'Sessione', 'load', loadOptions, colors.preventionDark)}
                  </div>
                  <p style={{ color: colors.mutedInk }} className="text-[10px] leading-relaxed mt-2.5">
                    {isEN ? '"Session" = your most recent training or match, whenever it was.' : '"Sessione" = il tuo ultimo allenamento o partita, qualunque giorno sia stato.'}
                  </p>
                </div>
              );
            })()}

            <div id="home-tabs" role="tablist" aria-label={isEN ? 'App sections' : 'Sezioni dell\'app'} style={{ backgroundColor: colors.laneBg }} className="grid grid-cols-3 gap-1 p-1 rounded-2xl mb-6 scroll-mt-4">
              {[
                { key: 'injury', icon: Snowflake, label: isEN ? 'Injury' : 'Infortunio', sub: isEN ? 'to recover' : 'per recuperare', color: colors.accentDark },
                { key: 'prevention', icon: ShieldCheck, label: isEN ? 'Prevention' : 'Prevenzione', sub: isEN ? 'to stay fit' : 'per non farti male', color: colors.preventionDark },
                { key: 'technique', icon: SoccerBall, label: isEN ? 'Technique' : 'Tecnica', sub: isEN ? 'for your role' : 'per il tuo ruolo', color: '#8A5A00', lock: !premiumUnlocked },
              ].map((tab) => {
                const on = regionsTab === tab.key;
                return (
                  <button key={tab.key} role="tab" aria-selected={on} onClick={() => setRegionsTab(tab.key)} style={{ backgroundColor: on ? colors.card : 'transparent', boxShadow: on ? '0 1px 3px rgba(16,27,38,0.14)' : 'none' }} className="os-focus flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1 transition-colors">
                    <span style={{ color: on ? tab.color : colors.mutedInk }} className="flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wide">{tab.lock && <Lock size={10} />}<tab.icon size={14} />{tab.label}</span>
                    <span style={{ color: on ? colors.ink : colors.mutedInk }} className="text-[10px] leading-tight opacity-80">{tab.sub}</span>
                  </button>
                );
              })}
            </div>

            {regionsTab === 'injury' ? (
              <>
                <button onClick={() => setScreen('firstaid')} style={{ backgroundColor: colors.accent }} className="os-focus w-full flex items-center gap-3 px-4 py-4 rounded-xl text-left mb-6 hover:opacity-90 transition-opacity shadow-sm">
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"><Snowflake size={20} color="#FFFFFF" /></div>
                  <div className="flex-1">
                    <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-sm font-medium">{isEN ? 'Just got hurt?' : 'Ti sei appena fatto male?'}</p>
                    <p style={{ color: colors.ink, fontWeight: 500 }} className="text-xs opacity-80">{isEN ? 'What to do in the first few minutes' : 'Cosa fare nei primi minuti'}</p>
                  </div>
                  <ChevronRight size={18} color={colors.ink} className="opacity-60" />
                </button>

                <SectionTitle kicker={isEN ? 'Your recovery' : 'Il tuo recupero'} title={isEN ? 'Find your injury' : 'Trova il tuo infortunio'} hint={isEN ? 'Four steps to a phase-by-phase plan.' : 'Quattro tappe per avere un percorso fase per fase.'} />
                <FlowSteps current={0} isEN={isEN} />
                <div className="mb-4">
                  <BodyDiagram
                    onSelectRegion={openRegion}
                    labels={regionLabels}
                    isEN={isEN}
                    title={isEN ? 'Tap where it hurts' : 'Tocca dove ti fa male'}
                    caption={isEN ? `${Object.keys(regions).length} areas · ${totalInjuryCount} injuries` : `${Object.keys(regions).length} zone · ${totalInjuryCount} infortuni`}
                  />
                </div>

                <button onClick={startTriage} style={{ backgroundColor: colors.card, border: `1.5px dashed ${colors.hairline}` }} className="os-focus w-full flex items-center gap-3 rounded-2xl p-4 mb-6 text-left hover:border-green-300 transition-colors">
                  <div style={{ backgroundColor: colors.accentTint }} className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center">
                    <HelpCircle size={20} color={colors.accentDark} />
                  </div>
                  <div className="flex-1">
                    <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: colors.ink }} className="text-sm font-semibold">{isEN ? 'Not sure what it is?' : 'Non sai cosa hai?'}</p>
                    <p style={{ color: colors.mutedInk }} className="text-xs">{isEN ? 'Answer 4 fixed questions, ranked by likelihood' : 'Rispondi a 4 domande fisse, ordinate per probabilità'}</p>
                  </div>
                  <ChevronRight size={18} color={colors.mutedInk} className="flex-shrink-0" />
                </button>

                <p style={{ ...displayFont, color: colors.ink, letterSpacing: '0.1em' }} className="text-xs font-semibold uppercase mb-3">{isEN ? 'Or choose the area' : 'Oppure scegli il distretto'}</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {Object.entries(regions).map(([key, data]) => {
                    const count = data.injuries.filter((k) => injuriesData[k]).length;
                    const live = activeInjuryKeys.some((k) => data.injuries.includes(k));
                    return (
                      <button key={key} onClick={() => openRegion(key)} style={{ backgroundColor: colors.card, border: `1px solid ${live ? colors.accent + '88' : colors.hairline}` }} className="os-focus flex flex-col overflow-hidden rounded-2xl text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
                        <div style={{ background: PITCH_BG }} className="relative h-[92px] flex-shrink-0 flex items-center justify-between pl-5 pr-3.5">
                          <RegionFigure region={key} height={80} />
                          <div className={`text-right ${live ? 'self-end pb-2' : ''}`}>
                            <p style={{ fontFamily: BEBAS, color: '#FFFFFF' }} className="text-[34px] leading-none os-tabular">{count}</p>
                            <p style={{ fontFamily: BRICOLAGE, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em' }} className="text-[9px] font-bold uppercase mt-0.5">{count === 1 ? (isEN ? 'injury' : 'infortunio') : (isEN ? 'injuries' : 'infortuni')}</p>
                          </div>
                          {live && (
                            <span style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: LED_GREEN, fontFamily: BEBAS, letterSpacing: '0.06em' }} className="absolute top-2 right-2 flex items-center gap-1 rounded px-1.5 py-1 text-[11px] leading-none">
                              <span style={{ backgroundColor: LED_GREEN }} className="w-1.5 h-1.5 rounded-full os-live-dot" />{isEN ? 'In progress' : 'In corso'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-1.5 px-3.5 py-3">
                          <p style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="text-[13.5px] font-bold leading-tight">{regionLabels[key]}</p>
                          <ChevronRight size={14} color={colors.mutedInk} className="flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : regionsTab === 'prevention' ? (
              <>
                {selectedInjury && injuriesData[selectedInjury] && (
                  <button onClick={() => resumeInjury(selectedInjury)} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-left shadow-sm hover:opacity-90 transition-opacity">
                    <ArrowLeft size={15} color={colors.accentDark} className="flex-shrink-0" />
                    <span style={{ color: colors.accentDark }} className="text-sm font-medium">{isEN ? `Back to ${injuriesData[selectedInjury].label}` : `Torna a ${injuriesData[selectedInjury].label}`}</span>
                  </button>
                )}
                <SectionTitle tone="teal" kicker={isEN ? 'Prevention' : 'Prevenzione'} title={isEN ? 'Train so you don\'t get hurt' : 'Allenati per non farti male'} hint={isEN ? 'The best time to work on an injury is before it happens: nothing needs to hurt.' : 'Il momento migliore per lavorare su un infortunio è prima che succeda: non serve avere nulla che fa male.'} />
                <SectionNav
                  isEN={isEN}
                  tone="teal"
                  items={[
                    { id: 'warmup', icon: Flame, label: isEN ? 'Warm-up' : 'Riscaldamento', badge: warmupWeekCount >= 2 ? '✓' : `${warmupWeekCount}/2`, onClick: () => scrollToId('prev-warmup') },
                    { id: 'foryou', icon: Target, label: isEN ? 'For you' : 'Per te', onClick: () => scrollToId('prev-foryou') },
                    { id: 'zones', icon: ShieldCheck, label: isEN ? 'Areas' : 'Zone', badge: `${coveredRegions.length}/${Object.keys(preventionData).length}`, onClick: () => scrollToId('prev-zones') },
                  ]}
                />

                <SectionTitle id="prev-warmup" className="mt-7" tone="teal" kicker={isEN ? 'Before you play' : 'Prima di giocare'} title={isEN ? 'Preventive warm-up' : 'Riscaldamento preventivo'} hint={isEN ? `${warmupMinutes} minutes before training and matches. Do it at least twice a week: it works on several areas at once.` : `${warmupMinutes} minuti prima di allenamento e partita. Fallo almeno 2 volte a settimana: lavora su più zone insieme.`} />
                <div style={{ background: PITCH_BG_TEAL }} className="relative overflow-hidden rounded-3xl p-5 mb-3 shadow-lg">
                  <PitchArc size={190} />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p style={{ fontFamily: BRICOLAGE, color: LED_TEAL, letterSpacing: '0.14em' }} className="text-[10px] font-bold uppercase mb-1">{isEN ? 'Your week' : 'La tua settimana'}</p>
                      <p style={{ fontFamily: BEBAS, color: '#FFFFFF' }} className="text-[40px] leading-[0.85] os-tabular">{warmupWeekCount}<span style={{ color: 'rgba(255,255,255,0.45)' }} className="text-[24px]"> {isEN ? (warmupWeekCount === 1 ? 'session' : 'sessions') : (warmupWeekCount === 1 ? 'sessione' : 'sessioni')}</span></p>
                      <p style={{ color: 'rgba(255,255,255,0.7)' }} className="text-xs mt-1.5">{warmupWeekCount >= 2 ? (isEN ? 'Weekly goal reached. Keep it up.' : 'Obiettivo della settimana raggiunto. Continua così.') : (isEN ? `Goal: at least 2 a week (${2 - warmupWeekCount} to go)` : `Obiettivo: almeno 2 a settimana (ne mancano ${2 - warmupWeekCount})`)}</p>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }} className="flex-shrink-0 rounded-xl px-3 py-2 text-center">
                      <p style={{ fontFamily: BEBAS, color: LED_TEAL, textShadow: `0 0 10px ${LED_TEAL}88` }} className="text-[26px] leading-none os-tabular">{coveredRegions.length}/{Object.keys(preventionData).length}</p>
                      <p style={{ fontFamily: BRICOLAGE, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em' }} className="text-[9px] font-bold uppercase mt-1">{isEN ? 'Areas trained' : 'Zone allenate'}</p>
                    </div>
                  </div>
                  <div className="relative grid grid-cols-7 gap-1.5 mt-4" role="img" aria-label={isEN ? `Warm-ups this week: ${warmupWeekCount}` : `Riscaldamenti questa settimana: ${warmupWeekCount}`}>
                    {weekDays.map((d) => (
                      <div key={d.iso} className="flex flex-col items-center gap-1">
                        <span style={{ backgroundColor: d.done ? LED_TEAL : 'rgba(255,255,255,0.08)', border: d.isToday ? `2px solid ${d.done ? LED_TEAL : 'rgba(255,255,255,0.6)'}` : '2px solid transparent', boxShadow: d.done ? `0 0 12px ${LED_TEAL}88` : 'none', opacity: d.future ? 0.45 : 1 }} className="w-full aspect-square max-w-[34px] rounded-lg flex items-center justify-center">
                          {d.done && <Check size={14} color="#06282D" />}
                        </span>
                        <span style={{ fontFamily: BRICOLAGE, color: d.isToday ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }} className="text-[10px] font-bold">{d.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="relative flex gap-2 mt-4">
                    <button onClick={toggleWarmupToday} aria-pressed={warmupDoneToday} style={{ backgroundColor: warmupDoneToday ? LED_TEAL : colors.prevention, color: warmupDoneToday ? '#06282D' : '#FFFFFF' }} className="os-focus flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold uppercase tracking-wide shadow-md active:scale-[0.98] transition">
                      {warmupDoneToday ? <><Check size={16} className="os-check-pop" />{isEN ? 'Done today' : 'Fatto oggi'}</> : <><Flame size={16} />{isEN ? 'Mark today as done' : 'Segna fatto oggi'}</>}
                    </button>
                    <button onClick={() => setWarmupOpen(!warmupOpen)} aria-expanded={warmupOpen} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }} className="os-focus flex-shrink-0 flex items-center gap-1 rounded-xl px-3.5 py-3 text-xs font-semibold hover:bg-white/20 transition-colors">
                      {warmupOpen ? (isEN ? 'Hide' : 'Chiudi') : (isEN ? 'Exercises' : 'Esercizi')}<ChevronDown size={13} style={{ transform: warmupOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                    </button>
                  </div>
                </div>
                {warmupOpen && (
                  <div className="os-fadein mb-3">
                    {warmupRoutine.map((part, pi) => (
                      <div key={part.part} className="mb-4">
                        <div className="flex items-center justify-between gap-2 mb-2 px-1">
                          <p style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="flex items-center gap-2 text-sm font-bold">
                            <span style={{ backgroundColor: '#06282D', color: LED_TEAL, fontFamily: BEBAS }} className="w-6 h-6 rounded-full flex items-center justify-center text-[14px] leading-none">{pi + 1}</span>{part.part}
                          </p>
                          <span style={{ color: colors.mutedInk }} className="text-[11px] font-semibold">~{part.minutes} min</span>
                        </div>
                        <div className="space-y-2">
                          {part.exercises.map((ex, i) => {
                            const wKey = `warmup-${pi}-${i}`;
                            const wOpen = expandedPreventionTip === wKey;
                            return (
                              <DrillCard key={wKey} index={warmupRoutine.slice(0, pi).reduce((n, p) => n + p.exercises.length, 0) + i} ex={ex} tone="teal" catLabel={catLabels[ex.cat]} helpOpen={wOpen} onToggleHelp={() => setExpandedPreventionTip(wOpen ? null : wKey)} isEN={isEN} />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed px-1">
                      {isEN ? `${warmupExerciseCount} exercises inspired by the preventive warm-ups studied in football, such as FIFA 11+. They work when done regularly: at least twice a week, all season long.` : `${warmupExerciseCount} esercizi ispirati ai riscaldamenti preventivi studiati nel calcio, come il FIFA 11+. Funzionano se fatti con costanza: almeno 2 volte a settimana, per tutta la stagione.`}
                    </p>
                  </div>
                )}

                <SectionTitle id="prev-foryou" className="mt-7" tone="teal" kicker={isEN ? 'For you' : 'Per te'} title={historyRegions.length ? (isEN ? 'So it doesn\'t happen again' : 'Per non ricaderci') : (isEN ? 'Where footballers get hurt most' : 'Dove i calciatori si fanno male di più')} hint={historyRegions.length ? (isEN ? 'Having been injured in an area raises the risk of it happening again: start here.' : 'Chi si è già fatto male in una zona ha più rischio di rifarselo: parti da qui.') : (isEN ? 'Thigh, groin, knee and ankle are the areas where footballers get injured most often.' : 'Coscia, inguine, ginocchio e caviglia sono le zone dove i calciatori si fanno male più spesso.')} />
                <div className="grid grid-cols-2 gap-2.5 mb-7">
                  {recommendedRegions.map((key) => {
                    const data = preventionData[key];
                    if (!data) return null;
                    const done = Object.values(preventionProgress[key] || {}).filter(Boolean).length;
                    return (
                      <button key={key} onClick={() => { setExpandedPrevention(key); setTimeout(() => scrollToId(`prevention-${key}`), 120); }} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus flex items-center gap-2.5 rounded-2xl p-2.5 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition">
                        <span style={{ background: PITCH_BG_TEAL }} className="flex-shrink-0 w-10 h-12 rounded-lg flex items-center justify-center"><RegionFigure region={key} tone="teal" height={42} /></span>
                        <span className="min-w-0">
                          <span style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="block text-[13px] font-bold leading-tight">{data.label}</span>
                          <span style={{ color: done ? colors.preventionDark : colors.mutedInk }} className="block text-[11px] font-semibold mt-0.5 os-tabular">{done}/{data.exercises.length} {isEN ? 'done' : 'fatti'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!premiumUnlocked ? (
                  <button onClick={() => { trackEvent('movement_screening_teaser_clicked'); setScreen('premium'); }} style={{ background: 'linear-gradient(120deg, #F9DD85, #8A6414 38%, #F0B429 70%, #6B4D0C)' }} className="os-focus relative w-full overflow-hidden rounded-3xl p-[1.5px] mb-6 text-left shadow-md hover:brightness-110 active:scale-[0.99] transition">
                    <div style={{ background: PREMIUM_BG }} className="relative overflow-hidden rounded-[22px] p-5">
                      <PitchArc size={170} />
                      <div className="relative flex items-center gap-2.5 mb-3">
                        <div style={{ background: GOLD_GRADIENT }} className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"><Camera size={19} color="#0B121A" /></div>
                        <span style={{ fontFamily: BEBAS, letterSpacing: '0.14em' }} className="os-gold-text text-[15px] leading-none">Premium</span>
                        <span style={{ border: '1px solid rgba(240,180,41,0.5)', color: colors.premiumGold }} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">Beta</span>
                      </div>
                      <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="relative text-[17px] font-bold mb-1.5">{isEN ? 'Movement screening' : 'Screening del movimento'}</p>
                      <p style={{ color: '#A9B7C4' }} className="relative text-sm leading-relaxed mb-4">{isEN ? 'Use your camera for a real-time look at squats and balance: symmetry, knee control, stability. It all runs on your phone.' : 'Usa la fotocamera per uno sguardo in tempo reale a squat ed equilibrio: simmetria, controllo del ginocchio, stabilità. Gira tutto sul telefono.'}</p>
                      <span style={{ background: GOLD_GRADIENT, color: '#0B121A', fontFamily: BRICOLAGE }} className="relative inline-flex items-center gap-1.5 overflow-hidden px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm">
                        <Lock size={12} />{isEN ? 'Unlock Premium' : 'Sblocca Premium'}<span className="os-sheen" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                ) : (
                  <button onClick={() => { trackEvent('movement_screening_opened'); setScreen('movementScreen'); }} style={{ backgroundColor: colors.card, border: `1.5px solid ${colors.prevention}45` }} className="os-focus w-full text-left rounded-2xl p-5 mb-6 shadow-sm hover:opacity-95 transition-opacity">
                    <div className="flex items-start gap-3.5">
                      <div style={{ backgroundColor: colors.preventionTint }} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                        <Camera size={22} color={colors.preventionDark} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p style={{ ...displayFont, color: colors.ink }} className="text-base font-bold">{isEN ? 'Movement screening' : 'Screening del movimento'}</p>
                          <span style={{ backgroundColor: colors.preventionTint, color: colors.preventionDark }} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0">Beta</span>
                        </div>
                        <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed">{isEN ? 'Camera-based squat and balance check — nothing ever leaves your phone.' : 'Analisi di squat ed equilibrio con la fotocamera — nulla lascia mai il tuo telefono.'}</p>
                        {movementScreenings.length > 0 && (() => {
                          const last = movementScreenings[0];
                          const meta = movementVerdictMeta(last.result.level);
                          return (
                            <p style={{ color: meta.color }} className="text-xs font-semibold mt-1.5">
                              {isEN ? `Last: ${last.test === 'squat' ? 'Squat' : 'Balance'} — ${movementVerdictCopy(last.test, last.result, isEN).title}` : `Ultimo: ${last.test === 'squat' ? 'Squat' : 'Equilibrio'} — ${movementVerdictCopy(last.test, last.result, isEN).title}`}
                            </p>
                          );
                        })()}
                      </div>
                      <ChevronRight size={18} color={colors.mutedInk} className="flex-shrink-0 mt-1" />
                    </div>
                  </button>
                )}

                <div className="mb-6 mt-1">
                  <BodyDiagram
                    onSelectRegion={(key) => { setExpandedPrevention(key); setTimeout(() => scrollToId(`prevention-${key}`), 120); }}
                    tone="teal"
                    labels={regionLabels}
                    isEN={isEN}
                    title={isEN ? 'Pick an area to strengthen' : 'Scegli la zona da rinforzare'}
                    caption={preventionDoneCount > 0 ? (isEN ? `${preventionDoneCount} done` : `${preventionDoneCount} fatti`) : null}
                  />
                </div>

                <SectionTitle id="prev-zones" className="mt-2" tone="teal" kicker={isEN ? 'Area by area' : 'Zona per zona'} title={isEN ? 'Prevention exercises' : 'Esercizi di prevenzione'} hint={isEN ? 'Each area: what it protects you from, how often, a quick test and practical tips. Tick what you do: it stays saved.' : 'Per ogni zona: da cosa ti protegge, quanto spesso, un test rapido e consigli pratici. Spunta quello che fai: resta salvato.'} />
                <div className="space-y-2.5">
                  {Object.entries(preventionData).map(([key, data]) => {
                    const isExpanded = expandedPrevention === key;
                    const regionProgress = preventionProgress[key] || {};
                    const doneFlags = data.exercises.map((_, i) => !!regionProgress[i]);
                    const doneCount = doneFlags.filter(Boolean).length;
                    return (
                      <div key={key} id={`prevention-${key}`} style={{ backgroundColor: colors.card, border: `1.5px solid ${isExpanded ? colors.prevention + '66' : colors.hairline}` }} className="rounded-2xl overflow-hidden shadow-sm scroll-mt-4">
                        <button onClick={() => setExpandedPrevention(isExpanded ? null : key)} aria-expanded={isExpanded} className="os-focus w-full flex items-center gap-3.5 p-3 text-left">
                          <div style={{ background: PITCH_BG_TEAL }} className="flex-shrink-0 w-14 h-[68px] rounded-xl flex items-center justify-center">
                            <RegionFigure region={key} tone="teal" height={60} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="text-[15px] font-bold leading-tight">{data.label}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex gap-0.5 w-24">
                                {doneFlags.map((f, i) => <span key={i} style={{ backgroundColor: f ? colors.prevention : colors.hairline }} className="h-1.5 flex-1 rounded-full" />)}
                              </div>
                              <span style={{ color: doneCount ? colors.preventionDark : colors.mutedInk }} className="text-[11px] font-semibold os-tabular">{isEN ? `${doneCount}/${data.exercises.length} done` : `${doneCount}/${data.exercises.length} fatti`}</span>
                            </div>
                          </div>
                          <ChevronDown size={20} color={colors.mutedInk} className="flex-shrink-0" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 os-fadein">
                            <p style={{ color: colors.mutedInk, backgroundColor: colors.preventionPaper, borderLeft: `3px solid ${colors.prevention}` }} className="text-xs leading-relaxed mb-3 px-3 py-2.5 rounded-r-lg">{data.why}</p>
                            {regions[key] && (
                              <div className="mb-3">
                                <p style={{ fontFamily: BRICOLAGE, color: colors.preventionDark, letterSpacing: '0.12em' }} className="text-[10px] font-bold uppercase mb-1.5">{isEN ? 'Protects you from' : 'Ti protegge da'}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {regions[key].injuries.filter((k) => injuriesData[k]).map((k) => (
                                    <button key={k} onClick={() => openRegion(key)} style={{ backgroundColor: colors.card, border: `1px solid ${colors.prevention}55`, color: colors.ink }} className="os-focus inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold hover:bg-teal-50 transition-colors">
                                      <ShieldCheck size={11} color={colors.preventionDark} />{injuriesData[k].label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {preventionExtras[key] && (
                              <p style={{ color: colors.ink }} className="flex items-start gap-2 text-xs leading-relaxed mb-3"><Timer size={14} color={colors.preventionDark} className="flex-shrink-0 mt-px" />{preventionExtras[key].dose}</p>
                            )}
                            <div className="space-y-2.5">
                              {data.exercises.map((ex, i) => {
                                const tipKey = `${key}-${i}`;
                                const tipOpen = expandedPreventionTip === tipKey;
                                return (
                                  <DrillCard
                                    key={tipKey}
                                    index={i}
                                    ex={ex}
                                    tone="teal"
                                    catLabel={catLabels[ex.cat]}
                                    done={!!regionProgress[i]}
                                    onToggle={() => togglePreventionExercise(key, i)}
                                    helpOpen={tipOpen}
                                    onToggleHelp={() => setExpandedPreventionTip(tipOpen ? null : tipKey)}
                                    isEN={isEN}
                                  />
                                );
                              })}
                            </div>
                            {preventionExtras[key] && (
                              <>
                                <div style={{ background: PITCH_BG_TEAL }} className="relative overflow-hidden rounded-2xl p-4 mt-3">
                                  <p style={{ fontFamily: BRICOLAGE, color: LED_TEAL, letterSpacing: '0.14em' }} className="flex items-center gap-1.5 text-[10px] font-bold uppercase mb-1.5"><Gauge size={12} />{isEN ? 'Quick test' : 'Test rapido'}</p>
                                  <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="text-[15px] font-bold leading-snug mb-1">{preventionExtras[key].test.title}</p>
                                  <p style={{ color: 'rgba(255,255,255,0.78)' }} className="text-xs leading-relaxed">{preventionExtras[key].test.how}</p>
                                  <p style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#E6FBFD' }} className="flex items-start gap-2 text-xs leading-relaxed mt-2.5 rounded-lg px-3 py-2"><Info size={13} color={LED_TEAL} className="flex-shrink-0 mt-px" />{preventionExtras[key].test.check}</p>
                                </div>
                                <div style={{ backgroundColor: colors.preventionPaper, border: `1px solid ${colors.prevention}30` }} className="rounded-2xl p-4 mt-3">
                                  <p style={{ fontFamily: BRICOLAGE, color: colors.preventionDark, letterSpacing: '0.12em' }} className="text-[10px] font-bold uppercase mb-2">{isEN ? 'Practical tips' : 'Consigli pratici'}</p>
                                  <ul className="space-y-2">
                                    {preventionExtras[key].tips.map((tip, ti) => (
                                      <li key={ti} style={{ color: colors.ink }} className="flex gap-2 text-[12.5px] leading-snug"><span style={{ backgroundColor: colors.prevention }} className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[6px]" /><span>{tip}</span></li>
                                    ))}
                                  </ul>
                                </div>
                              </>
                            )}
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
                  <PremiumLockCard
                    title={isEN ? 'Technical training, by role' : 'Allenamento tecnico, per ruolo'}
                    text={isEN ? 'Ball control, passing, finishing — exercises built for your position on the pitch.' : 'Controllo palla, passaggio, finalizzazione — esercizi pensati per il tuo ruolo in campo.'}
                    cta={isEN ? 'Unlock Premium' : 'Sblocca Premium'}
                    onUnlock={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }}
                    icon={SoccerBall}
                    preview={(techniqueData.centrocampista?.exercises || []).slice(0, 5).map((ex) => splitDose(ex.text).main)}
                  />
                ) : !playerPosition ? (
                  <div style={{ background: PREMIUM_BG }} className="relative overflow-hidden rounded-3xl p-5 shadow-lg">
                    <PitchArc size={180} />
                    <p style={{ fontFamily: BEBAS, letterSpacing: '0.12em' }} className="os-gold-text relative text-[15px] leading-none mb-2">{isEN ? 'Technique · Premium' : 'Tecnica · Premium'}</p>
                    <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="relative text-[17px] font-bold leading-snug mb-4">{isEN ? 'Pick your position to see the right drills' : 'Scegli il tuo ruolo per vedere gli esercizi giusti'}</p>
                    <div className="relative">
                      <PositionPicker positions={playerPositions} value={playerPosition} dark onPick={(k) => { setPlayerPosition(k); persist(snapshot({ playerPosition: k })); }} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: PREMIUM_BG }} className="relative overflow-hidden rounded-3xl p-5 mb-4 shadow-lg">
                      <PitchArc size={190} />
                      <div className="relative flex items-center justify-between gap-3 mb-2">
                        <p style={{ fontFamily: BRICOLAGE, color: colors.premiumGold, letterSpacing: '0.14em' }} className="text-[10px] font-bold uppercase">{isEN ? 'Your position' : 'Il tuo ruolo'}</p>
                        <button onClick={() => setPlayerPosition(null)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }} className="os-focus flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold hover:bg-white/20 transition-colors">
                          <RotateCw size={12} />{isEN ? 'Change' : 'Cambia'}
                        </button>
                      </div>
                      <div className="relative flex items-end gap-2.5">
                        <span style={{ fontFamily: BEBAS }} className="os-gold-text text-[56px] leading-[0.8]">{POSITION_NUMBERS[playerPosition] || ''}</span>
                        <p style={{ fontFamily: BEBAS, color: '#FFFFFF' }} className="text-[34px] leading-[0.85] min-w-0 break-words">{playerPositions.find((p) => p.key === playerPosition)?.label}</p>
                      </div>
                      <p style={{ color: '#A9B7C4' }} className="relative text-sm leading-relaxed mt-3">{techniqueData[playerPosition].why}</p>
                    </div>
                    <div className="space-y-2.5">
                      {techniqueData[playerPosition].exercises.map((ex, i) => {
                        const techKey = `tech-${i}`;
                        const tipOpen = activeVideo === techKey;
                        return (
                          <DrillCard
                            key={techKey}
                            index={i}
                            ex={ex}
                            tone="gold"
                            catLabel={catLabels[ex.cat]}
                            helpOpen={tipOpen}
                            onToggleHelp={() => setActiveVideo(tipOpen ? null : techKey)}
                            isEN={isEN}
                          />
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
            <div style={{ backgroundColor: colors.laneBg }} className="flex gap-1 p-1 rounded-full mb-5">
              <button onClick={() => setPremiumTab('individual')} style={{ backgroundColor: premiumTab === 'individual' ? colors.card : 'transparent', color: premiumTab === 'individual' ? colors.ink : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">
                <User size={14} />{isEN ? 'For you' : 'Per te'}
              </button>
              <button onClick={() => setPremiumTab('team')} style={{ backgroundColor: premiumTab === 'team' ? colors.card : 'transparent', color: premiumTab === 'team' ? colors.preventionDark : colors.mutedInk }} className="os-focus flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors">
                <Users size={14} />{isEN ? 'For your team' : 'Per la squadra'}
              </button>
            </div>

            {premiumTab === 'individual' && (
            <>
            {!premiumUnlocked ? (
              <>
                <div style={{ background: PREMIUM_BG, border: '1px solid rgba(240,180,41,0.3)' }} className="relative overflow-hidden rounded-3xl mb-4 shadow-xl">
                  <PitchArc size={240} />
                  <div className="relative px-6 pt-6 pb-5">
                    <div className="flex items-center gap-1.5 mb-4">
                      <LogoMark size={15} color={colors.premiumGold} strokeWidth={2.5} />
                      <span style={{ fontFamily: BRICOLAGE, color: 'rgba(240,180,41,0.85)', letterSpacing: '0.18em' }} className="text-[10px] font-bold uppercase">Offside</span>
                    </div>
                    <p style={{ fontFamily: BEBAS, letterSpacing: '0.02em', filter: 'drop-shadow(0 4px 18px rgba(240,180,41,0.35))' }} className="os-gold-text text-[78px] leading-[0.82]">Premium</p>
                    <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="text-[18px] font-bold leading-snug mt-3">{isEN ? 'Train like your role and injury need' : 'Allenati come richiedono ruolo e infortunio'}</p>
                    <p style={{ color: '#A9B7C4' }} className="text-sm leading-relaxed mt-1.5">{isEN ? 'Exercises tailored to your position AND the specific area — plus your real progress over time.' : 'Esercizi su misura per il tuo ruolo E la zona specifica — più il tuo vero andamento nel tempo.'}</p>
                  </div>
                  <div className="relative h-5" aria-hidden="true">
                    <span style={{ backgroundColor: colors.paper }} className="absolute -left-2.5 top-0 w-5 h-5 rounded-full" />
                    <span style={{ backgroundColor: colors.paper }} className="absolute -right-2.5 top-0 w-5 h-5 rounded-full" />
                    <div style={{ borderTop: '2px dashed rgba(240,180,41,0.3)' }} className="absolute left-5 right-5 top-1/2" />
                  </div>
                  <div className="relative px-5 pt-2 pb-5">
                    <p style={{ fontFamily: BEBAS, color: colors.premiumGold, letterSpacing: '0.12em' }} className="text-[15px] leading-none mb-3.5">{isEN ? 'What you unlock' : 'Cosa sblocchi'}</p>
                    <div className="space-y-3">
                      {[
                        { icon: Target, title: isEN ? 'Role + area training' : 'Allenamento ruolo + zona', text: isEN ? 'Exercises that combine your position and the injured area' : 'Esercizi che uniscono il tuo ruolo e la zona dell\'infortunio' },
                        { icon: TrendingUp, title: isEN ? 'Your progress, charted' : 'Il tuo andamento, in grafico', text: isEN ? 'Feeling and stiffness day by day' : 'Feeling e rigidità giorno per giorno' },
                        { icon: ClipboardCheck, title: isEN ? 'A report for your physio' : 'Un resoconto per il fisio', text: isEN ? 'A printable or PDF summary for your physio or coach' : 'Un riepilogo stampabile o in PDF per fisioterapista o allenatore' },
                        { icon: SoccerBall, title: isEN ? 'Technique by position' : 'Tecnica per ruolo', text: isEN ? 'Ball control, passing, finishing: drills for your position' : 'Controllo palla, passaggio, finalizzazione: esercizi per il tuo ruolo' },
                        { icon: Camera, title: isEN ? 'Movement screening' : 'Screening del movimento', beta: true, text: isEN ? 'Squat and balance with your camera, all on your phone' : 'Squat ed equilibrio con la fotocamera, tutto sul telefono' },
                        { icon: User, title: isEN ? 'Return tip for your role' : 'Consiglio di rientro per ruolo', text: isEN ? 'In the final phase, a return-to-play tip built for your position' : 'Nell\'ultima fase, un consiglio sul rientro pensato per il tuo ruolo' },
                      ].map((f) => (
                        <div key={f.title} className="flex items-start gap-3">
                          <div style={{ backgroundColor: 'rgba(240,180,41,0.12)', border: '1px solid rgba(240,180,41,0.3)' }} className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"><f.icon size={17} color={colors.premiumGold} /></div>
                          <div className="min-w-0">
                            <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="flex items-center gap-1.5 text-sm font-bold leading-snug">
                              {f.title}
                              {f.beta && <span style={{ border: '1px solid rgba(240,180,41,0.5)', color: colors.premiumGold }} className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-px rounded-full">Beta</span>}
                            </p>
                            <p style={{ color: '#A9B7C4' }} className="text-xs leading-relaxed mt-0.5">{f.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <GoldButton full href={STRIPE_PAYMENT_LINK} onClick={() => trackEvent('premium_unlock_clicked')}>{isEN ? 'Unlock Premium' : 'Sblocca Premium'}<ArrowRight size={16} /></GoldButton>
                <p style={{ color: colors.mutedInk }} className="text-[10.5px] text-center mt-2.5">
                  {isEN ? 'Payments handled securely by Stripe. ' : 'Pagamenti gestiti in sicurezza da Stripe. '}
                  <a href="/privacy.html" style={{ color: colors.mutedInk }} className="underline hover:opacity-70">{isEN ? 'Privacy Policy' : 'Informativa sulla Privacy'}</a>
                </p>
                <div className="text-center mt-3">{renderRestoreBox()}</div>
              </>
            ) : (
              <>
                {(() => {
                  const roleRegion = injury ? regionOfInjury(selectedInjury, injuriesData) : selectedRegion;
                  const rr = roleRegion && playerPosition ? regionRoleExercises[roleRegion]?.[playerPosition] : null;
                  return (
                    <div style={{ background: PREMIUM_BG, border: '1px solid rgba(240,180,41,0.3)' }} className="relative overflow-hidden rounded-3xl p-5 mb-5 shadow-lg">
                      <PitchArc size={200} />
                      <div className="relative flex items-center justify-between gap-3 mb-3">
                        <p style={{ fontFamily: BEBAS, letterSpacing: '0.12em' }} className="os-gold-text text-[15px] leading-none">{isEN ? 'Premium · Area + role' : 'Premium · Zona + ruolo'}</p>
                        <span style={{ backgroundColor: 'rgba(125,255,168,0.12)', color: LED_GREEN }} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"><Check size={11} />{isEN ? 'Active' : 'Attivo'}</span>
                      </div>
                      {!roleRegion ? (
                        <p style={{ color: '#D7E1EA' }} className="relative text-sm leading-relaxed">{isEN ? 'Select an injury or area first, to see training built specifically for it.' : 'Scegli prima un infortunio o una zona, per vedere l\'allenamento pensato apposta per quella.'}</p>
                      ) : !playerPosition ? (
                        <div className="relative">
                          <p style={{ color: '#D7E1EA' }} className="text-sm mb-3">{isEN ? `Pick your position to see exercises for ${regionLabels[roleRegion].toLowerCase()}, built for your role.` : `Scegli il tuo ruolo per vedere gli esercizi per ${regionLabels[roleRegion].toLowerCase()}, pensati per te.`}</p>
                          <PositionPicker positions={playerPositions} value={playerPosition} dark onPick={(k) => { setPlayerPosition(k); persist(snapshot({ playerPosition: k })); }} />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }} className="flex-shrink-0 rounded-xl px-2 py-1.5">
                              <RegionFigure region={roleRegion} height={64} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontFamily: BEBAS, color: '#FFFFFF' }} className="text-[28px] leading-[0.9]">{playerPositions.find((p) => p.key === playerPosition)?.label}</p>
                              <p style={{ color: colors.premiumGold }} className="text-[11px] font-bold uppercase tracking-wide mt-1">{regionLabels[roleRegion]}</p>
                            </div>
                            <button onClick={() => setPlayerPosition(null)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }} className="os-focus flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold hover:bg-white/20 transition-colors">
                              <RotateCw size={12} />{isEN ? 'Change' : 'Cambia'}
                            </button>
                          </div>
                          {rr ? (
                            <>
                              <p style={{ color: '#A9B7C4' }} className="text-xs leading-relaxed mb-3">{rr.why}</p>
                              <div className="space-y-2">
                                {rr.exercises.map((ex, i) => {
                                  const rrKey = `rr-${roleRegion}-${playerPosition}-${i}`;
                                  const tipOpen = activeVideo === rrKey;
                                  return (
                                    <DrillCard
                                      key={rrKey}
                                      index={i}
                                      ex={ex}
                                      tone="gold"
                                      dark
                                      catLabel={catLabels[ex.cat]}
                                      helpOpen={tipOpen}
                                      onToggleHelp={() => setActiveVideo(tipOpen ? null : rrKey)}
                                      isEN={isEN}
                                    />
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <p style={{ color: '#A9B7C4' }} className="text-xs leading-relaxed">{isEN ? 'Role-specific training for this area is coming soon.' : 'L\'allenamento per ruolo per questa zona arriva presto.'}</p>
                          )}
                        </div>
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
            </>
            )}

            {premiumTab === 'team' && (
              <>
                {teamAuth ? (
                  <>
                    <button onClick={() => setScreen('teamDashboard')} style={{ backgroundColor: colors.preventionPaper, border: `1px solid ${colors.prevention}40` }} className="os-focus w-full flex items-center gap-3 rounded-xl p-4 text-left hover:opacity-90 transition-opacity mb-4">
                      <div style={{ backgroundColor: colors.preventionTint }} className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center">
                        <Users size={18} color={colors.preventionDark} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold">{teamAuth.teamName}</p>
                        <p style={{ color: colors.mutedInk }} className="text-xs">{isEN ? 'Go to the team dashboard' : 'Vai alla dashboard della squadra'}</p>
                      </div>
                      <ChevronRight size={16} color={colors.mutedInk} />
                    </button>
                    <button onClick={() => { setTeamFormStatus('idle'); setTeamFormError(''); setScreen('teamLogin'); }} style={{ color: colors.mutedInk }} className="os-focus w-full text-center text-xs underline hover:opacity-70">
                      {isEN ? 'Manage a different team? Log in' : 'Gestisci un\'altra squadra? Accedi'}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ background: PITCH_BG_TEAL }} className="relative overflow-hidden rounded-3xl p-6 mb-5 shadow-lg">
                      <PitchArc size={200} />
                      <div className="relative flex items-center gap-2 mb-3">
                        <div style={{ backgroundColor: 'rgba(114,230,242,0.14)', border: '1px solid rgba(114,230,242,0.35)' }} className="w-10 h-10 rounded-xl flex items-center justify-center"><Users size={19} color={LED_TEAL} /></div>
                        <span style={{ fontFamily: BRICOLAGE, color: LED_TEAL, letterSpacing: '0.16em' }} className="text-[10px] font-bold uppercase">{isEN ? 'For staff' : 'Per lo staff'}</span>
                      </div>
                      <p style={{ fontFamily: BEBAS, color: '#FFFFFF' }} className="relative text-[46px] leading-[0.85]">Offside <span style={{ color: LED_TEAL }}>{isEN ? 'Teams' : 'Squadre'}</span></p>
                      <p style={{ fontFamily: BRICOLAGE, color: '#FFFFFF' }} className="relative text-[17px] font-bold mt-3 mb-1.5">{isEN ? 'One dashboard for the whole squad' : 'Una dashboard per tutta la squadra'}</p>
                      <p style={{ color: 'rgba(255,255,255,0.75)' }} className="relative text-sm leading-relaxed">{isEN ? 'See every consenting player\'s injury, recovery phase and indicative return time — all in one place.' : 'Vedi infortunio, fase di recupero e rientro indicativo di ogni giocatore che ha dato il consenso — tutto in un posto.'}</p>
                    </div>
                    <div className="space-y-3 mb-6">
                      {[
                        isEN ? 'Real injury name and indicative recovery time for every player who joins' : 'Nome vero dell\'infortunio e tempi di recupero indicativi di ogni giocatore che aderisce',
                        isEN ? 'Who\'s available, doubtful or out for your next match, at a glance' : 'Chi è disponibile, in dubbio o fuori per la prossima partita, a colpo d\'occhio',
                        isEN ? 'A weekly wellness signal (sleep, soreness, training load) flagging who\'s worth checking in with — before an injury happens, not after' : 'Un segnale settimanale di benessere (sonno, indolenzimento, carico) che segnala a chi vale la pena chiedere come sta — prima che si faccia male, non dopo',
                        isEN ? 'Team-wide stats: where your squad gets injured most, over time' : 'Statistiche di squadra: dove si infortura di più il gruppo nel tempo',
                        isEN ? 'A clear signal when a player\'s recovery is taking longer than typical' : 'Un segnale chiaro quando il recupero di un giocatore richiede più tempo del previsto',
                        isEN ? 'Players decide themselves whether to share, and can revoke consent any time' : 'Sono i giocatori a scegliere se condividere, e possono revocare il consenso quando vogliono',
                        isEN ? 'Their daily journal and personal notes are never visible to the team' : 'Il loro diario giornaliero e le note personali non sono mai visibili alla squadra',
                      ].map((text, i) => (
                        <div key={i} className="flex gap-3 items-start">
                          <CheckCircle2 size={18} color={colors.preventionDark} className="flex-shrink-0 mt-0.5" />
                          <p style={{ color: colors.ink }} className="text-sm leading-snug">{text}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2.5 mb-6">
                      <div style={{ backgroundColor: colors.preventionPaper, border: `2px solid ${colors.prevention}` }} className="rounded-xl p-4 pt-5 text-center relative">
                        <span style={{ backgroundColor: colors.prevention, color: '#FFFFFF' }} className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap">{isEN ? `Save €${TEAM_SEASON_FULL_PRICE - TEAM_SEASON_PASS_PRICE}` : `Risparmi ${TEAM_SEASON_FULL_PRICE - TEAM_SEASON_PASS_PRICE}€`}</span>
                        <p style={{ color: colors.mutedInk }} className="text-[11px] font-medium mb-1">{isEN ? 'Season Pass — one payment' : 'Pass Stagionale — un pagamento unico'}</p>
                        <p style={{ ...displayFont, color: colors.preventionDark }} className="text-2xl font-bold">
                          <span style={{ textDecoration: 'line-through' }} className="text-base font-medium mr-1.5 opacity-60">{TEAM_SEASON_FULL_PRICE}€</span>{TEAM_SEASON_PASS_PRICE}€
                        </p>
                        <p style={{ color: colors.preventionDark }} className="text-xs font-semibold mt-1">{isEN ? 'Valid until end of season (May)' : 'Valido fino a fine stagione (maggio)'}</p>
                      </div>
                      <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-3 text-center">
                        <p style={{ ...displayFont, color: colors.ink }} className="text-lg font-bold">50€<span style={{ color: colors.mutedInk }} className="text-xs font-medium">/{isEN ? 'month per team' : 'mese a squadra'}</span></p>
                        <p style={{ color: colors.mutedInk }} className="text-[11px] mt-0.5">{isEN ? 'or pay month by month' : 'oppure paga mese per mese'}</p>
                      </div>
                      <p style={{ color: colors.preventionDark }} className="text-xs font-semibold text-center pt-1">{isEN ? 'First month free for new teams, either way' : 'Primo mese gratis per le nuove squadre, in entrambi i casi'}</p>
                    </div>
                    <button onClick={() => { trackEvent('team_register_clicked'); setTeamFormStatus('idle'); setTeamFormError(''); setScreen('teamRegister'); }} style={{ backgroundColor: colors.prevention, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium shadow-sm hover:opacity-90 transition-opacity mb-3">
                      <Building2 size={16} /><span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'Register your team' : 'Registra la tua squadra'}</span>
                    </button>
                    <button onClick={() => { setTeamFormStatus('idle'); setTeamFormError(''); setScreen('teamLogin'); }} style={{ color: colors.mutedInk }} className="os-focus w-full text-center text-xs underline hover:opacity-70">
                      {isEN ? 'Already have an account? Log in' : 'Hai già un account? Accedi'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {screen === 'teamRegister' && (
          <div>
            <p style={{ color: colors.mutedInk }} className="text-sm mb-5 leading-relaxed">{isEN ? 'One account per team. You choose who on your staff manages it.' : 'Un account per squadra. Scegliete voi chi dello staff lo gestisce.'}</p>

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">{isEN ? 'Team name' : 'Nome squadra'}</label>
            <input type="text" value={teamForm.teamName} onChange={(e) => setTeamForm({ ...teamForm, teamName: e.target.value })} placeholder={isEN ? 'e.g. ASD Real Offside' : 'es. ASD Real Offside'} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-3 py-2.5 text-sm mb-3.5" />

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">{isEN ? 'Your name' : 'Il tuo nome'}</label>
            <input type="text" value={teamForm.responsibleName} onChange={(e) => setTeamForm({ ...teamForm, responsibleName: e.target.value })} placeholder={isEN ? 'Full name' : 'Nome e cognome'} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-3 py-2.5 text-sm mb-3.5" />

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">{isEN ? 'Your role' : 'Il tuo ruolo'}</label>
            <div className="flex flex-wrap gap-2 mb-3.5">
              {TEAM_ROLE_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => setTeamForm({ ...teamForm, responsibleRole: opt.key })} style={{ backgroundColor: teamForm.responsibleRole === opt.key ? colors.prevention : colors.card, color: teamForm.responsibleRole === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${teamForm.responsibleRole === opt.key ? colors.prevention : colors.hairline}` }} className="os-focus px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                  {isEN ? opt.labelEN : opt.labelIT}
                </button>
              ))}
            </div>
            <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mb-3.5">{isEN ? 'Not a restriction — just so players know who they\'re sharing with. The team decides.' : 'Non è un vincolo — serve solo a far sapere ai giocatori con chi condividono. Decide la squadra.'}</p>

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">Email</label>
            <input type="email" value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} placeholder="email@esempio.com" style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-3 py-2.5 text-sm mb-3.5" />
            <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mb-3.5 -mt-2.5">{isEN ? 'Use the same email when you pay, so the subscription activates automatically.' : 'Usa la stessa email al momento del pagamento, così l\'abbonamento si attiva in automatico.'}</p>

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">Password</label>
            <div className="relative mb-3.5">
              <input type={showTeamPassword ? 'text' : 'password'} value={teamForm.password} onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })} placeholder={isEN ? 'At least 8 characters' : 'Almeno 8 caratteri'} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg pl-3 pr-10 py-2.5 text-sm" />
              <button type="button" onClick={() => setShowTeamPassword(!showTeamPassword)} className="os-focus absolute right-3 top-1/2 -translate-y-1/2" aria-label={showTeamPassword ? (isEN ? 'Hide password' : 'Nascondi password') : (isEN ? 'Show password' : 'Mostra password')}>
                {showTeamPassword ? <EyeOff size={16} color={colors.mutedInk} /> : <Eye size={16} color={colors.mutedInk} />}
              </button>
            </div>

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">{isEN ? 'Confirm password' : 'Conferma password'}</label>
            <input type={showTeamPassword ? 'text' : 'password'} value={teamForm.confirmPassword} onChange={(e) => setTeamForm({ ...teamForm, confirmPassword: e.target.value })} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-3 py-2.5 text-sm mb-4" />

            <button onClick={() => setTeamForm({ ...teamForm, minorConsentAttested: !teamForm.minorConsentAttested })} role="checkbox" aria-checked={teamForm.minorConsentAttested} className="os-focus w-full flex items-start gap-2.5 mb-5 text-left">
              <div style={{ backgroundColor: teamForm.minorConsentAttested ? colors.prevention : colors.card, border: `1.5px solid ${teamForm.minorConsentAttested ? colors.prevention : colors.hairline}` }} className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5">
                {teamForm.minorConsentAttested && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
              </div>
              <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'I confirm that, if the team includes players under 18, the club has obtained parental consent to use Offside for Teams for health-related data.' : 'Confermo che, se la squadra include giocatori minorenni, la società ha ottenuto il consenso dei genitori all\'uso di Offside Squadre per i dati sulla salute.'}</p>
            </button>

            <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mb-4 -mt-2">
              {isEN ? 'By creating an account you accept our ' : 'Creando un account accetti la nostra '}
              <a href="/privacy.html" style={{ color: colors.preventionDark }} className="os-focus underline font-medium hover:opacity-70">{isEN ? 'Privacy Policy' : 'Informativa sulla Privacy'}</a>.
            </p>

            {teamFormStatus === 'error' && <p style={{ color: colors.red }} className="text-xs mb-3">{teamFormError}</p>}

            <p style={{ color: colors.preventionDark }} className="text-xs font-semibold text-center mb-3">{isEN ? 'First month free — no card required to start' : 'Primo mese gratis — nessuna carta richiesta per iniziare'}</p>

            <button onClick={submitTeamRegister} disabled={teamFormStatus === 'submitting'} style={{ backgroundColor: colors.prevention, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium shadow-sm hover:opacity-90 transition-opacity mb-3">
              <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{teamFormStatus === 'submitting' ? '...' : (isEN ? 'Create account' : 'Crea account')}</span>
            </button>
            <button onClick={() => { setTeamFormStatus('idle'); setTeamFormError(''); setScreen('teamLogin'); }} style={{ color: colors.mutedInk }} className="os-focus w-full text-center text-xs underline hover:opacity-70">
              {isEN ? 'Already have an account? Log in' : 'Hai già un account? Accedi'}
            </button>
          </div>
        )}

        {screen === 'teamLogin' && (
          <div>
            <p style={{ color: colors.mutedInk }} className="text-sm mb-5 leading-relaxed">{isEN ? 'Log in with the email and password you used to register your team.' : 'Accedi con l\'email e la password usate per registrare la squadra.'}</p>

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">Email</label>
            <input type="email" value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} placeholder="email@esempio.com" style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-3 py-2.5 text-sm mb-3.5" />

            <label style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase block mb-1.5">Password</label>
            <div className="relative mb-5">
              <input type={showTeamPassword ? 'text' : 'password'} value={teamForm.password} onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg pl-3 pr-10 py-2.5 text-sm" />
              <button type="button" onClick={() => setShowTeamPassword(!showTeamPassword)} className="os-focus absolute right-3 top-1/2 -translate-y-1/2" aria-label={showTeamPassword ? (isEN ? 'Hide password' : 'Nascondi password') : (isEN ? 'Show password' : 'Mostra password')}>
                {showTeamPassword ? <EyeOff size={16} color={colors.mutedInk} /> : <Eye size={16} color={colors.mutedInk} />}
              </button>
            </div>

            {teamFormStatus === 'error' && <p style={{ color: colors.red }} className="text-xs mb-3">{teamFormError}</p>}

            <button onClick={submitTeamLogin} disabled={teamFormStatus === 'submitting'} style={{ backgroundColor: colors.prevention, color: '#FFFFFF' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium shadow-sm hover:opacity-90 transition-opacity mb-3">
              <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{teamFormStatus === 'submitting' ? '...' : (isEN ? 'Log in' : 'Accedi')}</span>
            </button>
            <button onClick={() => { setTeamFormStatus('idle'); setTeamFormError(''); setScreen('teamRegister'); }} style={{ color: colors.mutedInk }} className="os-focus w-full text-center text-xs underline hover:opacity-70">
              {isEN ? "Don't have an account? Register your team" : 'Non hai un account? Registra la squadra'}
            </button>
          </div>
        )}

        {screen === 'teamDashboard' && (
          <div>
            {teamDashboardLoading && !teamDashboardData ? (
              <p style={{ color: colors.mutedInk }} className="text-sm text-center py-10">{isEN ? 'Loading...' : 'Caricamento...'}</p>
            ) : !teamDashboardData ? (
              <p style={{ color: colors.mutedInk }} className="text-sm text-center py-10">{isEN ? 'Something went wrong loading the dashboard.' : 'Qualcosa è andato storto nel caricare la dashboard.'}</p>
            ) : !teamDashboardData.subscriptionActive ? (
              <>
                <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm">
                  <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-1">{isEN ? 'Team code' : 'Codice squadra'}</p>
                  <p style={{ ...displayFont, color: colors.preventionDark, letterSpacing: '0.15em' }} className="text-2xl font-bold mb-1">{teamDashboardData.inviteCode}</p>
                  <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'Your code and players are safe — the roster becomes visible again as soon as you activate.' : 'Il codice e i giocatori restano al sicuro — la rubrica torna visibile appena riattivi l\'abbonamento.'}</p>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #0F766E, #0B4440)', border: `1px solid ${colors.prevention}40` }} className="rounded-2xl p-5 text-center mb-4">
                  <p style={{ ...displayFont, color: '#FFFFFF' }} className="text-base font-bold mb-2">{isEN ? 'Your free trial has ended' : 'Il mese di prova è terminato'}</p>
                  <p style={{ color: '#BFE9E3' }} className="text-xs leading-relaxed mb-4">{isEN ? `Activate to keep using the dashboard. Pay with the same email you registered with (${teamAuth?.email}) so it activates automatically.` : `Attiva per continuare a usare la dashboard. Paga con la stessa email della registrazione (${teamAuth?.email}) così si attiva in automatico.`}</p>
                  <a href={STRIPE_TEAM_SEASON_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('team_season_pass_clicked')} style={{ backgroundColor: colors.premiumGold, color: '#101B26' }} className="os-focus w-full flex flex-col items-center justify-center gap-0.5 rounded-xl py-3 font-medium shadow-sm hover:opacity-90 transition-opacity mb-2.5">
                    <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? `Season Pass — ${TEAM_SEASON_PASS_PRICE}€` : `Pass Stagionale — ${TEAM_SEASON_PASS_PRICE}€`}</span>
                    <span className="text-[10px] font-medium opacity-80">{isEN ? `instead of ${TEAM_SEASON_FULL_PRICE}€ — valid until end of season` : `invece di ${TEAM_SEASON_FULL_PRICE}€ — valido fino a fine stagione`}</span>
                  </a>
                  <a href={STRIPE_TEAM_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('team_subscribe_clicked')} style={{ backgroundColor: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.35)' }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-3 font-medium hover:opacity-90 transition-opacity">
                    <span style={displayFont} className="uppercase tracking-wide text-xs font-semibold">{isEN ? 'Or pay monthly — €50/month' : 'Oppure mese per mese — 50€/mese'}</span>
                  </a>
                  <p style={{ color: 'rgba(255,255,255,0.55)' }} className="text-[10.5px] text-center mt-2.5">
                    {isEN ? 'Payments handled securely by Stripe. ' : 'Pagamenti gestiti in sicurezza da Stripe. '}
                    <a href="/privacy.html" style={{ color: 'rgba(255,255,255,0.8)' }} className="underline hover:opacity-100">{isEN ? 'Privacy Policy' : 'Informativa sulla Privacy'}</a>
                  </p>
                </div>
                <button onClick={loadTeamDashboard} style={{ color: colors.mutedInk }} className="os-focus w-full text-center text-xs underline hover:opacity-70">{isEN ? 'I already paid — refresh' : 'Ho già pagato — aggiorna'}</button>
              </>
            ) : (
              <>
                <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p style={{ ...displayFont, color: colors.mutedInk }} className="text-[10px] font-semibold uppercase mb-1">{isEN ? 'Invite code' : 'Codice invito'}</p>
                    <p style={{ ...displayFont, color: colors.preventionDark, letterSpacing: '0.15em' }} className="text-xl font-bold">{teamDashboardData.inviteCode}</p>
                  </div>
                  <button onClick={shareTeamInviteCode} style={{ backgroundColor: colors.preventionTint, color: colors.preventionDark }} className="os-focus flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                    {teamInviteCopied ? <Check size={13} /> : <Copy size={13} />}{teamInviteCopied ? (isEN ? 'Copied' : 'Copiato') : (isEN ? 'Share' : 'Condividi')}
                  </button>
                </div>

                {teamDashboardData.players && teamDashboardData.players.length > 0 && (
                  <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm">
                    <p style={{ ...displayFont, color: colors.ink }} className="text-[10px] font-semibold uppercase tracking-wide mb-3">{isEN ? 'Availability for the next match' : 'Disponibilità per la prossima partita'}</p>
                    <div className="grid grid-cols-3 gap-2 mb-2.5">
                      <div className="text-center">
                        <p style={{ ...displayFont, color: colors.prevention }} className="text-2xl font-bold">{teamAvailabilityCounts.available}</p>
                        <p style={{ color: colors.mutedInk }} className="text-[10px] uppercase font-semibold">{isEN ? 'Available' : 'Disponibili'}</p>
                      </div>
                      <div className="text-center">
                        <p style={{ ...displayFont, color: colors.orange }} className="text-2xl font-bold">{teamAvailabilityCounts.doubtful}</p>
                        <p style={{ color: colors.mutedInk }} className="text-[10px] uppercase font-semibold">{isEN ? 'Doubtful' : 'In dubbio'}</p>
                      </div>
                      <div className="text-center">
                        <p style={{ ...displayFont, color: colors.red }} className="text-2xl font-bold">{teamAvailabilityCounts.out}</p>
                        <p style={{ color: colors.mutedInk }} className="text-[10px] uppercase font-semibold">{isEN ? 'Out' : 'Fuori'}</p>
                      </div>
                    </div>
                    <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed">{isEN ? 'Indicative only — the medical staff always makes the final call.' : 'Solo indicativo — la decisione finale spetta sempre allo staff medico.'}</p>
                  </div>
                )}

                {teamDashboardData.wellnessSummary && (teamDashboardData.wellnessSummary.rosso + teamDashboardData.wellnessSummary.giallo + teamDashboardData.wellnessSummary.verde) > 0 && (
                  <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4 mb-5 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Gauge size={13} color={colors.ink} />
                      <p style={{ ...displayFont, color: colors.ink }} className="text-[10px] font-semibold uppercase tracking-wide">{isEN ? 'Weekly wellness signal' : 'Monitoraggio settimanale'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <p style={{ ...displayFont, color: colors.red }} className="text-2xl font-bold">{teamDashboardData.wellnessSummary.rosso}</p>
                        <p style={{ color: colors.mutedInk }} className="text-[10px] uppercase font-semibold">{isEN ? 'To watch' : 'Da monitorare'}</p>
                      </div>
                      <div className="text-center">
                        <p style={{ ...displayFont, color: colors.orange }} className="text-2xl font-bold">{teamDashboardData.wellnessSummary.giallo}</p>
                        <p style={{ color: colors.mutedInk }} className="text-[10px] uppercase font-semibold">{isEN ? 'Attention' : 'Attenzione'}</p>
                      </div>
                      <div className="text-center">
                        <p style={{ ...displayFont, color: colors.accent }} className="text-2xl font-bold">{teamDashboardData.wellnessSummary.verde}</p>
                        <p style={{ color: colors.mutedInk }} className="text-[10px] uppercase font-semibold">{isEN ? 'OK' : 'OK'}</p>
                      </div>
                    </div>
                    {wellnessToWatch.length > 0 && (
                      <div style={{ backgroundColor: colors.paper }} className="rounded-lg p-2.5 mb-2.5">
                        <p style={{ color: colors.ink }} className="text-xs leading-relaxed">
                          {isEN ? 'Worth checking in with: ' : 'Vale la pena chiedere come stanno a: '}
                          <strong>{wellnessToWatch.map((p) => p.name).join(', ')}</strong>
                        </p>
                      </div>
                    )}
                    <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed">
                      {isEN
                        ? 'Based on each player\'s optional daily check-in (sleep, soreness, training load) — a signal to ask how someone is doing, never a diagnosis.'
                        : 'Basato sul check-in giornaliero facoltativo di ognuno (sonno, indolenzimento, carico) — un segnale per chiedere come sta qualcuno, mai una diagnosi.'}
                    </p>
                  </div>
                )}

                {teamDashboardData.trialActive && !teamDashboardData.isPaid && (
                  <div style={{ backgroundColor: colors.preventionPaper, border: `1px solid ${colors.prevention}40` }} className="rounded-xl p-3.5 mb-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p style={{ ...displayFont, color: colors.preventionDark }} className="text-xs font-semibold mb-0.5">{isEN ? 'Free trial' : 'Mese di prova'}</p>
                        <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">
                          {isEN
                            ? `${teamDashboardData.trialDaysLeft} ${teamDashboardData.trialDaysLeft === 1 ? 'day' : 'days'} left, then €50/month.`
                            : `${teamDashboardData.trialDaysLeft} ${teamDashboardData.trialDaysLeft === 1 ? 'giorno rimasto' : 'giorni rimasti'}, poi 50€/mese.`}
                        </p>
                      </div>
                      <a href={STRIPE_TEAM_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('team_subscribe_clicked_early')} style={{ color: colors.preventionDark }} className="os-focus flex-shrink-0 text-xs font-semibold underline hover:opacity-70">
                        {isEN ? 'Activate now' : 'Attiva ora'}
                      </a>
                    </div>
                    <a href={STRIPE_TEAM_SEASON_PAYMENT_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('team_season_pass_clicked_early')} style={{ color: colors.preventionDark }} className="os-focus block mt-1.5 text-[11px] font-semibold underline hover:opacity-70">
                      {isEN ? `Or save with the Season Pass — ${TEAM_SEASON_PASS_PRICE}€ instead of ${TEAM_SEASON_FULL_PRICE}€` : `Oppure risparmia col Pass Stagionale — ${TEAM_SEASON_PASS_PRICE}€ invece di ${TEAM_SEASON_FULL_PRICE}€`}
                    </a>
                  </div>
                )}

                {teamDashboardData.seasonPassActive && (
                  <div style={{ backgroundColor: colors.preventionPaper, border: `1px solid ${colors.prevention}40` }} className="rounded-xl p-3.5 mb-5">
                    <p style={{ ...displayFont, color: colors.preventionDark }} className="text-xs font-semibold mb-0.5">{isEN ? 'Season Pass active' : 'Pass Stagionale attivo'}</p>
                    <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">
                      {isEN
                        ? `Covered until ${new Date(teamDashboardData.paidUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — no further action needed.`
                        : `Coperti fino al ${new Date(teamDashboardData.paidUntil).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })} — nessuna azione da fare.`}
                    </p>
                  </div>
                )}

                {(!teamDashboardData.players || teamDashboardData.players.length === 0) ? (
                  <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-5 text-center">
                    <UserPlus size={22} color={colors.mutedInk} className="mx-auto mb-2" />
                    <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed">{isEN ? 'No players yet. Share the code above — each player enters it from their own Profile screen and chooses to share.' : 'Ancora nessun giocatore. Condividi il codice sopra — ogni giocatore lo inserisce dal proprio Profilo e sceglie di condividere.'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamDashboardData.players.map((p) => {
                      const injData = p.status && p.status.injuryKey ? injuriesData[p.status.injuryKey] : null;
                      const phaseDetail = (injData && Array.isArray(injData.phases) && Number.isFinite(p.status.phaseIndex))
                        ? injData.phases[p.status.phaseIndex] || null
                        : null;
                      return (
                      <div key={p.playerId} style={{ backgroundColor: colors.card, border: `1px solid ${p.status?.needsAttention ? colors.orange : colors.hairline}` }} className="rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {p.wellness && (p.wellness.level === 'rosso' || p.wellness.level === 'giallo') && (
                              <span
                                title={isEN ? 'Worth checking in with them' : 'Vale la pena chiedere come sta'}
                                style={{ backgroundColor: p.wellness.level === 'rosso' ? colors.red : colors.orange }}
                                className="flex-shrink-0 w-2 h-2 rounded-full"
                              />
                            )}
                            <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold truncate">{p.name}</p>
                          </div>
                          {p.status?.needsAttention && (
                            <span style={{ backgroundColor: '#FDECD8', color: colors.orange }} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} />{isEN ? 'Taking longer' : 'Recupero lungo'}</span>
                          )}
                        </div>
                        {!p.status || !p.status.injuryLabel ? (
                          <p style={{ color: colors.mutedInk }} className="text-xs">{isEN ? 'No active injury right now.' : 'Nessun infortunio attivo al momento.'}</p>
                        ) : (
                          <>
                            <p style={{ color: colors.ink }} className="text-sm mb-1">{p.status.injuryLabel}</p>
                            <p style={{ color: colors.mutedInk }} className="text-xs mb-1">
                              {isEN ? 'Phase' : 'Fase'} {(p.status.phaseIndex ?? 0) + 1}{p.status.totalPhases ? ` ${isEN ? 'of' : 'di'} ${p.status.totalPhases}` : ''}{p.status.phaseLabel ? ` — ${p.status.phaseLabel}` : ''}
                            </p>
                            {p.status.dayOfRecovery != null && (
                              <p style={{ color: colors.mutedInk }} className="text-xs">
                                {isEN ? 'Day' : 'Giorno'} {p.status.dayOfRecovery}{p.status.estimateDays ? ` ${isEN ? 'of an estimated' : 'su una stima di'} ${p.status.estimateDays} ${isEN ? 'days' : 'giorni'}` : ''}
                              </p>
                            )}
                            {phaseDetail && (
                              <div style={{ backgroundColor: colors.paper }} className="rounded-lg p-2.5 mt-2">
                                <p style={{ color: colors.ink }} className="text-xs leading-relaxed mb-1.5">{phaseDetail.why}</p>
                                {Array.isArray(phaseDetail.exercises) && phaseDetail.exercises.length > 0 && (
                                  <ul>
                                    {phaseDetail.exercises.slice(0, 2).map((ex, i) => (
                                      <li key={i} style={{ color: colors.mutedInk }} className="text-[11px] leading-snug flex items-start gap-1.5 mb-0.5">
                                        <span style={{ color: colors.preventionDark }}>•</span>{ex.text}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      );
                    })}
                    <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed text-center pt-2">{isEN ? 'Recovery times are estimates based on typical cases, not a promise — every body heals differently.' : 'I tempi di recupero sono stime basate su casi tipici, non una promessa — ogni corpo guarisce a modo suo.'}</p>

                    {teamDashboardData.teamStats && teamDashboardData.teamStats.totalEpisodes > 0 && (
                      <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-4">
                        <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold mb-3">{isEN ? 'Team stats' : 'Statistiche di squadra'}</p>
                        <div className="space-y-2 mb-2.5">
                          {teamDashboardData.teamStats.topInjuries.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-3">
                              <p style={{ color: colors.ink }} className="text-xs">{item.label}</p>
                              <p style={{ ...displayFont, color: colors.preventionDark }} className="text-xs font-bold flex-shrink-0">{item.count}</p>
                            </div>
                          ))}
                        </div>
                        {teamDashboardData.teamStats.avgResolvedDays != null && (
                          <p style={{ color: colors.mutedInk, borderTop: `1px solid ${colors.hairline}` }} className="text-xs leading-relaxed pt-2.5 mb-2">
                            {isEN ? `Average recovery time so far: ${teamDashboardData.teamStats.avgResolvedDays} days.` : `Tempo medio di recupero finora: ${teamDashboardData.teamStats.avgResolvedDays} giorni.`}
                          </p>
                        )}
                        <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed">{isEN ? 'Aggregated across the whole squad — never tied to a single player.' : 'Dati aggregati su tutta la squadra — mai riconducibili al singolo giocatore.'}</p>
                      </div>
                    )}
                  </div>
                )}
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
                    <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: colors.ink }} className="text-base font-bold mb-2">{isEN ? 'Coming soon' : 'Arriva presto'}</p>
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
                            <p style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: colors.ink }} className="text-sm font-bold">{p.name}</p>
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

        {screen === 'movementScreen' && (
          <div>
            {!premiumUnlocked ? (
              <PremiumLockCard
                icon={Camera}
                badge="Beta"
                title={isEN ? 'Movement screening' : 'Screening del movimento'}
                text={isEN ? 'Camera-based squat and balance screening is a Premium feature.' : 'Lo screening del movimento con la fotocamera è una funzione Premium.'}
                cta={isEN ? 'Unlock Premium' : 'Sblocca Premium'}
                onUnlock={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }}
              />
            ) : (
              <>
                {movementActive && (
                  <MovementCameraOverlay
                    test={movementActive}
                    isEN={isEN}
                    onCancel={() => setMovementActive(null)}
                    onComplete={(result) => { saveMovementResult(movementActive, result); setMovementActive(null); }}
                  />
                )}

                <div style={{ backgroundColor: colors.preventionPaper, border: `1px solid ${colors.prevention}30` }} className="rounded-2xl p-4 mb-6">
                  <p style={{ color: colors.ink }} className="text-sm leading-relaxed">
                    {isEN
                      ? 'A quick, indicative screening of movement symmetry and control, meant to help you notice compensations early — it\'s not a clinical assessment and doesn\'t replace a physiotherapist\'s judgment. Everything runs on your phone: the video is never recorded or sent anywhere, not even to us.'
                      : 'Uno screening rapido e indicativo di simmetria e controllo del movimento, pensato per aiutarti a notare per tempo eventuali compensi — non è una valutazione clinica e non sostituisce il giudizio di un fisioterapista. Tutta l\'analisi avviene sul tuo telefono: il video non viene mai registrato né inviato da nessuna parte, nemmeno a noi.'}
                  </p>
                </div>

                <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2.5">{isEN ? 'Choose a test' : 'Scegli un test'}</p>
                <div className="space-y-2.5 mb-7">
                  <button onClick={() => { trackEvent('movement_test_started', { test: 'squat' }); setMovementActive('squat'); }} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-3.5 rounded-2xl p-4 text-left shadow-sm hover:opacity-90 transition-opacity">
                    <div style={{ backgroundColor: colors.preventionTint }} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                      <Dumbbell size={22} color={colors.preventionDark} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-bold mb-0.5">{isEN ? 'Bodyweight squat' : 'Squat a corpo libero'}</p>
                      <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'Checks knee symmetry and control over a few reps.' : 'Analizza simmetria e controllo del ginocchio durante alcune ripetizioni.'}</p>
                    </div>
                    <ChevronRight size={18} color={colors.mutedInk} className="flex-shrink-0" />
                  </button>
                  <button onClick={() => { trackEvent('movement_test_started', { test: 'balance' }); setMovementActive('balance'); }} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="os-focus w-full flex items-center gap-3.5 rounded-2xl p-4 text-left shadow-sm hover:opacity-90 transition-opacity">
                    <div style={{ backgroundColor: colors.preventionTint }} className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                      <Scale size={22} color={colors.preventionDark} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ ...displayFont, color: colors.ink }} className="text-sm font-bold mb-0.5">{isEN ? 'Single-leg balance' : 'Equilibrio monopodalico'}</p>
                      <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? '10 seconds on each leg, comparing stability side to side.' : '10 secondi su ciascuna gamba, per confrontare la stabilità tra i due lati.'}</p>
                    </div>
                    <ChevronRight size={18} color={colors.mutedInk} className="flex-shrink-0" />
                  </button>
                </div>

                <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide mb-2.5">{isEN ? 'History' : 'Storico'}</p>
                {movementScreenings.length === 0 ? (
                  <p style={{ color: colors.mutedInk }} className="text-sm text-center py-6">{isEN ? 'No screenings yet — try one above.' : 'Nessuno screening ancora — provane uno qui sopra.'}</p>
                ) : (
                  <div className="space-y-2">
                    {movementScreenings.map((entry) => {
                      const meta = movementVerdictMeta(entry.result.level);
                      const copy = movementVerdictCopy(entry.test, entry.result, isEN);
                      const VIcon = meta.Icon;
                      return (
                        <div key={entry.id} style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-3.5 flex items-center gap-3">
                          <div style={{ backgroundColor: meta.tint }} className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center">
                            <VIcon size={16} color={meta.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ color: colors.ink }} className="text-sm font-medium">{entry.test === 'squat' ? (isEN ? 'Squat' : 'Squat') : (isEN ? 'Balance' : 'Equilibrio')} <span style={{ color: colors.mutedInk }} className="font-normal">· {entry.date}</span></p>
                            <p style={{ color: meta.color }} className="text-xs font-semibold">{copy.title}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
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
                    <span style={{ background: GOLD_GRADIENT, color: '#0B121A' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">{isEN ? 'Unlock' : 'Sblocca'}</span>
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

            <div style={{ borderTop: `1px solid ${colors.hairline}` }} className="pt-5 mt-6">
              <div className="flex items-center gap-2 mb-2.5">
                <Users size={14} color={colors.ink} />
                <p style={{ ...displayFont, color: colors.ink }} className="text-xs font-semibold uppercase tracking-wide">{isEN ? 'Team' : 'Squadra'}</p>
              </div>

              {myTeamMembership ? (
                <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-3.5">
                  <p style={{ color: colors.ink }} className="text-sm font-medium mb-1">{isEN ? 'Connected to' : 'Collegato a'}: {myTeamMembership.teamName}</p>
                  <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed mb-3">{isEN ? `Sharing as "${myTeamMembership.playerName}": your injury name, phase, estimated recovery time and — only if you fill in the daily check-in above — a summary wellness level (green/amber/red). Your daily journal, feelings and check-in answers are never shared.` : `Stai condividendo come "${myTeamMembership.playerName}": nome dell'infortunio, fase, stima di recupero e — solo se compili il check-in giornaliero qui sopra — un livello di benessere riassuntivo (verde/giallo/rosso). Il tuo diario giornaliero, le tue sensazioni e le risposte del check-in non vengono mai condivisi.`}</p>
                  <button
                    onClick={() => { if (confirmingTeamRevoke) { revokeTeamConsent(); setConfirmingTeamRevoke(false); } else { setConfirmingTeamRevoke(true); } }}
                    onBlur={() => setConfirmingTeamRevoke(false)}
                    style={{ color: confirmingTeamRevoke ? colors.red : colors.mutedInk }}
                    className="os-focus text-xs font-medium underline hover:opacity-70"
                  >
                    {confirmingTeamRevoke ? (isEN ? 'Tap to confirm' : 'Tocca per confermare') : (isEN ? 'Revoke consent' : 'Revoca consenso')}
                  </button>
                </div>
              ) : !showJoinTeamBox ? (
                <button onClick={() => setShowJoinTeamBox(true)} style={{ color: colors.mutedInk }} className="os-focus text-xs underline hover:opacity-70">
                  {isEN ? 'Followed by a team physio or trainer? Enter the code' : 'Fai parte di una squadra seguita da un fisio o preparatore? Inserisci il codice'}
                </button>
              ) : (
                <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-xl p-3.5">
                  <input type="text" value={joinTeamCode} onChange={(e) => { setJoinTeamCode(e.target.value.toUpperCase()); setJoinTeamStatus('idle'); }} placeholder={isEN ? 'Team code' : 'Codice squadra'} style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}`, color: colors.ink, letterSpacing: '0.08em' }} className="os-focus w-full rounded-lg px-3 py-2.5 text-sm mb-2 uppercase" />
                  <input type="text" value={joinTeamPlayerName} onChange={(e) => { setJoinTeamPlayerName(e.target.value); setJoinTeamStatus('idle'); }} placeholder={isEN ? 'Your name or nickname' : 'Il tuo nome o soprannome'} maxLength={40} style={{ backgroundColor: colors.paper, border: `1px solid ${colors.hairline}`, color: colors.ink }} className="os-focus w-full rounded-lg px-3 py-2.5 text-sm mb-3" />

                  <div style={{ backgroundColor: colors.paper }} className="rounded-lg p-3 mb-3">
                    <p style={{ color: colors.ink }} className="text-xs font-semibold mb-1.5">{isEN ? 'What gets shared with your team:' : 'Cosa viene condiviso con la squadra:'}</p>
                    <ul className="mb-2">
                      {[isEN ? 'Injury name' : 'Nome dell\'infortunio', isEN ? 'Recovery phase' : 'Fase di recupero', isEN ? 'Indicative recovery estimate' : 'Stima indicativa di recupero', isEN ? 'A summary wellness level (green/amber/red), only if you use the daily check-in' : 'Un livello di benessere riassuntivo (verde/giallo/rosso), solo se usi il check-in giornaliero'].map((t, i) => (
                        <li key={i} style={{ color: colors.mutedInk }} className="text-xs flex items-start gap-1.5 mb-1"><CheckCircle2 size={12} color={colors.accentDark} className="flex-shrink-0 mt-0.5" />{t}</li>
                      ))}
                    </ul>
                    <p style={{ color: colors.ink }} className="text-xs font-semibold mb-1.5">{isEN ? 'Never shared:' : 'Mai condiviso:'}</p>
                    <ul>
                      {[isEN ? 'Your daily journal and feelings' : 'Il tuo diario giornaliero e le sensazioni', isEN ? 'Your check-in answers (sleep, soreness, training load)' : 'Le tue risposte al check-in (sonno, indolenzimento, carico)', isEN ? 'Personal notes' : 'Note personali'].map((t, i) => (
                        <li key={i} style={{ color: colors.mutedInk }} className="text-xs flex items-start gap-1.5 mb-1"><X size={12} color={colors.red} className="flex-shrink-0 mt-0.5" />{t}</li>
                      ))}
                    </ul>
                    <p style={{ color: colors.mutedInk, borderTop: `1px solid ${colors.hairline}` }} className="text-[11px] leading-relaxed mt-2 pt-2">{isEN ? 'This also feeds anonymous, team-wide statistics (e.g. "3 ankle injuries this season") — never attributed to your name.' : 'Questi dati alimentano anche statistiche aggregate e anonime della squadra (es. "3 infortuni alla caviglia in stagione") — mai attribuite al tuo nome.'}</p>
                  </div>

                  <button onClick={() => setJoinTeamConsent(!joinTeamConsent)} role="checkbox" aria-checked={joinTeamConsent} className="os-focus w-full flex items-start gap-2.5 mb-3 text-left">
                    <div style={{ backgroundColor: joinTeamConsent ? colors.accent : colors.card, border: `1.5px solid ${joinTeamConsent ? colors.accent : colors.hairline}` }} className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5">
                      {joinTeamConsent && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </div>
                    <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'I agree to share this summary with my team\'s physio/trainer. I can revoke this at any time.' : 'Accetto di condividere questo riepilogo con il fisio/preparatore della squadra. Posso revocarlo in qualsiasi momento.'}</p>
                  </button>

                  <div className="flex gap-2">
                    <button onClick={joinTeam} disabled={joinTeamStatus === 'submitting'} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus flex-1 rounded-lg py-2.5 text-xs font-semibold">
                      {joinTeamStatus === 'submitting' ? '...' : (isEN ? 'Confirm' : 'Conferma')}
                    </button>
                    <button onClick={() => { setShowJoinTeamBox(false); setJoinTeamStatus('idle'); }} style={{ color: colors.mutedInk }} className="os-focus px-3 text-xs">{isEN ? 'Cancel' : 'Annulla'}</button>
                  </div>
                  {joinTeamStatus === 'notfound' && <p style={{ color: colors.red }} className="text-xs mt-2">{isEN ? 'Invalid code. Check it with your physio/trainer.' : 'Codice non valido. Controlla con il tuo fisio/preparatore.'}</p>}
                  {joinTeamStatus === 'error' && <p style={{ color: colors.red }} className="text-xs mt-2">{isEN ? 'Enter the code, your name, and confirm consent.' : 'Inserisci il codice, il tuo nome e conferma il consenso.'}</p>}
                </div>
              )}
            </div>
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

            <div className="h-5" aria-hidden="true" />
            <PremiumBanner onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} text={isEN ? 'When you\'re ready to return, Premium has the right training for your role' : 'Quando sarai pronto a tornare in campo, Premium ha l\'allenamento giusto per il tuo ruolo'} />
          </div>
        )}

        {screen === 'triage' && (
          <div>
            <FlowSteps current={triageRegion ? 1 : 0} isEN={isEN} />
            {!triageRegion ? (
              <>
                <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed mb-6">{isEN ? 'First, tap where you feel the problem — then a few fixed questions to narrow it down.' : 'Prima tocca dove senti il problema — poi qualche domanda fissa per restringere il campo.'}</p>
                <BodyDiagram onSelectRegion={(key) => setTriageRegion(key)} labels={regionLabels} isEN={isEN} title={isEN ? 'Where do you feel it?' : 'Dove senti il problema?'} />
              </>
            ) : (
              <>
                <button onClick={() => { setTriageRegion(null); setTriageAnswers({ mechanism: null, pop: null, weight: null, swelling: null }); }} style={{ color: colors.mutedInk }} className="os-focus flex items-center gap-1.5 text-xs mb-4 hover:opacity-70">
                  <RotateCcw size={12} />{isEN ? `Change area (${regionLabels[triageRegion]})` : `Cambia zona (${regionLabels[triageRegion]})`}
                </button>

                <div className="flex gap-1.5 mb-6">
                  {[triageAnswers.mechanism, triageAnswers.pop, triageAnswers.weight, triageAnswers.swelling].map((answered, i) => (
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
                      <span style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold">{isEN ? 'Can you move/use the area normally?' : 'Riesci a muovere/usare la zona normalmente?'}</span>
                    </p>
                    <div className="space-y-2">
                      {weightOptions.map((opt) => (
                        <button key={opt.key} onClick={() => answerTriage('weight', opt.key)}
                          style={{ backgroundColor: triageAnswers.weight === opt.key ? colors.accent : colors.card, color: triageAnswers.weight === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.weight === opt.key ? colors.accent : colors.hairline}` }}
                          className="os-focus w-full text-left px-4 py-3 rounded-lg text-sm transition-colors shadow-sm">{opt.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="flex items-center gap-2.5 mb-3">
                      <span style={{ ...displayFont, backgroundColor: colors.accentTint, color: colors.accentDark }} className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">4</span>
                      <span style={{ ...displayFont, color: colors.ink }} className="text-sm font-semibold">{isEN ? 'Is there visible swelling?' : 'C\'è gonfiore visibile?'}</span>
                    </p>
                    <div className="flex gap-2">
                      {swellingOptions.map((opt) => (
                        <button key={opt.key} onClick={() => answerTriage('swelling', opt.key)}
                          style={{ backgroundColor: triageAnswers.swelling === opt.key ? colors.accent : colors.card, color: triageAnswers.swelling === opt.key ? '#FFFFFF' : colors.ink, border: `1px solid ${triageAnswers.swelling === opt.key ? colors.accent : colors.hairline}` }}
                          className="os-focus flex-1 text-center px-3 py-3 rounded-lg text-xs font-medium transition-colors shadow-sm">{opt.label}</button>
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
                    <span style={displayFont} className="uppercase tracking-wide text-sm font-semibold">{isEN ? 'See the results' : 'Vedi i risultati'}</span><ArrowRight size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {screen === 'triageResults' && triageRegion && (
          <div>
            <FlowSteps current={1} isEN={isEN} onStep={() => setScreen('regions')} />
            <p style={{ color: colors.mutedInk }} className="text-sm leading-relaxed mb-5">{isEN ? 'Based on your answers, ordered from most to least likely. Not a diagnosis — just a starting point.' : 'In base alle tue risposte, dal più al meno probabile. Non è una diagnosi — solo un punto di partenza.'}</p>

            {(() => {
              const key = triageResults[triageCandidateIndex];
              const data = injuriesData[key];
              if (!data) return null;
              const score = computeTriageScore(key);
              const confidence = score >= 4 ? (isEN ? 'Strong match' : 'Corrispondenza alta') : score >= 2 ? (isEN ? 'Possible match' : 'Corrispondenza media') : (isEN ? 'Weak match' : 'Corrispondenza bassa');
              const confidenceColor = score >= 4 ? colors.accent : score >= 2 ? colors.orange : colors.mutedInk;
              const Icon = data.icon;
              return (
                <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-2xl p-5 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ backgroundColor: confidenceColor + '22', color: confidenceColor }} className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">{confidence}</span>
                    <span style={{ color: colors.mutedInk }} className="text-xs">{triageCandidateIndex + 1}/{triageResults.length}</span>
                  </div>
                  <div className="flex items-center gap-3.5 mb-2">
                    <div style={{ background: PITCH_BG }} className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">
                      <Icon size={26} color={LED_GREEN} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="text-[17px] font-bold leading-tight">{data.label}</p>
                      <p style={{ color: colors.mutedInk }} className="text-xs mt-0.5">{data.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {data.mechanismTags.map((t) => {
                      const MechIcon = mechanismIcons[t] || Zap;
                      return (
                        <span key={t} style={{ backgroundColor: colors.paper, color: colors.ink, border: `1px solid ${colors.hairline}` }} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          <MechIcon size={11} color={colors.accentDark} />{mechanismLabels[t]}
                        </span>
                      );
                    })}
                    <span style={{ backgroundColor: colors.heroBg, color: LED_GREEN, fontFamily: BEBAS, letterSpacing: '0.05em' }} className="inline-flex items-center gap-1 text-[13px] leading-none px-2 py-1 rounded-full" title={isEN ? 'Indicative return time, mild to severe' : 'Rientro indicativo, da lieve a severo'}>
                      <Timer size={11} />{recoveryRangeLabel(data.severityData, isEN)}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { setSelectedInjury(key); setScreen('tracker'); setEditingSetup(true); setSetupSection('gravita'); }} style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="os-focus flex-1 flex items-center justify-center gap-1.5 rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
                      {isEN ? 'Yes, this is it' : 'Sì, è questo'}<ArrowRight size={15} />
                    </button>
                    {triageCandidateIndex < triageResults.length - 1 && (
                      <button onClick={() => setTriageCandidateIndex(triageCandidateIndex + 1)} style={{ backgroundColor: colors.paper, color: colors.ink, border: `1px solid ${colors.hairline}` }} className="os-focus flex-1 rounded-lg py-3 text-sm font-medium hover:opacity-80 transition-opacity">
                        {isEN ? 'Not this one' : 'Non è questo'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <button onClick={() => openRegion(triageRegion)} style={{ color: colors.mutedInk }} className="os-focus text-xs underline hover:opacity-70 block mx-auto mt-2">{isEN ? 'See the full list for this area instead' : 'Vedi invece l\'elenco completo di questa zona'}</button>
          </div>
        )}

        {screen === 'injuries' && selectedRegion && regions[selectedRegion] && (() => {
          const regionInjuries = regions[selectedRegion].injuries.filter((k) => injuriesData[k]);
          return (
          <div>
            <FlowSteps current={1} isEN={isEN} onStep={() => setScreen('regions')} />
            <div style={{ background: PITCH_BG }} className="relative overflow-hidden rounded-3xl p-4 mb-3 shadow-lg flex items-center gap-4">
              <PitchArc size={180} />
              <div style={{ backgroundColor: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)' }} className="relative flex-shrink-0 rounded-2xl px-3.5 py-2.5">
                <RegionFigure region={selectedRegion} height={116} />
              </div>
              <div className="relative min-w-0">
                <p style={{ fontFamily: BRICOLAGE, color: LED_GREEN, letterSpacing: '0.14em' }} className="text-[10px] font-bold uppercase mb-1.5">{isEN ? 'Area' : 'Zona'}</p>
                <p style={{ fontFamily: BEBAS, color: '#FFFFFF' }} className="text-[38px] leading-[0.9]">{regionLabels[selectedRegion]}</p>
                <p style={{ color: 'rgba(255,255,255,0.72)' }} className="text-xs leading-snug mt-2">
                  {regionInjuries.length === 1
                    ? (isEN ? '1 injury with its recovery plan' : '1 infortunio con il suo percorso')
                    : (isEN ? `${regionInjuries.length} injuries, each with its own recovery plan` : `${regionInjuries.length} infortuni, ognuno con il suo percorso`)}
                </p>
              </div>
            </div>
            <p style={{ color: colors.mutedInk }} className="flex items-center gap-1.5 text-[11px] mb-4 px-1">
              <Timer size={12} className="flex-shrink-0" />{isEN ? 'Return times are indicative, from mild to severe' : 'Tempi di rientro indicativi, da lieve a severo'}
            </p>

            <div className="space-y-3">
              {regionInjuries.map((key) => {
                const data = injuriesData[key];
                const Icon = data.icon;
                const live = !!injuryDates[key];
                const liveMinute = live ? (() => {
                  const sd = data.severityData[injurySeverities[key] || 'moderato'] || data.severityData.moderato;
                  return Math.min(90, Math.max(0, Math.round((daysSince(injuryDates[key]) / sd.totalEstimateDays) * 90)));
                })() : 0;
                const matches = triageTag && data.mechanismTags.includes(triageTag);
                const symptomsOpen = expandedSymptoms === key;
                return (
                  <div key={key} style={{ backgroundColor: colors.card, border: `1.5px solid ${matches ? colors.accent : colors.hairline}`, boxShadow: matches ? `0 0 0 4px ${colors.accent}1F` : undefined }} className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <button onClick={() => chooseInjury(key)} className="os-focus w-full flex items-start gap-3.5 p-4 text-left">
                      <div style={{ background: PITCH_BG }} className="relative flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm">
                        <Icon size={26} color={LED_GREEN} />
                        {live && <span style={{ backgroundColor: LED_GREEN, border: `2px solid ${colors.card}` }} className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full os-live-dot" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {(matches || live) && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {matches && <span style={{ backgroundColor: colors.accent, color: '#FFFFFF' }} className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">{isEN ? 'Most likely this' : 'Probabilmente questo'}</span>}
                            {live && <span style={{ backgroundColor: colors.heroBg, color: LED_GREEN, fontFamily: BEBAS, letterSpacing: '0.05em' }} className="text-[13px] leading-none px-2 py-1 rounded-md">{isEN ? 'In progress' : 'In corso'} · {liveMinute}'</span>}
                          </div>
                        )}
                        <p style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="text-base font-bold leading-tight">{data.label}</p>
                        <p style={{ color: colors.mutedInk }} className="text-[13px] leading-snug mt-0.5">{data.subtitle}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {data.mechanismTags.map((t) => {
                            const MechIcon = mechanismIcons[t] || Zap;
                            return (
                              <span key={t} style={{ backgroundColor: colors.paper, color: colors.ink, border: `1px solid ${colors.hairline}` }} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                                <MechIcon size={11} color={colors.accentDark} />{mechanismLabels[t]}
                              </span>
                            );
                          })}
                          <span style={{ backgroundColor: colors.heroBg, color: LED_GREEN, fontFamily: BEBAS, letterSpacing: '0.05em' }} className="inline-flex items-center gap-1 text-[13px] leading-none px-2 py-1 rounded-full" title={isEN ? 'Indicative return time, mild to severe' : 'Rientro indicativo, da lieve a severo'}>
                            <Timer size={11} />{recoveryRangeLabel(data.severityData, isEN)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} color={colors.mutedInk} className="flex-shrink-0 mt-4" />
                    </button>
                    {data.symptoms && (
                      <>
                        <button onClick={() => setExpandedSymptoms(symptomsOpen ? null : key)} style={{ color: colors.accentDark, borderTop: `1px dashed ${colors.hairline}` }} className="os-focus w-full flex items-center justify-between gap-1.5 px-4 py-2.5 text-xs font-semibold">
                          <span className="flex items-center gap-1.5"><Info size={13} />{isEN ? 'Typical symptoms' : 'Sintomi tipici'}</span>
                          <ChevronDown size={13} style={{ transform: symptomsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                        </button>
                        {symptomsOpen && (
                          <div style={{ backgroundColor: colors.paper }} className="px-4 py-3 os-fadein">
                            <ul className="space-y-1.5 mb-2">
                              {data.symptoms.map((s, i) => (
                                <li key={i} style={{ color: colors.ink }} className="text-sm flex gap-2"><span style={{ backgroundColor: colors.accent }} className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[7px]" /><span>{s}</span></li>
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
            <div className="mt-5">
              <PremiumBanner onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} text={isEN ? 'Premium: training designed for each injury, matched to your role' : 'Premium: allenamento pensato per ogni infortunio, in base al tuo ruolo'} />
            </div>
          </div>
          );
        })()}


        {screen === 'tracker' && injury && phase && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div style={{ background: PITCH_BG }} className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
                <injury.icon size={22} color={LED_GREEN} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: BRICOLAGE, color: colors.ink }} className="text-[17px] font-bold leading-tight">{injury.label}</p>
                <p style={{ color: colors.mutedInk }} className="text-[12.5px] leading-snug mt-0.5">{injury.subtitle}</p>
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
                <FlowSteps current={2} isEN={isEN} onStep={(i) => { if (i === 0) setScreen('regions'); else { const r = regionOfInjury(selectedInjury, injuriesData); if (r) openRegion(r); } }} />

                <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-2xl p-4 mb-3 shadow-sm">
                  <StepHeading n={1} title={isEN ? 'How bad is it?' : 'Quanto è grave?'} hint={isEN ? 'It sets the phases and the indicative return time.' : 'Serve a regolare le fasi e il rientro indicativo.'} />
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(severityLabels).map((sev, si) => {
                      const on = severity === sev;
                      return (
                        <button key={sev} onClick={() => setSeverity(sev)} aria-pressed={on} style={{ backgroundColor: on ? colors.heroBg : colors.paper, border: `1.5px solid ${on ? colors.heroBg : colors.hairline}` }} className="os-focus rounded-xl px-2 py-3 text-center transition-colors">
                          <span className="flex items-end justify-center gap-0.5 h-4 mb-1.5" aria-hidden="true">
                            {[0, 1, 2].map((b) => <span key={b} style={{ height: 6 + b * 4, backgroundColor: b <= si ? (on ? LED_GREEN : colors.accent) : (on ? 'rgba(255,255,255,0.2)' : colors.hairline) }} className="w-1.5 rounded-full" />)}
                          </span>
                          <span style={{ fontFamily: BRICOLAGE, color: on ? '#FFFFFF' : colors.ink }} className="block text-sm font-bold">{severityLabels[sev]}</span>
                          <span style={{ fontFamily: BEBAS, color: on ? LED_GREEN : colors.mutedInk, letterSpacing: '0.04em' }} className="block text-[13px] leading-none mt-1">~{durationLabel(injury.severityData[sev].totalEstimateDays, isEN)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed mt-3">{severityInfo[severity]}</p>
                  {severity === 'severo' && (
                    <div style={{ backgroundColor: colors.redTint }} className="rounded-lg p-3 flex gap-2 mt-3">
                      <AlertTriangle size={15} color={colors.red} className="flex-shrink-0 mt-0.5" />
                      <p style={{ color: colors.red }} className="text-xs leading-relaxed">{isEN ? 'With severe severity, we recommend seeing a professional before starting this plan on your own.' : 'Con gravità severa ti consigliamo di sentire un professionista prima di iniziare da solo questo percorso.'}</p>
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: colors.card, border: `1px solid ${colors.hairline}` }} className="rounded-2xl p-4 mb-4 shadow-sm">
                  <StepHeading n={2} done={!!currentDate} title={isEN ? 'When did it start?' : 'Quando è iniziato?'} hint={isEN ? 'It starts the clock and puts you in the right phase.' : 'Fa partire il cronometro e ti mette nella fase giusta.'} />
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
                </div>

                <button onClick={skipDate} style={{ backgroundColor: colors.accent, color: '#FFFFFF', boxShadow: `0 8px 22px ${colors.accent}40` }} className="os-focus w-full flex items-center justify-center gap-2 rounded-xl py-4 font-medium hover:opacity-90 active:scale-[0.99] transition">
                  <span style={{ fontFamily: BRICOLAGE }} className="uppercase tracking-wide text-sm font-bold">{isEN ? 'Go to my recovery' : 'Vai al mio percorso'}</span><ArrowRight size={16} />
                </button>
                {!currentDate && <p style={{ color: colors.mutedInk }} className="text-[11px] text-center mt-2">{isEN ? 'You can add the date later too, with the pencil on your plan.' : 'Puoi aggiungere la data anche dopo, con la matita nel percorso.'}</p>}

                <SectionTitle className="mt-8" kicker={isEN ? 'Optional' : 'Facoltativo'} title={isEN ? 'For a more precise plan' : 'Per un percorso più preciso'} hint={isEN ? 'Not needed to start: open only what you need.' : 'Non servono per iniziare: apri solo quello che ti serve.'} />
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

                <SectionTitle className="mt-7" tone="gold" kicker="Premium" title={isEN ? 'With Premium' : 'Con Premium'} />
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
                        <span style={{ background: GOLD_GRADIENT, color: '#0B121A' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shadow-sm">{isEN ? 'Unlock Premium' : 'Sblocca Premium'}</span>
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
                        <span style={{ background: GOLD_GRADIENT, color: '#0B121A' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shadow-sm">{isEN ? 'Unlock Premium' : 'Sblocca Premium'}</span>
                      </button>
                    </div>
                  )}
                  <p style={{ color: colors.mutedInk }} className="text-[11px] leading-relaxed mt-2.5">{isEN ? 'Your real progress over time — useful to track and to share with a professional.' : 'Il tuo vero andamento nel tempo — utile da tracciare e da mostrare a un professionista.'}</p>
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
                        <span style={{ background: GOLD_GRADIENT, color: '#0B121A' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full shadow-sm">{isEN ? 'Unlock' : 'Sblocca'}</span>
                      </button>
                    </div>
                  ) : (
                    <p style={{ color: colors.mutedInk }} className="text-xs leading-relaxed">{isEN ? 'Find your full printable summary (with charts and role-specific training) in the Percorso tab, once you start tracking.' : 'Trovi il riepilogo completo stampabile (con grafici e allenamento per ruolo) nella scheda Percorso, una volta iniziato a tracciare.'}</p>
                  )}
                </SetupSection>
              </div>
            ) : (
              <>
                <div style={{ background: PITCH_BG }} className="rounded-3xl p-5 mb-3 shadow-lg relative overflow-hidden">
                  <PitchArc size={190} />
                  <button onClick={() => setEditingSetup(true)} style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} className="os-focus absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all z-10" aria-label={isEN ? 'Edit severity, date and more' : 'Modifica gravità, data e altro'}>
                    <Pencil size={14} color={colors.accent} />
                  </button>
                  <p style={{ ...displayFont, color: colors.accent, letterSpacing: '0.14em' }} className="text-[11px] font-bold uppercase mb-2 relative">{isEN ? `Phase ${activePhase + 1} of ${injury.phases.length}` : `Fase ${activePhase + 1} di ${injury.phases.length}`}</p>

                  <div className="relative">
                    {currentDate ? (() => {
                      const dayNum = daysSince(currentDate);
                      const rawMinute = Math.round((dayNum / totalEstimateDays) * 90);
                      const minuteNumber = Math.min(rawMinute, 90);
                      const overtime = rawMinute > 90;
                      return (
                        <div className="mb-4">
                          <MatchClock minute={minuteNumber} overtime={overtime} segments={segments} daysLeft={totalEstimateDays - dayNum} isEN={isEN} />
                        </div>
                      );
                    })() : (
                      <div className="flex items-center gap-3 py-2 mb-2">
                        <Trophy size={26} color={colors.accent} />
                        <span style={{ color: '#9FB3A8' }} className="text-sm">{isEN ? 'Add a date to start the clock' : 'Aggiungi una data per far partire il cronometro'}</span>
                      </div>
                    )}
                    <p style={{ ...displayFont, color: '#FFFFFF', letterSpacing: '-0.01em' }} className="text-xl font-bold uppercase leading-[1.15] mb-1">{phase.name}</p>
                    <p style={{ color: '#9FB3A8' }} className="text-[13px] leading-snug">{phaseRangeLabel(activePhase, dayThresholds, isEN)} · {isEN ? 'severity' : 'gravità'} {severityLabels[severity].toLowerCase()}</p>
                    {premiumUnlocked && playerPosition && <p style={{ ...displayFont, color: colors.premiumGold }} className="text-[11px] font-bold mt-1.5">{playerPositions.find((p) => p.key === playerPosition)?.label}</p>}
                  </div>
                </div>

                <SectionNav
                  isEN={isEN}
                  items={[
                    { id: 'oggi', icon: Flame, label: isEN ? 'Today' : 'Oggi', onClick: () => scrollToId('sez-oggi') },
                    { id: 'fase', icon: Activity, label: isEN ? 'Phase' : 'Fase', badge: `${activePhase + 1}/${injury.phases.length}`, onClick: () => scrollToId('sez-fase') },
                    { id: 'esercizi', icon: Dumbbell, label: isEN ? 'Exercises' : 'Esercizi', badge: `${completedCount}/${phase.exercises.length}`, onClick: () => { setTrackerSection('esercizi'); setTimeout(() => scrollToId('sez-esercizi'), 60); } },
                    ...(injury.relatedInjuries && injury.relatedInjuries.length > 0 ? [{ id: 'collegati', icon: ArrowLeftRight, label: isEN ? 'Related' : 'Collegati', onClick: () => scrollToId('sez-collegati') }] : []),
                  ]}
                />
                <SectionTitle id="sez-oggi" className="mt-6" kicker={isEN ? 'Today' : 'Oggi'} title={isEN ? "Today's session" : 'La sessione di oggi'} hint={currentDate ? (isEN ? 'How you feel, then tick the session: it keeps your streak alive.' : 'Come ti senti, poi spunta la sessione: tiene viva la serie.') : null} />
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

                <SectionTitle id="sez-fase" className="mt-8" kicker={isEN ? 'Your phase' : 'La tua fase'} title={isEN ? 'Where you are in recovery' : 'Dove sei nel recupero'} hint={isEN ? 'Each phase has its goal: move on when you meet the criteria.' : 'Ogni fase ha il suo obiettivo: passa alla successiva quando superi i criteri.'} />
                <div className="flex items-stretch gap-1.5 mb-3">
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

                <SectionTitle id="sez-esercizi" className="mt-8" kicker={isEN ? 'Training' : 'Allenamento'} title={isEN ? 'Exercises for this phase' : 'Gli esercizi di questa fase'} />

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
                            <span style={{ background: GOLD_GRADIENT, color: '#0B121A' }} className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">{isEN ? 'Unlock' : 'Sblocca'}</span>
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
                  <div className="mb-3">
                    <DrillProgress doneFlags={phase.exercises.map((_, i) => !!phaseProgress[i])} isEN={isEN} showCount={false} />
                  </div>
                  <p style={{ color: colors.mutedInk }} className="text-[11px] mb-3">{isEN ? 'Adjust them to how your body responds, don\'t push through sharp pain.' : 'Adattali a come risponde il tuo corpo, non forzare sul dolore acuto.'}</p>
                  <div className="space-y-2.5">
                    {phase.exercises.map((ex, i) => {
                      const exKey = `${activePhase}-${i}`;
                      const isVideoOpen = activeVideo === exKey;
                      return (
                        <DrillCard
                          key={exKey}
                          index={i}
                          ex={ex}
                          catLabel={catLabels[ex.cat]}
                          done={!!phaseProgress[i]}
                          onToggle={() => toggleExercise(i)}
                          helpOpen={isVideoOpen}
                          onToggleHelp={() => setActiveVideo(isVideoOpen ? null : exKey)}
                          isEN={isEN}
                        />
                      );
                    })}
                  </div>
                </SetupSection>

                <PremiumBanner onClick={() => { trackEvent('premium_banner_clicked'); setScreen('premium'); }} text={isEN ? 'Premium: your progress over time + a document for your physio' : 'Premium: il tuo andamento nel tempo + un documento per il fisio'} />

                    {injury.relatedInjuries && injury.relatedInjuries.length > 0 && (
                      <div style={{ borderTop: `1px solid ${colors.hairline}` }} className="mt-6 pt-5">
                        <SectionTitle id="sez-collegati" kicker={isEN ? 'Connected to' : 'Collegato a'} title={isEN ? 'Related injuries' : 'Infortuni collegati'} hint={injury.relatedReason} />
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
        <a href="/privacy.html" style={{ color: colors.mutedInk }} className="os-focus block mt-2 underline hover:opacity-70">
          {isEN ? 'Privacy Policy' : 'Informativa sulla Privacy'}
        </a>
      </div>

      {!TEAM_SCREENS.includes(screen) && <BottomNav screen={screen} isEN={isEN} onNavigate={handleBottomNav} />}
      {celebration && <GoalCelebration streak={celebration.streak} isEN={isEN} onClose={() => setCelebration(null)} />}
      {!cookieChoice && <CookieBanner isEN={isEN} onChoice={handleCookieChoice} />}
    </div>
  );
}