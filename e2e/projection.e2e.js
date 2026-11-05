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

  expect(await srText(page)).toMatch(/40\.8 år tilbage at leve \(nuværende dødelighed\)/);
  await expect(toggle(page, 'Nuværende dødelighed')).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle(page, 'Fremskrevet (DST)')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('projection-second-line')).toContainText('ca. 46.3 år');

  // Keyboard only: focus the inactive button, activate with Space.
  await toggle(page, 'Fremskrevet (DST)').focus();
  await page.keyboard.press('Space');
  expect(await srText(page)).toMatch(/46\.3 år tilbage at leve \(fremskrevet af Danmarks Statistik\)/);
  await expect(toggle(page, 'Fremskrevet (DST)')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('projection-second-line')).toContainText('ca. 40.8 år');
  await expect(page.getByTestId('sammenlign-basis-note')).toBeVisible();
  await expect(page.getByTestId('par-period-note')).toContainText('nuværende dødelighed');

  // Enter works too, and goes back.
  await toggle(page, 'Nuværende dødelighed').focus();
  await page.keyboard.press('Enter');
  expect(await srText(page)).toMatch(/40\.8 år tilbage at leve \(nuværende dødelighed\)/);

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
  expect(await srText(page)).toMatch(/46\.3 år/);
  await page.getByRole('button', { name: 'Ny beregning' }).click();
  await page.getByLabel('Din alder:').fill('40');
  await page.getByRole('radio', { name: 'Mand', exact: true }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
  expect(await srText(page)).toMatch(/40\.8 år tilbage at leve \(nuværende dødelighed\)/);
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
