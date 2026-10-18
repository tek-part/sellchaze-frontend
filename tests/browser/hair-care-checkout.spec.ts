import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

for (const locale of ['en', 'ar'] as const) for (const width of [1440, 390, 320]) {
  test(`Hair Care real checkout preserves variant, offer, gallery and payment readability in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const mutations: string[] = []; const quotes: Array<{ items: Array<{ product_id: number; variant_id?: number; quantity: number; quantity_offer_id?: string }> }> = [];
    const image = '/media/funnel-campaigns/hair-care-product-v1.webp'; const detail = '/media/funnel-campaigns/hair-care-portrait-v1.webp';
    const offer = 'a413bd2e-9f67-4b67-8513-8af1e1a0d003';
    await page.route('**/api/v1/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname.replace(/\/$/, '');
      if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: 7654321, name: 'Isolated checkout fixture', slug: 'isolated-haircare', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'sahra', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
      if (path.endsWith('/funnels/isolated-haircare')) return route.fulfill({ json: { data: { slug: 'isolated-haircare', template: 'page', locale, title: 'Isolated electric campaign', native_funnel_template: `hair-care-${locale}`, funnel_product_slug: 'isolated-shampoo', sections: [
        { id: 'private-hero', type: 'haircare-hero', settings: { heading: 'Isolated campaign', image } },
        { id: 'private-purchase', type: 'haircare-purchase', settings: {} },
      ] } } });
      if (path.endsWith('/products/isolated-shampoo')) return route.fulfill({ json: { data: { id: 700, name: 'Isolated shampoo', slug: 'isolated-shampoo', price: 100, stock: 10, is_active: true, image_url: image, auto_select_variant: true, variants: [
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
    await page.goto(`/funnels/isolated-haircare?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
    await expect(page.locator('.hc-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('.hc-purchase-panel form')).toHaveCount(1);
    await expect(page.locator('.hc-demo-note')).toHaveCount(0);
    const options = page.locator('.sf-funnel-checkout__option select');
    await options.selectOption('702');
    await expect(page.locator('.hc-gallery-main')).toHaveAttribute('src', detail);
    await expect(page.locator('.hc-dock')).toContainText('120');
    await page.locator('.sf-quantity-offer').filter({ hasText: 'Isolated pair' }).getByRole('radio').check();
    await expect(page.locator('input[type=number]')).toHaveValue('2');
    await expect(page.locator('.hc-dock')).toContainText('80');
    await expect(page.locator('.hc-purchase-panel .hc-prices .hc-discount')).toContainText('47');
    await expect(page.locator('.hc-dock .hc-discount')).toContainText('47');
    await expect.poll(() => quotes.at(-1)?.items[0]).toEqual({ product_id: 700, variant_id: 702, quantity: 2, quantity_offer_id: offer, quantity_offer_version: 1, personalization: {} });
    await expect(page.locator('.sf-funnel-checkout__payment img')).toHaveAttribute('src', /\/payments\/cod\.png$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const blocking = results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
    expect(blocking, JSON.stringify(blocking.map(item => ({ id: item.id, help: item.help, nodes: item.nodes.map(node => node.target) })))).toEqual([]);
    expect(mutations).toEqual([]);
    await page.locator('.hc-purchase').screenshot({ path: testInfo.outputPath('isolated-checkout.png') });
  });
}
