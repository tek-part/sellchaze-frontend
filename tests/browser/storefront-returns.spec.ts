import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// A signed-in store customer asks to return delivered items. Synthetic store, customer and order;
// the API is fully mocked, so nothing is sent to a real store.
const STORE_ID = 7654321;
const NUMBER = 'ORD-SYN-0001';

function order(withReturn: boolean) {
  return {
    id: 91, number: NUMBER, order_number: NUMBER, status: 'delivered', total: '250.00', currency: 'USD', created_at: '2026-10-20T10:00:00Z', refunded_total: '0.00',
    items: [{ id: 601, name: 'Synthetic linen shirt', quantity: 2, price: '50.00' }, { id: 602, name: 'Synthetic canvas tote', quantity: 1, price: '100.00' }],
    returns: withReturn ? [{ id: 12, status: 'requested', reason: 'size_fit', customer_note: 'Too small', resolution: null, items: [{ store_order_item_id: 601, name: 'Synthetic linen shirt', quantity: 2 }], created_at: '2026-10-22T10:00:00Z' }] : [],
    return_eligibility: withReturn
      ? { eligible: false, reason: 'open_return', window_days: 14, delivered_at: '2026-10-21T10:00:00Z', deadline: '2026-11-04T10:00:00Z', items: [] }
      : { eligible: true, reason: null, window_days: 14, delivered_at: '2026-10-21T10:00:00Z', deadline: '2026-11-04T10:00:00Z', items: [
        { store_order_item_id: 601, name: 'Synthetic linen shirt', variant_name: null, quantity: 2, returnable_quantity: 2 },
        { store_order_item_id: 602, name: 'Synthetic canvas tote', variant_name: null, quantity: 1, returnable_quantity: 1 },
      ] },
  };
}

async function mockAccount(page: Page, locale: 'en' | 'ar'): Promise<Array<{ path: string; body: unknown }>> {
  const posts: Array<{ path: string; body: unknown }> = [];
  let requested = false;
  await page.addInitScript(() => { window.localStorage.setItem('sf:auth-token', 'synthetic-customer-token'); });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path === '/api/v1/storefront/account') return route.fulfill({ json: { data: { id: 5, name: 'Synthetic customer', email: 'customer@example.test' } } });
    if (path === `/api/v1/storefront/orders/${NUMBER}` && request.method() === 'GET') return route.fulfill({ json: { data: order(requested) } });
    if (path === `/api/v1/storefront/orders/${NUMBER}/returns` && request.method() === 'POST') {
      posts.push({ path, body: request.postDataJSON() });
      requested = true;
      return route.fulfill({ status: 201, json: { data: order(true) } });
    }
    if (request.method() !== 'GET') return route.abort();
    return route.fulfill({ json: { data: [] } });
  });
  return posts;
}

const copy = {
  en: { request: 'Request a return', more: 'More Synthetic linen shirt', reason: 'Reason', note: 'Note for the store (optional)', submit: 'Send return request', choose: 'Choose at least one item to return.', sent: 'Your return request was sent', status: 'Awaiting review', open: 'You already have an open return request' },
  ar: { request: 'طلب إرجاع', more: 'زيادة Synthetic linen shirt', reason: 'سبب الإرجاع', note: 'ملاحظة للمتجر (اختياري)', submit: 'إرسال طلب الإرجاع', choose: 'اختر منتجًا واحدًا على الأقل لإرجاعه.', sent: 'أُرسل طلب الإرجاع', status: 'قيد المراجعة', open: 'لديك طلب إرجاع مفتوح' },
};

for (const locale of ['en', 'ar'] as const) {
  test(`customer requests a return for delivered items with quantity limits (${locale})`, async ({ page }) => {
    const posts = await mockAccount(page, locale);
    const c = copy[locale];
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/account/orders/${NUMBER}?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: c.request }).click();
    const form = page.locator('form.sf-return__form');
    await form.getByRole('button', { name: c.submit }).click();
    await expect(form.getByRole('alert')).toHaveText(c.choose);
    expect(posts).toEqual([]);

    const more = form.getByRole('button', { name: c.more });
    await more.click(); await more.click();
    await expect(more).toBeDisabled(); // two delivered, two returnable
    await form.getByLabel(c.reason).selectOption('size_fit');
    await form.getByLabel(c.note).fill('Too small');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.sf-return').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    await form.getByRole('button', { name: c.submit }).click();

    await expect(page.locator('.sf-return [role="status"]')).toContainText(c.sent);
    await expect(page.locator('.sf-return__list')).toContainText(c.status);
    await expect(page.locator('.sf-return')).toContainText(c.open);
    await expect(page.getByRole('button', { name: c.request })).toHaveCount(0);
    expect(posts).toEqual([{ path: `/api/v1/storefront/orders/${NUMBER}/returns`, body: { items: [{ store_order_item_id: 601, quantity: 2 }], reason: 'size_fit', note: 'Too small' } }]);
  });
}
