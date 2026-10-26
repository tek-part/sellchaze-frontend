import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// G4 analytics browser contracts (#49 product funnel, #7 products ordered on a day, #50 freelancer
// analytics). Every API call is intercepted with synthetic data: nothing is created or sent anywhere.
type Locale = 'ar' | 'en';
const DASHBOARD = {
  period: { from: '2026-10-19', to: '2026-10-26', timezone: 'Africa/Cairo' }, currency: 'EGP',
  summary: { visits: 0, orders: 0, average_order_value: '0.00', add_to_cart: 0, checkout_started: 0, cross_sell: 0, new_orders: 0, missed_orders: 0, conversion_rate: '0.00', conversion_with_missed_rate: '0.00', total_sales: '0.00', net_profit: '0.00' },
  daily: [], low_stock: [], top_products: [], funnel: { visits: 0, started: 0, purchased: 0, start_rate: '0.00', purchase_rate: '0.00', cross_sell_rate: '0.00' }, tracking_started_at: null, profit_complete: true,
};
const ORDERED = { date: '2026-10-26', timezone: 'Africa/Cairo', totals: { quantity: 5, orders: 3, products: 2 }, items: [
  { product_id: 7, name: 'Linen shirt', variant_id: 11, variant_name: 'Red / M', sku: 'LS-R-M', options: [{ name: 'color', value: 'Red' }, { name: 'size', value: 'M' }], quantity: 3, orders: 2 },
  { product_id: 8, name: 'Canvas bag', variant_id: null, variant_name: null, sku: null, options: [], quantity: 2, orders: 1 },
] };
const row = (product_id: number, name: string, views: number, carts: number, checkouts: number, orders: number, revenue: string) => ({ product_id, name, views, carts, cart_units: carts, checkouts, orders, units: orders, revenue,
  cart_rate: views ? (carts * 100 / views).toFixed(2) : null, checkout_rate: views ? (checkouts * 100 / views).toFixed(2) : null, conversion_rate: views ? (orders * 100 / views).toFixed(2) : null });
const funnel = (from: string, to: string, source: string | null) => ({ period: { from, to, timezone: 'Africa/Cairo' }, currency: 'EGP', filters: source ? { utm_source: source } : {},
  totals: row(0, '', source ? 40 : 120, source ? 8 : 30, source ? 4 : 12, source ? 2 : 6, source ? '600.00' : '1800.00'),
  products: source ? [row(7, 'Linen shirt', 40, 8, 4, 2, '600.00')] : [row(7, 'Linen shirt', 100, 25, 10, 5, '1500.00'), row(8, 'Canvas bag', 20, 5, 2, 1, '300.00')],
  truncated: false, options: { utm_source: ['facebook', 'tiktok'], utm_medium: ['paid'], utm_campaign: ['autumn'] }, tracking_started_on: '2026-10-01' });

