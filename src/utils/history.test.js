import { describe, it, expect } from 'vitest';
import { loadHistory, saveEntry } from './history';

function fakeStore(initial = null) {
  let v = initial;
  return {
    getItem: () => v,
    setItem: (_k, val) => {
      v = val;
    },
  };
}

describe('history', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadHistory(fakeStore())).toEqual([]);
    expect(loadHistory(fakeStore('not json'))).toEqual([]);
  });

  it('appends entries and reloads them', () => {
    const s = fakeStore();
    saveEntry({ ts: 1, age: 40, gender: 'male', expected: '80.0' }, s);
    saveEntry({ ts: 2, age: 41, gender: 'male', expected: '81.0' }, s);
    const list = loadHistory(s);
    expect(list).toHaveLength(2);
    expect(list[1].expected).toBe('81.0');
  });

  it('skips a consecutive duplicate of the last entry', () => {
    const s = fakeStore();
    const e = { ts: 1, age: 40, gender: 'male', expected: '80.0' };
    saveEntry(e, s);
    saveEntry({ ...e, ts: 2 }, s); // same age/gender/expected
    expect(loadHistory(s)).toHaveLength(1);
  });

  it('caps the history at 20 entries', () => {
    const s = fakeStore();
    for (let i = 0; i < 30; i++) {
      saveEntry({ ts: i, age: i, gender: 'male', expected: String(i) }, s);
    }
    expect(loadHistory(s)).toHaveLength(20);
    expect(loadHistory(s)[0].age).toBe(10); // oldest 10 dropped
  });
});
