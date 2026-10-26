import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// App store browser contracts: merchant settings pages, the storefront sales notification and the
// checkout country restriction. Every API call is intercepted with synthetic data; nothing is saved.
type Locale = 'ar' | 'en';

const SETTINGS: Record<string, { data: Record<string, unknown>; meta: Record<string, unknown> }> = {
  'social-proof': { data: { version: 1, enabled: false, lookback_days: 7, max_events: 10, first_delay_seconds: 8, interval_seconds: 25, display_seconds: 6, position: 'bottom-start',
    pages: { home: true, product: true, collection: true, cart: false }, show_initial: true, show_city: true, show_time: true }, meta: { viewers_available: false } },
  'country-restriction': { data: { version: 1, enabled: false, mode: 'allow', countries: [], check_ip: false, message: { ar: '', en: '' } }, meta: { countries: ['EG', 'SA', 'AE', 'US'], ip_lookup_available: false } },
  'fake-orders': { data: { version: 1, enabled: false, flag_classification: 'high_risk', message: { ar: '', en: '' }, rules: {
    repeat_phone: { enabled: false, action: 'flag', hours: 24, max_orders: 2 }, open_cod: { enabled: false, action: 'flag', max_open: 2 },
    blocked_words: { enabled: false, action: 'flag', words: [] }, high_quantity: { enabled: false, action: 'flag', max_units: 10 } } }, meta: { classifications: ['high_risk', 'moderate_risk', 'spam'] } },
  bundles: { data: { version: 1, enabled: false, bundles: [] }, meta: {} },
};
const PRODUCTS = [{ id: 3, name: 'Linen tee' }, { id: 4, name: 'Canvas cap' }];
const APPS = [
  { key: 'social-proof', title: { ar: 'إشعارات المبيعات', en: 'Sales notifications' }, description: { ar: 'إشعارات حقيقية', en: 'Real notifications' }, categories: ['sales'], route: 'apps/social-proof/settings', available: true, coming_soon: false, included: true, configured: false, can_manage: true, missing_permission: false, icon: null, features: { ar: [], en: [] }, gallery: [] },
  { key: 'taager', title: { ar: 'تاجر', en: 'Taager' }, description: { ar: 'اربط متجرك مع تاجر.', en: 'Connect your store workflow with Taager.' }, categories: ['sales'], route: null, available: false, coming_soon: true, included: false, configured: false, can_manage: false, missing_permission: false, icon: null, features: { ar: [], en: [] }, gallery: [] },
];

async function dashboard(page: Page, locale: Locale) {
  const saved: Array<{ path: string; body: Record<string, unknown> }> = [];
  await page.addInitScript((language) => {
    localStorage.setItem('sellchase_access_token', 'isolated-apps-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const settings = /^\/my-store\/apps\/([a-z-]+)\/settings$/.exec(path);
    if (settings && request.method() === 'PUT') {
      const body = request.postDataJSON() as Record<string, unknown>; saved.push({ path, body });
      return route.fulfill({ json: { data: { ...body, version: Number(body.version) + 1 }, meta: SETTINGS[settings[1]!]!.meta }, headers });
    }
    if (request.method() !== 'GET') return route.fulfill({ status: 405, json: { message: 'Unexpected write' }, headers });
    if (settings) return route.fulfill({ json: SETTINGS[settings[1]!], headers });
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Apps fixture', email: 'owner@example.test', roles: ['Merchant'], permissions: [], is_active: true, pending_approval: false } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local apps fixture', slug: 'fixture', status: 'active', currency: 'USD' } }, headers });
    if (path === '/my-store/apps') return route.fulfill({ json: { data: APPS, categories: [{ key: 'sales', ar: 'المبيعات', en: 'Sales', app_keys: ['social-proof', 'taager'] }] }, headers });
    if (path === '/my-store/catalog/products') return route.fulfill({ json: { data: PRODUCTS, meta: { current_page: 1, last_page: 1, per_page: 100, total: PRODUCTS.length } }, headers });
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return saved;
}

