// Metadata for the lifestyle factors: the best achievable option per factor and,
// where the calculator's coefficient is in the ballpark of the literature, a
// citation. Used to suggest the highest-impact improvements (#27). This is a
// first step toward a fully data-driven factor config (#7).

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
  { key: 'screentime', label: 'Mindre skærmtid i fritiden', icon: '📱', best: 1 },
];

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
