// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import Historik from './Historik';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Historik', () => {
  afterEach(() => localStorage.clear());

  it('shows the change since the first estimate with a decimal comma', () => {
    localStorage.setItem(
      'lifespan:history',
      JSON.stringify([
        { ts: 1, age: 40, gender: 'male', expected: 77.8 },
        { ts: 2, age: 40, gender: 'male', expected: 79.3 },
      ]),
    );
    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => root.render(<Historik resultData={{ endTimestamp: 1 }} />));
    expect(container.textContent).toContain('steget 1,5 år');
    expect(container.textContent).not.toContain('1.5');
    act(() => root.unmount());
  });
});