async function healthy(page: Page, include: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

const STORE_ID = 7654321;
const field = (key: string, en: string, ar: string, required = true) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required, position: 0 });
const lines = [{ id: '700:default', productId: '700', title: 'Synthetic linen shirt', url: '/products/synthetic-shirt', price: 450, currency: 'USD', quantity: 1 }];

async function storefront(page: Page, locale: Locale, options: { socialProof?: boolean; bundles?: boolean; zones?: boolean } = {}) {
  const quotes: Array<Record<string, unknown>> = [];
  await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [`sf-cart-v2:${STORE_ID}:USD`, JSON.stringify({ version: 2, storeId: String(STORE_ID), currency: 'USD', lines })]);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false, social_proof_enabled: options.socialProof === true, bundles_enabled: options.bundles === true }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path.endsWith('/social-proof')) return route.fulfill({ json: { data: { version: 2, first_delay_seconds: 0, interval_seconds: 60, display_seconds: 20, position: 'bottom-end', pages: { home: true, product: true, collection: true, cart: true },
      events: [{ initial: locale === 'ar' ? 'م' : 'M', city: locale === 'ar' ? 'القاهرة' : 'Cairo', minutes_ago: 5, product: { id: 700, name: 'Synthetic linen shirt', slug: 'synthetic-shirt', image_url: null } }] } } });
    if (path.endsWith('/storefront/products/synthetic-shirt')) return route.fulfill({ json: { data: { id: 700, name: 'Synthetic linen shirt', slug: 'synthetic-shirt', price: '450.00', compare_price: null, is_active: true, image_url: null, images: [], stock: null, track_inventory: false, digital_type: 'physical', quantity_offers: [], product_preferences: {} } } });
    if (path.endsWith('/bundles')) return route.fulfill({ json: { currency: 'USD', data: [{ id: '0f6c1f86-5a3c-4c55-9a3e-2f3c0f6a7b11', title: locale === 'ar' ? 'اشترِهما معًا' : 'Buy them together', discount_percent: 20, products: [
      { id: 700, name: 'Synthetic linen shirt', slug: 'synthetic-shirt', price: '450.00', compare_price: null, image_url: null, available: true },
      { id: 701, name: 'Synthetic canvas tote', slug: 'synthetic-tote', price: '150.00', compare_price: null, image_url: null, available: true }] }] } });
    if (path.endsWith('/payment-methods')) return route.fulfill({ json: { data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: false }] } });
    const zoneRate = (id: string, en: string, amount: string) => ({ id, name: { en, ar: en }, type: 'flat', price: amount, amount, free_over: null, cod_fee: null, delivery_time: { en: '2 days', ar: 'يومان' } });
    const zoneKey = `${url.searchParams.get('shipping_country') ?? ''}:${url.searchParams.get('shipping_region_id') ?? ''}`;
    const zoneRates: Record<string, ReturnType<typeof zoneRate>[]> = { 'EG:': [zoneRate('egypt-standard', 'Egypt standard', '50.00')], 'EG:cairo': [zoneRate('inside-cairo', 'Inside Cairo', '30.00')], 'SA:': [zoneRate('gulf', 'Gulf parcels', '120.00')] };
    if (options.zones && path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('country', 'Country', 'الدولة'), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان')],
      requires_shipping: true, has_digital: false, shipping: { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '0.00', free_over: null, regions: [], options: [], zones_enabled: true,
        countries: [{ code: 'EG', region_required: false }, { code: 'SA', region_required: false }], zone_regions: [{ id: 'cairo', name: { en: 'Cairo', ar: 'القاهرة' }, country: 'EG' }],
        zone: zoneRates[zoneKey] ? { id: `zone-${zoneKey}`, name: { en: 'Zone', ar: 'Zone' } } : null, rates: zoneRates[zoneKey] ?? [] },
      country_restriction: { mode: 'block', countries: ['SA'], message: locale === 'ar' ? 'لا نوصّل إلى هذه الدولة حاليًا.' : 'We do not deliver to this country yet.' } } });
    if (path.endsWith('/checkout/fields')) return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('country', 'Country', 'الدولة'), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان')],
      requires_shipping: true, has_digital: false, shipping: { enabled: false, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '0', free_over: null, regions: [], options: [] },
      country_restriction: { mode: 'allow', countries: ['EG'], message: locale === 'ar' ? 'عذرًا، لا يستقبل هذا المتجر الطلبات من هذه الدولة حاليًا.' : 'Sorry, this store does not currently accept orders for this country.' } } });
    if (path.endsWith('/checkout/quote')) {
      const body = request.postDataJSON() as Record<string, unknown>; quotes.push(body);
      if (options.zones) {
        if (body.shipping_country === 'SA') return route.fulfill({ status: 422, json: { message: 'We do not deliver to this country yet.', errors: { 'shipping_address.country': ['We do not deliver to this country yet.'] } } });
        const key = `${body.shipping_country ?? ''}:${body.shipping_region_id ?? ''}`; const rates = zoneRates[key] ?? []; const applied = rates.find((row) => row.id === body.shipping_rate_id) ?? rates[0];
        return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: true, items: [{ product_id: 700, variant_id: null, name: 'Synthetic linen shirt', quantity: 1, line_total: '450.00' }],
          shipping: { mode: 'zone', zone: { id: `zone-${key}`, name: { en: 'Zone', ar: 'Zone' } }, rate_id: applied?.id ?? null, rates, free_shipping_applied: false, cod_fee: '0.00', weight_grams: 0 },
          totals: { subtotal: '450.00', discount_total: '0.00', shipping_total: applied?.amount ?? '0.00', tax_total: '0.00', grand_total: (450 + Number(applied?.amount ?? 0)).toFixed(2) } } } });
      }
      if (body.shipping_country === 'US') return route.fulfill({ status: 422, json: { message: 'Sorry, this store does not currently accept orders for this country.', errors: { 'shipping_address.country': ['Sorry, this store does not currently accept orders for this country.'] } } });
      return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: true, items: [{ product_id: 700, variant_id: null, name: 'Synthetic linen shirt', quantity: 1, line_total: '450.00' }], totals: { subtotal: '450.00', discount_total: '0.00', shipping_total: '0.00', tax_total: '0.00', grand_total: '450.00' } } } });
    }
    if (request.method() !== 'GET') return route.abort();
    return route.fulfill({ json: { data: [] } });
  });
  return quotes;
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`saves sales notification settings (${locale})`, async ({ page }) => {
    const saved = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/apps/social-proof/settings');
    await expect(page.getByRole('heading', { level: 1, name: t('إشعارات المبيعات', 'Sales notifications') })).toBeVisible();
    await expect(page.getByText(t('لا تسجّل الزيارات الحية', 'does not record live visits'), { exact: false })).toBeVisible();
    await page.getByRole('switch', { name: t('تفعيل إشعارات المبيعات', 'Enable sales notifications') }).check();
    await page.getByLabel(t('الفاصل بين الإشعارات (ثوانٍ)', 'Time between notifications (seconds)')).fill('30');
    await page.getByLabel(t('موضع الإشعار على الكمبيوتر', 'Desktop position')).selectOption('bottom-end');
    await page.getByRole('switch', { name: t('السلة', 'Cart') }).check();
    await page.getByRole('switch', { name: t('المدينة', 'City') }).uncheck();
    await healthy(page, 'main');
    await page.getByRole('button', { name: t('حفظ', 'Save'), exact: true }).click();
    await expect.poll(() => saved.length).toBe(1);
    expect(saved[0]).toEqual({ path: '/my-store/apps/social-proof/settings', body: { ...SETTINGS['social-proof']!.data, enabled: true, interval_seconds: 30, position: 'bottom-end', pages: { home: true, product: true, collection: true, cart: true }, show_city: false } });
    await expect(page.getByRole('status').filter({ hasText: t('تم حفظ الإعدادات', 'Settings saved') })).toBeVisible();
  });

  test(`saves a country allow-list (${locale})`, async ({ page }) => {
    const saved = await dashboard(page, locale);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/store/apps/country-restriction/settings');
    await page.getByRole('switch', { name: t('تفعيل تقييد الدول', 'Enable country restriction') }).check();
    const add = page.getByLabel(t('أضف دولة', 'Add a country'));
    await add.selectOption('SA'); await add.selectOption('EG');
    await expect(page.getByRole('list', { name: t('الدول المختارة', 'Selected countries') }).getByRole('listitem')).toHaveCount(2);
    await expect(page.getByRole('switch', { name: t('التحقق أيضًا من دولة الزائر حسب عنوان IP', 'Also check the visitor IP country') })).toBeDisabled();
    await page.getByLabel(`${t('رسالة للعميل', 'Message for shoppers')} — English`).fill('We only deliver in the Gulf and Egypt.');
    await healthy(page, 'main');
    await page.getByRole('button', { name: t('حفظ', 'Save'), exact: true }).click();
    await expect.poll(() => saved.length).toBe(1);
    expect(saved[0]!.body).toEqual({ version: 1, enabled: true, mode: 'allow', countries: ['SA', 'EG'], check_ip: false, message: { ar: '', en: 'We only deliver in the Gulf and Egypt.' } });
  });

  test(`saves fake order rules (${locale})`, async ({ page }) => {
    const saved = await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/apps/fake-orders/settings');
    await page.getByRole('switch', { name: t('تفعيل الحماية من الطلبات الوهمية', 'Enable fake order protection') }).check();
    const repeat = page.getByRole('group', { name: t('طلبات متكررة من نفس الهاتف', 'Repeated orders from the same phone') });
    await repeat.getByRole('switch', { name: t('تفعيل القاعدة', 'Enable rule') }).check();
    await repeat.getByLabel(t('الإجراء', 'Action')).selectOption('block');
    await repeat.getByLabel(t('خلال (ساعات)', 'Within (hours)')).fill('6');
    const words = page.getByRole('group', { name: t('كلمات ممنوعة في الاسم أو العنوان', 'Blocked words in the name or address') });
    await words.getByRole('switch', { name: t('تفعيل القاعدة', 'Enable rule') }).check();
    await words.getByLabel(t('كلمات ممنوعة (كلمة في كل سطر)', 'Blocked words (one per line)')).fill('test\nfake');
    await page.getByLabel(t('تصنيف الطلبات المميّزة', 'Classification for flagged orders')).selectOption('spam');
    await healthy(page, 'main');
    await page.getByRole('button', { name: t('حفظ', 'Save'), exact: true }).click();
    await expect.poll(() => saved.length).toBe(1);
    const defaults = SETTINGS['fake-orders']!.data as { rules: Record<string, Record<string, unknown>> };
    expect(saved[0]!.body).toEqual({ ...SETTINGS['fake-orders']!.data, enabled: true, flag_classification: 'spam', rules: { ...defaults.rules,
      repeat_phone: { enabled: true, action: 'block', hours: 6, max_orders: 2 }, blocked_words: { enabled: true, action: 'flag', words: ['test', 'fake'] } } });
  });

  test(`saves a product bundle (${locale})`, async ({ page }) => {
    const saved = await dashboard(page, locale);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/store/apps/bundles/settings');
    await page.getByRole('button', { name: t('إضافة حزمة', 'Add bundle') }).click();
    const bundle = page.getByRole('group', { name: `${t('حزمة', 'Bundle')} 1` });
    await bundle.getByLabel(`${t('عنوان الحزمة', 'Bundle title')} — العربية`).fill('اشترِهما معًا');
    await bundle.getByLabel(`${t('عنوان الحزمة', 'Bundle title')} — English`).fill('Buy them together');
    const picker = bundle.getByLabel(t('أضف منتجًا إلى الحزمة', 'Add a product to the bundle'));
    await expect(picker.locator('option')).toHaveCount(3);
    await picker.selectOption('3'); await picker.selectOption('4');
    await bundle.getByLabel(t('خصم الحزمة (%)', 'Bundle discount (%)')).fill('15');
    await page.getByRole('switch', { name: t('تفعيل حزم المنتجات', 'Enable product bundles') }).check();
    await healthy(page, 'main');
    await page.getByRole('button', { name: t('حفظ', 'Save'), exact: true }).click();
    await expect.poll(() => saved.length).toBe(1);
    expect(saved[0]!.body).toEqual({ version: 1, enabled: true, bundles: [{ title: { ar: 'اشترِهما معًا', en: 'Buy them together' }, product_ids: [3, 4], discount_percent: 15, active: true }] });
  });

  test(`unbuilt integrations are shown as coming soon (${locale})`, async ({ page }) => {
    await dashboard(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/apps/taager');
    await expect(page.getByText(t('قريبًا', 'Coming soon'), { exact: true })).toBeVisible();
    await expect(page.getByText(t('هذا التطبيق لم يُطلق بعد', 'this app has not launched yet'), { exact: false })).toBeVisible();
    await expect(page.getByRole('switch')).toHaveCount(0);
    await expect(page.getByRole('link', { name: t('إدارة', 'Manage') })).toHaveCount(0);
    await healthy(page, 'main');
  });

  test(`storefront sales notification is anonymised, polite and dismissible (${locale})`, async ({ page }) => {
    await storefront(page, locale, { socialProof: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/cart?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    const region = page.locator('.sf-social-proof');
    await expect(region).toHaveAttribute('role', 'status');
    await expect(region).toHaveAttribute('aria-live', 'polite');
    await expect(region).toContainText(t('م. من القاهرة اشترى Synthetic linen shirt', 'M. in Cairo bought Synthetic linen shirt'));
    await expect(region).toContainText(locale === 'ar' ? /دقائق/ : '5 minutes ago');
    // Phones: the notification sits at the top, clear of the checkout button.
    const card = await region.locator('.sf-social-proof__card').boundingBox();
    const checkout = await page.locator('.sf-cart2-summary a[href="/checkout"]').first().boundingBox();
    expect(card && card.y < 120).toBe(true);
    if (card && checkout) expect(card.y + card.height <= checkout.y || checkout.y + checkout.height <= card.y).toBe(true);
    await healthy(page, '.sf-social-proof');
    await region.getByRole('button', { name: t('إخفاء إشعارات المبيعات', 'Hide sales notifications') }).click();
    await expect(page.locator('.sf-social-proof')).toHaveCount(0);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('.sf-social-proof__card')).toHaveCount(0);
  });

  test(`checkout explains and enforces the country restriction (${locale})`, async ({ page }) => {
    const quotes = await storefront(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await expect(page.getByText(t('يوصّل هذا المتجر الطلبات إلى: مصر.', 'This store delivers to: Egypt.'))).toBeVisible();
    await page.getByLabel(t('الاسم الكامل *', 'Full name *')).fill('Synthetic Buyer');
    await page.getByLabel(t('رقم الهاتف *', 'Phone *')).fill('+201000000000');
    await page.getByLabel(t('المدينة *', 'City *')).fill('Austin');
    await page.getByLabel(t('العنوان *', 'Address *')).fill('1 Synthetic Street');
    await page.getByLabel(t('الدولة *', 'Country *')).selectOption('US');
    const message = t('عذرًا، لا يستقبل هذا المتجر الطلبات من هذه الدولة حاليًا.', 'Sorry, this store does not currently accept orders for this country.');
    await expect(page.getByRole('alert').filter({ hasText: message }).first()).toBeVisible();
    await expect(page.locator('.sf-co-pay')).toBeDisabled();
    await expect.poll(() => quotes.some((body) => body.shipping_country === 'US')).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.sf-co-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);

    await page.getByLabel(t('الدولة *', 'Country *')).selectOption('EG');
    await expect(page.locator('.sf-field__error').filter({ hasText: message })).toHaveCount(0);
    await expect.poll(() => quotes.some((body) => body.shipping_country === 'EG')).toBe(true);
    await page.getByRole('radio', { name: t('الدفع عند الاستلام', 'Cash on delivery') }).check();
    await expect(page.locator('.sf-co-pay')).toBeEnabled();
  });

  test(`product page offers a bundle that adds every product to the cart (${locale})`, async ({ page }) => {
    await storefront(page, locale, { bundles: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/products/synthetic-shirt?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    const offer = page.getByRole('region', { name: t('يُشترى معًا', 'Frequently bought together') });
    await expect(offer.getByRole('heading', { name: t('اشترِهما معًا', 'Buy them together') })).toBeVisible();
    await expect(offer).toContainText(t('وفّر 20%', 'Save 20%'));
    await expect(offer.locator('.sf-bundles__total strong')).toContainText('480');
    await healthy(page, '.sf-bundles');
    await offer.getByRole('button', { name: t('أضف المنتجات (2) إلى السلة', 'Add all 2 to cart') }).click();
    await expect(offer.getByRole('status')).toHaveText(t('أُضيفت منتجات الحزمة إلى السلة.', 'The bundle products were added to your cart.'));
    const saved = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}') as { lines?: Array<{ productId: string }> }, `sf-cart-v2:${STORE_ID}:USD`);
    expect(saved.lines?.map((line) => line.productId).sort()).toEqual(['700', '701']);
  });

  test(`zone checkout shows the country policy and cannot place an order for a refused country (${locale})`, async ({ page }) => {
    const quotes = await storefront(page, locale, { zones: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await expect(page.getByText(t('لا يوصّل هذا المتجر الطلبات إلى: المملكة العربية السعودية.', 'This store does not deliver to: Saudi Arabia.'))).toBeVisible();
    await page.getByLabel(t('الاسم الكامل *', 'Full name *')).fill('Synthetic Buyer');
    await page.getByLabel(t('رقم الهاتف *', 'Phone *')).fill('+201000000000');
    await page.getByLabel(t('المدينة *', 'City *')).fill('Nasr City');
    await page.getByLabel(t('العنوان *', 'Address *')).fill('1 Synthetic Street');
    await page.getByRole('radio', { name: t('الدفع عند الاستلام', 'Cash on delivery') }).check();
    const country = page.getByLabel(t('الدولة *', 'Country *'));
    await country.selectOption('SA');
    await expect(page.locator('.sf-field__error').filter({ hasText: t('لا نوصّل إلى هذه الدولة حاليًا.', 'We do not deliver to this country yet.') })).toBeVisible();
    await expect.poll(() => quotes.some((body) => body.shipping_country === 'SA')).toBe(true);
    await expect(page.locator('.sf-co-pay')).toBeDisabled();
    await healthy(page, '.sf-co-shell');

    await country.selectOption('EG');
    await expect(page.locator('.sf-field__error').filter({ hasText: t('لا نوصّل إلى هذه الدولة حاليًا.', 'We do not deliver to this country yet.') })).toHaveCount(0);
    const choices = page.locator('.sf-co-shipping [data-shipping-rate]');
    await expect(choices.first()).toContainText('Egypt standard');
    await page.getByLabel(t('المنطقة / المحافظة', 'Region / governorate')).selectOption('cairo');
    await expect(choices.first()).toContainText('Inside Cairo');
    await expect.poll(() => quotes.some((body) => body.shipping_country === 'EG' && body.shipping_region_id === 'cairo' && body.shipping_rate_id === undefined)).toBe(true);
    await expect(page.locator('.sf-co-pay')).toBeEnabled();
  });
}
