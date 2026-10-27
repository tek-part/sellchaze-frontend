import { effectiveApiMethod } from './helpers/api-method';
import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

// These browser contracts use an isolated, intercepted API. No real account is created.
async function workspace(page: Page, locale: 'ar' | 'en', manager = false, appearance: 'light' | 'dark' = 'light', sessionDetails = false) {
  const mutations: Array<{ method: string; path: string; data: Record<string, unknown> }> = [];
  const reads: string[] = [];
  const keys = ['view', 'orders.manage', 'products.manage', 'categories.manage', 'coupons.manage', 'reviews.manage', 'analytics.view', 'themes.manage', 'pages.manage', 'settings.manage'];
  const labels = [['عرض المتجر', 'View store'], ['إدارة الطلبات', 'Manage orders'], ['إدارة المنتجات', 'Manage products'], ['إدارة الأقسام', 'Manage categories'], ['إدارة الكوبونات', 'Manage coupons'], ['إدارة التقييمات', 'Manage reviews'], ['عرض الإحصائيات', 'View analytics'], ['إدارة الثيمات وقوائمها', 'Manage themes and navigation'], ['إدارة الصفحات ومسارات البيع', 'Manage pages and funnels'], ['إدارة إعدادات المتجر والشحن والدفع', 'Manage store, shipping and payment settings']];
  let row = { id: 5, name: 'Catalog Manager', email: 'manager@example.test', is_active: true, permissions: ['store.view', 'store.products.manage'], version: 'a'.repeat(64), deleted_at: null };
  let sessions = sessionDetails ? [
    { id: 1, current: true, device_name: 'Current protected synthetic device', email: 'current@example.test', ip_address: '192.0.2.1', created_at: '2026-10-01T12:00:00Z' },
    { id: 2, current: false, device_name: 'Synthetic Windows device with a deliberately long browser description and a long operating system label', email: 'long.synthetic.account.for.layout.verification@example.test', ip_address: 'ffff:ffff:ffff:ffff:ffff:ffff:255.255.255.255', created_at: '2026-10-01T12:00:00Z' },
    { id: 3, current: false, device_name: 'Synthetic phone', email: 'phone@example.test', ip_address: '198.51.100.2', created_at: '2026-10-01T12:00:00Z' },
  ] : Array.from({ length: 24 }, (_, index) => ({ id: index + 1, current: index === 0, device_name: `Isolated device ${index + 1}`, email: 'fixture@example.test', ip_address: '192.0.2.1', created_at: '2026-10-01T12:00:00Z' }));
  await page.addInitScript(({language, mode}) => {
    localStorage.setItem('sellchase_access_token', 'isolated-browser-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', mode);
  }, {language: locale, mode: appearance});
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': request.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with,x-http-method-override', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
    if (effectiveApiMethod(request) === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    if (effectiveApiMethod(request) !== 'GET') {
      if (sessionDetails && effectiveApiMethod(request) === 'DELETE' && path.startsWith('/auth/sessions/')) {
        const id = Number(path.split('/').at(-1));
        expect([2, 3]).toContain(id);
        mutations.push({ method: 'DELETE', path, data: {} });
        sessions = sessions.filter(session => session.id !== id);
        await route.fulfill({ json: { message: 'Synthetic session revoked' }, headers }); return;
      }
      expect(path.startsWith('/my-store/managers')).toBe(true);
      const data = request.postDataJSON() as Record<string, unknown>;
      mutations.push({ method: effectiveApiMethod(request), path, data });
      row = { ...row, ...data, version: 'b'.repeat(64) };
      await route.fulfill({ json: { data: row }, headers }); return;
    }
    reads.push(path);
    if (path === '/auth/me') {
      await route.fulfill({ json: { user: { id: manager ? 2 : 1, name: 'Layout Fixture', email: 'owner@example.test', roles: [manager ? 'StoreManager' : 'Merchant'], permissions: manager ? ['store.view', 'store.settings.manage'] : keys.map(key => `store.${key}`), parent_user_id: manager ? 1 : null, is_active: true, pending_approval: false } }, headers }); return;
    }
    if (path === '/my-store') {
      await route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local store fixture', slug: 'fixture', status: 'active', currency: 'USD', default_locale: 'en', supported_locales: ['en', 'ar'] } }, headers }); return;
    }
    if (path === '/my-store/general-settings') {
      await route.fulfill({ headers, json: { data: { revision: 'a'.repeat(64), site_title: 'Synthetic store', header_text: '', primary_color: '#198754', default_locale: 'en', currency: 'USD', phone_country: 'EG', timezone: 'Africa/Cairo', shipping_flat_rate: 0, max_product_quantity: 0, max_orders_per_phone_24h: 0, disable_auto_select_shipping: false, disable_auto_select_variants: false, disable_bot_protection: true }, choices: { currencies: ['USD', 'EGP'], countries: ['EG'], timezones: ['Africa/Cairo'] } } }); return;
    }
    if (path === '/my-store/seo-settings') {
      await route.fulfill({ headers, json: { data: { revision: 'a'.repeat(64), site_title: 'Synthetic store', description: '', logo_url: null, favicon_url: null } } }); return;
    }
    if (path === '/my-store/managers') {
      await route.fulfill({ json: { data: [row], meta: { current_page: 1, last_page: 1, total: 1 }, permissions: keys.map((key, index) => ({ key: `store.${key}`, required: key === 'view', label: { ar: labels[index]![0], en: labels[index]![1] } })) }, headers }); return;
    }
    if (path === '/auth/sessions') {
      await route.fulfill({ json: { data: sessions }, headers }); return;
    }
    await route.fulfill({ json: { data: [], unread: 0, count: 0 }, headers });
  });
  return { mutations, reads };
}

