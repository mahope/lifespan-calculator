import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Regression guard for #90: wording that was unsourced, false or out of date
// must not come back into the UI copy. Every pattern has a sample that must
// match it, and the file scanner itself is run on a temp tree that contains
// each forbidden string, so neither a dead pattern nor a dead scanner can pass.
const FORBIDDEN = [
  { re: /\bWHO\b/, sample: 'Anbefaling fra WHO' },
  { re: /geografiske? placering/, sample: 'baseret på din geografiske placering' },
  { re: /livsstil udgør op til 60/, sample: 'livsstil udgør op til 60% af faktorerne' },
  { re: /Max (7|14) genstande/, sample: 'Kvinder: Max 7 genstande per uge' },
];

// Props that name user input; none may be passed to the analytics layer.
const INPUT_PROP = /\b(age|alder|gender|sex|koen|køn|birth\w*|fodselsdato|fødselsdato)\b/i;

const root = fileURLToPath(new URL('..', import.meta.url));

// Copy lives in src/ (jsx/js/css/astro, including the page layout) and in the standalone pages in public/.
function sourceFiles(dir, { includeHtml = false } = {}) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path, { includeHtml });
    const ok = /\.(jsx?|css|astro)$/.test(name) || (includeHtml && name.endsWith('.html'));
    return ok && !/\.test\./.test(name) ? [path] : [];
  });
}

function copyFiles(base) {
  const files = sourceFiles(join(base, 'src'), { includeHtml: true });
  files.push(...sourceFiles(join(base, 'public'), { includeHtml: true }).filter((f) => f.endsWith('.html')));
  return files;
}

function forbiddenHits(files, re) {
  return files.filter((f) => re.test(readFileSync(f, 'utf8')));
}

// Text of every `track(...)` / `plausible(...)` argument list, found by matching
// parentheses so nested calls and ternaries do not cut the argument short.
function analyticsArgs(text) {
  const out = [];
  const start = /\b(?:track|plausible)\(/g;
  while (start.exec(text)) {
    let depth = 1;
    let i = start.lastIndex;
    while (i < text.length && depth > 0) {
      if (text[i] === '(') depth += 1;
      else if (text[i] === ')') depth -= 1;
      i += 1;
    }
    out.push(text.slice(start.lastIndex, i - 1));
  }
  return out;
}

function analyticsViolations(text) {
  return analyticsArgs(text).filter((args) => INPUT_PROP.test(args.replace(/^\s*(['"`]).*?\1/, '')));
}

describe('copy guard', () => {
  const files = copyFiles(root);

  it('scans src/ (with the .astro pages and layout) and public/*.html', () => {
    expect(files.length).toBeGreaterThan(20);
    expect(files.some((f) => f.endsWith('Base.astro'))).toBe(true);
    expect(files.some((f) => f.endsWith('index.astro'))).toBe(true);
    expect(files.some((f) => f.endsWith('privatlivspolitik.html'))).toBe(true);
  });

  it.each(FORBIDDEN.map((f) => [String(f.re), f]))('the copy does not contain %s', (_label, { re }) => {
    expect(forbiddenHits(files, re)).toEqual([]);
  });

  it.each(FORBIDDEN.map((f) => [String(f.re), f]))('the guard for %s can fail', (_label, { re, sample }) => {
    expect(re.test(sample)).toBe(true);
  });

  it('the scanner finds each forbidden string in src (jsx and astro) and public html', () => {
    const base = mkdtempSync(join(tmpdir(), 'copyguard-'));
    try {
      mkdirSync(join(base, 'src', 'pages'), { recursive: true });
      mkdirSync(join(base, 'src', 'layouts'), { recursive: true });
      mkdirSync(join(base, 'public'));
      const places = ['src/pages/A.jsx', 'src/pages/b.astro', 'src/layouts/Base.astro', 'public/policy.html'];
      for (const place of places) writeFileSync(join(base, place), '<p>ren tekst</p>');
      for (const { re, sample } of FORBIDDEN) {
        for (const place of places) {
          writeFileSync(join(base, place), `<p>${sample}</p>`);
          const hits = forbiddenHits(copyFiles(base), re);
          expect(hits.map((h) => h.slice(base.length + 1)), `${re} in ${place}`).toEqual([place]);
          writeFileSync(join(base, place), '<p>ren tekst</p>');
        }
      }
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('analytics calls carry no user input props', () => {
    const hits = files.filter((f) => analyticsViolations(readFileSync(f, 'utf8')).length > 0);
    expect(hits).toEqual([]);
  });

  it('the analytics guard catches track() and plausible(), also with nested calls', () => {
    const bad = [
      "track('Calc', { age: 40 })",
      "plausible('Calc', { props: { gender: 'male' } })",
      "track(fn(a), { age })",
      "track('Calc', cond(x) ? { age } : {})",
      "track('Calc', { mode: pick(x), birthdate })",
    ];
    for (const sample of bad) expect(analyticsViolations(sample), sample).toHaveLength(1);
    expect(analyticsViolations("track('Calc', { mode: 'advanced' })")).toEqual([]);
    expect(analyticsViolations("track('Age gate opened')")).toEqual([]);
  });
});
