import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Every API request is intercepted. These contracts never mutate a merchant account.
const code = '76d25db4-2c02-49c4-a08c-beb7f1212b24';
const original = { id: 31, page_id: 41, code, title: 'Original campaign', slug: 'original', locale: 'en', template_key: 'glasses-en', status: 'draft', is_public: false, public_url: 'https://fixture.example/funnels/original', product: { id: 7, name: 'Fixture glasses' } };
async function fixture(page: Page, language = 'en', ai = false, permission = true, dark = false) {
  const writes: Array<{ path: string; data: Record<string, unknown> }> = [];
  const reads: string[] = [];
  let deleted = false;
  const state = { deleteFails: false, editConflict: false, editValidation: false, holdSave: false };
  let releaseSave!: () => void;
  const saveGate = new Promise<void>(resolve => { releaseSave = resolve; });
  let current = { ...original, browser_pixels: { facebook: [] as string[], tiktok: [] as string[], snapchat: [] as string[] } }; let version = 'a'.repeat(64);
  await page.addInitScript(({language, dark}) => {
    localStorage.setItem('sellchase_access_token', 'isolated-funnel-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', dark ? 'dark' : 'light');
  }, { language, dark });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const respond = (json: unknown, status = 200) => route.fulfill({ json, status, headers });
    if (request.method() !== 'GET') {
      expect(['/my-store/funnels', '/my-store/funnels/generate', '/my-store/funnels/bulk-delete', '/my-store/funnels/31']).toContain(path);
      const data = request.postDataJSON() as Record<string, unknown>; writes.push({path, data});
      if (path === '/my-store/funnels/31') {
        expect(request.method()).toBe('PUT');
        if (state.holdSave) await saveGate;
        if (state.editConflict) return respond({message: 'Changed in another session'}, 409);
        if (state.editValidation) return respond({errors: {slug: ['This URL is already used by another page.']}}, 422);
        expect(data.version).toBe(version);
        current = { ...current, title: String(data.title), slug: String(data.slug), product: { id: Number(data.product_id), name: 'Replacement product' }, ...(data.browser_pixels ? { browser_pixels: data.browser_pixels as typeof current.browser_pixels } : {}) }; version = 'b'.repeat(64);
        return respond({data: current, version, funnel_base_url: 'https://a-very-long-merchant-domain.example/funnels/'});
      }
      if (path.endsWith('/bulk-delete')) {
        if (state.deleteFails) return respond({ message: 'Deletion failed; no rows changed' }, 409);
        deleted = true; return respond({ message: 'Deleted' });
      }
      return respond({ data: { ...original, page_id: 99 } }, 201);
    }
    reads.push(path + url.search);
    if (path === '/auth/me') return respond({ user: { id: 1, name: 'Funnel Fixture', email: 'funnel@example.test', roles: [permission ? 'Merchant' : 'StoreManager'], permissions: permission ? ['store.view', 'store.pages.manage', 'store.products.manage', 'store.settings.manage'] : ['store.view'], parent_user_id: permission ? null : 2, is_active: true, pending_approval: false } });
    if (path === '/my-store') return respond({ data: { id: 1, owner_user_id: 1, name: 'Fixture', slug: 'fixture', status: 'active', currency: 'USD', default_locale: 'en', supported_locales: ['en', 'ar'] } });
    if (path === '/my-store/funnels/templates') return respond({
      data: ['glasses-en', 'glasses-ar', 'hair-revive-en', 'hair-revive-ar', 'litter-robot-en', 'litter-robot-ar', 'electric-biker-en', 'electric-biker-ar', 'hair-care-en', 'hair-care-ar', 'spotlight'].map(key => ({ key, native_layout: key !== 'spotlight', locale: key.endsWith('-ar') ? 'ar' : 'en', name: { en: key }, preview_desktop_image: `/media/funnel-previews/${key}-desktop.png`, preview_mobile_image: `/media/funnel-previews/${key}-phone.png`, preview_url: `/funnel-templates/${key}?preview=1` })),
      ai: { available: ai }, funnel_base_url: 'https://a-very-long-merchant-domain.example/funnels/',
    });
    if (path === `/my-store/funnels/by-code/${code}`) return respond({data: original});
    if (path.startsWith('/my-store/funnels/by-code/')) return respond({ message: 'Not found' }, 404);
    if (path === '/my-store/funnels/31') return respond({data:current, version, funnel_base_url:'https://a-very-long-merchant-domain.example/funnels/'});
    if (path === '/my-store/funnels/404') return respond({message:'Internal model details must not be shown'},404);
    if (path === '/my-store/funnels/products') return respond({ data: url.searchParams.get('search')?.includes('Replacement') ? [{id:8,name:'Replacement product'}] : [original.product] });
    if (path === '/my-store/funnels') return respond({ data: deleted ? [] : [original], meta: { current_page: 1, last_page: 1, per_page: 25, from: deleted ? 0 : 1, to: deleted ? 0 : 1, total: deleted ? 0 : 1 } });
    return respond({ data: [], unread: 0, count: 0 });
  });
  return { writes, reads, state, releaseSave };
}
async function accessible(page: Page, selector: string) {
  const result = await new AxeBuilder({page}).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')), result.violations.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
}

