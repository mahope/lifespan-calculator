import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Regression guard for #90: wording that was unsourced, false or out of date
// must not come back into the UI copy. Every pattern has a sample that must
// match it, so a pattern that can no longer fail is itself a test failure.
const FORBIDDEN = [
  { re: /\bWHO\b/, sample: 'Anbefaling fra WHO' },
  { re: /geografiske? placering/, sample: 'baseret på din geografiske placering' },
  { re: /livsstil udgør op til 60/, sample: 'livsstil udgør op til 60% af faktorerne' },
  { re: /Max (7|14) genstande/, sample: 'Kvinder: Max 7 genstande per uge' },
];

// Calls into the analytics layer (`track(...)` and a direct `plausible(...)`)
// must not carry a prop that names user input.
const ANALYTICS_CALL = /\b(track|plausible)\([^)]*\{[^)]*\b(age|alder|gender|sex|koen|køn|birth)/i;

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(jsx?|css)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe('copy guard', () => {
  const files = sourceFiles(fileURLToPath(new URL('.', import.meta.url)));

  it('scans the source tree', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it.each(FORBIDDEN.map((f) => [String(f.re), f]))('src/ does not contain %s', (_label, { re }) => {
    const hits = files.filter((f) => re.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it.each(FORBIDDEN.map((f) => [String(f.re), f]))('the guard for %s can fail', (_label, { re, sample }) => {
    expect(re.test(sample)).toBe(true);
  });

  it('analytics calls carry no user input props', () => {
    const hits = files.filter((f) => ANALYTICS_CALL.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('the analytics guard catches both track() and plausible()', () => {
    expect(ANALYTICS_CALL.test("track('Calc', { age: 40 })")).toBe(true);
    expect(ANALYTICS_CALL.test("plausible('Calc', { props: { gender: 'male' } })")).toBe(true);
    expect(ANALYTICS_CALL.test("track('Calc', { mode: 'advanced' })")).toBe(false);
  });
});
