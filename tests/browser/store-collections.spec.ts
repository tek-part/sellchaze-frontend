import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fully intercepted merchant API: these tests never contact a real backend.
type Json = Record<string, unknown>;
const PERMISSIONS = ['store.view', 'categories-list', 'categories-create', 'categories-edit', 'categories-delete', 'products-list'];
const PRODUCTS = [
  { id: 1, name: 'Red Runner', sku: 'RR-1', price: '150.00', image_url: null },
  { id: 2, name: 'Blue Tote', sku: 'BT-2', price: '40.00', image_url: null },
];
const ROWS = [
  { id: 4, title: 'Summer picks', handle: 'summer-picks', type: 'manual', published: true, products_count: 2, sort_order: 'manual', image_url: null, updated_at: '2026-10-20T10:00:00Z' },
  { id: 5, title: 'Premium', handle: 'premium', type: 'automated', published: false, products_count: 7, sort_order: 'price_desc', image_url: null, updated_at: '2026-10-21T10:00:00Z' },
];

async function workspace(page: Page, locale: 'ar' | 'en') {
  const lists: Array<Record<string, string>> = [];
  const writes: Array<{ path: string; body: Json }> = [];
  const previews: Json[] = [];
  let created: Json | null = null;
  await page.addInitScript(locale => { localStorage.setItem('sellchase_access_token', 'isolated-collections-review'); localStorage.setItem('sellchase_locale', locale); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Collections fixture', roles: ['Merchant'], permissions: PERMISSIONS, is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Collections store', slug: 'fixture', status: 'active', currency: 'USD', default_locale: locale, supported_locales: ['ar', 'en'] } }, headers });
    if (path === '/my-store/catalog/collections/rule-options') return route.fulfill({ json: { data: { categories: [{ id: 3, name: 'Shoes', parent_id: null }], brands: [{ id: 8, name: 'Nike' }], tags: ['summer'] } }, headers });
    if (path === '/my-store/catalog/collections/preview') {
      const body = req.postDataJSON() as Json; previews.push(body);
      return route.fulfill({ json: { data: [PRODUCTS[0]], meta: { total: 1, limit: 50 } }, headers });
    }
    if (path === '/my-store/catalog/products') {
      const q = (url.searchParams.get('search') || '').toLowerCase();
      return route.fulfill({ json: { data: PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || q === ''), meta: { current_page: 1, last_page: 1, total: 2, per_page: 8 } }, headers });
    }
    if (path === '/my-store/catalog/collections' && req.method() === 'GET') {
      lists.push(Object.fromEntries(url.searchParams.entries()));
      const type = url.searchParams.get('type'); const search = (url.searchParams.get('search') || '').toLowerCase();
      const data = ROWS.filter(row => (!type || row.type === type) && (!search || row.title.toLowerCase().includes(search)));
      return route.fulfill({ json: { data, meta: { current_page: 1, last_page: 1, per_page: 25, total: data.length } }, headers });
    }
    if (path === '/my-store/catalog/collections' && req.method() === 'POST') {
      const body = req.postDataJSON() as Json; writes.push({ path, body });
      const products = ((body.product_ids as number[] | undefined) ?? []).map(id => PRODUCTS.find(p => p.id === id));
      created = { id: 9, title: body.title, handle: body.handle ?? 'generated', description: body.description ?? '', type: body.type, match: body.match ?? 'all', rules: body.rules ?? [], sort_order: body.sort_order, published: body.published, seo_title: null, seo_description: null, products, products_count: products.length, image_url: null };
      return route.fulfill({ status: 201, json: { data: created }, headers });
    }
    if (path === '/my-store/catalog/collections/9' && created) return route.fulfill({ json: { data: created }, headers });
    if (req.method() !== 'GET') { writes.push({ path, body: {} }); return route.fulfill({ status: 422, json: { message: `Unexpected write ${path}` }, headers }); }
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { lists, writes, previews };
}

async function noOverflowAndAccessible(page: Page, selector: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
}

