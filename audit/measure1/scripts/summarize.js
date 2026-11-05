// Build lighthouse/summary.csv, medians, failing-audits aggregate and the markdown tables for REPORT.md.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'out/lighthouse');
const files = fs.readdirSync(dir).filter((f) => /^[a-z-]+-(mobile|desktop)-\d\.json$/.test(f)).sort();
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); if (!s.length) return null; const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const rows = files.map((f) => {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const m = f.match(/^([a-z-]+)-(mobile|desktop)-(\d)\.json$/);
  return { f, slug: m[1], ff: m[2], run: +m[3], perf: j.scores.performance, a11y: j.scores.accessibility, bp: j.scores['best-practices'], seo: j.scores.seo, agentic: j.scores['agentic-browsing'],
    lcp: j.metrics.lcp_ms, cls: j.metrics.cls, tbt: j.metrics.tbt_ms, fcp: j.metrics.fcp_ms, si: j.metrics.si_ms, tti: j.metrics.tti_ms, ttfb: j.metrics.server_response_ms,
    bytes: j.network.total_transfer_bytes, js: j.network.js_transfer_bytes, css: j.network.css_transfer_bytes, reqs: j.network.total_requests, bench: j.environment.benchmarkIndex, load: j.environment.loadavg_after, j };
});
const head = 'page,formFactor,run,performance,accessibility,best-practices,seo,agentic-browsing,lcp_ms,cls,tbt_ms,fcp_ms,speed_index_ms,tti_ms,server_response_ms,transfer_bytes,js_bytes,css_bytes,requests,benchmarkIndex,loadavg_after';
fs.writeFileSync(path.join(dir, 'summary.csv'), head + '\n' + rows.map((r) => [r.slug, r.ff, r.run, r.perf, r.a11y, r.bp, r.seo, r.agentic, r.lcp, r.cls, r.tbt, r.fcp, r.si, r.tti, r.ttfb, r.bytes, r.js, r.css, r.reqs, r.bench, (r.load || '').replace(/ /g, '/')].join(',')).join('\n') + '\n');
const keys = ['perf', 'a11y', 'bp', 'seo', 'agentic', 'lcp', 'cls', 'tbt', 'fcp', 'si', 'tti', 'ttfb', 'bytes', 'js', 'css', 'reqs', 'bench'];
const medians = {};
const md = ['| page | form | n | perf | a11y | BP | SEO | LCP ms | CLS | TBT ms | FCP ms | SI ms | transfer KB | JS KB | reqs |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
for (const slug of [...new Set(rows.map((r) => r.slug))]) for (const ff of ['mobile', 'desktop']) {
  const rs = rows.filter((r) => r.slug === slug && r.ff === ff); if (!rs.length) continue;
  const o = { n: rs.length }; for (const k of keys) o[k] = med(rs.map((r) => r[k]));
  medians[`${slug}-${ff}`] = o;
  md.push(`| ${slug} | ${ff} | ${o.n} | ${o.perf} | ${o.a11y} | ${o.bp} | ${o.seo} | ${Math.round(o.lcp)} | ${o.cls} | ${Math.round(o.tbt)} | ${Math.round(o.fcp)} | ${Math.round(o.si)} | ${(o.bytes / 1024).toFixed(0)} | ${(o.js / 1024).toFixed(0)} | ${o.reqs} |`);
}
fs.writeFileSync(path.join(dir, 'medians.json'), JSON.stringify(medians, null, 1));
fs.writeFileSync(path.join(dir, 'medians.md'), md.join('\n') + '\n');
// failing audits aggregate
const agg = {};
for (const r of rows) for (const fa of r.j.failing) {
  const a = (agg[fa.id] = agg[fa.id] || { id: fa.id, title: fa.title, categories: fa.categories, runs: [], example: fa.sample[0] || null, displayValue: fa.displayValue });
  a.runs.push(`${r.slug}-${r.ff}-${r.run}`);
}
const list = Object.values(agg).sort((a, b) => b.runs.length - a.runs.length);
fs.writeFileSync(path.join(dir, 'failing-audits.json'), JSON.stringify(list.map((a) => ({ ...a, runCount: a.runs.length, runs: a.runs.length > 6 ? a.runs.slice(0, 3).join(', ') + ` ... (${a.runs.length} runs)` : a.runs.join(', ') })), null, 1));
console.log(md.join('\n'));
console.log('\nFAILING:\n' + list.map((a) => `${a.id} [${a.categories.join(',')}] runs=${a.runs.length}/${rows.length} ${a.displayValue || ''}`).join('\n'));
// opportunity aggregate on home-mobile
const hm = rows.filter((r) => r.slug === 'home' && r.ff === 'mobile');
console.log('\nOPPS home mobile run1:\n' + hm[0].j.opportunities.filter((o) => o.score < 1 || (o.metricSavings && Object.values(o.metricSavings).some((v) => v > 0))).map((o) => `${o.id} score=${o.score} ${o.displayValue || ''} ${JSON.stringify(o.metricSavings)}`).join('\n'));
const hd = rows.filter((r) => r.slug === 'home' && r.ff === 'desktop');
console.log('\nOPPS home desktop run1:\n' + hd[0].j.opportunities.filter((o) => o.score < 1 || (o.metricSavings && Object.values(o.metricSavings).some((v) => v > 0))).map((o) => `${o.id} score=${o.score} ${o.displayValue || ''} ${JSON.stringify(o.metricSavings)}`).join('\n'));
console.log('\nMAINTHREAD home mobile:', JSON.stringify(hm[0].j.diagnostics.mainthread_breakdown), 'bootup', hm[0].j.diagnostics.bootup_ms);
console.log('\nrange perf home mobile', hm.map((r) => r.perf).join('/'), 'tbt', hm.map((r) => r.tbt).join('/'), 'bench', hm.map((r) => r.bench).join('/'), 'load', hm.map((r) => r.load).join(' | '));
