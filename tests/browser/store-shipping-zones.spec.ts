import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// Shipping and taxes v2 dashboard contracts. Every API call is intercepted with synthetic data:
// no account, store, zone, tax rule or order is created anywhere.
type Locale = 'ar' | 'en';

const SETTINGS = { version: 3, shipping_enabled: true, shipping_flat_rate: '25.00', shipping_free_over: null, tax_enabled: true, tax_rate: '14.000', tax_prices_include: true, tax_shipping: false, zones_enabled: false,
  regions_enabled: false, auto_select_region: true, regions: [], options: [] };
const LEGACY_ZONE = { id: 'default', implicit: true, shipping_enabled: true, countries: [], regions: [], rates: [{ id: null, name: null, type: 'flat', price: '25.00', free_over: null }] };

async function dashboard(page: Page, locale: Locale) {
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  const zones: Array<Record<string, unknown>> = [];
  const overrides: Array<Record<string, unknown>> = [];
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-shipping-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.method() !== 'GET') {
      const body = request.postDataJSON() as Record<string, unknown>; writes.push({ path: `${request.method()} ${path}`, body });
      if (path === '/my-store/shipping/zones') {
        const rates = (body.rates as Array<Record<string, unknown>>).map((rate, index) => ({ ...rate, id: `00000000-0000-4000-8000-00000000000${index + 1}`, amount: rate.price, position: index }));
        const zone = { ...body, id: '11111111-1111-4111-8111-111111111111', position: 0, rates }; zones.push(zone);
        return route.fulfill({ status: 201, json: { data: zone, warnings: [] }, headers });
      }
      if (path === '/my-store/shipping/tax-overrides') {
        const row = { ...body, id: '22222222-2222-4222-8222-222222222222', rate: '14.000' }; overrides.push(row);
        return route.fulfill({ status: 201, json: { data: row }, headers });
      }
      if (path === '/my-store/shipping/quote-preview') {
        return route.fulfill({ json: { data: { available: true, mode: 'zone', zone: { id: zones[0]?.id, name: { ar: 'الخليج', en: 'Gulf' } }, region: null,
          rate: { id: 'heavy', name: { ar: 'ثقيل', en: 'Heavy' }, type: 'weight' }, cod_fee: '10.00', free_shipping_applied: false,
          rates: [{ id: 'heavy', name: { ar: 'ثقيل', en: 'Heavy' }, type: 'weight', price: '200.00', amount: '200.00', free_over: null, cod_fee: '10.00', delivery_time: { ar: '٥ أيام', en: '5 days' } }],
          tax: { name: { ar: 'ضريبة القيمة المضافة', en: 'VAT' }, rate: '15.000', included: true, shipping: false, source: 'override', amount: '65.22' },
          totals: { subtotal: '500.00', discount_total: '0.00', shipping_total: '210.00', tax_total: '65.22', grand_total: '710.00' } } }, headers });
      }
      return route.fulfill({ status: 500, json: { message: `Unexpected ${request.method()} ${path}` }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Shipping fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: [], is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local shipping fixture', slug: 'fixture', status: 'active', currency: 'USD', country: 'EG' } }, headers });
    if (path === '/my-store/shipping') return route.fulfill({ json: { data: SETTINGS }, headers });
    if (path === '/my-store/shipping/zones') return route.fulfill({ json: { data: { mode: zones.length ? 'zones' : 'legacy', zones, legacy_zone: LEGACY_ZONE, tax_overrides: overrides, tax_shipping: false } }, headers });
    if (path === '/my-store/carriers/bosta') return route.fulfill({ json: { data: { enabled: false, has_api_key: false, verified: false, pickup_location_id: null, pickup_locations: [] } }, headers });
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { writes };
}

async function healthy(page: Page, include: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`creates a weight-band zone, a tax override and tests a quote (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/settings/shipping');
    await expect(page.getByRole('heading', { level: 1, name: t('إعدادات الشحن والضريبة', 'Shipping & tax') })).toBeVisible();
    const zonesCard = page.locator('[data-shipping-zones]');
    await expect(zonesCard.getByRole('article', { name: t('المنطقة الافتراضية', 'Default zone') })).toContainText('25.00');
    await expect(page.getByText(t('احتساب الضريبة على الشحن', 'Charge tax on shipping'))).toBeVisible();

    await zonesCard.getByRole('button', { name: t('إضافة منطقة', 'Add zone') }).click();
    const editor = page.locator('[data-zone-editor]');
    await editor.getByLabel(t('اسم المنطقة بالعربية', 'Zone name in Arabic')).fill('الخليج');
    await editor.getByLabel(t('اسم المنطقة بالإنجليزية', 'Zone name in English')).fill('Gulf');
    await editor.getByLabel(t('إضافة دولة', 'Add country')).selectOption('SA');
    await editor.getByLabel(t('إضافة دولة', 'Add country')).selectOption('AE');
    await expect(editor.getByRole('list', { name: t('دول المنطقة', 'Zone countries') }).getByRole('listitem')).toHaveCount(2);
    const rate = editor.locator('[data-rate-editor]').first();
    await rate.getByLabel(t('اسم السعر بالعربية', 'Rate name in Arabic')).fill('ثقيل');
    await rate.getByLabel(t('اسم السعر بالإنجليزية', 'Rate name in English')).fill('Heavy');
    await rate.getByLabel(t('نوع السعر', 'Rate type')).selectOption('weight');
    await rate.getByLabel(t('أقل وزن (جم)', 'Minimum weight (g)')).fill('2000');
    await rate.getByLabel(t('أقصى وزن (جم، اختياري)', 'Maximum weight (g, optional)')).fill('10000');
    await rate.getByLabel(new RegExp(t('سعر الشحن', 'Shipping price'))).fill('200');
    await rate.getByLabel(t('رسوم الدفع عند الاستلام (اختياري)', 'Cash on delivery fee (optional)')).fill('10');
    await rate.getByLabel(t('مدة التوصيل بالعربية', 'Delivery time in Arabic')).fill('٥ أيام');
    await rate.getByLabel(t('مدة التوصيل بالإنجليزية', 'Delivery time in English')).fill('5 days');
    await healthy(page, '[data-shipping-zones]');

    await editor.getByRole('button', { name: t('حفظ المنطقة', 'Save zone') }).click();
    await expect.poll(() => api.writes.length).toBe(1);
    expect(api.writes[0]).toEqual({ path: 'POST /my-store/shipping/zones', body: { name: { ar: 'الخليج', en: 'Gulf' }, countries: ['SA', 'AE'], regions: [], enabled: true,
      rates: [{ name: { ar: 'ثقيل', en: 'Heavy' }, type: 'weight', min_subtotal: null, max_subtotal: null, min_weight_grams: 2000, max_weight_grams: 10000,
        price: '200', free_over: null, delivery_time: { ar: '٥ أيام', en: '5 days' }, cod_fee: '10', enabled: true }] } });
    const saved = zonesCard.getByRole('article', { name: t('الخليج', 'Gulf') });
    await expect(saved).toContainText(t('وزن 2000–10000 جم', 'weight 2000–10000 g'));
    await expect(zonesCard.getByRole('article', { name: t('المنطقة الافتراضية', 'Default zone') })).toContainText(t('غير مستخدمة', 'Not in use'));

    await page.getByRole('button', { name: t('إضافة ضريبة', 'Add tax override') }).click();
    const tax = page.getByRole('form', { name: t('ضريبة خاصة', 'Tax override') });
    await tax.getByLabel(t('الدولة', 'Country'), { exact: true }).selectOption('EG');
    await tax.getByLabel(t('نسبة الضريبة %', 'Tax rate %')).fill('14');
    await tax.getByLabel(t('اسم الضريبة بالعربية', 'Tax name in Arabic')).fill('ضريبة القيمة المضافة');
    await tax.getByLabel(t('اسم الضريبة بالإنجليزية', 'Tax name in English')).fill('VAT');
    await tax.getByRole('button', { name: t('حفظ الضريبة', 'Save tax override') }).click();
    await expect.poll(() => api.writes.length).toBe(2);
    expect(api.writes[1]).toEqual({ path: 'POST /my-store/shipping/tax-overrides', body: { country: 'EG', region_id: null, name: { ar: 'ضريبة القيمة المضافة', en: 'VAT' }, rate: '14', enabled: true } });
    await expect(page.locator('strong', { hasText: t('ضريبة القيمة المضافة', 'VAT') })).toBeVisible();

    const preview = page.getByRole('form', { name: t('تجربة حساب الشحن', 'Test a quote') });
    await preview.getByLabel(t('الدولة', 'Country'), { exact: true }).selectOption('SA');
    await preview.getByLabel(new RegExp(t('قيمة المنتجات', 'Products subtotal'))).fill('500');
    await preview.getByLabel(t('وزن السلة (جم)', 'Cart weight (g)')).fill('2500');
    await preview.getByRole('button', { name: t('احسب', 'Calculate') }).click();
    await expect.poll(() => api.writes.length).toBe(3);
    expect(api.writes[2]).toEqual({ path: 'POST /my-store/shipping/quote-preview', body: { country: 'SA', region_id: null, subtotal: '500', weight_grams: 2500, payment_method: 'cod' } });
    const result = page.locator('[data-quote-preview]');
    await expect(result).toContainText(t('الخليج', 'Gulf'));
    await expect(result).toContainText(t('ثقيل', 'Heavy'));
    await expect(result.locator('[data-tax-line]')).toContainText(t('ضريبة القيمة المضافة 15% (شاملة)', 'VAT 15% (included)'));
    await healthy(page, '[data-shipping-zones]');
  });
}
