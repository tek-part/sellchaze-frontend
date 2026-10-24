import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Intercepted admin session and list endpoints only: these tests never contact a real API.
const PERMISSIONS = ['users-list', 'users-pending-list', 'users-create', 'users-edit', 'users-delete', 'stores-list', 'stores-create', 'stores-edit', 'stores-delete'];
const page1 = (data: unknown[]) => ({ data, meta: { current_page: 1, last_page: 1, per_page: 25, total: data.length } });
const FIXTURES: Record<string, unknown> = {
  '/merchants': page1([
    { id: 1, name: 'Self Admin', email: 'self@example.test', username: null, pending_approval: false, is_active: true },
    { id: 2, name: 'Pending Merchant', email: 'pending@example.test', username: 'pending', pending_approval: true, is_active: true },
    { id: 3, name: 'Inactive Merchant', email: 'inactive@example.test', username: null, pending_approval: false, is_active: false },
  ]),
  '/admin/users': page1([{ data: { id: 5, name: 'Staff Member', email: 'staff@example.test', roles: ['Staff'], is_active: true, pending_approval: false } }]),
  '/stores': page1([{ id: 7, name: 'Fixture Store', slug: 'fixture', owner_type: 'merchant', status: 'suspended', currency: 'USD', created_at: '2026-10-01T10:00:00Z', logo_url: null }]),
  '/admin/activity-logs': page1([{ id: 9, action: 'staff_user.updated', event_type: 'user_action', channel: 'http', level: 'error', actor: { name: 'Admin', email: 'admin@example.test' }, subject_type: 'User', subject_id: 5, ip_address: '127.0.0.1', created_at: '2026-10-01T10:00:00Z', properties: { field: 'name' }, context: { module: 'api' } }]),
  '/admin/verifications': { data: [{ id: 11, status: 'pending', notes: 'Please verify', documents: ['https://example.test/doc.pdf'], created_at: '2026-10-02T10:00:00Z', user: { id: 4, name: 'Verify Me', email: 'verify@example.test' } }] },
  '/admin/roles': { roles: [{ id: 1, name: 'Admin', users_count: 1, permissions: ['a'] }, { id: 2, name: 'Staff', users_count: 3, permissions: ['a', 'b'] }, { id: 3, name: 'Merchant', users_count: 9, permissions: [] }], permissions: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] },
  '/admin/articles': page1([{ id: 13, title: 'Fixture Article', title_ar: 'مقال تجريبي', slug: 'fixture-article', published: false, published_at: null, author: { id: 1, name: 'Admin' }, created_at: '2026-10-03T10:00:00Z' }]),
  '/employees': { data: [{ id: 21, name: 'Zed Employee', email: 'zed@example.test', is_active: true }, { id: 22, name: 'Amy Employee', email: 'amy@example.test', is_active: false }] },
};

async function admin(page: Page, locale: 'ar' | 'en' = 'en') {
  const requests: { method: string; path: string; params: Record<string, string>; body: unknown }[] = [];
  await page.addInitScript(lang => { localStorage.setItem('sellchase_access_token', 'isolated-admin-review'); localStorage.setItem('sellchase_locale', lang); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    requests.push({ method: req.method(), path, params: Object.fromEntries(url.searchParams), body: req.postDataJSON?.() ?? null });
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Self Admin', roles: ['Admin'], permissions: PERMISSIONS, is_active: true } }, headers });
    if (req.method() !== 'GET') return route.fulfill({ json: { message: 'OK', deleted: 1 }, headers });
    if (path in FIXTURES) return route.fulfill({ json: FIXTURES[path], headers });
    return route.fulfill({ json: { data: [] }, headers });
  });
  return requests;
}

const PAGES: [string, string][] = [
  ['/merchants', 'Pending Merchant'], ['/admin/users', 'Staff Member'], ['/stores', 'Fixture Store'], ['/admin/activity', 'staff_user.updated'],
  ['/admin/verifications', 'Verify Me'], ['/admin/roles', 'Staff'], ['/admin/articles', 'Fixture Article'], ['/employees', 'Zed Employee'],
];

for (const [path, text] of PAGES) {
  test(`${path} renders the shared index table without overflow or axe violations`, async ({ page }) => {
    await admin(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('.ws-dt-card .ws-dt-table')).toContainText(text);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).include('.ws-dt-card').analyze();
    expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}

test('merchants bulk delete never includes the signed-in admin', async ({ page }) => {
  const requests = await admin(page);
  await page.goto('/merchants');
  await expect(page.locator('.ws-dt-table')).toContainText('Inactive Merchant');
  await page.getByRole('checkbox', { name: 'Select all on this page' }).first().check();
  await page.getByRole('region', { name: 'Bulk actions' }).getByRole('button', { name: /Delete/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Delete/ }).click();
  await expect.poll(() => requests.find(r => r.path === '/merchants/bulk-destroy')?.body).toEqual({ ids: [2, 3] });
});

test('activity log sorts through sort_dir and filters by level from a view', async ({ page }) => {
  const requests = await admin(page);
  await page.goto('/admin/activity');
  await expect(page.locator('.ws-dt-table')).toContainText('staff_user.updated');
  await page.getByRole('tab', { name: 'Errors' }).click();
  await expect.poll(() => requests.filter(r => r.path === '/admin/activity-logs').at(-1)?.params.level).toBe('error');
  await page.getByRole('button', { name: /Sort by .* ascending/ }).click();
  await expect.poll(() => requests.filter(r => r.path === '/admin/activity-logs').at(-1)?.params.sort_dir).toBe('asc');
  expect(requests.filter(r => r.path === '/admin/activity-logs').every(r => !('sort_by' in r.params))).toBe(true);
});

test('verifications land on pending requests and articles use the endpoint parameter names', async ({ page }) => {
  const requests = await admin(page);
  await page.goto('/admin/verifications');
  await expect(page.locator('.ws-dt-table')).toContainText('Verify Me');
  expect(requests.filter(r => r.path === '/admin/verifications').at(-1)?.params).toEqual({ status: 'pending' });
  await expect(page.getByRole('tab', { name: 'Pending', selected: true })).toBeVisible();

  await page.goto('/admin/articles?view=draft&f.published=0&q=fixture');
  await expect(page.locator('.ws-dt-table')).toContainText('Fixture Article');
  expect(requests.filter(r => r.path === '/admin/articles').at(-1)?.params).toMatchObject({ q: 'fixture', published: '0' });
});

test('roles hide Merchant and protect Admin from bulk delete in Arabic', async ({ page }) => {
  const requests = await admin(page, 'ar');
  await page.goto('/admin/roles');
  const table = page.locator('.ws-dt-table');
  await expect(table).toContainText('Staff');
  await expect(table).not.toContainText('Merchant');
  expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');
  await page.getByRole('checkbox', { name: 'تحديد كل عناصر الصفحة' }).first().check();
  await page.getByRole('region', { name: 'إجراءات جماعية' }).getByRole('button', { name: /حذف/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /حذف/ }).click();
  await expect.poll(() => requests.filter(r => r.method === 'DELETE').map(r => r.path)).toEqual(['/admin/roles/2']);
});
