import { expect, test } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe.configure({ retries: 0 });
for (const locale of ['ar', 'en'] as const) for (const width of [1920, 390, 320]) for (const appearance of ['light', 'dark']) {
  test(`product pixel rows and persistence ${locale} ${width} ${appearance}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1920 ? 975 : width === 390 ? 844 : 568 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(({ locale, appearance }) => { localStorage.setItem('sellchase_access_token', 'isolated-product-pixels'); localStorage.setItem('sellchase_locale', locale); localStorage.setItem('sellchaze_workspace_appearance', appearance); }, { locale, appearance });
    let product = { id: 30, name: 'Synthetic product', slug: 'synthetic-product', price: 10, is_active: true, media: [], variants: [], translations: {}, preferences_version: 'a'.repeat(64), product_preferences: { is_skip_cart: false, browser_pixels: null as null | Array<{provider: string; id: string}> } };
    const writes: unknown[] = [];
    await page.route('**/api/v1/**', async route => {
      const request = route.request(), endpoint = new URL(request.url()).pathname.replace('/api/v1', '');
      const headers = { 'access-control-allow-origin': request.headers().origin || 'http://127.0.0.1:4183', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization,content-type,x-requested-with', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      let json: unknown = { data: [], unread: 0, count: 0 };
      if (endpoint === '/auth/me') json = { user: { id: 1, name: 'Synthetic owner', roles: ['Merchant'], permissions: ['store.view', 'store.products.manage', 'products-list', 'products-create', 'products-edit'], is_active: true, pending_approval: false } };
      if (endpoint === '/my-store') json = { data: { id: 1, owner_user_id: 1, name: 'Synthetic store', slug: 'synthetic', status: 'active', currency: 'USD', default_locale: locale, supported_locales: ['ar', 'en'] } };
      if (request.method() !== 'GET') {
        expect(endpoint).toBe('/my-store/catalog/products/30');
        const form = await new Response(request.postDataBuffer(), { headers: { 'content-type': request.headers()['content-type'] } }).formData();
        expect(form.get('preferences_version')).toBe('a'.repeat(64));
        const preferences = JSON.parse(String(form.get('product_preferences')));
        expect(preferences.is_skip_cart).toBe(false); writes.push(preferences.browser_pixels);
        product = { ...product, product_preferences: preferences };
      }
      if (endpoint === '/my-store/catalog/products/30') json = { data: product };
      return route.fulfill({ headers, json });
    });
    await page.goto('/store/products/30/edit');
    const card = page.locator('.pe-product-pixels'), add = card.getByRole('button', { name: locale === 'ar' ? 'إضافة Pixel' : 'Add Pixel', exact: true }), save = page.getByRole('button', { name: locale === 'ar' ? 'حفظ' : 'Save', exact: true });
    await expect(add).toBeVisible(); await expect(card.locator('.pe-pixel-row')).toHaveCount(0);
    const rows = [{ provider: 'facebook', id: '2345678901' }, { provider: 'tiktok', id: 'C7TEST0123456789ABCDE0' }, { provider: 'snapchat', id: '12345678-1234-4234-8234-123456789abc' }];
    for (let i = 0; i < rows.length; i++) {
      await add.click(); await expect(save).toBeDisabled();
      const row = card.locator('.pe-pixel-row').nth(i);
      await row.getByRole('textbox').fill(rows[i]!.id);
      await row.getByRole('combobox').selectOption(rows[i]!.provider);
    }
    await expect(save).toBeEnabled(); await save.click();
    await expect.poll(() => writes.length).toBe(1); expect(writes[0]).toEqual(rows);
    await page.reload(); await expect(card.locator('.pe-pixel-row')).toHaveCount(3);
    for (let i = 0; i < rows.length; i++) {
      const row = card.locator('.pe-pixel-row').nth(i);
      await expect(row.getByRole('textbox')).toHaveValue(rows[i]!.id); await expect(row.getByRole('combobox')).toHaveValue(rows[i]!.provider);
    }
    const lastRemove = card.getByRole('button', { name: locale === 'ar' ? 'إزالة البيكسل 3' : 'Remove pixel 3', exact: true });
    await card.locator('.pe-pixel-row').nth(2).getByRole('combobox').press('Tab');
    await expect(lastRemove).toBeFocused();
    expect(await lastRemove.evaluate(button => { const r = button.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('button') === button; })).toBe(true);
    expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.pe-product-pixels').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact || '')).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    if (process.env.PRODUCT_PIXELS_AUDIT_DIR) await card.screenshot({ path: `${process.env.PRODUCT_PIXELS_AUDIT_DIR}/merchant-product-pixels-${locale}-${width}-${appearance}.png` });
    await card.getByRole('button', { name: locale === 'ar' ? 'إزالة البيكسل 2' : 'Remove pixel 2', exact: true }).click();
    await save.click(); await expect.poll(() => writes.length).toBe(2); expect(writes[1]).toEqual([rows[0], rows[2]]);
    while (await card.locator('.pe-pixel-row').count()) await card.getByRole('button', { name: locale === 'ar' ? 'إزالة البيكسل 1' : 'Remove pixel 1', exact: true }).click();
    await expect(add).toBeFocused(); await save.click(); await expect.poll(() => writes.length).toBe(3); expect(writes[2]).toBeNull();
    await page.reload(); await expect(card.locator('.pe-pixel-row')).toHaveCount(0);
  });
}
