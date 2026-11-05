// @vitest-environment jsdom
import { useState } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import LifestyleFactor from './LifestyleFactor';
import { ASSOCIATION_NOTE, LIFESTYLE_FACTORS, factorHelper } from '../utils/lifestyleFactors';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const factor = LIFESTYLE_FACTORS.find((f) => f.key === 'exercise'); // 0, 2, 4, 6
const find = (key) => LIFESTYLE_FACTORS.find((f) => f.key === key);
const environment = LIFESTYLE_FACTORS.find((f) => f.key === 'environment'); // no 0 option

function Harness({ f, initial = 0, spy }) {
  const [value, setValue] = useState(initial);
  return (
    <LifestyleFactor
      factor={f}
      value={value}
      onSelect={(key, v) => {
        spy?.push([key, v]);
        setValue(v);
      }}
    />
  );
}

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (props) => act(() => root.render(<Harness {...props} />));
const radios = () => [...container.querySelectorAll('[role="radio"]')];
const press = (el, key) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });

const pressWith = (el, key, mods) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods }));
  });

describe('LifestyleFactor modifier keys', () => {
  it('leaves browser shortcuts alone (Alt+ArrowLeft is "back", Ctrl+Home is "scroll to top")', () => {
    const spy = [];
    render({ f: factor, initial: 2, spy });
    const el = radios()[1];
    for (const mods of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }]) {
      pressWith(el, 'ArrowLeft', mods);
      pressWith(el, 'Home', mods);
    }
    expect(spy).toEqual([]);
  });
});

describe('LifestyleFactor', () => {
  it('renders a labelled radiogroup with one radio per option', () => {
    render({ f: factor });
    const group = container.querySelector('[role="radiogroup"]');
    expect(group.getAttribute('aria-labelledby')).toBe(container.querySelector('span.font-medium').id);
    expect(radios().map((r) => r.textContent)).toEqual(factor.options.map((o) => o.label));
  });

  it('marks only the selected option checked and makes it the single tab stop', () => {
    render({ f: factor, initial: 4 });
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true', 'false']);
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, -1, 0, -1]);
    expect(radios()[2].className).toContain('active');
  });

  it('keeps the first option tabbable when nothing is checked', () => {
    render({ f: environment, initial: 0 });
    expect(radios().every((r) => r.getAttribute('aria-checked') === 'false')).toBe(true);
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });

  it('selects on click and shows the signed years', () => {
    const spy = [];
    render({ f: factor, spy });
    act(() => radios()[3].click());
    expect(spy).toEqual([['exercise', 6]]);
    expect(container.textContent).toContain('+4,5 år');
  });

  it('moves selection and focus with the arrow keys, wrapping around', () => {
    render({ f: factor, initial: 0 });
    press(radios()[0], 'ArrowRight');
    expect(radios()[1].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios()[1]);
    press(radios()[1], 'ArrowLeft');
    press(radios()[0], 'ArrowUp');
    expect(radios()[3].getAttribute('aria-checked')).toBe('true');
    press(radios()[3], 'ArrowDown');
    expect(radios()[0].getAttribute('aria-checked')).toBe('true');
  });

  it('jumps to the first and last option with Home and End', () => {
    render({ f: factor, initial: 2 });
    press(radios()[1], 'End');
    expect(radios()[3].getAttribute('aria-checked')).toBe('true');
    press(radios()[3], 'Home');
    expect(radios()[0].getAttribute('aria-checked')).toBe('true');
  });

  it('ignores other keys', () => {
    const spy = [];
    render({ f: factor, spy });
    press(radios()[0], 'a');
    expect(spy).toEqual([]);
  });
});

describe('LifestyleFactor helper text and notes (#93)', () => {
  const group = () => container.querySelector('[role="radiogroup"]');
  const describedText = () =>
    group().getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id).textContent);

  it('shows the generated helper text with the association note and ties it to the group', () => {
    render({ f: factor });
    const helper = container.querySelector('p');
    expect(helper.textContent).toContain(factorHelper(factor));
    expect(helper.textContent).toContain(ASSOCIATION_NOTE);
    expect(group().getAttribute('aria-describedby')).toBe(helper.id);
  });

  it('marks a factor that does not count and describes the group with that note first', () => {
    const stress = find('stress');
    render({ f: stress, initial: -2 });
    expect(container.textContent).toContain('påvirker ikke beregningen');
    expect(container.querySelector('span.text-sm').textContent).toBe('påvirker ikke beregningen');
    const [note, helper] = describedText();
    expect(note).toBe('påvirker ikke beregningen');
    expect(helper).toContain('Kivimäki');
  });

  it('does not show the note on a factor that counts', () => {
    render({ f: factor });
    expect(container.textContent).not.toContain('påvirker ikke beregningen');
    expect(describedText()).toHaveLength(1);
  });

  it('describes a factor without helper text by the note alone', () => {
    const work = find('work');
    render({ f: { ...work, info: undefined, source: undefined } });
    expect(describedText()).toEqual(['påvirker ikke beregningen']);
  });

  it('gives every "Se kilden" link its own accessible name and links all papers the cite names', () => {
    const smoking = find('smoking');
    render({ f: smoking });
    const links = [...container.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://pubmed.ncbi.nlm.nih.gov/23343063/',
      'https://pubmed.ncbi.nlm.nih.gov/23107252/',
      'https://pubmed.ncbi.nlm.nih.gov/15213107/',
    ]);
    const names = links.map((a) => a.getAttribute('aria-label'));
    expect(new Set(names).size).toBe(3);
    expect(names[0]).toBe('Se kilden (Jha), Rygning');
    expect(links.every((a) => a.getAttribute('aria-label').startsWith(a.textContent))).toBe(true);
  });

  it('uses the plain visible text when there is only one paper, still named per factor', () => {
    render({ f: factor });
    const [a] = container.querySelectorAll('a');
    expect(a.textContent).toBe('Se kilden');
    expect(a.getAttribute('aria-label')).toBe('Se kilden, Motion');
  });
});

