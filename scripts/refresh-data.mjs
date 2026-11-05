#!/usr/bin/env node
// Re-runnable refresh of every external dataset the calculator ships.
//
//   node scripts/refresh-data.mjs <dst|countries|hly|cohort|all|check> [--dry-run]
//
//   dst        Danmarks Statistik StatBank: HISB8 (life table) -> src/data/lifeTableDK.generated.js;
//              HISB8 q_x, HISB7 (newborn headline), HISBR/HISBK/LABY21 (regional)
//              -> src/data/lifeTableExtras.generated.js (not imported by the app)
//   countries  World Bank WDI + Eurostat demo_mlexpec -> block in src/utils/lifeExpectancyData.js
//   hly        Eurostat hlth_hlye (HLY_Y0, HLY_Y65, LE_Y65) -> src/data/healthyLifeYears.generated.js
//   cohort     not available yet (separate cohort-projection pull request): exits 1
//   all        dst + countries + hly (cohort joins once it exists)
//   check      staleness check: is DST's latest HISB8 period newer than the committed one?
//              Prints JSON, always exits 0 unless DST is unreachable. `--simulate-latest 2026:2027`
//              pretends DST published that period (for testing the stale path).
//
// Nothing is written unless EVERY requested dataset fetched and validated; files are replaced
// atomically. Any failure exits non-zero and leaves the working tree untouched. No dependencies
// (Node 20+ fetch). Only public statistics endpoints are contacted; no user data is involved.

import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = new URL('../', import.meta.url);
export const PATHS = {
  lifeTable: fileURLToPath(new URL('src/data/lifeTableDK.generated.js', ROOT)),
  lifeTableExtras: fileURLToPath(new URL('src/data/lifeTableExtras.generated.js', ROOT)),
  hly: fileURLToPath(new URL('src/data/healthyLifeYears.generated.js', ROOT)),
  countries: fileURLToPath(new URL('src/utils/lifeExpectancyData.js', ROOT)),
};

const DST_API = 'https://api.statbank.dk/v1';
const EUROSTAT_API = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
const WORLD_BANK_API = 'https://api.worldbank.org/v2';

export const AGES = 100; // exact ages 0..99: what DST HISB8 publishes (e_x, q_x and l_x)
export const SURVIVOR_AGES = AGES + 1; // l_x runs 0..100: entry 100 (l_100) is derived from q_99
export const E_TOLERANCE = 0.05; // recomputed e_x vs DST's e_x
export const COUNTRY_WARN_DIFF = 0.5; // years, World Bank vs Eurostat

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export const today = () => new Date().toISOString().slice(0, 10);
const round1 = (n) => Math.round(n * 10) / 10;

export const FETCH_TIMEOUT_MS = 30_000;

async function fetchText(url, init, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      lastErr = ctrl.signal.aborted ? new Error(`Timeout after ${FETCH_TIMEOUT_MS / 1000} s for ${url}`) : err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

const getJson = async (url) =>
  JSON.parse(await fetchText(url, { headers: { accept: 'application/json' } }));

/** "2024:2025" -> "2024-2025" (display label). */
export const periodLabel = (tid) => String(tid).replace(':', '-');

// ---------------------------------------------------------------------------
// Danmarks Statistik
// ---------------------------------------------------------------------------

export async function dstTableInfo(table) {
  return getJson(`${DST_API}/tableinfo/${table}?lang=da&format=JSON`);
}

/** Latest period (Tid) of a StatBank table: the one with the highest start year, then end year. */
export function latestTid(info) {
  const tid = info.variables?.find((v) => v.id.toLowerCase() === 'tid');
  if (!tid?.values?.length) throw new Error(`tableinfo ${info.id}: no Tid variable`);
  const key = (id) => String(id).split(':').map(Number);
  const sorted = [...tid.values].sort((a, b) => {
    const [a0, a1] = key(a.id);
    const [b0, b1] = key(b.id);
    return a0 - b0 || a1 - b1;
  });
  return sorted.at(-1).id;
}

async function dstData(table, variables) {
  const body = JSON.stringify({ table, format: 'CSV', lang: 'en', valuePresentation: 'Code', variables });
  const text = await fetchText(`${DST_API}/data`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  return parseDstCsv(text);
}

/** Parse StatBank CSV (';' separated, optional BOM) into [{ <COLUMN>: value, ..., value:number }]. */
export function parseDstCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const header = lines.shift().split(';').map((h) => h.trim().toUpperCase());
  return lines.map((line) => {
    const cells = line.split(';');
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i]));
    row.value = Number(String(row.INDHOLD).replace(',', '.'));
    return row;
  });
}

