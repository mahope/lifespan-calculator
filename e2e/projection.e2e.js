import { test, expect, submitCalculator, ANALYTICS_HOST } from './fixtures.js';
import { EVENTS } from '../src/utils/analytics.js';

// Projection toggle (#92): the period figure stays the default headline, the DST projected
// figure is the second line and the toggle switches the headline. The golden default numbers
// live in calculator.e2e.js and must not change.
const srText = (page) => page.locator('main p.sr-only').first().innerText();
const toggle = (page, name) => page.getByRole('group', { name: /Beregningsgrundlag/ }).getByRole('button', { name });

test('male 40: period is the default, the toggle switches the headline and is keyboard operable', async ({ session }) => {
  const { page, rec } = session;
  await submitCalculator(page, { gender: 'male', age: 40 });

  expect(await srText(page)).toMatch(/40,8 år tilbage at leve \(nuværende dødelighed\)/);
  await expect(toggle(page, 'Nuværende dødelighed')).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle(page, 'Fremskrevet (DST)')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('projection-second-line')).toContainText('ca. 46,3 år');

  // Keyboard only: focus the inactive button, activate with Space.
  await toggle(page, 'Fremskrevet (DST)').focus();
  await page.keyboard.press('Space');
  expect(await srText(page)).toMatch(/46,3 år tilbage at leve \(fremskrevet af Danmarks Statistik\)/);
  await expect(toggle(page, 'Fremskrevet (DST)')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('projection-second-line')).toContainText('ca. 40,8 år');
  await expect(page.getByTestId('sammenlign-basis-note')).toBeVisible();
  await expect(page.getByTestId('par-period-note')).toContainText('nuværende dødelighed');

  // Enter works too, and goes back.
  await toggle(page, 'Nuværende dødelighed').focus();
  await page.keyboard.press('Enter');
  expect(await srText(page)).toMatch(/40,8 år tilbage at leve \(nuværende dødelighed\)/);

  // Page state only: nothing in the URL, nothing stored, only whitelisted analytics events.
  expect(new URL(page.url()).search).toBe('');
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  expect(stored).not.toMatch(/project|fremskrevet/i);
  for (const e of rec.events) expect(Object.keys({ ...EVENTS, pageview: [] })).toContain(e.n);
  expect(rec.events.every((e) => e.u && !/project/i.test(e.u))).toBe(true);
  expect(rec.hosts.has(ANALYTICS_HOST)).toBe(true);
  expect(rec.pageErrors).toEqual([]);
  expect(rec.console).toEqual([]);
});

