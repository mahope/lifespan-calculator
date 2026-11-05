// Metadata for the lifestyle factors: the best achievable option per factor and,
// where there is a citation, the source's own figure (`figure`, with range and
// reference group as published) shown next to the site's coefficient (`best`),
// since the two can differ (recalibration is tracked separately). Used to suggest the highest-impact improvements (#27). This is a
// first step toward a fully data-driven factor config (#7).

export const LIFESTYLE_META = [
  {
    key: 'smoking',
    label: 'Stop med at ryge',
    icon: '🚭',
    best: 0,
    cite: { text: 'Doll & Peto 2004, BMJ', url: 'https://pubmed.ncbi.nlm.nih.gov/15213107/' },
    figure: 'Fortsatte rygere døde ca. 10 år tidligere end aldrig-rygere; stop som 30-årig gav ca. +10 år, som 50-årig ca. +6',
  },
  {
    key: 'exercise',
    label: 'Dyrk mere motion',
    icon: '🏃',
    best: 6,
    cite: {
      text: 'Moore 2012, PLoS Medicine',
      url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1001335',
    },
    figure: '+3,4 år (3,2-3,6) ved ca. 150 min/uge; højst +4,5 år (4,3-4,7) ved 22,5 MET-timer/uge eller mere',
  },
  {
    key: 'diet',
    label: 'Spis sundere',
    icon: '🍎',
    best: 5,
    cite: {
      text: 'Fadnes 2022, PLoS Medicine',
      url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1003889',
    },
    figure:
      'Modelberegning: +6,2 år (3,5-8,1) for kvinder og +7,3 år (4,7-9,5) for mænd ved en opnåelig kostomlægning fra 20-årsalderen; ca. +3,4 år ved start som 80-årig',
  },
  {
    key: 'alcohol',
    label: 'Drik mindre alkohol',
    icon: '🍷',
    best: 0,
    cite: { text: 'Wood 2018, Lancet', url: 'https://pubmed.ncbi.nlm.nih.gov/29676281/' },
    figure: 'Forventet levetid ved 40 år: ca. 0,5 år kortere ved 100-200 g alkohol/uge, 1-2 år ved 200-350 g og 4-5 år ved over 350 g (mod højst 100 g)',
  },
  {
    key: 'bmi',
    label: 'Opnå en sund vægt',
    icon: '⚖️',
    best: 2,
    cite: {
      text: 'Prospective Studies Collaboration 2009, Lancet',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2662372/',
    },
    figure: 'Median overlevelse 2-4 år kortere ved BMI 30-35 og 8-10 år kortere ved BMI 40-45',
  },
  {
    key: 'social',
    label: 'Styrk dit sociale netværk',
    icon: '👨‍👩‍👧',
    best: 4,
    cite: {
      text: 'Holt-Lunstad 2010, PLoS Medicine',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2910600/',
    },
    figure: 'Overlevelse OR 1,50 (1,42-1,59) ved stærke sociale relationer; studiet angiver ikke leveår',
  },
  { key: 'sleep', label: 'Sov 7-8 timer', icon: '😴', best: 2 },
  { key: 'stress', label: 'Reducér dit stressniveau', icon: '😰', best: 2 },
  { key: 'mental', label: 'Passe på din mentale sundhed', icon: '🧠', best: 2 },
  { key: 'commute', label: 'Cykl eller gå i stedet for at pendle', icon: '🚲', best: 1 },
  { key: 'work', label: 'Vælg et mindre belastende arbejdsmiljø', icon: '💼', best: 1 },
  { key: 'environment', label: 'Bo et sted med renere luft', icon: '🌍', best: 1 },
  { key: 'screentime', label: 'Mindre skærmtid i fritiden', icon: '📱', best: 1 },
];

// Note: purely socioeconomic factors (education, income) and pre-existing health
// conditions are intentionally excluded — they are not actionable "lifestyle
// changes", so the coaching copy is scoped to behavioural factors only.

/**
 * The lifestyle changes that would raise the estimate most for this user,
 * highest gain first. gain = best achievable value − current selection.
 */
export function topImprovements(factors, meta = LIFESTYLE_META, limit = 3) {
  return meta
    .map((m) => ({ ...m, gain: m.best - (factors[m.key] ?? 0) }))
    .filter((m) => m.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, limit);
}

/**
 * Every value the questionnaire can produce per factor (0 is always the
 * default). Used to validate the packed `lf` value of a shared link. The key
 * order matches LIFESTYLE_KEYS in useLifespanCalculator.
 */
export const LIFESTYLE_OPTIONS = {
  smoking: [-10, -5, 0],
  exercise: [0, 2, 4, 6],
  diet: [-2, 0, 3, 5],
  alcohol: [-6, -3, -1, 0],
  sleep: [-2, -1, 0, 2],
  stress: [-4, -2, 0, 2],
  health: [-5, -2, 0],
  bmi: [-4, -2, -1, 0, 2],
  social: [-3, -1, 0, 2, 4],
  mental: [-3, -2, 0, 2],
  work: [-2, -1, 0, 1],
  environment: [-2, -1, 0, 1],
  education: [-1, 0, 1, 3],
  income: [-3, -2, 0, 2],
  commute: [-1, 0, 1],
  screentime: [-2, -1, 0, 1],
};
