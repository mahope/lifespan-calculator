// The lifestyle questionnaire and the evidence behind it (#7, #93).
//
// One table drives the form, the calculation, the coaching suggestions and the
// share-link validation. Every factor says whether it counts in the sum
// (`inSum`), how strong its evidence is, and which source its numbers come from.
// Years are relative to the stated reference group of the source (never-smoker,
// inactive, BMI 18.5-24.9, up to ~8 drinks a week), not to "the average Dane";
// see audit/data/DATA-REPORT.md (branch docs/audit-2026-11-05), Appendix A.

/** Shown after every helper text, in one place (see LifestyleFactor). */
export const ASSOCIATION_NOTE = 'Sammenhæng, ikke garanti.';

export const EVIDENCE_LABELS = {
  strong: 'stærk',
  moderate: 'moderat',
  weak: 'svag',
  none: 'ingen',
};

/**
 * The questionnaire, in render order.
 *
 * Option `value` is the stored answer (and the number packed into a share
 * link); `years` is the effect that counts in the sum. 0 is always the neutral
 * default, so an option with value 0 must have years 0. Factors with
 * `inSum: false` are still asked but never change the estimate.
 * `source.range` is the signed span of effects the source supports; every
 * non-zero `years` of an `inSum` factor must lie inside it (tested).
 */
