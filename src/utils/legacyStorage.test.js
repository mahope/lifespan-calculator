import { describe, it, expect } from 'vitest';
import { removeLegacyConsent } from './legacyStorage';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}

describe('removeLegacyConsent', () => {
  it('removes the old consent:v1 key and leaves other keys alone', () => {
    const s = fakeStorage({ 'consent:v1': 'accepted', theme: 'dark' });
    removeLegacyConsent(s);
    expect(s.data).toEqual({ theme: 'dark' });
  });

  it('does not throw when storage is missing or blocked', () => {
    expect(() => removeLegacyConsent(undefined)).not.toThrow();
    const blocked = { removeItem() { throw new Error('denied'); } };
    expect(() => removeLegacyConsent(blocked)).not.toThrow();
  });
});
