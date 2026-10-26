import { expect, test, type Page } from 'playwright/test';

// Placing an order sends the total the shopper saw. When the server prices the order differently
// (e.g. a guest's per-customer discount is used up) it answers 409 total_changed with a new quote and
// places nothing; the checkout shows the new totals and the next click confirms them. The API is fully
// mocked (synthetic store, products and quotes) — no real data, no orders are placed.
const STORE_ID = 7654322;
const field = (key: string, en: string, ar: string, required = true) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required, position: 0 });
const lines = [{ id: 'line-1', productId: '700', title: 'Synthetic linen shirt', url: '/products/synthetic-shirt', price: 450, currency: 'USD', quantity: 2 }];
const quote = (discount: string, grand: string) => ({ currency: 'USD', requires_shipping: true,
  items: [{ product_id: 700, variant_id: null, name: 'Synthetic linen shirt', quantity: 2, line_total: '900.00' }],
  discounts: discount === '0.00' ? [] : [{ id: 1, title: 'Welcome offer', code: null, method: 'automatic', type: 'percentage', amount: discount }],
  totals: { subtotal: '900.00', discount_total: discount, shipping_total: '50.00', tax_total: '0.00', grand_total: grand } });

interface Seen { quotes: Array<Record<string, unknown>>; orders: Array<Record<string, unknown>> }

async function mockStore(page: Page, locale: 'en' | 'ar'): Promise<Seen> {
  const seen: Seen = { quotes: [], orders: [] };
  await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [`sf-cart-v2:${STORE_ID}:USD`, JSON.stringify({ version: 2, storeId: String(STORE_ID), currency: 'USD', lines })]);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false, merchant_information: { email: '', phone: '', address: '', policies: [] } }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path.endsWith('/payment-methods')) return route.fulfill({ json: { data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: false }] } });
    if (path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف', false), field('address', 'Address', 'العنوان')], requires_shipping: true, has_digital: false,
      shipping: { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '50', free_over: null, regions: [], options: [] } } });
    if (path.endsWith('/checkout/quote')) {
      seen.quotes.push(request.postDataJSON() as Record<string, unknown>);
      // The quote cannot know a guest without contact, so it still shows the limited discount.
      return route.fulfill({ json: { data: quote('90.00', '860.00') } });
    }
    if (path.endsWith('/storefront/checkout') && request.method() === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      seen.orders.push(body);
      if (body.expected_total !== '950.00') {
        return route.fulfill({ status: 409, json: { message: 'Your total was updated. Please review it and confirm your order.', code: 'total_changed', quote: quote('0.00', '950.00'), checkout_rejected: true } });
      }
      return route.fulfill({ status: 201, json: { data: { id: 1, number: 'SYN-1001', total: '950.00', currency: 'USD' }, receipt: { token: 'synthetic-receipt' }, payment: { status: 'pending', redirect_url: null } } });
    }
    if (request.method() !== 'GET') return route.fulfill({ json: { data: {} } });
    return route.fulfill({ json: { data: [] } });
  });
  return seen;
}

for (const locale of ['en', 'ar'] as const) {
  test(`a changed total is shown and confirmed on the next click (${locale})`, async ({ page }) => {
    const ar = locale === 'ar';
    const seen = await mockStore(page, locale);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });

    await page.getByLabel(ar ? 'الاسم الكامل *' : 'Full name *').fill('Synthetic Buyer');
    await page.getByLabel(ar ? 'العنوان *' : 'Address *').fill('1 Synthetic Street');
    const total = page.locator('.sf-co__summary .sf-co-total');
    await expect(total).toContainText('860');

    const pay = page.locator('.sf-co-pay');
    await expect(pay).toBeEnabled();
    await pay.click();
    await expect(page.getByRole('alert')).toContainText(ar ? 'تم تحديث الإجمالي' : 'Your total was updated');
    await expect(total).toContainText('950');
    expect(seen.orders[0]?.expected_total).toBe('860.00');
    // Nothing the shopper typed is lost.
    await expect(page.getByLabel(ar ? 'الاسم الكامل *' : 'Full name *')).toHaveValue('Synthetic Buyer');
    await expect(page.getByLabel(ar ? 'العنوان *' : 'Address *')).toHaveValue('1 Synthetic Street');

    await expect(pay).toBeEnabled();
    await pay.click();
    await expect(page).toHaveURL(/\/order\/success\?number=SYN-1001/);
    expect(seen.orders).toHaveLength(2);
    expect(seen.orders[1]?.expected_total).toBe('950.00');
  });
}

test('the quote is re-requested with the guest contact once typed', async ({ page }) => {
  const seen = await mockStore(page, 'en');
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/checkout?preview=1&theme=naseem&lang=en', { waitUntil: 'networkidle' });
  await page.getByLabel('Full name *').fill('Synthetic Buyer');
  await page.getByLabel('Address *').fill('1 Synthetic Street');
  await expect.poll(() => seen.quotes.length).toBeGreaterThan(0);
  expect(seen.quotes.at(-1)?.customer_phone).toBeUndefined();

  await page.getByLabel('Phone').fill('+201000000000');
  await expect.poll(() => seen.quotes.at(-1)?.customer_phone).toBe('+201000000000');
});
