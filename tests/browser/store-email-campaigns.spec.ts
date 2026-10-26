import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// Email campaign browser contracts. Every API call is intercepted with synthetic data: no store,
// subscriber or campaign exists anywhere, and no e-mail (test or real) is ever sent.
type Locale = 'ar' | 'en';
type Json = Record<string, unknown>;

const PREVIEW = (subject: string) => `<!doctype html><html lang="en"><head><title>${subject}</title></head><body><main><h1>Synthetic preview</h1><p>${subject}</p></main></body></html>`;
const SENT = { id: 3, name: 'Eid launch', subject: 'Eid offers are here', status: 'sent', locale: 'en', audience: { type: 'all' }, recipients_count: 1200, sent_count: 1180, failed_count: 4,
  opened_count: 590, clicked_count: 118, open_rate: 50, click_rate: 10, scheduled_at: '2026-10-20T10:00:00Z', started_at: '2026-10-20T10:00:00Z', completed_at: '2026-10-20T10:40:00Z', updated_at: '2026-10-20T10:40:00Z' };
const DRAFT = { id: 4, name: 'Winter teaser', subject: null, status: 'draft', locale: 'en', audience: { type: 'all' }, recipients_count: 0, sent_count: 0, failed_count: 0, opened_count: 0, clicked_count: 0, open_rate: null, click_rate: null, updated_at: '2026-10-22T10:00:00Z' };

async function workspace(page: Page, locale: Locale) {
  const writes: Array<{ method: string; path: string; body: Json }> = [];
  const lists: URLSearchParams[] = [];
  const campaigns: Record<number, Json> = { 3: SENT, 4: DRAFT };
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-email-campaigns-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.method() !== 'GET') {
      const body = (request.postDataJSON() ?? {}) as Json;
      if (/\/preview$/.test(path)) return route.fulfill({ json: { data: { html: PREVIEW(String(body.subject ?? 'Untitled')), subject: body.subject ?? '', preheader: body.preheader ?? '' } }, headers });
      if (/\/audience-count$/.test(path)) {
        const saved = path.match(/email-campaigns\/(\d+)\/audience-count$/);
        const audience = (body.audience ?? (saved ? campaigns[Number(saved[1])]?.audience : null) ?? { type: 'all' }) as Json;
        return route.fulfill({ json: { data: { count: audience.type === 'tags' ? 37 : 1234, audience } }, headers });
      }
      writes.push({ method: request.method(), path, body });
      if (`${request.method()} ${path}` === 'POST /my-store/email-campaigns') {
        campaigns[7] = { ...body, id: 7, status: 'draft', recipients_count: 0, sent_count: 0, failed_count: 0 };
        return route.fulfill({ status: 201, json: { data: campaigns[7] }, headers });
      }
      if (path === '/my-store/email-campaigns/7/test') return route.fulfill({ status: 202, json: { message: 'Test email queued.', data: { email: String(body.email).toLowerCase() } }, headers });
      if (path === '/my-store/email-campaigns/7/schedule') {
        campaigns[7] = { ...campaigns[7], status: 'scheduled', scheduled_at: '2026-10-26T10:00:00Z' };
        return route.fulfill({ json: { data: campaigns[7] }, headers });
      }
      return route.fulfill({ status: 404, json: { message: 'Unexpected write' }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Campaign fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: [], is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Synthetic boutique', slug: 'synthetic-boutique', status: 'active', currency: 'USD', default_locale: locale, supported_locales: ['en', 'ar'] } }, headers });
    if (path === '/my-store/email-campaigns') {
      lists.push(url.searchParams);
      const status = url.searchParams.get('status');
      const rows = Object.values(campaigns).filter((row) => !status || row.status === status);
      return route.fulfill({ json: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 25, total: rows.length, status_counts: {} } }, headers });
    }
    if (path === '/my-store/email-campaigns/options') return route.fulfill({ json: { data: {
      coupons: [{ id: 11, code: 'EID20', title: 'Eid 20%', type: 'percentage', value: '20.00', expires_at: null }],
      tags: [{ tag: 'VIP', count: 37 }, { tag: 'Wholesale', count: 5 }],
      defaults: { from_name: 'Synthetic boutique', reply_to: 'hello@boutique.example', locale, from_address: 'no-reply@platform.example' },
      limits: { max_blocks: 40, max_products: 12, per_store_per_minute: 60 },
    } }, headers });
    const campaign = path.match(/^\/my-store\/email-campaigns\/(\d+)$/);
    if (campaign) return route.fulfill({ json: { data: campaigns[Number(campaign[1])] }, headers });
    const report = path.match(/^\/my-store\/email-campaigns\/(\d+)\/report$/);
    if (report) return route.fulfill({ json: { data: { campaign: campaigns[Number(report[1])], metrics: { recipients: 1234, queued: 1234, sent: 0, opened: 0, clicked: 0, clicks: 0, unsubscribed: 0, failed: 0, bounced: 0, skipped: 0, open_rate: null, click_rate: null, unsubscribe_rate: null } } }, headers });
    if (path === '/my-store/catalog/products') return route.fulfill({ json: { data: [{ id: 21, name: 'Linen shirt' }, { id: 22, name: 'Cotton scarf' }], meta: { total: 2 } }, headers });
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { writes, lists };
}

