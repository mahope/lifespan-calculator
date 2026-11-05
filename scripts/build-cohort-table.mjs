#!/usr/bin/env node
// Builds src/data/cohortTable.generated.js: projected ("cohort") remaining life
// expectancy per age 0-99 and sex, from Danmarks Statistik table FRDK426
// (mortality assumptions of the 2026 population projection).
//
// Method: a person aged `a` in the first projection year (2026) meets the
// mortality q(a+k, 2026+k) in year k. Survival is S_{k+1} = S_k * (1 - q) and
// the expected remaining years are the trapezoid sum of (S_k + S_{k+1}) / 2.
// After the last projected year (2069) mortality is held at the 2069 level,
// i.e. no further improvement (conservative).
//
// Usage: node scripts/build-cohort-table.mjs
// No dependencies (Node fetch). Re-runnable. On ANY failure (network, shape,
// validation) it exits non-zero and leaves the generated file unchanged.

import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const TARGET = fileURLToPath(new URL('../src/data/cohortTable.generated.js', import.meta.url));
const API = 'https://api.statbank.dk/v1';
const TABLE = 'FRDK426';
const MAXAGE = 109; // oldest single-year age in FRDK426; q is 1 beyond it
// First projection year of the FRDK426 vintage this script was written for (the 2026
// population projection). Explicit on purpose: when DST publishes a new projection the
// first year moves, the build fails here, and a human re-checks the method and the
// source text in render() before bumping this.
export const BASE_YEAR = 2026;
const FETCH_TIMEOUT_MS = 30_000;
export const OUT_AGES = 100; // cohort table covers ages 0..99
const TOLERANCE = 0.05; // recomputed period e_x vs DST's e_x
export const HOLD_RULE = 'Dødeligheden fastholdes på 2069-niveau efter 2069 (ingen yderligere forbedring)';

const SEX = { Mænd: 'male', Kvinder: 'female' };

/** Parse the BULK CSV (`;`-separated, decimal comma) into q and e_x maps. */
export function parseCsv(text) {
  const q = new Map(); // `${sex}|${year}|${age}` -> probability
  const e = new Map(); // same key -> DST's period e_x
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length || !lines[0].startsWith('KØN;ALDER;TAVLE;TID;INDHOLD')) {
    throw new Error(`Unexpected CSV header: ${lines[0]}`);
  }
  for (const line of lines.slice(1)) {
    const [kon, alder, tavle, tid, val] = line.split(';');
    const sex = SEX[kon];
    const age = parseInt(alder, 10);
    const year = parseInt(tid, 10);
    const v = parseFloat(String(val).replace(',', '.'));
    if (!sex || !Number.isInteger(age) || !Number.isInteger(year) || !Number.isFinite(v)) {
      throw new Error(`Unparseable row: ${line}`);
    }
    const key = `${sex}|${year}|${age}`;
    if (tavle.startsWith('Aldersklassens dødshyppighed')) q.set(key, v / 100000);
    else if (tavle.startsWith('Middellevetid')) e.set(key, v);
    else throw new Error(`Unknown TAVLE: ${tavle}`);
  }
  return { q, e };
}

function structure(q) {
  const years = [...new Set([...q.keys()].map((k) => Number(k.split('|')[1])))].sort((a, b) => a - b);
  const ages = [...new Set([...q.keys()].map((k) => Number(k.split('|')[2])))].sort((a, b) => a - b);
  return { years, ages, firstYear: years[0], lastYear: years[years.length - 1] };
}

/** Throws unless the data is complete, in range and reproduces DST's own e_x. */
export function validate({ q, e }) {
  const { years, ages, firstYear, lastYear } = structure(q);
  if (ages.length < 100) throw new Error(`Only ${ages.length} ages (need 100+)`);
  if (ages[0] !== 0 || ages[ages.length - 1] !== MAXAGE) throw new Error('Ages must run 0..109');
  if (years.length < 2 || lastYear - firstYear + 1 !== years.length) throw new Error('Years are not contiguous');
  for (const sex of ['male', 'female']) {
    for (const y of years) {
      for (const a of ages) {
        const v = q.get(`${sex}|${y}|${a}`);
        if (v === undefined) throw new Error(`Missing q for ${sex} ${y} age ${a}`);
        if (!(v >= 0 && v <= 1)) throw new Error(`q out of [0,1]: ${sex} ${y} age ${a} = ${v}`);
      }
    }
    for (const a of ages) {
      const dst = e.get(`${sex}|${firstYear}|${a}`);
      if (dst === undefined) throw new Error(`Missing DST e_x for ${sex} ${firstYear} age ${a}`);
      const mine = periodE(q, sex, firstYear, a);
      if (Math.abs(mine - dst) > TOLERANCE) {
        throw new Error(`Period e_x mismatch ${sex} age ${a}: recomputed ${mine.toFixed(3)} vs DST ${dst}`);
      }
    }
  }
}

