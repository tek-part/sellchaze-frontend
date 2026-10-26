import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Draft orders in the merchant workspace. Every API call is intercepted: no real store, customer,
// order or message is touched, and the platform never sends the invoice itself.
type Json = Record<string, unknown>;

const totalsFor = (body: Json) => {
    const lines = (body.line_items as Json[] | undefined) ?? [];
    const priced = lines.map((line) => ({ ...line, title: line.type === 'custom' ? line.title : 'Linen shirt', unit_price: line.type === 'custom' ? line.unit_price : '100.00',
        line_total: (Number(line.type === 'custom' ? line.unit_price : 100) * Number(line.quantity)).toFixed(2) }));
    const subtotal = priced.reduce((sum, line) => sum + Number(line.line_total), 0);
    return { currency: 'USD', line_items: priced, subtotal: subtotal.toFixed(2), discount_total: '0.00', discounts: [], shipping_total: '15.00', shipping: { type: 'rate', title: 'Standard' },
        tax_total: '0.00', tax_included: false, grand_total: (subtotal + 15).toFixed(2), requires_shipping: true, has_digital: false };
};

async function workspace(page: Page, locale: 'ar' | 'en') {
    const writes: Array<{ method: string; path: string; body: Json }> = [];
    const listQueries: Array<Record<string, string>> = [];
    const drafts: Record<number, Json> = {
        41: { id: 41, number: 'D-1041', status: 'invoice_sent', store_customer_id: null, customer: { name: 'Omar Said', phone: '+201000000041' }, shipping_address: {}, line_items: [], applied_discount: null, shipping_line: null, totals: null, currency: 'USD', grand_total: '320.00', note: null, tags: ['vip'], editable: true, items_count: 3, expired: false, created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-21T10:00:00Z' },
        40: { id: 40, number: 'D-1040', status: 'completed', store_customer_id: null, customer: { name: 'Mona Adel' }, shipping_address: {}, line_items: [], applied_discount: null, shipping_line: null, totals: null, currency: 'USD', grand_total: '90.00', note: null, tags: [], editable: false, items_count: 1, expired: false, created_at: '2026-10-19T10:00:00Z', updated_at: '2026-10-19T12:00:00Z' },
    };
    await page.addInitScript((language) => {
        localStorage.setItem('sellchase_access_token', 'isolated-draft-orders-fixture');
        localStorage.setItem('sellchase_locale', language);
        localStorage.setItem('sellchaze_workspace_appearance', 'light');
    }, locale);
    await page.route('**/api/v1/**', async (route) => {
        const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
        const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (req.method() !== 'GET') {
            const body = (req.postDataJSON() ?? {}) as Json;
            writes.push({ method: req.method(), path, body });
            if (path === '/my-store/draft-orders/calculate' || /\/draft-orders\/\d+\/calculate$/.test(path)) return route.fulfill({ json: { data: totalsFor(body) }, headers });
            if (path === '/my-store/draft-orders') {
                const created = { ...body, id: 55, number: 'D-1055', status: 'open', editable: true, currency: 'USD', totals: totalsFor(body), grand_total: totalsFor(body).grand_total, line_items: totalsFor(body).line_items, tags: body.tags ?? [] };
                drafts[55] = created;
                return route.fulfill({ status: 201, json: { data: created }, headers });
            }
            const action = path.match(/^\/my-store\/draft-orders\/(\d+)\/(complete|invoice)$/);
            if (action) {
                const draft = drafts[Number(action[1])];
                if (action[2] === 'invoice') {
                    Object.assign(draft, { status: 'invoice_sent' });
                    const message = 'Hi Laila, here is your invoice D-1055: https://synthetic-shop.example/invoices/0123456789abcdef0123456789abcdef0123456789abcdef';
                    return route.fulfill({ json: { data: draft, invoice: { url: 'https://synthetic-shop.example/invoices/0123456789abcdef0123456789abcdef0123456789abcdef', expires_at: '2026-11-25T10:00:00Z', message, messages: { en: message, ar: message }, whatsapp_url: 'https://wa.me/201001112233' } }, headers });
                }
                Object.assign(draft, { status: 'completed', editable: false, completed_order_id: 901, completed_order_number: 'ORD-20261026-SYNTH1' });
                return route.fulfill({ status: 201, json: { data: draft, order: { id: 901, order_number: 'ORD-20261026-SYNTH1', payment_status: body.payment_status, payment_method: 'cod', grand_total: draft.grand_total, currency: 'USD' }, created: true }, headers });
            }
            return route.fulfill({ status: 404, json: { message: 'Unexpected write' }, headers });
        }
        if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Isolated drafts fixture', roles: ['Merchant'], permissions: ['store.orders.manage'], is_active: true } }, headers });
        if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Synthetic shop', slug: 'synthetic-shop', status: 'active', currency: 'USD', default_locale: 'en', supported_locales: ['en', 'ar'] } }, headers });
        if (path === '/my-store/draft-orders') {
            const query = Object.fromEntries(url.searchParams.entries()); listQueries.push(query);
            const rows = Object.values(drafts).filter((row) => !query.status || row.status === query.status).sort((a, b) => Number(b.id) - Number(a.id));
            return route.fulfill({ json: { data: rows, meta: { current_page: 1, last_page: 1, per_page: 25, total: rows.length, counts: {} } }, headers });
        }
        if (path === '/my-store/draft-orders/options') return route.fulfill({ json: { data: { currency: 'USD', shipping: { enabled: true, regions_enabled: false, regions: [], options: [{ id: 'standard', name: { en: 'Standard', ar: 'عادي' }, rate: '15.00' }] }, tax: { enabled: false, rate: '0', prices_include: false } } }, headers });
        const one = path.match(/^\/my-store\/draft-orders\/(\d+)$/);
        if (one) return route.fulfill({ json: { data: drafts[Number(one[1])] }, headers });
        if (path === '/my-store/customers/directory') return route.fulfill({ json: { data: url.searchParams.get('search') ? [{ key: 'c1', name: 'Laila Hassan', email: 'laila@example.test', phone: '+201001112233', account_id: 12, city: 'Cairo' }] : [], meta: { total: 1 } }, headers });
        if (path === '/my-store/orders/manual/products') return route.fulfill({ json: { data: [{ id: 700, name: 'Linen shirt', sku: 'LS-1', price: '100.00', image_url: null, created_at: '2026-10-01T10:00:00Z', variants_count: 0, digital_type: 'physical', personalization_fields: [] }], meta: { current_page: 1, last_page: 1, total: 1, per_page: 25 }, store: { currency: 'USD' } }, headers });
        return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
    });
    return { writes, listQueries };
}

const words = {
    ar: { tabSent: 'تم إرسال الفاتورة', create: 'إنشاء مسودة', search: 'ابحث عن عميل', browse: 'تصفح المنتجات', select: 'اختيار Linen shirt', addProducts: 'اضافة المنتجات', custom: 'عنصر مخصص', itemName: 'اسم العنصر', price: 'السعر', addItem: 'إضافة العنصر', increase: 'زيادة كمية Linen shirt', save: 'حفظ', paid: 'تحديد كمدفوع وإنشاء الطلب', confirm: 'إنشاء الطلب', copy: 'نسخ رابط الفاتورة', whatsapp: 'فتح مشاركة واتساب', created: 'تم إنشاء الطلب ORD-20261026-SYNTH1 مدفوعًا.', title: 'المسودات' },
    en: { tabSent: 'Invoice sent', create: 'Create draft', search: 'Search customers', browse: 'Browse products', select: 'Select Linen shirt', addProducts: 'Add products', custom: 'Custom item', itemName: 'Item name', price: 'Price', addItem: 'Add item', increase: 'Increase quantity of Linen shirt', save: 'Save', paid: 'Mark as paid & create order', confirm: 'Create order', copy: 'Copy invoice link', whatsapp: 'Open WhatsApp share', created: 'Order ORD-20261026-SYNTH1 created as paid.', title: 'Drafts' },
};

async function seriousViolations(page: Page, selector: string) {
    const results = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    return results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')).map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`);
}

const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const locale of ['ar', 'en'] as const) {
    const w = words[locale];

    test(`Drafts list shows status views and searches in ${locale}`, async ({ page }) => {
        const api = await workspace(page, locale);
        await page.goto('/store/draft-orders');
        await expect(page.getByRole('heading', { name: w.title, exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'D-1041', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'D-1040', exact: true })).toBeVisible();
        await page.getByRole('tab', { name: w.tabSent, exact: true }).click();
        await expect.poll(() => api.listQueries.at(-1)?.status).toBe('invoice_sent');
        await expect(page.getByRole('link', { name: 'D-1040', exact: true })).toHaveCount(0);
        expect(api.writes).toEqual([]);
    });

    test(`A draft is built, calculated, saved, shared and completed as paid in ${locale}`, async ({ page }) => {
        const api = await workspace(page, locale);
        await page.goto('/store/draft-orders/new');
        await page.getByLabel(w.search, { exact: true }).fill('Lai');
        await page.getByRole('button', { name: /Laila Hassan/ }).click();
        await page.getByRole('button', { name: w.browse, exact: true }).click();
        await page.getByRole('checkbox', { name: w.select, exact: true }).check();
        await page.getByRole('button', { name: w.addProducts, exact: true }).click();
        await page.getByRole('button', { name: w.increase, exact: true }).click();
        await page.getByRole('button', { name: w.custom, exact: true }).click();
        await page.getByLabel(w.itemName, { exact: true }).fill('Gift wrapping');
        await page.getByLabel(w.price, { exact: true }).fill('5.00');
        await page.getByRole('button', { name: w.addItem, exact: true }).click();

        const expectedLines = [{ type: 'product', product_id: 700, quantity: 2 }, { type: 'custom', title: 'Gift wrapping', unit_price: '5.00', quantity: 1, requires_shipping: true }];
        await expect.poll(() => api.writes.filter((write) => write.path === '/my-store/draft-orders/calculate').at(-1)?.body.line_items).toEqual(expectedLines);
        await expect(page.locator('.ws-draft-grand')).toContainText(locale === 'ar' ? '٢٢٠' : '220');

        await page.getByRole('button', { name: w.save, exact: true }).click();
        await expect(page).toHaveURL(/\/store\/draft-orders\/55$/);
        expect(api.writes.find((write) => write.path === '/my-store/draft-orders')?.body).toEqual({
            store_customer_id: 12, customer: { name: 'Laila Hassan', email: 'laila@example.test', phone: '+201001112233' }, shipping_address: { city: 'Cairo' },
            line_items: expectedLines, applied_discount: null, shipping_line: null, note: null, tags: [],
        });

        await page.getByRole('button', { name: w.copy, exact: true }).click();
        await expect(page.locator('#draft-invoice-url')).toHaveValue(/\/invoices\/[a-f0-9]{48}$/);
        await expect(page.getByRole('link', { name: w.whatsapp, exact: true })).toHaveAttribute('href', /^https:\/\/wa\.me\/201001112233\?text=Hi%20Laila/);

        await page.getByRole('button', { name: w.paid, exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: w.confirm, exact: true }).click();
        await expect(page.getByRole('status').filter({ hasText: w.created })).toBeVisible();
        expect(api.writes.filter((write) => write.path.endsWith('/complete'))).toEqual([{ method: 'POST', path: '/my-store/draft-orders/55/complete', body: { payment_status: 'paid' } }]);
        await expect(page.getByRole('link', { name: 'ORD-20261026-SYNTH1' })).toHaveAttribute('href', '/store/orders/901');
        // Nothing was sent anywhere except the mocked store API.
        expect(api.writes.map((write) => write.path).filter((path) => !path.startsWith('/my-store/draft-orders'))).toEqual([]);
    });

    test(`Drafts list and editor are accessible and fit 390px in ${locale}`, async ({ page }) => {
        await workspace(page, locale);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/store/draft-orders');
        await expect(page.locator('.ws-dt-table tbody tr')).toHaveCount(2);
        await page.evaluate(() => document.fonts.ready);
        expect(await fits(page)).toBe(true);
        expect(await seriousViolations(page, '.ws-catalog-page')).toEqual([]);
        await page.goto('/store/draft-orders/new');
        await page.getByRole('button', { name: w.custom, exact: true }).click();
        await page.getByLabel(w.itemName, { exact: true }).fill('Consultation with a deliberately long service name for wrapping');
        await page.getByLabel(w.price, { exact: true }).fill('250.00');
        await page.getByRole('button', { name: w.addItem, exact: true }).click();
        await expect(page.locator('.ws-draft-line')).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        expect(await fits(page)).toBe(true);
        expect(await seriousViolations(page, '.ws-draft-editor')).toEqual([]);
        await page.screenshot({ path: `test-results/store-draft-editor-${locale}-390.png`, fullPage: true });
    });
}