for (const language of ['ar', 'en']) for (const width of [1440, 390, 320]) {
  test(`Funnel Custom Pixel saves, reopens and clears identifiers in ${language} at ${width}px`, async ({ page }, testInfo) => {
    const api = await fixture(page, language, false, true, width === 320);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/store/funnels/31/edit');
    const save = page.getByRole('button', { name: language === 'ar' ? 'حفظ البيانات' : 'Save details', exact: true });
    await expect(save).toBeDisabled();
    const advanced = page.locator('.fw-advanced summary');
    await advanced.focus(); await page.keyboard.press('Enter');
    const facebook = page.getByLabel('Facebook Pixel ID', { exact: true });
    const tiktok = page.getByLabel('TikTok Pixel ID', { exact: true });
    const snapchat = page.getByLabel('Snapchat Pixel ID', { exact: true });
    await expect(facebook).toBeVisible();
    await facebook.fill('1234567890\n 1234567890 \n2345678901');
    await tiktok.fill('C7TEST0123456789ABCDE0');
    await snapchat.fill('12345678-1234-4234-8234-123456789abc');
    await expect(save).toBeEnabled();
    expect(api.writes).toEqual([]);
    await accessible(page, '.fw-details');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.locator('.fw-advanced').screenshot({ path: testInfo.outputPath('custom-pixels.png') });
    await save.click();
    await expect(page.getByRole('status')).toContainText(language === 'ar' ? 'تم حفظ بيانات المسار' : 'Funnel details saved');
    expect(api.writes).toHaveLength(1);
    expect(api.writes[0].data).toMatchObject({ version: 'a'.repeat(64), product_id: 7, browser_pixels: { facebook: ['1234567890', '2345678901'], tiktok: ['C7TEST0123456789ABCDE0'], snapchat: ['12345678-1234-4234-8234-123456789abc'] } });
    await page.reload();
    await expect(page.locator('.fw-advanced')).toBeVisible();
    if (await page.locator('.fw-advanced').getAttribute('open') === null) await advanced.click();
    await expect(facebook).toHaveValue('1234567890\n2345678901');
    await expect(save).toBeDisabled();
    await facebook.fill(''); await tiktok.fill(''); await snapchat.fill('');
    await save.click();
    await expect(save).toBeDisabled();
    expect(api.writes).toHaveLength(2);
    expect(api.writes[1].data).toMatchObject({ version: 'b'.repeat(64), browser_pixels: { facebook: [], tiktok: [], snapchat: [] } });
  });
}

