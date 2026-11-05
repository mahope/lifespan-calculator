import { describe, it, expect } from 'vitest';
import { loadHistory, saveEntry, clearHistory } from './history';

function fakeStore(initial = null) {
  let v = initial;
  return {
    getItem: () => v,
    setItem: (_k, val) => {
      v = val;
    },
    removeItem: () => {
      v = null;
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

  it('ignores corrupt stored data', () => {
    for (const raw of ['null', '[null,null]', '{"a":1}', '"x"', '[1,"a"]']) {
      expect(loadHistory(fakeStore(raw))).toEqual([]);
    }
  });

  it('drops entries lacking finite ts, age or expected (incl. NaN)', () => {
    const good = { ts: 1, age: 40, gender: 'male', expected: '80.0' };
    const raw = JSON.stringify([
      null,
      good,
      { ts: 2, age: null, gender: 'male', expected: '80.0' }, // NaN serialises to null
      { ts: 3, age: 40, expected: 'NaN' },
      { ts: 4, age: 40 },
      { age: 40, expected: '80.0' },
      { ts: 5, age: 41, gender: 'male', expected: 81.5 },
    ]);
    const list = loadHistory(fakeStore(raw));
    expect(list.map((e) => e.ts)).toEqual([1, 5]);
  });

  it('saveEntry works after corrupt data', () => {
    const s = fakeStore('[null,null]');
    const next = saveEntry({ ts: 1, age: 40, gender: 'male', expected: '80.0' }, s);
    expect(next).toHaveLength(1);
    expect(loadHistory(s)).toHaveLength(1);
  });

  it('clearHistory removes all entries and tolerates a throwing store', () => {
    const s = fakeStore();
    saveEntry({ ts: 1, age: 40, gender: 'male', expected: '80.0' }, s);
    clearHistory(s);
    expect(loadHistory(s)).toEqual([]);
    expect(() =>
      clearHistory({
        removeItem: () => {
          throw new Error('x');
        },
      }),
    ).not.toThrow();
  });
});
