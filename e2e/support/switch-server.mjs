// A small static server whose root can be swapped while it runs, to simulate a deploy under an open
// browser (e2e/sw-migration.e2e.js). Clean URLs like the production Caddyfile: /x is served from
// x/index.html or x.html, unknown paths get 404.html with status 404, everything is Cache-Control no-cache.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

const isFile = async (p) => {
  try {
    return (await stat(p)).isFile()
  } catch {
    return false
  }
}

export async function startSwitchServer(initialRoot) {
  let root = initialRoot
  const log = []
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
    const trimmed = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
    const candidates = trimmed === '/' ? ['/index.html'] : [trimmed, `${trimmed}/index.html`, `${trimmed}.html`]
    let file
    for (const c of candidates) {
      if (await isFile(join(root, c))) {
        file = join(root, c)
        break
      }
    }
    log.push(`${req.method} ${path} ${file ? 200 : 404}`)
    const headers = { 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }
    if (!file) {
      const notFound = join(root, '404.html')
      const body = (await isFile(notFound)) && !path.startsWith('/_astro/') && !path.startsWith('/assets/') ? await readFile(notFound) : 'Not found'
      res.writeHead(404, { ...headers, 'Content-Type': typeof body === 'string' ? 'text/plain' : TYPES['.html'] })
      return res.end(body)
    }
    res.writeHead(200, { ...headers, 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
    res.end(await readFile(file))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return {
    port: server.address().port,
    log,
    setRoot(next) {
      root = next
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}
