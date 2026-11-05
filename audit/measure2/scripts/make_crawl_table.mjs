// Merge crawl-raw.json + crawl-rendered-live.json (+ robots) into crawl-table.csv / crawl-table.md
// Usage: node make_crawl_table.mjs <raw.json> <rendered.json> <robots.txt> <outDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [rawP, renP, robotsP, outDir] = process.argv.slice(2);
const raw = JSON.parse(readFileSync(rawP, 'utf8'));
const ren = JSON.parse(readFileSync(renP, 'utf8'));
const robots = readFileSync(robotsP, 'utf8');
const ORIGIN = 'https://levetidsberegner.dk';
const short = (u) => (u ? u.replace(ORIGIN, '') || '/' : '');
const cut = (s, n = 200) => (s == null ? '' : String(s).replace(/\s+/g, ' ').slice(0, n));
const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

const rows = raw.results.map((r) => {
  const rd = ren.results.find((x) => x.requested === r.requested);
  const R = rd && rd.rendered;
  return {
    url: r.requested.startsWith(ORIGIN) ? short(r.requested) : r.requested,
    status: r.status ?? 'ERR',
    err: r.error || '',
    hops: r.redirects ?? '',
    chain: (r.chain || []).map((c) => c.replace(ORIGIN, '')).join(' | '),
    finalUrl: r.finalUrl ? (r.finalUrl.startsWith(ORIGIN) ? short(r.finalUrl) : r.finalUrl) : '',
    ctype: (r.contentType || '').split(';')[0],
    bytes: r.bytes ?? '',
    rawTitle: cut(r.html?.title, 90),
    rawDesc: cut(r.html?.description, 60),
    rawCanonical: r.html ? (r.html.canonical ?? '(none)') : '',
    rawRobots: r.html ? (r.html.metaRobots ?? '(none)') : '',
    rawH1: r.html ? (r.html.h1 ?? '(none)') : '',
    rawOgImage: r.html ? (r.html.ogImage ?? '(none)') : '',
    rawBody200: r.html ? r.html.bodyText200 : cut(r.text200),
    sha: r.bodySha || '',
    renStatus: rd?.docStatus ?? '',
    renFinal: R ? short(R.url) : rd?.error ? 'ERR ' + cut(rd.error, 60) : '',
    renTitle: R ? cut(R.title, 90) : '',
    renCanonical: R ? (R.canonical.length ? R.canonical.map(short).join(' ; ') : '(none)') : '',
    renRobots: R ? (R.robots.length ? R.robots.join(' ; ') : '(none)') : '',
    renH1: R ? (R.h1.length ? R.h1.join(' ; ') : '(none)') : '',
    renOgImage: R ? (R.ogImage.length ? R.ogImage.map(short).join(' ; ') : '(none)') : '',
    renBody200: R ? R.bodyText200 : '',
    renNotes: R ? [R.notFoundShown && 'NotFound page', R.calculatorFormShown && 'calculator form', R.privacyPolicyTextShown && 'privacy text', R.cookiePolicyTextShown && 'cookie text', `metaDescriptions=${R.metaDescriptionCount}`, `footers=${R.footerCount}`].filter(Boolean).join(', ') : '',
  };
});

// ---- CSV
const cols = Object.keys(rows[0]);
writeFileSync(join(outDir, 'crawl-table.csv'), '﻿' + cols.join(',') + '\n' + rows.map((r) => cols.map((c) => q(r[c])).join(',')).join('\n') + '\n');

// ---- stats
const html = raw.results.filter((r) => r.html);
const bySha = new Map();
for (const r of html) bySha.set(r.bodySha, [...(bySha.get(r.bodySha) || []), r.requested]);
const biggest = [...bySha.values()].sort((a, b) => b.length - a.length)[0];
const ok = raw.results.filter((r) => !r.error);
const ren200 = ren.results.filter((r) => r.rendered);
const notFoundRendered = ren200.filter((r) => r.rendered.notFoundShown);
const distinctRenderedTitles = new Set(ren200.map((r) => `${r.rendered.title}||${r.rendered.canonical.join(',')}`));

// robots.txt anatomy
const lines = robots.split('\n');
const endIdx = lines.findIndex((l) => /END Cloudflare Managed Content/i.test(l));
const managed = lines.slice(0, endIdx + 1);
const appended = lines.slice(endIdx + 1).join('\n');
const agents = [];
for (const block of managed.filter((l) => !l.startsWith('#')).join('\n').split(/\n\s*\n/)) {
  const uas = [...block.matchAll(/^User-agent:\s*(.+)$/gim)].map((m) => m[1].trim());
  if (/^Disallow:\s*\/\s*$/im.test(block)) agents.push(...uas);
}
const disallowedAll = [...new Set(agents.filter((a) => a !== '*'))];
const contentSignal = (managed.find((l) => /^Content-Signal/i.test(l)) || '').trim();
const watch = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'Claude-Web', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'GoogleOther', 'Applebot', 'Applebot-Extended', 'CCBot', 'Bytespider', 'Amazonbot', 'meta-externalagent', 'DuckAssistBot', 'MistralAI-User', 'cohere-ai', 'Baiduspider', 'PetalBot'];
const watchTable = watch.map((w) => `| ${w} | ${disallowedAll.map((x) => x.toLowerCase()).includes(w.toLowerCase()) ? 'Disallow: /' : 'not listed (falls under `User-agent: *`, `Allow: /`)'} |`);
const hasSitemapLine = /^Sitemap:/im.test(robots);

