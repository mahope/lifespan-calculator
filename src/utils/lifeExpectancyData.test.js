import { describe, it, expect } from 'vitest';
import {
  lifeExpectancyData,
  getLifeExpectancyForCountry,
  formatCountryName,
} from './lifeExpectancyData';

describe('getLifeExpectancyForCountry', () => {
  it('returns the correct value for a known country and gender', () => {
    expect(getLifeExpectancyForCountry('Denmark', 'female')).toBe(
      lifeExpectancyData.Denmark.female
    );
    expect(getLifeExpectancyForCountry('Denmark', 'male')).toBe(
      lifeExpectancyData.Denmark.male
    );
  });

  it('falls back to World for an unknown country', () => {
    expect(getLifeExpectancyForCountry('Atlantis', 'male')).toBe(
      lifeExpectancyData.World.male
    );
  });

  it('falls back to the male value for an unknown gender', () => {
    expect(getLifeExpectancyForCountry('Denmark', 'other')).toBe(
      lifeExpectancyData.Denmark.male
    );
  });
});

describe('formatCountryName', () => {
  it('returns the localized Danish name for a known country', () => {
    expect(formatCountryName('Germany')).toBe('Tyskland');
    expect(formatCountryName('United States')).toBe('USA');
  });

  it('falls back to the World label for an unknown country', () => {
    expect(formatCountryName('Atlantis')).toBe(lifeExpectancyData.World.country);
  });
});

describe('lifeExpectancyData integrity', () => {
  it('every entry has male, female and a localized country name', () => {
    for (const [key, entry] of Object.entries(lifeExpectancyData)) {
      expect(typeof entry.male, `${key}.male`).toBe('number');
      expect(typeof entry.female, `${key}.female`).toBe('number');
      expect(typeof entry.country, `${key}.country`).toBe('string');
      // sanity: women's life expectancy is >= men's in every dataset here
      expect(entry.female, `${key} female>=male`).toBeGreaterThanOrEqual(entry.male);
    }
  });
});
