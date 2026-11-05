import { describe, it, expect, vi, afterEach } from 'vitest';
import { trackCalculate } from './analytics';

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