let md = '';
md += `# Crawl / indexing truth table, levetidsberegner.dk\n\n`;
md += `Crawled ${raw.at} (raw HTTP, Node fetch, manual redirect following) and rendered with Playwright 1.64.1 / Chrome (service workers blocked, analytics + Google Fonts + all third parties aborted). Production commit 0a4c35c. Full per-URL data with all columns: \`crawl-table.csv\`.\n\n`;
md += `## Headline numbers\n\n`;
md += `- URLs requested: ${raw.results.length}; answered: ${ok.length}; no DNS (www): ${raw.results.length - ok.length}\n`;
md += `- URLs answering HTTP 200 with an HTML document (after redirects): ${html.filter((r) => r.status === 200).length}\n`;
md += `- Distinct raw HTML bodies among those: ${bySha.size}. The largest group has ${biggest.length} URLs with byte-identical HTML (sha256 prefix ${[...bySha.entries()].find(([, v]) => v === biggest)[0]}, ${html.find((r) => r.requested === biggest[0]).bytes} bytes).\n`;
md += `- Raw HTML of every one of them: same <title> "${html[0].html.title}", same meta description, **no canonical, no meta robots, no <h1>, no og:image, empty \`<div id="root"></div>\`**, 0 JSON-LD blocks.\n`;
md += `- Rendered DOM: ${ren200.length} URLs rendered; ${distinctRenderedTitles.size} distinct (title, canonical) pairs; ${notFoundRendered.length} URLs render the NotFound page (all of them HTTP 200).\n`;
md += `- Soft-404 URLs (HTTP 200, NotFound page rendered, \`robots: index, follow\`, canonical \`${ORIGIN}/404\`): ${notFoundRendered.map((r) => short(r.requested)).join(', ')}\n`;
md += `- Redirect behaviour comes from \`serve\` (clean URLs) and Cloudflare: \`/index.html\` -> \`/index\` -> \`/\` (2 hops), \`/privatlivspolitik.html\` -> \`/privatlivspolitik\`, http -> https 301. Trailing-slash and upper-case variants of the 4 landing pages answer 200 with the same HTML (no redirect); the canonical in the rendered DOM is always the lower-case, slash-less URL.\n`;
md += `- \`www.levetidsberegner.dk\`: NXDOMAIN (Google DNS Status=3 for A/AAAA/CNAME).\n\n`;

md += `## What Google sees before rendering\n\n`;
md += `Every route returns the same 5,371-byte shell: a generic title ("Dansk Levetidsberegner - Beregn din forventede levetid"), the generic description, \`og:title="Dansk Levetidsberegner"\`, an empty root div, and (outside the root) a hard-coded footer, a cookie banner and an "Om dette værktøj" boilerplate section (the only indexable body text: "Dette gratis online værktøj er lavet for at gøre hverdagen lidt lettere..." with no mention of life expectancy). Page-specific title, description, canonical, h1 and JSON-LD exist only after JavaScript runs (react-helmet-async). Crawlers that do not execute JS (GPTBot, ClaudeBot, PerplexityBot and most LLM fetchers; also Bing's non-render fetches) therefore see the same page for all ${biggest.length} URLs of the largest group (5 routes plus slash/case/query variants, plus every nonexistent path). Google renders JS, but its first-wave HTML signal is identical for all of them and there is no canonical in the raw HTML to consolidate duplicates before the render pass.\n\n`;

md += `## robots.txt anatomy (live)\n\n`;
md += `- Status 200, \`text/plain\`, ${Buffer.byteLength(robots)} bytes, ${lines.length} lines. The origin has **no robots.txt** in \`dist/\` (the repo's root-level robots.txt is not copied by Vite); \`serve -s\` answers \`/robots.txt\` with the SPA index.html (200, text/html, verified on a local container). Cloudflare "managed robots.txt" prepends its block to that body, so the live file is: Cloudflare managed content (lines 1-${endIdx + 1}) **followed by the entire index.html (${appended.split('\n').length} lines of HTML)**. Parsers ignore the HTML lines, but the file is malformed and has ${hasSitemapLine ? 'a' : '**no**'} \`Sitemap:\` line.\n`;
md += `- Effective rules: \`User-agent: *\`, \`Content-Signal: search=yes,ai-train=no,use=reference\` (raw line: \`${contentSignal}\`), \`Allow: /\`. No \`ai-input\` signal is expressed (neither granted nor restricted).\n`;
md += `- ${disallowedAll.length} named user-agents get \`Disallow: /\`: ${disallowedAll.join(', ')}.\n\n`;
md += `| crawler | rule in live robots.txt |\n|---|---|\n${watchTable.join('\n')}\n\n`;
md += `Reading: training crawlers (GPTBot, ClaudeBot, anthropic-ai, Claude-Web, Google-Extended, GoogleOther, CCBot, Bytespider, Applebot-Extended, meta-externalagent) are blocked; search/answer fetchers such as OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User, Googlebot and Bingbot are not named and so are allowed. Whether any specific AI product honours this is outside what could be measured. Since the raw HTML carries no real content (see above), allowed non-rendering AI fetchers would still only see the boilerplate.\n\n`;

