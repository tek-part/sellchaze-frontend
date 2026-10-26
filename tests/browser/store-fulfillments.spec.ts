import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Merchant fulfillments and storefront shipments with a fully intercepted API: a synthetic store,
// order and customer, no carrier and no real merchant data. Writes are recorded and asserted.
type Write = { method: string; path: string; body: unknown };

const ARAMEX = 'https://www.aramex.com/track/results?ShipmentNumber=AR-5531';
const carriers = [
  { key: 'bosta', name: 'Bosta', tracking_url_template: true }, { key: 'aramex', name: 'Aramex', tracking_url_template: true },
  { key: 'smsa', name: 'SMSA Express', tracking_url_template: true }, { key: 'other', name: 'Other', tracking_url_template: false },
];
const summaryLine = (id: number, name: string, quantity: number, fulfilled: number) => ({
  store_order_item_id: id, name, variant_name: null, sku: null, quantity, fulfilled_quantity: fulfilled, unfulfilled_quantity: quantity - fulfilled,
});
const unfulfilled = () => ({
  order_id: 43, order_status: 'processing', fulfillment_status: 'unfulfilled', requires_shipping: true, can_fulfill: true, unfulfilled_quantity: 3,
  items: [summaryLine(501, 'Synthetic linen shirt', 2, 0), summaryLine(502, 'Synthetic canvas cap', 1, 0)], fulfillments: [] as unknown[], carriers,
});
const partial = () => ({
  ...unfulfilled(), order_status: 'shipped', fulfillment_status: 'partial', unfulfilled_quantity: 2,
  items: [summaryLine(501, 'Synthetic linen shirt', 2, 1), summaryLine(502, 'Synthetic canvas cap', 1, 0)],
  fulfillments: [{ id: 9, status: 'in_transit', carrier: 'aramex', carrier_name: 'Aramex', custom_carrier_name: null, tracking_number: 'AR-5531', tracking_url: ARAMEX,
    custom_tracking_url: null, items: [{ store_order_item_id: 501, name: 'Synthetic linen shirt', variant_name: null, quantity: 1 }], shipped_at: '2026-10-22T10:00:00Z',
    delivered_at: null, cancelled_at: null, notify_customer: true, note: null, source: 'manual', actor: 'Owner', version: 1 }],
});
const order = (shipped: boolean) => ({
  id: 43, order_number: 'SYN-1043', status: shipped ? 'shipped' : 'processing', fulfillment_status: shipped ? 'partial' : 'unfulfilled', currency: 'EGP',
  payment_method: 'cod', payment_status: 'pending', grand_total: '250.00', subtotal: '200.00', shipping_total: '50.00', discount_total: '0.00', tax_total: '0.00', refunded_total: '0.00',
  next_statuses: shipped ? ['delivered', 'returning_from_delivery', 'refunded'] : ['waiting_for_pickup', 'shipped', 'cancelled'], fulfillment: { requires_shipping: true },
  customer: { name: 'Synthetic buyer', phone: '+201000000000', email: 'buyer@example.test' }, shipping_address: { city: 'Cairo', line1: '1 Synthetic Street' },
  items: [{ id: 501, name: 'Synthetic linen shirt', unit_price: '50.00', quantity: 2, line_total: '100.00' }, { id: 502, name: 'Synthetic canvas cap', unit_price: '100.00', quantity: 1, line_total: '100.00' }],
  timeline: [], review: { classification: null, version: 0 }, placed_at: '2026-10-18T10:00:00Z', created_at: '2026-10-18T10:00:00Z', updated_at: shipped ? '2026-10-22T10:00:00Z' : '2026-10-18T10:00:00Z',
});

const refundLine = (id: number, name: string, quantity: number, allocated: string, shipped: number, unshipped: number) => ({
  store_order_item_id: id, name, variant_name: null, sku: null, unit_price: (Number(allocated) / quantity).toFixed(2), line_total: allocated, quantity, refunded_quantity: 0,
  refundable_quantity: quantity, allocated_amount: allocated, refunded_amount: '0.00', refundable_amount: allocated, restockable: shipped > 0, digital: false,
  fulfilled_quantity: shipped, unfulfilled_quantity: unshipped, shipped_refundable_quantity: shipped, unshipped_refundable_quantity: unshipped,
});
const refundSummary = () => ({
  currency: 'EGP', order_status: 'shipped', payment_status: 'paid', payment_collected: true, refundable: true, grand_total: '250.00', refunded_total: '0.00',
  refundable_total: '250.00', fully_refunded: false, shipping: { total: '50.00', refunded: '0.00', refundable: '50.00' }, gift_card_total: '0.00',
  items: [refundLine(501, 'Synthetic linen shirt', 2, '100.00', 1, 1), refundLine(502, 'Synthetic canvas cap', 1, '100.00', 0, 1)], refunds: [] as unknown[],
});

