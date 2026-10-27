import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const artifacts = '.omc/artifacts/bein-migration-20261028/payment-ui';
const fixture = (eligible: boolean) => [
  { slug: 'tap', name: 'Tap', enabled: false, available: true, configured: true, test_mode: true, credential_fields: ['secret_key'], credentials: { secret_key: '********' } },
  { slug: 'deema', name: 'Deema', enabled: false, available: true, configured: eligible, test_mode: true, credential_fields: [], credentials: [], connection_gateway: 'tap', inherits_environment: true, supported_currencies: ['KWD'], amount_limits: { currency: 'KWD', minimum: '100.000', maximum: '200.000' } },
];
async function workspace(page: Page, locale: 'ar' | 'en', eligible = false, scope: 'merchant' | 'admin' | 'denied' = 'merchant') {
  const writes: Array<{ path: string; body: { gateways: Array<Record<string, unknown>> } }> = [];
  const reads: string[] = [];
  let rows = fixture(eligible);
  const apiBase = scope === 'admin' ? '/stores/14' : '/my-store';
  await page.addInitScript(language => {
    localStorage.setItem('sellchase_access_token', 'isolated-payment-fixture');
    localStorage.setItem('sellchase_locale', language);
  }, locale);
  // Every API response is synthetic; all other nonlocal requests are blocked.
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.includes('/api/v1/')) {
      if (url.hostname === '127.0.0.1') await route.continue(); else await route.abort();
      return;
    }
    const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4184', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    if (request.method() !== 'GET') {
      expect(request.method()).toBe('POST'); expect(path).toBe(`${apiBase}/payments`);
      expect(request.headers()['authorization']).toBe('Bearer isolated-payment-fixture');
      const body = request.postDataJSON(); writes.push({ path, body });
      rows = rows.map(row => body.gateways[0].slug === row.slug ? { ...row, ...body.gateways[0], name: body.gateways[0].presentation.name || row.name, credentials: row.credentials } : row);
      await route.fulfill({ headers, json: { data: rows } }); return;
    }
    reads.push(path);
    if (path === '/auth/me') {
      await route.fulfill({ headers, json: { user: { id: scope === 'admin' ? 1 : 39, name: 'Payment fixture', email: 'fixture@example.test', roles: [scope === 'admin' ? 'Admin' : scope === 'denied' ? 'StoreManager' : 'Merchant'], permissions: scope === 'admin' ? ['stores-edit', 'stores-list'] : scope === 'denied' ? ['store.view'] : ['store.view', 'store.settings.manage'], parent_user_id: scope === 'denied' ? 39 : null, is_active: true, pending_approval: false } } }); return;
    }
    if (path === apiBase) {
      await route.fulfill({ headers, json: { data: { id: 14, owner_user_id: 39, name: 'Synthetic store 14', slug: 'synthetic', status: 'active', currency: eligible ? 'KWD' : 'USD', default_locale: locale, supported_locales: ['en', 'ar'] } } }); return;
    }
    await route.fulfill({ headers, json: { data: path === `${apiBase}/payments` ? rows : [], unread: 0, count: 0 } });
  });
  return { writes, reads, path: scope === 'admin' ? '/stores/14/settings/payments' : '/store/settings/payments' };
}

for (const locale of ['en', 'ar'] as const) for (const width of [1440, 390]) {
  test(`Deema inherited setup and Tap POST save in ${locale} at ${width}px`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.setViewportSize({ width, height: 900 });
    await page.goto(api.path);
    const card = page.locator('.ws-payment-card').filter({ has: page.getByRole('heading', { name: 'Deema', exact: true }) });
    await expect(card.getByText('100.000', { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(card.getByRole('button', { name: locale === 'ar' ? 'تفعيل طريقة الدفع' : 'Activate payment method' })).toBeDisabled();
    await card.getByRole('button', { name: locale === 'ar' ? 'تعديل' : 'Edit', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('switch')).toHaveCount(1);
    await expect(dialog.getByRole('switch')).toBeDisabled();
    await expect(dialog.locator('#payment-secret_key')).toHaveCount(0);
    await expect(dialog.getByText(locale === 'ar' ? 'لا يتم تحويل أسعار المتجر تلقائيًا.' : 'Store prices are not converted automatically.', { exact: false })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await mkdir(artifacts, { recursive: true });
    await page.screenshot({ path: `${artifacts}/deema-${locale}-${width}.png`, fullPage: true });
    const results = await new AxeBuilder({ page }).include('.ws-payment-dialog-panel .ws-payment-connection').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
    await dialog.getByRole('button', { name: locale === 'ar' ? 'تعديل إعدادات Tap' : 'Edit Tap settings' }).click();
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText(locale === 'ar' ? 'تعديل Tap' : 'Edit Tap');
    await expect(dialog.locator('#payment-secret_key')).toHaveValue('');
    await dialog.locator('#payment-name').fill('Tap fixture presentation');
    await dialog.getByRole('button', { name: locale === 'ar' ? 'حفظ التغييرات' : 'Save changes' }).click();
    await expect(dialog).toHaveCount(0);
    expect(api.writes).toHaveLength(1);
    expect(api.writes[0]).toMatchObject({ path: '/my-store/payments', body: { gateways: [{ slug: 'tap', credentials: {}, presentation: { name: 'Tap fixture presentation' } }] } });
    await page.reload();
    await expect(page.getByText('Tap fixture presentation', { exact: true })).toBeVisible();
  });
}

test('eligible Deema keeps the selected admin store identity and inherits its environment', async ({ page }) => {
  const api = await workspace(page, 'en', true, 'admin');
  await page.goto(api.path);
  const card = page.locator('.ws-payment-card').filter({ has: page.getByRole('heading', { name: 'Deema', exact: true }) });
  await card.getByRole('button', { name: 'Activate payment method' }).click();
  await expect(card.getByText('Enabled', { exact: true })).toBeVisible();
  expect(api.writes).toHaveLength(1);
  expect(api.writes[0]).toMatchObject({ path: '/stores/14/payments', body: { gateways: [{ slug: 'deema', enabled: true, credentials: {} }] } });
  expect(api.writes[0]!.body.gateways[0]).not.toHaveProperty('test_mode');
  expect(api.reads).not.toContain('/my-store/payments');
});

test('a manager without settings permission never reads or changes payment settings', async ({ page }) => {
  const api = await workspace(page, 'en', false, 'denied');
  await page.goto(api.path);
  await expect(page).toHaveURL(/\/(?:store\/overview|dashboard)$/);
  expect(api.reads).not.toContain('/my-store/payments');
  expect(api.writes).toEqual([]);
});
