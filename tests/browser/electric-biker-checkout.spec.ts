import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

for (const locale of ['en', 'ar'] as const) test(`Funnel advertising pins its path and order identity through recovery in ${locale}`, async ({ page, baseURL }) => {
  const advertising: Array<Record<string, unknown>> = []; const orders: Array<{ body: Record<string, unknown>; key?: string }> = [];
  const providers: string[] = [];
  await page.addInitScript(() => { Object.defineProperty(navigator, 'doNotTrack', { value: null }); });
  await page.route(/https:\/\/(connect\.facebook\.net|analytics\.tiktok\.com|sc-static\.net|www\.googletagmanager\.com)\//, async route => { providers.push(route.request().url()); await route.abort(); });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname.replace(/\/$/, '');
    const respond = (json: unknown, status = 200) => route.fulfill({ json, status });
    if (path === '/api/v1/storefront') return respond({ store: { id: 7654321, name: 'Synthetic pixel store', slug: 'synthetic-pixels', currency: 'USD', default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: true }, theme: { key: 'sahra', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } });
    if (path.endsWith('/funnels/isolated-pixels')) return respond({ data: { slug: 'isolated-pixels', template: 'page', locale, title: 'Synthetic pixel campaign', native_funnel_template: `electric-biker-${locale}`, funnel_product_slug: 'synthetic-bicycle', sections: [{ id: 'pixel-purchase', type: 'electric-purchase', settings: {} }] } });
    if (path.endsWith('/products/synthetic-bicycle')) return respond({ data: { id: 700, name: 'Synthetic bicycle', slug: 'synthetic-bicycle', price: 100, stock: 10, is_active: true, variants: [] } });
    if (path.endsWith('/payment-methods')) return respond({ data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: true }] });
    if (path.endsWith('/checkout/fields')) return respond({ data: [], requires_shipping: false, has_digital: false, shipping: { enabled: false, regions_enabled: false, currency: 'USD', flat_rate: '0', regions: [], options: [] } });
    if (path.endsWith('/checkout/quote')) return respond({ data: { currency: 'USD', requires_shipping: false, totals: { subtotal: 100, discount_total: 0, shipping_total: 0, tax_total: 0, grand_total: 100 } } });
    if (path.endsWith('/tracking/events')) { advertising.push(request.postDataJSON()); return respond({ data: null }, 202); }
    if (path.endsWith('/checkout/recover')) return respond({ message: 'Synthetic missing claim' }, 404);
    if (path.endsWith('/checkout')) {
      orders.push({ body: request.postDataJSON(), key: request.headers()['idempotency-key'] });
      return orders.length === 1 ? respond({ message: 'Synthetic connection loss' }, 503) : respond({ data: { number: 'SYNTHETIC-ONLY', tracking: null } }, 201);
    }
    if (request.method() !== 'GET') expect(path).toMatch(/\/(events|leads)$/);
    return respond({ data: [] });
  });
  // Serve the local storefront shell at an ordinary funnel URL without preview=1,
  // which intentionally suppresses advertising. Every commerce endpoint is intercepted.
  await page.route('**/funnels/isolated-pixels*', async route => {
    if (!route.request().isNavigationRequest()) return route.fallback();
    await route.fulfill({ response: await route.fetch({ url: `${baseURL}/storefront.html` }) });
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`/funnels/isolated-pixels?lang=${locale}`);
  const submit = page.locator('.sf-funnel-checkout form button[type=submit]');
  await expect(submit).toBeEnabled();
  await expect.poll(() => advertising.map(event => event.event)).toEqual(expect.arrayContaining(['page_view', 'view_item', 'begin_checkout']));
  expect(advertising.every(event => event.page_path === '/funnels/isolated-pixels')).toBe(true);
  await submit.click();
  await expect(page.getByRole('button', { name: locale === 'ar' ? 'استعادة نتيجة الطلب' : 'Recover checkout result', exact: true })).toBeVisible();
  expect(orders[0]?.body).toMatchObject({ cart_mode: 'direct', checkout_surface: 'funnel', funnel_path: '/funnels/isolated-pixels', advertising_allowed: true, items: [{ product_id: 700, quantity: 1, personalization: {} }] });
  await page.getByRole('button', { name: locale === 'ar' ? 'استعادة نتيجة الطلب' : 'Recover checkout result', exact: true }).click();
  await expect.poll(() => orders.length).toBe(2);
  expect(orders[1]).toEqual(orders[0]);
  expect(providers).toEqual([]);
});

