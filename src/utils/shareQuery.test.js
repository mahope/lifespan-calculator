import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHARE_KEYS, takeShareSearchParams, parseShareParams } from './shareState';

// Runs the exact inline script from the page layout (src/layouts/Base.astro) against a fake window/location.
const html = readFileSync(new URL('../layouts/Base.astro', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const inline = scripts.find((s) => s.includes('__shareQuery'));

function run(url) {
  const u = new URL(url, 'https://levetid.test');
  const calls = [];
  const win = {
    location: { search: u.search, pathname: u.pathname, hash: u.hash },
    history: { state: null, replaceState: (...a) => calls.push(a) },
  };
  new Function('window', 'location', 'history', inline)(win, win.location, win.history);
  return { win, calls };
}

describe('inline share-query script (Base.astro)', () => {
  it('exists and comes before the analytics script', () => {
    expect(inline).toBeTruthy();
    expect(html.indexOf('__shareQuery')).toBeLessThan(html.indexOf('analytics.holstjensen.eu'));
  });

  it('strips share keys and keeps them in memory', () => {
    const { win, calls } = run('/?g=male&a=40');
    expect(win.__shareQuery).toBe('g=male&a=40');
    expect(calls).toEqual([[null, '', '/']]);
  });

  it('strips advanced and legacy birthdate links', () => {
    expect(run('/?g=female&m=advanced&lf=0,1,2').win.__shareQuery).toBe('g=female&m=advanced&lf=0,1,2');
    const { win, calls } = run('/?b=1985-06-15&g=male');
    expect(win.__shareQuery).toBe('b=1985-06-15&g=male');
    expect(calls[0][2]).toBe('/');
  });

  it('leaves unrelated parameters and the hash alone', () => {
    const { win, calls } = run('/?utm_source=test&g=male&a=40&ref=x#top');
    expect(win.__shareQuery).toBe('g=male&a=40');
    expect(calls[0][2]).toBe('/?utm_source=test&ref=x#top');
  });

  it('does nothing without share keys', () => {
    const { win, calls } = run('/?utm_source=test');
    expect(win.__shareQuery).toBeUndefined();
    expect(calls).toEqual([]);
    expect(run('/').calls).toEqual([]);
  });

  it('covers every key the app parses', () => {
    for (const k of SHARE_KEYS) expect(run(`/?${k}=1`).win.__shareQuery).toBe(`${k}=1`);
  });
});

describe('takeShareSearchParams', () => {
  it('reads the in-memory value first and deletes it', () => {
    const win = { __shareQuery: 'g=male&a=40' };
    const p = takeShareSearchParams(new URLSearchParams(), win);
    expect(parseShareParams(p, { now: new Date('2026-11-05') })).toMatchObject({ gender: 'male', age: 40 });
    expect('__shareQuery' in win).toBe(false);
  });

  it('falls back to the real search string', () => {
    const fb = new URLSearchParams('g=female&a=65');
    expect(takeShareSearchParams(fb, {})).toBe(fb);
  });
});