async function openSettingsMenu(page: Page, locale: 'ar' | 'en') {
  await page.getByRole('button', { name: locale === 'ar' ? 'فتح قائمة المتجر' : 'Open store menu', exact: true }).click();
  return page.locator('.ws-settings-mobile-drawer');
}

for (const locale of ['ar', 'en'] as const) for (const width of [320, 390, 900]) {
  test(`Settings drawer preserves page position and keyboard focus in ${locale} at ${width}px`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/store/settings/login-sessions');
    await expect(page.getByText('Isolated device 24', { exact: true })).toBeVisible();
    const before = await page.evaluate(() => window.scrollY);
    const opener = page.getByRole('button', { name: locale === 'ar' ? 'فتح قائمة المتجر' : 'Open store menu', exact: true });
    const drawer = await openSettingsMenu(page, locale);
    await expect(drawer).toBeVisible();
    const selected = drawer.locator('[aria-current="page"]');
    await expect(selected).toHaveAttribute('href', '/store/settings/login-sessions');
    await expect(selected).toBeInViewport();
    const menu = drawer.locator('.ws-secondary-sidebar-scroll');
    await expect(menu).toHaveCSS('overflow-y', 'auto');
    await menu.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(drawer.getByRole('button', { name: 'Public API', exact: true })).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    await page.locator('.ws-login-table').hover();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 300);
    const scroll = await page.evaluate(() => window.scrollY);
    await opener.click();
    await drawer.getByRole('button', { name: locale === 'ar' ? 'إغلاق قائمة الإعدادات' : 'Close settings menu' }).click();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(api.mutations).toEqual([]);
  });
}