async function dashboard(page: Page, locale: 'ar' | 'en', startShipped = false) {
  const writes: Write[] = [];
  let shipped = startShipped;
  await page.addInitScript((value) => { localStorage.setItem('sellchase_access_token', 'isolated-fulfil-review'); localStorage.setItem('sellchase_locale', value); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.method() === 'POST' && path === '/my-store/orders/43/fulfillments') {
      writes.push({ method: 'POST', path, body: req.postDataJSON() }); shipped = true;
      return route.fulfill({ status: 201, json: { data: partial() }, headers });
    }
    if (req.method() === 'POST' && path === '/my-store/orders/43/status') {
      const body = req.postDataJSON(); writes.push({ method: 'POST', path, body });
      return route.fulfill({ json: { data: { ...order(true), status: body.status, fulfillment_status: 'fulfilled', next_statuses: [] } }, headers });
    }
    if (req.method() === 'POST' && path === '/my-store/orders/43/refunds') {
      writes.push({ method: 'POST', path, body: req.postDataJSON() });
      return route.fulfill({ status: 201, json: { data: refundSummary() }, headers });
    }
    if (req.method() !== 'GET') { writes.push({ method: req.method(), path, body: null }); return route.fulfill({ status: 405, json: { message: 'Unexpected write' }, headers }); }
    if (path === '/my-store/orders/43/refunds') return route.fulfill({ json: { data: refundSummary() }, headers });
    if (path === '/my-store/orders/43/returns') return route.fulfill({ json: { data: [] }, headers });
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Isolated fulfil fixture', roles: ['Merchant'], permissions: ['store.orders.manage'], is_active: true } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local fulfil fixture', slug: 'fixture', status: 'active', currency: 'EGP' } }, headers });
    if (path === '/my-store/orders/43/detail') return route.fulfill({ json: { data: order(shipped) }, headers });
    if (path === '/my-store/orders/43/fulfillments') return route.fulfill({ json: { data: shipped ? partial() : unfulfilled() }, headers });
    if (path === '/my-store/orders') {
      return route.fulfill({ json: { data: [{ ...order(true), customer: { name: 'Synthetic buyer', phone: '+201000000000' } }], counts: { shipped: 1 }, payment_counts: { pending: 1 }, fulfillment_counts: { partial: 1 },
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1, locked_orders: 0 } }, headers });
    }
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { writes };
}

const STORE_ID = 7654322;
const NUMBER = 'ORD-SYN-0002';
async function storefront(page: Page, locale: 'en' | 'ar') {
  await page.addInitScript(() => { window.localStorage.setItem('sf:auth-token', 'synthetic-customer-token'); });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path === '/api/v1/storefront/account') return route.fulfill({ json: { data: { id: 5, name: 'Synthetic customer', email: 'customer@example.test' } } });
    if (path === `/api/v1/storefront/orders/${NUMBER}`) {
      return route.fulfill({ json: { data: {
        id: 92, number: NUMBER, order_number: NUMBER, status: 'shipped', total: '250.00', currency: 'USD', created_at: '2026-10-20T10:00:00Z', refunded_total: '0.00',
        items: [{ id: 601, name: 'Synthetic linen shirt', quantity: 2, price: '50.00' }, { id: 602, name: 'Synthetic canvas tote', quantity: 1, price: '100.00' }],
        returns: [], fulfillment_status: 'partial',
        fulfillments: [{ id: 31, status: 'in_transit', carrier: 'aramex', carrier_name: 'Aramex', tracking_number: 'AR-5531', tracking_url: ARAMEX,
          items: [{ store_order_item_id: 601, name: 'Synthetic linen shirt', variant_name: null, quantity: 2 }], shipped_at: '2026-10-21T10:00:00Z', delivered_at: null }],
      } } });
    }
    if (request.method() !== 'GET') return route.abort();
    return route.fulfill({ json: { data: [] } });
  });
}

