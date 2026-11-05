#!/usr/bin/env node
// Regenerates the international country table in src/utils/lifeExpectancyData.js
// (the block between the BEGIN/END GENERATED markers) from primary sources:
//   - Eurostat dataset demo_mlexpec (life expectancy by age and sex), age Y_LT1
//   - World Bank indicators SP.DYN.LE00.MA.IN / SP.DYN.LE00.FE.IN / SP.DYN.LE00.IN
// Usage: node scripts/update-country-table.mjs
// Deterministic and idempotent. If any API is unreachable or returns unusable
// data the script exits non-zero and leaves the file untouched.

import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const TARGET = fileURLToPath(new URL('../src/utils/lifeExpectancyData.js', import.meta.url));
const BEGIN = '// BEGIN GENERATED COUNTRY TABLE (scripts/update-country-table.mjs)';
const END = '// END GENERATED COUNTRY TABLE';

// key = English name (stable lookup key), country = Danish display name.
// Denmark is deliberately absent: it is derived from LIFE_TABLE_DK.
const EUROSTAT = [
  { key: 'Sweden', geo: 'SE', country: 'Sverige' },
  { key: 'Norway', geo: 'NO', country: 'Norge' },
  { key: 'Finland', geo: 'FI', country: 'Finland' },
];
const WORLD_BANK = [
  { key: 'Japan', code: 'JPN', country: 'Japan' },
  { key: 'World', code: 'WLD', country: 'Verdensgennemsnit' },
];

const EUROSTAT_SOURCE = 'Eurostat demo_mlexpec';
const WORLD_BANK_SOURCE = 'Verdensbanken SP.DYN.LE00';

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const round1 = (n) => Math.round(n * 10) / 10;

// JSON-stat 2.0: values are addressed by a flat index over the dimension sizes.
async function fetchEurostat() {
  const base = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_mlexpec';
  const out = {};
  for (const sex of ['M', 'F', 'T']) {
    const qs = new URLSearchParams({ format: 'JSON', lang: 'EN', age: 'Y_LT1', sex, sinceTimePeriod: '2015' });
    for (const { geo } of EUROSTAT) qs.append('geo', geo);
    const js = await getJson(`${base}?${qs}`);
    if (js.error) throw new Error(`Eurostat error: ${JSON.stringify(js.error)}`);
    const { id, size, dimension, value } = js;
    if (!value || id.join() !== 'freq,unit,sex,age,geo,time') {
      throw new Error(`Unexpected Eurostat dimensions: ${id}`);
    }
    const geoIdx = dimension.geo.category.index;
    const timeIdx = dimension.time.category.index;
    for (const [geo, g] of Object.entries(geoIdx)) {
      for (const [year, t] of Object.entries(timeIdx)) {
        const v = value[g * size[5] + t]; // freq/unit/sex/age have size 1
        if (typeof v === 'number') ((out[geo] ??= {})[year] ??= {})[sex] = v;
      }
    }
  }
  return EUROSTAT.map(({ key, geo, country }) => {
    const years = Object.entries(out[geo] ?? {})
      .filter(([, v]) => ['M', 'F', 'T'].every((s) => typeof v[s] === 'number'))
      .map(([y]) => Number(y))
      .sort((a, b) => b - a);
    if (!years.length) throw new Error(`No complete Eurostat data for ${geo}`);
    const year = years[0];
    const v = out[geo][year];
    return { key, country, male: round1(v.M), female: round1(v.F), total: round1(v.T), source: EUROSTAT_SOURCE, year };
  });
}

async function fetchWorldBank() {
  const codes = WORLD_BANK.map((c) => c.code).join(';');
  const series = {};
  for (const [field, indicator] of [
    ['male', 'SP.DYN.LE00.MA.IN'],
    ['female', 'SP.DYN.LE00.FE.IN'],
    ['total', 'SP.DYN.LE00.IN'],
  ]) {
    const url = `https://api.worldbank.org/v2/country/${codes}/indicator/${indicator}?format=json&mrv=8&per_page=100`;
    const js = await getJson(url);
    if (!Array.isArray(js) || !Array.isArray(js[1])) throw new Error(`Unexpected World Bank response for ${indicator}`);
    for (const row of js[1]) {
      if (typeof row.value === 'number') ((series[row.countryiso3code] ??= {})[row.date] ??= {})[field] = row.value;
    }
  }
  return WORLD_BANK.map(({ key, code, country }) => {
    const years = Object.entries(series[code] ?? {})
      .filter(([, v]) => ['male', 'female', 'total'].every((f) => typeof v[f] === 'number'))
      .map(([y]) => Number(y))
      .sort((a, b) => b - a);
    if (!years.length) throw new Error(`No complete World Bank data for ${code}`);
    const year = years[0];
    const v = series[code][year];
    return {
      key, country, male: round1(v.male), female: round1(v.female), total: round1(v.total),
      source: WORLD_BANK_SOURCE, year,
    };
  });
}

function render(rows) {
  const lines = rows.map(
    (r) =>
      `    ${JSON.stringify(r.key)}: { male: ${r.male.toFixed(1)}, female: ${r.female.toFixed(1)}, total: ${r.total.toFixed(1)}, ` +
      `country: ${JSON.stringify(r.country)}, source: ${JSON.stringify(r.source)}, year: ${r.year} },`
  );
  return `${BEGIN}\nexport const countryTable = {\n${lines.join('\n')}\n};\n${END}`;
}

async function main() {
  const rows = [...(await fetchEurostat()), ...(await fetchWorldBank())];
  const block = render(rows);
  const src = await readFile(TARGET, 'utf8');
  const start = src.indexOf(BEGIN);
  const end = src.indexOf(END);
  if (start === -1 || end === -1 || end < start) throw new Error(`Markers not found in ${TARGET}`);
  const next = src.slice(0, start) + block + src.slice(end + END.length);
  if (next === src) {
    console.log('Country table already up to date.');
    return;
  }
  const tmp = `${TARGET}.tmp`;
  await writeFile(tmp, next, 'utf8');
  await rename(tmp, TARGET);
  console.log(`Updated ${rows.length} rows in ${TARGET}`);
  for (const r of rows) console.log(`  ${r.key}: ${r.male}/${r.female} (${r.source}, ${r.year})`);
}

main().catch((err) => {
  console.error(`update-country-table failed: ${err.message}`);
  process.exit(1);
});