/** Build the 100-long series (ages 0..99) for each sex and TAVLE from HISB8 rows of one period. */
export function buildLifeTableSeries(rows, tid) {
  const out = { male: {}, female: {} };
  const sexOf = { M: 'male', K: 'female' };
  const tavleOf = { 1: 'survivors', 2: 'mortality', 3: 'remaining' };
  for (const sex of Object.values(sexOf)) {
    for (const t of Object.values(tavleOf)) out[sex][t] = new Array(AGES).fill(undefined);
  }
  for (const r of rows) {
    if (r.TID !== tid) continue;
    const sex = sexOf[r['KØN']];
    const table = tavleOf[r.TAVLE];
    const age = Number(r.ALDER);
    if (!sex || !table || !Number.isInteger(age) || age < 0 || age >= AGES) continue;
    out[sex][table][age] = r.value;
  }
  return out;
}

/**
 * Recompute e_x from l_x (trapezoid rule, tail closed with DST's own e_99) so that a corrupt
 * column in either series is noticed.
 */
export function recomputeRemaining(survivors, e99) {
  const T = new Array(AGES);
  T[AGES - 1] = e99 * survivors[AGES - 1];
  for (let x = AGES - 2; x >= 0; x--) T[x] = T[x + 1] + (survivors[x] + survivors[x + 1]) / 2;
  return T.map((t, x) => t / survivors[x]);
}

/**
 * Validate one life table. Returns a list of problems (empty = valid).
 * survivors has 101 entries: the first 100 come from DST HISB8, entry 100 (l_100) is derived
 * from l_99 and q_99 (see deriveL100); mortality and remaining have 100.
 * @param {{male:object,female:object}} table  series per sex: survivors, mortality, remaining
 * @param {{tid:string, expectedTid?:string, previousTid?:string}} meta
 */
export function validateLifeTable(table, { tid, expectedTid, previousTid } = {}) {
  const errors = [];
  if (!/^\d{4}:\d{4}$/.test(String(tid))) errors.push(`period "${tid}" is not of the form YYYY:YYYY`);
  else {
    const [a, b] = tid.split(':').map(Number);
    if (b !== a + 1) errors.push(`period "${tid}" is not a two-year period`);
  }
  if (expectedTid && tid !== expectedTid) errors.push(`period is ${tid}, expected ${expectedTid}`);
  if (previousTid && /^\d{4}:\d{4}$/.test(String(tid)) && Number(tid.slice(0, 4)) < Number(previousTid.slice(0, 4))) {
    errors.push(`period ${tid} is older than the committed ${previousTid}`);
  }

  for (const sex of ['male', 'female']) {
    const s = table?.[sex];
    for (const name of ['survivors', 'mortality', 'remaining']) {
      const arr = s?.[name];
      const where = `${sex}/${name}`;
      const want = name === 'survivors' ? SURVIVOR_AGES : AGES;
      if (!Array.isArray(arr) || arr.length !== want) {
        errors.push(`${where}: expected ${want} values, got ${arr?.length ?? 'none'}`);
        continue;
      }
      const missing = [];
      for (let i = 0; i < want; i++) if (typeof arr[i] !== 'number' || !Number.isFinite(arr[i])) missing.push(i);
      if (missing.length) errors.push(`${where}: missing or non-numeric at age ${missing.slice(0, 5).join(', ')}`);
    }
    if (errors.some((e) => e.startsWith(`${sex}/`))) continue;

    const { survivors: l, mortality: q, remaining: e } = s;
    if (l[0] !== 100000) errors.push(`${sex}/survivors: l_0 is ${l[0]}, expected 100000`);
    for (let x = 1; x < SURVIVOR_AGES; x++) {
      if (l[x] > l[x - 1]) {
        errors.push(`${sex}/survivors: l_x increases at age ${x} (${l[x - 1]} -> ${l[x]})`);
        break;
      }
    }
    if (l.some((v) => v <= 0 || v > 100000)) errors.push(`${sex}/survivors: value outside (0, 100000]`);
    const l100 = Math.round(l[AGES - 1] * (1 - q[AGES - 1] / 100000));
    if (l[AGES] !== l100) {
      errors.push(`${sex}/survivors: l_100 is ${l[AGES]}, expected l_99 * (1 - q_99) = ${l100}`);
    }
    if (q.some((v) => v < 0 || v > 100000)) errors.push(`${sex}/mortality: value outside [0, 100000]`);
    // e_0 may be lower than e_1 (infant mortality), so monotonicity starts at age 1.
    for (let x = 2; x < AGES; x++) {
      if (e[x] > e[x - 1]) {
        errors.push(`${sex}/remaining: e_x increases at age ${x} (${e[x - 1]} -> ${e[x]})`);
        break;
      }
    }
    if (!errors.some((er) => er.startsWith(`${sex}/survivors`))) {
      const re = recomputeRemaining(l.slice(0, AGES), e[AGES - 1]);
      for (let x = 0; x < AGES - 1; x++) {
        if (Math.abs(re[x] - e[x]) > E_TOLERANCE) {
          errors.push(
            `${sex}: e_${x} recomputed from l_x is ${re[x].toFixed(3)}, DST says ${e[x]} (tolerance ${E_TOLERANCE})`
          );
          break;
        }
      }
    }
  }
  return errors;
}

