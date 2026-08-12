import { expect, test } from 'playwright/test';

test('storefront exposes an installable manifest and production service worker contract', async ({ page, request }) => {
  await page.goto('/?preview=1&theme=luxury-fashion', { waitUntil: 'networkidle' });
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/storefront.webmanifest');
  const manifest = await (await request.get('/storefront.webmanifest')).json();
  expect(manifest).toMatchObject({ display: 'standalone', scope: '/', id: '/' });
  expect(manifest.icons[0].purpose).toContain('maskable');
  const worker = await request.get('/storefront-sw.js');
  expect(worker.ok()).toBe(true);
  expect(await worker.text()).toContain("self.addEventListener('fetch'");
});
