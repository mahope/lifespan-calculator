// Trim a Lighthouse 13 LHR into a small summary. Prints one CSV row to stdout.
// usage: node trim-lhr.js <raw.json> <out.json> [loadavg-string]
const fs = require('fs');
const [, , rawFile, outFile, loadavg = ''] = process.argv;
const lhr = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
const A = lhr.audits;
const num = (id) => (A[id] && typeof A[id].numericValue === 'number' ? A[id].numericValue : null);
const r = (x, d = 0) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

const scores = {};
for (const [k, c] of Object.entries(lhr.categories)) scores[k] = c.score == null ? null : Math.round(c.score * 100);

const metrics = {
  fcp_ms: r(num('first-contentful-paint')),
  lcp_ms: r(num('largest-contentful-paint')),
  tbt_ms: r(num('total-blocking-time')),
  cls: r(num('cumulative-layout-shift'), 4),
  si_ms: r(num('speed-index')),
  tti_ms: r(num('interactive')),
  server_response_ms: r(num('server-response-time')),
};

// Network
const reqs = (A['network-requests'] && A['network-requests'].details && A['network-requests'].details.items) || [];
const hostOf = (u) => { try { return new URL(u).host; } catch { return 'other'; } };
const reqList = reqs.map((q) => ({
  url: q.url.length > 140 ? q.url.slice(0, 140) + '...' : q.url,
  host: hostOf(q.url),
  type: q.resourceType,
  status: q.statusCode,
  transferSize: q.transferSize,
  resourceSize: q.resourceSize,
  protocol: q.protocol,
})).sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0));
const rs = (A['resource-summary'] && A['resource-summary'].details && A['resource-summary'].details.items) || [];
const resourceSummary = {};
for (const it of rs) resourceSummary[it.resourceType] = { requests: it.requestCount, transferSize: it.transferSize };
const network = {
  total_requests: reqs.length,
  total_transfer_bytes: num('total-byte-weight'),
  js_transfer_bytes: resourceSummary.script ? resourceSummary.script.transferSize : null,
  css_transfer_bytes: resourceSummary.stylesheet ? resourceSummary.stylesheet.transferSize : null,
  resourceSummary,
  third_party_hosts: [...new Set(reqs.map((q) => q.url).map(hostOf))].filter((h) => !/levetidsberegner\.dk$/.test(h)),
  top_requests: reqList.slice(0, 15),
};

// Opportunities / insights (Lighthouse 13 has moved most to *-insight audits)
const opportunities = [];
for (const [id, a] of Object.entries(A)) {
  const isInsight = /-insight$/.test(id);
  const isOpp = a.details && a.details.type === 'opportunity';
  const hasSavings = a.metricSavings && Object.values(a.metricSavings).some((v) => v > 0);
  if (!(isInsight || isOpp || hasSavings)) continue;
  if (a.scoreDisplayMode === 'notApplicable' || a.scoreDisplayMode === 'error') continue;
  if (a.score === 1 && !hasSavings && !(a.details && (a.details.overallSavingsMs > 0 || a.details.overallSavingsBytes > 0))) continue;
  opportunities.push({
    id, title: a.title, score: a.score, displayValue: a.displayValue || null,
    metricSavings: a.metricSavings || null,
    overallSavingsMs: a.details ? a.details.overallSavingsMs || null : null,
    overallSavingsBytes: a.details ? a.details.overallSavingsBytes || null : null,
  });
}

