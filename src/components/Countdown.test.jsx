// @vitest-environment jsdom
import { Profiler, act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Countdown from './Countdown';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const NOW = new Date('2026-11-05T12:00:00Z');
const END = NOW.getTime() + (741 * 24 * 3600 + 3 * 3600 + 4 * 60 + 5) * 1000;

let container;
let root;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const values = () => [...container.querySelectorAll('.time-value')].map((e) => e.textContent);

describe('Countdown', () => {
  it('ticks once per second and only re-renders itself, not its parent', () => {
    let parentCommits = 0;
    let countdownCommits = 0;
    act(() =>
      root.render(
        <Profiler id="parent" onRender={() => parentCommits++}>
          <Profiler id="countdown" onRender={() => countdownCommits++}>
            <Countdown endTimestamp={END} />
          </Profiler>
        </Profiler>,
      ),
    );
    expect(values()).toEqual(['2', '10', '3', '4', '5']);
    expect(countdownCommits).toBe(1);

    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000));

    expect(values()).toEqual(['2', '10', '3', '4', '2']);
    // The parent Profiler also fires for descendant commits, so compare mounts:
    // exactly one mount commit + one per tick, with no extra renders in between.
    expect(countdownCommits).toBe(4);
    expect(parentCommits).toBe(countdownCommits);
  });

  it('does not re-render when the parent re-renders with the same props only through ticks', () => {
    let renders = 0;
    const Probe = () => {
      renders++;
      return <Countdown endTimestamp={END} />;
    };
    act(() => root.render(<Probe />));
    for (let i = 0; i < 5; i++) act(() => vi.advanceTimersByTime(1000));
    // Probe (the stand-in for HomePage) rendered once; only Countdown's own state changed.
    expect(renders).toBe(1);
  });

  it('shows "--" instead of NaN when there is no end timestamp', () => {
    act(() => root.render(<Countdown endTimestamp={undefined} />));
    expect(values()).toEqual(['--', '--', '--', '--', '--']);
    act(() => vi.advanceTimersByTime(2000));
    expect(values()).toEqual(['--', '--', '--', '--', '--']);
  });

  it('shows real zeros, not "--"', () => {
    act(() => root.render(<Countdown endTimestamp={NOW.getTime()} />));
    expect(values()).toEqual(['0', '0', '0', '0', '0']);
  });

  it('remounts with fresh values when keyed by a new end timestamp', () => {
    act(() => root.render(<Countdown key={END} endTimestamp={END} />));
    const next = END + 86400 * 1000;
    act(() => root.render(<Countdown key={next} endTimestamp={next} />));
    expect(values()[1]).toBe('11');
  });
});
