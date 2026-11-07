// The theme switch is plain HTML plus the inline script in src/layouts/Base.astro (no React on content pages).
import { test, expect } from './fixtures.js';

test('the theme switch works on a script-free page, is remembered and applied before paint on the next page', async ({ session }) => {
  const { page, rec } = session;
  await page.goto('/dodsalder-calculator');
  const toggle = page.getByRole('button', { name: 'Skift til mørk tilstand' });
  await expect(toggle).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Skift til lys tilstand' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

  // Next page: dark from the first paint (the class is set by the head script, before any CSS applies).
  await page.goto('/pensionsalder');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Skift til lys tilstand' })).toBeVisible();
  await page.getByRole('button', { name: 'Skift til lys tilstand' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
  expect(rec.pageErrors).toEqual([]);
});

test('the system dark preference is used when nothing is saved', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark', serviceWorkers: 'block' });
  await context.route(/^https?:\/\/(?!levetid\.test)/, (route) => route.abort());
  const page = await context.newPage();
  await page.goto('/hvor-lang-tid-har-jeg-tilbage');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Skift til lys tilstand' })).toBeVisible();
  await context.close();
});