/** l_100 = l_99 * (1 - q_99), so the table can be closed at the last printed age. */
export function deriveL100(table) {
  const out = {};
  for (const sex of ['male', 'female']) {
    const { survivors, mortality } = table[sex];
    out[sex] = Math.round(survivors[AGES - 1] * (1 - mortality[AGES - 1] / 100000));
  }
  return out;
}

/** Append the derived l_100 to the 100 DST survivors values (the series validateLifeTable expects). */
export function withL100(table) {
  const l100 = deriveL100(table);
  const out = {};
  for (const sex of ['male', 'female']) {
    out[sex] = { ...table[sex], survivors: [...table[sex].survivors, l100[sex]] };
  }
  return out;
}

/** Validate a one-number-per-sex (and optional total) regional/newborn row set. */
export function validateRegional(areas, { label, expectedCount, requireCode } = {}) {
  const errors = [];
  const codes = Object.keys(areas ?? {});
  // DST suppresses a handful of tiny municipalities; tolerate up to 10 % missing, never more.
  if (expectedCount && (codes.length > expectedCount || codes.length < expectedCount * 0.9)) {
    errors.push(`${label}: expected about ${expectedCount} areas, got ${codes.length}`);
  }
  if (requireCode && !areas?.[requireCode]) errors.push(`${label}: area ${requireCode} missing`);
  for (const [code, a] of Object.entries(areas ?? {})) {
    for (const k of ['total', 'male', 'female']) {
      if (typeof a[k] !== 'number' || !(a[k] > 70 && a[k] < 90)) {
        errors.push(`${label}: ${code}.${k} = ${a[k]} is not a plausible life expectancy`);
      }
    }
    if (a.male >= a.female) errors.push(`${label}: ${code} has male >= female`);
  }
  return errors;
}

function regionalFromRows(rows, tid, info, areaColumn) {
  const names = Object.fromEntries(
    info.variables.find((v) => v.id === areaColumn).values.map((v) => [v.id, v.text])
  );
  const sexOf = { TOT: 'total', M: 'male', K: 'female' };
  const areas = {};
  for (const r of rows) {
    if (r.TID !== tid) continue;
    const code = r[areaColumn];
    const sex = sexOf[r['KØN']];
    if (!sex) continue;
    if (Number.isNaN(r.value)) continue; // suppressed cell ("..")
    (areas[code] ??= { name: names[code] ?? code })[sex] = r.value;
  }
  const suppressed = Object.keys(names).filter((c) => !areas[c]);
  return { areas, suppressed, expectedCount: Object.keys(names).length };
}

