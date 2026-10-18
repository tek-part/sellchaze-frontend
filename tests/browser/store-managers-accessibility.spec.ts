import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// These browser contracts use an isolated, intercepted API. No real account is created.
async function workspace(page: Page, locale: 'ar' | 'en', manager = false, appearance: 'light' | 'dark' = 'light') {
  const mutations: Array<{ method: string; path: string; data: Record<string, unknown> }> = [];
  const reads: string[] = [];
  const keys = ['view', 'orders.manage', 'products.manage', 'categories.manage', 'coupons.manage', 'reviews.manage', 'analytics.view', 'themes.manage', 'pages.manage', 'settings.manage'];
  const labels = [['عرض المتجر', 'View store'], ['إدارة الطلبات', 'Manage orders'], ['إدارة المنتجات', 'Manage products'], ['إدارة الأقسام', 'Manage categories'], ['إدارة الكوبونات', 'Manage coupons'], ['إدارة التقييمات', 'Manage reviews'], ['عرض الإحصائيات', 'View analytics'], ['إدارة الثيمات وقوائمها', 'Manage themes and navigation'], ['إدارة الصفحات ومسارات البيع', 'Manage pages and funnels'], ['إدارة إعدادات المتجر والشحن والدفع', 'Manage store, shipping and payment settings']];
  let row = { id: 5, name: 'Catalog Manager', email: 'manager@example.test', is_active: true, permissions: ['store.view', 'store.products.manage'], version: 'a'.repeat(64), deleted_at: null };
  await page.addInitScript(({language, mode}) => {
    localStorage.setItem('sellchase_access_token', 'isolated-browser-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', mode);
  }, {language: locale, mode: appearance});
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    if (request.method() !== 'GET') {
      expect(path.startsWith('/my-store/managers')).toBe(true);
      const data = request.postDataJSON() as Record<string, unknown>;
      mutations.push({ method: request.method(), path, data });
      row = { ...row, ...data, version: 'b'.repeat(64) };
      await route.fulfill({ json: { data: row }, headers }); return;
    }
    reads.push(path);
    if (path === '/auth/me') {
      await route.fulfill({ json: { user: { id: manager ? 2 : 1, name: 'Layout Fixture', email: 'owner@example.test', roles: [manager ? 'StoreManager' : 'Merchant'], permissions: manager ? ['store.view', 'store.settings.manage'] : keys.map(key => `store.${key}`), parent_user_id: manager ? 1 : null, is_active: true, pending_approval: false } }, headers }); return;
    }
    if (path === '/my-store') {
      await route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local store fixture', slug: 'fixture', status: 'active', currency: 'USD', default_locale: 'en', supported_locales: ['en', 'ar'] } }, headers }); return;
    }
    if (path === '/my-store/managers') {
      await route.fulfill({ json: { data: [row], meta: { current_page: 1, last_page: 1, total: 1 }, permissions: keys.map((key, index) => ({ key: `store.${key}`, required: key === 'view', label: { ar: labels[index]![0], en: labels[index]![1] } })) }, headers }); return;
    }
    await route.fulfill({ json: { data: [], unread: 0, count: 0 }, headers });
  });
  return { mutations, reads };
}

for (const locale of ['ar', 'en'] as const) {
  for (const width of [1440, 390]) {
    test(`Manager form is accessible in ${locale} at ${width}px`, async ({ page }) => {
      await workspace(page, locale);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/store/settings/managers');
      await expect(page.getByRole('link', { name: locale === 'ar' ? 'اعدادات المديرين' : 'Managers', exact: true })).toHaveAttribute('aria-current', 'page');
      await page.getByRole('button', { name: locale === 'ar' ? 'إضافة مدير' : 'Add manager', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel(locale === 'ar' ? 'كلمة المرور' : 'Password', { exact: true })).toHaveValue('');
      await expect(dialog.getByRole('checkbox', { name: locale === 'ar' ? 'عرض المتجر' : 'View store', exact: true })).toBeChecked();
      await expect(dialog.getByRole('checkbox', { name: locale === 'ar' ? 'عرض المتجر' : 'View store', exact: true })).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).include('.ws-manager-dialog[open]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')), results.violations.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
      await dialog.getByRole('button', { name: locale === 'ar' ? 'إلغاء' : 'Cancel', exact: true }).click();
      await expect(dialog).not.toBeVisible();
    });
  }
}

test('Editing permissions preserves the concurrency token and omits a blank password', async ({ page }) => {
  const api = await workspace(page, 'en');
  await page.goto('/store/settings/managers');
  await page.getByRole('button', { name: 'Edit Catalog Manager', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: 'Manage products', exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(api.mutations).toHaveLength(1);
  expect(api.mutations[0]).toMatchObject({ method: 'PUT', path: '/my-store/managers/5', data: { version: 'a'.repeat(64), permissions: ['store.view'], is_active: true } });
  expect(api.mutations[0]!.data).not.toHaveProperty('password');
});

test('Opening and cancelling removal never submits a mutation', async ({ page }) => {
  const api = await workspace(page, 'en');
  await page.goto('/store/settings/managers');
  await page.getByRole('button', { name: 'Remove Catalog Manager', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('sessions signed out');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(api.mutations).toEqual([]);
});

test('A settings manager never fetches owner account administration', async ({ page }) => {
  const api = await workspace(page, 'en', true);
  await page.goto('/store/settings/managers');
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(api.reads).not.toContain('/my-store/managers');
  expect(api.mutations).toEqual([]);
});

for (const width of [1440, 320]) {
  test(`Dark Arabic manager dialog stays accessible at ${width}px`, async ({ page }) => {
    const api = await workspace(page, 'ar', false, 'dark');
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/store/settings/managers');
    await page.getByRole('button', { name: 'إضافة مدير', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).include('.ws-manager-dialog[open]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')), result.violations.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
    await dialog.getByRole('button', { name: 'إلغاء', exact: true }).click();
    await page.getByRole('button', { name: 'إضافة مدير', exact: true }).click();
    expect(await dialog.evaluate(element => element.scrollTop)).toBe(0);
    expect(api.mutations).toEqual([]);
  });
}