async function healthy(page: Page, include: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).exclude('iframe').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`composes, saves, tests and schedules a campaign (${locale})`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/email-campaigns/new');
    await expect(page.getByRole('heading', { level: 1, name: t('حملة جديدة', 'New campaign') })).toBeVisible();

    await page.getByLabel(t('اسم الحملة (داخلي)', 'Campaign name (internal)')).fill('Eid sale');
    await page.getByLabel(t('سطر الموضوع', 'Subject line')).fill('Eid offers inside');
    await page.getByLabel(t('نص المعاينة (يظهر بعد الموضوع)', 'Preview text (shown after the subject)')).fill('20% off everything');
    // Default blocks: heading, text, button.
    const blocks = page.locator('[data-block-type]');
    await expect(blocks).toHaveCount(3);
    await blocks.nth(0).getByLabel(t('نص العنوان', 'Heading text')).fill('Eid Mubarak');
    await blocks.nth(1).getByRole('textbox', { name: t('النص', 'Text') }).click();
    await page.keyboard.type('Celebrate with our best prices.');
    await blocks.nth(2).getByLabel(t('نص الزر', 'Button text')).fill('Shop now');
    await blocks.nth(2).getByLabel(t('رابط الزر', 'Button link')).fill('https://boutique.example/sale');
    // Add a discount code block, then move it to the top.
    await page.getByRole('button', { name: `+ ${t('كود خصم', 'Discount code')}` }).click();
    await expect(blocks).toHaveCount(4);
    await blocks.nth(3).getByLabel(t('كود الخصم', 'Discount code'), { exact: true }).selectOption('11');
    for (let step = 0; step < 3; step++) await page.getByRole('button', { name: new RegExp(t('تحريك كود خصم \\d+ لأعلى', 'Move Discount code \\d+ up')) }).click();
    await expect(blocks.first()).toHaveAttribute('data-block-type', 'coupon');
    // Audience: customers tagged VIP, with a live count.
    await page.getByRole('radio', { name: new RegExp(t('حسب الوسوم', 'By customer tags')) }).check();
    await page.getByRole('checkbox', { name: /VIP/ }).check();
    await expect(page.locator('[data-audience-count="37"]')).toBeVisible();
    await expect(page.locator('iframe[title]')).toBeVisible();
    await healthy(page, '.ws-catalog-page');

    await page.getByRole('button', { name: t('حفظ المسودة', 'Save draft') }).click();
    await expect(page).toHaveURL(/\/store\/email-campaigns\/7$/);
    const created = api.writes.find((write) => write.method === 'POST' && write.path === '/my-store/email-campaigns');
    expect(created?.body).toMatchObject({
      name: 'Eid sale', subject: 'Eid offers inside', preheader: '20% off everything', locale,
      audience: { type: 'tags', tags: ['VIP'] },
    });
    const content = created?.body.content as Json[];
    expect(content.map((block) => block.type)).toEqual(['coupon', 'heading', 'text', 'button']);
    expect(content[0]).toMatchObject({ type: 'coupon', coupon_id: 11 });
    expect(content[1]).toMatchObject({ type: 'heading', text: 'Eid Mubarak', size: 'large' });
    expect(String(content[2]?.html)).toContain('Celebrate with our best prices.');
    expect(content[3]).toMatchObject({ type: 'button', label: 'Shop now', url: 'https://boutique.example/sale' });

    // Send test: one queued message to the typed address only.
    await page.getByRole('button', { name: t('إرسال تجريبي', 'Send test') }).click();
    const testDialog = page.getByRole('dialog');
    await testDialog.getByLabel(t('البريد الإلكتروني', 'Email address')).fill('Me@Merchant.example');
    await healthy(page, '[role="dialog"]');
    await testDialog.getByRole('button', { name: t('إرسال التجربة', 'Send test') }).click();
    await expect(testDialog.getByRole('status')).toContainText('me@merchant.example');
    expect(api.writes.filter((write) => write.path.endsWith('/test'))).toEqual([{ method: 'POST', path: '/my-store/email-campaigns/7/test', body: { email: 'Me@Merchant.example' } }]);
    await testDialog.getByRole('button', { name: t('إغلاق', 'Close') }).click();

    // Send now: the confirmation shows the recipient count before anything is scheduled.
    await page.getByRole('button', { name: t('إرسال أو جدولة', 'Send or schedule') }).click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.locator('[data-confirm-count="37"]')).toContainText(t('٣٧', '37'));
    expect(api.writes.some((write) => write.path.endsWith('/schedule'))).toBe(false);
    await healthy(page, '[role="dialog"]');
    await confirm.getByRole('button', { name: t('أرسل الآن إلى ٣٧', 'Send now to 37') }).click();
    await expect(page).toHaveURL(/\/store\/email-campaigns\/7\/report$/);
    expect(api.writes.filter((write) => write.path.endsWith('/schedule'))).toEqual([{ method: 'POST', path: '/my-store/email-campaigns/7/schedule', body: { scheduled_at: null } }]);
    await expect(page.locator('[data-metric="sent"]')).toBeVisible();
    await healthy(page, '.ws-catalog-page');
  });

  test(`lists campaigns with metrics and status views (${locale})`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/email-campaigns');
    await expect(page.getByRole('heading', { level: 1, name: t('حملات البريد', 'Email campaigns') })).toBeVisible();
    const table = page.locator('.ws-dt-card');
    await expect(table.getByRole('link', { name: 'Eid launch' }).first()).toBeVisible();
    await expect(table.getByText(t('٥٠%', '50%')).first()).toBeVisible();
    await healthy(page, '.ws-catalog-page');
    await page.getByRole('tab', { name: t('مسودة', 'Draft'), exact: true }).click();
    await expect.poll(() => api.lists.at(-1)?.get('status')).toBe('draft');
    await expect(table.getByRole('link', { name: 'Winter teaser' }).first()).toBeVisible();
    await expect(table.getByText('Eid launch')).toHaveCount(0);
  });
}

test('the merchant sidebar links to email campaigns under marketing tools; the editor previews side by side', async ({ page }, testInfo) => {
  await workspace(page, 'en');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/store/email-campaigns');
  const sidebar = page.locator('.ws-desktop-sidebar');
  await sidebar.getByRole('button', { name: 'Marketing tools', exact: true }).click();
  await expect(sidebar.locator('a[href="/store/email-campaigns"]')).toBeVisible();
  await page.goto('/store/email-campaigns/4');
  await expect(page.getByRole('heading', { level: 1, name: 'Winter teaser' })).toBeVisible();
  await expect(page.locator('iframe[title="Email preview"]')).toBeVisible();
  await page.getByRole('button', { name: 'Phone', exact: true }).click();
  await expect(page.locator('[data-preview-device="phone"] iframe')).toHaveCSS('width', '375px');
  await healthy(page, '.ws-catalog-page');
  await page.screenshot({ path: testInfo.outputPath('email-campaign-editor.png'), fullPage: true });
});
