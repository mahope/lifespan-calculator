// Shrink raw screenshots (out/screenshots-raw) to <=150 KB JPEGs in out/screenshots using ffmpeg.
// usage: node compress.js [rawDir] [outDir] [maxBytes]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const rawDir = process.argv[2] || path.join(__dirname, 'out/screenshots-raw');
const outDir = process.argv[3] || path.join(__dirname, 'out/screenshots');
const MAX = Number(process.argv[4] || 150000);
fs.mkdirSync(outDir, { recursive: true });
let total = 0;
for (const f of fs.readdirSync(rawDir).filter((x) => x.endsWith('.jpg')).sort()) {
  const src = path.join(rawDir, f), dst = path.join(outDir, f);
  let done = false, info = '';
  for (const scale of [1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.28]) {
    for (const q of [6, 9, 13, 18]) {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', `scale=trunc(iw*${scale}/2)*2:-2`, '-q:v', String(q), dst]);
      const sz = fs.statSync(dst).size;
      if (sz <= MAX) { done = true; info = `scale=${scale} q=${q} ${sz}`; total += sz; break; }
    }
    if (done) break;
  }
  if (!done) { info = 'STILL TOO BIG ' + fs.statSync(dst).size; total += fs.statSync(dst).size; }
  console.log(f, info);
}
console.log('TOTAL bytes', total);
