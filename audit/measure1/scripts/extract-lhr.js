// Pull CLS / LCP evidence and the filmstrip from an already-captured raw Lighthouse JSON (no new traffic).
const fs = require('fs');
const [, , raw, outDir] = process.argv;
const lhr = JSON.parse(fs.readFileSync(raw, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const A = lhr.audits;
const pick = (id) => (A[id] ? { score: A[id].score, displayValue: A[id].displayValue, details: A[id].details } : null);
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === 'data' && typeof v === 'string' && v.length > 500 ? '<data>' : v)));
const out = {
  layoutShifts: strip(pick('layout-shifts')),
  clsCulprits: strip(pick('cls-culprits-insight')),
  lcpElement: strip(pick('largest-contentful-paint-element')),
  lcpBreakdown: strip(pick('lcp-breakdown-insight')),
  networkDependencyTree: strip(pick('network-dependency-tree-insight')),
  renderBlocking: strip(pick('render-blocking-insight')),
  robotsTxt: strip(pick('robots-txt')),
  llmsTxt: strip(pick('llms-txt')),
  ardSchema: strip(pick('ard-schema')),
  cacheInsight: strip(pick('cache-insight')),
};
fs.writeFileSync(outDir + '/home-mobile-1-evidence.json', JSON.stringify(out, null, 1));
const th = A['screenshot-thumbnails'] && A['screenshot-thumbnails'].details && A['screenshot-thumbnails'].details.items || [];
th.forEach((t, i) => {
  const b = Buffer.from(t.data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  fs.writeFileSync(`${outDir}/filmstrip-${String(i).padStart(2, '0')}-${Math.round(t.timing)}ms.jpg`, b);
});
console.log('frames', th.length, 'timings', th.map((t) => Math.round(t.timing)).join(','));