for (const locale of ['ar', 'en'] as const) {
  test(`Settings API search and links survive desktop, phone and locale changes in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/store/settings/managers');
    const pane = page.locator('.ws-secondary-navigation-slot .ws-secondary-sidebar');
    const search = pane.getByRole('searchbox');
    await search.fill('Webhooks');
    await expect(pane.getByRole('button', { name: 'Public API', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await pane.getByRole('link', { name: 'Webhooks', exact: true }).click();
    await expect(page).toHaveURL(/\/settings\/webhooks$/);
    await search.clear();
    await expect(pane.getByRole('link', { name: 'Webhooks', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.setViewportSize({ width: 320, height: 844 });
    const drawer = await openSettingsMenu(page, locale);
    await expect(drawer.getByRole('link', { name: 'Webhooks', exact: true })).toHaveAttribute('aria-current', 'page');
    // Resizing an open mobile drawer to desktop closes its modal/body lock.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(drawer).not.toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('button', { name: locale === 'ar' ? 'تغيير اللغة' : 'Change language', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'ltr' : 'rtl');
    const results = await new AxeBuilder({ page }).include('.ws-secondary-sidebar').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
    expect(api.mutations).toEqual([]);
  });
}

for (const locale of ['ar', 'en'] as const) for (const width of [1920, 320]) for (const section of ['general', 'seo']) {
  test(`Full secondary settings frame fits ${section} in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const api = await workspace(page, locale, false, width === 320 ? 'dark' : 'light');
    await page.setViewportSize({ width, height: width === 1920 ? 1031 : 844 });
    await page.goto(`/store/settings/${section}`);
    const card = page.locator(section === 'general' ? '.ws-general-settings form' : '.ws-seo-settings');
    await expect(card.locator('input').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.ws-settings-page-heading')).toHaveCount(0);
    await expect(card.locator('.ws-settings-card-heading>div>h2')).toHaveCSS('font-size', '18px');
    await expect(card.locator('.ws-settings-card-heading>div>h2')).toHaveCSS('font-weight', '600');
    if (width === 1920) {
      const pane = page.locator('.ws-secondary-navigation-slot .ws-secondary-sidebar');
      await expect(pane).toBeVisible();
      const geometry = await pane.evaluate(element => {
        const box = element.getBoundingClientRect();
        const header = document.querySelector('.ws-header-container')!.getBoundingClientRect();
        const primary = document.querySelector('#workspace-sidebar')!.getBoundingClientRect();
        const content = document.querySelector('#workspace-content')!.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, width: box.width, headerBottom: header.bottom,
          adjacency: Math.min(Math.abs(box.left - primary.right), Math.abs(box.right - primary.left)),
          overlap: Math.max(0, Math.min(box.right, content.right) - Math.max(box.left, content.left)) };
      });
      expect(geometry.top).toBeCloseTo(geometry.headerBottom, 0);
      expect(geometry.bottom).toBeCloseTo(1031, 0);
      expect(geometry.width).toBe(288);
      expect(geometry.adjacency).toBeLessThanOrEqual(1);
      expect(geometry.overlap).toBe(0);
      const links = await pane.locator('a').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
      for (const suffix of ['bot-protection', 'shopping-preferences', 'localization', 'order-limits', 'publish']) expect(links).toContain(`/store/settings/${suffix}`);
      const collapse = pane.getByRole('button', { name: locale === 'ar' ? 'طي شريط الإعدادات' : 'Collapse settings sidebar' });
      await collapse.click();
      await expect(pane).toHaveCSS('width', '48px');
      const expand = pane.getByRole('button', { name: locale === 'ar' ? 'توسيع شريط الإعدادات' : 'Expand settings sidebar' });
      await expect(expand).toBeFocused(); await expand.click();
      await expect(pane).toHaveCSS('width', '288px'); await expect(collapse).toBeFocused();
      await testInfo.attach('secondary-settings-geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
      const primary = page.locator('.ws-desktop-sidebar');
      const field = card.locator('input').first();
      await field.fill('Preserved sidebar draft');
      await primary.getByRole('button', { name: locale === 'ar' ? 'إخفاء القائمة الجانبية' : 'Hide sidebar', exact: true }).click();
      await expect(primary).toHaveCSS('width', '64px');
      await expect(field).toHaveValue('Preserved sidebar draft');
      await page.screenshot({ path: testInfo.outputPath('compact-primary-full-secondary.png') });
      await primary.getByRole('button', { name: locale === 'ar' ? 'إظهار القائمة الجانبية' : 'Show sidebar', exact: true }).click();
      await expect(field).toHaveValue('Preserved sidebar draft');

    } else {
      const drawer = await openSettingsMenu(page, locale);
      await expect(drawer.locator('[aria-current="page"]')).toBeInViewport();
      const results = await new AxeBuilder({ page }).include('.ws-settings-mobile-drawer').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
      await page.keyboard.press('Escape');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('merchant-settings-frame.png') });
    expect(api.mutations).toEqual([]);
  });
}

