import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// Gift card browser contracts. Every API call is intercepted with synthetic data: no account,
// store, gift card or order is created anywhere, and no message is sent.
type Locale = 'ar' | 'en';
const ISSUED_CODE = 'ABCD-EFGH-JKLM-NP23';
const CARDS = [
  { id: 5, last4: 'AB12', masked_code: '•••• AB12', initial_value: '200.00', balance: '120.00', currency: 'USD', expires_at: null, status: 'active', state: 'active', customer_name: 'Mona Ali', customer_email: 'mona@example.test', customer_phone: null, note: 'Birthday', source: 'manual', created_at: '2026-10-20T10:00:00Z' },
  { id: 6, last4: 'ZZ90', masked_code: '•••• ZZ90', initial_value: '50.00', balance: '50.00', currency: 'USD', expires_at: '2026-12-31T00:00:00Z', status: 'disabled', state: 'disabled', customer_name: null, customer_email: null, customer_phone: null, note: null, source: 'manual', created_at: '2026-10-21T10:00:00Z' },
];
const TRANSACTIONS = [
  { id: 3, amount: '-80.00', balance_after: '120.00', reason: 'redeemed', note: null, store_order_id: 41, order_number: 'ORD-41', actor_id: null, actor_name: null, created_at: '2026-10-22T10:00:00Z' },
  { id: 1, amount: '200.00', balance_after: '200.00', reason: 'issued', note: null, store_order_id: null, order_number: null, actor_id: 1, actor_name: 'Gift fixture', created_at: '2026-10-20T10:00:00Z' },
];

