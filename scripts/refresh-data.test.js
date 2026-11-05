import { describe, it, expect } from 'vitest';
import {
  LIFE_TABLE_DK,
  LIFE_TABLE_META,
  MORTALITY_DK,
  SURVIVORS_AT_100_DK,
  NEWBORN_DK,
  REGIONAL_DK,
} from '../src/data/lifeTableDK.generated.js';
import { HEALTHY_LIFE_YEARS } from '../src/data/healthyLifeYears.generated.js';
import {
  validateLifeTable,
  validateRegional,
  validateHly,
  parseCommittedHly,
  buildCountryRows,
  buildLifeTableSeries,
  decodeJsonStat,
  deriveL100,
  latestTid,
  isStale,
  parseDstCsv,
  parseCountryYears,
  periodLabel,
  spliceCountryBlock,
} from './refresh-data.mjs';

const committed = () => {
  const t = {};
  for (const sex of ['male', 'female']) {
    t[sex] = {
      survivors: [...LIFE_TABLE_DK.survivors[sex]],
      remaining: [...LIFE_TABLE_DK.remaining[sex]],
      mortality: [...MORTALITY_DK[sex]],
    };
  }
  return t;
};
const meta = { tid: LIFE_TABLE_META.tid, expectedTid: LIFE_TABLE_META.tid };

describe('validateLifeTable', () => {
  it('accepts the committed table (and so a faithful DST download)', () => {
    expect(validateLifeTable(committed(), meta)).toEqual([]);
  });

  it('rejects non-monotone l_x', () => {
    const t = committed();
    t.male.survivors[40] = t.male.survivors[39] + 5;
    expect(validateLifeTable(t, meta).join('\n')).toMatch(/male\/survivors: l_x increases at age 40/);
  });

  it('rejects a missing age', () => {
    const t = committed();
    delete t.female.remaining[57];
    const errs = validateLifeTable(t, meta).join('\n');
    expect(errs).toMatch(/female\/remaining: missing or non-numeric at age 57/);
  });

  it('rejects a series that is too short', () => {
    const t = committed();
    t.male.mortality = t.male.mortality.slice(0, 99);
    expect(validateLifeTable(t, meta).join('\n')).toMatch(/male\/mortality: expected 100 values, got 99/);
  });

  it('rejects the wrong period', () => {
    expect(validateLifeTable(committed(), { tid: '2023:2024', expectedTid: '2024:2025' }).join('\n')).toMatch(
      /period is 2023:2024, expected 2024:2025/
    );
    expect(validateLifeTable(committed(), { tid: '2024-2025' }).join('\n')).toMatch(/not of the form/);
    expect(validateLifeTable(committed(), { tid: '2024:2026' }).join('\n')).toMatch(/not a two-year period/);
  });

  it('rejects a period older than the committed one', () => {
    expect(validateLifeTable(committed(), { tid: '2023:2024', previousTid: '2024:2025' }).join('\n')).toMatch(
      /older than the committed/
    );
  });

  it('rejects e_x that increases with age (from age 1)', () => {
    const t = committed();
    t.male.remaining[30] = t.male.remaining[29] + 0.4;
    expect(validateLifeTable(t, meta).join('\n')).toMatch(/male\/remaining: e_x increases at age 30/);
  });

  it('accepts e_0 < e_1 (infant mortality) but not a corrupted e_x column', () => {
    const t = committed();
    expect(t.male.remaining[0]).toBeGreaterThan(t.male.remaining[1]); // sanity: real data
    // Shift a value by 0.2 while keeping monotonicity: only the l_x recomputation can catch it.
    t.male.remaining[50] -= 0.2;
    t.male.remaining[51] = Math.min(t.male.remaining[51], t.male.remaining[50]);
    expect(validateLifeTable(t, meta).join('\n')).toMatch(/recomputed from l_x/);
  });

  it('rejects l_0 other than 100000', () => {
    const t = committed();
    t.male.survivors[0] = 99999;
    expect(validateLifeTable(t, meta).join('\n')).toMatch(/l_0 is 99999/);
  });
});

