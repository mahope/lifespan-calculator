import { describe, it, expect, vi } from 'vitest';
import { loadWithReload, RELOAD_KEY } from './lazyWithReload';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

describe('loadWithReload', () => {
  it('returns the module and clears the guard on success', async () => {
    const storage = fakeStorage();
    storage.setItem(RELOAD_KEY, '1');
    const mod = { default: () => null };
    const result = await loadWithReload(() => Promise.resolve(mod), { storage, reload: vi.fn() });
    expect(result).toBe(mod);
    expect(storage.getItem(RELOAD_KEY)).toBeNull();
  });

  it('reloads once on a chunk-load error and never settles', async () => {
    const storage = fakeStorage();
    const reload = vi.fn();
    const p = loadWithReload(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')), {
      storage,
      reload,
    });
    const settled = vi.fn();
    p.then(settled, settled);
    await new Promise((r) => setTimeout(r, 10));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.getItem(RELOAD_KEY)).toBe('1');
    expect(settled).not.toHaveBeenCalled();
  });

  it('rethrows (for the ErrorBoundary) when a reload was already tried', async () => {
    const storage = fakeStorage();
    storage.setItem(RELOAD_KEY, '1');
    const reload = vi.fn();
    const err = new TypeError('Failed to fetch dynamically imported module');
    await expect(loadWithReload(() => Promise.reject(err), { storage, reload })).rejects.toBe(err);
    expect(reload).not.toHaveBeenCalled();
  });

  it('rethrows when sessionStorage is unavailable, so it cannot loop', async () => {
    const storage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {},
    };
    const reload = vi.fn();
    const err = new Error('boom');
    await expect(loadWithReload(() => Promise.reject(err), { storage, reload })).rejects.toBe(err);
    expect(reload).not.toHaveBeenCalled();
  });
});
