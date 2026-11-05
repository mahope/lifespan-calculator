// Render validation-results.json as markdown tables (narrative is written by hand around them).
// Usage: node validation_tables.mjs validation-results.json > tables.md
import { readFileSync } from 'node:fs';
const v = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const e = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const sh = (s, n = 90) => e(s).slice(0, n);

function keyNums(s) {
  if (!s) return '';
  const parts = [];
  if (s.remainingYears != null) parts.push(`remaining ${s.remainingYears}`);
  if (s.expectedAge != null) parts.push(`expected ${s.expectedAge}`);
  if (s.lifeProgress) parts.push(`${s.lifeProgress[0]}% lived, ${s.lifeProgress[1]} days, ${s.lifeProgress[2]} beats`);
  if (s.preciseAge) parts.push(`precise age "${s.preciseAge[0]}", born "${s.preciseAge[1]}"`);
  if (s.pension) parts.push(`pension ${s.pension[0]}/${s.pension[1]}/${s.pension[3]}`);
  if (s.survival && s.survival.length) parts.push(`survival ${s.survival.join(' ')}`); else if (s.resultShown) parts.push('survival card hidden');
  if (s.verdict) parts.push(`"${s.verdict}"`);
  return parts.join('; ');
}
const bad = (s) => (s && s.badTokens && s.badTokens.length ? 'tokens: ' + s.badTokens.slice(0, 3).map((x) => '`' + x + '`').join(' ') : '') + (s && s.negatives && s.negatives.length ? ' negatives: ' + s.negatives.slice(0, 3).map((x) => '`' + x + '`').join(' ') : '');
const flags = (x) => (x ? (x.valid ? 'valid' : 'invalid: ' + x.flags.join('+')) : '');

let md = '';
const countBy = (arr, f) => arr.reduce((m, r) => ((m[f(r)] = (m[f(r)] || 0) + 1), m), {});

// ---- age
md += `### A. Age field (real form, \`<input type=number min=0 max=120 required>\`, gender Mand)\n\n`;
md += `"native" = a real click on "Beregn levetid" (browser constraint validation applies). "bypass" = the same form with the \`submit\` event dispatched directly (what happens if validation is skipped, e.g. by an extension or a \`novalidate\` attribute).\n\n`;
md += `| typed input | field value after typing | browser validity | button disabled | native click | bypass (submit event) | what is shown in bypass |\n|---|---|---|---|---|---|---|\n`;
const ages = [...new Set(v.form.age.map((r) => r.input))];
for (const a of ages) {
  const n = v.form.age.find((r) => r.input === a && r.mode === 'native');
  const b = v.form.age.find((r) => r.input === a && r.mode === 'bypass');
  md += `| \`${e(JSON.stringify(a))}\` | \`${e(JSON.stringify(n?.fieldValueAfterTyping))}\`${n?.typedError ? ' (type error: ' + sh(n.typedError, 50) + ')' : ''} | ${flags(n?.validity)} | ${n?.submitDisabled} | ${e(n?.outcome || n?.error)} | ${e(b?.outcome || b?.error)} | ${e(keyNums(b?.snapshot))} ${e(bad(b?.snapshot))} |\n`;
}

md += `\n### B. Birthdate field (\`<input type=date min=1900-01-01 max=today required>\`, gender Mand)\n\n`;
md += `| input | field value | browser validity | button disabled | native click | bypass | what is shown in bypass |\n|---|---|---|---|---|---|---|\n`;
const bds = [...new Set(v.form.birthdate.map((r) => r.input))];
for (const a of bds) {
  const n = v.form.birthdate.find((r) => r.input === a && r.mode === 'native');
  const b = v.form.birthdate.find((r) => r.input === a && r.mode === 'bypass');
  md += `| ${e(a)} | \`${e(JSON.stringify(n?.fieldValueAfterInput))}\`${n?.typedError ? ' (fill error: ' + sh(n.typedError, 60) + ')' : ''} | ${flags(n?.validity)} | ${n?.submitDisabled} | ${e(n?.outcome || n?.error)} | ${e(b?.outcome || b?.error)} | ${e(keyNums(b?.snapshot))} ${e(bad(b?.snapshot))} |\n`;
}

