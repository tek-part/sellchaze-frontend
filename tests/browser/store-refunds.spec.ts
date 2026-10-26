import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Merchant refunds and returns with a fully intercepted API: a synthetic store and order, no real
// merchant data and no payment gateway. Writes are recorded and asserted, never sent anywhere.
type Write = { method: string; path: string; body: unknown };

const line = (id: number, name: string, quantity: number, allocated: string) => ({
  store_order_item_id: id, name, variant_name: null, sku: null, unit_price: (Number(allocated) / quantity).toFixed(2), line_total: allocated, quantity,
  refunded_quantity: 0, refundable_quantity: quantity, allocated_amount: allocated, refunded_amount: '0.00', refundable_amount: allocated, restockable: true, digital: false,
});
const baseSummary = () => ({
  currency: 'EGP', order_status: 'delivered', payment_status: 'paid', payment_collected: true, refundable: true, grand_total: '250.00', refunded_total: '0.00',
  refundable_total: '250.00', fully_refunded: false, shipping: { total: '50.00', refunded: '0.00', refundable: '50.00' },
  items: [line(501, 'Synthetic linen shirt', 2, '100.00'), line(502, 'Synthetic canvas cap', 1, '100.00')], refunds: [] as unknown[],
});
const order = {
  id: 42, order_number: 'SYN-1042', status: 'delivered', currency: 'EGP', payment_method: 'card', payment_status: 'paid', grand_total: '250.00', subtotal: '200.00',
  shipping_total: '50.00', discount_total: '0.00', tax_total: '0.00', refunded_total: '0.00', next_statuses: ['request_refund', 'refunded'], fulfillment: { requires_shipping: true },
  customer: { name: 'Synthetic buyer', phone: '+201000000000', email: 'buyer@example.test' }, shipping_address: { city: 'Cairo', line1: '1 Synthetic Street' },
  items: [{ id: 501, name: 'Synthetic linen shirt', unit_price: '50.00', quantity: 2, line_total: '100.00' }, { id: 502, name: 'Synthetic canvas cap', unit_price: '100.00', quantity: 1, line_total: '100.00' }],
  timeline: [{ from_status: 'shipped', to_status: 'delivered', notes: null, source: null, actor: 'Owner', created_at: '2026-10-20T10:00:00Z' }],
  review: { classification: null, version: 0 }, placed_at: '2026-10-18T10:00:00Z', created_at: '2026-10-18T10:00:00Z', updated_at: '2026-10-20T10:00:00Z',
};
const returnRow = (status: string, next: string[]) => ({
  id: 7, store_order_id: 42, status, reason: 'damaged', customer_note: 'The seam is torn', merchant_note: null, resolution: null, store_order_refund_id: null,
  next_statuses: next, items: [{ store_order_item_id: 501, name: 'Synthetic linen shirt', quantity: 1 }], created_at: '2026-10-21T09:00:00Z', updated_at: '2026-10-21T09:00:00Z',
  order: { id: 42, order_number: 'SYN-1042', status: 'delivered', currency: 'EGP', grand_total: '250.00', customer: { name: 'Synthetic buyer', email: 'buyer@example.test', phone: '+201000000000' } },
});

