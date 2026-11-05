import { describe, it, expect } from 'vitest';
import { packLifestyle, parseLifestyle, buildShareParams, parseShareParams } from './shareState';
import { LIFESTYLE_KEYS } from '../hooks/useLifespanCalculator';

const KEYS = ['smoking', 'exercise', 'diet'];

describe('packLifestyle / parseLifestyle', () => {
  it('round-trips factor values (including negatives)', () => {
    const factors = { smoking: -5, exercise: 4, diet: 0 };
    const packed = packLifestyle(factors, KEYS);
    expect(packed).toBe('-5,4,0');
    expect(parseLifestyle(packed, KEYS)).toEqual(factors);
  });

  it('defaults missing keys to 0 when packing', () => {
    expect(packLifestyle({ smoking: 2 }, KEYS)).toBe('2,0,0');
  });

  it('returns null for empty or wrong-length input', () => {
    expect(parseLifestyle('', KEYS)).toBeNull();
    expect(parseLifestyle(null, KEYS)).toBeNull();
    expect(parseLifestyle('1,2', KEYS)).toBeNull();
  });

  it('coerces non-numeric parts to 0', () => {
    expect(parseLifestyle('1,x,3', KEYS)).toEqual({ smoking: 1, exercise: 0, diet: 3 });
  });
});

describe('buildShareParams', () => {
  it('shares only gender and whole-year age by default', () => {
    const p = buildShareParams({
      gender: 'male',
      age: 34.7,
      lifestyle: { smoking: -5, exercise: 2, diet: 3 },
      keys: KEYS,
    });
    expect(p).toEqual({ g: 'male', a: '34' });
  });

  it('never includes a birthdate or lifestyle unless opted in', () => {
    const p = buildShareParams({
      gender: 'female',
      age: '41.2',
      birthdate: '1985-05-20',
      lifestyle: { smoking: -5 },
      keys: KEYS,
    });
    expect(Object.keys(p).sort()).toEqual(['a', 'g']);
  });

  it('packs lifestyle only with includeLifestyle', () => {
    const p = buildShareParams({
      gender: 'female',
      age: 40,
      includeLifestyle: true,
      lifestyle: { smoking: -5, exercise: 2, diet: 3 },
      keys: KEYS,
    });
    expect(p).toEqual({ g: 'female', a: '40', m: 'advanced', lf: '-5,2,3' });
  });

  it('round-trips through parseShareParams', () => {
    const p = buildShareParams({ gender: 'male', age: 40, keys: KEYS, lifestyle: {} });
    const r = parseShareParams(new URLSearchParams(p));
    expect(r).toMatchObject({ gender: 'male', age: 40, useBirthdate: false });
  });
});

