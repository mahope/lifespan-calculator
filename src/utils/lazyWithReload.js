import { lazy } from 'react';

export const RELOAD_KEY = 'lv-chunk-reload';

// After a deploy, an open tab may request a hashed chunk that no longer exists.
// Reload once to pick up the new build; the sessionStorage guard makes sure a
// persistent failure falls through to the ErrorBoundary instead of looping.
export function loadWithReload(factory, deps = {}) {
  const storage = deps.storage ?? (typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  const reload = deps.reload ?? (() => window.location.reload());

  return factory().then(
    (mod) => {
      try {
        storage?.removeItem(RELOAD_KEY);
      } catch {
        /* noop */
      }
      return mod;
    },
    (err) => {
      try {
        if (storage && storage.getItem(RELOAD_KEY) !== '1') {
          storage.setItem(RELOAD_KEY, '1');
          reload();
          // Keep Suspense on the loader while the page reloads.
          return new Promise(() => {});
        }
      } catch {
        /* storage unavailable: fall through and surface the error */
      }
      throw err;
    },
  );
}

export function lazyWithReload(factory) {
  return lazy(() => loadWithReload(factory));
}
