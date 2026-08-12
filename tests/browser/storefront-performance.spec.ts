import { expect, test } from 'playwright/test';

declare global {
  interface Window {
    __sellchazeCls?: number;
    __sellchazeShifts?: Array<{ value: number; sources: string[] }>;
    __sellchazeInteractions?: Array<{ duration: number; interactionId: number; name: string }>;
    __sellchazeInteractionTimingSupported?: boolean;
  }
}

const themes = ['luxury-fashion', 'voltage', 'hearth', 'rouge'] as const;

for (const theme of themes) {
  test(`${theme} storefront stays inside local web-vitals budgets`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__sellchazeCls = 0;
      window.__sellchazeShifts = [];
      window.__sellchazeInteractions = [];
      window.__sellchazeInteractionTimingSupported = PerformanceObserver.supportedEntryTypes.includes('event');
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
            sources?: Array<{ node?: Element }>;
          };
          if (!shift.hadRecentInput) {
            window.__sellchazeCls = (window.__sellchazeCls ?? 0) + shift.value;
            window.__sellchazeShifts?.push({
              value: shift.value,
              sources: (shift.sources ?? []).map(({ node }) => {
                if (!(node instanceof Element)) return node?.nodeName?.toLowerCase() ?? 'unknown';
                return `${node.tagName.toLowerCase()}#${node.id}.${[...node.classList].join('.')}`;
              }),
            });
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      if (window.__sellchazeInteractionTimingSupported) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const interaction = entry as PerformanceEventTiming;
            if (interaction.interactionId > 0) {
              window.__sellchazeInteractions?.push({
                duration: interaction.duration,
                interactionId: interaction.interactionId,
                name: interaction.name,
              });
            }
          }
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      }
    });

    await page.goto(`/?preview=1&theme=${theme}`, { waitUntil: 'networkidle' });
    await expect(page.locator('#storefront-root')).toBeVisible();
    await page.getByRole('button', { name: 'Search', exact: true }).first().click();
    await page.waitForTimeout(750);

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries.at(-1)?.startTime ?? 0;
      const interactions = window.__sellchazeInteractions ?? [];
      return {
        cls: window.__sellchazeCls ?? 0,
        shifts: window.__sellchazeShifts ?? [],
        lcp,
        inp: interactions.reduce((max, interaction) => Math.max(max, interaction.duration), 0),
        interactions,
        interactionTimingSupported: window.__sellchazeInteractionTimingSupported ?? false,
        ttfb: navigation ? navigation.responseStart - navigation.startTime : 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd ?? 0,
      };
    });

    expect(
      metrics.cls,
      `CLS ${metrics.cls} exceeded the local 0.1 budget: ${JSON.stringify(metrics.shifts)}`,
    ).toBeLessThanOrEqual(0.1);
    expect(metrics.lcp, `LCP ${metrics.lcp}ms exceeded the 2.5s budget`).toBeLessThanOrEqual(2_500);
    expect(metrics.interactionTimingSupported, 'Chromium did not expose Event Timing for INP').toBe(true);
    // Event Timing omits interactions faster than its 16ms minimum threshold.
    // An empty list therefore means there was no slow interaction to include in INP.
    expect(metrics.inp, `INP ${metrics.inp}ms exceeded the 200ms budget`).toBeLessThanOrEqual(200);
    expect(metrics.ttfb, `TTFB ${metrics.ttfb}ms exceeded the local 800ms budget`).toBeLessThanOrEqual(800);
    expect(metrics.domContentLoaded, `DOMContentLoaded ${metrics.domContentLoaded}ms exceeded 3s`).toBeLessThanOrEqual(3_000);
  });
}
