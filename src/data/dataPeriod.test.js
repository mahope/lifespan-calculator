import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../components/Footer';
import Sandsynlighed from '../components/Sandsynlighed';
import { LIFE_TABLE_META } from './lifeTableDK.generated.js';
import { LIFE_TABLE_DK } from '../utils/lifeTableDK';
import { computeResult } from '../utils/lifespanMath';

const SRC = fileURLToPath(new URL('..', import.meta.url));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

describe('data period is single-sourced', () => {
  it('has no hard-coded DST period in src/ outside the generated file', () => {
    const generated = ['data/lifeTableDK.generated.js', 'data/lifeTableExtras.generated.js', 'data/healthyLifeYears.generated.js'].map((f) =>
      join('src', f).split(sep).join('/')
    );
    const offenders = walk(SRC)
      .filter((f) => /\.(jsx?|css|html|json|snap)$/.test(f) && !f.endsWith('dataPeriod.test.js'))
      .filter((f) => !generated.includes(join('src', relative(SRC, f)).split(sep).join('/')))
      .filter((f) => /2024[-–:]2025/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });

  it('exposes a well-formed period and tables of 100 ages (101 survivors entries)', () => {
    expect(LIFE_TABLE_META.period).toMatch(/^\d{4}-\d{4}$/);
    expect(LIFE_TABLE_META.tid).toBe(LIFE_TABLE_META.period.replace('-', ':'));
    expect(LIFE_TABLE_META.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LIFE_TABLE_DK.remaining.male).toHaveLength(100);
    expect(LIFE_TABLE_DK.remaining.female).toHaveLength(100);
    expect(LIFE_TABLE_DK.survivors.male).toHaveLength(101);
    expect(LIFE_TABLE_DK.survivors.female).toHaveLength(101);
  });

  it('puts the period in the result data source', () => {
    const r = computeResult({ birthDate: '1990-01-01', gender: 'male', lifestyleFactors: {} }, new Date(2026, 5, 1));
    expect(r.dataSource).toBe(`Danmarks Statistik (${LIFE_TABLE_META.period})`);
  });

  it('renders the period in the footer and the probability card', () => {
    const footer = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Footer)));
    expect(footer).toContain(`periode ${LIFE_TABLE_META.tid}`);
    expect(footer).toContain(`dødelighedstavler ${LIFE_TABLE_META.tid}`);
    const card = renderToStaticMarkup(createElement(Sandsynlighed, { resultData: { age: '40.00', gender: 'male' } }));
    expect(card.replace(/<!-- -->/g, '')).toContain(`Danmarks Statistik, ${LIFE_TABLE_META.period}`);
  });
});
