// src/sources.js
// Fonti scientifiche citate dentro l'app (richieste da Apple, linea guida 1.4.1).
// Ogni riferimento è stato controllato su PubMed il 5 novembre 2026: titolo, rivista, anno, volume e DOI
// corrispondono alla scheda PubMed (p = numero PMID, d = DOI quando esiste).
// k = tipo di documento: guideline | consensus | sr (revisione sistematica / meta-analisi) | review | rct | cohort
//
// Per aggiungere una fonte: inserisci una voce in SOURCES, poi il suo id nell'infortunio in INJURY_SOURCES
// (o in un gruppo di GENERAL_SOURCE_GROUPS). Il PMID si trova nell'indirizzo della pagina su pubmed.ncbi.nlm.nih.gov.

export const SOURCES = {
  // ---- primi soccorsi, segnali d'allarme, fasi e rientro ----
  peace: { k: 'review', a: 'Dubois B, Esculier JF', t: 'Soft-tissue injuries simply need PEACE and LOVE', j: 'Br J Sports Med 2020;54:72', p: '31377722', d: '10.1136/bjsports-2019-101253' },
  ottawa: { k: 'sr', a: 'Bachmann LM et al.', t: 'Accuracy of Ottawa ankle rules to exclude fractures of the ankle and mid-foot: systematic review', j: 'BMJ 2003;326:417', p: '12595378', d: '10.1136/bmj.326.7386.417' },
  rts2016: { k: 'consensus', a: 'Ardern CL et al.', t: '2016 Consensus statement on return to sport from the First World Congress in Sports Physical Therapy, Bern', j: 'Br J Sports Med 2016;50:853', p: '27226389', d: '10.1136/bjsports-2016-096278' },

  // ---- riscaldamento, prevenzione, screening ----
  fifa: { k: 'rct', a: 'Soligard T et al.', t: 'Comprehensive warm-up programme to prevent injuries in young female footballers: cluster randomised controlled trial', j: 'BMJ 2008;337:a2469', p: '19066253', d: '10.1136/bmj.a2469' },
  fifaMeta: { k: 'sr', a: 'Thorborg K et al.', t: 'Effect of specific exercise-based football injury prevention programmes on the overall injury rate in football: a systematic review and meta-analysis of the FIFA 11 and 11+ programmes', j: 'Br J Sports Med 2017;51:562', p: '28087568', d: '10.1136/bjsports-2016-097066' },
  aclPrev: { k: 'guideline', a: 'Arundale AJH et al.', t: 'Exercise-Based Knee and Anterior Cruciate Ligament Injury Prevention', j: 'J Orthop Sports Phys Ther 2018;48:A1', p: '30170521', d: '10.2519/jospt.2018.0303' },
  nordic: { k: 'sr', a: 'van Dyk N et al.', t: 'Including the Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: a systematic review and meta-analysis of 8459 athletes', j: 'Br J Sports Med 2019;53:1362', p: '30808663', d: '10.1136/bjsports-2018-100045' },
  copenhagen: { k: 'rct', a: 'Harøy J et al.', t: 'The Adductor Strengthening Programme prevents groin problems among male football players: a cluster-randomised controlled trial', j: 'Br J Sports Med 2019;53:150', p: '29891614', d: '10.1136/bjsports-2017-098937' },
  screening: { k: 'review', a: 'Bahr R', t: 'Why screening tests to predict injury do not work—and probably never will…: a critical review', j: 'Br J Sports Med 2016;50:776', p: '27095747', d: '10.1136/bjsports-2016-096256' },

  // ---- caviglia e piede ----
  ankleCpg: { k: 'guideline', a: 'Martin RL et al.', t: 'Ankle Stability and Movement Coordination Impairments: Lateral Ankle Ligament Sprains Revision 2021', j: 'J Orthop Sports Phys Ther 2021;51:CPG1', p: '33789434', d: '10.2519/jospt.2021.0302' },
  ankleBjsm: { k: 'guideline', a: 'Vuurberg G et al.', t: 'Diagnosis, treatment and prevention of ankle sprains: update of an evidence-based clinical guideline', j: 'Br J Sports Med 2018;52:956', p: '29514819', d: '10.1136/bjsports-2017-098106' },
  achillesCpg: { k: 'guideline', a: 'Martin RL et al.', t: 'Achilles Pain, Stiffness, and Muscle Power Deficits: Midportion Achilles Tendinopathy Revision 2018', j: 'J Orthop Sports Phys Ther 2018;48:A1', p: '29712543', d: '10.2519/jospt.2018.0302' },
  atr: { k: 'sr', a: 'Ochen Y et al.', t: 'Operative treatment versus nonoperative treatment of Achilles tendon ruptures: systematic review and meta-analysis', j: 'BMJ 2019;364:k5120', p: '30617123', d: '10.1136/bmj.k5120' },
  plantarCpg: { k: 'guideline', a: 'Martin RL et al.', t: 'Heel pain-plantar fasciitis: revision 2014', j: 'J Orthop Sports Phys Ther 2014;44:A1', p: '25361863', d: '10.2519/jospt.2014.0303' },
  plantarGuide: { k: 'guideline', a: 'Morrissey D et al.', t: 'Management of plantar heel pain: a best practice guide informed by a systematic review, expert clinical reasoning and patient values', j: 'Br J Sports Med 2021;55:1106', p: '33785535', d: '10.1136/bjsports-2019-101970' },
  plantarRct: { k: 'rct', a: 'Rathleff MS et al.', t: 'High-load strength training improves outcome in patients with plantar fasciitis: A randomized controlled trial with 12-month follow-up', j: 'Scand J Med Sci Sports 2015;25:e292', p: '25145882', d: '10.1111/sms.12313' },
  mtss: { k: 'review', a: 'Moen MH et al.', t: 'Medial tibial stress syndrome: a critical review', j: 'Sports Med 2009;39:523', p: '19530750', d: '10.2165/00007256-200939070-00002' },
  calf: { k: 'review', a: 'Dixon JB', t: 'Gastrocnemius vs. soleus strain: how to differentiate and deal with calf muscle injuries', j: 'Curr Rev Musculoskelet Med 2009;2:74', p: '19468870', d: '10.1007/s12178-009-9045-8' },
  blisterKnapik: { k: 'review', a: 'Knapik JJ et al.', t: 'Friction blisters. Pathophysiology, prevention and treatment', j: 'Sports Med 1995;20:136', p: '8570998', d: '10.2165/00007256-199520030-00002' },
  blisterRushton: { k: 'review', a: 'Rushton et al.', t: 'Friction Blisters of the Feet: A Critical Assessment of Current Prevention Strategies', j: 'J Athl Train 2024', p: '36701678', d: '10.4085/1062-6050-0341.22' },

  // ---- ginocchio ----
  pfpCpg: { k: 'guideline', a: 'Willy RW et al.', t: 'Patellofemoral Pain', j: 'J Orthop Sports Phys Ther 2019;49:CPG1', p: '31475628', d: '10.2519/jospt.2019.0302' },
  pfpConsensus: { k: 'consensus', a: 'Collins NJ et al.', t: '2018 Consensus statement on exercise therapy and physical interventions (orthoses, taping and manual therapy) to treat patellofemoral pain', j: 'Br J Sports Med 2018;52:1170', p: '29925502', d: '10.1136/bjsports-2018-099397' },
  patellar: { k: 'review', a: 'Malliaras P et al.', t: 'Patellar Tendinopathy: Clinical Diagnosis, Load Management, and Advice for Challenging Case Presentations', j: 'J Orthop Sports Phys Ther 2015;45:887', p: '26390269', d: '10.2519/jospt.2015.5987' },
  meniscus: { k: 'guideline', a: 'Logerstedt DS et al.', t: 'Knee Pain and Mobility Impairments: Meniscal and Articular Cartilage Lesions Revision 2018', j: 'J Orthop Sports Phys Ther 2018;48:A1', p: '29385940', d: '10.2519/jospt.2018.0301' },
  mclAndrews: { k: 'review', a: 'Andrews K et al.', t: 'Review: Medial collateral ligament injuries', j: 'J Orthop 2017;14:550', p: '28878515', d: '10.1016/j.jor.2017.07.017' },
  mclPhisitkul: { k: 'review', a: 'Phisitkul P et al.', t: 'MCL injuries of the knee: current concepts review', j: 'Iowa Orthop J 2006;26:77', p: '16789454' },
  lcl: { k: 'review', a: 'Grawe B et al.', t: 'Lateral Collateral Ligament Injury About the Knee: Anatomy, Evaluation, and Management', j: 'J Am Acad Orthop Surg 2018;26:e120', p: '29443704', d: '10.5435/JAAOS-D-16-00028' },
  itb: { k: 'sr', a: 'Sánchez-Alvarado et al.', t: 'Effects of conservative treatment strategies for iliotibial band syndrome on pain and function in runners: a systematic review', j: 'Front Sports Act Living 2024', p: '39247485', d: '10.3389/fspor.2024.1386456' },
  osgoodRathleff: { k: 'cohort', a: 'Rathleff MS et al.', t: 'Activity Modification and Knee Strengthening for Osgood-Schlatter Disease: A Prospective Cohort Study', j: 'Orthop J Sports Med 2020;8', p: '32284945', d: '10.1177/2325967120911106' },
  osgoodGholve: { k: 'review', a: 'Gholve PA et al.', t: 'Osgood Schlatter syndrome', j: 'Curr Opin Pediatr 2007;19:44', p: '17224661', d: '10.1097/MOP.0b013e328013dbea' },

  // ---- coscia, anca, inguine, schiena ----
  hamstring: { k: 'review', a: 'Heiderscheit BC et al.', t: 'Hamstring strain injuries: recommendations for diagnosis, rehabilitation, and injury prevention', j: 'J Orthop Sports Phys Ther 2010;40:67', p: '20118524', d: '10.2519/jospt.2010.3047' },
  quad: { k: 'review', a: 'Kary JM', t: 'Diagnosis and management of quadriceps strains and contusions', j: 'Curr Rev Musculoskelet Med 2010;3:26', p: '21063497', d: '10.1007/s12178-010-9064-5' },
  doha: { k: 'consensus', a: 'Weir A et al.', t: 'Doha agreement meeting on terminology and definitions in groin pain in athletes', j: 'Br J Sports Med 2015;49:768', p: '26031643', d: '10.1136/bjsports-2015-094869' },
  groinThorborg: { k: 'review', a: 'Thorborg K et al.', t: 'Clinical Examination, Diagnostic Imaging, and Testing of Athletes With Groin Pain: An Evidence-Based Approach to Effective Management', j: 'J Orthop Sports Phys Ther 2018;48:239', p: '29510653', d: '10.2519/jospt.2018.7850' },
  groinHolmich: { k: 'rct', a: 'Hölmich P et al.', t: 'Effectiveness of active physical training as treatment for long-standing adductor-related groin pain in athletes: randomised trial', j: 'Lancet 1999;353:439', p: '9989713', d: '10.1016/S0140-6736(98)03340-6' },
  hipAnderson: { k: 'review', a: 'Anderson K et al.', t: 'Hip and groin injuries in athletes', j: 'Am J Sports Med 2001;29:521', p: '11476397', d: '10.1177/03635465010290042501' },
  piriformis: { k: 'sr', a: 'Hopayian K et al.', t: 'Four symptoms define the piriformis syndrome: an updated systematic review of its clinical features', j: 'Eur J Orthop Surg Traumatol 2017', p: '28836092', d: '10.1007/s00590-017-2031-8' },
  deepGluteal: { k: 'sr', a: 'Park JW et al.', t: 'Deep gluteal syndrome as a cause of posterior hip pain and sciatica-like pain', j: 'Bone Joint J 2020', p: '32349600', d: '10.1302/0301-620X.102B5.BJJ-2019-1212.R1' },
  gluteal: { k: 'rct', a: 'Mellor R et al.', t: 'Education plus exercise versus corticosteroid injection use versus a wait and see approach on global outcome and pain from gluteal tendinopathy: prospective, single blinded, randomised clinical trial', j: 'BMJ 2018;361:k1662', p: '29720374', d: '10.1136/bmj.k1662' },
  lbpAcp: { k: 'guideline', a: 'Qaseem A et al.', t: 'Noninvasive Treatments for Acute, Subacute, and Chronic Low Back Pain: A Clinical Practice Guideline From the American College of Physicians', j: 'Ann Intern Med 2017;166:514', p: '28192789', d: '10.7326/M16-2367' },
  lbpLancet: { k: 'review', a: 'Foster NE et al.', t: 'Prevention and treatment of low back pain: evidence, challenges, and promising directions', j: 'Lancet 2018;391:2368', p: '29573872', d: '10.1016/S0140-6736(18)30489-6' },
  cramps: { k: 'review', a: 'Schwellnus MP', t: 'Cause of exercise associated muscle cramps (EAMC)—altered neuromuscular control, dehydration or electrolyte depletion?', j: 'Br J Sports Med 2009;43:401', p: '18981039', d: '10.1136/bjsm.2008.050401' },

  // ---- spalla, braccio, mano ----
  shoulderPieters: { k: 'sr', a: 'Pieters L et al.', t: 'An Update of Systematic Reviews Examining the Effectiveness of Conservative Physical Therapy Interventions for Subacromial Shoulder Pain', j: 'J Orthop Sports Phys Ther 2020;50:131', p: '31726927', d: '10.2519/jospt.2020.8498' },
  shoulderDoiron: { k: 'sr', a: 'Doiron-Cadrin P et al.', t: 'Shoulder Rotator Cuff Disorders: A Systematic Review of Clinical Practice Guidelines and Semantic Analyses of Recommendations', j: 'Arch Phys Med Rehabil 2020', p: '32007452', d: '10.1016/j.apmr.2019.12.017' },
  acJoint: { k: 'sr', a: 'Beitzel K et al.', t: 'Current concepts in the treatment of acromioclavicular joint dislocations', j: 'Arthroscopy 2013;29:387', p: '23369483', d: '10.1016/j.arthro.2012.11.023' },
  biceps: { k: 'review', a: 'Churgay CA', t: 'Diagnosis and treatment of biceps tendinitis and tendinosis', j: 'Am Fam Physician 2009;80:470', p: '19725488' },
  handAvery: { k: 'review', a: 'Avery DM et al.', t: 'Sports-related wrist and hand injuries: a review', j: 'J Orthop Surg Res 2016;11:99', p: '27633260', d: '10.1186/s13018-016-0432-8' },
  fingerPeterson: { k: 'review', a: 'Peterson JJ, Bancroft LW', t: 'Injuries of the fingers and thumb in the athlete', j: 'Clin Sports Med 2006;25:527', p: '16798141', d: '10.1016/j.csm.2006.02.001' },
  thumbHeyman: { k: 'review', a: 'Heyman P', t: 'Injuries to the Ulnar Collateral Ligament of the Thumb Metacarpophalangeal Joint', j: 'J Am Acad Orthop Surg 1997;5:224', p: '10797225', d: '10.5435/00124635-199707000-00006' },
};

