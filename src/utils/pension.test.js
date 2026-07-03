import { describe, it, expect } from 'vitest';
import { folkepensionAge } from './pension';

describe('folkepensionAge', () => {
  it('matches the verified statutory schedule by birth year', () => {
    expect(folkepensionAge(1960)).toBe(67); // 1955–1962
    expect(folkepensionAge(1962)).toBe(67);
    expect(folkepensionAge(1963)).toBe(68); // 1963–1966
    expect(folkepensionAge(1966)).toBe(68);
    expect(folkepensionAge(1967)).toBe(69); // 1967–1970
    expect(folkepensionAge(1970)).toBe(69);
    expect(folkepensionAge(1971)).toBe(70); // 1971+
    expect(folkepensionAge(1990)).toBe(70);
  });

  it('handles earlier (already-retired) cohorts', () => {
    expect(folkepensionAge(1950)).toBe(65);
    expect(folkepensionAge(1954)).toBe(66);
  });

  it('is non-decreasing across birth years', () => {
    let prev = 0;
    for (let y = 1940; y <= 2000; y++) {
      const a = folkepensionAge(y);
      expect(a).toBeGreaterThanOrEqual(prev);
      prev = a;
    }
  });
});
