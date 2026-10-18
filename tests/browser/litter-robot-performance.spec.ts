import { expect, test } from 'playwright/test';

declare global {
  interface Window {
    __litterVitals?: { cls: number; lcp: number; lcpInLayout: boolean; inp: number; eventTiming: boolean; shifts: number[] };
  }
}

for (const locale of ['ar', 'en']) {
  for (const width of [1440, 390, 320]) {
    test(`Litter Robot paints its campaign within web-vitals budgets in ${locale} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        window.__litterVitals = { cls: 0, lcp: 0, lcpInLayout: false, inp: 0, eventTiming: PerformanceObserver.supportedEntryTypes.includes('event'), shifts: [] };
        new PerformanceObserver(list => {
          for (const item of list.getEntries()) {
            const shift = item as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!shift.hadRecentInput && window.__litterVitals) { window.__litterVitals.cls += shift.value; window.__litterVitals.shifts.push(shift.value); }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(list => {
          for (const item of list.getEntries()) {
            const paint = item as PerformanceEntry & { element?: Element };
            if (window.__litterVitals) { window.__litterVitals.lcp = paint.startTime; window.__litterVitals.lcpInLayout = !!paint.element?.closest('.lr-root'); }
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        if (window.__litterVitals.eventTiming) new PerformanceObserver(list => {
          for (const item of list.getEntries()) { const event = item as PerformanceEventTiming; if (event.interactionId && window.__litterVitals) window.__litterVitals.inp = Math.max(window.__litterVitals.inp, event.duration); }
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      });
      await page.goto(`/funnel-templates/litter-robot-${locale}?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
      await expect(page.locator('.lr-hero h1')).toBeVisible();
      await expect.poll(() => page.evaluate(() => window.__litterVitals?.lcpInLayout)).toBe(true);
      if (width < 992) await page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true }).click();
      await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
      await page.locator('.lr-faq button').first().click();
      await page.waitForTimeout(750);
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return { ...window.__litterVitals!, ttfb: navigation.responseStart - navigation.startTime, domContentLoaded: navigation.domContentLoadedEventEnd };
      });
      console.log('Litter Robot vitals', JSON.stringify({locale,width,...metrics}));
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
  const hero = page.waitForRequest(request => new URL(request.url()).pathname === '/media/funnel-campaigns/litter-robot-hero-v1.webp');
  const navigation = page.goto('/funnel-templates/litter-robot-en?preview=1&lang=en&theme=sahra');
  try { await hero; } finally { release(); }
  await navigation;
  await expect(page.locator('.lr-hero h1')).toBeVisible();
});
