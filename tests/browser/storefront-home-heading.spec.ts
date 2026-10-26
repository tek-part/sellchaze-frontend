import { expect, test, type Page } from 'playwright/test';

// A merchant home composition that opens with an image-only slider still has exactly one
// top-level heading (the store name, visually hidden); a titled first slide keeps its own.
// Synthetic store, fully mocked API.
const STORE_ID = 7654321;

async function liveHome(page: Page, slides: Array<Record<string, unknown>>): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: 'en', supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'pure-furniture', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path === '/api/v1/storefront/layout') return route.fulfill({ json: { data: { source: 'store', template: 'home', sections: [
      { id: 'hero', type: 'hero-slider', settings: { blocks: slides.map((settings, i) => ({ id: `s${i}`, type: 'slide', settings })) } },
    ] } } });
    if (route.request().method() !== 'GET') return route.fulfill({ status: 202, json: {} });
    return route.fulfill({ json: { data: [] } });
  });
  // Serve the storefront document for `/`, as a real store host does.
  await page.route('**/', async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch({ url: new URL('/storefront.html', route.request().url()).href });
    return route.fulfill({ response });
  });
}

test('an image-only first slide gets the store name as the page heading', async ({ page }) => {
  await liveHome(page, [{ image: '/media/placeholder.svg' }]);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#sf-main h1, h1[data-fallback-heading]')).toHaveCount(1);
  await expect(page.locator('h1[data-fallback-heading]')).toHaveText('Synthetic Atelier');
});

test('a titled first slide keeps its own heading and no fallback is added', async ({ page }) => {
  await liveHome(page, [{ image: '/media/placeholder.svg', heading: 'Autumn collection' }]);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1, name: 'Autumn collection' })).toBeVisible();
  await page.waitForTimeout(1700);
  await expect(page.locator('h1[data-fallback-heading]')).toHaveCount(0);
});
