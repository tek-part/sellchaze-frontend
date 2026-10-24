import { expect, test } from 'playwright/test';

// The production document (no `?preview=1`), as a store host serves it. The inline boot script must
// start the bootstrap read itself, the app must adopt it instead of asking again, and the active
// theme's chunks must be preloaded from the bootstrap's theme key.
test('the inline boot script starts the bootstrap read once and preloads the active theme', async ({ page }) => {
  const bootstrapUrls: string[] = [];
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.replace(/\/$/, '') === '/api/v1/storefront') {
      bootstrapUrls.push(`${url.pathname}${url.search}`);
      await route.fulfill({ json: { store: { id: 7654321, name: 'Early boot fixture', slug: 'early-boot', currency: 'USD', supported_currencies: ['USD'], default_locale: 'en', supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'glow', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
      return;
    }
    await route.fulfill({ json: { data: [] } });
  });

  await page.goto('/storefront.html?lang=en', { waitUntil: 'networkidle' });

  expect(bootstrapUrls).toEqual(['/api/v1/storefront?lang=en']);
  const preloaded = await page.locator('link[rel="modulepreload"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  expect(preloaded.some(href => /\/assets\/glow-[\w-]+\.js$/.test(href))).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-storefront-ready', 'true');
});

test('previews keep their own bootstrap request', async ({ page }) => {
  const bootstrapUrls: string[] = [];
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.replace(/\/$/, '') === '/api/v1/storefront') {
      bootstrapUrls.push(url.search);
      await route.fulfill({ status: 404, json: { message: 'No merchant on this isolated preview host' } });
      return;
    }
    await route.fulfill({ json: { data: [] } });
  });

  await page.goto('/?preview=1&theme=karat&lang=ar', { waitUntil: 'networkidle' });

  expect(bootstrapUrls.length).toBeGreaterThan(0);
  expect(bootstrapUrls.every(search => search.includes('lang=ar'))).toBe(true);
  const preloaded = await page.locator('link[rel="modulepreload"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  expect(preloaded.some(href => /\/assets\/karat-[\w-]+\.js$/.test(href))).toBe(true);
});
