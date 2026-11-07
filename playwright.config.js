import { defineConfig } from '@playwright/test';

// A free-ish port per run unless E2E_PORT is set; set on process.env so the test workers see the same value.
process.env.E2E_PORT ||= String(20000 + Math.floor(Math.random() * 20000));
const PORT = Number(process.env.E2E_PORT);
// The Plausible script ignores localhost and 127.x, so the site is opened under a made-up host that Chrome maps to 127.0.0.1.
const SITE_HOST = 'levetid.test';
// Same image tag as the Dockerfile; src/serveConfig.test.js keeps them in sync.
const CADDY_IMAGE = 'caddy:2.11.7-alpine';

// The suite runs against the built site (`npm run build` first), served the way production serves it: the
// production Caddyfile in the Caddy image, with dist/ mounted read-only. So unknown paths are a real 404 and
// every header comes from the real config. Needs Docker. `astro preview` would hide all of that.
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
    // The embed test frames the site from a made-up public origin (framer.test); Chrome's local-network
    // access check would block that frame because the site itself is on 127.0.0.1.
    launchOptions: {
      args: [
        `--host-resolver-rules=MAP ${SITE_HOST} 127.0.0.1`,
        '--disable-features=LocalNetworkAccessChecks,BlockInsecurePrivateNetworkRequests',
      ],
    },
    serviceWorkers: 'block',
    locale: 'da-DK',
    timezoneId: 'Europe/Copenhagen',
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    acceptDownloads: false,
  },
  webServer: {
    // --rm and the forwarded SIGTERM remove the container when the run ends.
    command:
      `docker run --rm --name levetid-e2e-${PORT} -p 127.0.0.1:${PORT}:3000 ` +
      `-v "${process.cwd()}/dist:/srv:ro" -v "${process.cwd()}/Caddyfile:/etc/caddy/Caddyfile:ro" ${CADDY_IMAGE}`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
});
