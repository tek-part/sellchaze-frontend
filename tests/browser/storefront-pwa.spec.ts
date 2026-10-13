import { expect, test } from 'playwright/test';

test('storefront exposes an installable manifest and production service worker contract', async ({ page, request }) => {
  await page.goto('/?preview=1&theme=naseem', { waitUntil: 'networkidle' });
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/storefront.webmanifest');
  const manifest = await (await request.get('/storefront.webmanifest')).json();
  expect(manifest).toMatchObject({ display: 'standalone', scope: '/', id: '/' });
  expect(manifest.icons[0].purpose).toContain('maskable');
  const worker = await request.get('/storefront-sw.js');
  expect(worker.ok()).toBe(true);
  expect(await worker.text()).toContain("self.addEventListener('fetch'");
});

test('a delayed cart storage event cannot restore an item removed in another tab', async ({ page, context }) => {
  const key = 'sf-cart-v2:dev:USD';
  await page.addInitScript((cartKey) => {
    localStorage.setItem('sf:locale', 'en');
    localStorage.setItem(cartKey, JSON.stringify({ version: 2, storeId: 'dev', currency: 'USD', lines: [{ id: 'local-line', productId: '777', title: 'Local regression product', url: '/products/local-regression-product', price: 20, currency: 'USD', quantity: 1 }] }));
  }, key);
  await page.goto('/?preview=1&theme=elite-furniture', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: 'Cart (1)', exact: true })).toBeVisible();
  const second = await context.newPage();
  await second.goto('/?preview=1&theme=elite-furniture', { waitUntil: 'networkidle' });
  await expect(second.getByRole('button', { name: 'Cart (1)', exact: true })).toBeVisible();
  const obsolete = await second.evaluate(cartKey => localStorage.getItem(cartKey), key);
  await page.getByRole('button', { name: 'Cart (1)', exact: true }).click();
  await page.getByRole('button', { name: 'Remove: Local regression product', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cart (0)', exact: true })).toBeVisible();
  await expect(second.getByRole('button', { name: 'Cart (0)', exact: true })).toBeVisible();
  await second.evaluate(({ cartKey, oldValue }) => window.dispatchEvent(new StorageEvent('storage', { key: cartKey, newValue: oldValue, storageArea: window.localStorage })), { cartKey: key, oldValue: obsolete });
  await second.waitForTimeout(250);
  await expect(second.getByRole('button', { name: 'Cart (0)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cart (0)', exact: true })).toBeVisible();
  await second.close();
});
