import { expect, test } from 'playwright/test';

for (const family of ['glasses','hair-revive','litter-robot','electric-biker','hair-care','skin-care','writing-board','habit']) for (const locale of ['ar','en']) {
  test(`Packaged ${family} ${locale} preview media follows its shared bundle across tenant hosts`, async ({ page, request }) => {
    const origin = 'http://127.0.0.1:4183'; const tenant = 'http://merchant.example.test'; const incorrect: string[] = []; const writes: string[] = [];
    const response = await request.get(`${origin}/storefront.html`);
    const html = (await response.text()).replace(/((?:src|href)=")\/(assets|media)\//g, `$1${origin}/$2/`);
    await page.route(`${origin}/**`, async route => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*' } });
    });
    await page.route(`${tenant}/**`, route => {
      if (route.request().isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: html });
      if (new URL(route.request().url()).pathname.startsWith('/media/funnel-campaigns/')) incorrect.push(route.request().url());
      return route.fulfill({ status: 404, body: 'No bundled assets on this tenant host' });
    });
    await page.route('**/api/v1/**', route => {
      if (route.request().method() !== 'GET') writes.push(route.request().url());
      return route.fulfill({ status: 503, json: { message: 'Isolated unavailable store' } });
    });
    await page.setViewportSize({ width: 390, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${tenant}/funnel-templates/${family}-${locale}?preview=1&lang=${locale}`, { waitUntil: 'networkidle' });
    const images = page.locator('#sf-main img[src*="/media/funnel-campaigns/"]');
    await expect.poll(() => images.count()).toBeGreaterThan(2);
    for (const image of await images.all()) {
      expect(await image.evaluate(e => new URL((e as HTMLImageElement).src).origin)).toBe(origin);
      if (!await image.isVisible()) continue;
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(e => { const i = e as HTMLImageElement; return i.complete && i.naturalWidth > 0; })).toBe(true);
      expect(await image.evaluate(e => new URL((e as HTMLImageElement).currentSrc).origin)).toBe(origin);
    }
    expect(incorrect).toEqual([]); expect(writes).toEqual([]);
    await expect(page.locator('form')).toHaveCount(0); await expect(page.locator('fieldset')).toHaveAttribute('disabled','');
  });
}