export const LIFESTYLE_FACTORS = [
  {
    key: 'smoking',
    icon: '🚭',
    label: 'Rygning',
    inSum: true,
    evidence: 'strong',
    source: {
      cite: 'Jha m.fl., NEJM 2013; Pirie m.fl., Lancet 2013; Doll m.fl., BMJ 2004',
      pmid: '23343063',
      figure:
        'Rygere mister i gennemsnit mindst 10 leveår sammenlignet med aldrig-rygere, og 1-10 cigaretter om dagen næsten fordobler dødeligheden. Stopper man før 40 år, undgår man omkring 90 % af merdødeligheden; at stoppe som 50-årig genvinder ca. 6 af de ca. 10 år.',
      range: { min: -12, max: -1 },
    },
    options: [
      { value: 0, years: 0, label: 'Ryger ikke' },
      { value: 11, years: -1, label: 'Tidligere ryger, stoppet før 40' },
      { value: 12, years: -3.5, label: 'Tidligere ryger, stoppet 40-49' },
      { value: 13, years: -5, label: 'Tidligere ryger, stoppet 50+' },
      { value: -5, years: -6, label: 'Let (1-10/dag)' },
      { value: -10, years: -10, label: 'Kraftig (10+/dag)' },
    ],
  },
  {
    key: 'exercise',
    icon: '🏃‍♂️',
    label: 'Motion',
    inSum: true,
    evidence: 'strong',
    source: {
      cite: 'Moore m.fl., PLoS Medicine 2012',
      pmid: '23139642',
      figure:
        'Ca. 150 min/uge giver ca. 3,4 år (3,2-3,6) længere liv end ingen aktivitet; den mest aktive gruppe (22,5+ MET-timer/uge) ca. 4,5 år (4,3-4,7), og selv under 75 min/uge ca. 1,8 år.',
      range: { min: 1.6, max: 4.7 },
    },
    options: [
      { value: 0, years: 0, label: 'Ingen' },
      { value: 2, years: 2, label: 'Let (1-3 t/uge)' },
      { value: 4, years: 3.5, label: 'Moderat (4-6 t/uge)' },
      { value: 6, years: 4.5, label: 'Intensiv (7+ t/uge)' },
    ],
  },
  {
    key: 'diet',
    icon: '🍎',
    label: 'Kost',
    inSum: true,
    evidence: 'moderate',
    source: {
      cite: 'Fadnes m.fl., PLoS Medicine 2022',
      pmid: '35134067',
      figure:
        'Modelberegning: en varig omlægning fra typisk vestlig kost til en mere sund kost giver ca. 6,2 år (3,5-8,1) for kvinder og 7,3 år (4,7-9,5) for mænd, hvis den påbegyndes som 20-årig. Jo senere start, jo mindre gevinst. Det er en modelberegning, ikke et forsøg.',
      range: { min: 3.5, max: 9.5 },
    },
    options: [
      { value: 0, years: 0, label: 'Gennemsnitlig' },
      { value: 3, years: 3.5, label: 'Sund' },
      { value: 5, years: 5, label: 'Meget sund' },
    ],
  },
  {
    key: 'alcohol',
    icon: '🍷',
    label: 'Alkohol',
    inSum: true,
    evidence: 'strong',
    source: {
      cite: 'Wood m.fl., Lancet 2018',
      pmid: '29676281',
      figure:
        'Risikoen er lavest ved op til ca. 100 g alkohol om ugen (ca. 8 genstande). Forventet levetid ved 40 år er ca. ½ år kortere ved 100-200 g om ugen, 1-2 år ved 200-350 g og 4-5 år ved over 350 g. 1 genstand = 12 g ren alkohol; Sundhedsstyrelsen anbefaler højst 10 om ugen.',
      range: { min: -5, max: -0.5 },
    },
    options: [
      { value: 0, years: 0, label: 'Op til 8 genstande/uge' },
      { value: 11, years: -0.5, label: '9-16/uge' },
      { value: 12, years: -1.5, label: '17-29/uge' },
      { value: 13, years: -4.5, label: '30+/uge' },
    ],
  },
  {
    key: 'sleep',
    icon: '😴',
    label: 'Søvn',
    inSum: true,
    evidence: 'moderate',
    source: {
      cite: 'Cappuccio m.fl., Sleep 2010; Yin m.fl., JAHA 2017',
      pmid: '20469800',
      figure:
        'Både kort og lang søvn er forbundet med højere dødelighed: kort søvn RR 1,12 (1,06-1,18), lang søvn RR 1,30 (1,22-1,38), lavest ved ca. 7 timer. Omregningen til leveår er vores skøn, og en del af sammenhængen skyldes sandsynligvis, at sygdom påvirker søvnen.',
      range: { min: -3, max: -0.5 },
    },
    options: [
      { value: -2, years: -1.5, label: '<5 timer' },
      { value: -1, years: -1, label: '5-6 timer' },
      { value: 0, years: 0, label: '7-8 timer' },
      { value: 11, years: -2, label: '9+ timer' },
    ],
  },
  {
    key: 'stress',
    icon: '😰',
    label: 'Stress',
    inSum: false,
    evidence: 'weak',
    source: {
      cite: 'Kivimäki m.fl., Lancet 2012',
      pmid: '22981903',
      figure:
        'Langvarig stress på arbejdet (job strain) er forbundet med 23 % højere risiko for hjertesygdom (HR 1,23; 1,10-1,37). Der findes ingen pålidelig effektstørrelse i leveår.',
    },
    options: [
      { value: 2, years: 0, label: 'Lavt' },
      { value: 0, years: 0, label: 'Moderat' },
      { value: -2, years: 0, label: 'Højt' },
      { value: -4, years: 0, label: 'Meget højt' },
    ],
  },
  {
    key: 'health',
    icon: '🏥',
    label: 'Sundhedstilstand',
    inSum: false,
    evidence: 'none',
    info: 'Prognosen ved kendt sygdom er ikke et livsstilsvalg og kan ikke vurderes her. Tal med din læge.',
    options: [
      { value: 0, years: 0, label: 'Ingen sygdomme' },
      { value: -2, years: 0, label: '1 kronisk sygdom' },
      { value: -5, years: 0, label: '2+ sygdomme' },
    ],
  },
  {
    key: 'bmi',
    icon: '⚖️',
    label: 'BMI/Vægt',
    inSum: true,
    evidence: 'strong',
    source: {
      cite: 'Global BMI Mortality Collaboration, Lancet 2016; Prospective Studies Collaboration, Lancet 2009',
      pmid: '27423262',
      figure:
        'Dødeligheden (HR) ift. BMI 22,5-25: 1,07 ved 25-27,5, 1,20 ved 27,5-30, 1,45 ved 30-35, 1,94 ved 35-40 og 2,76 ved 40+. BMI 30-35 forkorter medianlevetiden med 2-4 år og BMI 40-45 med 8-10 år. Undervægt hænger sammen med højere dødelighed (HR 1,51), men delvist fordi sygdom giver lav vægt.',
      range: { min: -10, max: -0.5 },
    },
    options: [
      { value: -2, years: -3, label: 'Undervægtig (<18,5)' },
      { value: 0, years: 0, label: 'Normal (18,5-24,9)' },
      { value: -1, years: -1, label: 'Overvægtig (25-29,9)' },
      { value: 11, years: -3, label: 'Fedme grad I (30-34,9)' },
      { value: 12, years: -5.5, label: 'Fedme grad II (35-39,9)' },
      { value: 13, years: -9, label: 'Fedme grad III (40+)' },
    ],
  },
  {
    key: 'social',
    icon: '👨‍👩‍👧‍👦',
    label: 'Social aktivitet',
    inSum: true,
    evidence: 'moderate',
    source: {
      cite: 'Holt-Lunstad m.fl., PLoS Medicine 2010',
      pmid: '20668659',
      figure:
        'Stærke sociale relationer er forbundet med 50 % større chance for at overleve opfølgningsperioden (OR 1,50; 1,42-1,59; 148 studier). Omregningen til leveår (ca. 3-4 år mellem isoleret og stærkt netværk) er vores skøn.',
      range: { min: -4, max: 1 },
    },
    options: [
      { value: 4, years: 1, label: 'Stærkt netværk' },
      { value: 0, years: 0, label: 'Moderat netværk' },
      { value: -1, years: -1, label: 'Begrænset' },
      { value: -3, years: -3, label: 'Isoleret' },
    ],
  },
  {
    key: 'mental',
    icon: '🧠',
    label: 'Diagnosticeret psykisk lidelse',
    inSum: true,
    evidence: 'moderate',
    source: {
      cite: 'Plana-Ripoll m.fl., Lancet 2019; Walker m.fl., JAMA Psychiatry 2015',
      pmid: '31668728',
      figure:
        'I danske registerdata (7,4 mio. personer) mistede personer med en psykisk lidelse mellem 5,4 og 14,8 leveår afhængigt af diagnose og køn; medianen i en stor oversigt er ca. 10 år. Det er gennemsnit for grupper, ikke en vurdering af den enkelte.',
      range: { min: -10, max: -4 },
    },
    options: [
      { value: 0, years: 0, label: 'Ingen diagnose' },
      { value: 11, years: -5, label: 'Diagnosticeret psykisk lidelse' },
    ],
  },
  {
    key: 'work',
    icon: '💼',
    label: 'Arbejdsmiljø',
    inSum: false,
    evidence: 'none',
    info: 'Der findes ingen pålidelig effektstørrelse i leveår for arbejdsmiljø.',
    options: [
      { value: 1, years: 0, label: 'Fleksibelt/balanceret' },
      { value: 0, years: 0, label: 'Kontorarbejde' },
      { value: -1, years: 0, label: 'Fysisk krævende' },
      { value: -2, years: 0, label: 'Farligt arbejde' },
    ],
  },
  {
    key: 'environment',
    icon: '🌍',
    label: 'Boligområde',
    inSum: false,
    evidence: 'none',
    source: {
      cite: 'Danmarks Statistik, LABY21 (2024-2025)',
      figure:
        'Middellevetiden i alt er 82,6 år i hovedstadskommuner, 82,3 i pendlerkommuner og 81,0 i landkommuner. Forskellene kan have mange årsager (alder, uddannelse, indkomst, livsstil), så området indgår ikke i beregningen.',
    },
    options: [
      { value: 1, years: 0, label: 'Landdistrikter' },
      { value: -1, years: 0, label: 'Forstad' },
      { value: -2, years: 0, label: 'By m/ forurening' },
    ],
  },
  {
    key: 'education',
    icon: '🎓',
    label: 'Uddannelse',
    inSum: false,
    evidence: 'weak',
    source: {
      cite: 'Danmarks Statistik, LIGEHI4 (2021-2025)',
      figure:
        '30-årige mænd med lang videregående uddannelse har ca. 8,1 år mere tilbage end dem med grundskole, kvinder ca. 6,5 år. Det er en rå sammenhæng, ikke effekten af uddannelsen alene, så den indgår ikke i beregningen.',
    },
    options: [
      { value: -1, years: 0, label: 'Grundskole' },
      { value: 0, years: 0, label: 'Gymnasium' },
      { value: 1, years: 0, label: 'Bachelor' },
      { value: 3, years: 0, label: 'Master/PhD' },
    ],
  },
  {
    key: 'income',
    icon: '💰',
    label: 'Indkomst',
    inSum: false,
    evidence: 'weak',
    source: {
      cite: 'Kreiner m.fl., PNAS 2018',
      pmid: '30373814',
      figure:
        'Forskellen i middellevetid mellem 20. og 80. indkomstpercentil er 4,6 år for mænd og 4,1 for kvinder uden justering og ca. halvt så stor, når der tages højde for skift mellem indkomstgrupper. Indkomst overlapper med uddannelse og indgår ikke i beregningen.',
    },
    options: [
      { value: 2, years: 0, label: 'Høj' },
      { value: 0, years: 0, label: 'Mellem' },
      { value: -2, years: 0, label: 'Lav' },
      { value: -3, years: 0, label: 'Fattigdom' },
    ],
  },
  {
    key: 'commute',
    icon: '🚗',
    label: 'Transport',
    inSum: false,
    evidence: 'weak',
    source: {
      cite: 'Celis-Morales m.fl., BMJ 2017',
      pmid: '28424154',
      figure:
        'Cykling til arbejde var forbundet med lavere dødelighed (HR 0,59; 0,42-0,83) i UK Biobank, mens gåture ikke var signifikante. Effekten overlapper med motion og indgår ikke i beregningen.',
    },
    options: [
      { value: 1, years: 0, label: 'Cykling/gåtur' },
      { value: 0, years: 0, label: 'Offentlig/bil <30 min' },
      { value: -1, years: 0, label: 'Lang pendling 1h+' },
    ],
  },
  {
    key: 'screentime',
    icon: '📱',
    label: 'Skærmtid (fritid)',
    inSum: false,
    evidence: 'none',
    info: 'Der findes ingen pålidelig effektstørrelse i leveår for skærmtid i fritiden.',
    options: [
      { value: 1, years: 0, label: '<2 timer' },
      { value: 0, years: 0, label: '2-4 timer' },
      { value: -1, years: 0, label: '4-6 timer' },
      { value: -2, years: 0, label: '6+ timer' },
    ],
  },
];

