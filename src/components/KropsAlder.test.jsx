// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import KropsAlder from './KropsAlder';
import { remainingLifeExpectancy } from '../utils/lifeTableDK';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

const render = (delta) => {
  const remaining = remainingLifeExpectancy(40, 'male') + delta;
  act(() =>
    root.render(
      <KropsAlder
        resultData={{
          age: '40.00',
          remainingYears: remaining.toFixed(1),
          gender: 'male',
          lifestyleImpact: delta,
        }}
      />
    )
  );
  return container.textContent;
};

describe('KropsAlder (Statistisk risikoalder)', () => {
  it('uses the statistical risk age wording and no biological claim or emoji', () => {
    for (const delta of [6, -6]) {
      const text = render(delta);
      expect(text).toContain('Din statistiske risikoalder');
      expect(text).toContain('svarer dit estimat for resterende leveår til det, en gennemsnitsdansker på ca.');
      expect(text).toContain('ikke en måling af din krop');
      expect(text).not.toMatch(/biologisk|🎉|krop, der er|dødelighedsrisiko/i);
    }
  });

  it('renders nothing when lifestyle does not move the estimate', () => {
    act(() => root.render(<KropsAlder resultData={{ age: '40', remainingYears: '38', gender: 'male', lifestyleImpact: 0 }} />));
    expect(container.textContent).toBe('');
  });
});
