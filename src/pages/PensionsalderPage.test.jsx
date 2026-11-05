// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PensionsalderPage from './PensionsalderPage';
import { FAQ, faqJsonLd } from '../utils/pensionFaq';
import { PENSION_AGE_ROWS, folkepensionAgeOn } from '../utils/pension';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date('2026-11-05T12:00:00');
let container;
let root;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <HelmetProvider>
        <MemoryRouter>
          <PensionsalderPage />
        </MemoryRouter>
      </HelmetProvider>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const setValue = (el, value) => {
  const proto = Object.getPrototypeOf(el);
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
};
const enter = (date) => act(() => setValue(container.querySelector('#pension-birthdate'), date));
const text = () => container.textContent;
const alertText = () => container.querySelector('[role="alert"]')?.textContent ?? null;

describe('PensionsalderPage', () => {
  it('shows nothing and no error before a date is entered', () => {
    expect(alertText()).toBeNull();
    expect(text()).not.toContain('Folkepensionsalder ');
    expect(container.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it.each(['1929-12-31', '2026-11-06', '2999-01-01'])('rejects %s as out of range', (date) => {
    enter(date);
    expect(alertText()).toMatch(/gyldig fødselsdato/);
    expect(container.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it('rejects an incomplete or impossible date', () => {
    enter('2026-02-30');
    expect(container.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it('accepts the range ends 1930-01-01 and today', () => {
    enter('1930-01-01');
    expect(alertText()).toBeNull();
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
    enter('2026-11-05');
    expect(alertText()).toBeNull();
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('shows age, date and retirement years for both sexes when sex is left empty', () => {
    enter('1990-05-17');
    const out = container.querySelector('[aria-live="polite"]').textContent;
    expect(out).toContain('70 år');
    expect(out).toContain('17. maj 2060');
    expect(out).toContain('for mænd');
    expect(out).toContain('for kvinder');
  });

  it('shows only the chosen sex', () => {
    enter('1990-05-17');
    act(() => setValue(container.querySelector('#pension-sex'), 'female'));
    const out = container.querySelector('[aria-live="polite"]').textContent;
    expect(out).toContain('for kvinder');
    expect(out).not.toContain('for mænd');
  });

  it('takes the retired branch for someone past pension age', () => {
    enter('1950-03-01');
    const out = container.querySelector('[aria-live="polite"]').textContent;
    expect(out).toContain('Pensioneret');
    expect(out).toContain('Dato du nåede den');
    expect(out).toContain('Forventede år tilbage i dag');
  });

  it('shows half-year ages for the 1954 H1 cohort', () => {
    enter('1954-06-30');
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain('65½ år');
  });

  it('renders one table row per cohort with the age from the calculator', () => {
    const rows = [...container.querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(PENSION_AGE_ROWS.length);
    rows.forEach((tr, i) => {
      const age = folkepensionAgeOn(...PENSION_AGE_ROWS[i].from);
      const expected = age % 1 ? `${Math.floor(age)}½ år` : `${age} år`;
      expect(tr.querySelector('td').textContent).toBe(expected);
    });
  });

  it('shows every FAQ question and answer as visible text, and the JSON-LD is built from the same FAQ', () => {
    for (const [q, a] of FAQ) {
      expect(text()).toContain(q);
      expect(text()).toContain(a);
    }
    expect(faqJsonLd['@type']).toBe('FAQPage');
    expect(faqJsonLd.mainEntity.map((e) => [e.name, e.acceptedAnswer.text])).toEqual(FAQ);
  });
});
