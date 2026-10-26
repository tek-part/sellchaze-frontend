import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'playwright/test';

// The production document as a store host serves it at `/` (the preview server only maps
// `?preview=1` to the storefront, so the document is served from the built file directly). The
// inline boot script must start the bootstrap and home reads itself, the app must adopt them
// instead of asking again, and the theme's and home page's chunks must be preloaded.
test('the inline boot script starts the first-view reads once and preloads theme and page chunks', async ({ page }) => {
  const reads: string[] = [];
  const shell = readFileSync(fileURLToPath(new URL('../../dist/storefront.html', import.meta.url)), 'utf8');
  await page.route(url => url.pathname === '/', route => route.fulfill({ contentType: 'text/html', body: shell }));
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/$/, '');
    if (['/api/v1/storefront', '/api/v1/storefront/home', '/api/v1/storefront/layout'].includes(path)) reads.push(`${url.pathname}${url.search}`);
    if (path === '/api/v1/storefront') {
      await route.fulfill({ json: { store: { id: 7654321, name: 'Early boot fixture', slug: 'early-boot', currency: 'USD', supported_currencies: ['USD'], default_locale: 'en', supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'glow', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
      return;
    }
    await route.fulfill({ json: { data: [] } });
  });

  await page.goto('/?lang=en', { waitUntil: 'networkidle' });

  expect(reads.sort()).toEqual(['/api/v1/storefront/home?lang=en', '/api/v1/storefront/layout?template=home&lang=en', '/api/v1/storefront?lang=en']);
  const preloaded = await page.locator('link[rel="modulepreload"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  expect(preloaded.some(href => /\/assets\/glow-[\w-]+\.js$/.test(href))).toBe(true);
  expect(preloaded.some(href => /\/assets\/HomePage-[\w-]+\.js$/.test(href))).toBe(true);
  // The visitor's language copy is lazy (one chunk per language); the boot script preloads it.
  expect(preloaded.some(href => /\/assets\/en-[\w-]+\.js$/.test(href))).toBe(true);
  expect(preloaded.some(href => /\/assets\/ar-[\w-]+\.js$/.test(href))).toBe(false);
  await expect(page.locator('html')).toHaveAttribute('data-storefront-ready', 'true');
  // A classic script waits for every stylesheet above it: the boot script must come before them.
  expect(shell.indexOf('window.__sfEarly')).toBeLessThan(shell.indexOf('rel="stylesheet"'));
  // The @font-face sheet is preloaded and attached from script, so it never blocks the entry
  // module — but it is still applied.
  expect(shell).not.toMatch(/<link\s+rel="stylesheet"\s+href="\/media\/fonts\//);
  expect(await page.evaluate(() => [...document.styleSheets].some(sheet => sheet.href?.includes('/media/fonts/storefront/')))).toBe(true);
});

test('a product page reads its product once, from the early read', async ({ page }) => {
  const productReads: string[] = [];
  const shell = readFileSync(fileURLToPath(new URL('../../dist/storefront.html', import.meta.url)), 'utf8');
  await page.route(url => url.pathname === '/products/silk-scarf', route => route.fulfill({ contentType: 'text/html', body: shell }));
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/v1/storefront/products/silk-scarf') productReads.push(`${url.pathname}${url.search}`);
    if (url.pathname.replace(/\/$/, '') === '/api/v1/storefront') {
      await route.fulfill({ json: { store: { id: 7654321, name: 'Early boot fixture', slug: 'early-boot', currency: 'USD', supported_currencies: ['USD'], default_locale: 'en', supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'karat', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: 'Not found' } });
  });

  await page.goto('/products/silk-scarf?lang=en', { waitUntil: 'networkidle' });

  expect(productReads).toEqual(['/api/v1/storefront/products/silk-scarf?lang=en']);
  const preloaded = await page.locator('link[rel="modulepreload"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  expect(preloaded.some(href => /\/assets\/ProductPage-[\w-]+\.js$/.test(href))).toBe(true);
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
