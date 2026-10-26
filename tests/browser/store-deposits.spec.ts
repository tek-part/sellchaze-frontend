import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// G1 (TAR-036 #1, #2, #11, #13): deposits, the printable invoice, payment method changes and transfer
// targets. Every API call is intercepted with synthetic data: nothing is created, charged or sent.
type Locale = 'ar' | 'en';
type Write = { method: string; path: string; body: unknown };
const t = (locale: Locale, ar: string, en: string): string => (locale === 'ar' ? ar : en);

const depositOrder = {
  id: 42, order_number: 'SYN-DEP-42', status: 'shipped', currency: 'EGP', payment_method: 'paymob', payment_status: 'deposit_paid', grand_total: '120.00', subtotal: '100.00',
  shipping_total: '20.00', discount_total: '0.00', tax_total: '0.00', refunded_total: '0.00', gift_card_total: '0.00', amount_due: '96.00', payment_adjustment_total: '0.00',
  manual_adjustment_total: '0.00', next_statuses: ['delivered'], fulfillment: { requires_shipping: true, physical_quantity: 1, digital_quantity: 0 }, fulfillment_status: 'fulfilled',
  deposit: { amount: '24.00', remaining: '96.00', percentage: '20.00', minimum: '0.00', confirm_after_payment: true, remainder_method: 'cod', paid: true, paid_at: '2026-10-20T10:00:00Z', remainder_collected: false, remainder_collected_at: null },
  customer: { name: 'Synthetic buyer', phone: '+201000000000', email: 'buyer@example.test' },
  shipping_address: { line1: '12 Synthetic Street', line2: 'Floor 3', city: 'Nasr City', region: 'Cairo', country: 'EG', phone_alt: '+201200000000' },
  items: [{ id: 501, name: 'Synthetic custom ring', variant_name: 'Gold', unit_price: '100.00', quantity: 1, line_total: '100.00', fulfilled_quantity: 1, unfulfilled_quantity: 0 }],
  timeline: [{ from_status: 'pending', to_status: 'pending', notes: 'Deposit paid: EGP 24.00', source: 'deposit_payment', actor: null, created_at: '2026-10-20T10:00:00Z' }],
  review: { classification: null, version: 0 }, placed_at: '2026-10-18T10:00:00Z', created_at: '2026-10-18T10:00:00Z', updated_at: '2026-10-20T10:00:00Z',
};
const failedOrder = { ...depositOrder, id: 43, order_number: 'SYN-FAIL-43', status: 'pending', payment_method: 'stripe', payment_status: 'failed', grand_total: '132.00', amount_due: '132.00',
  payment_adjustment_total: '12.00', deposit: null, next_statuses: ['confirmed', 'cancelled'], fulfillment_status: 'unfulfilled', timeline: [] };