test('A pixel edit survives conflicts and explicit reload discards only the unsaved draft', async ({ page }) => {
  const api = await fixture(page);
  await page.goto('/store/funnels/31/edit');
  await page.locator('.fw-advanced summary').click();
  const input = page.getByLabel('Facebook Pixel ID', { exact: true });
  await input.fill('1234567890'); api.state.editConflict = true;
  await page.getByRole('button', { name: 'Save details', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('changed in another session');
  await expect(input).toHaveValue('1234567890');
  await expect(page.getByRole('button', { name: 'Save details', exact: true })).toBeDisabled();
  expect(api.writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Reload details and discard edits', exact: true }).click();
  await expect(page.locator('.fw-advanced')).toBeVisible();
  if (await page.locator('.fw-advanced').getAttribute('open') === null) await page.locator('.fw-advanced summary').click();
  await expect(input).toHaveValue('');
  expect(api.writes).toHaveLength(1);
});
for (const language of ['ar', 'en']) for (const width of [1920, 390, 320]) {
  test(`Manual creation in ${language} at ${width}px only saves the final product selection`, async ({page}) => {
    const api = await fixture(page, language, false, true, width === 320);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.setViewportSize({width, height: 844});
    await page.goto('/store/funnels/create');
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: language === 'ar' ? /إنشاء مسار بالذكاء/ : /Create a funnel with AI/ })).toBeDisabled();
    await accessible(page, '.fw-method-panel');
    await dialog.getByRole('button', {name: language === 'ar' ? /إنشاء مسار يدويًا/ : /Create a funnel manually/}).click();
    await expect(page.locator('.fw-template')).toHaveCount(10);
    await expect.poll(() => page.locator('.fw-template-desktop').first().evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && image.currentSrc.endsWith('/glasses-en-desktop.jpg'))).toBe(true);
    for (const locale of ['en', 'ar']) {
      for (const device of ['desktop', 'phone']) {
        const poster = page.locator(`.fw-template-${device}[src$="hair-care-${locale}-${device}.png"]`);
        await poster.scrollIntoViewIfNeeded();
        await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && image.currentSrc.endsWith('.jpg') ? image.naturalHeight / image.naturalWidth : 0)).toBeGreaterThanOrEqual(device === 'desktop' ? 1.18 : 3.4);
      }
    }
    const cloneField = await page.getByLabel(language === 'ar' ? 'كود المسار' : 'Funnel code', {exact:true}).boundingBox();
    const cloneNext = await page.locator('.fw-clone-fields').getByRole('button', {name:language === 'ar' ? 'التالي' : 'Next',exact:true}).boundingBox();
    expect(cloneField && cloneNext).toBeTruthy();
    expect(cloneNext!.x >= cloneField!.x + cloneField!.width || cloneNext!.x + cloneNext!.width <= cloneField!.x).toBe(true);
    expect(cloneNext!.y).toBeLessThan(cloneField!.y + cloneField!.height);
    expect(api.writes).toEqual([]);
    const geometry = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, height: document.documentElement.scrollHeight, viewport: innerHeight, scroller: document.querySelector('.fw-create-scroll')!.getBoundingClientRect().bottom, footer: document.querySelector('.fw-create-footer')!.getBoundingClientRect().bottom }));
    expect(geometry.width).toBeLessThanOrEqual(geometry.client);
    expect(geometry.height).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.footer).toBeLessThanOrEqual(geometry.viewport);
    const key = `glasses-${language}`;
    await page.getByRole('button', {name: `${language === 'ar' ? 'استخدام القالب' : 'Use template'}: ${key}`, exact: true}).click();
    await page.locator('.fw-create-footer').getByRole('button', {name: language === 'ar' ? 'التالي' : 'Next', exact: true}).click();
    await page.getByLabel(language === 'ar' ? 'اسم الـ Funnel' : 'Funnel name', {exact: true}).fill('Fixture campaign');
    await page.getByLabel(language === 'ar' ? 'رابط الـ Funnel' : 'Funnel URL', {exact: true}).fill('fixture-campaign');
    const product = page.getByRole('combobox', {name: language === 'ar' ? 'المنتج' : 'Product', exact: true});
    await product.fill('Fixture');
    await expect(page.getByRole('option', {name: 'Fixture glasses', exact: true})).toBeVisible();
    await product.press('ArrowDown'); await product.press('Enter');
    await expect(product).toHaveValue('Fixture glasses');
    expect(api.writes).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await accessible(page, '.fw-form');
    await page.getByRole('button', {name: language === 'ar' ? 'إنشاء المسار وفتح المحرر' : 'Create funnel and open builder', exact: true}).click();
    await expect(page).toHaveURL(/\/store\/pages\/99\/builder$/);
    expect(api.writes).toEqual([{path: '/my-store/funnels', data: {title: 'Fixture campaign', slug: 'fixture-campaign', product_id: 7, locale: language, template_key: key}}]);
  });
}
test('Table sorting and all-or-nothing deletion preserve rows after cancel or server failure', async ({page}) => {
  const api = await fixture(page);
  await page.goto('/store/funnels');
  await expect(page.getByRole('cell', {name: 'Original campaign', exact: true})).toBeVisible();
  await page.getByRole('button', {name: 'Sort by Funnel name ascending', exact: true}).click();
  await expect.poll(() => api.reads.some(read => read.includes('sort=title') && read.includes('direction=asc'))).toBe(true);
  await page.getByRole('checkbox', {name: 'Select funnel: Original campaign'}).check();
  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  await page.getByRole('dialog').getByRole('button', {name: 'Cancel', exact: true}).click();
  expect(api.writes).toEqual([]);
  api.state.deleteFails = true;
  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('no rows changed');
  await expect(page.getByRole('cell', {name: 'Original campaign', exact: true})).toBeVisible();
  api.state.deleteFails = false;
  await page.getByRole('button', {name: 'Delete', exact: true}).click();
  await page.getByRole('dialog').getByRole('button', {name: 'Delete', exact: true}).click();
  await expect(page.getByText('No matching funnels', {exact: true})).toBeVisible();
  expect(api.writes).toEqual([{path: '/my-store/funnels/bulk-delete', data: {ids: [31]}}, {path: '/my-store/funnels/bulk-delete', data: {ids: [31]}}]);
});