// Gruppi di contenuti "generali" (non legati a un solo infortunio).
export const GENERAL_SOURCE_GROUPS = [
  {
    id: 'firstaid',
    it: 'Primi soccorsi, segnali d\'allarme e fasi del percorso',
    en: 'First aid, warning signs and recovery phases',
    noteIt: 'Gestione iniziale dei traumi dei tessuti molli, quando serve una radiografia, criteri per tornare a giocare.',
    noteEn: 'Early management of soft-tissue injuries, when an X-ray is needed, criteria for returning to play.',
    ids: ['peace', 'ottawa', 'rts2016'],
  },
  {
    id: 'prevention',
    it: 'Riscaldamento e prevenzione',
    en: 'Warm-up and prevention',
    noteIt: 'Programmi di riscaldamento e di rinforzo studiati nel calcio e negli sport di squadra.',
    noteEn: 'Warm-up and strengthening programmes studied in football and team sports.',
    ids: ['fifa', 'fifaMeta', 'aclPrev', 'nordic', 'copenhagen'],
  },
  {
    id: 'screening',
    it: 'Screening del movimento con la fotocamera',
    en: 'Camera movement screening',
    noteIt: 'Perché un test di movimento è solo indicativo e non prevede gli infortuni con certezza.',
    noteEn: 'Why a movement test is only indicative and cannot predict injuries with certainty.',
    ids: ['screening'],
  },
];

