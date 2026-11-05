// Metadata for the lifestyle factors: the best achievable option per factor and,
// where the calculator's coefficient is in the ballpark of the literature, a
// citation. Used to suggest the highest-impact improvements (#27).

export const LIFESTYLE_META = [
  {
    key: 'smoking',
    label: 'Stop med at ryge',
    icon: '🚭',
    best: 0,
    cite: { text: 'Doll & Peto 2004, BMJ', url: 'https://pubmed.ncbi.nlm.nih.gov/15213107/' },
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
  },
  {
    key: 'alcohol',
    label: 'Drik mindre alkohol',
    icon: '🍷',
    best: 0,
    cite: { text: 'Wood 2018, Lancet', url: 'https://pubmed.ncbi.nlm.nih.gov/29676281/' },
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
  },
  { key: 'sleep', label: 'Sov 7-8 timer', icon: '😴', best: 2 },
  { key: 'stress', label: 'Reducér dit stressniveau', icon: '😰', best: 2 },
  { key: 'mental', label: 'Passe på din mentale sundhed', icon: '🧠', best: 2 },
  { key: 'commute', label: 'Cykl eller gå i stedet for at pendle', icon: '🚲', best: 1 },
  { key: 'work', label: 'Vælg et mindre belastende arbejdsmiljø', icon: '💼', best: 1 },
  { key: 'environment', label: 'Bo et sted med renere luft', icon: '🌍', best: 1 },
  { key: 'screentime', label: 'Mindre skærmtid i fritiden', icon: '📱', best: 1 },
];

/**
 * The questionnaire, in render order. Each option's `value` is the number of
 * years added to (or subtracted from) the estimate; 0 is the neutral default.
 * HomePage renders one <LifestyleFactor> per entry, and LIFESTYLE_KEYS and
 * LIFESTYLE_OPTIONS below are derived from it.
 */
export const LIFESTYLE_FACTORS = [
  {
    key: 'smoking',
    icon: '🚭',
    label: 'Rygning',
    options: [
      { value: 0, label: 'Ryger ikke' },
      { value: -5, label: 'Let (1-10/dag)' },
      { value: -10, label: 'Kraftig (10+/dag)' },
    ],
  },
  {
    key: 'exercise',
    icon: '🏃‍♂️',
    label: 'Motion',
    options: [
      { value: 0, label: 'Ingen' },
      { value: 2, label: 'Let (1-3 t/uge)' },
      { value: 4, label: 'Moderat (4-6 t/uge)' },
      { value: 6, label: 'Intensiv (7+ t/uge)' },
    ],
  },
  {
    key: 'diet',
    icon: '🍎',
    label: 'Kost',
    options: [
      { value: -2, label: 'Usund' },
      { value: 0, label: 'Gennemsnitlig' },
      { value: 3, label: 'Sund' },
      { value: 5, label: 'Meget sund' },
    ],
  },
  {
    key: 'alcohol',
    icon: '🍷',
    label: 'Alkohol',
    options: [
      { value: 0, label: 'Ingen' },
      { value: -1, label: 'Let (1-7/uge)' },
      { value: -3, label: 'Moderat (8-14/uge)' },
      { value: -6, label: 'Kraftig (15+/uge)' },
    ],
  },
  {
    key: 'sleep',
    icon: '😴',
    label: 'Søvn',
    options: [
      { value: -2, label: '<5 timer' },
      { value: -1, label: '5-6 timer' },
      { value: 2, label: '7-8 timer' },
      { value: 0, label: '9+ timer' },
    ],
  },
  {
    key: 'stress',
    icon: '😰',
    label: 'Stress',
    options: [
      { value: 2, label: 'Lavt' },
      { value: 0, label: 'Moderat' },
      { value: -2, label: 'Højt' },
      { value: -4, label: 'Meget højt' },
    ],
  },
  {
    key: 'health',
    icon: '🏥',
    label: 'Sundhedstilstand',
    options: [
      { value: 0, label: 'Ingen sygdomme' },
      { value: -2, label: '1 kronisk sygdom' },
      { value: -5, label: '2+ sygdomme' },
    ],
  },
  {
    key: 'bmi',
    icon: '⚖️',
    label: 'BMI/Vægt',
    options: [
      { value: -2, label: 'Undervægtig (<18.5)' },
      { value: 2, label: 'Normal (18.5-24.9)' },
      { value: -1, label: 'Overvægtig (25-29.9)' },
      { value: -4, label: 'Svært overvægtig (30+)' },
    ],
  },
  {
    key: 'social',
    icon: '👨‍👩‍👧‍👦',
    label: 'Social aktivitet',
    options: [
      { value: 4, label: 'Stærkt netværk' },
      { value: 2, label: 'Moderat netværk' },
      { value: -1, label: 'Begrænset' },
      { value: -3, label: 'Isoleret' },
    ],
  },
  {
    key: 'mental',
    icon: '🧠',
    label: 'Mental sundhed',
    options: [
      { value: 2, label: 'Meget god' },
      { value: 0, label: 'God' },
      { value: -2, label: 'Depression/angst' },
      { value: -3, label: 'Alvorlige problemer' },
    ],
  },
  {
    key: 'work',
    icon: '💼',
    label: 'Arbejdsmiljø',
    options: [
      { value: 1, label: 'Fleksibelt/balanceret' },
      { value: 0, label: 'Kontorarbejde' },
      { value: -1, label: 'Fysisk krævende' },
      { value: -2, label: 'Farligt arbejde' },
    ],
  },
  {
    key: 'environment',
    icon: '🌍',
    label: 'Boligområde',
    options: [
      { value: 1, label: 'Landdistrikter' },
      { value: -1, label: 'Forstad' },
      { value: -2, label: 'By m/ forurening' },
    ],
  },
  {
    key: 'education',
    icon: '🎓',
    label: 'Uddannelse',
    options: [
      { value: -1, label: 'Grundskole' },
      { value: 0, label: 'Gymnasium' },
      { value: 1, label: 'Bachelor' },
      { value: 3, label: 'Master/PhD' },
    ],
  },
  {
    key: 'income',
    icon: '💰',
    label: 'Indkomst',
    options: [
      { value: 2, label: 'Høj' },
      { value: 0, label: 'Mellem' },
      { value: -2, label: 'Lav' },
      { value: -3, label: 'Fattigdom' },
    ],
  },
  {
    key: 'commute',
    icon: '🚗',
    label: 'Transport',
    options: [
      { value: 1, label: 'Cykling/gåtur' },
      { value: 0, label: 'Offentlig/bil <30 min' },
      { value: -1, label: 'Lang pendling 1h+' },
    ],
  },
  {
    key: 'screentime',
    icon: '📱',
    label: 'Skærmtid (fritid)',
    options: [
      { value: 1, label: '<2 timer' },
      { value: 0, label: '2-4 timer' },
      { value: -1, label: '4-6 timer' },
      { value: -2, label: '6+ timer' },
    ],
  },
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
 * default, even where no button offers it). Used to validate the packed `lf`
 * value of a shared link. The key order matches LIFESTYLE_KEYS.
 */
export const LIFESTYLE_OPTIONS = Object.fromEntries(
  LIFESTYLE_FACTORS.map((f) => [
    f.key,
    [...new Set([0, ...f.options.map((o) => o.value)])].sort((a, b) => a - b),
  ])
);