async function dashboard(page: Page, locale: 'ar' | 'en') {
  const writes: Write[] = [];
  let summary = baseSummary();
  let ret = returnRow('requested', ['approved', 'rejected']);
  await page.addInitScript((value) => { localStorage.setItem('sellchase_access_token', 'isolated-refund-review'); localStorage.setItem('sellchase_locale', value); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.method() === 'POST' && path === '/my-store/orders/42/refunds') {
      const body = req.postDataJSON(); writes.push({ method: 'POST', path, body });
      summary = { ...summary, refunded_total: '50.00', refundable_total: '200.00', payment_status: 'partially_refunded',
        items: summary.items.map((row) => (row.store_order_item_id === 501 ? { ...row, refunded_quantity: 1, refundable_quantity: 1, refunded_amount: '50.00', refundable_amount: '50.00' } : row)),
        refunds: [{ id: 1, amount: '50.00', shipping_amount: '0.00', reason: 'damaged', note: null, method: 'cash', restocked: true, items: [{ store_order_item_id: 501, name: 'Synthetic linen shirt', quantity: 1, amount: '50.00', restocked_quantity: 1 }], actor: 'Owner', created_at: '2026-10-22T10:00:00Z' }] };
      return route.fulfill({ status: 201, json: { data: summary }, headers });
    }
    if (req.method() === 'PATCH' && path === '/my-store/returns/7') {
      const body = req.postDataJSON(); writes.push({ method: 'PATCH', path, body });
      ret = returnRow(body.status, body.status === 'approved' ? ['received', 'rejected', 'closed'] : []);
      return route.fulfill({ json: { data: ret }, headers });
    }
    if (req.method() !== 'GET') { writes.push({ method: req.method(), path, body: null }); return route.fulfill({ status: 405, json: { message: 'Unexpected write' }, headers }); }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Isolated refund fixture', roles: ['Merchant'], permissions: ['store.orders.manage'], is_active: true } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local refund fixture', slug: 'fixture', status: 'active', currency: 'EGP' } }, headers });
    if (path === '/my-store/orders/42/detail') return route.fulfill({ json: { data: { ...order, refunded_total: summary.refunded_total, payment_status: summary.payment_status } }, headers });
    if (path === '/my-store/orders/42/refunds') return route.fulfill({ json: { data: summary }, headers });
    if (path === '/my-store/orders/42/returns') return route.fulfill({ json: { data: [ret] }, headers });
    if (path === '/my-store/returns') {
      const status = url.searchParams.get('status');
      const rows = [ret, { ...returnRow('closed', []), id: 8, resolution: 'refund', reason: 'size_fit' }].filter((row) => !status || row.status === status);
      return route.fulfill({ json: { data: rows, counts: { [ret.status]: 1, closed: 1 }, meta: { current_page: 1, last_page: 1, per_page: 25, total: rows.length } }, headers });
    }
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { writes };
}

