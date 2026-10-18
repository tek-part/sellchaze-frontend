import { expect, test } from 'playwright/test';

declare global {
  interface Window {
    __homeLoadingShifts?: Array<{ value: number; sources: string[] }>;
  }
}

const themes = ['sahra', 'elite-furniture', 'elite-wallets'] as const;
const emptyHome = {
  data: { products: [], categories: [], best_sellers: [], new_arrivals: [], on_sale: [], trending: [], collections: [], brands: [], coupons: [], content: { home: null, about: null, faq: null } },
};
const publishedHome = {
  data: { template: 'home', source: 'store', page_id: null, sections: [
    { id: 'verified-home', type: 'hero-banner', settings: { heading: 'Verified merchant home', height: 'tall', image: '', mobile_image: '' } },
    { id: 'verified-second', type: 'hero-banner', settings: { heading: 'Published second section', height: 'tall', image: '', mobile_image: '' } },
  ] },
};

for (const theme of themes) {
  for (const width of [1440, 390]) {
    test(`${theme} keeps a visible loading area until home data and composition resolve at ${width}px`, async ({ page }) => {
      let releaseHome!: () => void;
      let releaseLayout!: () => void;
      const homeGate = new Promise<void>(resolve => { releaseHome = resolve; });
      const layoutGate = new Promise<void>(resolve => { releaseLayout = resolve; });
      const requested = new Set<string>();
      const settled = new Set<string>();
      await page.addInitScript(() => {
        window.__homeLoadingShifts = [];
        new PerformanceObserver(list => {
          for (const item of list.getEntries()) {
            const entry = item as PerformanceEntry & { hadRecentInput: boolean; value: number; sources?: Array<{ node?: Element }> };
            if (!entry.hadRecentInput) window.__homeLoadingShifts?.push({ value: entry.value, sources: (entry.sources ?? []).map(({ node }) => node instanceof Element ? `${node.tagName}.${node.className}` : 'text') });
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.route('**/api/v1/**', async route => {
        const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
        if (path === '/api/v1/storefront') {
          await route.fulfill({ json: { store: { id: 7654321, name: 'Loading fixture', slug: 'loading-fixture', currency: 'USD', supported_currencies: ['USD'], default_locale: 'en', supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: theme, version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
          return;
        }
        const key = path.split('/').at(-1)!;
        if (key === 'home' || key === 'layout') {
          requested.add(key);
          await (key === 'home' ? homeGate : layoutGate);
          await route.fulfill({ json: key === 'home' ? emptyHome : publishedHome });
          settled.add(key);
          return;
        }
        await route.fulfill({ json: { data: [] } });
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?preview=1&theme=${theme}&lang=en`, { waitUntil: 'domcontentloaded' });
      await expect.poll(() => requested.has('home') && requested.has('layout')).toBe(true);
      const loading = page.locator('#sf-main [aria-busy="true"]');
      await expect(loading.getByRole('status')).toBeVisible();
      await expect(page.locator('footer')).toHaveCSS('visibility', 'visible');
      expect(await page.locator('#sf-main').evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(900);
      expect((await page.locator('footer').boundingBox())!.y).toBeGreaterThanOrEqual(900);

      const first = width === 1440 ? 'home' : 'layout';
      if (first === 'home') releaseHome(); else releaseLayout();
      await expect.poll(() => settled.has(first)).toBe(true);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(loading.getByRole('status')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Verified merchant home', exact: true })).toHaveCount(0);
      if (first === 'home') releaseLayout(); else releaseHome();
      await expect(page.getByRole('heading', { name: 'Verified merchant home', exact: true })).toBeVisible();
      await expect(loading).toHaveCount(0);
      await expect(page.locator('footer')).toHaveCSS('visibility', 'visible');
      expect((await page.locator('footer').boundingBox())!.y).toBeGreaterThanOrEqual(900);
      expect(await page.locator('#sf-main a[href*="/products/"]').count()).toBe(0);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const shifts = await page.evaluate(() => window.__homeLoadingShifts ?? []);
      expect(shifts.reduce((sum, shift) => sum + shift.value, 0), JSON.stringify(shifts)).toBeLessThanOrEqual(0.1);
    });
  }

  test(`${theme} isolated preview renders without merchant home or layout requests`, async ({ page }) => {
    const dataQueries: string[] = [];
    let bootstrapReads = 0;
    page.on('request', request => {
      const path = new URL(request.url()).pathname.replace(/\/$/, '');
      if (/\/storefront\/(home|layout)$/.test(path)) dataQueries.push(path);
    });
    await page.route('**/api/v1/**', async route => {
      const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
      if (path === '/api/v1/storefront') { bootstrapReads++; await route.fulfill({ status: 404, json: { message: 'No merchant on this isolated preview host' } }); return; }
      await route.fulfill({ json: { data: [] } });
    });
    await page.goto(`/?preview=1&theme=${theme}&lang=en`, { waitUntil: 'networkidle' });
    await expect(page.locator('#sf-main .sf-section-frame').first()).toBeVisible();
    await expect(page.locator('#sf-main [aria-busy="true"]')).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCSS('visibility', 'visible');
    expect(bootstrapReads).toBeGreaterThan(0);
    expect(dataQueries).toEqual([]);
  });
}
