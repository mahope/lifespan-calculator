// Privacy: the calculation runs entirely in the browser. Events carry no user
// input (age, sex, birthdate, lifestyle answers, location). Every call goes
// through track(), which only lets whitelisted event names and prop keys out.
// Keep docs/analytics.md in sync with this table.
export const EVENTS = {
  'Calculate Lifespan': [],
  'Result Shown': ['mode'],
  'Affiliate Impression': ['program', 'placement'],
  'Affiliate Click': ['program', 'placement'],
  'Share Opened': [],
  'Embed Calculate': [],
  Share: ['method'],
  Error: ['type'],
};

export function track(eventName, props) {
  try {
    if (typeof window === 'undefined' || typeof window.plausible !== 'function') return;
    if (!Object.prototype.hasOwnProperty.call(EVENTS, eventName)) return;
    const allowed = EVENTS[eventName];
    const clean = {};
    for (const key of Object.keys(props || {})) {
      const value = props[key];
      if (allowed.includes(key) && (typeof value === 'string' || typeof value === 'number')) {
        clean[key] = value;
      }
    }
    if (Object.keys(clean).length > 0) {
      window.plausible(eventName, { props: clean });
    } else {
      window.plausible(eventName);
    }
  } catch {
    // Analytics must never break the app.
  }
}

// Any arguments are ignored on purpose.
export function trackCalculate() {
  track('Calculate Lifespan');
}
