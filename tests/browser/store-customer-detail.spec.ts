import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Intercepted merchant session and customer endpoints only: these tests never contact a real API.
const MONA = '+201001112222';
const PERMISSIONS = ['view', 'orders.manage', 'products.manage', 'settings.manage'].map(key => `store.${key}`);
const ROWS = [
  { key: MONA, name: 'Mona Ali', email: 'mona@example.test', phone: '01001112222', account_id: null, orders_count: 2, total_spent: 500, first_order_at: '2026-09-01T10:00:00Z', last_order_at: '2026-10-20T10:00:00Z', city: 'Cairo', tags: ['VIP'], accepts_marketing: false },
  { key: 'omar@example.test', name: 'Omar', email: 'omar@example.test', phone: null, account_id: 4, orders_count: 1, total_spent: 50, first_order_at: '2026-07-01T10:00:00Z', last_order_at: '2026-07-01T10:00:00Z', city: null, tags: ['Wholesale'], accepts_marketing: true },
];

function profile(overrides: { tags?: string[]; note?: string | null; accepts?: boolean } = {}) {
  const accepts = overrides.accepts ?? false;
  return {
    key: MONA, key_type: 'phone',
    contact: { name: 'Mona Ali', email: 'mona@example.test', phone: '01001112222' },
    stats: { orders_count: 2, total_spent: 500, average_order_value: 250, first_order_at: '2026-09-01T10:00:00Z', last_order_at: '2026-10-20T10:00:00Z', cancelled_count: 1, currency: 'EGP' },
    addresses: [{ formatted: '9 Tahrir Square, Downtown, Cairo, Egypt', fields: { line1: '9 Tahrir Square', city: 'Cairo' }, order_id: 12, used_at: '2026-10-20T10:00:00Z' }],
    account: null,
    profile: { tags: overrides.tags ?? ['VIP'], note: overrides.note ?? null, name: null, email: null, phone: null, updated_at: null },
    marketing: { accepts_marketing: accepts, email: { address: 'mona@example.test', subscribed: accepts, since: null }, sms: { phone: MONA, subscribed: accepts, since: null }, can_subscribe: true, updated_at: accepts ? '2026-10-26T10:00:00Z' : null, source: accepts ? 'merchant' : null },
    orders: {
      data: [
        { id: 13, order_number: 'SC-1013', status: 'cancelled', payment_status: 'pending', payment_method: 'cod', currency: 'EGP', grand_total: 999, placed_at: '2026-10-21T10:00:00Z' },
        { id: 12, order_number: 'SC-1012', status: 'delivered', payment_status: 'paid', payment_method: 'cod', currency: 'EGP', grand_total: 200, placed_at: '2026-10-20T10:00:00Z' },
        { id: 11, order_number: 'SC-1011', status: 'shipped', payment_status: 'pending', payment_method: 'cod', currency: 'EGP', grand_total: 300, placed_at: '2026-09-01T10:00:00Z' },
      ],
      meta: { current_page: 1, last_page: 1, total: 3, per_page: 10 },
    },
  };
}

