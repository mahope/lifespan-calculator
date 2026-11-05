import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Regression guard for #90: wording that was unsourced, false or out of date
// must not come back into the UI copy.
const FORBIDDEN = [
  /\bWHO\b/,
  /geografisk placering/,
  /livsstil udgør op til 60/,
  /Max 7 \/ Mænd: Max 14/,
];

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(jsx?|css)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe('copy guard', () => {
  const files = sourceFiles(new URL('.', import.meta.url).pathname);

  it('scans the source tree', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(FORBIDDEN.map((re) => [String(re), re]))('src/ does not contain %s', (_label, re) => {
    const hits = files.filter((f) => re.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('analytics calls carry no user input props', () => {
    const hits = files.filter((f) => /plausible\([^)]*\{[^)]*\b(age|alder|gender|sex|koen|køn|birth)/i.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});