for (const locale of ['ar', 'en'] as const) {
  test(`Secondary rail scrolls independently on short 1024px desktop in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale, false, 'dark');
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.goto('/store/settings/login-sessions');
    const pane = page.locator('.ws-secondary-navigation-slot .ws-secondary-sidebar');
    await expect(pane).toBeVisible();
    await expect(pane.locator('[aria-current="page"]')).toBeInViewport();
    const scroll = pane.locator('.ws-secondary-sidebar-scroll');
    const top = await page.evaluate(() => window.scrollY);
    await scroll.evaluate(element => { element.scrollTop = 0; });
    await scroll.hover(); await page.mouse.wheel(0, 800);
    await expect.poll(() => scroll.evaluate(element => element.scrollTop)).toBeGreaterThan(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(top);
    await page.locator('.ws-login-table').hover(); await page.mouse.wheel(0, 500);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    expect(await pane.evaluate(element => Math.abs(element.getBoundingClientRect().bottom - innerHeight))).toBeLessThanOrEqual(1);
    const primary = page.locator('.ws-desktop-sidebar');
    await primary.getByRole('button', { name: locale === 'ar' ? 'إخفاء القائمة الجانبية' : 'Hide sidebar', exact: true }).click();
    await expect(primary).toHaveCSS('width', '64px');
    expect(await pane.evaluate(element => {
      const box = element.getBoundingClientRect(), main = document.querySelector('#workspace-sidebar')!.getBoundingClientRect();
      return Math.min(Math.abs(box.left - main.right), Math.abs(box.right - main.left));
    })).toBeLessThanOrEqual(1);
    await primary.getByRole('button', { name: locale === 'ar' ? 'إظهار القائمة الجانبية' : 'Show sidebar', exact: true }).click();
    await expect(primary).toHaveCSS('width', '272px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await pane.getByRole('searchbox').fill('Webhooks');
    await pane.getByRole('link', { name: 'Webhooks', exact: true }).focus();
    await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/settings\/webhooks$/);
    await page.goto('/dashboard');
    await expect(page.locator('.ws-secondary-navigation-slot')).toBeEmpty();
    expect(api.mutations).toEqual([]);
  });
}

// Fresh Source desktop DOM (2026-10-20): 28px labels with a 12px top margin,
// 4px group end padding, and no NewsLetter badge. Community adds one 32px row.
for (const locale of ['ar', 'en'] as const) for (const width of [1920, 390, 320]) for (const appearance of ['light', 'dark'] as const) {
  test(`Merchant sidebar groups match the reference and stay keyboard reachable in ${locale} at ${width}px ${appearance}`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const api = await workspace(page, locale, false, appearance);
    await page.emulateMedia({ reducedMotion: appearance === 'dark' ? 'reduce' : 'no-preference' });
    await page.setViewportSize({ width, height: width === 1920 ? 1031 : 568 });
    await page.goto('/store/settings/login-sessions');
    const opener = page.getByRole('button', { name: locale === 'ar' ? 'افتح القائمة' : 'Open navigation', exact: true });
    if (width < 768) await opener.click();
    const sidebar = page.locator(width < 768 ? '.ws-drawer' : '.ws-desktop-sidebar');
    const dashboard = sidebar.locator('nav a[href="/dashboard"]');
    await expect(dashboard).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const orders = sidebar.getByRole('button', { name: locale === 'ar' ? 'الطلبات' : 'Orders', exact: true });
    const products = sidebar.getByRole('button', { name: locale === 'ar' ? 'المنتجات' : 'Products', exact: true });
    await orders.focus(); await page.keyboard.press('Enter');
    await products.focus(); await page.keyboard.press('Enter');
    await expect(orders).toHaveAttribute('aria-expanded', 'true');
    await expect(products).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar.locator('nav>div').first()).toHaveCSS('height', '866px');
    const geometry = await sidebar.evaluate(element => {
      const scroll = element.querySelector('.ws-sidebar-scroll')!;
      const groups = Array.from(element.querySelectorAll('nav>div'));
      return {
        firstMenuInset: element.querySelector('nav a')!.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop,
        community: Boolean(element.querySelector('a[href="/community"]')),
        groups: groups.map(group => {
          const label = group.querySelector('p')!; const style = getComputedStyle(label);
          return { height: group.getBoundingClientRect().height, paddingBottom: getComputedStyle(group).paddingBottom,
            labelHeight: label.getBoundingClientRect().height, labelInset: label.getBoundingClientRect().top - group.getBoundingClientRect().top,
            labelPadding: style.padding, letterSpacing: style.letterSpacing, textTransform: style.textTransform };
        }),
      };
    });
    expect(geometry.firstMenuInset).toBe(48);
    expect(geometry.community).toBe(true);
    expect(geometry.groups.map(group => group.height)).toEqual([866, 204]);
    for (const group of geometry.groups) expect(group).toMatchObject({ paddingBottom: '4px', labelHeight: 28, labelInset: 12, labelPadding: '0px 8px', letterSpacing: '0.66px', textTransform: 'uppercase' });
    const newsletter = sidebar.locator('a[href="/store/newsletter"]');
    await expect(newsletter.locator('.ws-nav-badge')).toHaveCount(0);
    await expect(newsletter).toHaveCSS('transition-duration', '0s');
    await expect(sidebar.locator('nav>div').last().locator('a')).toHaveCount(5);
    const settings = sidebar.locator('nav a[href="/store/settings/general"]');
    await dashboard.focus();
    for (let index = 0; index < 70 && !await settings.evaluate(element => element === document.activeElement); index++) await page.keyboard.press('Tab');
    await expect(settings).toBeFocused();
    expect(await settings.evaluate(element => {
      const r = element.getBoundingClientRect(); const s = element.closest('.ws-sidebar-scroll')!.getBoundingClientRect();
      return r.top >= s.top && r.bottom <= Math.min(s.bottom, innerHeight);
    })).toBe(true);
    const results = await new AxeBuilder({ page }).include(width < 768 ? '.ws-drawer' : '.ws-desktop-sidebar').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    await dashboard.focus();
    await sidebar.locator('.ws-sidebar-scroll').evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: testInfo.outputPath('merchant-sidebar-groups.png') });
    await testInfo.attach('sidebar-geometry', { body: JSON.stringify(geometry), contentType: 'application/json' });
    if (width === 1920) {
      await sidebar.getByRole('button', { name: locale === 'ar' ? 'إخفاء القائمة الجانبية' : 'Hide sidebar', exact: true }).click();
      await expect(sidebar).toHaveCSS('width', '64px');
      await expect(sidebar.locator('nav p')).toHaveCount(0);
      await sidebar.getByRole('button', { name: locale === 'ar' ? 'إظهار القائمة الجانبية' : 'Show sidebar', exact: true }).click();
      await expect(sidebar).toHaveCSS('width', '272px');
      await expect(sidebar.locator('nav>div>p').first()).toHaveCSS('height', '28px');
    } else {
      await page.keyboard.press('Escape');
      await expect(sidebar).not.toBeVisible();
      await expect(opener).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(api.mutations).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`Reduced motion disables merchant navigation transitions at ${width}px`, async ({ page }) => {
    const api = await workspace(page, 'en');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/store/settings/managers');
    await expect(page.getByRole('button', { name: 'Add manager', exact: true })).toBeVisible();
    if (width < 768) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    const navigation = page.locator(width < 768 ? '.ws-drawer' : '.ws-desktop-sidebar');
    const products = navigation.getByRole('button', { name: 'Products', exact: true });
    await products.click();
    await expect(navigation.getByRole('link', { name: 'All products', exact: true })).toBeVisible();
    await expect(products).toHaveCSS('transition-duration', '0s');
    await expect(navigation.locator('.ws-nav-panel')).toHaveCSS('transition-duration', '0s');
    if (width < 768) {
      await expect(navigation).toHaveCSS('transition-duration', '0s');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Open navigation', exact: true })).toBeFocused();
    }
    expect(api.mutations).toEqual([]);
  });
}

for (const locale of ['ar', 'en'] as const) {
  for (const width of [1440, 390]) {
    test(`Manager form is accessible in ${locale} at ${width}px`, async ({ page }) => {
      await workspace(page, locale);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/store/settings/managers');
      if (width < 1024) {
        const settingsDrawer = await openSettingsMenu(page, locale);
        await expect(settingsDrawer.locator('a[href="/store/settings/managers"]')).toHaveAttribute('aria-current', 'page');
        await page.keyboard.press('Escape');
      } else await expect(page.locator('.ws-settings-navigation a[href="/store/settings/managers"]')).toHaveAttribute('aria-current', 'page');
      await page.getByRole('button', { name: locale === 'ar' ? 'إضافة مدير' : 'Add manager', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel(locale === 'ar' ? 'كلمة المرور' : 'Password', { exact: true })).toHaveValue('');
      await expect(dialog.getByRole('checkbox', { name: locale === 'ar' ? 'عرض المتجر' : 'View store', exact: true })).toBeChecked();
      await expect(dialog.getByRole('checkbox', { name: locale === 'ar' ? 'عرض المتجر' : 'View store', exact: true })).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).include('.ws-manager-dialog[open]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')), results.violations.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
      await dialog.getByRole('button', { name: locale === 'ar' ? 'إلغاء' : 'Cancel', exact: true }).click();
      await expect(dialog).not.toBeVisible();
    });
  }
}

test('Editing permissions preserves the concurrency token and omits a blank password', async ({ page }) => {
  const api = await workspace(page, 'en');
  await page.goto('/store/settings/managers');
  await page.getByRole('button', { name: 'Edit Catalog Manager', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('checkbox', { name: 'Manage products', exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(api.mutations).toHaveLength(1);
  expect(api.mutations[0]).toMatchObject({ method: 'PUT', path: '/my-store/managers/5', data: { version: 'a'.repeat(64), permissions: ['store.view'], is_active: true } });
  expect(api.mutations[0]!.data).not.toHaveProperty('password');
});

test('Opening and cancelling removal never submits a mutation', async ({ page }) => {
  const api = await workspace(page, 'en');
  await page.goto('/store/settings/managers');
  await page.getByRole('button', { name: 'Remove Catalog Manager', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('sessions signed out');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(api.mutations).toEqual([]);
});

test('A settings manager never fetches owner account administration', async ({ page }) => {
  const api = await workspace(page, 'en', true);
  await page.goto('/store/settings/managers');
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(api.reads).not.toContain('/my-store/managers');
  expect(api.mutations).toEqual([]);
});

for (const width of [1440, 320]) {
  test(`Dark Arabic manager dialog stays accessible at ${width}px`, async ({ page }) => {
    const api = await workspace(page, 'ar', false, 'dark');
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/store/settings/managers');
    await page.getByRole('button', { name: 'إضافة مدير', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).include('.ws-manager-dialog[open]').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')), result.violations.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
    await dialog.getByRole('button', { name: 'إلغاء', exact: true }).click();
    await page.getByRole('button', { name: 'إضافة مدير', exact: true }).click();
    expect(await dialog.evaluate(element => element.scrollTop)).toBe(0);
    expect(api.mutations).toEqual([]);
  });
}

for (const appearance of ['light', 'dark'] as const) {
  test(`Shared green primary buttons keep white text at AA contrast in the ${appearance} workspace`, async ({ page }) => {
    await workspace(page, 'en', false, appearance);
    await page.goto('/store/settings/managers');
    await expect(page.getByRole('button', { name: 'Add manager', exact: true })).toBeVisible();
    // Measure the shared .ws-primary-button inside the same themed shell as the managers button.
    await page.locator('.ws-managers').evaluate((element) => {
      const probe = document.createElement('button'); probe.type = 'button'; probe.id = 'shared-primary-probe';
      probe.className = 'ws-primary-button'; probe.textContent = 'Shared primary'; element.append(probe);
    });
    const result = await new AxeBuilder({ page }).include('.ws-managers-add.ws-managers-primary').include('#shared-primary-probe').withRules(['color-contrast']).analyze();
    expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`)).toEqual([]);
    expect(result.passes.find(rule => rule.id === 'color-contrast')?.nodes.length ?? 0).toBeGreaterThanOrEqual(2);
  });
}