async function dashboard(page: Page, locale: Locale) {
  const writes: Array<{ method: string; path: string; body: Record<string, unknown> }> = [];
  const lists: URLSearchParams[] = [];
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-gift-cards-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (request.method() !== 'GET') {
      const body = request.postDataJSON() as Record<string, unknown>; writes.push({ method: request.method(), path, body });
      if (`${request.method()} ${path}` === 'POST /my-store/gift-cards') {
        return route.fulfill({ status: 201, json: { data: { ...CARDS[0], id: 9, last4: 'NP23', balance: body.initial_value, initial_value: body.initial_value }, code: ISSUED_CODE }, headers });
      }
      expect(['POST /my-store/gift-cards/5/adjust', 'PUT /my-store/gift-cards/5']).toContain(`${request.method()} ${path}`);
      return route.fulfill({ json: { data: CARDS[0] }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Gift fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: [], is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local gift card fixture', slug: 'fixture', status: 'active', currency: 'USD' } }, headers });
    if (path === '/my-store/gift-cards') {
      lists.push(url.searchParams);
      const status = url.searchParams.get('status'); const search = (url.searchParams.get('search') || '').toLowerCase();
      const rows = CARDS.filter((row) => (!status || row.state === status) && (!search || row.last4.toLowerCase().includes(search) || (row.customer_name || '').toLowerCase().includes(search)));
      return route.fulfill({ json: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 25, total: rows.length } }, headers });
    }
    if (path === '/my-store/gift-cards/5') return route.fulfill({ json: { data: CARDS[0], transactions: TRANSACTIONS }, headers });
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { writes, lists };
}

async function healthy(page: Page, include: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`issues a gift card and shows its code exactly once (${locale})`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/gift-cards');
    await expect(page.getByRole('heading', { level: 1, name: t('بطاقات الهدايا', 'Gift cards') })).toBeVisible();
    await page.getByRole('button', { name: t('إصدار بطاقة هدية', 'Issue gift card') }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(t('القيمة (USD)', 'Value (USD)')).fill('250');
    await dialog.getByLabel(t('اسم العميل (اختياري)', 'Customer name (optional)')).fill('Mona Ali');
    await dialog.getByLabel(t('البريد الإلكتروني (اختياري)', 'Email (optional)')).fill('mona@example.test');
    await healthy(page, '[role="dialog"]');
    await dialog.getByRole('button', { name: t('إصدار البطاقة', 'Issue card') }).click();

    await expect(dialog.locator('[data-gift-card-code]')).toHaveText(ISSUED_CODE);
    await expect(dialog.getByRole('alert')).toContainText(t('احفظ الكود الآن.', 'Save this code now.'));
    await dialog.getByRole('button', { name: t('نسخ الكود', 'Copy code') }).click();
    await expect(dialog.getByRole('button', { name: t('تم النسخ', 'Copied') })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ISSUED_CODE);
    await healthy(page, '[role="dialog"]');
    expect(api.writes).toEqual([{ method: 'POST', path: '/my-store/gift-cards', body: { initial_value: '250', expires_at: null, customer_name: 'Mona Ali', customer_email: 'mona@example.test', customer_phone: null, note: null } }]);

    await dialog.getByRole('button', { name: t('تم، حفظت الكود', 'Done, I saved it') }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(ISSUED_CODE)).toHaveCount(0);
    // Opening the dialog again starts empty: the code is gone from memory.
    await page.getByRole('button', { name: t('إصدار بطاقة هدية', 'Issue gift card') }).first().click();
    await expect(page.getByRole('dialog').locator('[data-gift-card-code]')).toHaveCount(0);
    await expect(page.getByRole('dialog').getByLabel(t('القيمة (USD)', 'Value (USD)'))).toHaveValue('');
  });

  test(`lists gift cards masked and filters by status and search (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/gift-cards');
    const table = page.locator('.ws-dt-card');
    await expect(table.getByRole('link', { name: '•••• AB12' }).first()).toBeVisible();
    await expect(table.getByText('Mona Ali').first()).toBeVisible();
    await healthy(page, '.ws-catalog-page');

    await page.getByRole('tab', { name: t('معطلة', 'Disabled'), exact: true }).click();
    await expect.poll(() => api.lists.at(-1)?.get('status')).toBe('disabled');
    await expect(table.getByRole('link', { name: '•••• ZZ90' }).first()).toBeVisible();
    await expect(table.getByText('•••• AB12')).toHaveCount(0);

    await page.goto('/store/gift-cards');
    await page.getByRole('searchbox').first().fill('ab12');
    await expect.poll(() => api.lists.at(-1)?.get('search')).toBe('ab12');
    await expect(table.getByText('•••• ZZ90')).toHaveCount(0);
  });

  test(`detail shows the ledger and adjusts the balance with a reason (${locale})`, async ({ page }) => {
    const api = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/gift-cards/5');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('•••• AB12');
    await expect(page.locator('[data-gift-card-transaction="redeemed"]')).toContainText('ORD-41');
    await expect(page.locator('[data-gift-card-transaction="issued"]')).toContainText('Gift fixture');
    await healthy(page, 'main');

    await page.getByRole('radio', { name: t('خصم من الرصيد', 'Remove from balance') }).check();
    await page.getByLabel(`${t('المبلغ', 'Amount')} (USD)`).fill('30');
    await page.getByLabel(t('السبب', 'Reason'), { exact: true }).fill('Damaged item credit removed');
    await page.getByRole('button', { name: t('حفظ التعديل', 'Save adjustment') }).click();
    await expect.poll(() => api.writes.length).toBe(1);
    expect(api.writes[0]).toEqual({ method: 'POST', path: '/my-store/gift-cards/5/adjust', body: { amount: '-30', reason: 'Damaged item credit removed' } });

    await page.getByRole('button', { name: t('تعطيل البطاقة', 'Disable gift card') }).click();
    await expect.poll(() => api.writes.length).toBe(2);
    expect(api.writes[1]).toEqual({ method: 'PUT', path: '/my-store/gift-cards/5', body: { status: 'disabled' } });
  });
}

/* ---- storefront checkout ---- */
const STORE_ID = 7654321;
const field = (key: string, en: string, ar: string, required = true) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required, position: 0 });
const lines = [{ id: 'line-1', productId: '700', title: 'Synthetic linen shirt', url: '/products/synthetic-shirt', price: 100, currency: 'USD', quantity: 1 }];
const GIFT = { 'GIFTAAAAAAAAAAAA': { last4: 'AAAA', balance: '50.00' }, 'GIFTBBBBBBBBBBBB': { last4: 'BBBB', balance: '200.00' } } as Record<string, { last4: string; balance: string }>;

async function storefront(page: Page, locale: Locale) {
  const seen = { quotes: [] as Array<Record<string, unknown>>, orders: [] as Array<Record<string, unknown>>, checks: [] as string[] };
  await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [`sf-cart-v2:${STORE_ID}:USD`, JSON.stringify({ version: 2, storeId: String(STORE_ID), currency: 'USD', lines })]);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false, merchant_information: { email: '', phone: '', address: '', policies: [] } }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path.endsWith('/payment-methods')) return route.fulfill({ json: { data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: false }] } });
    if (path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان')], requires_shipping: true, has_digital: false,
      shipping: { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '0', free_over: null, regions: [], options: [
        { id: 'standard', name: { en: 'Standard delivery', ar: 'توصيل عادي' }, description: { en: '3–5 business days', ar: 'من 3 إلى 5 أيام عمل' }, rate: '30', icon_url: null, enabled: true, priority: 1, is_default: false },
      ] } } });
    if (path.endsWith('/checkout/gift-card/check')) {
      const code = String((request.postDataJSON() as { code: string }).code); seen.checks.push(code);
      const card = GIFT[code];
      return card ? route.fulfill({ json: { data: { last4: card.last4, balance: card.balance, currency: 'USD', expires_at: null } } })
        : route.fulfill({ status: 422, json: { message: 'This gift card is invalid, expired or has no balance.', errors: { code: ['This gift card is invalid, expired or has no balance.'] } } });
    }
    if (path.endsWith('/checkout/quote')) {
      const body = request.postDataJSON() as { gift_cards?: string[] }; seen.quotes.push(body);
      let due = 130; const cards = (body.gift_cards ?? []).map((code) => {
        const balance = Number(GIFT[code].balance); const applied = Math.min(balance, due); due -= applied;
        return { last4: GIFT[code].last4, applied: applied.toFixed(2), balance_after: (balance - applied).toFixed(2) };
      });
      return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: true, discounts: [], gift_cards: cards, amount_due: due.toFixed(2), payment_adjustment_token: null,
        items: [{ product_id: 700, variant_id: null, name: 'Synthetic linen shirt', quantity: 1, unit_price: '100.00', line_total: '100.00' }],
        totals: { subtotal: '100.00', discount_total: '0.00', shipping_total: '30.00', tax_total: '0.00', grand_total: '130.00', gift_card_total: (130 - due).toFixed(2) } } } });
    }
    if (path.endsWith('/checkout') && request.method() === 'POST') {
      seen.orders.push(request.postDataJSON() as Record<string, unknown>);
      return route.fulfill({ status: 201, json: { data: { number: 'SYNTHETIC-GIFT', tracking: null, payment_status: 'paid', payment_method: 'gift_card' }, payment: { transaction_id: null, status: 'paid', redirect_url: null } } });
    }
    if (request.method() !== 'GET') return route.fulfill({ json: { data: null } });
    return route.fulfill({ json: { data: [] } });
  });
  return seen;
}

for (const locale of ['en', 'ar'] as const) {
  test(`checkout applies gift cards, shows the amount due and needs no payment method when covered (${locale})`, async ({ page }) => {
    const seen = await storefront(page, locale);
    const ar = locale === 'ar';
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await page.getByLabel(ar ? 'الاسم الكامل *' : 'Full name *').fill('Synthetic Buyer');
    await page.getByLabel(ar ? 'رقم الهاتف *' : 'Phone *').fill('+201000000000');
    await page.getByLabel(ar ? 'المدينة *' : 'City *').fill('Cairo');
    await page.getByLabel(ar ? 'العنوان *' : 'Address *').fill('1 Synthetic Street');
    await page.getByRole('radio', { name: ar ? /توصيل عادي/ : /Standard delivery/ }).check();
    await page.getByRole('radio', { name: ar ? /الدفع عند الاستلام/ : /Cash on delivery/ }).check();
    const summary = page.locator('.sf-co__summary');
    await expect(summary.locator('.sf-co-total')).toContainText('130');

    const input = summary.getByLabel(ar ? 'بطاقة هدية' : 'Gift card', { exact: true });
    await input.fill('nope-nope');
    await summary.getByRole('button', { name: ar ? 'تطبيق' : 'Apply' }).nth(1).click();
    await expect(summary.getByText('This gift card is invalid, expired or has no balance.')).toBeVisible();

    await input.fill('gift-aaaa-aaaa-aaaa');
    await summary.getByRole('button', { name: ar ? 'تطبيق' : 'Apply' }).nth(1).click();
    await expect(summary.getByRole('button', { name: ar ? 'إزالة بطاقة الهدية •••• AAAA' : 'Remove gift card •••• AAAA' })).toBeVisible();
    await expect(summary.locator('[data-gift-card-line]')).toHaveCount(1);
    await expect(summary.locator('[data-gift-card-line]')).toContainText('•••• AAAA');
    await expect(summary.locator('[data-gift-card-line]')).toContainText('−');
    await expect(summary.locator('[data-gift-card-line]')).toContainText('50');
    await expect(summary.locator('[data-amount-due]')).toContainText('80');
    await expect(page.getByRole('radio', { name: ar ? /الدفع عند الاستلام/ : /Cash on delivery/ })).toBeVisible();
    expect(seen.quotes.at(-1)?.gift_cards).toEqual(['GIFTAAAAAAAAAAAA']);

    await input.fill('GIFT BBBB BBBB BBBB');
    await summary.getByRole('button', { name: ar ? 'تطبيق' : 'Apply' }).nth(1).click();
    await expect(summary.locator('[data-gift-card-line]')).toHaveCount(2);
    await expect(summary.locator('[data-amount-due]')).toContainText('0');
    await expect(page.locator('[data-paid-by-gift-cards]')).toBeVisible();
    await expect(page.getByRole('radio', { name: ar ? /الدفع عند الاستلام/ : /Cash on delivery/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.sf-co-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => v.id)).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.locator('.sf-co-pay').click();
    await expect.poll(() => seen.orders.length).toBe(1);
    expect(seen.orders[0].gift_cards).toEqual(['GIFTAAAAAAAAAAAA', 'GIFTBBBBBBBBBBBB']);
    expect(seen.orders[0]).not.toHaveProperty('payment_method');
    expect(seen.checks).toEqual(['NOPENOPE', 'GIFTAAAAAAAAAAAA', 'GIFTBBBBBBBBBBBB']);
    await expect(page).toHaveURL(/\/order\/success\?number=SYNTHETIC-GIFT/);
  });
}