const FACTOR_BY_KEY = Object.fromEntries(LIFESTYLE_FACTORS.map((f) => [f.key, f]));

/**
 * Years that one stored answer contributes to the estimate. Factors that do not
 * count (`inSum: false`) and answers the table does not know give 0.
 */
export function factorYears(key, value) {
  const factor = FACTOR_BY_KEY[key];
  if (!factor || !factor.inSum) return 0;
  return factor.options.find((o) => o.value === value)?.years ?? 0;
}

/** Sum of the years of all answers that count (before bounding and rounding). */
export function lifestyleYears(factors) {
  return LIFESTYLE_FACTORS.reduce((sum, f) => sum + factorYears(f.key, (factors || {})[f.key]), 0);
}

/**
 * Helper text under a factor, generated from the table: the source's own figure,
 * its citation and the evidence grade. The caller appends ASSOCIATION_NOTE.
 */
export function factorHelper(factor) {
  const text = factor.source?.figure ?? factor.info;
  if (!text) return '';
  const cite = factor.source?.cite ? ` Kilde: ${factor.source.cite}${factor.source.pmid ? ` (PMID ${factor.source.pmid})` : ''}.` : '';
  return `${text}${cite} Evidens: ${EVIDENCE_LABELS[factor.evidence]}.`;
}