const t = (locale: 'ar' | 'en', ar: string, en: string) => (locale === 'ar' ? ar : en);
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
async function seriousViolations(page: Page, selector: string) {
  const result = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa']).analyze();
  return result.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

for (const locale of ['ar', 'en'] as const) {
  test(`Fulfilling one of two items posts the exact body and shows the tracking link in ${locale}`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.goto('/store/orders/43');
    const card = page.locator('.ws-fulfillments');
    await expect(card.getByTestId('fulfillment-status')).toHaveText(t(locale, 'غير مشحون', 'Unfulfilled'));
    await expect(card).toContainText(t(locale, 'لم تُشحن أي منتجات بعد.', 'Nothing has shipped yet.'));
    await page.locator('.ws-order-toolbar').getByRole('button', { name: t(locale, 'شحن المنتجات', 'Fulfill items'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: t(locale, 'شحن المنتجات', 'Fulfill items') })).toBeVisible();

    const shirt = dialog.getByLabel('Synthetic linen shirt', { exact: true });
    await expect(shirt).toHaveValue('2');
    await expect(dialog.getByRole('button', { name: t(locale, 'زيادة Synthetic linen shirt', 'Increase Synthetic linen shirt'), exact: true })).toBeDisabled();
    await dialog.getByRole('button', { name: t(locale, 'إنقاص Synthetic linen shirt', 'Decrease Synthetic linen shirt'), exact: true }).click();
    await dialog.getByRole('button', { name: t(locale, 'إنقاص Synthetic canvas cap', 'Decrease Synthetic canvas cap'), exact: true }).click();
    await expect(shirt).toHaveValue('1');
    await expect(dialog.getByLabel('Synthetic canvas cap', { exact: true })).toHaveValue('0');
    await dialog.getByRole('combobox', { name: new RegExp(`^${t(locale, 'شركة الشحن', 'Carrier')}`) }).selectOption('aramex');
    await dialog.getByLabel(t(locale, 'رقم التتبع (اختياري)', 'Tracking number (optional)')).fill('AR-5531');
    const url = dialog.getByLabel(t(locale, 'رابط التتبع (اختياري)', 'Tracking URL (optional)'));
    await url.fill('javascript:alert(1)');
    const submit = dialog.getByRole('button', { name: t(locale, 'شحن 1 قطعة', 'Fulfill 1 item(s)'), exact: true });
    await expect(submit).toBeDisabled();
    await url.fill('');
    await expect(dialog.getByLabel(t(locale, 'إرسال إشعار الشحن للعميل', 'Send a shipping notification to the customer'))).toBeChecked();
    expect(await seriousViolations(page, '.ws-fulfil-panel')).toEqual([]);
    await submit.click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(api.writes).toEqual([{ method: 'POST', path: '/my-store/orders/43/fulfillments', body: {
      items: [{ store_order_item_id: 501, quantity: 1 }], carrier: 'aramex', carrier_name: null, tracking_number: 'AR-5531', tracking_url: null, notify_customer: true, note: null,
    } }]);
    await expect(card.getByTestId('fulfillment-status')).toHaveText(t(locale, 'مشحون جزئيًا', 'Partially fulfilled'));
    const shipment = card.getByTestId('fulfillment-card');
    await expect(shipment).toContainText('Aramex');
    await expect(shipment).toContainText('AR-5531');
    await expect(shipment).toContainText('Synthetic linen shirt × 1');
    const link = shipment.getByRole('link', { name: new RegExp(t(locale, 'تتبع الشحنة', 'Track shipment')) });
    await expect(link).toHaveAttribute('href', ARAMEX);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(card.locator('.ws-fulfil-waiting')).toContainText('Synthetic canvas cap × 1');
    await expect(page.getByTestId('order-fulfillment-badge')).toHaveText(t(locale, 'مشحون جزئيًا', 'Partially fulfilled'));
    expect(await seriousViolations(page, '.ws-fulfillments')).toEqual([]);
  });

  test(`Order detail with shipments and the fulfil dialog fit a 390px phone in ${locale}`, async ({ page }) => {
    await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/orders/43');
    await expect(page.locator('.ws-fulfillments [data-testid="fulfillment-status"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await noOverflow(page)).toBe(true);
    await page.locator('.ws-fulfillments').getByRole('button', { name: t(locale, 'شحن المنتجات', 'Fulfill items'), exact: true }).click();
    const panel = page.locator('.ws-fulfil-panel');
    await expect(panel).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test(`Orders list shows the fulfillment badge in ${locale}`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/orders');
    await expect(page.locator('.ws-dt-card')).toContainText('Synthetic buyer');
    await expect(page.locator('.ws-orders-fulfillment').first()).toHaveText(t(locale, 'مشحون جزئيًا', 'Partially fulfilled'));
    await page.evaluate(() => document.fonts.ready);
    expect(await noOverflow(page)).toBe(true);
    expect(api.writes).toEqual([]);
  });

  test(`Delivering a partially shipped order asks to ship the rest in ${locale}`, async ({ page }) => {
    const api = await dashboard(page, locale, true);
    await page.goto('/store/orders/43');
    await expect(page.getByTestId('order-fulfillment-badge')).toHaveText(t(locale, 'مشحون جزئيًا', 'Partially fulfilled'));
    await page.locator('.ws-order-toolbar').getByRole('button', { name: t(locale, 'تحديث الحالة', 'Update status'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: new RegExp(t(locale, 'الحالة الجديدة', 'New status')) }).selectOption('delivered');
    await expect(dialog).toContainText(t(locale, 'لم تُشحن كل منتجات هذا الطلب بعد', 'Some items on this order have not shipped yet'));
    const confirm = dialog.getByRole('button', { name: t(locale, 'تأكيد', 'Confirm'), exact: true });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel(t(locale, 'شحن المنتجات المتبقية وتحديد الطلب كمُسلَّم', 'Ship the remaining items and mark the order delivered')).check();
    expect(await seriousViolations(page, '.ws-order-leftover')).toEqual([]);
    await confirm.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(api.writes).toEqual([{ method: 'POST', path: '/my-store/orders/43/status', body: { status: 'delivered', note: null, fulfil_remaining: true } }]);
  });

  test(`Refunding a partly shipped line lets the merchant pick shipped units in ${locale}`, async ({ page }) => {
    const api = await dashboard(page, locale, true);
    await page.goto('/store/orders/43');
    await page.locator('.ws-order-toolbar').getByRole('button', { name: t(locale, 'استرداد', 'Refund'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: t(locale, 'زيادة Synthetic linen shirt', 'Increase Synthetic linen shirt'), exact: true }).click();
    const effect = dialog.getByTestId('refund-effect-501');
    await expect(effect).toContainText(t(locale, '1 تُلغى ولن تُشحن', "1 cancelled, won't ship"));
    await expect(dialog.getByLabel(new RegExp(t(locale, 'إعادة .* إلى المخزون', 'Restock')))).toHaveCount(0);
    await dialog.getByLabel(t(locale, 'نوع القطع المستردة من Synthetic linen shirt', 'Refunded units of Synthetic linen shirt')).selectOption('shipped');
    await expect(effect).toContainText(t(locale, '1 مرتجعة', '1 returned'));
    await expect(dialog.getByLabel(t(locale, 'إعادة 1 قطعة إلى المخزون', 'Restock 1 item(s)'))).toBeChecked();
    await expect(dialog.getByTestId('refund-effect-502')).toContainText(t(locale, 'لم تُشحن 1', '1 not shipped'));
    expect(await seriousViolations(page, '.ws-refund-panel')).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.locator('.ws-refund-panel').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.getByRole('button', { name: new RegExp(`^${t(locale, 'استرداد', 'Refund')} \\d`) }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(api.writes).toEqual([{ method: 'POST', path: '/my-store/orders/43/refunds', body: {
      reason: 'customer_request', method: 'original_payment', restock: true, note: null, shipping_amount: null, amount: null,
      items: [{ store_order_item_id: 501, quantity: 1, units: 'shipped' }], expected_refunded_total: '0.00',
    } }]);
  });

  test(`Storefront order page lists shipments with tracking in ${locale}`, async ({ page }) => {
    await storefront(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/account/orders/${NUMBER}?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    const section = page.locator('.sf-shipments');
    await expect(section.getByRole('heading', { name: t(locale, 'الشحنات', 'Shipments') })).toBeVisible();
    await expect(section).toContainText(t(locale, 'شُحن جزء من طلبك', 'Part of your order has shipped'));
    const shipment = section.getByTestId('sf-shipment');
    await expect(shipment).toContainText('Aramex');
    await expect(shipment).toContainText('AR-5531');
    await expect(shipment).toContainText('Synthetic linen shirt × 2');
    await expect(shipment).toContainText(t(locale, 'في الطريق', 'On the way'));
    const link = shipment.getByRole('link', { name: new RegExp(t(locale, 'تتبع الشحنة', 'Track shipment')) });
    await expect(link).toHaveAttribute('href', ARAMEX);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(await noOverflow(page)).toBe(true);
    expect(await seriousViolations(page, '.sf-shipments')).toEqual([]);
  });
}