export async function fetchDst({ previousTid } = {}) {
  const info = await dstTableInfo('HISB8');
  const tid = latestTid(info);
  const rows = await dstData('HISB8', [
    { code: 'ALDER', values: Array.from({ length: AGES }, (_, i) => String(i)) },
    { code: 'KØN', values: ['M', 'K'] },
    { code: 'TAVLE', values: ['1', '2', '3'] },
    { code: 'Tid', values: [tid] },
  ]);
  const table = withL100(buildLifeTableSeries(rows, tid));
  const errors = validateLifeTable(table, { tid, previousTid });

  // Newborn headline (HISB7) must agree with e_0 of the life table (one decimal).
  const hisb7 = await dstData('HISB7', [
    { code: 'KØN', values: ['M', 'K'] },
    { code: 'Tid', values: [tid] },
  ]);
  const newborn = {};
  for (const r of hisb7) {
    if (r.TID === tid) newborn[r['KØN'] === 'M' ? 'male' : 'female'] = r.value;
  }
  for (const sex of ['male', 'female']) {
    const e0 = table[sex].remaining[0];
    if (typeof newborn[sex] !== 'number' || Math.abs(newborn[sex] - e0) > 0.051) {
      errors.push(`HISB7 ${sex} newborn is ${newborn[sex]}, HISB8 e_0 is ${e0}`);
    }
  }

  // Regional pages: each table has its own latest period.
  const regional = {};
  for (const [name, regTable, areaColumn] of [
    ['regions', 'HISBR', 'OMRÅDE'],
    ['municipalities', 'HISBK', 'OMRÅDE'],
    ['municipalityGroups', 'LABY21', 'KOMGRP'],
  ]) {
    const rinfo = await dstTableInfo(regTable);
    const rtid = latestTid(rinfo);
    const rrows = await dstData(regTable, [
      { code: areaColumn, values: ['*'] },
      { code: 'KØN', values: ['*'] },
      { code: 'Tid', values: [rtid] },
    ]);
    const { areas, suppressed, expectedCount } = regionalFromRows(rrows, rtid, rinfo, areaColumn);
    errors.push(
      ...validateRegional(areas, {
        label: regTable,
        expectedCount,
        requireCode: '000',
      })
    );
    regional[name] = { table: regTable, tid: rtid, period: periodLabel(rtid), tableUpdated: rinfo.updated, suppressed, areas };
  }

  if (errors.length) throw new ValidationError('dst', errors);
  return { tid, tableUpdated: info.updated, table, newborn, regional };
}

// ---------------------------------------------------------------------------
// Generated-file rendering
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  constructor(step, problems) {
    const shown = problems.slice(0, 25);
    const more = problems.length > shown.length ? `\n  ... and ${problems.length - shown.length} more` : '';
    super(`${step}: ${problems.length} validation problem(s):\n  - ${shown.join('\n  - ')}${more}`);
    this.problems = problems;
  }
}

const HEADER = (cmd) =>
  `// GENERATED by scripts/refresh-data.mjs ${cmd}. Do not edit by hand; see docs/data-refresh.md.\n`;

const fmtArray = (arr, digits) =>
  `[${arr.map((v) => (digits === null ? String(v) : v.toFixed(digits))).join(', ')}]`;

const sexBlock = (table, name, digits) =>
  `    male: ${fmtArray(table.male[name], digits)},\n    female: ${fmtArray(table.female[name], digits)},`;

/** The part the app imports: meta, e_x (ages 0..99) and l_x (ages 0..100). */
export function renderLifeTable(d, retrieved) {
  const { table } = d;
  return `${HEADER('dst')}// Source: https://www.statbank.dk/HISB8 (TAVLE 1 = l_x, 3 = e_x).
// Index = exact age: remaining (e_x) 0..99, survivors (l_x) 0..100. The first 100 survivors values
// are DST's; entry 100 is derived as l_99 * (1 - q_99) with DST's q_99 (TAVLE 2).
// Period is the two-year period DST calls ${JSON.stringify(d.tid)}.

export const LIFE_TABLE_META = {
  period: ${JSON.stringify(periodLabel(d.tid))},
  tid: ${JSON.stringify(d.tid)},
  tableUpdated: ${JSON.stringify(d.tableUpdated)},
  retrieved: ${JSON.stringify(retrieved)},
  source: 'Danmarks Statistik HISB8',
  sourceUrl: 'https://www.statbank.dk/HISB8',
};

export const LIFE_TABLE_DK = {
  remaining: {
${sexBlock(table, 'remaining', 2)}
  },
  survivors: {
${sexBlock(table, 'survivors', null)}
  },
};
`;
}

/** Data the app does not import (kept apart so bundle size never depends on tree-shaking). */
export function renderLifeTableExtras(d, retrieved) {
  const { table } = d;
  return `${HEADER('dst')}// Not imported by the app. Same period as lifeTableDK.generated.js (retrieved ${retrieved}).

// q_x per 100,000 (HISB8 TAVLE 2), ages 0..99.
export const MORTALITY_DK = {
${sexBlock(table, 'mortality', null).replace(/^ {4}/gm, '  ')}
};

// HISB7: life expectancy of a newborn, same period.
export const NEWBORN_DK = ${JSON.stringify(d.newborn)};

// HISBR / HISBK / LABY21: life expectancy at birth by area (each table has its own period).
export const REGIONAL_DK = ${JSON.stringify(d.regional, null, 2)};
`;
}