describe('parseShareParams', () => {
  const NOW = new Date(2026, 10, 5, 12, 0, 0); // 5 Nov 2026, local
  const parse = (qs) => parseShareParams(new URLSearchParams(qs), { now: NOW });

  it('accepts a valid age link', () => {
    expect(parse('g=male&a=40')).toEqual({
      gender: 'male', age: 40, birthdate: '', useBirthdate: false, mode: 'simple', lifestyle: null,
    });
  });

  it('accepts a valid birthdate link', () => {
    expect(parse('g=female&b=1990-05-20')).toMatchObject({
      gender: 'female', age: '', birthdate: '1990-05-20', useBirthdate: true,
    });
  });

  it('whitelists gender', () => {
    for (const g of ['constructor', '__proto__', 'toString', 'MALE', '', 'other']) {
      expect(parse(`g=${g}&a=30`)).toBeNull();
    }
    expect(parse('a=30')).toBeNull();
  });

  it('clamps age to an integer in 0-110 and rejects non-numeric input', () => {
    expect(parse('g=male&a=99999999')).toMatchObject({ age: 110 });
    expect(parse('g=male&a=111')).toMatchObject({ age: 110 });
    expect(parse('g=male&a=-5')).toMatchObject({ age: 0 });
    expect(parse('g=male&a=12.5')).toMatchObject({ age: 12 });
    expect(parse('g=male&a=0')).toMatchObject({ age: 0 });
    expect(parse('g=male&a=1e9')).toBeNull();
    expect(parse('g=male&a=')).toBeNull();
    expect(parse('g=male&a=abc')).toBeNull();
    expect(parse('g=male&a=__proto__')).toBeNull();
    expect(parse('g=male&a=toString')).toBeNull();
  });

  it('only accepts real calendar dates within [1900-01-01, today]', () => {
    expect(parse('g=male&b=garbage-x')).toBeNull();
    expect(parse('g=male&b=2099-01-01')).toBeNull();
    expect(parse('g=male&b=2026-11-06')).toBeNull();
    expect(parse('g=male&b=2026-11-05')).toMatchObject({ birthdate: '2026-11-05' });
    expect(parse('g=male&b=1899-12-31')).toBeNull();
    expect(parse('g=male&b=1900-01-01')).toMatchObject({ birthdate: '1900-01-01' });
    expect(parse('g=male&b=2021-02-30')).toBeNull();
    expect(parse('g=male&b=2020-02-29')).toMatchObject({ birthdate: '2020-02-29' });
    expect(parse('g=male&b=2021-02-29')).toBeNull();
    expect(parse('g=male&b=1990-5-2')).toBeNull();
    expect(parse('g=male&b=1990-05-20T00:00')).toBeNull();
    expect(parse('g=male&b=')).toBeNull();
  });

  it('rejects duplicate params', () => {
    expect(parse('g=male&g=female&a=30')).toBeNull();
    expect(parse('g=male&a=30&a=40')).toBeNull();
    expect(parse('g=male&b=1990-01-01&b=1991-01-01')).toBeNull();
  });

  it('validates mode and falls back to simple', () => {
    expect(parse('g=male&a=30&m=advanced')).toMatchObject({ mode: 'advanced' });
    expect(parse('g=male&a=30&m=simple')).toMatchObject({ mode: 'simple' });
    expect(parse('g=male&a=30&m=__proto__')).toBeNull();
    expect(parse('g=male&a=30&m=toString')).toBeNull();
  });

  it('validates every lf value against the option set', () => {
    const ok = LIFESTYLE_KEYS.map((k) => (k === 'smoking' ? -5 : 0)).join(',');
    const r = parse(`g=male&a=30&m=advanced&lf=${ok}`);
    expect(r.lifestyle.smoking).toBe(-5);
    expect(Object.keys(r.lifestyle)).toEqual(LIFESTYLE_KEYS);

    // Anything the questionnaire cannot produce drops the lifestyle part only.
    const kept = { gender: 'male', age: 30, mode: 'advanced', lifestyle: null };
    const bad = LIFESTYLE_KEYS.map((k) => (k === 'smoking' ? -99 : 0)).join(',');
    expect(parse(`g=male&a=30&m=advanced&lf=${bad}`)).toMatchObject(kept);
    expect(parse('g=male&a=30&m=advanced&lf=1,2')).toMatchObject(kept);
    expect(parse(`g=male&a=30&m=advanced&lf=${LIFESTYLE_KEYS.map(() => 'x').join(',')}`)).toMatchObject(kept);
    expect(parse(`g=male&a=30&m=advanced&lf=${LIFESTYLE_KEYS.map(() => '1e9').join(',')}`)).toMatchObject(kept);
    expect(parse('g=male&a=30&m=advanced&lf=0&lf=0')).toMatchObject(kept);
  });

  // Links made before the recalibration (#93): `lf` is positional, so a removed or
  // renumbered option must not cost the visitor gender, age and mode.
  describe('old share links', () => {
    const lf = (over) => LIFESTYLE_KEYS.map((k) => over[k] ?? 0).join(',');

    it('still applies answers whose id exists but whose years changed', () => {
      const old = { smoking: -5, exercise: 4, diet: 3, alcohol: 0, sleep: 0, mental: 0, social: 4 };
      const r = parse(`g=female&a=55&m=advanced&lf=${lf(old)}`);
      expect(r).toMatchObject({ gender: 'female', age: 55, mode: 'advanced' });
      expect(r.lifestyle).toMatchObject(old);
      expect(parse(`g=female&a=55&m=advanced&lf=${lf({ exercise: 6 })}`).lifestyle.exercise).toBe(6);
    });

    it.each([
      ['diet -2 (Usund)', { diet: -2 }],
      ['alcohol -1', { alcohol: -1 }],
      ['alcohol -3', { alcohol: -3 }],
      ['alcohol -6', { alcohol: -6 }],
      ['sleep 2', { sleep: 2 }],
      ['bmi 2', { bmi: 2 }],
      ['bmi -4', { bmi: -4 }],
      ['social 2', { social: 2 }],
      ['mental 2', { mental: 2 }],
      ['mental -2', { mental: -2 }],
      ['mental -3', { mental: -3 }],
    ])('drops only the lifestyle part when %s no longer exists', (_name, over) => {
      const r = parse(`g=male&b=1980-05-05&m=advanced&lf=${lf({ smoking: -5, ...over })}`);
      expect(r).toMatchObject({
        gender: 'male', birthdate: '1980-05-05', useBirthdate: true, mode: 'advanced', lifestyle: null,
      });
    });
  });

  it('ignores lf in simple mode and accepts advanced without lf', () => {
    expect(parse('g=male&a=30&lf=garbage')).toMatchObject({ mode: 'simple', lifestyle: null });
    expect(parse('g=male&a=30&m=advanced')).toMatchObject({ mode: 'advanced', lifestyle: null });
  });

  it('prefers neither when both a and b are missing', () => {
    expect(parse('g=male')).toBeNull();
    expect(parse('')).toBeNull();
  });
});