md += `## Repo vs shipped dist (root-level static files)\n\n`;
md += `Dockerfile: \`COPY --from=build /app/dist ./dist\`, \`CMD ["serve","-s","dist","-l","3000"]\`. Vite copies only \`public/\` (favicon.svg, og-image.png, pwa-192x192.png, pwa-512x512.png) into dist. A \`docker build\` of 0a4c35c and the local \`npm run build\` both produce a dist without \`sitemap.xml\`, \`robots.txt\`, \`ads.txt\`, \`privatlivspolitik.html\` and \`cookiepolitik.html\` (see \`health.md\`, section "dist listing"). Consequences measured on live: \`/sitemap.xml\` and \`/ads.txt\` return the SPA HTML (200, text/html), the policy pages render the NotFound component.\n\n`;
md += `Evidence that live = commit 0a4c35c: the \`index.html\` and CSS produced by the Docker build of 0a4c35c are byte-identical to the live ones (\`diff\` empty, \`cmp\` empty), and the Playwright baseline of the local container equals the live baseline byte for byte.\n\n`;

md += `## Policy pages: what a user sees\n\n`;
for (const p of ['/privatlivspolitik', '/privatlivspolitik.html', '/cookiepolitik', '/cookiepolitik.html']) {
  const r = ren.results.find((x) => x.requested === ORIGIN + p)?.rendered;
  if (r) md += `- \`${p}\` -> final \`${short(r.url)}\`: title "${r.title}", h1 "${r.h1.join(' ; ')}", NotFound shown: ${r.notFoundShown}, policy text shown: ${r.privacyPolicyTextShown || r.cookiePolicyTextShown}\n`;
}
md += `- The footer links of the static index.html footer (outside React) point to \`/privatlivspolitik.html\` and \`/cookiepolitik.html\`; these are the only legal links on the page and both lead to a 200 "Side ikke fundet" page.\n\n`;

md += `## Table (compact; all columns in the CSV)\n\n`;
md += `| URL | status | hops | final (raw) | type | bytes | raw title | raw canonical | raw robots | raw h1 | raw og:image | rendered final | rendered title | rendered canonical | rendered robots | rendered h1 | rendered og:image | rendered notes |\n`;
md += `|---|---:|---:|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
const e = (s) => String(s ?? '').replace(/\|/g, '\\|');
for (const r of rows) {
  md += `| \`${e(r.url)}\` | ${r.status}${r.err ? ' ' + e(r.err) : ''} | ${r.hops} | ${e(r.finalUrl)} | ${e(r.ctype)} | ${r.bytes} | ${e(r.rawTitle)} | ${e(r.rawCanonical)} | ${e(r.rawRobots)} | ${e(r.rawH1)} | ${e(r.rawOgImage)} | ${e(r.renFinal)} | ${e(r.renTitle)} | ${e(r.renCanonical)} | ${e(r.renRobots)} | ${e(r.renH1)} | ${e(r.renOgImage)} | ${e(r.renNotes)} |\n`;
}
md += `\n## First 200 characters of body text (raw HTML, scripts/styles stripped)\n\n`;
const seen = new Map();
for (const r of rows) {
  if (!r.rawBody200) continue;
  const k = r.rawBody200;
  seen.set(k, [...(seen.get(k) || []), r.url]);
}
for (const [k, urls] of seen) md += `- ${urls.length} URL(s) (${urls.slice(0, 6).map((u) => '`' + u + '`').join(', ')}${urls.length > 6 ? ', ...' : ''}):\n  > ${k}\n`;
md += `\n## First 200 characters of body text (rendered DOM)\n\n`;
const seen2 = new Map();
for (const r of rows) {
  if (!r.renBody200) continue;
  seen2.set(r.renBody200, [...(seen2.get(r.renBody200) || []), r.url]);
}
for (const [k, urls] of seen2) md += `- ${urls.length} URL(s) (${urls.slice(0, 6).map((u) => '`' + u + '`').join(', ')}${urls.length > 6 ? ', ...' : ''}):\n  > ${k}\n`;
writeFileSync(join(outDir, 'crawl-table.md'), md);
console.log(JSON.stringify({ rows: rows.length, identicalGroup: biggest.length, distinctBodies: bySha.size, notFound: notFoundRendered.length, disallowed: disallowedAll.length, hasSitemapLine }));