// ---------------------------------------------------------------------------
// Eurostat + World Bank (countries, healthy life years)
// ---------------------------------------------------------------------------

/** Decode a JSON-stat 2.0 cube into [{ <dim>: category, ..., value }]. */
export function decodeJsonStat(js) {
  if (js.error) throw new Error(`Eurostat error: ${JSON.stringify(js.error)}`);
  const { id, size, dimension, value } = js;
  if (!id || !size || !dimension || !value) throw new Error('Unexpected JSON-stat response');
  const inv = id.map((d) => {
    const out = {};
    for (const [cat, idx] of Object.entries(dimension[d].category.index)) out[idx] = cat;
    return out;
  });
  const rows = [];
  for (const [key, val] of Object.entries(value)) {
    if (typeof val !== 'number') continue;
    let k = Number(key);
    const row = { value: val };
    for (let i = id.length - 1; i >= 0; i--) {
      row[id[i]] = inv[i][k % size[i]];
      k = Math.floor(k / size[i]);
    }
    rows.push(row);
  }
  return rows;
}

const COUNTRIES = [
  { key: 'Sweden', country: 'Sverige', geo: 'SE', iso3: 'SWE', primary: 'eurostat' },
  { key: 'Norway', country: 'Norge', geo: 'NO', iso3: 'NOR', primary: 'eurostat' },
  { key: 'Finland', country: 'Finland', geo: 'FI', iso3: 'FIN', primary: 'eurostat' },
  { key: 'Japan', country: 'Japan', iso3: 'JPN', primary: 'worldbank' },
  { key: 'World', country: 'Verdensgennemsnit', iso3: 'WLD', primary: 'worldbank' },
];
const EUROSTAT_SOURCE = 'Eurostat demo_mlexpec';
const WORLD_BANK_SOURCE = 'Verdensbanken SP.DYN.LE00';

/** Latest year in which every field is a number. series: { year: { field: n } } */
function latestComplete(series, fields) {
  const years = Object.entries(series ?? {})
    .filter(([, v]) => fields.every((f) => typeof v[f] === 'number'))
    .map(([y]) => Number(y))
    .sort((a, b) => b - a);
  return years.length ? years[0] : null;
}

async function fetchEurostatLE(geos) {
  const out = {};
  for (const sex of ['M', 'F', 'T']) {
    const qs = new URLSearchParams({ format: 'JSON', lang: 'EN', age: 'Y_LT1', sex, sinceTimePeriod: '2015' });
    for (const geo of geos) qs.append('geo', geo);
    for (const r of decodeJsonStat(await getJson(`${EUROSTAT_API}/demo_mlexpec?${qs}`))) {
      ((out[r.geo] ??= {})[r.time] ??= {})[sex] = r.value;
    }
  }
  return out;
}

async function fetchWorldBankLE(codes) {
  const series = {};
  for (const [field, indicator] of [
    ['male', 'SP.DYN.LE00.MA.IN'],
    ['female', 'SP.DYN.LE00.FE.IN'],
    ['total', 'SP.DYN.LE00.IN'],
  ]) {
    const js = await getJson(
      `${WORLD_BANK_API}/country/${codes.join(';')}/indicator/${indicator}?format=json&mrv=8&per_page=200`
    );
    if (!Array.isArray(js) || !Array.isArray(js[1])) throw new Error(`Unexpected World Bank response for ${indicator}`);
    for (const row of js[1]) {
      if (typeof row.value === 'number') ((series[row.countryiso3code] ??= {})[row.date] ??= {})[field] = row.value;
    }
  }
  return series;
}

/** Years currently committed in the country block: { Sweden: 2024, ... }. */
export function parseCountryYears(src) {
  const years = {};
  for (const m of src.matchAll(/^\s*"([^"]+)":\s*\{[^}]*\byear:\s*(\d{4})\b/gm)) years[m[1]] = Number(m[2]);
  return years;
}

/**
 * Build country rows from raw provider data; returns { rows, warnings, errors }.
 * Pure so it can be tested with fixtures.
 */
