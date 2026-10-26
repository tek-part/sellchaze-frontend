import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Top-header mode and banner on the general settings page. Isolated, intercepted API; no real account.
const settings = (overrides: Record<string, unknown> = {}) => ({
  revision: 'a'.repeat(64), site_title: 'Synthetic store', header_mode: 'theme', header_text: 'Kept for later', primary_color: '#198754', font_family: '',
  default_locale: 'en', currency: 'USD', phone_country: 'EG', timezone: 'Africa/Cairo', shipping_flat_rate: 0, max_product_quantity: 0, max_orders_per_phone_24h: 0,
  disable_auto_select_shipping: false, disable_auto_select_variants: false, disable_bot_protection: true, bot_credentials_configured: false,
  logo_url: null, favicon_url: null, banner_url: '/logo.png', ...overrides,
});

async function workspace(page: Page, locale: 'ar' | 'en') {
  const saves: string[] = [];
  let current = settings();
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-browser-fixture');
    localStorage.setItem('sellchase_locale', language);
  }, locale);
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    if (path === '/auth/me') {
      await route.fulfill({ headers, json: { user: { id: 1, name: 'Branding Fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: ['store.view', 'store.settings.manage'], parent_user_id: null, is_active: true, pending_approval: false } } }); return;
    }
    if (path === '/my-store') {
      await route.fulfill({ headers, json: { data: { id: 1, owner_user_id: 1, name: 'Local store fixture', slug: 'fixture', status: 'active', currency: 'USD', default_locale: 'en', supported_locales: ['en', 'ar'] } } }); return;
    }
    if (path === '/my-store/general-settings') {
      if (request.method() === 'POST') {
        const body = request.postDataBuffer()?.toString('latin1') ?? '';
        saves.push(body);
        const field = (name: string) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1];
        current = settings({ revision: 'b'.repeat(64), header_mode: field('header_mode'), header_text: field('header_text'), banner_url: field('remove_banner') === '1' ? null : '/logo.png' });
        await route.fulfill({ headers, json: { data: current, store: { id: 1, name: 'Local store fixture' } } }); return;
      }
      await route.fulfill({ headers, json: { data: current, choices: { currencies: ['USD', 'EGP'], countries: ['EG'], timezones: ['Africa/Cairo'] } } }); return;
    }
    expect(request.method()).toBe('GET');
    await route.fulfill({ headers, json: { data: [], unread: 0, count: 0 } });
  });
  return saves;
}

const field = (body: string, name: string) => body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1];

test('the top header follows the chosen mode and a banner upload is saved', async ({ page }) => {
  const saves = await workspace(page, 'en');
  await page.goto('/store/settings/general');
  const mode = page.getByRole('combobox', { name: 'Top header display' });
  const content = page.getByRole('textbox', { name: 'Top header content' });
  await expect(mode).toHaveValue('theme');
  await expect(content).toBeDisabled();
  await expect(page.getByRole('img', { name: 'Banner image' })).toHaveAttribute('src', '/logo.png');

  await mode.selectOption('custom');
  await expect(content).toBeEnabled();
  await content.fill('Free delivery this week');
  await page.getByLabel('Upload image — Banner image').setInputFiles({ name: 'hero.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  await expect(page.getByText('hero.png')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Store settings saved');

  expect(saves).toHaveLength(1);
  expect(field(saves[0]!, 'header_mode')).toBe('custom');
  expect(field(saves[0]!, 'header_text')).toBe('Free delivery this week');
  expect(field(saves[0]!, 'remove_banner')).toBe('0');
  expect(saves[0]).toContain('name="banner"; filename="hero.png"');
  await expect(page.getByText('hero.png')).toHaveCount(0);
});

test('switching back to the theme header and removing the banner are saved', async ({ page }) => {
  const saves = await workspace(page, 'en');
  await page.goto('/store/settings/general');
  const mode = page.getByRole('combobox', { name: 'Top header display' });
  await mode.selectOption('hidden');
  await page.getByRole('button', { name: 'Remove image' }).first().click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status')).toHaveText('Store settings saved');
  expect(field(saves[0]!, 'header_mode')).toBe('hidden');
  expect(field(saves[0]!, 'remove_banner')).toBe('1');
  expect(saves[0]).not.toContain('name="banner";');
  await expect(page.getByRole('img', { name: 'Banner image' })).toHaveCount(0);
});

test('the Arabic top header and banner controls are labelled and accessible', async ({ page }) => {
  await workspace(page, 'ar');
  await page.goto('/store/settings/general');
  await expect(page.getByRole('combobox', { name: 'طريقة عرض الجزء العلوي' })).toHaveValue('theme');
  await expect(page.getByRole('heading', { name: 'صورة البانر' })).toBeVisible();
  const results = await new AxeBuilder({ page }).include('.ws-general-settings form').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
