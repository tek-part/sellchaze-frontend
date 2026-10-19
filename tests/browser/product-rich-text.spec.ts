import { expect, test } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe.configure({ retries: 0 });
for (const locale of ['ar', 'en'] as const) for (const width of [1920, 390, 320]) for (const appearance of ['light', 'dark']) {
  test(`product description toolbar and formatting ${locale} ${width} ${appearance}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1920 ? 975 : width === 390 ? 844 : 568 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(({ locale, appearance }) => {
      localStorage.setItem('sellchase_access_token', 'isolated-product-description');
      localStorage.setItem('sellchase_locale', locale);
      localStorage.setItem('sellchaze_workspace_appearance', appearance);
    }, { locale, appearance });
    let product = { id: 30, name: 'Synthetic product', slug: 'synthetic-product', price: 10, description: '', is_active: true, media: [], variants: [], translations: {} };
    const writes: string[] = [];
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
        const description = String(form.get('description'));
        expect(description).toContain('color:'); expect(description).toContain('background-color:'); expect(description).toMatch(/text-align:\s*center/);
        writes.push(description); product = { ...product, description, translations: JSON.parse(String(form.get('translations'))) };
      }
      if (endpoint === '/my-store/catalog/products/30') json = { data: product };
      return route.fulfill({ headers, json });
    });
    await page.goto('/store/products/30/edit');
    const root = page.locator('.pe-basic .product-rich-text'), editor = root.locator('.tiptap'), toolbar = root.locator('.product-rich-text__toolbar');
    await expect(editor).toBeVisible();
    expect(await toolbar.evaluate(element => getComputedStyle(element).direction)).toBe('ltr');
    await expect(editor).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    const bold = toolbar.getByRole('button', { name: locale === 'ar' ? 'عريض' : 'Bold', exact: true });
    await bold.click(); await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await bold.click(); await expect(bold).toHaveAttribute('aria-pressed', 'false');
    await editor.pressSequentially('Own formatted description'); await editor.press('ControlOrMeta+A');
    await bold.click(); await expect(editor.locator('strong')).toHaveText('Own formatted description');
    await toolbar.getByRole('combobox', { name: locale === 'ar' ? 'محاذاة النص' : 'Text alignment', exact: true }).selectOption('center');
    await toolbar.getByLabel(locale === 'ar' ? 'لون النص' : 'Text color', { exact: true }).fill('#123456');
    await toolbar.getByLabel(locale === 'ar' ? 'لون خلفية النص' : 'Text background color', { exact: true }).fill('#abcdef');
    await expect(editor.locator('p')).toHaveCSS('text-align', 'center');
    await expect(editor.locator('span')).toHaveCSS('color', 'rgb(18, 52, 86)');
    await expect(editor.locator('span')).toHaveCSS('background-color', 'rgb(171, 205, 239)');
    const formatted = await editor.innerHTML();
    await editor.press('ControlOrMeta+z'); await expect.poll(() => editor.innerHTML()).not.toBe(formatted);
    await editor.press('ControlOrMeta+Shift+z'); await expect.poll(() => editor.innerHTML()).toBe(formatted);
    await toolbar.getByRole('button', { name: 'HTML', exact: true }).click();
    expect(await root.locator('.product-rich-text__source textarea').inputValue()).toContain('color:');
    await toolbar.getByRole('button', { name: 'HTML', exact: true }).click();
    await expect(editor.locator('span')).toHaveCSS('background-color', 'rgb(171, 205, 239)');
    await page.getByRole('button', { name: locale === 'ar' ? 'حفظ' : 'Save', exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    await page.reload(); await expect(editor.locator('strong')).toHaveText('Own formatted description');
    await expect(editor.locator('span')).toHaveCSS('background-color', 'rgb(171, 205, 239)');
    await root.getByRole('button', { name: locale === 'ar' ? 'توسيع المحرر' : 'Expand editor', exact: true }).click();
    const expanded = page.locator('.product-rich-text--expanded'); await expect(expanded).toBeVisible();
    await expanded.locator('.tiptap').press('Escape'); await expect(expanded).toHaveCount(0);
    await expect(root).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('.pe-basic .product-rich-text').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.filter(violation => ['serious', 'critical'].includes(violation.impact || '')).map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
    if (process.env.PRODUCT_RICHTEXT_AUDIT_DIR) await root.screenshot({ path: `${process.env.PRODUCT_RICHTEXT_AUDIT_DIR}/merchant-product-richtext-${locale}-${width}-${appearance}.png` });
  });
}
