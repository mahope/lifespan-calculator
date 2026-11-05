import { describe, it, expect } from 'vitest';
import { LIFE_TABLE_DK } from './lifeTableDK';
import {
  lifeExpectancyData,
  getLifeExpectancyForCountry,
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

describe('Denmark', () => {
  it('is derived from LIFE_TABLE_DK (e0), not a second hard-coded number', () => {
    expect(lifeExpectancyData.Denmark.male).toBe(LIFE_TABLE_DK.remaining.male[0]);
    expect(lifeExpectancyData.Denmark.female).toBe(LIFE_TABLE_DK.remaining.female[0]);
  });
});

describe('lifeExpectancyData integrity', () => {
  it('every entry has male, female, a localized country name, source and year', () => {
    for (const [key, entry] of Object.entries(lifeExpectancyData)) {
      expect(typeof entry.male, `${key}.male`).toBe('number');
      expect(typeof entry.female, `${key}.female`).toBe('number');
      expect(typeof entry.country, `${key}.country`).toBe('string');
      expect(typeof entry.source, `${key}.source`).toBe('string');
      expect(entry.year, `${key}.year`).toBeTruthy();
      // sanity: women's life expectancy is >= men's in every dataset here
      expect(entry.female, `${key} female>=male`).toBeGreaterThanOrEqual(entry.male);
    }
  });
});
