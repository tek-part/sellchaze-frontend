import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

const themes = ['luxury-fashion', 'voltage', 'hearth', 'rouge'] as const;

for (const locale of ['en', 'ar'] as const) {
  for (const theme of themes) {
    test(`${theme} storefront has no serious accessibility violations in ${locale}`, async ({ page }) => {
      await page.addInitScript((language) => localStorage.setItem('sf:locale', language), locale);
      await page.goto(`/?preview=1&theme=${theme}`, { waitUntil: 'networkidle' });
      await expect(page.locator('#storefront-root')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
      expect(blocking, blocking.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
    });
  }
}
