// A transparent, indicative life-insurance cover estimate: the deceased's share of
// the income, replaced over the years dependents still need support, minus existing
// cover (employer/pension death cover), rounded to a round figure. No discounting
// (the sum is not reduced to a present value). Not advice, just a starting point.
// `sharePct` is 0-100 (default 100 = all of the income entered); `existingCover` in kr.
export function estimateCover(annualIncome, years, { sharePct = 100, existingCover = 0 } = {}) {
  if (!Number.isFinite(annualIncome) || !Number.isFinite(years)) return 0;
  if (annualIncome <= 0 || years <= 0) return 0;
  const share = Number.isFinite(sharePct) ? Math.min(100, Math.max(0, sharePct)) : 100;
  const existing = Number.isFinite(existingCover) ? Math.max(0, existingCover) : 0;
  const raw = (annualIncome * share) / 100 * years - existing;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.round(raw / 100000) * 100000; // nearest 100,000 kr
}