// Failing audits: score < 0.9 among scored audits (not manual/notApplicable/informative)
const catOf = {};
for (const [k, c] of Object.entries(lhr.categories)) for (const ref of c.auditRefs) { (catOf[ref.id] = catOf[ref.id] || []).push(k); }
const failing = [];
for (const [id, a] of Object.entries(A)) {
  if (a.score == null || a.score >= 0.9) continue;
  if (['notApplicable', 'manual', 'informative', 'error'].includes(a.scoreDisplayMode)) continue;
  const items = (a.details && a.details.items) || [];
  const sample = items.slice(0, 5).map((it) => {
    const node = it.node || (it.subItems && it.subItems.items && it.subItems.items[0] && it.subItems.items[0].node) || null;
    return {
      selector: node ? node.selector : undefined,
      snippet: node && node.snippet ? String(node.snippet).slice(0, 140) : undefined,
      explanation: node && node.explanation ? String(node.explanation).slice(0, 300) : undefined,
      url: it.url ? String(it.url).slice(0, 140) : undefined,
      label: it.label ? String(it.label).slice(0, 80) : undefined,
    };
  }).filter((x) => Object.values(x).some(Boolean));
  failing.push({
    id, title: a.title, score: a.score, categories: catOf[id] || [], displayValue: a.displayValue || null,
    itemCount: items.length, sample,
  });
}

// Main thread + JS execution
const mtw = (A['mainthread-work-breakdown'] && A['mainthread-work-breakdown'].details && A['mainthread-work-breakdown'].details.items) || [];
const boot = (A['bootup-time'] && A['bootup-time'].details && A['bootup-time'].details.items) || [];
const tps = (A['third-party-summary'] && A['third-party-summary'].details && A['third-party-summary'].details.items) || [];
const diagnostics = {
  mainthread_work_ms: r(num('mainthread-work-breakdown')),
  mainthread_breakdown: mtw.slice(0, 8).map((i) => ({ group: i.groupLabel, ms: r(i.duration) })),
  bootup_ms: r(num('bootup-time')),
  bootup_top: boot.slice(0, 8).map((i) => ({ url: String(i.url).slice(0, 120), total: r(i.total), scripting: r(i.scripting), scriptParseCompile: r(i.scriptParseCompile) })),
  third_party: tps.slice(0, 8).map((i) => ({ entity: i.entity && i.entity.text ? i.entity.text : i.entity, transferSize: i.transferSize, blockingTime: r(i.blockingTime) })),
  dom_size: A['dom-size'] ? { elements: A['dom-size'].numericValue, display: A['dom-size'].displayValue } : null,
  long_tasks: ((A['long-tasks'] && A['long-tasks'].details && A['long-tasks'].details.items) || []).slice(0, 8).map((i) => ({ url: String(i.url).slice(0, 100), start: r(i.startTime), dur: r(i.duration) })),
  lcp_element: (() => {
    const d = A['largest-contentful-paint-element'] && A['largest-contentful-paint-element'].details;
    const it = d && d.items && d.items[0] && d.items[0].items && d.items[0].items[0];
    return it && it.node ? { selector: it.node.selector, snippet: String(it.node.snippet || '').slice(0, 140) } : null;
  })(),
};

const out = {
  requestedUrl: lhr.requestedUrl,
  finalUrl: lhr.finalUrl,
  fetchTime: lhr.fetchTime,
  lighthouseVersion: lhr.lighthouseVersion,
  formFactor: lhr.configSettings.formFactor,
  throttlingMethod: lhr.configSettings.throttlingMethod,
  throttling: lhr.configSettings.throttling,
  environment: { benchmarkIndex: lhr.environment.benchmarkIndex, hostUserAgent: lhr.environment.hostUserAgent, loadavg_after: loadavg },
  runWarnings: lhr.runWarnings,
  runtimeError: lhr.runtimeError || null,
  scores, metrics, network, diagnostics, opportunities, failing,
};
fs.writeFileSync(outFile, JSON.stringify(out, null, 2));

const name = require('path').basename(outFile, '.json');
const [slug, ff, run] = name.split(/-(?=mobile|desktop)|-(?=\d+$)/);
const row = [
  slug, ff, run, scores.performance, scores.accessibility, scores['best-practices'], scores.seo,
  metrics.lcp_ms, metrics.cls, metrics.tbt_ms, metrics.fcp_ms, metrics.si_ms, metrics.tti_ms,
  network.total_transfer_bytes, network.js_transfer_bytes, network.total_requests, out.environment.benchmarkIndex, loadavg.replace(/ /g, '/'),
].join(',');
process.stdout.write(row + '\n');
