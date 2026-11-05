// Performance budget check. Not run in GitHub Actions (too flaky on shared runners): run it by hand
// or on agent-worker, see docs/testing.md.
//
//   npm run build && node scripts/lighthouse-budget.mjs
//
// Serves dist/ with `vite preview`, runs Lighthouse (mobile preset, default throttling) 3 times and
// fails when the median LCP > 2.5 s, the median CLS > 0.1 or the total JavaScript (brotli) > 130 KB.
// Lighthouse is fetched with npx at a pinned version, it is not a project dependency.
// Env: CHROME_PATH (browser to use; on agent-worker /opt/google/chrome/chrome), BUDGET_PORT (default 4174).
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const LIGHTHOUSE = 'lighthouse@13.5.0';
const RUNS = 3;
const BUDGET = { lcpMs: 2500, cls: 0.1, jsBrotliBytes: 130 * 1024 };
const PORT = Number(process.env.BUDGET_PORT ?? 4174);
const URL_UNDER_TEST = `http://127.0.0.1:${PORT}/`;

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function waitForServer(url, ms = 30000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview server did not start on ${url}`);
}

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
const tmp = mkdtempSync(path.join(tmpdir(), 'lh-budget-'));
let failed = false;
try {
  await waitForServer(URL_UNDER_TEST);
  const lcp = [];
  const cls = [];
  const js = [];
  for (let i = 0; i < RUNS; i++) {
    const out = path.join(tmp, `run-${i}.json`);
    const r = spawnSync(
      'npx',
      ['--yes', LIGHTHOUSE, URL_UNDER_TEST, '--output=json', `--output-path=${out}`, '--only-categories=performance', '--quiet', '--chrome-flags=--headless=new'],
      { stdio: ['ignore', 'inherit', 'inherit'] },
    );
    if (r.status !== 0) throw new Error(`lighthouse run ${i + 1} failed (exit ${r.status})`);
    const lhr = JSON.parse(readFileSync(out, 'utf8'));
    lcp.push(lhr.audits['largest-contentful-paint'].numericValue);
    cls.push(lhr.audits['cumulative-layout-shift'].numericValue);
    const scripts = lhr.audits['network-requests'].details.items.filter((x) => x.resourceType === 'Script' && x.url.startsWith(URL_UNDER_TEST));
    // Lighthouse reports resourceSize (uncompressed) and transferSize (wire size). vite preview does not compress, so
    // brotli is computed here from the real files in dist/ that the page actually loaded.
    js.push(scripts.map((x) => new URL(x.url).pathname));
  }
  const { brotliCompressSync } = await import('node:zlib');
  const jsBytes = js.map((files) => files.reduce((sum, f) => sum + brotliCompressSync(readFileSync(path.join('dist', f))).length, 0));

  const result = { lcpMs: median(lcp), cls: median(cls), jsBrotliBytes: median(jsBytes) };
  console.log(JSON.stringify({ runs: { lcp, cls, jsBytes }, median: result, budget: BUDGET }, null, 2));
  for (const [k, v] of Object.entries(result)) {
    if (v > BUDGET[k]) {
      console.error(`FAIL ${k}: ${v} > ${BUDGET[k]}`);
      failed = true;
    }
  }
} catch (e) {
  console.error(e.message);
  failed = true;
} finally {
  // npx forks vite as a child: kill the whole process group so port is freed for the next run.
  try {
    process.kill(-server.pid);
  } catch {
    /* already gone */
  }
  rmSync(tmp, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
