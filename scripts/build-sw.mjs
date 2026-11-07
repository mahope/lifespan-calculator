// Post-build step: writes dist/sw.js from scripts/sw-template.js with this build's pages and files.
// The cache name carries a hash of every precached file, so any change gives a new worker and a new cache.
// No dependencies; the worker logic itself lives in the template.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ROUTES } from './gen-sitemap.mjs'

// /embed is left out: it runs inside other sites and does not register the worker.
export const OFFLINE_PAGES = [...ROUTES.filter((r) => r !== '/embed'), '/privatlivspolitik', '/cookiepolitik']
const FILE_PATTERN = /^(?:_astro\/.+\.(?:js|css)|fonts\/.+\.woff2|favicon\.svg)$/

// The file a clean page path is served from: dist/<route>/index.html, or dist/<name>.html for the policy pages.
export function pageFile(dist, route) {
  if (route === '/') return 'index.html'
  const dir = `${route.slice(1)}/index.html`
  return existsSync(join(dist, dir)) ? dir : `${route.slice(1)}.html`
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

export function precacheList(dist) {
  const files = walk(dist)
    .map((p) => relative(dist, p).split(sep).join('/'))
    .filter((p) => FILE_PATTERN.test(p))
    .sort()
  const missing = OFFLINE_PAGES.filter((r) => !existsSync(join(dist, pageFile(dist, r))))
  if (missing.length) throw new Error(`pages missing from ${dist}: ${missing.join(', ')}`)
  return { pages: OFFLINE_PAGES, files: files.map((f) => `/${f}`) }
}

export function buildServiceWorker(dist, template) {
  const { pages, files } = precacheList(dist)
  const hash = createHash('sha256')
  for (const r of pages) hash.update(r).update(readFileSync(join(dist, pageFile(dist, r))))
  for (const f of files) hash.update(f).update(readFileSync(join(dist, f)))
  const version = hash.digest('hex').slice(0, 12)
  const fill = { __VERSION__: version, __PAGES__: JSON.stringify(pages), __FILES__: JSON.stringify(files) }
  let out = template
  for (const [key, value] of Object.entries(fill)) {
    if (!out.includes(key)) throw new Error(`template has no ${key}`)
    out = out.split(key).join(value)
  }
  return { source: out, version, pages, files }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const dist = fileURLToPath(new URL('../dist/', import.meta.url))
    const template = readFileSync(new URL('./sw-template.js', import.meta.url), 'utf8')
    const { source, version, pages, files } = buildServiceWorker(dist, template)
    writeFileSync(join(dist, 'sw.js'), source)
    process.stdout.write(`build-sw: dist/sw.js ${version}, ${pages.length} pages, ${files.length} files\n`)
  } catch (err) {
    process.stderr.write(`build-sw: ${err.message}\n`)
    process.exit(1)
  }
}
