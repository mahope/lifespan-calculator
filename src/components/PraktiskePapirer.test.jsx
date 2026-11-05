// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/analytics', () => ({ track: vi.fn() }));

import { track } from '../utils/analytics';
import PraktiskePapirer from './PraktiskePapirer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let observers;

beforeEach(() => {
  track.mockClear();
  observers = [];
  window.matchMedia = () => ({ matches: true });
  globalThis.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      observers = observers.filter((o) => o !== this);
    }
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = (resultData) => act(() => root.render(<PraktiskePapirer resultData={resultData} />));
const visible = () =>
  act(() => observers.forEach((o) => o.cb([{ isIntersecting: true, intersectionRatio: 1 }])));

describe('PraktiskePapirer', () => {
  it('renders nothing before a calculation', () => {
    render(null);
    expect(container.innerHTML).toBe('');
  });

  it('links to the approved programmes with sponsored rel', () => {
    render({ id: 1 });
    const links = [...container.querySelectorAll('a')];
    expect(links).toHaveLength(2);
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs[0]).toBe(
      'https://www.partner-ads.com/dk/klikbanner.php?partnerid=42553&bannerid=99220&uid=levetidsberegner'
    );
    expect(hrefs[1]).toBe(
      'https://www.partner-ads.com/dk/klikbanner.php?partnerid=42553&bannerid=71629&uid=levetidsberegner'
    );
    links.forEach((a) => {
      expect(a.getAttribute('rel')).toBe('sponsored noopener noreferrer');
      expect(a.getAttribute('target')).toBe('_blank');
    });
    expect(container.textContent).toContain('Annonce');
  });

  it('tracks a click with program and placement only', () => {
    render({ id: 1 });
    act(() => container.querySelector('a').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(track).toHaveBeenCalledWith('Affiliate Click', {
      program: 'jura-docs',
      placement: 'result-practical',
    });
  });

  it('fires impressions once per result, not on every expand', () => {
    const data = { id: 1 };
    render(data);
    visible();
    expect(track).toHaveBeenCalledTimes(2);
    const toggle = container.querySelector('button');
    act(() => toggle.click());
    act(() => toggle.click());
    visible();
    expect(track).toHaveBeenCalledTimes(2);
    render({ id: 2 });
    visible();
    expect(track).toHaveBeenCalledTimes(4);
  });
});
