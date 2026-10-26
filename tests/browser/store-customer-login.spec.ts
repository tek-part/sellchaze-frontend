import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// G2: merchant settings for storefront customer sign-in methods. Synthetic store; every API call is
// intercepted, so no store setting changes anywhere.
type Locale = 'ar' | 'en';
type Json = Record<string, unknown>;

async function workspace(page: Page, locale: Locale, ready: { whatsapp: boolean; google: boolean }) {
  const writes: Array<{ method: string; path: string; body: Json }> = [];
  let settings: Json = { phone_otp: false, google: false, version: 1, whatsapp_ready: ready.whatsapp, google_ready: ready.google, phone_otp_active: false, google_active: false };
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-customer-login-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.method() !== 'GET') {
      const body = (request.postDataJSON() ?? {}) as Json;
      writes.push({ method: request.method(), path, body });
      if (`${request.method()} ${path}` === 'PUT /my-store/customer-login') {
        settings = { ...settings, phone_otp: body.phone_otp, google: body.google, version: Number(body.version) + 1,
          phone_otp_active: Boolean(body.phone_otp) && ready.whatsapp, google_active: Boolean(body.google) && ready.google };
        return route.fulfill({ json: { data: settings }, headers });
      }
      return route.fulfill({ status: 404, json: { message: 'Unexpected write' }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Login fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: [], is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Synthetic boutique', slug: 'synthetic-boutique', status: 'active', currency: 'USD', default_locale: locale, supported_locales: ['en', 'ar'] } }, headers });
    if (path === '/my-store/customer-login') return route.fulfill({ json: { data: settings }, headers });
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return writes;
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`merchant turns on WhatsApp and Google sign-in (${locale})`, async ({ page }) => {
    const writes = await workspace(page, locale, { whatsapp: true, google: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/settings/customer-login');
    await expect(page.getByRole('heading', { level: 1, name: t('دخول العملاء', 'Customer login') })).toBeVisible();
    const phone = page.getByTestId('customer-login-phone');
    const google = page.getByTestId('customer-login-google');
    await expect(phone).toContainText(t('متوقف', 'Off'));
    await phone.getByRole('checkbox').check();
    await google.getByRole('checkbox').check();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.ws-customer-login').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    await page.getByRole('button', { name: t('حفظ إعدادات الدخول', 'Save login settings') }).click();
    await expect(page.getByRole('status').filter({ hasText: t('تم حفظ إعدادات دخول العملاء.', 'Customer login settings saved.') })).toBeVisible();
    await expect(phone).toContainText(t('ظاهر للعملاء', 'Shown to customers'));
    expect(writes).toEqual([{ method: 'PUT', path: '/my-store/customer-login', body: { phone_otp: true, google: true, version: 1 } }]);
  });
}

test('methods that are not ready stay disabled and point to the WhatsApp connection', async ({ page }) => {
  const writes = await workspace(page, 'en', { whatsapp: false, google: false });
  await page.goto('/store/settings/customer-login');
  const phone = page.getByTestId('customer-login-phone');
  await expect(phone.getByRole('checkbox')).toBeDisabled();
  await expect(page.getByTestId('customer-login-google').getByRole('checkbox')).toBeDisabled();
  await expect(phone.getByRole('link', { name: 'Connect and verify your WhatsApp first' })).toHaveAttribute('href', /\/settings\/phone-verification$/);
  await expect(page.getByText('Google sign-in is not available on the platform yet.')).toBeVisible();
  expect(writes).toEqual([]);
});