for (const locale of ['en', 'ar'] as const) for (const width of [1440, 390, 320]) {
  test(`Electric Biker real checkout preserves variant, offer, gallery and payment readability in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const mutations: string[] = []; const quotes: Array<{ items: Array<{ product_id: number; variant_id?: number; quantity: number; quantity_offer_id?: string }> }> = [];
    const image = '/media/funnel-campaigns/electric-biker-product-v1.webp'; const detail = '/media/funnel-campaigns/electric-biker-detail-v1.webp';
    const offer = 'a413bd2e-9f67-4b67-8513-8af1e1a0d003';
    await page.route('**/api/v1/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname.replace(/\/$/, '');
      if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: 7654321, name: 'Isolated checkout fixture', slug: 'isolated-electric', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'sahra', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
      if (path.endsWith('/funnels/isolated-electric')) return route.fulfill({ json: { data: { slug: 'isolated-electric', template: 'page', locale, title: 'Isolated electric campaign', native_funnel_template: `electric-biker-${locale}`, funnel_product_slug: 'isolated-bicycle', sections: [
        { id: 'private-hero', type: 'electric-hero', settings: { heading: 'Isolated campaign', image } },
        { id: 'private-purchase', type: 'electric-purchase', settings: {} },
      ] } } });
      if (path.endsWith('/products/isolated-bicycle')) return route.fulfill({ json: { data: { id: 700, name: 'Isolated bicycle', slug: 'isolated-bicycle', price: 100, stock: 10, is_active: true, image_url: image, auto_select_variant: true, variants: [
        { id: 701, name: 'Base', price: 100, compare_price: 150, stock: 10, is_active: true, image_url: image },
        { id: 702, name: 'Plus', price: 120, compare_price: 150, stock: 10, is_active: true, image_url: detail },
      ], quantity_offers: [{ id: offer, quantity: 2, unit_price: 80, version: 1, free_shipping: false, title: 'Isolated pair', subtitle: 'Two fixture items' }] } } });
      if (path.endsWith('/payment-methods')) return route.fulfill({ json: { data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: true }] } });
      if (path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [], requires_shipping: false, has_digital: false, shipping: { enabled: false, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '0', free_over: null, regions: [], options: [] } } });
      if (path.endsWith('/checkout/quote')) {
        const payload = request.postDataJSON(); quotes.push(payload);
        const item = payload.items[0]; const unit = item.quantity_offer_id ? 80 : item.variant_id === 702 ? 120 : 100;
        return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: false, totals: { subtotal: unit * item.quantity, discount_total: 0, shipping_total: 0, tax_total: 0, grand_total: unit * item.quantity } } } });
      }
      if (request.method() !== 'GET') { mutations.push(path); return route.abort(); }
      return route.fulfill({ json: { data: [] } });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/funnels/isolated-electric?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
    await expect(page.locator('.eb-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('.eb-purchase-panel form')).toHaveCount(1);
    await expect(page.locator('.eb-demo-note')).toHaveCount(0);
    const options = page.locator('.sf-funnel-checkout__option select');
    await options.selectOption('702');
    await expect(page.locator('.eb-gallery-main')).toHaveAttribute('src', detail);
    await expect(page.locator('.eb-page-dock')).toContainText('120');
    await page.locator('.sf-quantity-offer').filter({ hasText: 'Isolated pair' }).getByRole('radio').check();
    await expect(page.locator('input[type=number]')).toHaveValue('2');
    await expect(page.locator('.eb-page-dock')).toContainText('80');
    await expect(page.locator('.eb-prices .eb-discount')).toContainText('47');
    await expect.poll(() => quotes.at(-1)?.items[0]).toEqual({ product_id: 700, variant_id: 702, quantity: 2, quantity_offer_id: offer, quantity_offer_version: 1, personalization: {} });
    await expect(page.locator('.sf-funnel-checkout__payment img')).toHaveAttribute('src', /\/payments\/cod\.png$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const blocking = results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
    expect(blocking, JSON.stringify(blocking.map(item => ({ id: item.id, help: item.help, nodes: item.nodes.map(node => node.target) })))).toEqual([]);
    expect(mutations).toEqual([]);
    await page.locator('.eb-purchase').screenshot({ path: testInfo.outputPath('isolated-checkout.png') });
  });
}
