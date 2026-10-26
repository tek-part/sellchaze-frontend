import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// G3 catalog power tools (TAR-036). Fully intercepted merchant API: these tests never contact a real backend.
type Json = Record<string, unknown>;
const PERMISSIONS = ['store.view', 'store.orders.manage', 'products-list', 'products-create', 'products-edit', 'products-delete', 'categories-list'];
const version = (n: number) => String(n).repeat(64).slice(0, 64);
const PRODUCTS = [
  { id: 1, name: 'Red Runner', slug: 'red-runner', sku: 'RR-1', price: '150.00', compare_price: null, is_active: true, image_url: null, variants: [], category: { id: 3, name: 'Shoes' }, edit_version: version(1), transfer_version: version(2) },
  { id: 2, name: 'Blue Tote', slug: 'blue-tote', sku: 'BT-2', price: '40.00', compare_price: '50.00', is_active: true, image_url: null, variants: [], category: null, edit_version: version(3), transfer_version: version(4) },
];
const VARIANTS = [
  { id: 11, name: 'S', options: { Size: 'S' }, is_active: true, price_override: null, stock_quantity: 2, reserved_quantity: 0, track_inventory: true, edit_version: 'a'.repeat(64) },
  { id: 12, name: 'M', options: { Size: 'M' }, is_active: true, price_override: '160.00', stock_quantity: 3, reserved_quantity: 0, track_inventory: true, edit_version: 'b'.repeat(64) },
  { id: 13, name: 'L', options: { Size: 'L' }, is_active: true, price_override: null, stock_quantity: 4, reserved_quantity: 0, track_inventory: true, edit_version: 'c'.repeat(64) },
];

async function workspace(page: Page, locale: 'ar' | 'en') {
  const writes: Array<{ method: string; path: string; body: unknown }> = [];
  const history: Json[] = [];
  let polls = 0;
  await page.addInitScript(locale => { localStorage.setItem('sellchase_access_token', 'isolated-catalog-tools'); localStorage.setItem('sellchase_locale', locale); localStorage.setItem('sellchaze_workspace_appearance', 'light'); }, locale);
  await page.route('**/api/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', ''); const method = req.method();
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body, headers });
    const body = () => { try { return req.postDataJSON(); } catch { return req.postData(); } };
    if (path === '/auth/me') return json({ user: { id: 1, name: 'Catalog fixture', roles: ['Merchant'], permissions: PERMISSIONS, is_active: true, pending_approval: false } });
    if (path === '/my-store') return json({ data: { id: 1, owner_user_id: 1, name: 'Catalog store', slug: 'fixture', status: 'active', currency: 'USD', default_locale: locale, supported_locales: ['ar', 'en'] } });
    if (path === '/my-store/catalog/categories') return json({ data: [{ id: 3, name: 'Shoes' }, { id: 4, name: 'Sale' }], meta: { current_page: 1, last_page: 1, total: 2 } });
    if (path === '/my-store/catalog/products' && method === 'GET') return json({ data: PRODUCTS, meta: { current_page: 1, last_page: 1, per_page: 25, total: 2 } });
    if (path === '/my-store/catalog/products/price-changes' && method === 'GET') return json({ data: history });
    if (path === '/my-store/catalog/products/price-changes/preview') {
      writes.push({ method, path, body: body() });
      return json({ data: { product_count: 2, variant_count: 1, out_of_range: 0, compare_below_price: 0, fingerprint: 'f'.repeat(64), samples: [{ id: 1, name: 'Red Runner', price: '150.00', new_price: '165.00', compare_price: null, new_compare_price: null, variants: 1 }, { id: 2, name: 'Blue Tote', price: '40.00', new_price: '44.00', compare_price: '50.00', new_compare_price: '55.00', variants: 0 }] } });
    }
    if (path === '/my-store/catalog/products/price-changes' && method === 'POST') {
      writes.push({ method, path, body: body() });
      const change = { id: 7, status: 'applied', scope: { type: 'category', category_id: 3, category_name: 'Shoes' }, operation: { direction: 'increase', kind: 'percent', value: '10.0000', rounding: 'none' }, product_count: 2, variant_count: 1, actor: 'Catalog fixture', created_at: '2026-10-26T10:00:00Z', reverted_at: null, revert_result: null };
      history.unshift(change);
      return json({ data: change }, 201);
    }
    if (path === '/my-store/catalog/products/price-changes/7/revert') {
      writes.push({ method, path, body: null });
      Object.assign(history[0], { status: 'reverted', revert_result: { restored: 3, skipped: 0 } });
      return json({ data: history[0] });
    }
    if (path === '/my-store/catalog/products/bulk') { writes.push({ method, path, body: body() }); return json({ meta: { updated: 2 } }); }
    if (path.startsWith('/my-store/catalog/products/sheet-import/update')) {
      const preview = path.endsWith('/preview');
      writes.push({ method, path, body: null });
      const bad = (req.postData() || '').includes('broken.csv');
      if (!preview) return json({ meta: { created: 0, updated: 1, ids: [] } }, 201);
      return json({ data: { mode: 'update', currency: 'USD', summary: { rows: 2, errors: bad ? 1 : 0, unchanged: bad ? 0 : 1, create_products: 0, create_variants: 0, update_products: 1, update_variants: 0 },
        rows: [{ row: 2, action: 'update', product: 'Red Runner', variant: null, changes: [{ field: 'price', from: '150.00', to: '120.00' }], errors: [] },
          bad ? { row: 3, action: 'error', product: null, variant: null, changes: [], errors: [{ code: 'product_not_found', field: 'product_id', message: 'No product with this ID exists in this store.' }] } : { row: 3, action: 'unchanged', product: 'Blue Tote', variant: null, changes: [], errors: [] }] } });
    }
    if (path === '/my-store/catalog/products/30') return json({ data: { id: 30, name: 'Sized shoe', slug: 'sized-shoe', price: '150.00', is_active: true, media: [], variants: VARIANTS, option_display: [], translations: { name: {} }, preferences_version: 'd'.repeat(64), product_preferences: {} } });
    if (path === '/my-store/catalog/products/30/variants') return json({ data: VARIANTS });
    if (path === '/my-store/catalog/products/30/variants/order') { const sent = body() as { variants: Array<{ id: number }> }; writes.push({ method, path, body: sent }); return json({ data: sent.variants.map(v => VARIANTS.find(row => row.id === v.id)) }); }
    if (path === '/my-store/blocked-phone-numbers') return json({ data: [], phone_country: 'EG', meta: { current_page: 1, last_page: 1, total: 0 } });
    if (path === '/my-store/blocked-phone-numbers/imports' && method === 'GET') return json({ data: [] });
    if (path === '/my-store/blocked-phone-numbers/imports' && method === 'POST') { writes.push({ method, path, body: null }); return json({ data: { id: '0b8f7c1e-1111-4a2a-9c2d-000000000001', status: 'queued', file_name: 'phones.csv', total_rows: null, processed_rows: 0, imported: 0, duplicates: 0, invalid: 0, skipped_inactive: 0, invalid_samples: [] } }, 202); }
    if (path === '/my-store/blocked-phone-numbers/imports/0b8f7c1e-1111-4a2a-9c2d-000000000001') {
      polls++;
      return json({ data: polls < 2 ? { id: '0b8f7c1e-1111-4a2a-9c2d-000000000001', status: 'processing', file_name: 'phones.csv', total_rows: 120000, processed_rows: 60000, imported: 59990, duplicates: 10, invalid: 0, skipped_inactive: 0, invalid_samples: [] }
        : { id: '0b8f7c1e-1111-4a2a-9c2d-000000000001', status: 'completed', file_name: 'phones.csv', total_rows: 120000, processed_rows: 120000, imported: 119980, duplicates: 15, invalid: 5, skipped_inactive: 0, invalid_samples: [{ row: 9, value: 'abc' }] } });
    }
    if (path === '/my-store/blocked-phone-numbers/export') { writes.push({ method, path: `${path}?${url.searchParams}`, body: null }); return route.fulfill({ status: 200, body: '﻿phone,phone_normalized\n', headers: { ...headers, 'Content-Type': 'text/csv' } }); }
    if (method !== 'GET') { writes.push({ method, path, body: body() }); return json({ message: `Unexpected write ${path}` }, 422); }
    return json({ data: [], unread_count: 0 });
  });
  return { writes };
}

