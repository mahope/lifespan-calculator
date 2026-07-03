// Local-only history of past estimates so a returning user can see how their
// projected lifespan has moved. No account, no server — just localStorage.
// Storage is injectable for testing.

const KEY = 'lifespan:history';
const MAX = 20;

const memoryStore = (() => {
  let v = null;
  return { getItem: () => v, setItem: (_k, val) => { v = val; } };
})();

function defaultStore() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    /* access can throw in some privacy modes */
  }
  return memoryStore;
}

export function loadHistory(store = defaultStore()) {
  try {
    const raw = store.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Append an entry, skipping a no-op duplicate of the most recent one, capping at
 * MAX. Returns the new list.
 */
export function saveEntry(entry, store = defaultStore()) {
  const list = loadHistory(store);
  const last = list[list.length - 1];
  if (
    last &&
    last.age === entry.age &&
    last.gender === entry.gender &&
    last.expected === entry.expected
  ) {
    return list;
  }
  const next = [...list, entry].slice(-MAX);
  try {
    store.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota / privacy mode — history is best-effort */
  }
  return next;
}
