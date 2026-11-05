// Post-build thin-content check on the FINISHED HTML of /levetid/**:
//   - runs the same guard as the render-time check (src/lib/guard.js) on the visible
//     text inside <main> (SVG, scripts and tags stripped);
//   - fails the build if a page fails the guard but is still indexable (no noindex)
//     or is listed in sitemap-0.xml, or if a page passes in the model but fails on HTML.
// Usage: node scripts/check-guard.mjs [distDir]
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { evaluate } from '../src/lib/guard.js'

export function visibleText(html) {
  const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? html
  return main
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
}

/** Pure-ish core, exported for tests: pages = [{ id, html }], neighbours from /levetid/{sex}/{age} structure. */
export function checkHtmlPages(pages, sitemapXml = '') {
  const ids = new Set(pages.map((p) => p.id))
  const neighbours = (id) => {
    const [, , sex, age] = id.split('/')
    const other = sex === 'mand' ? 'kvinde' : 'mand'
    return [`/levetid/${sex}/${Number(age) - 5}`, `/levetid/${sex}/${Number(age) + 5}`, `/levetid/${other}/${age}`].filter((n) => ids.has(n))
  }
  const results = evaluate(pages.map((p) => ({ id: p.id, text: visibleText(p.html), neighbours: neighbours(p.id) })))
  const problems = []
  for (const r of results) {
    const html = pages.find((p) => p.id === r.id).html
    const noindex = /<meta name="robots" content="noindex/.test(html)
    const inSitemap = sitemapXml.includes(`<loc>https://levetidsberegner.dk${r.id}</loc>`)
    if (!r.pass && !noindex) problems.push(`${r.id}: fails guard (${r.reasons.join('; ')}) but is indexable`)
    if (!r.pass && inSitemap) problems.push(`${r.id}: fails guard but is in the sitemap`)
    if (r.pass && noindex) problems.push(`${r.id}: passes on the HTML but is marked noindex (model and HTML disagree)`)
  }
  return { results, problems }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dist = process.argv[2] ?? 'dist'
  const root = join(dist, 'levetid')
  if (!existsSync(root)) {
    console.error(`check-guard: ${root} does not exist`)
    process.exit(1)
  }
  const pages = walk(root)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ id: '/' + relative(dist, f).split(sep).join('/').replace(/\.html$/, ''), html: readFileSync(f, 'utf8') }))
  const sitemapFile = join(dist, 'sitemap-0.xml')
  const { results, problems } = checkHtmlPages(pages, existsSync(sitemapFile) ? readFileSync(sitemapFile, 'utf8') : '')
  for (const r of results) console.log(`${r.pass ? 'pass' : 'FAIL'}  ${r.id}  unique numbers ${r.uniqueNumbers}  max similarity ${r.maxSimilarity.toFixed(2)}`)
  console.log(`check-guard: ${results.length} pages, ${results.filter((r) => !r.pass).length} failing, ${problems.length} problems`)
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
}