for (const language of ['ar', 'en']) for (const width of [1920, 320]) {
  test(`Funnel details in ${language} at ${width}px save the chosen product and preserve the code`, async ({page}) => {
    const api = await fixture(page, language, false, true, width === 320);
    await page.emulateMedia({reducedMotion:'reduce'}); await page.setViewportSize({width,height:844});
    await page.goto('/store/funnels');
    await page.locator('.fw-edit').click(); await expect(page).toHaveURL(/\/funnels\/31\/edit$/);
    const name = page.getByLabel(language === 'ar' ? 'اسم الـ Funnel' : 'Funnel name', {exact:true});
    await expect(name).toHaveValue('Original campaign');
    expect(api.writes).toEqual([]);
    const save = page.getByRole('button', {name:language === 'ar'?'حفظ البيانات':'Save details',exact:true});
    await expect(save).toBeDisabled();
    await name.fill('Edited campaign');
    await page.getByLabel(language === 'ar'?'رابط الـ Funnel':'Funnel URL',{exact:true}).fill('edited-campaign');
    const design = page.getByRole('link',{name:language === 'ar'?'تعديل التصميم':'Edit design',exact:true});
    await expect(design).toHaveAttribute('aria-disabled','true');
    const product = page.getByRole('combobox', {name:language === 'ar'?'المنتج':'Product',exact:true});
    await product.fill('Replacement'); await expect(product).toHaveValue('Replacement'); await expect(page.locator('.fw-details-actions button[type=submit]')).toBeDisabled();
    await page.getByRole('option',{name:'Replacement product',exact:true}).click();
    await accessible(page, '.fw-details');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await save.click();
    await expect(page.getByRole('status')).toHaveText(language === 'ar'?'تم حفظ بيانات المسار.':'Funnel details saved.');
    await expect(product).toHaveValue('Replacement product'); await expect(save).toBeDisabled();
    expect(api.writes).toEqual([{path:'/my-store/funnels/31',data:{title:'Edited campaign',slug:'edited-campaign',product_id:8,version:'a'.repeat(64)}}]);
    await expect(design).toHaveAttribute('href','/store/pages/41/builder');
    await expect(design).not.toHaveAttribute('aria-disabled','true');
  });
}

