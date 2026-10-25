import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// Discounts v2 browser contracts. Every API call is intercepted with synthetic data: no account,
// store, discount or order is created anywhere.
type Locale = 'ar' | 'en';
const CATEGORIES = [{ id: 7, name: 'Tops' }, { id: 8, name: 'Shoes' }];
const PRODUCTS = [{ id: 3, name: 'Linen tee' }, { id: 4, name: 'Canvas cap' }];
const DISCOUNTS = [
  { id: 11, method: 'automatic', code: null, title: 'Autumn sale', type: 'percentage', value: '10.00', applies_to: 'categories', target_ids: [7], minimum_quantity: 3, minimum_order_amount: null, bxgy: null, starts_at: null, expires_at: null, max_uses: null, max_uses_per_customer: null, is_active: true, used_count: 4 },
  { id: 12, method: 'code', code: 'BOGO', title: null, type: 'buy_x_get_y', value: '0.00', applies_to: 'all', target_ids: [], minimum_quantity: null, minimum_order_amount: null, bxgy: { buy_quantity: 2, buy_applies_to: 'all', buy_ids: [], get_quantity: 1, get_applies_to: 'all', get_ids: [], get_percent: 100 }, starts_at: null, expires_at: null, max_uses: 100, max_uses_per_customer: 1, is_active: true, used_count: 0 },
  { id: 13, method: 'automatic', code: null, title: 'Ship free', type: 'free_shipping', value: '0.00', applies_to: 'all', target_ids: [], minimum_quantity: null, minimum_order_amount: '50.00', bxgy: null, starts_at: null, expires_at: null, max_uses: null, max_uses_per_customer: null, is_active: true, used_count: 9 },
];

async function dashboard(page: Page, locale: Locale, reject = false) {
  const posts: Array<Record<string, unknown>> = [];
  const lists: URLSearchParams[] = [];
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-discounts-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.method() !== 'GET') {
      expect(`${request.method()} ${path}`).toBe('POST /my-store/coupons');
      const body = request.postDataJSON() as Record<string, unknown>; posts.push(body);
      if (reject) return route.fulfill({ status: 422, json: { message: 'The given data was invalid.', errors: { title: ['The title field is required when method is automatic.'], 'target_ids.0': ['The selected target_ids.0 is invalid.'] } }, headers });
      return route.fulfill({ status: 201, json: { data: { id: 99, ...body } }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Discount fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: [], is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local discount fixture', slug: 'fixture', status: 'active', currency: 'USD' } }, headers });
    if (path === '/my-store/coupons') {
      lists.push(url.searchParams);
      const method = url.searchParams.get('method'); const type = url.searchParams.get('type');
      const rows = DISCOUNTS.filter((row) => (!method || row.method === method) && (!type || row.type === type));
      return route.fulfill({ json: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 25, total: rows.length } }, headers });
    }
    const catalog = path === '/my-store/catalog/categories' ? CATEGORIES : path === '/my-store/catalog/products' ? PRODUCTS : null;
    if (catalog) {
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const rows = catalog.filter((row) => row.name.toLowerCase().includes(search));
      return route.fulfill({ json: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 100, total: rows.length } }, headers });
    }
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { posts, lists };
}

