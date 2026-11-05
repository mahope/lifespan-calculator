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

  it('clamps age to an integer in 0-120 and rejects non-numeric input', () => {
    expect(parse('g=male&a=99999999')).toMatchObject({ age: 120 });
    expect(parse('g=male&a=121')).toMatchObject({ age: 120 });
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

    const bad = LIFESTYLE_KEYS.map((k) => (k === 'smoking' ? -99 : 0)).join(',');
    expect(parse(`g=male&a=30&m=advanced&lf=${bad}`)).toBeNull();
    expect(parse('g=male&a=30&m=advanced&lf=1,2')).toBeNull();
    expect(parse(`g=male&a=30&m=advanced&lf=${LIFESTYLE_KEYS.map(() => 'x').join(',')}`)).toBeNull();
    expect(parse(`g=male&a=30&m=advanced&lf=${LIFESTYLE_KEYS.map(() => '1e9').join(',')}`)).toBeNull();
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