async function dashboard(page: Page, locale: Locale) {
  const writes: Write[] = [];
  let deposit = { enabled: false, percentage: '0.00', minimum: '0.00', scope: 'all', confirm_after_payment: false, version: 1 };
  await page.addInitScript((value) => { localStorage.setItem('sellchase_access_token', 'isolated-deposit-fixture'); localStorage.setItem('sellchase_locale', value); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.method() !== 'GET') {
      const body = req.postDataJSON(); writes.push({ method: req.method(), path, body });
      if (path === '/my-store/orders/42/payment/collect-remainder') return route.fulfill({ json: { data: { ...depositOrder, payment_status: 'paid', deposit: { ...depositOrder.deposit, remainder_collected: true } } }, headers });
      if (path === '/my-store/orders/43/payment/method') return route.fulfill({ json: { data: { ...failedOrder, payment_method: 'cod', payment_status: 'pending', grand_total: '125.00' } }, headers });
      if (path === '/my-store/payments/deposit') { deposit = { ...(body as typeof deposit), version: deposit.version + 1 }; return route.fulfill({ json: { data: deposit }, headers }); }
      if (path === '/my-store/payments') return route.fulfill({ json: { data: gateways() }, headers });
      return route.fulfill({ status: 405, json: { message: 'Unexpected write' }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Isolated deposit fixture', roles: ['Merchant'], permissions: ['store.orders.manage', 'store.settings.manage'], is_active: true } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local deposit fixture', slug: 'fixture', status: 'active', currency: 'EGP' } }, headers });
    if (path === '/my-store/orders/42/detail') return route.fulfill({ json: { data: depositOrder }, headers });
    if (path === '/my-store/orders/43/detail') return route.fulfill({ json: { data: failedOrder }, headers });
    if (path === '/my-store/orders/43/payment/methods') return route.fulfill({ json: { data: { current: 'stripe', payment_status: 'failed', grand_total: '132.00', blocker: null, methods: [
      { slug: 'cod', name: 'Cash on delivery', grand_total: '125.00', shipping_total: '20.00', tax_total: '0.00', cod_fee: '0.00', payment_adjustment_total: '5.00', amount_due: '125.00', deposit: null, deposit_removed: false },
      { slug: 'bank_transfer', name: 'Bank transfer', grand_total: '120.00', shipping_total: '20.00', tax_total: '0.00', cod_fee: '0.00', payment_adjustment_total: '0.00', amount_due: '120.00', deposit: null, deposit_removed: false },
    ] } }, headers });
    if (path === '/my-store/orders/print-data') return route.fulfill({ json: { store: { name: 'Local deposit fixture', logo_url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22/%3E', phone: '+201000000009', email: 'shop@example.test', website: 'https://fixture.sellchase.com/' }, data: [depositOrder] }, headers });
    if (path === '/my-store/payments/deposit') return route.fulfill({ json: { data: deposit }, headers });
    if (path === '/my-store/payments') return route.fulfill({ json: { data: gateways() }, headers });
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { writes };
}

function gateways() {
  return [{ name: 'Transfer with receipt', slug: 'transfer_receipt', provider_name: 'Transfer with receipt', credential_fields: ['account_name', 'bank_name', 'iban', 'swift_code'], visible_fields: ['account_name', 'bank_name', 'iban', 'swift_code'],
    required_fields: ['account_name', 'iban'], available: true, enabled: false, test_mode: false, credentials: {}, order: 0, notes: '', configured: false, description: '', logo_url: '/payments/transfer_receipt.png',
    logo_asset_id: null, price_adjustment: { enabled: false, type: 'fixed', direction: 'add', value: '0.00' }, transfer_targets: [] }];
}

async function healthy(page: Page, include: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

for (const locale of ['en', 'ar'] as const) {
  test(`a paid deposit shows the remainder and records it as collected (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/orders/42');
    await page.getByText(t(locale, 'الدفع والشحن والتسليم', 'Payment, shipping and delivery')).click();
    const card = page.getByRole('region', { name: t(locale, 'العربون والمبلغ المتبقي', 'Deposit and remaining amount') });
    await expect(card).toContainText('EGP 24.00');
    await expect(card).toContainText('EGP 96.00');
    await healthy(page, `section[aria-label="${t(locale, 'العربون والمبلغ المتبقي', 'Deposit and remaining amount')}"]`);
    await card.getByLabel(t(locale, 'مرجع التحصيل', 'Collection reference')).fill('CASH-42');
    await card.getByLabel(t(locale, 'المبلغ المحصّل', 'Collected amount')).fill('95');
    const review = card.getByRole('button', { name: t(locale, 'مراجعة تسجيل المتبقي', 'Review remaining amount') });
    await card.getByRole('checkbox').check();
    await expect(review).toBeDisabled();
    await card.getByLabel(t(locale, 'المبلغ المحصّل', 'Collected amount')).fill('96');
    await review.click();
    await card.getByRole('button', { name: t(locale, 'تأكيد تحصيل المتبقي', 'Confirm remaining amount collected') }).click();
    await expect.poll(() => api.writes.length).toBe(1);
    expect(api.writes[0]).toEqual({ method: 'POST', path: '/my-store/orders/42/payment/collect-remainder', body: { reference: 'CASH-42', amount: '96.00', currency: 'EGP', collected: true, note: null } });
  });

  test(`a failed online payment moves to cash on delivery with the new total (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/orders/43');
    await page.getByText(t(locale, 'الدفع والشحن والتسليم', 'Payment, shipping and delivery')).click();
    const card = page.getByRole('region', { name: t(locale, 'تغيير طريقة الدفع', 'Change payment method') });
    await card.getByRole('button', { name: t(locale, 'عرض الطرق المتاحة', 'Show available methods') }).click();
    await card.getByRole('radio', { name: new RegExp(t(locale, 'الدفع عند الاستلام', 'Cash on delivery')) }).check();
    await expect(card).toContainText('EGP 125.00');
    await healthy(page, `section[aria-label="${t(locale, 'تغيير طريقة الدفع', 'Change payment method')}"]`);
    await card.getByRole('button', { name: t(locale, 'تغيير طريقة الدفع', 'Change payment method') }).click();
    await expect.poll(() => api.writes.length).toBe(1);
    expect(api.writes[0]).toEqual({ method: 'POST', path: '/my-store/orders/43/payment/method', body: { payment_method: 'cod', expected_grand_total: '125.00', note: null } });
  });

  test(`the printable invoice shows the store, delivery details and the payment split (${locale})`, async ({ page }) => {
    await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/orders/print?ids=42');
    const invoice = page.locator('.ws-invoice');
    await expect(invoice.getByRole('img', { name: 'Local deposit fixture' })).toBeVisible();
    await expect(invoice).toContainText('Cairo');
    await expect(invoice).toContainText('Nasr City');
    await expect(invoice).toContainText('+201000000000');
    await expect(invoice).toContainText('+201200000000');
    await expect(invoice.locator('.ws-invoice-payment')).toContainText(t(locale, 'مدفوع EGP 24.00 · المتبقي عند الاستلام EGP 96.00', 'Paid EGP 24.00 · Remaining on delivery EGP 96.00'));
    await expect(invoice.getByRole('link', { name: 'fixture.sellchase.com' })).toHaveAttribute('href', 'https://fixture.sellchase.com/');
    await expect(invoice).toContainText('+201000000009');
    await expect(invoice).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await healthy(page, '.ws-invoices');
    await page.getByRole('radio', { name: t(locale, 'طابعة حرارية 80 مم', 'Thermal 80 mm') }).click();
    await expect(page).toHaveURL(/format=thermal/);
    await expect(page.getByRole('radio', { name: t(locale, 'طابعة حرارية 80 مم', 'Thermal 80 mm') })).toBeChecked();
    expect((await invoice.boundingBox())?.width ?? 999).toBeLessThanOrEqual(305);
  });

  test(`deposit settings and transfer targets are saved from the payments page (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/settings/payments');
    const section = page.getByRole('region', { name: t(locale, 'العربون', 'Deposit') });
    await section.getByRole('switch', { name: t(locale, 'طلب عربون', 'Require a deposit') }).click();
    await section.getByLabel(t(locale, 'نسبة العربون من الطلب (%)', 'Deposit percentage of the order (%)')).fill('20');
    await section.getByRole('radio', { name: new RegExp(t(locale, 'منتجًا مُعلّمًا', 'marked')) }).check();
    await healthy(page, '.ws-payments');
    await section.getByRole('button', { name: t(locale, 'حفظ إعدادات العربون', 'Save deposit settings') }).click();
    await expect.poll(() => api.writes.length).toBe(1);
    expect(api.writes[0]).toEqual({ method: 'PUT', path: '/my-store/payments/deposit', body: { enabled: true, percentage: '20.00', minimum: '0.00', scope: 'flagged', confirm_after_payment: false, version: 1 } });

    await page.getByRole('button', { name: t(locale, 'تعديل', 'Edit') }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: t(locale, 'إضافة وجهة تحويل', 'Add a transfer target') }).click();
    await dialog.getByLabel(t(locale, 'الاسم', 'Label'), { exact: true }).fill('InstaPay');
    await dialog.getByLabel(t(locale, 'الرقم أو العنوان', 'Number or address')).fill('shop@instapay');
    await dialog.getByLabel(t(locale, 'رابط (اختياري)', 'Link (optional)')).fill('javascript:alert(1)');
    await dialog.getByRole('button', { name: t(locale, 'حفظ التغييرات', 'Save changes') }).click();
    await expect(dialog.getByRole('alert')).toContainText(t(locale, 'https://', 'https://'));
    expect(api.writes).toHaveLength(1);
    await dialog.getByLabel(t(locale, 'رابط (اختياري)', 'Link (optional)')).fill('https://ipn.eg/S/shop/instapay/abc');
    await healthy(page, '[role="dialog"]');
    await dialog.getByRole('button', { name: t(locale, 'حفظ التغييرات', 'Save changes') }).click();
    await expect.poll(() => api.writes.length).toBe(2);
    expect((api.writes[1].body as { gateways: Array<{ presentation: { transfer_targets: unknown } }> }).gateways[0].presentation.transfer_targets)
      .toEqual([{ label: 'InstaPay', number: 'shop@instapay', link: 'https://ipn.eg/S/shop/instapay/abc' }]);
  });
}

/* ---- storefront checkout with a deposit ---- */
const STORE_ID = 7654322;
const field = (key: string, en: string, ar: string) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required: true, position: 0 });
const cartLines = [{ id: 'line-1', productId: '700', title: 'Synthetic custom ring', url: '/products/ring', price: 100, currency: 'USD', quantity: 1 }];

async function storefront(page: Page, locale: Locale) {
  const seen = { orders: [] as Array<Record<string, unknown>> };
  await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [`sf-cart-v2:${STORE_ID}:USD`, JSON.stringify({ version: 2, storeId: String(STORE_ID), currency: 'USD', lines: cartLines })]);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false, merchant_information: { email: '', phone: '', address: '', policies: [] } }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path.endsWith('/payment-methods')) return route.fulfill({ json: { deposit: { percentage: '20.00', minimum: '0.00', confirm_after_payment: true, remainder_method: 'cod' }, data: [
      { slug: 'transfer_receipt', name: 'Transfer with receipt', test_mode: false, deposit_capable: true, description: 'Details: https://example.test/how-to-pay', transfer_targets: [{ label: 'InstaPay', number: 'shop@instapay', link: 'https://ipn.eg/S/shop' }, { label: 'Vodafone Cash', number: '01000000001', link: null }] },
    ] } });
    if (path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان')], requires_shipping: true, has_digital: false,
      shipping: { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '20', free_over: null, regions: [], options: [] } } });
    if (path.endsWith('/checkout/quote')) return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: true, discounts: [], gift_cards: [], amount_due: '24.00', payment_adjustment_token: null,
      deposit: { amount: '24.00', remaining: '96.00', percentage: '20.00', minimum: '0.00', confirm_after_payment: true, remainder_method: 'cod' },
      items: [{ product_id: 700, variant_id: null, name: 'Synthetic custom ring', quantity: 1, unit_price: '100.00', line_total: '100.00' }],
      totals: { subtotal: '100.00', discount_total: '0.00', shipping_total: '20.00', tax_total: '0.00', grand_total: '120.00', gift_card_total: '0.00' } } } });
    if (path.endsWith('/checkout') && request.method() === 'POST') {
      seen.orders.push(request.postDataJSON() as Record<string, unknown>);
      return route.fulfill({ status: 201, json: { data: { number: 'SYNTHETIC-DEP', tracking: null }, payment: { transaction_id: 1, status: 'pending', redirect_url: null } } });
    }
    if (request.method() !== 'GET') return route.fulfill({ json: { data: null } });
    return route.fulfill({ json: { data: [] } });
  });
  return seen;
}

for (const locale of ['en', 'ar'] as const) {
  test(`checkout asks for the deposit now and the rest on delivery (${locale})`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const seen = await storefront(page, locale);
    const ar = locale === 'ar';
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await page.getByLabel(ar ? 'الاسم الكامل *' : 'Full name *').fill('Synthetic Buyer');
    await page.getByLabel(ar ? 'رقم الهاتف *' : 'Phone *').fill('+201000000000');
    await page.getByLabel(ar ? 'المدينة *' : 'City *').fill('Cairo');
    await page.getByLabel(ar ? 'العنوان *' : 'Address *').fill('1 Synthetic Street');
    await expect(page.getByRole('radio', { name: ar ? /الدفع عند الاستلام/ : /Cash on delivery/ })).toHaveCount(0);
    await expect(page.locator('[data-deposit-note]')).toContainText(ar ? 'عند الاستلام' : 'on delivery');
    const form = page.locator('.sf-co-form');
    await expect(form.getByRole('link', { name: ar ? 'الدفع عبر InstaPay' : 'Pay with InstaPay' })).toHaveAttribute('href', 'https://ipn.eg/S/shop');
    await expect(form.getByRole('link', { name: 'https://example.test/how-to-pay' })).toHaveAttribute('rel', /noopener/);
    await form.getByRole('button', { name: ar ? 'نسخ InstaPay' : 'Copy InstaPay' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('shop@instapay');
    await page.locator('.sf-co-mobile-summary__toggle').click();
    await expect(page.locator('#sf-co-mobile-summary [data-deposit-now]')).toContainText('24');
    await expect(page.locator('#sf-co-mobile-summary [data-deposit-remaining]')).toContainText('96');
    await healthy(page, '.sf-co');
    await page.locator('.sf-co-pay').click();
    await expect.poll(() => seen.orders.length).toBe(1);
    expect(seen.orders[0]).toMatchObject({ payment_method: 'transfer_receipt', expected_total: '120.00', expected_deposit: '24.00' });
  });
}
