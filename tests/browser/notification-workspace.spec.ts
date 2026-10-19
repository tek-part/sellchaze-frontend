import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Intercepted account and feed only: these tests never contact a merchant API.
async function workspace(page: Page, locale: 'ar' | 'en', count = 26, longTitle = false) {
  let rows = Array.from({ length: count }, (_, i) => ({ id: `notice-${i + 1}`, read_at: null as string | null, created_at: '2026-10-19T10:00:00Z', data: { title: longTitle ? 'Order'.repeat(80) : `Notice ${i + 1}`, message: 'Synthetic notification content', url: '/store/orders' } }));
  const writes: string[] = [];
  const state = { failRead: false };
  await page.addInitScript(locale => { localStorage.setItem('sellchase_access_token', 'isolated-notification-review'); localStorage.setItem('sellchase_locale', locale); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (req.method() !== 'GET') {
      writes.push(path); expect(path).toMatch(/^\/notifications\/(notice-\d+\/read|read-all)$/);
      if (state.failRead) return route.fulfill({ status: 503, json: { message: 'Synthetic read failure' }, headers });
      rows = rows.map(row => path.endsWith('/read-all') || path === `/notifications/${row.id}/read` ? { ...row, read_at: '2026-10-19T11:00:00Z' } : row);
      return route.fulfill({ json: { unread_count: rows.filter(row => !row.read_at).length }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Isolated notification fixture', roles: ['Merchant'], permissions: [], is_active: true } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local notification fixture', slug: 'fixture', status: 'active', currency: 'USD' } }, headers });
    if (path === '/notifications') {
      const status = url.searchParams.get('status') || 'all'; const current = Number(url.searchParams.get('page') || 1); const per = Number(url.searchParams.get('per_page') || 25);
      const filtered = rows.filter(row => status === 'all' || (status === 'unread' ? !row.read_at : !!row.read_at));
      return route.fulfill({ json: { data: filtered.slice((current - 1) * per, current * per), unread_count: rows.filter(row => !row.read_at).length, meta: { current_page: current, last_page: Math.max(1, Math.ceil(filtered.length / per)), total: filtered.length, per_page: per } }, headers });
    }
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { writes, state };
}

for (const locale of ['ar', 'en'] as const) {
  test(`Unread notifications recover the remaining page and synchronize the bell in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/notifications');
    await page.getByRole('button', { name: locale === 'ar' ? /^غير مقروءة/ : /^Unread/ }).click();
    await page.getByRole('button', { name: locale === 'ar' ? 'التالي' : 'Next', exact: true }).click();
    const last = page.locator('.ws-notifications-list li').filter({ hasText: 'Notice 26' });
    await expect(last).toBeVisible();
    await last.getByRole('button', { name: locale === 'ar' ? 'تحديد كمقروء: Notice 26' : 'Mark as read: Notice 26', exact: true }).click();
    await expect(page.locator('.ws-notifications-list li')).toHaveCount(25);
    await expect(page.getByRole('heading', { name: 'Notice 1', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: locale === 'ar' ? 'مشاهدة الإشعارات (25)' : 'View notifications (25)', exact: true }).first()).toBeVisible();
    expect(api.writes).toEqual(['/notifications/notice-26/read']);
  });

  for (const width of [320, 390, 1440]) test(`Notification content stays readable and within ${width}px in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale, 1, true);
    await page.setViewportSize({ width, height: 844 }); await page.goto('/notifications');
    await expect(page.locator('.ws-notifications-list li')).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await page.locator('.ws-notifications-list h2').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).include('.ws-notifications').analyze();
    expect(result.violations).toEqual([]); expect(api.writes).toEqual([]);
  });

  test(`Notification read retry retains the current filter and content in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale, 1); api.state.failRead = true;
    await page.goto('/notifications');
    await page.getByRole('button', { name: locale === 'ar' ? /^غير مقروءة/ : /^Unread/ }).click();
    const read = page.getByRole('button', { name: locale === 'ar' ? 'تحديد كمقروء: Notice 1' : 'Mark as read: Notice 1', exact: true });
    await read.click(); await expect(page.getByRole('alert')).toContainText('Synthetic read failure');
    await expect(read).toBeEnabled(); api.state.failRead = false; await read.click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('.ws-notifications-no-results')).toBeVisible();
    await expect(page.getByRole('button', { name: locale === 'ar' ? /^غير مقروءة/ : /^Unread/ })).toHaveAttribute('aria-pressed', 'true');
    expect(api.writes).toEqual(['/notifications/notice-1/read', '/notifications/notice-1/read']);
  });

  test(`Mark all read recovers the first empty unread page in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/notifications');
    await page.getByRole('button', { name: locale === 'ar' ? /^غير مقروءة/ : /^Unread/ }).click();
    await page.getByRole('button', { name: locale === 'ar' ? 'التالي' : 'Next', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Notice 26', exact: true })).toBeVisible();
    await page.getByRole('button', { name: locale === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read', exact: true }).click();
    await expect(page.locator('.ws-notifications-no-results')).toBeVisible();
    await page.getByRole('button', { name: locale === 'ar' ? 'مقروءة' : 'Read', exact: true }).click();
    await expect(page.locator('.ws-notifications-list li')).toHaveCount(25);
    await expect(page.locator('.ws-notifications-list li[data-read="true"]')).toHaveCount(25);
    await expect(page.getByRole('link', { name: locale === 'ar' ? 'مشاهدة الإشعارات' : 'View notifications', exact: true }).first()).toBeVisible();
    expect(api.writes).toEqual(['/notifications/read-all']);
  });
}
