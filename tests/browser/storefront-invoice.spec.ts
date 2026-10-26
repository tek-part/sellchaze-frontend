import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// A draft-order invoice opened from the link the merchant shared. Synthetic store and invoice;
// the API is fully mocked, so no order is placed and no payment is taken.
const STORE_ID = 7654321;
const TOKEN = '0123456789abcdef0123456789abcdef0123456789abcdef';
const RECEIPT = `MTIzOjQ1Njo3ODk.${'a'.repeat(64)}`;
const field = (key: string, en: string, ar: string, required = true) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required, position: 0 });

const invoice = {
  number: 'D-1055', status: 'invoice_sent', currency: 'USD', expires_at: '2026-11-25T10:00:00Z', store: { name: 'Synthetic Atelier' },
  customer: { name: 'Laila Hassan', email: 'laila@example.test', phone: '+201001112233' },
  shipping_address: { line1: '12 Nile St', city: 'Cairo' },
  line_items: [
    { title: 'Synthetic linen shirt', variant_name: null, sku: 'LS-1', quantity: 2, unit_price: '100.00', line_total: '200.00', image_url: null },
    { title: 'Gift wrapping', variant_name: null, sku: null, quantity: 1, unit_price: '5.00', line_total: '5.00', image_url: null },
  ],
  totals: { subtotal: '205.00', discount_total: '10.00', discounts: [{ title: 'Loyal customer', code: null, amount: '10.00' }], shipping_total: '15.00', shipping_title: 'Courier', tax_total: '0.00', tax_included: false, grand_total: '210.00' },
  requires_shipping: true, has_digital: false,
  fields: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('email', 'Email', 'البريد الإلكتروني', false), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان'), field('notes', 'Order notes', 'ملاحظات الطلب', false)],
  payment_methods: [{ slug: 'cod', name: 'Cash on delivery', test_mode: false, grand_total: '210.00', description: 'Pay in cash when the courier arrives.' }, { slug: 'bank_transfer', name: 'Bank transfer', test_mode: false, grand_total: '210.00' }],
};

async function mockStore(page: Page, locale: 'en' | 'ar', status = 200): Promise<{ posts: Array<{ path: string; body: unknown }> }> {
  const posts: Array<{ path: string; body: unknown }> = [];
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path === `/api/v1/storefront/invoices/${TOKEN}` && request.method() === 'GET') return status === 200 ? route.fulfill({ json: { data: invoice } }) : route.fulfill({ status, json: { message: 'Not Found' } });
    if (request.method() === 'POST') {
      posts.push({ path, body: request.postDataJSON() });
      if (path === `/api/v1/storefront/invoices/${TOKEN}/checkout`) return route.fulfill({ status: 201, json: { data: { id: 901, number: 'ORD-20261026-SYNTH1', total: '210.00', currency: 'USD' }, receipt: { token: RECEIPT, expires_in: 2592000 }, payment: { redirect_url: null }, created: true } });
      if (path === '/api/v1/storefront/checkout/receipt') return route.fulfill({ json: { data: { id: 901, number: 'ORD-20261026-SYNTH1', total: '210.00', currency: 'USD', status: 'pending', payment_status: 'pending', payment_method: 'cod', items: [{ id: 1, name: 'Synthetic linen shirt', quantity: 2 }] }, bank_transfer: null, payment_method: { name: 'Cash on delivery' } } });
      return route.abort();
    }
    return route.fulfill({ json: { data: [] } });
  });
  return { posts };
}

const words = {
  ar: { title: 'فاتورة D-1055', address: 'العنوان *', cod: /الدفع عند الاستلام/, confirm: /تأكيد الطلب/, thanks: 'شكرًا لك!', unavailable: 'الفاتورة غير متاحة' },
  en: { title: 'Invoice D-1055', address: 'Address *', cod: /Cash on delivery/, confirm: /Confirm order/, thanks: 'Thank you!', unavailable: 'Invoice unavailable' },
};

async function seriousViolations(page: Page): Promise<string[]> {
  const axe = await new AxeBuilder({ page }).include('.sf-co-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
  return axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

for (const locale of ['ar', 'en'] as const) {
  const w = words[locale];

  test(`invoice shows items and totals, then confirms cash on delivery in ${locale}`, async ({ page }) => {
    const api = await mockStore(page, locale);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`/invoices/${TOKEN}?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await expect(page.locator('.sf-co-header')).toBeVisible();
    await expect(page.locator('.sf-co-bag')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: w.title })).toBeVisible();
    await expect(page.locator('.sf-co__summary .sf-co-line')).toHaveCount(2);
    await expect(page.locator('.sf-co__summary .sf-co-total')).toContainText('210.00');
    await expect(page.getByLabel(w.address)).toHaveValue('12 Nile St');
    expect(await seriousViolations(page)).toEqual([]);

    await page.getByLabel(w.address).fill('99 Corniche');
    await page.getByRole('radio', { name: w.cod }).check();
    await page.getByRole('button', { name: w.confirm }).click();
    await expect(page.getByRole('heading', { name: w.thanks })).toBeVisible();
    await expect(page.getByText('ORD-20261026-SYNTH1').first()).toBeVisible();
    expect(api.posts[0]).toEqual({ path: `/api/v1/storefront/invoices/${TOKEN}/checkout`, body: {
      customer_name: 'Laila Hassan', customer_email: 'laila@example.test', customer_phone: '+201001112233',
      shipping_address: { line1: '99 Corniche', city: 'Cairo', name: 'Laila Hassan' }, payment_method: 'cod',
    } });
    expect(api.posts.filter((post) => post.path.endsWith('/checkout')).length).toBe(1);
  });

  test(`invoice fits a 390px phone with the summary open in ${locale}`, async ({ page }) => {
    await mockStore(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/invoices/${TOKEN}?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await expect(page.locator('.sf-co-mobile-summary .sf-co-line')).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await seriousViolations(page)).toEqual([]);
    await page.screenshot({ path: `test-results/storefront-invoice-${locale}-390.png`, fullPage: true });
  });

  test(`an expired or unknown invoice explains what to do in ${locale}`, async ({ page }) => {
    const api = await mockStore(page, locale, 404);
    await page.goto(`/invoices/${TOKEN}?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1, name: w.unavailable })).toBeVisible();
    await expect(page.getByRole('button', { name: w.confirm })).toHaveCount(0);
    expect(api.posts).toEqual([]);
  });
}