test('"Ny beregning" resets the toggle to the period figure', async ({ session }) => {
  const { page } = session;
  await submitCalculator(page, { gender: 'male', age: 40 });
  await toggle(page, 'Fremskrevet (DST)').click();
  expect(await srText(page)).toMatch(/46,3 år/);
  await page.getByRole('button', { name: 'Ny beregning' }).click();
  await page.getByLabel('Din alder:').fill('40');
  await page.getByRole('radio', { name: 'Mand', exact: true }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  expect(await srText(page)).toMatch(/40,8 år tilbage at leve \(nuværende dødelighed\)/);
  await expect(toggle(page, 'Nuværende dødelighed')).toHaveAttribute('aria-pressed', 'true');
});

test('the toggle is offered at entered age 69 but not at 70', async ({ session }) => {
  const { page } = session;
  await submitCalculator(page, { gender: 'male', age: 69 });
  await expect(page.getByRole('group', { name: /Beregningsgrundlag/ })).toBeVisible();
  await page.getByRole('button', { name: 'Ny beregning' }).click();
  await page.getByLabel('Din alder:').fill('70');
  await page.getByRole('radio', { name: 'Mand', exact: true }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  await expect(page.getByRole('group', { name: /Beregningsgrundlag/ })).toHaveCount(0);
});

// WCAG 2 contrast (>= 4.5:1, all text here is 14 px) for every text node in the toggle and
// the second line, in both themes and both toggle states (the inactive button was
// 3.2-4.0:1 before #92 was repaired). axe-core's color-contrast rule cannot be used here: on
// the result card's gradient it either reports "incomplete" or blends Tailwind 4's
// oklab() overlays over the page instead of the card (verified, it reported white on a light
// grey that is not on screen). So the ratio is computed from the computed styles: the
// translucent layers between the text and the card are composited over each colour stop of
// the gradient, and over their average, which is the worst case of the ramp.
for (const theme of ['light', 'dark']) {
  test(`toggle text has >= 4.5:1 contrast on its background (${theme})`, async ({ session }) => {
    const { page } = session;
    await submitCalculator(page, { gender: 'male', age: 40 });
    await page.evaluate((t) => document.documentElement.classList.toggle('dark', t === 'dark'), theme);
    for (const state of ['Nuværende dødelighed', 'Fremskrevet (DST)']) {
      await toggle(page, state).click();
      await page.mouse.move(0, 0);
      const report = await page.evaluate(() => {
        const group = document.querySelector('[role="group"][aria-label*="Beregningsgrundlag"]');
        const line = document.querySelector('[data-testid="projection-second-line"]');
        // The nearest ancestor that paints a background: a gradient (stops measured) or an opaque colour.
        const paints = (n) => {
          const cs = getComputedStyle(n);
          return cs.backgroundImage.includes('gradient') || !/rgba\([^)]*,\s*0\)|transparent/.test(cs.backgroundColor);
        };
        let host = group.parentElement;
        while (host && !paints(host)) host = host.parentElement;
        if (!host) host = document.documentElement;
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        const rgba = (c) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = c;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
          return [r, g, b, a / 255];
        };
        const over = (top, bottom) => [0, 1, 2].map((k) => top[k] * top[3] + bottom[k] * (1 - top[3])).concat(1);
        const lum = (c) => {
          const [r, g, b] = c.slice(0, 3).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const hostStyle = getComputedStyle(host);
        const stops = hostStyle.backgroundImage.includes('gradient')
          ? (hostStyle.backgroundImage.match(/(?:oklch|oklab|rgba?|lab|lch|color)\([^)]*\)|#[0-9a-f]{3,8}\b/gi) || []).map(rgba)
          : [rgba(hostStyle.backgroundColor)];
        if (stops.length < 1) return { error: 'could not read the background' };
        const avg = [0, 1, 2].map((k) => stops.reduce((a, c) => a + c[k], 0) / stops.length).concat(1);
        const texts = [];
        for (const root of [group, line])
          for (const el of [root, ...root.querySelectorAll('*')])
            if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) texts.push(el);
        let min = { ratio: Infinity };
        for (const base of [...stops, avg]) {
          for (const el of texts) {
            let bg = base;
            const layers = [];
            for (let n = el; n && n !== host; n = n.parentElement) layers.push(rgba(getComputedStyle(n).backgroundColor));
            for (const l of layers.reverse()) bg = over(l, bg);
            const fg = over(rgba(getComputedStyle(el).color), bg);
            const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
            const ratio = (hi + 0.05) / (lo + 0.05);
            if (ratio < min.ratio) min = { ratio, text: el.textContent.trim().slice(0, 30) };
          }
        }
        return { ...min, texts: texts.length };
      });
      expect(report.error).toBeUndefined();
      expect(report.texts, 'text nodes measured').toBeGreaterThanOrEqual(4);
      expect(report.ratio, `${theme}, ${state}: lowest ratio on "${report.text}"`).toBeGreaterThanOrEqual(4.5);
      console.log(`contrast ${theme} / ${state}: min ${report.ratio.toFixed(2)}:1 ("${report.text}")`);
    }
    if (process.env.PROJECTION_SHOTS) {
      await page.screenshot({ path: `${process.env.PROJECTION_SHOTS}/${theme}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
    }
  });
}