async function accessible(page: Page, selector: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).include(selector).analyze();
  expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
}

for (const locale of ['ar', 'en'] as const) {
  const ar = locale === 'ar';
  const t = (a: string, e: string) => ar ? a : e;

  test(`category price change previews, applies and reverts in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/products');
    await page.getByRole('button', { name: t('تعديل الأسعار بالجملة', 'Bulk price change') }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: new RegExp(`^${t('القسم', 'Category')}`) }).selectOption('3');
    await dialog.getByLabel(t('القيمة', 'Value')).fill('10');
    await dialog.getByLabel(t('التقريب', 'Rounding')).selectOption('ceil');
    await dialog.getByRole('button', { name: t('معاينة التعديل', 'Preview change') }).click();
    await expect(dialog.getByRole('table')).toContainText('Blue Tote');
    expect(api.writes.at(-1)?.body).toEqual({ scope: { type: 'category', category_id: 3 }, direction: 'increase', kind: 'percent', value: '10', apply_compare: true, apply_variants: true, rounding: 'ceil' });
    await accessible(page, '[role="dialog"]');
    await dialog.getByRole('button', { name: t('تطبيق التعديل', 'Apply change') }).click();
    await expect(dialog.getByRole('status')).toContainText(t('تم تعديل أسعار 2 منتج', 'Prices updated for 2 products'));
    expect(api.writes.at(-1)?.body).toMatchObject({ fingerprint: 'f'.repeat(64), rounding: 'ceil' });
    await dialog.getByRole('button', { name: t('تراجع عن هذا التعديل', 'Undo this change') }).click();
    await expect(dialog.getByRole('status')).toContainText(t('تمت استعادة 3 سعر', '3 prices restored'));
    expect(api.writes.at(-1)?.path).toBe('/my-store/catalog/products/price-changes/7/revert');
  });

  test(`bulk edit adds selected products to a category in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/products');
    await page.getByRole('checkbox', { name: t('تحديد كل عناصر الصفحة', 'Select all on this page') }).first().check();
    await page.getByRole('button', { name: t('تعديل', 'Edit'), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(t('إضافة إلى قسم (مع الاحتفاظ بالأقسام الحالية)', 'Add to category (keeps current categories)')).selectOption('4');
    await expect(dialog.getByLabel(t('استبدال القسم الأساسي', 'Replace primary category'))).toBeDisabled();
    await accessible(page, '[role="dialog"]');
    await dialog.getByRole('button', { name: t('حفظ التعديل', 'Save changes') }).click();
    await expect.poll(() => api.writes.find(w => w.path === '/my-store/catalog/products/bulk')?.body).toEqual({ products: [{ id: 1, version: version(1) }, { id: 2, version: version(3) }], changes: { add_category_id: 4 } });
  });

  test(`sheet import dry run blocks errors and applies a clean file in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/products');
    await page.getByRole('button', { name: t('ملف Excel / CSV', 'Excel / CSV sheet') }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('radio', { name: t('تحديث المنتجات الموجودة (مطابقة بالمعرّف أو SKU)', 'Update existing products (match by ID or SKU)') })).toBeChecked();
    await dialog.getByLabel(t('ملف المنتجات', 'Products file')).setInputFiles({ name: 'broken.csv', mimeType: 'text/csv', buffer: Buffer.from('product_id,price\n1,120\n999,5\n') });
    await dialog.getByRole('button', { name: t('فحص الملف', 'Check file') }).click();
    await expect(dialog.getByRole('table')).toContainText(t('لا يوجد منتج مطابق في هذا المتجر.', 'No matching product exists in this store.'));
    await expect(dialog.getByRole('table')).not.toContainText('Red Runner');
    await expect(dialog.getByRole('button', { name: t('تطبيق التحديثات', 'Apply updates') })).toBeDisabled();
    await accessible(page, '[role="dialog"]');
    await dialog.getByLabel(t('ملف المنتجات', 'Products file')).setInputFiles({ name: 'clean.csv', mimeType: 'text/csv', buffer: Buffer.from('product_id,price\n1,120\n2,40\n') });
    await dialog.getByRole('button', { name: t('فحص الملف', 'Check file') }).click();
    await expect(dialog.getByRole('table')).toContainText('150.00');
    await dialog.getByRole('button', { name: t('تطبيق التحديثات', 'Apply updates') }).click();
    await expect(page.getByRole('status').filter({ hasText: t('تم استيراد الملف', 'Sheet imported') })).toBeVisible();
    expect(api.writes.map(w => w.path)).toEqual(['/my-store/catalog/products/sheet-import/update/preview', '/my-store/catalog/products/sheet-import/update/preview', '/my-store/catalog/products/sheet-import/update']);
  });

  test(`product options reorder by keyboard without recreating them in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/products/30/edit');
    const handle = page.getByRole('button', { name: `${t('إعادة ترتيب', 'Reorder')} S`, exact: true });
    await handle.focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('status').filter({ hasText: t('S: الموضع 3 من 3', 'S: position 3 of 3') }).first()).toBeAttached();
    await expect(handle).toBeFocused();
    await page.getByRole('button', { name: t('حفظ الترتيب', 'Save order') }).click();
    await expect.poll(() => api.writes.find(w => w.path.endsWith('/variants/order'))?.body).toEqual({ variants: [{ id: 12, version: 'b'.repeat(64) }, { id: 13, version: 'c'.repeat(64) }, { id: 11, version: 'a'.repeat(64) }] });
    await expect(page.getByRole('button', { name: t('حفظ الترتيب', 'Save order') })).toHaveCount(0);
    expect(api.writes.filter(w => w.method === 'DELETE' || w.path.endsWith('/variants'))).toEqual([]);
  });

  test(`blocked phones import shows progress and summary and exports the list in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/blocked-phone-numbers');
    await page.getByLabel(t('ملف الأرقام', 'Numbers file')).setInputFiles({ name: 'phones.csv', mimeType: 'text/csv', buffer: Buffer.from('phone\n01001234567\n') });
    await page.getByRole('button', { name: t('استيراد الأرقام', 'Import numbers') }).click();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    await expect(page.getByText(t('اكتمل', 'Completed'))).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('region', { name: t('استيراد وتصدير القائمة', 'Import and export the list') })).toContainText(new Intl.NumberFormat(ar ? 'ar-EG' : 'en').format(119980));
    await accessible(page, 'section[aria-labelledby="phone-import-title"]');
    await page.getByRole('button', { name: t('تصدير القائمة CSV', 'Export list as CSV') }).click();
    await expect.poll(() => api.writes.find(w => w.path.startsWith('/my-store/blocked-phone-numbers/export'))?.path).toBe('/my-store/blocked-phone-numbers/export?status=active');
  });
}
