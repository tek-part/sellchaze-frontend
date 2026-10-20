import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

test.describe.configure({ retries: 0 });
const copy = { name: 'Generated bag', description: ['Cotton <script>unsafe()</script>'], features: ['Reinforced handles'], faqs: [{ question: 'Washable?', answer: 'Yes, cotton is washable.' }], reviews: [] as string[] };

async function setup(page: Page, locale: string, appearance: string, options: { defaultLocale?: string; unavailable?: boolean; fail?: number; delay?: boolean; readOnly?: boolean } = {}) {
  await page.addInitScript(({ locale, appearance }) => { localStorage.setItem('sellchase_access_token', 'isolated-product-ai'); localStorage.setItem('sellchase_locale', locale); localStorage.setItem('sellchaze_workspace_appearance', appearance); }, { locale, appearance });
  let product = { id: 30, name: 'Original bag', slug: 'original-bag', description: '<p>Original product description.</p>', price: 20, sku: 'KEEP-SKU', seo_title: 'Keep SEO', is_active: false, media: [], variants: [], translations: { name: { ar: 'المنتج الأصلي', en: 'Original bag' } }, preferences_version: 'a'.repeat(64), product_preferences: { is_skip_cart: true, browser_pixels: null } };
  const generations: Record<string, unknown>[] = [], writes: FormData[] = [];
  let release: (() => void) | undefined;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), endpoint = new URL(request.url()).pathname.replace('/api/v1', '');
    const headers = { 'access-control-allow-origin': request.headers().origin || 'http://127.0.0.1:4183', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'authorization,content-type,x-requested-with', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let json: unknown = { data: [], unread: 0, count: 0 };
    if (endpoint === '/auth/me') json = { user: { id: 1, name: 'Synthetic owner', roles: ['Merchant'], permissions: ['store.view', 'store.products.manage', 'products-list', ...(options.readOnly ? [] : ['products-create', 'products-edit'])], is_active: true, pending_approval: false } };
    if (endpoint === '/my-store') json = { data: { id: 1, owner_user_id: 1, name: 'Synthetic store', slug: 'synthetic', status: 'active', currency: 'USD', default_locale: options.defaultLocale || locale, supported_locales: ['ar', 'en'] } };
    if (endpoint.endsWith('/ai-draft')) {
      if (request.method() === 'GET') return route.fulfill({ headers, json: { available: !options.unavailable } });
      const input = request.postDataJSON(); generations.push(input);
      if (options.delay) await held;
      if (options.fail) return route.fulfill({ headers, status: options.fail, json: { message: 'Provider failure' } });
      const selected = (part: string) => input.parts.includes(part);
      const generated = { name: selected('name') ? copy.name : null, description: selected('description') ? copy.description : [], features: selected('features') ? copy.features.slice(0, input.counts.features) : [], faqs: selected('faqs') ? copy.faqs.slice(0, input.counts.faqs) : [], reviews: selected('reviews') && input.review_source && input.counts.reviews ? ['Supplied feedback describes comfortable handles.'] : [] };
      return route.fulfill({ headers, json: { data: generated, locale: input.locale, parts: input.parts, review_provenance: 'ai_summary_of_supplied_feedback' } });
    }
    if (endpoint === '/my-store/catalog/products/30') {
      if (request.method() === 'POST') {
        const form = await new Response(request.postDataBuffer(), { headers: { 'content-type': request.headers()['content-type'] } }).formData();
        writes.push(form); product = { ...product, name: String(form.get('name')), description: String(form.get('description')), translations: JSON.parse(String(form.get('translations'))) };
      }
      json = { data: product };
    } else if (request.method() !== 'GET') throw new Error(`Unexpected business write ${request.method()} ${endpoint}`);
    return route.fulfill({ headers, json });
  });
  return { generations, writes, release: () => release!() };
}

