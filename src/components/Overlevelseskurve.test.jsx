// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';
import Overlevelseskurve from './Overlevelseskurve';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const render = (props) => {
  const el = document.createElement('div');
  act(() => createRoot(el).render(<Overlevelseskurve gender="male" {...props} />));
  return el;
};

describe('Overlevelseskurve', () => {
  it('renders nothing from 99 and up, and for a non-finite age', () => {
    expect(render({ age: 99 }).innerHTML).toBe('');
    expect(render({ age: 98.5 }).innerHTML).not.toBe('');
    expect(render({ age: 120 }).innerHTML).toBe('');
    expect(render({ age: NaN }).innerHTML).toBe('');
  });

  it('draws both 80 and 90 marks for a 40 year old', () => {
    const text = render({ age: 40 }).textContent;
    expect(text).toContain('80 år:');
    expect(text).toContain('90 år:');
  });

  it('drops the 90 mark above 90 and keeps the curve at 95', () => {
    const el = render({ age: 91 });
    expect(el.textContent).not.toContain('90 år:');
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('labels the expected age as adjusted', () => {
    expect(render({ age: 40, expectedAge: 84.2 }).textContent).toContain('Justeret forventet alder 84.2');
  });
});