test('Conflicting funnel details retain local edits until an explicit reload', async ({page}) => {
  const api = await fixture(page); await page.goto('/store/funnels/31/edit');
  const name = page.getByLabel('Funnel name',{exact:true}); await expect(name).toHaveValue('Original campaign');
  await name.fill('Local edit'); api.state.editConflict = true;
  await page.getByRole('button',{name:'Save details',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('changed in another session');
  await expect(name).toHaveValue('Local edit'); await expect(page.getByRole('button',{name:'Save details',exact:true})).toBeDisabled();
  expect(api.writes).toHaveLength(1);
  await page.getByRole('button',{name:'Reload details and discard edits',exact:true}).click();
  await expect(name).toHaveValue('Original campaign'); await expect(page.getByRole('alert')).toHaveCount(0);
  expect(api.writes).toHaveLength(1);
});

test('A manager without page permission cannot load funnel editing details', async ({page}) => {
  const api = await fixture(page,'en',false,false); await page.goto('/store/funnels/31/edit');
  await expect(page).not.toHaveURL(/\/funnels\/31\/edit$/);
  expect(api.reads.some(path=>path==='/my-store/funnels/31')).toBe(false); expect(api.writes).toEqual([]);
});

test('An unavailable funnel shows a clear error without an editable form or mutation', async ({page}) => {
  const api = await fixture(page); await page.goto('/store/funnels/404/edit');
  await expect(page.getByRole('alert')).toContainText('This funnel was not found in your store.');
  await expect(page.locator('.fw-form')).toHaveCount(0);
  expect(api.writes).toEqual([]);
});

for (const language of ['ar', 'en']) {
  const other = language === 'ar' ? 'en' : 'ar';
  const changeLanguage = (page: Page, from: string) => page.getByRole('button', {name: from === 'ar' ? 'تغيير اللغة' : 'Change language', exact:true}).click();
  test(`Unavailable funnel copy follows ${language} language switches without refetching`, async ({page}) => {
    const api = await fixture(page, language); await page.goto('/store/funnels/404/edit');
    await expect(page.getByRole('alert')).toContainText(language === 'ar' ? 'لم يتم العثور على المسار في متجرك.' : 'This funnel was not found in your store.');
    await changeLanguage(page, language);
    await expect(page.getByRole('alert')).toContainText(other === 'ar' ? 'لم يتم العثور على المسار في متجرك.' : 'This funnel was not found in your store.');
    await changeLanguage(page, other);
    await expect(page.getByRole('alert')).toContainText(language === 'ar' ? 'لم يتم العثور على المسار في متجرك.' : 'This funnel was not found in your store.');
    expect(api.reads.filter(path => path === '/my-store/funnels/404')).toHaveLength(1);
    await expect(page.getByRole('alert')).not.toContainText('Internal model details');
    await expect(page.locator('.fw-form')).toHaveCount(0); expect(api.writes).toEqual([]);
  });
  for (const failure of ['conflict', 'validation']) test(`Funnel ${failure} preserves dirty fields across ${language} language switches`, async ({page}) => {
    const api = await fixture(page, language); await page.goto('/store/funnels/31/edit');
    const name = page.locator('#fw-edit-name'); await name.fill('Unsaved campaign');
    await page.locator('.fw-advanced summary').click();
    await page.getByLabel('Facebook Pixel ID', {exact:true}).fill('1234567890');
    api.state.editConflict = failure === 'conflict'; api.state.editValidation = failure === 'validation';
    await page.locator('.fw-details-actions button[type=submit]').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await changeLanguage(page, language);
    await expect(page.getByRole('alert')).toContainText(failure === 'conflict'
      ? other === 'ar' ? 'تغيّرت بيانات هذا المسار' : 'This funnel changed in another session.'
      : other === 'ar' ? 'تعذّر إكمال الطلب.' : 'The request could not be completed.');
    if (failure === 'validation') await expect(page.getByRole('alert')).toContainText('This URL is already used by another page.');
    await expect(name).toHaveValue('Unsaved campaign');
    await expect(page.getByLabel('Facebook Pixel ID', {exact:true})).toHaveValue('1234567890');
    expect(api.reads.filter(path => path === '/my-store/funnels/31')).toHaveLength(1); expect(api.writes).toHaveLength(1);
    const save = page.locator('.fw-details-actions button[type=submit]');
    if (failure === 'conflict') await expect(save).toBeDisabled(); else await expect(save).toBeEnabled();
    await page.setViewportSize({width:320,height:900});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await accessible(page, '.fw-details');
  });
  for (const failure of [false, true]) test(`Pending funnel save uses current ${language} copy on ${failure ? 'failure' : 'success'}`, async ({page}) => {
    const api = await fixture(page, language); await page.goto('/store/funnels/31/edit');
    await page.locator('#fw-edit-name').fill('Pending campaign');
    api.state.holdSave = true; api.state.editConflict = failure;
    const save = page.locator('.fw-details-actions button[type=submit]'); await save.click();
    await expect.poll(() => api.writes.length).toBe(1); await expect(save).toBeDisabled();
    await changeLanguage(page, language); await expect(page.locator('#fw-edit-name')).toHaveValue('Pending campaign');
    await expect(page.locator('#fw-edit-name')).toBeDisabled();
    expect(api.reads.filter(path => path === '/my-store/funnels/31')).toHaveLength(1);
    api.releaseSave();
    if (failure) {
      await expect(page.getByRole('alert')).toContainText(other === 'ar' ? 'تغيّرت بيانات هذا المسار' : 'This funnel changed in another session.');
      await expect(page.locator('#fw-edit-name')).toHaveValue('Pending campaign');
    } else await expect(page.locator('.fw-details-saved')).toHaveText(other === 'ar' ? 'تم حفظ بيانات المسار.' : 'Funnel details saved.');
    expect(api.writes).toHaveLength(1); await expect(save).toBeDisabled();
    await changeLanguage(page, other);
    if (failure) await expect(page.getByRole('alert')).toContainText(language === 'ar' ? 'تغيّرت بيانات هذا المسار' : 'This funnel changed in another session.');
  });
}
test('Opening a clone is read only; only final submission creates the independent draft', async ({page}) => {
  const api = await fixture(page);
  await page.goto(`/store/funnels/create?clone=${code}`);
  await expect(page.getByLabel('Funnel name', {exact: true})).toHaveValue('Original campaign (Clone)');
  await expect(page.getByRole('combobox', {name: 'Product', exact: true})).toHaveValue('Fixture glasses');
  expect(api.writes).toEqual([]);
  const product = page.getByRole('combobox', {name:'Product',exact:true});
  await product.fill('Replacement'); await expect(product).toHaveValue('Replacement');
  await expect(page.locator('.fw-form button[type=submit]')).toBeDisabled();
  await page.getByRole('option',{name:'Replacement product',exact:true}).click();
  await expect(product).toHaveAttribute('aria-expanded','false'); await expect(product).toHaveValue('Replacement product');
  expect(api.writes).toEqual([]);
  await page.getByRole('button', {name: 'Create funnel and open builder', exact: true}).click();
  await expect(page).toHaveURL(/\/pages\/99\/builder$/);
  expect(api.writes).toEqual([{path: '/my-store/funnels', data: {title: 'Original campaign (Clone)', slug: 'original-copy', locale: 'en', product_id: 8, template_key: 'glasses-en', clone_code: code}}]);
});
test('A missing or malformed clone code never creates a draft', async ({page}) => {
  const api = await fixture(page);
  await page.goto('/store/funnels/create?clone=bad-code');
  await expect(page.getByRole('alert')).toContainText('Enter a valid funnel code');
  await page.getByLabel('Funnel code', {exact: true}).fill('00000000-0000-4000-8000-000000000000');
  await page.locator('.fw-clone-fields').getByRole('button', {name: 'Next', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('No funnel with this code');
  expect(api.writes).toEqual([]);
});
test('A manager without pages permission never reads or writes funnels', async ({page}) => {
  const api = await fixture(page, 'en', false, false);
  await page.goto('/store/funnels/create');
  await expect(page).toHaveURL(/\/(dashboard|store\/overview)$/);
  expect(api.reads.some(read => read.includes('/funnels'))).toBe(false);
  expect(api.writes).toEqual([]);
});
for (const contentLocale of ['en','ar']) test(`AI ${contentLocale} generation only submits after complete content and product selection`, async ({page}) => {
  const api = await fixture(page, 'en', true);
  await page.goto('/store/funnels/create');
  await page.getByRole('button', {name: /Create a funnel with AI/}).click();
  await page.getByRole('button', {name: `Use template: glasses-${contentLocale}`, exact: true}).click();
  await page.locator('.fw-create-footer').getByRole('button', {name: 'Next', exact: true}).click();
  await page.getByLabel('Funnel name', {exact: true}).fill('Generated fixture');
  await page.getByLabel('Funnel URL', {exact: true}).fill('generated-fixture');
  await expect(page.getByLabel('Content language',{exact:true})).toHaveValue(contentLocale === 'ar' ? 'العربية' : 'English');
  const product = page.getByRole('combobox', {name: 'Product', exact: true});
  await product.fill('Fixture');
  await page.getByRole('option', {name: 'Fixture glasses', exact: true}).click();
  await expect(product).toHaveAttribute('aria-expanded', 'false');
  await expect(product).toHaveValue('Fixture glasses');
  await page.getByLabel('Style or dialect', {exact: true}).fill('Plain English');
  await page.getByLabel('Product description and features', {exact: true}).fill('A synthetic description for isolated draft creation tests.');
  expect(api.writes).toEqual([]);
  await page.getByRole('button', {name: 'Generate draft and open editor', exact: true}).click();
  await expect(page).toHaveURL(/\/pages\/99\/builder$/);
  expect(api.writes).toHaveLength(1);
  expect(api.writes[0]).toMatchObject({path:'/my-store/funnels/generate',data:{product_id:7,template_key:`glasses-${contentLocale}`,locale:contentLocale,generation:{language:contentLocale === 'ar' ? 'العربية' : 'English',dialect:'Plain English',product_name:'Fixture glasses',description:'A synthetic description for isolated draft creation tests.'}}});
});
for (const ai of [false, true]) test(`Creation details start at the top on short screens (${ai ? 'AI' : 'manual'})`, async ({page}) => {
  const api = await fixture(page, 'en', ai);
  await page.setViewportSize({width:844,height:390});
  await page.goto('/store/funnels/create');
  await page.getByRole('dialog').getByRole('button', {name:ai ? /Create a funnel with AI/ : /Create a funnel manually/}).click();
  await page.getByRole('button', {name:'Use template: litter-robot-ar',exact:true}).click();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await expect(page.locator('.fw-create-footer')).toBeInViewport();
  await page.locator('.fw-create-footer').getByRole('button', {name:'Next',exact:true}).click();
  await expect(page.getByLabel('Funnel name',{exact:true})).toBeInViewport();
  expect(api.writes).toEqual([]);
});
