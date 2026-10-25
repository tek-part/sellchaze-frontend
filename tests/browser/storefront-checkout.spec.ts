import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// The Shopify-style checkout renders in a distraction-free shell for every theme: no theme header,
// a two-column form + order summary on desktop and a collapsible summary on phones. The API is
// fully mocked (synthetic store, products and quote) — no real data, no orders are placed.
const THEMES = ['naseem', 'bazaar', 'sahra', 'fresh', 'techno', 'maison', 'glow', 'karat', 'stride', 'sphinx-v3', 'elite-wallets', 'hype-fashion', 'hype-perfumes', 'nature-pets', 'blast-pets', 'elite-furniture', 'nature-kids', 'pure-furniture'];
const STORE_ID = 7654321;
const field = (key: string, en: string, ar: string, required = true) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required, position: 0 });
const lines = [
  { id: 'line-1', productId: '700', title: 'Synthetic linen shirt', url: '/products/synthetic-shirt', price: 450, currency: 'USD', quantity: 2, attributes: 'M · Sand' },
  { id: 'line-2', productId: '701', title: 'Synthetic canvas tote', url: '/products/synthetic-tote', price: 180, currency: 'USD', quantity: 1 },
];

async function mockStore(page: Page, locale: 'en' | 'ar', theme: string): Promise<{ quotes: number }> {
  const seen = { quotes: 0 };
  await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [`sf-cart-v2:${STORE_ID}:USD`, JSON.stringify({ version: 2, storeId: String(STORE_ID), currency: 'USD', lines })]);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false, merchant_information: { email: '', phone: '', address: '', policies: [{ kind: 'returns', title: locale === 'ar' ? 'سياسة الإرجاع' : 'Return policy', content_html: '', url: '/policies/returns' }] } }, theme: { key: theme, version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path.endsWith('/payment-methods')) return route.fulfill({ json: { data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: false, description: 'Pay in cash when the courier arrives.' }, { slug: 'bank_transfer', name: 'Bank transfer', test_mode: false }] } });
    if (path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان'), field('notes', 'Order notes', 'ملاحظات الطلب', false)], requires_shipping: true, has_digital: false,
      shipping: { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '0', free_over: '1500', regions: [], options: [
        { id: 'standard', name: { en: 'Standard delivery', ar: 'توصيل عادي' }, description: { en: '3–5 business days', ar: 'من 3 إلى 5 أيام عمل' }, rate: '50', icon_url: null, enabled: true, priority: 2, is_default: false },
        { id: 'express', name: { en: 'Express', ar: 'توصيل سريع' }, description: { en: 'Next business day', ar: 'خلال يوم عمل' }, rate: '90', icon_url: null, enabled: true, priority: 1, is_default: false },
      ] } } });
    if (path.endsWith('/checkout/quote')) {
      seen.quotes++;
      return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: true, items: [
        { product_id: 700, variant_id: null, name: 'Synthetic linen shirt', quantity: 2, line_total: '900.00' },
        { product_id: 701, variant_id: null, name: 'Synthetic canvas tote', quantity: 1, line_total: '180.00' },
      ], totals: { subtotal: '1080.00', discount_total: '0.00', shipping_total: '50.00', tax_total: '0.00', grand_total: '1130.00' } } } });
    }
    if (request.method() !== 'GET') return route.abort();
    return route.fulfill({ json: { data: [] } });
  });
  return seen;
}

async function fillContact(page: Page, locale: 'en' | 'ar'): Promise<void> {
  await page.getByLabel(locale === 'ar' ? 'الاسم الكامل *' : 'Full name *').fill('Synthetic Buyer');
  await page.getByLabel(locale === 'ar' ? 'رقم الهاتف *' : 'Phone *').fill('+201000000000');
  await page.getByLabel(locale === 'ar' ? 'المدينة *' : 'City *').fill('Cairo');
  await page.getByLabel(locale === 'ar' ? 'العنوان *' : 'Address *').fill('1 Synthetic Street');
  await page.getByRole('radio', { name: locale === 'ar' ? /توصيل عادي/ : /Standard delivery/ }).check();
}

for (const theme of THEMES) {
  test(`${theme}: distraction-free two-column checkout in ar`, async ({ page }) => {
    const seen = await mockStore(page, 'ar', theme);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`/checkout?preview=1&theme=${theme}&lang=ar`, { waitUntil: 'networkidle' });

    await expect(page.locator('.sf-co-header')).toBeVisible();
    await expect(page.locator('.sf-co-brand')).toHaveText('Synthetic Atelier');
    await expect(page.locator('header:not(.sf-co-header) nav')).toHaveCount(0);
    await expect(page.locator('.sf-co__summary .sf-co-line')).toHaveCount(2);
    await expect(page.locator('.sf-co__summary .sf-co-thumb__qty').first()).toHaveText('2');

    await fillContact(page, 'ar');
    await page.getByRole('radio', { name: /الدفع عند الاستلام/ }).check();
    await expect(page.locator('.sf-co-choice.is-selected')).toHaveCount(2);
    await expect(page.locator('.sf-co-choice__detail')).toContainText('courier');
    await expect.poll(() => seen.quotes).toBeGreaterThan(0);
    await expect(page.locator('.sf-co__summary .sf-co-total')).toContainText('1,130');
    await expect(page.locator('.sf-co-pay')).toBeEnabled();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.sf-co-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}

test('phones get the collapsible order summary and a single column (en)', async ({ page }) => {
  await mockStore(page, 'en', 'naseem');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/checkout?preview=1&theme=naseem&lang=en', { waitUntil: 'networkidle' });
  await expect(page.locator('.sf-co__summary')).toBeHidden();
  const toggle = page.getByRole('button', { name: /Show order summary/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(page.locator('#sf-co-mobile-summary .sf-co-line')).toHaveCount(2);
  await fillContact(page, 'en');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('cart page lists lines with steppers and links to checkout', async ({ page }) => {
  await mockStore(page, 'en', 'glow');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/cart?preview=1&theme=glow&lang=en', { waitUntil: 'networkidle' });
  await expect(page.locator('.sf-cart2-line')).toHaveCount(2);
  await page.getByRole('button', { name: 'Increase quantity' }).last().click();
  await expect(page.locator('.sf-cart2-line').last().locator('output')).toHaveText('2');
  await expect(page.locator('.sf-cart2-summary a[href="/checkout"]')).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('.sf-cart2').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => v.id)).toEqual([]);
});
