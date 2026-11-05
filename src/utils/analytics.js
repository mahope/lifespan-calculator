// Privacy: the calculation runs entirely in the browser. Only the fact that a
// calculation happened is counted; age, sex, birthdate, lifestyle answers and
// location are never passed as event props. Any arguments are ignored on purpose.
export function trackCalculate() {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('Calculate Lifespan');
  }
}