md += `\n### C. Deep links (\`/?...\` loaded directly; no form validation is involved)\n\n`;
md += `| case | query | outcome | URL after load | what is shown |\n|---|---|---|---|---|\n`;
for (const r of v.deepLinks) {
  const s = r.snapshot;
  md += `| ${e(r.label)} | \`${e(decodeURIComponent(r.query).slice(0, 70))}\` | ${e(r.outcome || r.error)} | \`${e(s?.url?.slice(0, 40))}\` | ${e(keyNums(s))} ${e(bad(s))} ${s?.pageErrors?.length ? ' pageErrors: ' + e(s.pageErrors[0]).slice(0, 80) : ''} |\n`;
}

md += `\n### D. Reflection / injection check (XSS-style strings in every parameter)\n\n`;
md += `| case | alert/dialog | handler attrs injected | extra scripts | \`window.__xss\` set | raw payload as markup in HTML | outcome |\n|---|---|---|---|---|---|---|\n`;
for (const r of v.deepLinks.filter((x) => /XSS/.test(x.label))) {
  const s = r.snapshot || {};
  md += `| ${e(r.label)} | ${s.dialogs?.length ? e(s.dialogs.join('; ')) : 'none'} | ${s.injected?.handlerAttrs} | ${s.injected?.extraScripts} | ${s.injected?.xssFlag} | ${r.rawPayloadInHtml} | ${e(r.outcome)} |\n`;
}

md += `\n### E. localStorage \`lifespan:history\` corruption (seeded before load, then one normal calculation: male, 40)\n\n`;
md += `| seed | outcome | Historik card / errors |\n|---|---|---|\n`;
for (const r of v.history) {
  const s = r.snapshot || {};
  md += `| ${e(r.label)} | ${e(r.outcome || r.error)} | ${e(s.historyCard ? s.historyCard.slice(0, 140) : s.historyCard === null ? 'card hidden' : '')} ${s.pageErrors?.length ? '<br>pageErrors: ' + e(s.pageErrors[0]).slice(0, 110) : ''} ${s.events?.filter((x) => /^Error/.test(x)).length ? '<br>analytics: ' + e(s.events.filter((x) => /^Error/.test(x))[0]).slice(0, 120) : ''} ${r.themeToggleAfter ? '<br>theme toggle: ' + e(JSON.stringify(r.themeToggleAfter)).slice(0, 120) : ''} |\n`;
}

md += `\n### F. Result-page widgets with odd input\n\n`;
md += `| widget | input | output |\n|---|---|---|\n`;
for (const r of v.misc.filter((x) => x.widget !== 'errors after widget probing')) {
  md += `| ${r.widget} | ${r.widget === 'insurance' ? `income ${e(r.income)}, years ${e(r.years)}` : `partner age ${e(r.partnerAge)}`} | ${r.widget === 'insurance' ? `cover \`${e(r.cover)}\`; button: ${e(r.link)}` : e(r.text)} |\n`;
}
const last = v.misc.find((x) => x.widget === 'errors after widget probing');
md += `\nPage errors during widget probing: ${last ? JSON.stringify(last.pageErrors) : 'n/a'}\n`;

md += `\n### Outcome counts\n\n`;
md += `- Age field, native: ${JSON.stringify(countBy(v.form.age.filter((r) => r.mode === 'native'), (r) => r.outcome || 'error'))}\n`;
md += `- Age field, bypass: ${JSON.stringify(countBy(v.form.age.filter((r) => r.mode === 'bypass'), (r) => r.outcome || 'error'))}\n`;
md += `- Birthdate, native: ${JSON.stringify(countBy(v.form.birthdate.filter((r) => r.mode === 'native'), (r) => r.outcome || 'error'))}\n`;
md += `- Birthdate, bypass: ${JSON.stringify(countBy(v.form.birthdate.filter((r) => r.mode === 'bypass'), (r) => r.outcome || 'error'))}\n`;
md += `- Deep links: ${JSON.stringify(countBy(v.deepLinks, (r) => r.outcome || 'error'))}\n`;
md += `- History seeds: ${JSON.stringify(countBy(v.history, (r) => r.outcome || 'error'))}\n`;
process.stdout.write(md);