async function healthy(page: Page, include: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`creates an automatic percentage discount for a category (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/coupons/new');
    await expect(page.getByRole('heading', { level: 1, name: t('إنشاء خصم', 'Create discount') })).toBeVisible();

    await page.getByRole('radio', { name: new RegExp(`^${t('خصم تلقائي', 'Automatic discount')}`) }).check();
    await page.getByLabel(t('عنوان الخصم', 'Title'), { exact: true }).fill('Autumn sale');
    await page.getByLabel(t('نسبة الخصم (%)', 'Percentage (%)')).fill('10');
    await page.locator('input[name="applies_to"][value="categories"]').check();
    const picker = page.getByRole('combobox', { name: t('ينطبق على: الأقسام', 'Applies to: categories') });
    await picker.click(); await picker.fill('Top');
    await page.getByRole('option', { name: 'Tops' }).click();
    await expect(page.getByRole('button', { name: `${t('إزالة', 'Remove')} Tops` })).toBeVisible();
    await page.getByRole('radio', { name: t('حد أدنى لعدد القطع', 'Minimum quantity of items') }).check();
    await page.getByRole('spinbutton', { name: t('أقل عدد قطع', 'Minimum quantity of items') }).fill('3');
    await expect(page.locator('[data-discount-summary]')).toHaveText(t('خصم 10% على Tops · حد أدنى 3 قطع', '10% off Tops · min 3 items'));
    await healthy(page, 'main');

    await page.getByRole('button', { name: t('حفظ الخصم', 'Save discount') }).click();
    await expect.poll(() => api.posts.length).toBe(1);
    expect(api.posts[0]).toEqual({ method: 'automatic', code: null, title: 'Autumn sale', type: 'percentage', value: '10', applies_to: 'categories', target_ids: [7],
      minimum_order_amount: null, minimum_quantity: 3, bxgy: null, starts_at: null, expires_at: null, max_uses: null, max_uses_per_customer: null, is_active: true });
    await expect(page).toHaveURL(/\/store\/coupons$/);
  });

  test(`creates a buy X get Y code (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/store/coupons/new');
    const code = page.getByLabel(t('كود الخصم', 'Discount code'), { exact: true });
    await page.getByRole('button', { name: t('توليد', 'Generate') }).click();
    await expect(code).toHaveValue(/^[A-HJ-NP-Z2-9]{8}$/);
    await code.fill('bogo');
    await page.getByRole('radio', { name: new RegExp(`^${t('اشترِ X واحصل على Y', 'Buy X get Y')}`) }).check();
    await expect(page.getByLabel(t('نسبة الخصم (%)', 'Percentage (%)'))).toHaveCount(0);
    await page.getByLabel(t('الكمية', 'Quantity'), { exact: true }).first().fill('2');
    await page.locator('input[name="buy_applies_to"][value="products"]').check();
    const picker = page.getByRole('combobox', { name: t('من: المنتجات', 'From: products') });
    await picker.click(); await picker.fill('linen');
    await page.getByRole('option', { name: 'Linen tee' }).click();
    await page.getByLabel(t('أقصى عدد مرات لكل طلب (اختياري)', 'Maximum uses per order (optional)')).fill('1');
    await expect(page.locator('[data-discount-summary]')).toHaveText(t('اشترِ 2 من Linen tee واحصل على 1 مجانًا · حتى 1 مرات لكل طلب', 'Buy 2 from Linen tee get 1 free · up to 1 per order'));
    await healthy(page, 'main');

    await page.getByRole('button', { name: t('حفظ الخصم', 'Save discount') }).click();
    await expect.poll(() => api.posts.length).toBe(1);
    expect(api.posts[0]).toMatchObject({ method: 'code', code: 'BOGO', title: null, type: 'buy_x_get_y', value: null, applies_to: 'all', target_ids: null, minimum_quantity: null, minimum_order_amount: null,
      bxgy: { buy_quantity: 2, buy_applies_to: 'products', buy_ids: [3], get_quantity: 1, get_applies_to: 'all', get_ids: null, get_percent: 100, max_uses_per_order: 1 } });
  });

  test(`lists discounts with summaries and filters by method and type (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/coupons');
    await expect(page.getByRole('heading', { level: 1, name: t('الخصومات', 'Discounts') })).toBeVisible();
    const table = page.locator('.ws-dt-card');
    await expect(table.getByText(t('خصم 10% على Tops · حد أدنى 3 قطع', '10% off Tops · min 3 items'))).toBeVisible();
    await expect(table.getByText(t('اشترِ 2 واحصل على 1 مجانًا', 'Buy 2 get 1 free'), { exact: true })).toBeVisible();
    await expect(table.getByText(t('شحن مجاني للطلبات فوق', 'Free shipping over'))).toBeVisible();
    await expect(table.getByRole('link', { name: 'Autumn sale' }).first()).toBeVisible();
    await healthy(page, '.ws-catalog-page');

    await page.getByRole('tab', { name: t('تلقائية', 'Automatic'), exact: true }).click();
    await expect.poll(() => api.lists.at(-1)?.get('method')).toBe('automatic');
    await expect(table.getByText('BOGO')).toHaveCount(0);

    await page.goto('/store/coupons?f.type=buy_x_get_y');
    await expect.poll(() => api.lists.at(-1)?.get('type')).toBe('buy_x_get_y');
    await expect(table.getByRole('link', { name: 'BOGO' }).first()).toBeVisible();
    await expect(table.getByText('Autumn sale')).toHaveCount(0);
  });
}

test('shows server validation errors on their fields', async ({ page }) => {
  const api = await dashboard(page, 'en', true);
  await page.goto('/store/coupons/new');
  await page.getByRole('radio', { name: /^Automatic discount/ }).check();
  await page.getByLabel('Percentage (%)').fill('10');
  await page.locator('input[name="applies_to"][value="categories"]').check();
  const picker = page.getByRole('combobox', { name: 'Applies to: categories' });
  await picker.click(); await page.getByRole('option', { name: 'Shoes' }).click();
  await page.getByRole('button', { name: 'Save discount' }).click();
  await expect.poll(() => api.posts.length).toBe(1);
  await expect(page.getByRole('alert')).toContainText('Fix the highlighted fields.');
  await expect(page.getByLabel('Title', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#discount-title-error')).toHaveText('The title field is required when method is automatic.');
  await expect(picker).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#discount-applies_to-picker-error')).toHaveText('The selected target_ids.0 is invalid.');
  await expect(page).toHaveURL(/\/store\/coupons\/new$/);
});

/* ---- storefront checkout ---- */
const STORE_ID = 7654321;
const field = (key: string, en: string, ar: string, required = true) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required, position: 0 });
const lines = [{ id: 'line-1', productId: '700', title: 'Synthetic linen shirt', url: '/products/synthetic-shirt', price: 100, currency: 'USD', quantity: 3 }];

async function storefront(page: Page, locale: Locale): Promise<{ quotes: number }> {
  const seen = { quotes: 0 };
  await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [`sf-cart-v2:${STORE_ID}:USD`, JSON.stringify({ version: 2, storeId: String(STORE_ID), currency: 'USD', lines })]);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false, merchant_information: { email: '', phone: '', address: '', policies: [] } }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path.endsWith('/payment-methods')) return route.fulfill({ json: { data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: false }] } });
    if (path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان')], requires_shipping: true, has_digital: false,
      shipping: { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '0', free_over: null, regions: [], options: [
        { id: 'standard', name: { en: 'Standard delivery', ar: 'توصيل عادي' }, description: { en: '3–5 business days', ar: 'من 3 إلى 5 أيام عمل' }, rate: '50', icon_url: null, enabled: true, priority: 1, is_default: false },
      ] } } });
    if (path.endsWith('/checkout/quote')) {
      seen.quotes++;
      return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: true, offer_free_shipping: true,
        items: [{ product_id: 700, variant_id: null, name: 'Synthetic linen shirt', quantity: 3, unit_price: '100.00', line_total: '300.00' }],
        discounts: [
          { id: 11, title: 'Autumn sale', code: null, method: 'automatic', type: 'percentage', amount: '30.00' },
          { id: 13, title: 'Ship free', code: null, method: 'automatic', type: 'free_shipping', amount: '0.00' },
        ],
        totals: { subtotal: '300.00', discount_total: '30.00', shipping_total: '0.00', tax_total: '0.00', grand_total: '270.00' } } } });
    }
    if (request.method() !== 'GET') return route.abort();
    return route.fulfill({ json: { data: [] } });
  });
  return seen;
}

for (const locale of ['en', 'ar'] as const) {
  test(`checkout lists each applied discount by title (${locale})`, async ({ page }) => {
    const seen = await storefront(page, locale);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    const ar = locale === 'ar';
    await page.getByLabel(ar ? 'الاسم الكامل *' : 'Full name *').fill('Synthetic Buyer');
    await page.getByLabel(ar ? 'رقم الهاتف *' : 'Phone *').fill('+201000000000');
    await page.getByLabel(ar ? 'المدينة *' : 'City *').fill('Cairo');
    await page.getByLabel(ar ? 'العنوان *' : 'Address *').fill('1 Synthetic Street');
    await page.getByRole('radio', { name: ar ? /توصيل عادي/ : /Standard delivery/ }).check();
    await page.getByRole('radio', { name: ar ? /الدفع عند الاستلام/ : /Cash on delivery/ }).check();
    await expect.poll(() => seen.quotes).toBeGreaterThan(0);

    const rows = page.locator('.sf-co__summary [data-discount-line]');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText('Autumn sale');
    await expect(rows.nth(0)).toContainText('−');
    await expect(rows.nth(0)).toContainText('30.00');
    await expect(rows.nth(1)).toContainText('Ship free');
    await expect(rows.nth(1)).toContainText(ar ? 'شحن مجاني' : 'Free shipping');
    await expect(page.locator('.sf-co__summary .sf-co-total')).toContainText('270');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.sf-co-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => v.id)).toEqual([]);
  });
}
