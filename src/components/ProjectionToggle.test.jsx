// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, beforeEach } from 'vitest';
import ProjectionToggle from './ProjectionToggle';
import Sammenlign from './Sammenlign';
import ParMode from './ParMode';
import ShareModal from './ShareModal';
import { useLifespanCalculator } from '../hooks/useLifespanCalculator';
import { computeResult } from '../utils/lifespanMath';
import { buildShareParams } from '../utils/shareState';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date(2026, 10, 5, 12, 0, 0);
const zero = { smoking: 0 };
const result = (age, projection) =>
  computeResult({ ageOrBirthdate: age, gender: 'male', lifestyleFactors: zero, projection }, NOW);

const mount = (node) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  act(() => createRoot(el).render(node));
  return el;
};

describe('ProjectionToggle', () => {
  it('is hidden from the entered age 70 (lookup age 70.5)', () => {
    expect(mount(<ProjectionToggle resultData={result(70, 'period')} onChange={() => {}} />).innerHTML).toBe('');
    expect(mount(<ProjectionToggle resultData={result(69, 'period')} onChange={() => {}} />).querySelector('button')).not.toBeNull();
  });

  it('marks the active basis with aria-pressed and calls onChange', () => {
    const calls = [];
    const el = mount(<ProjectionToggle resultData={result(40, 'period')} onChange={(m) => calls.push(m)} />);
    const [period, projected] = el.querySelectorAll('button');
    expect(period.getAttribute('aria-pressed')).toBe('true');
    expect(projected.getAttribute('aria-pressed')).toBe('false');
    act(() => projected.click());
    expect(calls).toEqual(['projected']);
    expect(el.querySelector('[data-testid="projection-second-line"]').textContent).toContain('46,3');
  });
});

describe('basis notes when projected is on', () => {
  it('Sammenlign labels its basis; period view has no note', () => {
    expect(mount(<Sammenlign resultData={result(40, 'projected')} />).querySelector('[data-testid="sammenlign-basis-note"]')).not.toBeNull();
    expect(mount(<Sammenlign resultData={result(40, 'period')} />).querySelector('[data-testid="sammenlign-basis-note"]')).toBeNull();
  });

  it('ParMode says it uses the period figure', () => {
    const el = mount(<ParMode resultData={result(40, 'projected')} />);
    expect(el.querySelector('[data-testid="par-period-note"]').textContent).toBe(
      'Beregningen af jeres år sammen bruger nuværende dødelighed.'
    );
    expect(mount(<ParMode resultData={result(40, 'period')} />).querySelector('[data-testid="par-period-note"]')).toBeNull();
  });
});

describe('ShareModal text', () => {
  it('has no double parentheses in the projected share text', () => {
    const opened = [];
    window.open = (url) => opened.push(url);
    const el = mount(
      <ShareModal isOpen onClose={() => {}} resultData={result(40, 'projected')} lifestyleFactors={zero} />
    );
    const twitter = [...document.body.querySelectorAll('button')].find((b) => b.textContent.includes('Twitter'));
    act(() => twitter.click());
    const text = decodeURIComponent(new URL(opened[0]).searchParams.get('text'));
    expect(text).toContain('46,3 år tilbage at leve (fremskrevet af Danmarks Statistik)!');
    expect(text).not.toMatch(/\([^()]*\([^()]*\)[^()]*\)/);
    expect(el).toBeTruthy();
  });
});

describe('projection state', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('resets to period and never reaches the URL, localStorage or share params', () => {
    let api;
    const Probe = () => {
      api = useLifespanCalculator();
      return null;
    };
    mount(<Probe />);
    act(() => { api.calculateLifespan(40, 'male'); });
    act(() => api.setProjection('projected'));
    expect(api.resultData.projection).toBe('projected');
    expect(window.location.search).toBe('');
    expect(JSON.stringify({ ...localStorage })).not.toMatch(/project/i);
    expect(buildShareParams({ gender: 'male', age: 40, keys: [] }).toString()).not.toMatch(/project/i);
    act(() => api.resetProjection());
    expect(api.projection).toBe('period');
    act(() => { api.calculateLifespan(40, 'male'); });
    expect(api.resultData.projection).toBe('period');
  });
});
