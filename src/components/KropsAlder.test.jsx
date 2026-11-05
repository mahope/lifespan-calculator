// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import KropsAlder from './KropsAlder';
import { computeResult } from '../utils/lifespanMath';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date('2026-11-05T12:00:00Z');
const factors = { smoking: 3, exercise: 2 };

function bodyAge(projection) {
  const resultData = computeResult({ ageOrBirthdate: 40, gender: 'male', lifestyleFactors: factors, projection }, NOW);
  const el = document.createElement('div');
  act(() => createRoot(el).render(<KropsAlder resultData={resultData} />));
  return el.querySelector('.text-5xl').textContent;
}

describe('KropsAlder', () => {
  it('shows the same biological age in period and projected mode', () => {
    expect(bodyAge('projected')).toBe(bodyAge('period'));
  });
});
