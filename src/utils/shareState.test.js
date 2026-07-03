import { describe, it, expect } from 'vitest';
import { packLifestyle, parseLifestyle, buildShareParams } from './shareState';

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
  it('uses age in simple mode', () => {
    const p = buildShareParams({
      gender: 'male',
      age: 34,
      birthdate: '',
      useBirthdate: false,
      mode: 'simple',
      lifestyle: {},
      keys: KEYS,
    });
    expect(p).toEqual({ g: 'male', a: '34' });
  });

  it('uses birthdate and packs lifestyle in advanced mode', () => {
    const p = buildShareParams({
      gender: 'female',
      age: '',
      birthdate: '1990-05-20',
      useBirthdate: true,
      mode: 'advanced',
      lifestyle: { smoking: -5, exercise: 2, diet: 3 },
      keys: KEYS,
    });
    expect(p).toEqual({ g: 'female', b: '1990-05-20', m: 'advanced', lf: '-5,2,3' });
  });
});
