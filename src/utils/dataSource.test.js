import { describe, expect, it } from 'vitest';
import { dataSource } from './dataSource';
import { LIFE_TABLE_META } from './lifeTableDK';

describe('dataSource', () => {
  it('derives period and update date from the generated table meta', () => {
    expect(dataSource.period).toBe(LIFE_TABLE_META.period);
    expect(dataSource.label).toBe(`Danmarks Statistik (${LIFE_TABLE_META.period})`);
    expect(dataSource.table).toBe('HISB8');
  });

  it('formats the update date in Danish', () => {
    expect(dataSource.updated).toMatch(/^\d{1,2}\. [a-zæøå]+ \d{4}$/);
    expect(dataSource.updated).toContain(LIFE_TABLE_META.tableUpdated.slice(0, 4));
  });
});
