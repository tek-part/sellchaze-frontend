import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// Zone-based checkout: the address (country, then region) picks the zone and its rates. The API is
// fully mocked (synthetic store, cart, zones and quote) — no real data, no orders are placed.
const STORE_ID = 7654321;
const field = (key: string, en: string, ar: string, required = true) => ({ key, label: { en, ar }, hint: { en: '', ar: '' }, enabled: true, required, position: 0 });
const lines = [{ id: 'line-1', productId: '700', title: 'Synthetic kettle', url: '/products/synthetic-kettle', price: 100, currency: 'USD', quantity: 2 }];
const name = (en: string, ar: string) => ({ en, ar });
const rate = (id: string, en: string, ar: string, amount: string, time: [string, string], cod: string | null = null) => ({ id, name: name(en, ar), type: 'flat', price: amount, amount, free_over: null, cod_fee: cod, delivery_time: name(time[0], time[1]) });
const RATES: Record<string, ReturnType<typeof rate>[]> = {
  'EG:cairo': [rate('inside-cairo', 'Inside Cairo', 'داخل القاهرة', '30.00', ['1-2 days', 'يوم إلى يومين'])],
  'EG:': [rate('egypt-standard', 'Egypt standard', 'مصر عادي', '50.00', ['3-4 days', '٣-٤ أيام'], '15.00'), rate('egypt-express', 'Egypt express', 'مصر سريع', '90.00', ['Next day', 'اليوم التالي'])],
  'SA:': [rate('gulf-light', 'Gulf light parcels', 'شحنات الخليج الخفيفة', '120.00', ['5 days', '٥ أيام'])],
};
const ZONES = { 'EG:cairo': 'zone-cairo', 'EG:': 'zone-egypt', 'SA:': 'zone-gulf' } as Record<string, string>;

async function mockStore(page: Page, locale: 'en' | 'ar'): Promise<{ quotes: Array<Record<string, unknown>>; fields: string[] }> {
  const seen = { quotes: [] as Array<Record<string, unknown>>, fields: [] as string[] };
  await page.addInitScript(([key, value]) => { window.localStorage.setItem(key, value); }, [`sf-cart-v2:${STORE_ID}:USD`, JSON.stringify({ version: 2, storeId: String(STORE_ID), currency: 'USD', lines })]);
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false, merchant_information: { email: '', phone: '', address: '', policies: [] } }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path.endsWith('/payment-methods')) return route.fulfill({ json: { data: [{ slug: 'cod', name: 'Cash on delivery', test_mode: false }] } });
    if (path.endsWith('/checkout/fields')) {
      const key = `${url.searchParams.get('shipping_country') ?? ''}:${url.searchParams.get('shipping_region_id') ?? ''}`;
      seen.fields.push(key);
      return route.fulfill({ json: { data: [field('name', 'Full name', 'الاسم الكامل'), field('phone', 'Phone', 'رقم الهاتف'), field('country', 'Country', 'الدولة'), field('city', 'City', 'المدينة'), field('address', 'Address', 'العنوان')], requires_shipping: true, has_digital: false,
        shipping: { enabled: true, regions_enabled: false, auto_select_region: false, currency: 'USD', flat_rate: '0.00', free_over: null, regions: [], options: [], zones_enabled: true,
          countries: [{ code: 'EG', region_required: false }, { code: 'SA', region_required: false }],
          zone_regions: [{ id: 'cairo', name: name('Cairo', 'القاهرة'), country: 'EG' }, { id: 'giza', name: name('Giza', 'الجيزة'), country: 'EG' }],
          zone: ZONES[key] ? { id: ZONES[key], name: name(ZONES[key], ZONES[key]) } : null, rates: RATES[key] ?? [] } } });
    }
    if (path.endsWith('/checkout/quote')) {
      const body = request.postDataJSON() as Record<string, string>; seen.quotes.push(body);
      const key = `${body.shipping_country ?? ''}:${body.shipping_region_id ?? ''}`;
      const rates = RATES[key] ?? [];
      const applied = rates.find((row) => row.id === body.shipping_rate_id) ?? rates[0];
      const shipping = applied ? Number(applied.amount) + (applied.cod_fee ? Number(applied.cod_fee) : 0) : 0;
      const egypt = body.shipping_country === 'EG';
      const tax = egypt ? { name: name('VAT', 'ضريبة القيمة المضافة'), rate: '14.000', included: true, shipping: false, source: 'override', amount: '24.56' } : { name: null, rate: '5.000', included: false, shipping: false, source: 'store', amount: '10.00' };
      return route.fulfill({ json: { data: { currency: 'USD', requires_shipping: true, items: [{ product_id: 700, variant_id: null, name: 'Synthetic kettle', quantity: 2, unit_price: '100.00', line_total: '200.00' }],
        shipping: { mode: 'zone', zone: { id: ZONES[key], name: name(ZONES[key], ZONES[key]) }, rate_id: applied?.id ?? null, rates, free_shipping_applied: false, cod_fee: applied?.cod_fee ?? '0.00', weight_grams: 2500 }, tax,
        totals: { subtotal: '200.00', discount_total: '0.00', shipping_total: shipping.toFixed(2), tax_total: tax.amount, grand_total: (200 + shipping + (egypt ? 0 : 10)).toFixed(2) } } } });
    }
    if (request.method() !== 'GET') return route.abort();
    return route.fulfill({ json: { data: [] } });
  });
  return seen;
}