/**
 * Metadata for the suggestion lists ("Sådan kan du vinde flere år", "Hvad
 * hvis?"): the best achievable option per factor that counts in the sum, with
 * the years it is worth and the stored answer that selects it. Only factors
 * with a defensible effect size are offered, and only behavioural ones.
 */
const META_SOURCE = [
  {
    key: 'smoking',
    label: 'Stop med at ryge',
    cite: { text: 'Jha 2013, NEJM', url: 'https://pubmed.ncbi.nlm.nih.gov/23343063/' },
  },
  {
    key: 'exercise',
    label: 'Dyrk mere motion',
    cite: { text: 'Moore 2012, PLoS Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/23139642/' },
  },
  {
    key: 'diet',
    label: 'Spis sundere',
    cite: { text: 'Fadnes 2022, PLoS Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/35134067/' },
  },
  {
    key: 'alcohol',
    label: 'Drik mindre alkohol',
    cite: { text: 'Wood 2018, Lancet', url: 'https://pubmed.ncbi.nlm.nih.gov/29676281/' },
  },
  {
    key: 'bmi',
    label: 'Opnå en sund vægt',
    cite: { text: 'Global BMI Mortality Collaboration 2016, Lancet', url: 'https://pubmed.ncbi.nlm.nih.gov/27423262/' },
  },
  {
    key: 'social',
    label: 'Styrk dit sociale netværk',
    cite: { text: 'Holt-Lunstad 2010, PLoS Medicine', url: 'https://pubmed.ncbi.nlm.nih.gov/20668659/' },
  },
  { key: 'sleep', label: 'Sov 7-8 timer' },
];

export const LIFESTYLE_META = META_SOURCE.map((m) => {
  const factor = FACTOR_BY_KEY[m.key];
  const best = factor.options.reduce((a, b) => (b.years > a.years ? b : a));
  return { ...m, icon: factor.icon, best: best.years, bestValue: best.value };
});

// Note: purely socioeconomic factors (education, income) and pre-existing health
// conditions are intentionally excluded — they are not actionable "lifestyle
// changes", so the coaching copy is scoped to behavioural factors only.

/**
 * The lifestyle changes that would raise the estimate most for this user,
 * highest gain first. gain = best achievable years − the years of the current
 * answer.
 */
export function topImprovements(factors, meta = LIFESTYLE_META, limit = 3) {
  return meta
    .map((m) => ({ ...m, gain: Math.round((m.best - factorYears(m.key, factors[m.key])) * 10) / 10 }))
    .filter((m) => m.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, limit);
}

/**
 * Every value the questionnaire can produce per factor (0 is always the
 * default, even where no button offers it). Used to validate the packed `lf`
 * value of a shared link. The key order matches LIFESTYLE_KEYS.
 */
export const LIFESTYLE_OPTIONS = Object.fromEntries(
  LIFESTYLE_FACTORS.map((f) => [
    f.key,
    [...new Set([0, ...f.options.map((o) => o.value)])].sort((a, b) => a - b),
  ])
);
