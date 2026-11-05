// Print the key values of a baseline JSON as markdown (for REPORT.md / README). Usage: node baseline_summary.mjs baseline.json
import { readFileSync } from 'node:fs';
const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
let md = '';
md += '| case | URL after submit | remaining years | expected age at death | countdown (frozen clock) | lived % / days / heartbeats | survival to 80/90/95/100 | comparison (you vs DK avg) | pension (age / work years left / retirement years) | other |\n|---|---|---|---|---|---|---|---|---|---|\n';
for (const [id, c] of Object.entries(j.cases)) {
  const h = c.headline;
  const cd = h.countdown;
  const dk = h.comparison.rows.find((r) => r.label.startsWith('Danmark'));
  const you = h.comparison.rows.find((r) => r.label === 'Dig');
  md += `| ${id} | \`${c.urlAfterSubmit.replace(/%2C/g, ',')}\` | ${h.remainingYears} | ${h.expectedAgeAtDeath} | ${cd['ÅR']} y ${cd['DAGE']} d ${cd['TIMER']} h ${cd['MIN']} m ${cd['SEK']} s | ${h.lifeProgress.join(' / ')} | ${h.survivalProbabilities.map((s) => s.pct + '%').join(' / ')} | ${you.years} vs ${dk.years} (${h.comparison.verdict}) | ${h.pension.tiles[0]} / ${h.pension.tiles[1]} / ${h.pension.tiles[3]} (cohort ${h.pension.birthYearLine}) | ${[h.preciseAge ? 'precise age "' + h.preciseAge[0] + '", born ' + h.preciseAge[1] : '', h.biologicalAge ? 'biological age ' + h.biologicalAge[0] + ' (' + h.biologicalAge[2] + ')' : ''].filter(Boolean).join('; ')} |\n`;
}
md += '\nAnalytics events the page tried to send (name + props), per case:\n\n';
for (const [id, c] of Object.entries(j.cases)) md += `- ${id}: ${c.plausibleEvents.map((e) => e.n + (e.p && Object.keys(e.p).length ? ' ' + JSON.stringify(e.p) : '')).join(' ; ')}\n`;
md += '\nAffiliate link (identical in all cases): ' + JSON.stringify(j.cases['1-male-40'].partnerAdsLinks[0]) + '\n';
md += '\nInsurance widget with income 500000 / 10 years: ' + (j.cases['1-male-40'].interactions.insurance.after.match(/Vejledende dækningsbehov ~([\d.]+ kr)/) || [])[1] + '; link text: "' + j.cases['1-male-40'].interactions.insurance.link.text + '"\n';
md += '\nRoutes (rendered DOM):\n\n| route | status | title | canonical | meta descriptions | og:title | h1 |\n|---|---:|---|---|---:|---:|---|\n';
for (const [r, v] of Object.entries(j.routes)) md += `| ${r} | ${v.httpStatus} | ${v.title} | ${v.canonical.join(' ; ') || '(none)'} | ${v.metaDescription.length} | ${v.ogTitle.length} | ${v.h1.join(' ; ')} |\n`;
process.stdout.write(md);
