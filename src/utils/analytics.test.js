import { describe, it, expect, vi, afterEach } from 'vitest';
import { EVENTS, track, trackCalculate } from './analytics';

describe('trackCalculate', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('sends the event without any props (no user input leaves the browser)', () => {
    const plausible = vi.fn();
    globalThis.window = { plausible };
    trackCalculate({ age: 40, gender: 'male', location: 'Denmark', usedBirthdate: false });
    expect(plausible).toHaveBeenCalledTimes(1);
    expect(plausible).toHaveBeenCalledWith('Calculate Lifespan');
  });

  it('does nothing when Plausible is not loaded', () => {
    globalThis.window = {};
    expect(() => trackCalculate()).not.toThrow();
  });
});

describe('track', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('sends whitelisted events with whitelisted props only', () => {
    const plausible = vi.fn();
    globalThis.window = { plausible };
    track('Affiliate Click', { program: 'findforsikring', placement: 'result-insurance', age: 42, gender: 'male' });
    expect(plausible).toHaveBeenCalledWith('Affiliate Click', {
      props: { program: 'findforsikring', placement: 'result-insurance' },
    });
  });

  it('sends events without props when none are allowed or given', () => {
    const plausible = vi.fn();
    globalThis.window = { plausible };
    track('Share Opened', { age: 42 });
    expect(plausible).toHaveBeenCalledWith('Share Opened');
    track('Result Shown', { mode: 'advanced', birthdate: '1980-01-01' });
    expect(plausible).toHaveBeenLastCalledWith('Result Shown', { props: { mode: 'advanced' } });
  });

  it('drops non-primitive prop values', () => {
    const plausible = vi.fn();
    globalThis.window = { plausible };
    track('Share', { method: { age: 40 } });
    expect(plausible).toHaveBeenCalledWith('Share');
  });

  it('ignores unknown event names', () => {
    const plausible = vi.fn();
    globalThis.window = { plausible };
    track('Birthdate Entered', { mode: 'x' });
    expect(plausible).not.toHaveBeenCalled();
  });

  it('never throws, with or without Plausible', () => {
    globalThis.window = {};
    expect(() => track('Result Shown', { mode: 'simple' })).not.toThrow();
    globalThis.window = {
      plausible: () => {
        throw new Error('boom');
      },
    };
    expect(() => track('Result Shown', { mode: 'simple' })).not.toThrow();
    expect(() => track('Result Shown', null)).not.toThrow();
  });
});

describe('EVENTS whitelist', () => {
  it('is pinned: a new event or prop key needs a deliberate change here and in docs/analytics.md', () => {
    expect(EVENTS).toEqual({
      'Calculate Lifespan': [],
      'Result Shown': ['mode'],
      'Affiliate Impression': ['program', 'placement'],
      'Affiliate Click': ['program', 'placement'],
      'Share Opened': [],
      'Embed Calculate': [],
      Share: ['method'],
      Error: ['type'],
    });
  });

  it('never allows a prop key that looks like user input', () => {
    const userInput = /age|gender|sex|birth|location|country|lifestyle|factor/i;
    for (const keys of Object.values(EVENTS)) {
      for (const key of keys) expect(key).not.toMatch(userInput);
    }
  });
});