function periodE(q, sex, year, age0) {
  let S = 1;
  let ex = 0;
  for (let a = age0; a <= MAXAGE + 1; a++) {
    const qa = a <= MAXAGE ? q.get(`${sex}|${year}|${a}`) : 1;
    const next = S * (1 - qa);
    ex += (S + next) / 2;
    S = next;
  }
  return ex;
}

/** Cohort remaining life expectancy for a person aged `age0` in the first year. */
export function cohortE(q, sex, age0) {
  const { firstYear, lastYear } = structure(q);
  let S = 1;
  let ex = 0;
  for (let k = 0; age0 + k <= MAXAGE + 1; k++) {
    const a = age0 + k;
    const year = Math.min(firstYear + k, lastYear); // hold-after-last-year rule
    const qa = a <= MAXAGE ? q.get(`${sex}|${year}|${a}`) : 1;
    const next = S * (1 - qa);
    ex += (S + next) / 2;
    S = next;
    if (S < 1e-9) break;
  }
  return ex;
}

export function buildTable(q) {
  const remaining = { male: [], female: [] };
  for (const sex of ['male', 'female']) {
    for (let a = 0; a < OUT_AGES; a++) remaining[sex].push(Math.round(cohortE(q, sex, a) * 100) / 100);
  }
  return remaining;
}

export function render({ remaining, tableUpdated, retrieved, lastYear }) {
  const source = `Danmarks Statistik, ${TABLE} (forudsætninger om dødelighed i befolkningsfremskrivningen 2026)`;
  const row = (a) => `[${a.map((n) => n.toFixed(2)).join(', ')}]`;
  return `// GENERATED by scripts/build-cohort-table.mjs - do not edit by hand.
// Projected (cohort) remaining life expectancy e_x per age 0-99, from DST ${TABLE}.
export const COHORT_TABLE = {
  source: ${JSON.stringify(source)},
  tableUpdated: ${JSON.stringify(tableUpdated)},
  retrieved: ${JSON.stringify(retrieved)},
  holdRule: ${JSON.stringify(HOLD_RULE)},
  baseYear: ${BASE_YEAR},
  lastProjectedYear: ${lastYear},
  remaining: {
    male: ${row(remaining.male)},
    female: ${row(remaining.female)},
  },
};
`;
}

/** fetch with a hard timeout so a hung DST API cannot hang the script. */
export async function fetchWithTimeout(url, options = {}, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout after ${ms / 1000} s for ${url}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export function assertBaseYear(firstYear) {
  if (firstYear !== BASE_YEAR) {
    throw new Error(`First projection year is ${firstYear}, expected ${BASE_YEAR}: new vintage, review the script`);
  }
}

async function getJson(url) {
  const res = await fetchWithTimeout(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  const info = await getJson(`${API}/tableinfo/${TABLE}?format=JSON`);
  if (!info.updated) throw new Error('tableinfo has no "updated"');
  const res = await fetchWithTimeout(`${API}/data`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      table: TABLE,
      format: 'BULK',
      lang: 'da',
      variables: ['KØN', 'ALDER', 'TAVLE', 'Tid'].map((code) => ({ code, values: ['*'] })),
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${API}/data`);
  const data = parseCsv(await res.text());
  validate(data);
  const { firstYear, lastYear } = structure(data.q);
  assertBaseYear(firstYear);
  const remaining = buildTable(data.q);
  const out = render({
    remaining,
    tableUpdated: info.updated.slice(0, 10),
    retrieved: new Date().toISOString().slice(0, 10),
    lastYear,
  });

  let previous = null;
  try {
    previous = await readFile(TARGET, 'utf8');
  } catch {
    // first run
  }
  // Keep the file (and its `retrieved` date) untouched when nothing changed.
  const strip = (s) => (s ?? '').replace(/retrieved: "[^"]*"/, '');
  if (previous !== null && strip(previous) === strip(out)) {
    console.log('cohortTable.generated.js is up to date');
    return;
  }
  const tmp = `${TARGET}.tmp`;
  await writeFile(tmp, out, 'utf8');
  await rename(tmp, TARGET);
  console.log(`Wrote ${TARGET}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(`build-cohort-table failed: ${err.message}`);
    process.exit(1);
  });
}