describe('DST helpers', () => {
  it('parses StatBank CSV with BOM and decimal comma', () => {
    const rows = parseDstCsv('﻿KØN;TID;INDHOLD\r\nM;2024:2025;80,3\r\nK;2024:2025;83.9\r\n');
    expect(rows.map((r) => r.value)).toEqual([80.3, 83.9]);
    expect(rows[0]['KØN']).toBe('M');
  });

  it('builds series by age and leaves gaps as undefined', () => {
    const rows = [
      { ALDER: '0', 'KØN': 'M', TAVLE: '1', TID: '2024:2025', value: 100000 },
      { ALDER: '2', 'KØN': 'M', TAVLE: '1', TID: '2024:2025', value: 99000 },
      { ALDER: '1', 'KØN': 'M', TAVLE: '1', TID: '2023:2024', value: 1 },
    ];
    const s = buildLifeTableSeries(rows, '2024:2025');
    expect(s.male.survivors[0]).toBe(100000);
    expect(s.male.survivors[1]).toBeUndefined();
    expect(s.male.survivors[2]).toBe(99000);
  });

  it('picks the latest Tid regardless of order', () => {
    const info = { id: 'X', variables: [{ id: 'Tid', values: [{ id: '2025:2026' }, { id: '2024:2025' }, { id: '2026:2027' }] }] };
    expect(latestTid(info)).toBe('2026:2027');
    expect(() => latestTid({ id: 'X', variables: [] })).toThrow(/no Tid/);
  });

  it('derives l_100 consistently with the committed table', () => {
    expect(deriveL100(committed())).toEqual(SURVIVORS_AT_100_DK);
  });

  it('detects staleness by start year', () => {
    expect(isStale('2024:2025', '2025:2026')).toBe(true);
    expect(isStale('2024:2025', '2024:2025')).toBe(false);
    expect(isStale('2024:2025', '2023:2024')).toBe(false);
    expect(periodLabel('2024:2025')).toBe('2024-2025');
  });

  it('committed newborn and regional data pass validation', () => {
    expect(Math.abs(NEWBORN_DK.male - LIFE_TABLE_DK.remaining.male[0])).toBeLessThanOrEqual(0.051);
    for (const r of Object.values(REGIONAL_DK)) {
      expect(validateRegional(r.areas, { label: r.table, requireCode: '000' })).toEqual([]);
    }
  });

  it('rejects implausible or incomplete regional rows', () => {
    const areas = { '000': { total: 82.1, male: 80.3, female: 83.9 }, '084': { total: 82, male: 80, female: NaN } };
    expect(validateRegional(areas, { label: 'T', requireCode: '000' }).join('\n')).toMatch(/084\.female/);
    expect(validateRegional({}, { label: 'T', requireCode: '000' }).join('\n')).toMatch(/000 missing/);
    expect(validateRegional(areas, { label: 'T', expectedCount: 10 }).join('\n')).toMatch(/expected about 10/);
  });
});

