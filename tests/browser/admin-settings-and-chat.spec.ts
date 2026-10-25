import { expect, test, type Page } from 'playwright/test';

// Exchange rates are reachable from the admin settings menu, and the chat badge costs one request
// for operators and none for merchants. Synthetic accounts, fully mocked API.
async function workspace(page: Page, roles: string[]): Promise<string[]> {
  const calls: string[] = [];
  await page.addInitScript(() => { localStorage.setItem('sellchase_access_token', 'isolated-admin-review'); localStorage.setItem('sellchase_locale', 'en'); localStorage.setItem('sellchaze_workspace_appearance', 'light'); });
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(); const path = new URL(req.url()).pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    calls.push(path);
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 3, name: 'Fixture', roles, permissions: ['stores-edit'], is_active: true } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 9, name: 'Fixture store', status: 'active', currency: 'USD' } }, headers });
    if (path === '/chat/unread-count') return route.fulfill({ json: { unread: 4 }, headers });
    if (path === '/admin/settings/currencies') return route.fulfill({ json: { data: [{ currency_code: 'EGP', rate_to_usd: '48.5', source: 'manual', updated_at: '2026-10-25T10:00:00Z' }] }, headers });
    return route.fulfill({ json: { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 25 } }, headers });
  });
  return calls;
}

test('operators reach exchange rates from settings and get one chat badge request', async ({ page }) => {
  const calls = await workspace(page, ['Admin']);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/settings/email');
  // Settings pages open the sidebar's settings group, which now lists exchange rates.
  await page.locator('.ws-sidebar a[href="/settings/currencies"]').first().click();
  await expect(page).toHaveURL(/\/settings\/currencies$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Currencies' })).toBeVisible();
  await expect(page.getByText('EGP').first()).toBeVisible();
  await expect(page.locator('a[href="/chat"] .ws-notification-dot')).toHaveText('4');
  expect(calls.filter((path) => path === '/chat/unread-count')).toHaveLength(1);
});

test('merchants never poll chat', async ({ page }) => {
  const calls = await workspace(page, ['Merchant']);
  await page.goto('/store/orders');
  await expect(page.locator('.ws-page')).toBeVisible();
  await page.waitForTimeout(500);
  expect(calls).not.toContain('/chat/unread-count');
});
