import { expect, test, type Page } from 'playwright/test';

// The workspace used to chain three loaders on every page: a full-screen one for /auth/me, one for
// /my-store (refetched on each navigation because the store layout remounted per path) and the
// page's own. Synthetic account and store only: no merchant API is contacted.
async function workspace(page: Page, delays: { me?: number } = {}) {
  const calls: string[] = [];
  await page.addInitScript(() => { localStorage.setItem('sellchase_access_token', 'isolated-loading-review'); localStorage.setItem('sellchase_locale', 'en'); localStorage.setItem('sellchaze_workspace_appearance', 'light'); });
  await page.route('**/api/v1/**', async (route) => {
    const req = route.request(); const path = new URL(req.url()).pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    calls.push(path);
    if (path === '/auth/me') {
      if (delays.me) await new Promise((resolve) => setTimeout(resolve, delays.me));
      return route.fulfill({ json: { user: { id: 41, name: 'Loading fixture', roles: ['Merchant'], permissions: [], is_active: true } }, headers });
    }
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 9, owner_user_id: 41, name: 'Loading fixture store', slug: 'fixture', status: 'active', currency: 'USD' } }, headers });
    if (path === '/my-store/orders') return route.fulfill({ json: { data: [{ id: 501, status: 'pending', grand_total: '120.00', currency: 'USD', customer: { name: 'Synthetic buyer', phone: '+10000000000' }, created_at: '2026-10-20T10:00:00Z' }], meta: { current_page: 1, last_page: 1, total: 1, per_page: 25 } }, headers });
    return route.fulfill({ json: { data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 25 } }, headers });
  });
  return calls;
}

test('store pages load the store once and keep the layout across navigations', async ({ page }) => {
  const calls = await workspace(page);
  await page.goto('/store/orders');
  await expect(page.getByText('Synthetic buyer')).toBeVisible();
  await page.goto('/store/orders'); // fresh document: the account and store snapshots now exist
  await expect(page.getByText('Synthetic buyer')).toBeVisible();
  const before = calls.filter((path) => path === '/my-store').length;

  await page.evaluate(() => { window.history.pushState({}, '', '/store/customers'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page).toHaveURL(/\/store\/customers$/);
  await page.evaluate(() => { window.history.pushState({}, '', '/store/orders'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByText('Synthetic buyer')).toBeVisible();
  expect(calls.filter((path) => path === '/my-store').length).toBe(before);
});

test('a reload paints the workspace from the last-known account instead of a full-screen loader', async ({ page }) => {
  await workspace(page, { me: 2500 });
  await page.goto('/store/orders');
  await expect(page.getByText('Synthetic buyer')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  // /auth/me is still pending for 2.5 s; the shell, store and orders are already on screen.
  await expect(page.getByText('Synthetic buyer')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('.sc-brand-loader.h-dvh')).toHaveCount(0);
});

test('signing out drops the account and store snapshots', async ({ page }) => {
  await workspace(page);
  await page.goto('/store/orders');
  await expect(page.getByText('Synthetic buyer')).toBeVisible();
  expect(await page.evaluate(() => Boolean(localStorage.getItem('sellchase_me_snapshot') && localStorage.getItem('sellchase_store_snapshot')))).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event('sellchase:session-expired')));
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => [localStorage.getItem('sellchase_me_snapshot'), localStorage.getItem('sellchase_store_snapshot')])).toEqual([null, null]);
});
