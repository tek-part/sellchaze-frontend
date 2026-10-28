import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

const THEMES = ['naseem', 'bazaar', 'sahra', 'fresh', 'techno', 'maison', 'glow', 'karat', 'stride', 'sphinx-v3', 'elite-wallets', 'hype-fashion', 'hype-perfumes', 'nature-pets', 'blast-pets', 'elite-furniture', 'nature-kids', 'pure-furniture'];
const STORE = 7654399;
type Surface = 'cart' | 'product' | 'funnel';
async function fixture(page: Page, locale: 'en' | 'ar', theme: string, testMode = true) {
  const writes: string[] = [];
  const quotes: Array<Record<string, unknown>> = [];
  const amount = testMode ? '50.00' : '5.00';
  const product = { id: 700, name: 'Synthetic limits item', slug: 'synthetic-limits', price: amount, currency: 'KWD', is_active: true, digital_type: 'physical', stock: 10, track_inventory: false,
    image_url: null, images: [], variants: [], quantity_offers: [], product_preferences: { is_one_page_checkout: true } };
  await page.addInitScript(({ id, price }) => localStorage.setItem(`sf-cart-v2:${id}:KWD`, JSON.stringify({ version: 2, storeId: String(id), currency: 'KWD', lines: [
    { id: '700:default', productId: '700', title: 'Synthetic limits item', url: '/products/synthetic-limits', price: Number(price), currency: 'KWD', quantity: 1 },
  ] })), { id: STORE, price: amount });
  // No real tenant, provider or other remote service can be contacted by this fixture.
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.route('**/api/v1/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname.replace(/\/$/, '');
    const headers = { 'Access-Control-Allow-Origin': request.headers().origin || 'http://127.0.0.1:4218', 'Access-Control-Allow-Headers': 'content-type,authorization,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const respond = (json: unknown, status = 200) => route.fulfill({ status, headers, json });
    if (path === '/api/v1/storefront') return respond({ store: { id: STORE, name: 'Synthetic limits shop', slug: 'synthetic', currency: 'KWD', supported_currencies: ['KWD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: theme, version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } });
    if (path.endsWith('/payment-methods')) return respond({ data: [{ slug: 'tap', name: 'Tap', test_mode: testMode }, { slug: 'deema', name: 'Deema', test_mode: testMode, amount_limits: { currency: 'KWD', minimum: testMode ? '100.000' : '10.000', maximum: testMode ? '200.000' : null } }] });
    if (path.endsWith('/checkout/fields')) return respond({ data: [], requires_shipping: false, has_digital: false, shipping: { enabled: false, regions_enabled: false, auto_select_region: false, currency: 'KWD', flat_rate: '0', free_over: null, regions: [], options: [] } });
    if (path.endsWith('/cart/catalog')) return respond({ store_id: STORE, data: [product] });
    if (path.endsWith('/products/synthetic-limits')) return respond({ data: product });
    if (path.endsWith('/funnels/synthetic-limits')) return respond({ data: { slug: 'synthetic-limits', title: 'Synthetic limits funnel', template: 'page', locale, funnel_product_slug: 'synthetic-limits', sections: [] } });
    if (path.endsWith('/checkout/quote')) {
      const body = request.postDataJSON() as Record<string, unknown>; quotes.push(body);
      if (body.payment_method === 'deema') {
        const message = testMode ? 'Deema sandbox payments must be between 100 and 200 KWD.' : 'Deema live payments require at least 10 KWD.';
        return respond({ message, errors: { payment_method: [message] } }, 422);
      }
      return respond({ data: { currency: 'KWD', requires_shipping: false, amount_due: amount,
        items: [{ product_id: 700, variant_id: null, name: product.name, quantity: 1, line_total: amount }],
        totals: { subtotal: amount, discount_total: '0.00', shipping_total: '0.00', tax_total: '0.00', grand_total: amount } } });
    }
    if (request.method() !== 'GET') { writes.push(path); return respond({ message: 'Unexpected synthetic write' }, 405); }
    return respond({ data: [] });
  });
  return { writes, quotes };
}

async function check(page: Page, locale: 'en' | 'ar', theme: string, surface: Surface, live = false) {
  const seen = await fixture(page, locale, theme, !live);
  await page.setViewportSize({ width: locale === 'ar' ? 390 : 1280, height: 900 });
  const path = surface === 'cart' ? '/checkout' : surface === 'product' ? '/products/synthetic-limits' : '/funnels/synthetic-limits';
  await page.goto(`${path}?preview=1&theme=${theme}&lang=${locale}`);
  const form = page.locator(surface === 'cart' ? '.sf-co-form' : surface === 'product' ? '.sf-product-checkout form' : '.sf-funnel-checkout form');
  const hint = form.locator('[data-payment-amount-limits]');
  await expect(hint).toContainText(live ? '10.000 KWD' : '100.000 KWD');
  await expect(hint).toContainText(locale === 'ar' ? 'المبلغ المدفوع بهذه الطريقة' : 'Amount collected by this method');
  if (live) await expect(hint).not.toContainText('200.000');
  else await expect(hint).toContainText('200.000 KWD');
  const submit = form.locator('button[type="submit"]');
  await expect(submit).toBeEnabled();
  await form.getByRole('radio', { name: /^Deema/ }).check();
  await expect.poll(() => seen.quotes.at(-1)?.payment_method).toBe('deema');
  await expect(submit).toBeDisabled();
  await expect(form.getByRole('alert').filter({ hasText: surface === 'cart' ? (locale === 'ar' ? 'تعذّر تأكيد المبلغ لهذه الطريقة' : 'The amount could not be confirmed for this payment method') : (live ? 'Deema live payments' : 'Deema sandbox payments') })).toBeVisible();
  expect(seen.writes).toEqual([]);
  await form.getByRole('radio', { name: /^Tap/ }).check();
  await expect(submit).toBeEnabled();
  expect(seen.writes).toEqual([]);
  return form;
}

for (const theme of THEMES) for (const locale of ['ar', 'en'] as const) {
  test(`${theme}: Deema limits explain and block invalid checkout in ${locale}`, async ({ page }) => { await check(page, locale, theme, 'cart'); });
}
for (const locale of ['ar', 'en'] as const) for (const surface of ['product', 'funnel'] as const) {
  test(`${surface}: shared Deema limit hint and quote rejection in ${locale}`, async ({ page }, info) => {
    const form = await check(page, locale, 'naseem', surface);
    const violations = (await new AxeBuilder({ page }).include(surface === 'product' ? '.sf-product-checkout' : '.sf-funnel-checkout').withTags(['wcag2a', 'wcag2aa']).analyze()).violations;
    expect(violations.filter(v => ['serious', 'critical'].includes(v.impact || ''))).toEqual([]);
    await form.screenshot({ path: info.outputPath(`${surface}-${locale}.png`) });
  });
}
for (const locale of ['ar', 'en'] as const) {
  test(`live Deema has a minimum without a sandbox maximum in ${locale}`, async ({ page }) => { await check(page, locale, 'naseem', 'cart', true); });
}
