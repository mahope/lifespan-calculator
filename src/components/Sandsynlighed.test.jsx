// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import Sandsynlighed from './Sandsynlighed';
import { formatPct } from '../utils/formatPct';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Sandsynlighed', () => {
  it('formats small probabilities with one decimal', () => {
    expect(formatPct(0.83)).toBe('0,8%');
    expect(formatPct(2.8)).toBe('2,8%');
    expect(formatPct(45.4)).toBe('45%');
  });

  it('shows P(100) for male 40 as ~0,8 % and female 60 as ~2,8 %', () => {
    const render = (age, gender) => {
      const el = document.createElement('div');
      act(() => createRoot(el).render(<Sandsynlighed resultData={{ age, gender }} />));
      return el.textContent;
    };
    expect(render(40, 'male')).toContain('0,8%');
    expect(render(60, 'female')).toContain('2,8%');
  });
});
