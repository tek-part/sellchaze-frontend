import { expect, test } from 'playwright/test';

declare global {
  interface Window {
    __hairCareVitals?: { cls: number; lcp: number; lcpInLayout: boolean; inp: number; eventTiming: boolean; shifts: number[] };
  }
}

for (const locale of ['ar', 'en']) {
  for (const width of [1440, 390, 320]) {
    test(`Hair Care paints its campaign within web-vitals budgets in ${locale} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        window.__hairCareVitals = { cls: 0, lcp: 0, lcpInLayout: false, inp: 0, eventTiming: PerformanceObserver.supportedEntryTypes.includes('event'), shifts: [] };
        new PerformanceObserver(list => {
          for (const item of list.getEntries()) {
            const shift = item as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!shift.hadRecentInput && window.__hairCareVitals) { window.__hairCareVitals.cls += shift.value; window.__hairCareVitals.shifts.push(shift.value); }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => {
          for (const item of list.getEntries()) {
            const paint = item as PerformanceEntry & { element?: Element };
            if (window.__hairCareVitals) { window.__hairCareVitals.lcp = paint.startTime; window.__hairCareVitals.lcpInLayout = !!paint.element?.closest('.hc-root'); }
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        if (window.__hairCareVitals.eventTiming) new PerformanceObserver(list => {
          for (const item of list.getEntries()) { const event = item as PerformanceEventTiming; if (event.interactionId && window.__hairCareVitals) window.__hairCareVitals.inp = Math.max(window.__hairCareVitals.inp, event.duration); }
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      });
      await page.goto(`/funnel-templates/hair-care-${locale}?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
      await expect(page.locator('.hc-hero h1')).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.__hairCareVitals?.lcpInLayout)).toBe(true);
      if (width < 992) await page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true }).click();
      await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
      await page.locator('.hc-faq button').first().click();
      await page.waitForTimeout(750);
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return { ...window.__hairCareVitals!, ttfb: navigation.responseStart - navigation.startTime, domContentLoaded: navigation.domContentLoadedEventEnd, fonts: performance.getEntriesByType('resource').filter(item => /fonts\.(googleapis|gstatic)\.com|\/media\/fonts\//.test(item.name)).map(item => ({url:item.name,duration:item.duration})) };
      });
      console.log('Hair Care vitals', JSON.stringify({locale,width,...metrics}));
      expect(metrics.cls, `Unexpected shifts: ${JSON.stringify(metrics.shifts)}`).toBeLessThanOrEqual(0.1);
      expect(metrics.lcp).toBeGreaterThan(0);
      expect(metrics.lcp).toBeLessThanOrEqual(2500);
      expect(metrics.lcpInLayout).toBe(true);
      expect(metrics.eventTiming).toBe(true);
      expect(metrics.inp).toBeLessThanOrEqual(200);
      expect(metrics.ttfb).toBeLessThanOrEqual(800);
      expect(metrics.domContentLoaded).toBeLessThanOrEqual(3000);
    });
  }
}

test('Catalog hero starts loading while the store bootstrap is still pending', async ({page}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/storefront/**', async route => { await gate; await route.fulfill({status:503,json:{message:'Isolated unavailable store'}}); });
  const hero = page.waitForRequest(request => new URL(request.url()).pathname === '/media/funnel-campaigns/hair-care-hero-v1.webp');
  const navigation = page.goto('/funnel-templates/hair-care-en?preview=1&lang=en&theme=sahra');
  try { await hero; } finally { release(); }
  await navigation;
  await expect(page.locator('.hc-hero h1')).toBeVisible();
});

test('Native catalog paints with external font services unavailable', async ({page}) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('**/api/v1/storefront/**', route => route.fulfill({status:503,json:{message:'Isolated unavailable store'}}));
  await page.goto('/funnel-templates/hair-care-ar?preview=1&lang=ar');
  await expect(page.locator('.hc-hero h1')).toBeVisible();
  expect(await page.evaluate(() => document.fonts.load('400 16px "IBM Plex Sans Arabic"', 'متجر').then(faces => faces.length))).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.fonts.load('700 32px "Alexandria"', 'شعر').then(faces => faces.length))).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.fonts.load('400 16px "DM Sans"', 'Bicycle').then(faces => faces.length))).toBeGreaterThan(0);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(item => /\/media\/fonts\/storefront\/fonts-[a-f0-9]+\.css/.test(item.name)))).toBe(true);
});