for (const locale of ['ar', 'en'] as const) for (const width of [320, 390, 1440]) {
  test(`Session fields remain readable and keyboard-operable in ${locale} at ${width}px`, async ({ page }) => {
    const api = await workspace(page, locale, false, width === 320 ? 'dark' : 'light', true);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/store/settings/login-sessions');
    const region = page.locator('.ws-login-table');
    const table = region.getByRole('table');
    await expect(table.locator('tbody tr')).toHaveCount(3);
    const geometry = await region.evaluate(element => {
      const table = element.querySelector('table')!;
      const row = table.querySelectorAll('tbody tr')[1]!;
      const ip = row.children[1] as HTMLElement;
      const range = document.createRange(); range.selectNodeContents(ip);
      const cell = ip.getBoundingClientRect(); const content = range.getBoundingClientRect();
      const bounds = element.getBoundingClientRect(); const card = row.getBoundingClientRect();
      return {
        table: table.getBoundingClientRect().width, region: element.clientWidth, overflow: element.scrollWidth > element.clientWidth,
        headings: [...table.querySelectorAll('thead th')].map(cell => cell.getBoundingClientRect().height),
        ip: { content: content.width, available: ip.clientWidth - parseFloat(getComputedStyle(ip).paddingLeft) - parseFloat(getComputedStyle(ip).paddingRight), height: content.height, inside: content.left >= cell.left - 1 && content.right <= cell.right + 1 },
        email: row.children[3]!.getBoundingClientRect().width, row: card.height,
        rowInside: card.left >= bounds.left - 1 && card.right <= bounds.right + 1,
      };
    });
    if (width >= 768) {
      // Desktop keeps the wide session table and scrolls it inside the focusable region.
      expect(geometry.table).toBeGreaterThanOrEqual(1000);
      expect(geometry.overflow).toBe(true);
      expect(geometry.headings.every(height => height < 60)).toBe(true);
      expect(geometry.ip.content).toBeLessThanOrEqual(geometry.ip.available + 1);
      expect(geometry.ip.height).toBeLessThan(30);
      expect(geometry.email).toBeGreaterThanOrEqual(240);
      expect(geometry.row).toBeLessThan(160);
    } else {
      // Phones show each session as a card (shared index table): nothing scrolls sideways and
      // long IPs and emails wrap inside their card instead of overflowing it.
      expect(geometry.overflow).toBe(false);
      expect(geometry.ip.inside).toBe(true);
      expect(geometry.rowInside).toBe(true);
      expect(geometry.row).toBeLessThan(520);
    }
    await expect(page.getByRole('region', { name: locale === 'ar' ? 'جدول جلسات الدخول' : 'Login sessions table', exact: true })).toBeVisible();
    await expect(table).toHaveAccessibleName(locale === 'ar' ? 'الأجهزة المسجّلة في حسابك' : 'Devices signed in to your account');
    await region.focus(); await expect(region).toBeFocused();
    if (width >= 768) {
      await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      await expect.poll(() => region.evaluate(element => Math.abs(element.scrollLeft))).toBeGreaterThan(1);
    }
    const current = table.getByRole('checkbox', { name: locale === 'ar' ? 'الجلسة الحالية' : 'Current session', exact: true });
    await expect(current).toBeDisabled();
    // The select-all checkbox lives in the table header on desktop and in the card toolbar on phones.
    const all = page.getByRole('checkbox', { name: locale === 'ar' ? 'تحديد الجلسات الأخرى' : 'Select other sessions', exact: true });
    await all.check();
    await expect(table.locator('tbody input:checked')).toHaveCount(2);
    await expect(current).not.toBeChecked();
    await page.setViewportSize({ width: width === 1440 ? 390 : 1440, height: 844 });
    await expect(table.locator('tbody input:checked')).toHaveCount(2);
    await expect(all).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).include('.ws-login-card').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? '')), results.violations.map(v => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
    expect(api.mutations).toEqual([]);
  });
}

