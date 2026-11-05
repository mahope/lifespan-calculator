// Part A (raw): read-only crawl of the live site with plain HTTP (no JS execution).
// Usage: node crawl_raw.mjs <outfile.json>
// Follows redirects manually so the whole chain is recorded. ~35 GETs, sequential, 250 ms apart.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const ORIGIN = process.env.ORIGIN || 'https://levetidsberegner.dk';
const URLS = [
  `${ORIGIN}/`,
  `${ORIGIN}/index.html`,
  `${ORIGIN}/hvor-lang-tid-har-jeg-tilbage`,
  `${ORIGIN}/hvor-lang-tid-har-jeg-tilbage/`,
  `${ORIGIN}/dodsalder-calculator`,
  `${ORIGIN}/dodsalder-calculator/`,
  `${ORIGIN}/Dodsalder-Calculator`,
  `${ORIGIN}/livsstil-og-levetid`,
  `${ORIGIN}/livsstil-og-levetid/`,
  `${ORIGIN}/levetid-beregner-danmark`,
  `${ORIGIN}/levetid-beregner-danmark/`,
  `${ORIGIN}/?a=40&g=male`,
  `${ORIGIN}/?utm_source=x`,
  `${ORIGIN}/xyz`,
  `${ORIGIN}/sitemap.xml`,
  `${ORIGIN}/robots.txt`,
  `${ORIGIN}/ads.txt`,
  `${ORIGIN}/manifest.webmanifest`,
  `${ORIGIN}/sw.js`,
  `${ORIGIN}/privatlivspolitik`,
  `${ORIGIN}/privatlivspolitik.html`,
  `${ORIGIN}/cookiepolitik`,
  `${ORIGIN}/cookiepolitik.html`,
  ...(process.env.ORIGIN ? [] : [`http://levetidsberegner.dk/`,
  `http://levetidsberegner.dk/dodsalder-calculator`,
  `https://www.levetidsberegner.dk/`,
  `http://www.levetidsberegner.dk/`,
  `https://www.levetidsberegner.dk/dodsalder-calculator`]),
  `${ORIGIN}/.well-known/security.txt`,
  `${ORIGIN}/llms.txt`,
  `${ORIGIN}/CLAUDE.md`,
  `${ORIGIN}/registerSW.js`,
  `${ORIGIN}/favicon.svg`,
  `${ORIGIN}/og-image.png`,
];

const UA = 'levetid-audit/1.0 (read-only crawl, 2026-11-05)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : null;
}
function metas(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
}
function metaContent(html, key, val) {
  for (const t of metas(html)) {
    if ((attr(t, key) || '').toLowerCase() === val.toLowerCase()) return attr(t, 'content');
  }
  return null;
}
function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function analyseHtml(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] ?? null;
  const canon = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .find((t) => (attr(t, 'rel') || '').toLowerCase() === 'canonical');
  const h1 = (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] ?? null;
  const body = (html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i) || [null, html])[1];
  return {
    title: title && title.replace(/\s+/g, ' ').trim(),
    description: metaContent(html, 'name', 'description'),
    canonical: canon ? attr(canon, 'href') : null,
    metaRobots: metaContent(html, 'name', 'robots'),
    h1: h1 && textOf(h1),
    ogImage: metaContent(html, 'property', 'og:image'),
    ogTitle: metaContent(html, 'property', 'og:title'),
    ldJsonCount: (html.match(/application\/ld\+json/gi) || []).length,
    rootDivEmpty: /<div id="root"><\/div>/.test(html),
    bodyText200: textOf(body).slice(0, 200),
  };
}

async function fetchChain(start) {
  const hops = [];
  let url = start;
  let res;
  for (let i = 0; i < 7; i++) {
    res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': UA, 'accept-language': 'da-DK,da;q=0.9' } });
    const loc = res.headers.get('location');
    hops.push({ url, status: res.status, location: loc || null });
    if (res.status >= 300 && res.status < 400 && loc) {
      url = new URL(loc, url).toString();
      await res.arrayBuffer().catch(() => {});
      await sleep(250);
      continue;
    }
    break;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { hops, finalUrl: url, res, buf };
}

const out = [];
for (const u of URLS) {
  const rec = { requested: u };
  try {
    const { hops, finalUrl, res, buf } = await fetchChain(u);
    const ct = res.headers.get('content-type') || '';
    rec.chain = hops.map((h) => `${h.status} ${h.url}${h.location ? ' -> ' + h.location : ''}`);
    rec.redirects = hops.length - 1;
    rec.finalUrl = finalUrl;
    rec.status = res.status;
    rec.contentType = ct;
    rec.bytes = buf.length;
    rec.headers = Object.fromEntries(
      ['server', 'cf-cache-status', 'cache-control', 'x-robots-tag', 'content-encoding', 'last-modified', 'etag', 'link', 'content-signal']
        .map((k) => [k, res.headers.get(k)])
        .filter(([, v]) => v)
    );
    if (/text\/html/i.test(ct)) {
      const html = buf.toString('utf8');
      rec.html = analyseHtml(html);
      rec.bodySha = sha(html);
    } else if (/(text|xml|json|javascript)/i.test(ct)) {
      const t = buf.toString('utf8');
      rec.text200 = t.replace(/\s+/g, ' ').slice(0, 200);
      rec.bodySha = sha(t);
    } else {
      rec.bodySha = sha(buf.toString('latin1'));
    }
  } catch (e) {
    rec.error = String(e && e.message ? e.message : e);
    if (e && e.cause) rec.error += ' | cause: ' + String(e.cause.code || e.cause.message || e.cause);
  }
  out.push(rec);
  await sleep(250);
}
writeFileSync(process.argv[2] || 'crawl-raw.json', JSON.stringify({ at: new Date().toISOString(), ua: UA, results: out }, null, 2));
console.log(`done: ${out.length} URLs`);
