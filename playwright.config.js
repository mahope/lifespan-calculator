import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 4173);
// The Plausible script ignores localhost and 127.x, so the site is opened under a made-up host that Chrome maps to 127.0.0.1.
const SITE_HOST = 'levetid.test';

// The suite runs against the built app (`npm run build` first), served the way production
// serves it: `serve` with public/serve.json (devDependency, same pinned version as the Dockerfile), so
// unknown paths are a real 404. `vite preview` ignores serve.json and would hide that.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.js', // not *.spec.js: vitest would pick those up
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://${SITE_HOST}:${PORT}`,
    launchOptions: { args: [`--host-resolver-rules=MAP ${SITE_HOST} 127.0.0.1`] },
    serviceWorkers: 'block',
    locale: 'da-DK',
    timezoneId: 'Europe/Copenhagen',
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    acceptDownloads: false,
  },
  webServer: {
    command: `npx serve dist -l ${PORT}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