const t = (locale: 'ar' | 'en', ar: string, en: string) => (locale === 'ar' ? ar : en);
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
async function seriousViolations(page: Page, selector: string) {
  const result = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa']).analyze();
  return result.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

for (const locale of ['ar', 'en'] as const) {
  test(`Refund dialog enforces refundable limits and records the exact payload in ${locale}`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.goto('/store/orders/42');
    const card = page.locator('.ws-refunds');
    await expect(card.getByTestId('refunded-of')).toContainText('0.00 EGP');
    await expect(card.getByTestId('refunded-of')).toContainText('250.00 EGP');
    await page.locator('.ws-order-toolbar').getByRole('button', { name: t(locale, 'استرداد', 'Refund'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(t(locale, 'لا تُعيد سيلشيز الأموال تلقائيًا', 'does not send money back automatically'));

    const increase = dialog.getByRole('button', { name: t(locale, 'زيادة Synthetic linen shirt', 'Increase Synthetic linen shirt'), exact: true });
    const field = dialog.getByLabel('Synthetic linen shirt', { exact: true });
    await increase.click(); await increase.click();
    await expect(field).toHaveValue('2');
    await expect(increase).toBeDisabled(); // two bought, two refundable: the UI cannot ask for a third
    await expect(dialog.getByTestId('refund-total')).toHaveText('100.00 EGP');
    await dialog.getByRole('button', { name: t(locale, 'إنقاص Synthetic linen shirt', 'Decrease Synthetic linen shirt'), exact: true }).click();
    await expect(dialog.getByTestId('refund-total')).toHaveText('50.00 EGP');

    const shipping = dialog.getByLabel(new RegExp(t(locale, 'استرداد الشحن', 'Shipping refund')));
    await expect(shipping).toHaveAttribute('max', '50.00');
    await shipping.fill('60');
    await expect(dialog.getByRole('alert')).toContainText(t(locale, 'مبلغ الشحن أكبر من المتاح', 'more than what is available'));
    const submit = dialog.getByRole('button', { name: new RegExp(`^${t(locale, 'استرداد', 'Refund')} \\d`) });
    await expect(submit).toBeDisabled();
    await shipping.fill('');

    await dialog.getByLabel(t(locale, 'إدخال مبلغ مختلف', 'Enter a different amount')).check();
    const amount = dialog.getByLabel(new RegExp(`^${t(locale, 'المبلغ', 'Amount')}`));
    await expect(amount).toHaveAttribute('max', '50.00');
    await amount.fill('50.01');
    await expect(submit).toBeDisabled();
    await amount.fill('45.5');
    await dialog.getByLabel(t(locale, 'السبب', 'Reason')).selectOption('damaged');
    await dialog.getByLabel(t(locale, 'طريقة الاسترداد', 'Refund method')).selectOption('cash');
    await expect(dialog.getByLabel(t(locale, 'إعادة 1 قطعة إلى المخزون', 'Restock 1 item(s)'))).toBeChecked();
    await dialog.getByLabel(t(locale, 'ملاحظة داخلية (اختياري)', 'Internal note (optional)')).fill('Torn seam');
    await expect(submit).toHaveText(`${t(locale, 'استرداد', 'Refund')} 45.50 EGP`);
    expect(await seriousViolations(page, '.ws-refund-panel')).toEqual([]);
    await submit.click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(card.getByTestId('refunded-of')).toContainText('50.00 EGP');
    await expect(card.locator('.ws-refunds-history')).toContainText('Synthetic linen shirt × 1');
    expect(api.writes).toEqual([{ method: 'POST', path: '/my-store/orders/42/refunds', body: {
      reason: 'damaged', method: 'cash', restock: true, note: 'Torn seam', shipping_amount: null, amount: '45.50',
      items: [{ store_order_item_id: 501, quantity: 1 }], expected_refunded_total: '0.00',
    } }]);
  });

  test(`Return requests can be approved from the order in ${locale}`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.goto('/store/orders/42');
    const panel = page.locator('.ws-returns');
    await expect(panel).toContainText('The seam is torn');
    await panel.getByRole('button', { name: t(locale, 'قبول', 'Approve'), exact: true }).click();
    await expect(panel.getByRole('button', { name: t(locale, 'تم الاستلام', 'Mark received'), exact: true })).toBeVisible();
    await expect(panel.getByRole('button', { name: t(locale, 'استلام واسترداد', 'Receive and refund'), exact: true })).toBeVisible();
    expect(api.writes).toEqual([{ method: 'PATCH', path: '/my-store/returns/7', body: { status: 'approved' } }]);
    expect(await seriousViolations(page, '.ws-order-primary')).toEqual([]);
  });

  test(`Order detail with refunds and the refund dialog fit a 390px phone in ${locale}`, async ({ page }) => {
    await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/orders/42');
    await expect(page.locator('.ws-refunds [data-testid="refunded-of"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await noOverflow(page)).toBe(true);
    await page.locator('.ws-refunds').getByRole('button', { name: t(locale, 'استرداد', 'Refund'), exact: true }).click();
    const panel = page.locator('.ws-refund-panel');
    await expect(panel).toBeVisible();
    expect(await noOverflow(page)).toBe(true);
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test(`Returns list shows requests with status views in ${locale}`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/returns');
    await expect(page.getByRole('heading', { name: t(locale, 'المرتجعات', 'Returns'), level: 1 })).toBeVisible();
    await expect(page.locator('.ws-dt-card')).toContainText('SYN-1042');
    await expect(page.locator('.ws-dt-card')).toContainText(t(locale, 'بانتظار المراجعة', 'Requested'));
    await expect(page.locator('.ws-dt-card')).toContainText(t(locale, 'مغلق', 'Closed'));
    await page.evaluate(() => document.fonts.ready);
    expect(await noOverflow(page)).toBe(true);
    expect(await seriousViolations(page, '.ws-returns-page')).toEqual([]);
    expect(api.writes).toEqual([]);
  });
}
