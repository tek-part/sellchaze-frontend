import { expect, test } from 'playwright/test';

const themes = ['luxury-fashion', 'voltage', 'hearth', 'rouge'] as const;

for (const locale of ['en', 'ar'] as const) {
  for (const theme of themes) {
    test(`${theme} storefront visual contract in ${locale}`, async ({ page }) => {
      await page.addInitScript((language) => localStorage.setItem('sf:locale', language), locale);
      await page.addInitScript(() => {
        window.setInterval = (() => 0) as typeof window.setInterval;
      });
      // Remote demo photos are rate-limited and made snapshots flaky. Preserve
      // image geometry while serving a deterministic colour per source URL.
      await page.route('https://images.unsplash.com/**', async (route) => {
        const hash = [...route.request().url()].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 0);
        const colour = `hsl(${hash % 360} 24% 72%)`;
        await route.fulfill({
          contentType: 'image/svg+xml',
          body: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"><rect width="100%" height="100%" fill="${colour}"/></svg>`,
        });
      });
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/?preview=1&theme=${theme}`, { waitUntil: 'networkidle' });
      const root = page.locator('#storefront-root');
      await expect(root).toBeVisible();
      await expect(page).toHaveScreenshot(`${theme}-${locale}.png`, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.005,
      });
    });
  }
}