for (const locale of ['ar', 'en'] as const) for (const width of [1920, 390, 320]) for (const appearance of ['light', 'dark']) {
  test(`product AI review and apply ${locale} ${width} ${appearance}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1920 ? 1031 : width === 390 ? 844 : 568 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const audit = await setup(page, locale, appearance), ar = locale === 'ar';
    await page.goto('/store/products/30/edit');
    const trigger = page.getByRole('button', { name: ar ? 'إنشاء بمساعدة الـ AI' : 'Create with AI', exact: true });
    await trigger.click(); const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('checkbox')).toHaveCount(5);
    for (const checkbox of await dialog.getByRole('checkbox').all()) await expect(checkbox).toBeChecked();
    await expect(dialog.getByRole('spinbutton')).toHaveCount(3);
    for (const number of await dialog.getByRole('spinbutton').all()) { await expect(number).toHaveValue('3'); await expect(number).toHaveAttribute('min', '0'); await expect(number).toHaveAttribute('max', '10'); }
    expect(await dialog.locator('.pe-ai-dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const geometry = await dialog.locator('.pe-ai-dialog').evaluate(el => ({ width: el.getBoundingClientRect().width, contentWidth: el.querySelector('.pe-ai-hero')!.getBoundingClientRect().width, radius: getComputedStyle(el).borderRadius, padding: getComputedStyle(el.querySelector('.pe-ai-body')!).padding, font: getComputedStyle(el).fontFamily }));
    if (process.env.PRODUCT_AI_AUDIT_DIR) await writeFile(`${process.env.PRODUCT_AI_AUDIT_DIR}/merchant-product-ai-${locale}-${width}-${appearance}.json`, JSON.stringify(geometry, null, 2));
    expect(geometry.radius).toBe('16px'); expect(geometry.font).toContain('IBM Plex Sans Arabic');
    if (width === 1920) { expect(geometry.width).toBe(900); expect(geometry.padding).toBe('40px'); expect(Math.abs(geometry.contentWidth - 806)).toBeLessThan(2); }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await dialog.locator('.pe-ai-dialog').evaluate(el => getComputedStyle(el).animationName)).toBe('pe-ai-in');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await dialog.locator('.pe-ai-dialog').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
    const axe = await new AxeBuilder({ page }).include('.pe-ai-dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact || '')).map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    if (process.env.PRODUCT_AI_AUDIT_DIR) await page.screenshot({ path: `${process.env.PRODUCT_AI_AUDIT_DIR}/merchant-product-ai-${locale}-${width}-${appearance}.png` });
    await dialog.getByRole('textbox', { name: ar ? 'وصف المنتج *' : 'Product brief *', exact: true }).fill('A washable cotton shopping bag with reinforced handles.');
    await dialog.getByRole('button', { name: ar ? 'إنشاء' : 'Generate', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: ar ? 'مراجعة المحتوى المقترح' : 'Review generated content' })).toBeVisible();
    expect(audit.generations).toHaveLength(1); expect(audit.writes).toHaveLength(0);
    expect(audit.generations[0]).toMatchObject({ locale, counts: { features: 3, faqs: 3, reviews: 3 }, review_source: '' });
    await dialog.getByRole('textbox', { name: ar ? 'اسم المنتج' : 'Product name', exact: true }).fill('Reviewed bag');
    await dialog.getByRole('button', { name: ar ? 'تطبيق على المسودة' : 'Apply to draft', exact: true }).click(); await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('textbox', { name: ar ? 'اسم المنتج *' : 'Product name *', exact: true })).toHaveValue('Reviewed bag');
    expect(audit.writes).toHaveLength(0);
    await page.getByRole('button', { name: ar ? 'حفظ' : 'Save', exact: true }).click();
    await expect.poll(() => audit.writes.length).toBe(1);
    const saved = audit.writes[0]!;
    expect(saved.get('preferences_version')).toBe('a'.repeat(64)); expect(saved.get('sku')).toBe('KEEP-SKU'); expect(saved.get('price')).toBe('20');
    expect(JSON.parse(String(saved.get('product_preferences'))).is_skip_cart).toBe(true);
    expect(saved.get('description')).toContain('&lt;script&gt;'); expect(saved.get('description')).not.toContain('<script>'); expect(saved.get('description')).toContain('Reinforced handles');
    expect(saved.get('is_active')).toBe('0');
    await page.reload(); await expect(page.getByRole('textbox', { name: ar ? 'اسم المنتج *' : 'Product name *', exact: true })).toHaveValue('Reviewed bag');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test('selected target locale preserves existing default copy and preferences', async ({ page }) => {
  const audit = await setup(page, 'ar', 'light', { defaultLocale: 'en' }); await page.goto('/store/products/30/edit');
  await page.getByRole('button', { name: 'إنشاء بمساعدة الـ AI', exact: true }).click();
  const dialog = page.getByRole('dialog'); await dialog.getByRole('combobox').selectOption('ar');
  await dialog.getByRole('textbox', { name: 'وصف المنتج *', exact: true }).fill('A washable cotton shopping bag with reinforced handles.');
  await dialog.getByRole('button', { name: 'إنشاء', exact: true }).click();
  await dialog.getByRole('button', { name: 'تطبيق على المسودة', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'اسم المنتج *', exact: true })).toHaveValue('Generated bag');
  await page.getByRole('button', { name: 'حفظ', exact: true }).click(); await expect.poll(() => audit.writes.length).toBe(1);
  expect(audit.writes[0]!.get('name')).toBe('Original bag'); expect(audit.writes[0]!.get('description')).toBe('<p>Original product description.</p>');
  expect(JSON.parse(String(audit.writes[0]!.get('translations'))).name.ar).toBe('Generated bag');
});

test('closing an in-flight dialog ignores late generation and performs no product save', async ({ page }) => {
  const audit = await setup(page, 'en', 'light', { delay: true }); await page.goto('/store/products/30/edit');
  const trigger = page.getByRole('button', { name: 'Create with AI', exact: true }); await trigger.click(); const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Product brief *', exact: true }).fill('A washable cotton shopping bag with reinforced handles.');
  await dialog.getByRole('button', { name: 'Generate', exact: true }).click(); await expect.poll(() => audit.generations.length).toBe(1);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click(); audit.release();
  await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Product name *', exact: true })).toHaveValue('Original bag'); expect(audit.writes).toHaveLength(0);
});

test('individual parts, counts and original feedback append without replacing existing product copy', async ({ page }) => {
  const audit = await setup(page, 'en', 'light'); await page.goto('/store/products/30/edit');
  await page.getByRole('button', { name: 'Create with AI', exact: true }).click(); const dialog = page.getByRole('dialog');
  for (const checkbox of await dialog.getByRole('checkbox').all()) await checkbox.uncheck();
  await expect(dialog.getByRole('button', { name: 'Generate', exact: true })).toBeDisabled();
  await dialog.getByRole('checkbox', { name: 'Features', exact: true }).check(); await dialog.getByRole('checkbox', { name: 'Reviews', exact: true }).check();
  await dialog.getByRole('spinbutton', { name: 'Number of Features', exact: true }).fill('1');
  await dialog.getByRole('spinbutton', { name: 'Number of Reviews', exact: true }).fill('1');
  await expect(dialog.getByRole('spinbutton', { name: 'Number of FAQs', exact: true })).toBeDisabled();
  await dialog.getByText('Original customer feedback to summarize', { exact: true }).click();
  await dialog.getByRole('textbox', { name: /Feedback text/ }).fill('The handles are comfortable.');
  await dialog.getByRole('textbox', { name: 'Product brief *', exact: true }).fill('A washable cotton shopping bag with reinforced handles.');
  await dialog.getByRole('button', { name: 'Generate', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Review generated content' })).toBeVisible();
  expect(audit.generations[0]).toMatchObject({ parts: ['features', 'reviews'], counts: { features: 1, reviews: 1 }, review_source: 'The handles are comfortable.' });
  await expect(dialog.getByRole('textbox', { name: 'Product name', exact: true })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Apply to draft', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click(); await expect.poll(() => audit.writes.length).toBe(1);
  expect(audit.writes[0]!.get('name')).toBe('Original bag');
  expect(audit.writes[0]!.get('description')).toContain('<p>Original product description.</p>');
  expect(audit.writes[0]!.get('description')).toContain('AI-assisted summaries of feedback supplied by the merchant.');
  expect(audit.writes[0]!.get('description')).not.toContain('verified');
});

test('new product generation applies an unsaved draft without creating a product or changing the empty price', async ({ page }) => {
  const audit = await setup(page, 'en', 'light'); await page.goto('/store/products/new');
  await page.getByRole('button', { name: 'Create with AI', exact: true }).click(); const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Product brief *', exact: true }).fill('A washable cotton shopping bag with reinforced handles.');
  await dialog.getByRole('button', { name: 'Generate', exact: true }).click();
  await dialog.getByRole('button', { name: 'Apply to draft', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Product name *', exact: true })).toHaveValue('Generated bag');
  await expect(page.getByRole('spinbutton', { name: 'Product price *', exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  expect(audit.generations).toHaveLength(1); expect(audit.writes).toHaveLength(0);
});

for (const status of [429, 502, 503, 504]) test(`generation failure ${status} preserves the current form`, async ({ page }) => {
  const audit = await setup(page, 'en', 'light', { fail: status }); await page.goto('/store/products/30/edit');
  await page.getByRole('button', { name: 'Create with AI', exact: true }).click(); const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Product brief *', exact: true }).fill('A washable cotton shopping bag with reinforced handles.');
  await dialog.getByRole('button', { name: 'Generate', exact: true }).click(); await expect(dialog.getByRole('alert')).toBeVisible();
  expect(audit.generations).toHaveLength(1); expect(audit.writes).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click(); await expect(page.getByRole('textbox', { name: 'Product name *', exact: true })).toHaveValue('Original bag');
});

test('missing configuration and read-only permission do not send a generation request', async ({ page }) => {
  const audit = await setup(page, 'en', 'light', { unavailable: true }); await page.goto('/store/products/new');
  await page.getByRole('button', { name: 'Create with AI', exact: true }).click(); const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('status').filter({ hasText: 'not configured' })).toBeVisible(); await expect(dialog.getByRole('button', { name: 'Generate', exact: true })).toBeDisabled();
  await dialog.press('Escape'); await expect(dialog).toHaveCount(0); expect(audit.generations).toHaveLength(0);
  await page.unroute('**/api/v1/**'); await setup(page, 'en', 'light', { readOnly: true }); await page.reload();
  await expect(page.getByRole('heading', { name: 'Add product', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Create with AI', exact: true })).toHaveCount(0);
});
