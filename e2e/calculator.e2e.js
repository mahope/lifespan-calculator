import { test, expect, submitCalculator, captureResult, ANALYTICS_HOST } from './fixtures.js';
import { EVENTS } from '../src/utils/analytics.js';

// The three baseline inputs of the 2026-11-05 audit (audit/measure2/baseline), clock frozen.
export const CASES = [
  { id: '1-male-40', input: { gender: 'male', age: 40 }, years: '40.8' },
  { id: '2-female-65', input: { gender: 'female', age: 65 }, years: '21.0' },
  { id: '3-male-birthdate-1985-06-15', input: { gender: 'male', birthdate: '1985-06-15' }, years: '39.9' },
];

// Values typed into the form that must never leave the browser. Strings the page may legitimately
// send (event names, the site's own URL) are not in this list.
const typedValues = (input) => [input.birthdate, input.birthdate?.replaceAll('-', '/')].filter(Boolean);

for (const { id, input, years } of CASES) {
  test.describe(id, () => {
    test('shows the golden remaining years and matches the minimal snapshot', async ({ session }) => {
      const { page } = session;
      await submitCalculator(page, input);
      const url = new URL(page.url());
      const result = await captureResult(page);
      // Explicit golden number: changes only when the calculation or the life table changes.
      // The page shows a decimal comma (Danish format), the golden value is kept as on master.
      expect(result.srAnnouncement).toMatch(new RegExp(`(^|[^\\d.,])${years.replace('.', ',')} år`));
      // Numbers only, no copy: the snapshot must not break when wording changes.
      const snapshot = {
        id,
        input,
        frozenClock: '2026-11-05T12:34:56Z',
        urlAfterSubmit: url.pathname + url.search,
        yearsRemaining: years,
        countdown: result.countdown,
        partnerAdsLinks: result.partnerAdsLinks,
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
      // Every event is on the whitelist in src/utils/analytics.js: known name, only whitelisted prop keys.
      // 'pageview' is the Plausible script's own automatic event; it is allowed no props at all.
      const allowedProps = { ...EVENTS, pageview: [] };
      const typed = [String(input.age ?? ''), ...typedValues(input)].filter(Boolean);
      for (const e of rec.events) {
        expect(e.unparsable, 'unparsable analytics body').toBeUndefined();
        expect(Object.keys(allowedProps), `event "${e.n}" is not in EVENTS (or pageview)`).toContain(e.n);
        // Gender is checked on prop values only: the event URL legitimately contains the share parameter.
      const genderWords = ['male', 'female', 'mand', 'kvinde', input.gender];
      for (const [key, value] of Object.entries(e.p ?? {})) {
        expect(genderWords, `event "${e.n}" prop "${key}" carries the gender`).not.toContain(String(value).toLowerCase());
          expect(allowedProps[e.n], `event "${e.n}" carries prop "${key}" outside its whitelist`).toContain(key);
          // Prop values are compared whole, so "40" cannot hide inside unrelated digits.
          expect(typed, `event "${e.n}" prop "${key}" carries a typed input value`).not.toContain(String(value));
        }
      }
      // At least one prop-carrying event must have been seen, otherwise the prop checks above are vacuous.
      expect(rec.events.some((e) => Object.keys(e.p ?? {}).length > 0), 'no analytics event with props was recorded').toBe(true);
      const everything = rec.eventBodies.join('\n');
      for (const v of typed) {
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