async function dashboard(page: Page, locale: Locale) {
  const calls: Array<{ path: string; params: Record<string, string> }> = [];
  await page.clock.setFixedTime(new Date('2026-10-26T10:00:00Z'));
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-analytics-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(request.method()).toBe('GET');
    const params = Object.fromEntries(url.searchParams); calls.push({ path, params });
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Analytics fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: [], is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local analytics fixture', slug: 'fixture', status: 'active', currency: 'EGP', timezone: 'Africa/Cairo' } }, headers });
    // The onboarding guide is outside this contract; it reports itself unavailable.
    if (path === '/my-store/dashboard-guide') return route.fulfill({ status: 403, json: { message: 'Not part of this fixture.' }, headers });
    if (path === '/my-store/analytics/dashboard') return route.fulfill({ json: { data: DASHBOARD }, headers });
    if (path === '/my-store/analytics/ordered-products') return route.fulfill({ json: { data: params.date && params.date !== '2026-10-26' ? { ...ORDERED, date: params.date, items: [], totals: { quantity: 0, orders: 0, products: 0 } } : ORDERED }, headers });
    if (path === '/my-store/analytics/ordered-products/export') return route.fulfill({ status: 200, body: '﻿Product,Variant\n', headers: { ...headers, 'Content-Type': 'text/csv; charset=UTF-8' } });
    if (path === '/my-store/analytics/product-funnel') return route.fulfill({ json: { data: funnel(params.from || '2026-10-20', params.to || '2026-10-26', params.utm_source || null) }, headers });
    if (path === '/me/service-marketplace') return route.fulfill({ json: { provider: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', display_name: 'Fixture freelancer', headline: '', bio: '', country: '', skills: [], portfolio: [], contacts: {}, contacts_public: false, published: true, version: 1, avatar_path: null }, data: [] }, headers });
    if (path === '/me/service-marketplace/analytics') {
      const days = params.from === params.to ? [params.from] : ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'];
      return route.fulfill({ json: { data: { period: { from: params.from, to: params.to, timezone: params.timezone }, summary: { service_views: 9, profile_views: 4, contact_clicks: 2, unique_visitors: 6 },
        contact_channels: { email: 0, phone: 0, whatsapp: 2, telegram: 0 }, daily: days.map((date, index) => ({ date, service_views: index, profile_views: 1, contact_clicks: 0 })),
        services: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Landing page build', views: 9, contact_clicks: 2 }] } }, headers });
    }
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return calls;
}

async function healthy(page: Page, include: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`products ordered today lists variants, changes day and exports CSV (${locale})`, async ({ page }) => {
    const calls = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    const panel = page.getByRole('region', { name: t('المنتجات المطلوبة', 'Products ordered') });
    await expect(panel.getByRole('rowheader', { name: 'Linen shirt' })).toBeVisible();
    await expect(panel.getByText('Red / M')).toBeVisible();
    await expect(panel.getByText('color: Red')).toBeVisible();
    await expect(panel.getByLabel(t('يوم الطلبات', 'Order day'))).toHaveValue('2026-10-26');
    expect(calls.filter((call) => call.path === '/my-store/analytics/ordered-products')).toEqual([{ path: '/my-store/analytics/ordered-products', params: {} }]);
    await healthy(page, 'main');

    const download = page.waitForEvent('download');
    await panel.getByRole('button', { name: t('تصدير CSV', 'Export CSV') }).click();
    expect((await download).suggestedFilename()).toBe('ordered-products-2026-10-26.csv');
    expect(calls.find((call) => call.path.endsWith('/export'))?.params).toEqual({ date: '2026-10-26', locale });

    await panel.getByLabel(t('يوم الطلبات', 'Order day')).fill('2026-10-25');
    await expect(panel.getByText(t('لم تُطلب أي منتجات في هذا اليوم.', 'No products were ordered on this day.'))).toBeVisible();
    await expect(panel.getByRole('button', { name: t('تصدير CSV', 'Export CSV') })).toBeDisabled();
    await panel.getByRole('button', { name: t('اليوم', 'Today'), exact: true }).click();
    await expect(panel.getByRole('rowheader', { name: 'Canvas bag' })).toBeVisible();
  });

  test(`product funnel filters by period and traffic source (${locale})`, async ({ page }) => {
    const calls = await dashboard(page, locale);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');
    const report = page.getByRole('region', { name: t('مسار شراء المنتجات', 'Product funnel') });
    await expect(report.getByRole('rowheader', { name: 'Canvas bag' })).toBeVisible();
    await expect(report.getByRole('columnheader', { name: t('معدل التحويل', 'Conversion rate') })).toBeVisible();
    await expect(report.getByText(t('الإجمالي', 'Total'), { exact: true })).toBeVisible();
    // The first request uses the API default (last 7 days in the store timezone) and is not repeated.
    expect(calls.filter((call) => call.path === '/my-store/analytics/product-funnel')).toEqual([{ path: '/my-store/analytics/product-funnel', params: {} }]);
    await healthy(page, 'main');

    await report.getByLabel(t('مصدر الزيارات (utm_source)', 'Traffic source (utm_source)')).selectOption('facebook');
    await expect(report.getByRole('rowheader', { name: 'Canvas bag' })).toHaveCount(0);
    expect(calls.at(-1)?.params).toEqual({ from: '2026-10-20', to: '2026-10-26', utm_source: 'facebook' });
    await report.getByLabel(t('الفترة', 'Period')).selectOption('yesterday');
    await expect.poll(() => calls.at(-1)?.params).toEqual({ from: '2026-10-25', to: '2026-10-25', utm_source: 'facebook' });
    await report.getByLabel(t('الفترة', 'Period')).selectOption('custom');
    await report.getByLabel(t('من', 'From'), { exact: true }).fill('2026-10-10');
    await report.getByLabel(t('إلى', 'To'), { exact: true }).fill('2026-10-01');
    await expect(report.getByRole('status').filter({ hasText: t('اختر يومًا صحيحًا', 'Choose a valid day') })).toBeVisible();
    await report.getByLabel(t('إلى', 'To'), { exact: true }).fill('2026-10-12');
    await expect.poll(() => calls.at(-1)?.params).toEqual({ from: '2026-10-10', to: '2026-10-12', utm_source: 'facebook' });
  });

  test(`freelancer analytics offers today, yesterday, a day, 7 days, this month and custom (${locale})`, async ({ page }) => {
    const calls = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/manage');
    const section = page.getByRole('region', { name: t('إحصائيات خدماتي', 'My service analytics') });
    await expect(section.getByRole('rowheader', { name: 'Landing page build' })).toBeVisible();
    const last = () => calls.filter((call) => call.path === '/me/service-marketplace/analytics').at(-1)?.params;
    expect(last()).toMatchObject({ from: '2026-10-20', to: '2026-10-26' });
    expect(last()?.timezone).toBeTruthy();
    await healthy(page, 'main');
    const period = section.getByLabel(t('الفترة', 'Period'));
    await expect(period.locator('option')).toHaveText([t('اليوم', 'Today'), t('أمس', 'Yesterday'), t('يوم محدد', 'A specific day'), t('آخر 7 أيام', 'Last 7 days'), t('هذا الشهر', 'This month'), t('فترة مخصصة', 'Custom range')]);
    for (const [preset, from, to] of [['today', '2026-10-26', '2026-10-26'], ['yesterday', '2026-10-25', '2026-10-25'], ['month', '2026-10-01', '2026-10-26']] as const) {
      await period.selectOption(preset);
      await expect.poll(last).toMatchObject({ from, to });
    }
    await period.selectOption('day');
    await section.getByLabel(t('اليوم', 'Day'), { exact: true }).fill('2026-10-14');
    await expect.poll(last).toMatchObject({ from: '2026-10-14', to: '2026-10-14' });
    await period.selectOption('custom');
    await section.getByLabel(t('من', 'From'), { exact: true }).fill('2026-09-01');
    await section.getByLabel(t('إلى', 'To'), { exact: true }).fill('2026-09-30');
    await expect.poll(last).toMatchObject({ from: '2026-09-01', to: '2026-09-30' });
    await healthy(page, 'main');
  });
}
