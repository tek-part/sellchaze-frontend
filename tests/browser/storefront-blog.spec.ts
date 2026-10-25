import { expect, test, type Page } from 'playwright/test';

// A live store's journal shows only the merchant's own published posts (each one opens as an
// article); the sample journal is for theme previews only. Synthetic store, fully mocked API.
const STORE_ID = 7654321;

async function store(page: Page, blog: unknown): Promise<void> {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: 'en', supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path === '/api/v1/storefront/content/blog') return route.fulfill({ json: blog });
    if (route.request().method() !== 'GET') return route.abort();
    return route.fulfill({ json: { data: [] } });
  });
}

/** Serve the storefront document for a live-store path, as a real store host does. */
async function liveStorePath(page: Page, path: string): Promise<void> {
  await page.route(`**${path}`, async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch({ url: new URL('/storefront.html', route.request().url()).href });
    return route.fulfill({ response });
  });
}

test('a live store without posts shows an empty journal, never the sample articles', async ({ page }) => {
  await store(page, { data: null, is_published: null });
  await liveStorePath(page, '/blog');
  await page.goto('/blog', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'No articles yet' })).toBeVisible();
  await expect(page.locator('.sf-postcard')).toHaveCount(0);
});

test('published posts link to a readable, sanitized article page', async ({ page }) => {
  await store(page, { is_published: true, data: { en: { posts: [
    { title: 'Spring care guide', slug: 'spring-care', excerpt: 'Keep it fresh.', date: '2026-10-20', body: '<p>Hello <strong>world</strong></p><img src=x onerror="window.__xss=1"><script>window.__xss=2</script>' },
    { title: 'Plain notes', slug: 'plain-notes', body: 'First paragraph.\n\nSecond paragraph.' },
  ] } } });
  await liveStorePath(page, '/blog');
  await page.goto('/blog', { waitUntil: 'networkidle' });
  await expect(page.locator('.sf-postcard')).toHaveCount(2);

  await page.getByRole('link', { name: 'Spring care guide' }).click();
  await expect(page).toHaveURL(/\/blog\/spring-care$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Spring care guide' })).toBeVisible();
  await expect(page.locator('.sf-prose strong')).toHaveText('world');
  await expect(page.locator('.sf-prose script, .sf-prose [onerror]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

  await page.getByRole('link', { name: 'Back to the journal' }).click();
  await page.getByRole('link', { name: 'Plain notes' }).click();
  await expect(page.locator('.sf-prose__p')).toHaveText(['First paragraph.', 'Second paragraph.']);
});

test('an unknown post on a live store is not found', async ({ page }) => {
  await store(page, { data: null, is_published: null });
  await liveStorePath(page, '/blog/linen-care-guide');
  await page.goto('/blog/linen-care-guide', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Article not found' })).toBeVisible();
});

test('theme previews keep the sample journal', async ({ page }) => {
  await store(page, { data: null, is_published: null });
  await page.goto('/blog?preview=1&theme=naseem&lang=en', { waitUntil: 'networkidle' });
  expect(await page.locator('.sf-postcard').count()).toBeGreaterThan(0);
});