// Fonti per ogni scheda infortunio (chiavi = quelle di injuriesData).
export const INJURY_SOURCES = {
  ankle: ['ankleCpg', 'ankleBjsm', 'ottawa'],
  achilles: ['achillesCpg'],
  achilles_rupture: ['atr'],
  knee: ['pfpCpg', 'pfpConsensus'],
  mcl: ['mclAndrews', 'mclPhisitkul'],
  patellar: ['patellar'],
  meniscus: ['meniscus'],
  itband: ['itb'],
  osgood: ['osgoodRathleff', 'osgoodGholve'],
  hamstring: ['hamstring', 'nordic'],
  quad: ['quad'],
  contusion: ['quad'],
  calf: ['calf'],
  shinsplints: ['mtss'],
  plantarfasciitis: ['plantarCpg', 'plantarGuide', 'plantarRct'],
  groin: ['doha', 'groinThorborg', 'groinHolmich', 'copenhagen'],
  hipflexor: ['doha', 'groinThorborg', 'hipAnderson'],
  piriformis: ['piriformis', 'deepGluteal'],
  trochanteric: ['gluteal'],
  lcl: ['lcl'],
  cramps: ['cramps'],
  blisters: ['blisterKnapik', 'blisterRushton'],
  lowback: ['lbpAcp', 'lbpLancet'],
  shoulder_impingement: ['shoulderPieters', 'shoulderDoiron'],
  ac_joint: ['acJoint'],
  bicep_tendinopathy: ['biceps'],
  wrist_sprain: ['handAvery'],
  finger_jam: ['fingerPeterson', 'handAvery'],
  thumb_sprain: ['thumbHeyman', 'fingerPeterson'],
};

export const SOURCE_KIND_LABELS = {
  it: { guideline: 'Linea guida', consensus: 'Consenso di esperti', sr: 'Revisione sistematica', review: 'Revisione', rct: 'Studio randomizzato', cohort: 'Studio osservazionale' },
  en: { guideline: 'Guideline', consensus: 'Expert consensus', sr: 'Systematic review', review: 'Review', rct: 'Randomized trial', cohort: 'Cohort study' },
};

export const SOURCES_CHECKED_ON = { it: '5 novembre 2026', en: 'November 5, 2026' };
