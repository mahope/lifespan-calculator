// Part D: per-file raw/gzip/brotli sizes of a Vite dist directory + chunk list + total JS gz.
// Usage: node dist_report.mjs <distDir>
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';

const root = process.argv[2];
const files = [];
(function walk(d) {
  for (const n of readdirSync(d).sort()) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(root);

const rows = files.map((p) => {
  const buf = readFileSync(p);
  const gz = gzipSync(buf, { level: 9 }).length;
  const br = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
  return { file: relative(root, p).replaceAll('\\', '/'), raw: buf.length, gzip: gz, brotli: br };
});

const isJs = (r) => /\.js$/.test(r.file);
const isMap = (r) => /\.map$/.test(r.file);
const tot = (arr, k) => arr.reduce((s, r) => s + r[k], 0);
const kb = (n) => (n / 1024).toFixed(2);

console.log('| file | raw (KiB) | gzip -9 (KiB) | brotli q11 (KiB) |');
console.log('|---|---:|---:|---:|');
for (const r of rows) console.log(`| ${r.file} | ${kb(r.raw)} | ${isMap(r) ? '-' : kb(r.gzip)} | ${isMap(r) ? '-' : kb(r.brotli)} |`);
const js = rows.filter(isJs);
const maps = rows.filter(isMap);
const nonMap = rows.filter((r) => !isMap(r));
console.log('');
console.log(`files: ${rows.length}  (js: ${js.length}, source maps: ${maps.length})`);
console.log(`total JS raw ${kb(tot(js, 'raw'))} KiB, gzip ${kb(tot(js, 'gzip'))} KiB, brotli ${kb(tot(js, 'brotli'))} KiB  [includes sw.js + workbox runtime]`);
const appJs = js.filter((r) => r.file.startsWith('assets/'));
console.log(`assets/*.js (${appJs.length} chunks) raw ${kb(tot(appJs, 'raw'))} KiB, gzip ${kb(tot(appJs, 'gzip'))} KiB, brotli ${kb(tot(appJs, 'brotli'))} KiB`);
console.log(`total dist excluding maps: raw ${kb(tot(nonMap, 'raw'))} KiB, gzip ${kb(tot(nonMap, 'gzip'))} KiB`);
console.log(`source maps: ${maps.length} files, raw ${kb(tot(maps, 'raw'))} KiB`);
// Critical path for "/" : index.html references these.
const html = readFileSync(join(root, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1].slice(1));
const crit = rows.filter((r) => refs.includes(r.file));
console.log(`index.html direct refs: ${refs.join(', ')}`);
console.log(`direct refs total gzip: ${kb(tot(crit, 'gzip'))} KiB (raw ${kb(tot(crit, 'raw'))} KiB)`);
