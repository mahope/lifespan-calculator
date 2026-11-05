import { test, expect, submitCalculator, captureResult, ANALYTICS_HOST } from './fixtures.js';

// The three baseline inputs of the 2026-11-05 audit (audit/measure2/baseline), clock frozen.
export const CASES = [
  { id: '1-male-40', input: { gender: 'male', age: 40 } },
  { id: '2-female-65', input: { gender: 'female', age: 65 } },
  { id: '3-male-birthdate-1985-06-15', input: { gender: 'male', birthdate: '1985-06-15' } },
];

// Values typed into the form that must never leave the browser. Strings the page may legitimately
// send (event names, the site's own URL) are not in this list.
const typedValues = (input) => [input.birthdate, input.birthdate?.replaceAll('-', '/')].filter(Boolean);

for (const { id, input } of CASES) {
  test.describe(id, () => {
    test('result matches the committed baseline snapshot', async ({ session }) => {
      const { page } = session;
      await submitCalculator(page, input);
      const url = new URL(page.url());
      const result = await captureResult(page);
      const snapshot = {
        id,
        input,
        frozenClock: '2026-11-05T12:34:56Z',
        urlAfterSubmit: url.pathname + url.search,
        ...result,
      };
      expect(JSON.stringify(snapshot, null, 2) + '\n').toMatchSnapshot(`${id}.json`);
    });

    test('the share link for the same input gives the same result', async ({ session }) => {
      const { page } = session;
      await submitCalculator(page, input);
      const first = await captureResult(page);
      const q = new URLSearchParams({ g: input.gender });
      if (input.birthdate) q.set('b', input.birthdate);
      else q.set('a', String(input.age));
      await page.goto(`/?${q}`, { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: 'Din resterende tid' }).waitFor();
      await page.waitForTimeout(500);
      const second = await captureResult(page);
      expect(second.srAnnouncement).toBe(first.srAnnouncement);
      expect(second.countdown).toEqual(first.countdown);
    });

    test('contacts only the site and analytics, sends no input, logs no errors', async ({ session }) => {
      const { page, rec, siteHost } = session;
      await submitCalculator(page, input);

      const hosts = [...rec.hosts].sort();
      expect(hosts.filter((h) => h !== siteHost && h !== ANALYTICS_HOST), `unexpected hosts: ${hosts}`).toEqual([]);

      // The analytics script must really have run (a pageview was sent), otherwise the checks below prove nothing.
      expect(rec.events.length).toBeGreaterThan(0);
      for (const e of rec.events) expect(Object.keys(e.p ?? {}), `event ${e.n} carries props`).toEqual([]);
      const everything = rec.eventBodies.join('\n');
      for (const v of [String(input.age ?? ''), ...typedValues(input)].filter(Boolean)) {
        // An age like "40" can appear inside unrelated digits, so test it as a JSON/prop value, not a substring.
        if (v === String(input.age)) {
          expect(everything).not.toMatch(new RegExp(`"(age|alder|gender|g|a)"\\s*:\\s*"?${v}"?`));
        } else {
          expect(everything).not.toContain(v);
        }
      }
      for (const word of ['"male"', '"female"', 'gender', 'birthdate']) expect(everything).not.toContain(word);

      expect(rec.pageErrors).toEqual([]);
      expect(rec.console).toEqual([]);
    });
  });
}

test('a crafted share link leaves the page responsive', async ({ session }) => {
  const { page, rec, siteHost } = session;
  await page.goto('/?g=constructor&a=99999999', { waitUntil: 'networkidle' });
  // Invalid link: the empty form is shown and still works.
  await expect(page.getByLabel('Din alder:')).toBeVisible();
  await page.getByLabel('Din alder:').fill('40');
  await page.getByRole('radio', { name: 'Mand', exact: true }).click();
  await page.getByRole('button', { name: 'Beregn levetid' }).click();
  await expect(page.getByRole('heading', { name: 'Din resterende tid' })).toBeVisible();
  expect([...rec.hosts].filter((h) => h !== siteHost && h !== ANALYTICS_HOST)).toEqual([]);
  expect(rec.pageErrors).toEqual([]);
  expect(rec.console).toEqual([]);
});