for (const locale of ['ar', 'en'] as const) {
  const ar = locale === 'ar';

  test(`collections list sends type and search filters in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/collections');
    await expect(page.getByRole('heading', { name: ar ? 'المجموعات' : 'Collections', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Summer picks', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Premium', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: ar ? 'تلقائية' : 'Automated' }).click();
    await expect(page.getByRole('link', { name: 'Summer picks', exact: true })).toHaveCount(0);
    await expect.poll(() => api.lists.at(-1)?.type).toBe('automated');
    await page.getByRole('searchbox').fill('prem');
    await expect.poll(() => api.lists.at(-1)?.search).toBe('prem');
    expect(api.lists.at(-1)).toMatchObject({ type: 'automated', search: 'prem', page: '1' });
    expect(api.writes).toEqual([]);
  });

  test(`creating a manual collection posts ordered products in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/collections/new');
    await page.getByLabel(ar ? 'العنوان *' : 'Title *').fill('Summer picks');
    const search = page.getByLabel(ar ? 'ابحث عن منتجات لإضافتها' : 'Search products to add');
    await search.fill('e');
    await page.getByRole('button', { name: `${ar ? 'إضافة' : 'Add'} Red Runner` }).click();
    await page.getByRole('button', { name: `${ar ? 'إضافة' : 'Add'} Blue Tote` }).click();
    await page.getByRole('button', { name: `${ar ? 'تحريك لأعلى' : 'Move up'}: Blue Tote` }).click();
    await expect(page.locator('[data-collection-products] li').first()).toContainText('Blue Tote');
    await page.getByRole('button', { name: ar ? 'حفظ' : 'Save', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: ar ? 'تم حفظ المجموعة.' : 'Collection saved.' })).toBeVisible();
    await expect(page).toHaveURL(/\/store\/collections\/9$/);
    expect(api.writes).toHaveLength(1);
    expect(api.writes[0].body).toMatchObject({ title: 'Summer picks', handle: 'summer-picks', type: 'manual', published: true, sort_order: 'manual', product_ids: [2, 1] });
    expect(api.writes[0].body).not.toHaveProperty('rules');
  });

  test(`automated rule builder previews and saves the right rules in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/collections/new');
    await page.getByLabel(ar ? 'العنوان *' : 'Title *').fill('Premium shoes');
    await page.getByRole('radio', { name: new RegExp(ar ? '^تلقائية' : '^Automated') }).check();
    await page.getByLabel(`${ar ? 'حقل الشرط' : 'Condition field'} 1`).selectOption('price');
    await page.getByLabel(`${ar ? 'عامل الشرط' : 'Condition operator'} 1`).selectOption('gt');
    await page.getByLabel(`${ar ? 'قيمة الشرط' : 'Condition value'} 1`).fill('100');
    await page.getByRole('button', { name: ar ? 'إضافة شرط' : 'Add condition' }).click();
    await page.getByLabel(`${ar ? 'حقل الشرط' : 'Condition field'} 2`).selectOption('category');
    await page.getByLabel(`${ar ? 'قيمة الشرط' : 'Condition value'} 2`).selectOption('3');
    await page.getByRole('radio', { name: ar ? 'أي شرط' : 'any condition' }).check();
    const expectedRules = [{ field: 'price', operator: 'gt', value: '100' }, { field: 'category', operator: 'is', value: '3' }];
    await expect.poll(() => JSON.stringify(api.previews.at(-1))).toBe(JSON.stringify({ rules: expectedRules, match: 'any', sort_order: 'best_selling' }));
    await expect(page.locator('[data-collection-preview]')).toContainText(ar ? '1 منتج مطابق' : '1 matching products');
    await expect(page.locator('[data-collection-preview]')).toContainText('Red Runner');
    await page.getByLabel(ar ? 'ترتيب المنتجات' : 'Product order').selectOption('price_desc');
    await page.getByRole('button', { name: ar ? 'حفظ' : 'Save', exact: true }).click();
    await expect(page).toHaveURL(/\/store\/collections\/9$/);
    expect(api.writes[0].body).toMatchObject({ title: 'Premium shoes', type: 'automated', match: 'any', sort_order: 'price_desc', rules: expectedRules });
    expect(api.writes[0].body).not.toHaveProperty('product_ids');
  });

  test(`collections pages fit 390px without serious accessibility issues in ${locale}`, async ({ page }) => {
    await workspace(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/collections');
    await expect(page.getByRole('link', { name: 'Summer picks', exact: true })).toBeVisible();
    await noOverflowAndAccessible(page, '.ws-catalog-page');
    await page.goto('/store/collections/new');
    await page.getByRole('radio', { name: new RegExp(ar ? '^تلقائية' : '^Automated') }).check();
    await page.getByLabel(`${ar ? 'قيمة الشرط' : 'Condition value'} 1`).fill('Red');
    await expect(page.locator('[data-collection-preview]')).toContainText('Red Runner');
    await noOverflowAndAccessible(page, '.ws-collection-editor');
  });
}