for (const locale of ['ar', 'en'] as const) {
  test(`Session export and revocation keep the current device protected in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale, false, 'light', true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/settings/login-sessions');
    const table = page.locator('.ws-login-table table');
    await expect(table.locator('tbody tr')).toHaveCount(3);
    await table.getByRole('checkbox', { name: locale === 'ar' ? 'تحديد الجلسة Synthetic phone' : 'Select session Synthetic phone', exact: true }).check();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: locale === 'ar' ? 'تصدير' : 'Export', exact: true }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe('login-sessions.csv');
    const csv = await readFile((await download.path())!, 'utf8');
    expect(csv).toContain('phone@example.test');
    expect(csv).not.toContain('current@example.test');
    expect(csv).not.toContain('long.synthetic.account');
    const remove = page.locator('.ws-login-actions').getByRole('button', { name: locale === 'ar' ? 'حذف' : 'Delete', exact: true });
    await remove.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: locale === 'ar' ? 'إلغاء' : 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    expect(api.mutations).toEqual([]);
    await remove.click();
    await dialog.getByRole('button', { name: locale === 'ar' ? 'حذف' : 'Delete', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(table.locator('tbody tr')).toHaveCount(2);
    expect(api.mutations).toEqual([{ method: 'DELETE', path: '/auth/sessions/3', data: {} }]);
    const current = table.getByRole('checkbox', { name: locale === 'ar' ? 'الجلسة الحالية' : 'Current session', exact: true });
    await expect(current).toBeDisabled();
    await expect(current).not.toBeChecked();
    await page.reload();
    await expect(table.locator('tbody tr')).toHaveCount(2);
    await expect(current).toBeDisabled();
  });
}