export function buildCountryRows({ eurostat, worldBank, previousYears = {} }) {
  const rows = [];
  const warnings = [];
  const errors = [];
  for (const c of COUNTRIES) {
    let row;
    if (c.primary === 'eurostat') {
      const year = latestComplete(eurostat[c.geo], ['M', 'F', 'T']);
      if (year === null) {
        errors.push(`No complete Eurostat data for ${c.geo}`);
        continue;
      }
      const v = eurostat[c.geo][year];
      row = { ...c, male: round1(v.M), female: round1(v.F), total: round1(v.T), source: EUROSTAT_SOURCE, year };
      const wb = worldBank[c.iso3]?.[year];
      if (wb && typeof wb.male === 'number' && typeof wb.female === 'number') {
        for (const f of ['male', 'female']) {
          const diff = Math.abs(wb[f] - row[f]);
          if (diff > COUNTRY_WARN_DIFF) {
            warnings.push(
              `${c.key} ${year} ${f}: Eurostat ${row[f]} vs World Bank ${round1(wb[f])} differ by ${diff.toFixed(2)} years`
            );
          }
        }
      } else {
        warnings.push(`${c.key} ${year}: no World Bank value for the same year, cross-check skipped`);
      }
    } else {
      const year = latestComplete(worldBank[c.iso3], ['male', 'female', 'total']);
      if (year === null) {
        errors.push(`No complete World Bank data for ${c.iso3}`);
        continue;
      }
      const v = worldBank[c.iso3][year];
      row = { ...c, male: round1(v.male), female: round1(v.female), total: round1(v.total), source: WORLD_BANK_SOURCE, year };
    }
    if (!(row.male > 40 && row.male < 100 && row.female > 40 && row.female < 100)) {
      errors.push(`${c.key}: implausible values ${row.male}/${row.female}`);
    }
    if (c.key !== 'World' && row.male >= row.female) errors.push(`${c.key}: male >= female`);
    if (previousYears[c.key] && row.year < previousYears[c.key]) {
      errors.push(`${c.key}: year ${row.year} is older than the committed ${previousYears[c.key]}`);
    }
    rows.push(row);
  }
  return { rows, warnings, errors };
}

const COUNTRY_BEGIN = '// BEGIN GENERATED COUNTRY TABLE (scripts/refresh-data.mjs countries)';
const COUNTRY_END = '// END GENERATED COUNTRY TABLE';

export function renderCountryBlock(rows, retrieved) {
  const lines = rows.map(
    (r) =>
      `    ${JSON.stringify(r.key)}: { male: ${r.male.toFixed(1)}, female: ${r.female.toFixed(1)}, total: ${r.total.toFixed(1)}, ` +
      `country: ${JSON.stringify(r.country)}, source: ${JSON.stringify(r.source)}, year: ${r.year} },`
  );
  return `${COUNTRY_BEGIN}\nexport const countryTable = {\n${lines.join('\n')}\n};\nexport const countryTableRetrieved = ${JSON.stringify(retrieved)};\n${COUNTRY_END}`;
}

/** Replace the generated block (accepting the pre-#96 marker text too). */
export function spliceCountryBlock(src, block) {
  const start = src.search(/\/\/ BEGIN GENERATED COUNTRY TABLE/);
  const end = src.indexOf(COUNTRY_END);
  if (start === -1 || end === -1 || end < start) throw new Error('Country table markers not found');
  return src.slice(0, start) + block + src.slice(end + COUNTRY_END.length);
}

async function fetchCountries(src) {
  const eurostat = await fetchEurostatLE(COUNTRIES.filter((c) => c.geo).map((c) => c.geo));
  const worldBank = await fetchWorldBankLE(COUNTRIES.map((c) => c.iso3));
  const res = buildCountryRows({ eurostat, worldBank, previousYears: parseCountryYears(src) });
  for (const w of res.warnings) console.warn(`WARN countries: ${w}`);
  if (res.errors.length) throw new ValidationError('countries', res.errors);
  return res.rows;
}

// Healthy life years --------------------------------------------------------

export const HLY_INDICATORS = ['HLY_Y0', 'HLY_Y65', 'LE_Y65'];
export const HLY_GEOS = ['DK', 'SE', 'NO', 'FI', 'IS', 'DE', 'EU27_2020'];

/** Latest value per geo/indicator/sex: { DK: { HLY_Y0: { male: {value, year}, female: {...} } } } */
export function buildHly(rows) {
  const out = {};
  for (const r of rows) {
    if (!HLY_INDICATORS.includes(r.hlth_hle) || r.unit !== 'YR') continue;
    const sex = r.sex === 'M' ? 'male' : r.sex === 'F' ? 'female' : null;
    if (!sex) continue;
    const slot = ((out[r.geo] ??= {})[r.hlth_hle] ??= {});
    if (!slot[sex] || Number(r.time) > slot[sex].year) slot[sex] = { value: r.value, year: Number(r.time) };
  }
  return out;
}