for (const locale of ['en', 'ar'] as const) {
  const t = (ar: string, en: string): string => (locale === 'ar' ? ar : en);

  test(`zone rates follow the shipping country and region, with the tax line (${locale})`, async ({ page }) => {
    const seen = await mockStore(page, locale);
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await page.getByLabel(t('الاسم الكامل *', 'Full name *')).fill('Synthetic Buyer');
    await page.getByLabel(t('رقم الهاتف *', 'Phone *')).fill('+201000000000');
    await page.getByLabel(t('المدينة *', 'City *')).fill('Nasr City');
    await page.getByLabel(t('العنوان *', 'Address *')).fill('1 Synthetic Street');
    const country = page.getByLabel(t('الدولة *', 'Country *'));
    await expect(country.locator('option')).toHaveCount(3);
    await country.selectOption('EG');
    const region = page.getByLabel(t('المنطقة / المحافظة', 'Region / governorate'));
    await region.selectOption('cairo');

    const choices = page.locator('.sf-co-shipping [data-shipping-rate]');
    await expect(choices).toHaveCount(1);
    await expect(choices.first()).toContainText(t('داخل القاهرة', 'Inside Cairo'));
    await expect(choices.first()).toContainText(t('يوم إلى يومين', '1-2 days'));
    await expect(page.locator('.sf-co-shipping .sf-co-choice.is-selected')).toHaveCount(1);
    await expect(page.locator('.sf-co__summary [data-tax-line]')).toContainText(t(`ضريبة القيمة المضافة ${new Intl.NumberFormat('ar', { maximumFractionDigits: 3 }).format(14)}% (شاملة)`, 'VAT 14% (included)'));
    expect(seen.fields).toContain('EG:cairo');

    await region.selectOption('');
    await expect(choices.first()).toContainText(t('مصر عادي', 'Egypt standard'));
    await expect(choices.first()).toContainText(t('رسوم الدفع عند الاستلام', 'Cash on delivery fee'));
    await expect(page.locator('.sf-co-shipping .sf-co-choice.is-selected')).toContainText(t('مصر عادي', 'Egypt standard'));
    await page.getByRole('radio', { name: new RegExp(t('مصر سريع', 'Egypt express')) }).check();
    await expect.poll(() => seen.quotes.at(-1)).toMatchObject({ shipping_country: 'EG', shipping_rate_id: 'egypt-express', payment_method: 'cod' });
    await expect(page.locator('.sf-co-shipping .sf-co-choice.is-selected')).toContainText(t('مصر سريع', 'Egypt express'));

    await country.selectOption('SA');
    await expect(region).toHaveCount(0);
    await expect(choices.first()).toContainText(t('شحنات الخليج الخفيفة', 'Gulf light parcels'));
    await expect.poll(() => seen.quotes.at(-1)).toMatchObject({ shipping_country: 'SA' });
    expect(seen.quotes.at(-1)).not.toHaveProperty('shipping_rate_id');
    expect(seen.quotes.at(-1)).not.toHaveProperty('shipping_region_id');
    await expect(page.locator('.sf-co__summary [data-tax-line]')).toHaveText(new RegExp(t('الضريبة', 'Tax')));
    await expect(page.locator('.sf-co__summary .sf-co-total')).toContainText('330');
    await expect(page.locator('.sf-co-pay')).toBeEnabled();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.sf-co-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });

  test(`zone checkout fits a phone (${locale})`, async ({ page }) => {
    await mockStore(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/checkout?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await page.getByLabel(t('الدولة *', 'Country *')).selectOption('EG');
    await page.getByLabel(t('المنطقة / المحافظة', 'Region / governorate')).selectOption('giza');
    await expect(page.locator('.sf-co-shipping [data-shipping-rate]')).toHaveCount(0);
    await page.getByLabel(t('المنطقة / المحافظة', 'Region / governorate')).selectOption('cairo');
    await expect(page.locator('.sf-co-shipping [data-shipping-rate]')).toHaveCount(1);
    await page.getByRole('button', { name: new RegExp(t('عرض ملخص الطلب', 'Show order summary')) }).click();
    await expect(page.locator('#sf-co-mobile-summary [data-tax-line]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.sf-co-shell').withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
