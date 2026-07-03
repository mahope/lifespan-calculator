// A transparent, indicative life-insurance cover estimate: income-replacement
// over the years dependents still need support, rounded to a round figure.
// Not advice — just a starting point that makes the affiliate CTA useful.
export function estimateCover(annualIncome, years) {
  if (!Number.isFinite(annualIncome) || !Number.isFinite(years)) return 0;
  if (annualIncome <= 0 || years <= 0) return 0;
  const raw = annualIncome * years;
  return Math.round(raw / 100000) * 100000; // nearest 100,000 kr
}
