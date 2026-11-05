// Fetches the Danmarks Statistik tables the data pages need and writes
// src/data/*.generated.json. Every number is { value, period, source, retrieved }.
// Run by hand (npm run data); the generated files are committed so the site build
// itself needs no network. Source: https://api.statbank.dk/v1/data
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const API = 'https://api.statbank.dk/v1/data'
const OUT = new URL('../src/data/', import.meta.url)
const retrieved = new Date().toISOString().slice(0, 10)

async function table(id, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ table: id, format: 'CSV', lang: 'da', delimiter: 'Semicolon', variables }),
  })
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`)
  const lines = (await res.text()).trim().split(/\r?\n/)
  const head = lines.shift().split(';')
  return lines.map((l) => Object.fromEntries(l.split(';').map((v, i) => [head[i], v])))
}

const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null // DST marks suppressed cells as 0 or ".."
}
const stamp = (source, period, value) => ({ value, period, source, retrieved })
const periodOf = (r) => r['TID'] ?? r['Tid'] ?? Object.values(r).at(-2)
const valueOf = (r) => Object.values(r).at(-1)
const sexKey = (t) => ({ Mænd: 'male', Kvinder: 'female', 'I alt': 'total' })[t]
const write = (name, data) => {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(new URL(name, OUT), JSON.stringify(data, null, 1) + '\n')
  console.log('wrote', fileURLToPath(new URL(name, OUT)))
}

// HISB8: e_x (TAVLE 3) for every age at three snapshot periods, for the age pages.
const snap = ['1981:1982', '2000:2001', '2024:2025']
const ages = Array.from({ length: 100 }, (_, i) => String(i))
const hist = await table('HISB8', [
  { code: 'ALDER', values: ages },
  { code: 'KØN', values: ['M', 'K'] },
  { code: 'TAVLE', values: ['3'] },
  { code: 'Tid', values: snap },
])
const history = { male: {}, female: {} }
for (const r of hist) {
  const sex = sexKey(r['KØN'])
  const age = parseInt(r['ALDER'])
  const p = periodOf(r).replace(/^(\d{4}):(\d{4})$/, '$1:$2')
  ;(history[sex][p] ??= {})[age] = stamp('DST HISB8', p, num(valueOf(r)))
}
write('history.generated.json', history)

// HISB8 national e0 and e65 for every 2-year period 1981:1982 .. 2024:2025.
const nat = await table('HISB8', [
  { code: 'ALDER', values: ['0', '65'] },
  { code: 'KØN', values: ['M', 'K'] },
  { code: 'TAVLE', values: ['3'] },
  { code: 'Tid', values: ['*'] },
])
const national = { e0: { male: [], female: [] }, e65: { male: [], female: [] } }
for (const r of nat) {
  const sex = sexKey(r['KØN'])
  const key = r['ALDER'].startsWith('0') ? 'e0' : 'e65'
  const p = periodOf(r)
  national[key][sex].push(stamp('DST HISB8', p, num(valueOf(r))))
}
for (const k of ['e0', 'e65']) for (const s of ['male', 'female']) national[k][s].sort((a, b) => a.period.localeCompare(b.period))
write('national.generated.json', national)

// HISBR: the five regions, latest 2-year period. HISBK: all kommuner, latest 5-year window.
const reg = await table('HISBR', [
  { code: 'OMRÅDE', values: ['*'] },
  { code: 'KØN', values: ['TOT', 'M', 'K'] },
  { code: 'Tid', values: ['2024:2025'] },
])
const regions = {}
for (const r of reg) {
  const name = r['OMRÅDE']
  if (name === 'Hele landet') continue
  ;(regions[name] ??= {})[sexKey(r['KØN'])] = stamp('DST HISBR', '2024:2025', num(valueOf(r)))
}
write('regions.generated.json', regions)

const kom = await table('HISBK', [
  { code: 'OMRÅDE', values: ['*'] },
  { code: 'KØN', values: ['TOT', 'M', 'K'] },
  { code: 'Tid', values: ['2021:2025'] },
])
const kommuner = {}
for (const r of kom) {
  const name = r['OMRÅDE']
  if (name === 'Hele landet') continue
  ;(kommuner[name] ??= {})[sexKey(r['KØN'])] = stamp('DST HISBK', '2021:2025', num(valueOf(r)))
}
write('kommuner.generated.json', kommuner)