describe('countries', () => {
  const eurostat = {
    SE: { 2023: { M: 82, F: 85, T: 83.5 }, 2024: { M: 82.3, F: 85.3, T: 83.8 } },
    NO: { 2024: { M: 81.6, F: 84.8, T: 83.2 } },
    FI: { 2024: { M: 79.6, F: 84.8, T: 82.2 } },
  };
  const wb = (m, f, t) => ({ male: m, female: f, total: t });
  const worldBank = {
    JPN: { 2024: wb(81.1, 87.1, 84) },
    WLD: { 2024: wb(71.1, 76, 73.5) },
    SWE: { 2024: wb(82.2, 85.4, 83.8) },
  };

  it('builds rows with year and source and passes a clean run', () => {
    const r = buildCountryRows({ eurostat, worldBank, previousYears: { Sweden: 2024 } });
    expect(r.errors).toEqual([]);
    expect(r.rows.find((x) => x.key === 'Sweden')).toMatchObject({ year: 2024, source: 'Eurostat demo_mlexpec' });
    expect(r.rows.find((x) => x.key === 'Japan')).toMatchObject({ year: 2024, source: 'Verdensbanken SP.DYN.LE00' });
  });

  it('warns when Eurostat and World Bank differ by more than 0.5 year', () => {
    const w = { ...worldBank, SWE: { 2024: wb(83.1, 85.3, 84.2) } };
    const r = buildCountryRows({ eurostat, worldBank: w });
    expect(r.errors).toEqual([]);
    expect(r.warnings.join('\n')).toMatch(/Sweden 2024 male/);
  });

  it('fails when a year is older than the previous run', () => {
    const r = buildCountryRows({ eurostat, worldBank, previousYears: { Sweden: 2025 } });
    expect(r.errors.join('\n')).toMatch(/Sweden: year 2024 is older than the committed 2025/);
  });

  it('fails on missing countries and implausible values', () => {
    expect(buildCountryRows({ eurostat: {}, worldBank: {} }).errors.length).toBeGreaterThan(0);
    const bad = { ...eurostat, NO: { 2024: { M: 8.16, F: 84.8, T: 83.2 } } };
    expect(buildCountryRows({ eurostat: bad, worldBank }).errors.join('\n')).toMatch(/Norway: implausible/);
  });

  it('reads committed years and splices the generated block', () => {
    const src = 'a\n// BEGIN GENERATED COUNTRY TABLE (old)\nx\n// END GENERATED COUNTRY TABLE\nb';
    expect(spliceCountryBlock(src, 'NEW')).toBe('a\nNEW\nb');
    expect(() => spliceCountryBlock('nothing', 'NEW')).toThrow(/markers/);
    expect(parseCountryYears('    "Sweden": { male: 1, country: "S", year: 2024 },')).toEqual({ Sweden: 2024 });
  });
});

describe('Eurostat helpers', () => {
  it('decodes JSON-stat cubes by flat index', () => {
    const js = {
      id: ['sex', 'time'],
      size: [2, 2],
      dimension: { sex: { category: { index: { M: 0, F: 1 } } }, time: { category: { index: { 2023: 0, 2024: 1 } } } },
      value: { 0: 1, 1: 2, 3: 4 },
    };
    expect(decodeJsonStat(js)).toEqual([
      { value: 1, time: '2023', sex: 'M' },
      { value: 2, time: '2024', sex: 'M' },
      { value: 4, time: '2024', sex: 'F' },
    ]);
    expect(() => decodeJsonStat({ error: [{ status: 400 }] })).toThrow(/Eurostat error/);
  });

  it('validates healthy life years and rejects broken data', () => {
    expect(validateHly(HEALTHY_LIFE_YEARS)).toEqual([]);
    const broken = structuredClone(HEALTHY_LIFE_YEARS);
    delete broken.DK.HLY_Y65;
    broken.SE.HLY_Y65.male.value = broken.SE.LE_Y65.male.value + 3;
    const errs = validateHly(broken).join('\n');
    expect(errs).toMatch(/DK HLY_Y65 male missing/);
    expect(errs).toMatch(/SE male: HLY_Y65 .* exceeds LE_Y65/);
  });

  it('compares hly years per geo against the committed data, not across geos', () => {
    // SE moving ahead of DK must not fail DK.
    const previous = structuredClone(HEALTHY_LIFE_YEARS);
    const next = structuredClone(HEALTHY_LIFE_YEARS);
    next.SE.HLY_Y0.male.year += 3;
    expect(validateHly(next, { previous })).toEqual([]);
    next.DK.HLY_Y0.male.year = previous.DK.HLY_Y0.male.year - 1;
    expect(validateHly(next, { previous }).join('\n')).toMatch(/DK HLY_Y0 male: year .* older than the committed/);
  });

  it('parses the committed hly module source', () => {
    const src = `export const HEALTHY_LIFE_YEARS_META = {};\nexport const HEALTHY_LIFE_YEARS = ${JSON.stringify(HEALTHY_LIFE_YEARS, null, 2)};\n`;
    expect(parseCommittedHly(src)).toEqual(HEALTHY_LIFE_YEARS);
    expect(parseCommittedHly(null)).toBeNull();
  });
});