async function workspace(page: Page, locale: 'ar' | 'en') {
  const requests: { method: string; path: string; params: Record<string, string>; body: Record<string, unknown> | null }[] = [];
  let current = profile();
  await page.addInitScript(lang => { localStorage.setItem('sellchase_access_token', 'isolated-customers-review'); localStorage.setItem('sellchase_locale', lang); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    requests.push({ method: req.method(), path, params: Object.fromEntries(url.searchParams), body: req.method() === 'GET' ? null : req.postDataJSON() });
    if (req.method() !== 'GET') {
      expect(`${req.method()} ${path}`).toBe('PUT /my-store/customers/profile');
      const body = req.postDataJSON() as { tags?: string[]; note?: string | null; accepts_marketing?: boolean };
      current = profile({ tags: body.tags ?? current.profile.tags, note: 'note' in body ? body.note : current.profile.note, accepts: body.accepts_marketing ?? current.marketing.accepts_marketing });
      return route.fulfill({ json: { message: 'Customer saved.', data: current }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Customers fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: PERMISSIONS, parent_user_id: null, is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local customers fixture', slug: 'fixture', status: 'active', currency: 'EGP', default_locale: 'en', supported_locales: ['en', 'ar'] } }, headers });
    if (path === '/my-store/customers/tags') return route.fulfill({ json: { data: [{ tag: 'VIP', count: 1 }, { tag: 'Wholesale', count: 1 }, { tag: 'Late payer', count: 3 }] }, headers });
    if (path === '/my-store/customers/directory') {
      const tags = (url.searchParams.get('tag') ?? '').split(',').filter(Boolean);
      const data = tags.length ? ROWS.filter(row => row.tags.some(tag => tags.includes(tag))) : ROWS;
      return route.fulfill({ json: { data, meta: { current_page: 1, last_page: 1, total: data.length, per_page: 25 } }, headers });
    }
    if (path === '/my-store/customers/profile') {
      expect(url.searchParams.get('key')).toBe(MONA);
      return route.fulfill({ json: { data: current }, headers });
    }
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return requests;
}

const t = (locale: 'ar' | 'en', ar: string, en: string) => (locale === 'ar' ? ar : en);

for (const locale of ['ar', 'en'] as const) {
  test(`opens a customer from the list and saves a tag, note and consent in ${locale}`, async ({ page }) => {
    const requests = await workspace(page, locale);
    await page.goto('/store/customers');
    await page.locator('.ws-dt-table').getByRole('link', { name: 'Mona Ali' }).click();
    await expect(page).toHaveURL(/\/store\/customers\/view\?key=%2B201001112222$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Mona Ali' })).toBeVisible();
    const summary = page.getByRole('list', { name: t(locale, 'ملخص العميل', 'Customer summary') });
    await expect(summary).toContainText('2');
    await expect(page.getByRole('link', { name: '#SC-1012' })).toHaveAttribute('href', '/store/orders/12');
    await expect(page.getByText('9 Tahrir Square, Downtown, Cairo, Egypt')).toBeVisible();

    const save = page.getByRole('button', { name: t(locale, 'حفظ', 'Save'), exact: true });
    await expect(save).toBeDisabled();
    const tagInput = page.getByLabel(t(locale, 'إضافة وسم', 'Add a tag'));
    await tagInput.fill('  late   payer ');
    await tagInput.press('Enter');
    await tagInput.fill('vip');
    await tagInput.press('Enter');
    const chips = page.getByRole('list', { name: t(locale, 'وسوم العميل', 'Customer tags') });
    await expect(chips.getByRole('listitem')).toHaveCount(2);
    await page.getByLabel(t(locale, 'ملاحظة عن العميل', 'Note about the customer')).fill('Call before delivery');
    await page.getByRole('switch', { name: t(locale, 'وافق العميل على استلام رسائل تسويقية', 'Customer agreed to receive marketing') }).check();
    await save.click();

    await expect(page.getByRole('status')).toHaveText(t(locale, 'تم حفظ بيانات العميل.', 'Customer saved.'));
    const puts = requests.filter(request => request.method === 'PUT');
    expect(puts).toHaveLength(1);
    expect(puts[0]!.body).toEqual({ key: MONA, tags: ['VIP', 'Late payer'], note: 'Call before delivery', accepts_marketing: true });
    await expect(save).toBeDisabled();
    await expect(page.locator('.ws-customer-heading')).toContainText(t(locale, 'مشترك في التسويق', 'Subscribed to marketing'));

    // Removing a chip and saving sends only what changed.
    await chips.getByRole('button', { name: t(locale, 'إزالة الوسم Late payer', 'Remove tag Late payer') }).click();
    await save.click();
    await expect(page.getByRole('status')).toBeVisible();
    expect(requests.filter(request => request.method === 'PUT')[1]!.body).toEqual({ key: MONA, tags: ['VIP'] });
  });

  test(`the list tag filter sends the tag param in ${locale}`, async ({ page }) => {
    const requests = await workspace(page, locale);
    await page.goto('/store/customers');
    await expect(page.locator('.ws-dt-table')).toContainText('Omar');
    await page.getByRole('button', { name: t(locale, 'إضافة فلتر', 'Add filter') }).click();
    await page.getByRole('button', { name: t(locale, 'الوسوم', 'Tags'), exact: true }).click();
    await page.getByRole('group', { name: t(locale, 'الوسوم', 'Tags') }).getByLabel('Wholesale').check();
    await page.getByRole('button', { name: t(locale, 'تطبيق', 'Apply') }).click();
    await expect(page.locator('.ws-dt-table')).not.toContainText('Mona Ali');
    await expect(page).toHaveURL(/f\.tag=Wholesale/);
    const last = requests.filter(request => request.path === '/my-store/customers/directory').at(-1)!;
    expect(last.params.tag).toBe('Wholesale');

    // Built-in segment views are plain filters.
    await page.getByRole('tab', { name: t(locale, 'مشتركون في التسويق', 'Subscribed to marketing') }).click();
    await expect.poll(() => requests.filter(request => request.path === '/my-store/customers/directory').at(-1)!.params.marketing).toBe('subscribed');
    await page.getByRole('tab', { name: t(locale, 'كبار العملاء', 'VIP') }).click();
    await expect.poll(() => requests.filter(request => request.path === '/my-store/customers/directory').at(-1)!.params.spent_min).toBe('10000');
  });

  test(`customer page has no serious accessibility issues and fits 390px in ${locale}`, async ({ page }) => {
    await workspace(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/store/customers/view?key=${encodeURIComponent(MONA)}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Mona Ali' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).include('.ws-customer-detail').analyze();
    const blocking = result.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical');
    expect(blocking.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);

    await page.goto('/store/customers');
    await expect(page.locator('.ws-dt-table')).toContainText('Mona Ali');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const list = await new AxeBuilder({ page }).include('.ws-dt-card').analyze();
    expect(list.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical').map(v => v.id)).toEqual([]);
  });
}
