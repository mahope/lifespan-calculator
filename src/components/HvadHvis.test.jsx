// @vitest-environment jsdom
process.env.TZ = 'Europe/Copenhagen';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import HvadHvis from './HvadHvis';
import { computeResult } from '../utils/lifespanMath';
import { LIFESTYLE_FACTORS } from '../utils/lifestyleFactors';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date('2026-11-05T12:00:00');
const zero = Object.fromEntries(LIFESTYLE_FACTORS.map((f) => [f.key, 0]));

let container;
let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (resultData, lifestyleFactors) =>
  act(() => root.render(<HvadHvis resultData={resultData} lifestyleFactors={lifestyleFactors} />));

describe('HvadHvis (#93)', () => {
  it('gives delta 0 when no choice is made, for every age and sex', () => {
    for (const gender of ['male', 'female']) {
      for (let age = 0; age <= 99; age += 1) {
        for (const extra of [0, 0.17, 0.5, 0.83]) {
          const input = { ageOrBirthdate: age + extra, gender, lifestyleFactors: zero };
          const result = computeResult(input, NOW);
          if (!result) continue;
          render(result, zero);
          const delta = container.querySelector('.text-sm.font-medium');
          expect(delta.textContent, `${gender} ${age + extra}`).toBe('Vælg en ændring ovenfor');
          expect(container.querySelector('.text-4xl').textContent).toBe(
            result.adjustedLifeExpectancy.replace('.', ','),
          );
        }
      }
    }
  });

  it('shows the gain with a decimal comma once a change is chosen', () => {
    const result = computeResult({ ageOrBirthdate: 50, gender: 'male', lifestyleFactors: zero }, NOW);
    render(result, zero);
    const buttons = [...container.querySelectorAll('button[aria-pressed]')];
    expect(buttons.length).toBeGreaterThan(0);
    act(() => buttons[0].click());
    const text = container.textContent;
    expect(text).toMatch(/\+\d,\d år i forhold til nu/);
    expect(text).not.toMatch(/\d\.\d/);
  });
});