/** Parse the committed HEALTHY_LIFE_YEARS object (JSON) out of the generated module source. */
export function parseCommittedHly(src) {
  const m = src?.match(/export const HEALTHY_LIFE_YEARS = (\{[\s\S]*?\n\});/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

export function validateHly(data, { previous } = {}) {
  const errors = [];
  for (const ind of HLY_INDICATORS) {
    for (const sex of ['male', 'female']) {
      const e = data.DK?.[ind]?.[sex];
      if (!e) errors.push(`DK ${ind} ${sex} missing`);
      else {
        const max = ind === 'HLY_Y0' ? 90 : 35;
        if (!(e.value > 0 && e.value < max)) errors.push(`DK ${ind} ${sex} = ${e.value} is implausible`);
      }
    }
  }
  // Regression check per geo/indicator/sex against the committed value (geos publish at different times).
  for (const [geo, g] of Object.entries(previous ?? {})) {
    for (const [ind, bySex] of Object.entries(g)) {
      for (const [sex, old] of Object.entries(bySex)) {
        const now = data[geo]?.[ind]?.[sex];
        if (now && old?.year && now.year < old.year) {
          errors.push(`${geo} ${ind} ${sex}: year ${now.year} is older than the committed ${old.year}`);
        }
      }
    }
  }
  for (const [geo, g] of Object.entries(data)) {
    for (const sex of ['male', 'female']) {
      const h = g.HLY_Y65?.[sex]?.value;
      const l = g.LE_Y65?.[sex]?.value;
      if (typeof h === 'number' && typeof l === 'number' && h > l) {
        errors.push(`${geo} ${sex}: HLY_Y65 ${h} exceeds LE_Y65 ${l}`);
      }
    }
  }
  return errors;
}

export function renderHly(data, { updated, retrieved }) {
  const meta = {
    source: 'Eurostat hlth_hlye',
    sourceUrl: 'https://ec.europa.eu/eurostat/databrowser/view/hlth_hlye',
    updated,
    retrieved,
  };
  return `${HEADER('hly')}// Healthy life years (HLY_Y0, HLY_Y65) and life expectancy at 65 (LE_Y65), latest year per country and sex.

export const HEALTHY_LIFE_YEARS_META = ${JSON.stringify(meta, null, 2)};
export const HEALTHY_LIFE_YEARS = ${JSON.stringify(data, null, 2)};
`;
}

async function fetchHly(existingSrc) {
  const qs = new URLSearchParams({ format: 'JSON', lang: 'EN', unit: 'YR', sinceTimePeriod: '2019' });
  for (const s of ['M', 'F']) qs.append('sex', s);
  for (const i of HLY_INDICATORS) qs.append('hlth_hle', i);
  for (const g of HLY_GEOS) qs.append('geo', g);
  const js = await getJson(`${EUROSTAT_API}/hlth_hlye?${qs}`);
  const data = buildHly(decodeJsonStat(js));
  const errors = validateHly(data, { previous: parseCommittedHly(existingSrc) });
  if (errors.length) throw new ValidationError('hly', errors);
  return { data, updated: js.updated ?? null };
}

// ---------------------------------------------------------------------------
// Staleness check
// ---------------------------------------------------------------------------

/** True when DST's latest period starts after the committed one. */
export function isStale(committedTid, latest) {
  return Number(String(latest).slice(0, 4)) > Number(String(committedTid).slice(0, 4));
}

async function check({ simulateLatest }) {
  const { LIFE_TABLE_META } = await import(pathToFileURL(PATHS.lifeTable).href);
  const info = await dstTableInfo('HISB8');
  const latest = simulateLatest ?? latestTid(info);
  return {
    committed: LIFE_TABLE_META.tid,
    committedRetrieved: LIFE_TABLE_META.retrieved,
    latest,
    latestPeriod: periodLabel(latest),
    tableUpdated: info.updated,
    stale: isStale(LIFE_TABLE_META.tid, latest),
    simulated: Boolean(simulateLatest),
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

async function readOrNull(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

/** Render with the old retrieval date first; only bump the date when content actually changed. */
function stable(render, existing, oldRetrieved) {
  if (existing && oldRetrieved && render(oldRetrieved) === existing) return existing;
  return render(today());
}

async function planDst() {
  const existing = await readOrNull(PATHS.lifeTable);
  const existingExtras = await readOrNull(PATHS.lifeTableExtras);
  const previousTid = existing?.match(/\btid:\s*"([^"]+)"/)?.[1];
  const d = await fetchDst({ previousTid });
  const oldRetrieved = existing?.match(/\bretrieved:\s*"([^"]+)"/)?.[1];
  // One retrieval date for both files: bump it only if either file's content changes.
  const unchanged =
    oldRetrieved &&
    renderLifeTable(d, oldRetrieved) === existing &&
    renderLifeTableExtras(d, oldRetrieved) === existingExtras;
  const retrieved = unchanged ? oldRetrieved : today();
  const l100 = { male: d.table.male.survivors[AGES], female: d.table.female.survivors[AGES] };
  console.log(`dst: period ${d.tid} (table updated ${d.tableUpdated}), l_100 ${JSON.stringify(l100)}`);
  return [
    { path: PATHS.lifeTable, content: renderLifeTable(d, retrieved), existing },
    { path: PATHS.lifeTableExtras, content: renderLifeTableExtras(d, retrieved), existing: existingExtras },
  ];
}

async function planCountries() {
  const existing = await readFile(PATHS.countries, 'utf8');
  const rows = await fetchCountries(existing);
  const oldRetrieved = existing.match(/countryTableRetrieved = "([^"]+)"/)?.[1];
  const make = (r) => spliceCountryBlock(existing, renderCountryBlock(rows, r));
  const content = stable(make, existing, oldRetrieved);
  for (const r of rows) console.log(`countries: ${r.key} ${r.male}/${r.female} (${r.source}, ${r.year})`);
  return [{ path: PATHS.countries, content, existing }];
}

async function planHly() {
  const existing = await readOrNull(PATHS.hly);
  const { data, updated } = await fetchHly(existing);
  const oldRetrieved = existing?.match(/"retrieved":\s*"([^"]+)"/)?.[1];
  const content = stable((r) => renderHly(data, { updated, retrieved: r }), existing, oldRetrieved);
  console.log(`hly: DK HLY_Y0 ${data.DK.HLY_Y0.male.value}/${data.DK.HLY_Y0.female.value} (${data.DK.HLY_Y0.male.year})`);
  return [{ path: PATHS.hly, content, existing }];
}

async function planCohort() {
  throw new CohortUnavailableError();
}

export class CohortUnavailableError extends Error {
  constructor() {
    super(
      'cohort: not available yet (src/data/cohortTable.generated.js and its builder are a separate pull request); ' +
        'nothing was written'
    );
  }
}

const PLANS = { dst: planDst, countries: planCountries, hly: planHly, cohort: planCohort };

async function applyWrites(writes, dryRun) {
  const changed = writes.filter((w) => w.content !== w.existing);
  if (!changed.length) {
    console.log('Everything already up to date.');
    return;
  }
  if (dryRun) {
    for (const w of changed) console.log(`[dry-run] would write ${w.path}`);
    return;
  }
  const tmps = [];
  try {
    for (const w of changed) {
      const tmp = `${w.path}.tmp`;
      await writeFile(tmp, w.content, 'utf8');
      tmps.push([tmp, w.path]);
    }
    for (const [tmp, path] of tmps) await rename(tmp, path);
  } catch (err) {
    await Promise.all(tmps.map(([tmp]) => unlink(tmp).catch(() => {})));
    throw err;
  }
  for (const w of changed) console.log(`wrote ${w.path}`);
}

export async function main(argv) {
  const args = argv.filter((a) => !a.startsWith('--'));
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const cmd = args[0];
  if (cmd === 'check') {
    const i = argv.indexOf('--simulate-latest');
    const simulateLatest = i >= 0 ? argv[i + 1] : undefined;
    console.log(JSON.stringify(await check({ simulateLatest })));
    return;
  }
  const steps = cmd === 'all' ? ['dst', 'countries', 'hly'] : PLANS[cmd] ? [cmd] : null;
  if (!steps) {
    console.error('Usage: node scripts/refresh-data.mjs <dst|countries|hly|cohort|all|check> [--dry-run]');
    process.exit(2);
  }
  const writes = [];
  for (const step of steps) writes.push(...(await PLANS[step]()));
  await applyWrites(writes, flags.has('--dry-run'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`refresh-data failed: ${err.message}`);
    process.exit(1);
  });
}
