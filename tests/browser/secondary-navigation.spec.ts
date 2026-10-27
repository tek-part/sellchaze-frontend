import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { effectiveApiMethod } from './helpers/api-method';

type Locale = 'ar' | 'en';
async function fixture(page: Page, locale: Locale, admin = false, dark = false) {
    const writes: string[] = [];
    const calls: string[] = [];
    await page.addInitScript(({ locale, dark }) => {
        localStorage.setItem('sellchase_access_token', 'synthetic-secondary-navigation');
        localStorage.setItem('sellchase_locale', locale);
        localStorage.setItem('sellchaze_workspace_appearance', dark ? 'dark' : 'light');
    }, { locale, dark });
    await page.route('**/api/v1/**', async route => {
        const req = route.request(), url = new URL(req.url()), path = url.pathname.replace('/api/v1', '');
        const headers = { 'Access-Control-Allow-Origin': req.headers().origin || 'http://127.0.0.1:4231', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with,x-http-method-override', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        const method = effectiveApiMethod(req);
        if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (method !== 'GET') { writes.push(path); return route.fulfill({ status: 405, json: { message: 'All writes blocked in synthetic navigation proof.' }, headers }); }
        calls.push(req.url());
        const send = (json: unknown) => route.fulfill({ json, headers });
        if (path === '/auth/me') return send({ user: { id: 1, name: 'Navigation fixture', roles: [admin ? 'Admin' : 'Merchant'], permissions: admin ? ['stores-edit', 'wavex-access'] : [], is_active: true, profile: { username: 'fixture' } } });
        if (path === '/my-store' || path === '/stores/9') return send({ data: { id: 9, owner_user_id: 1, name: 'Synthetic store', slug: 'synthetic', status: 'active', currency: 'USD' } });
        if (path.endsWith('/apps')) return send({ data: [], categories: [{ key: 'tracking', ar: 'التتبع', en: 'Tracking', app_keys: [] }, { key: 'sales', ar: 'المبيعات', en: 'Sales', app_keys: [] }] });
        if (path === '/chat/conversations') return send({ data: [{ id: 4, other_user: { id: 5, name: 'Synthetic colleague' }, unread: 0, last_message: { body: 'Fixture conversation' } }] });
        if (path === '/wavex/chats') {
            const offset = Number(url.searchParams.get('offset') || 0);
            return send({ data: offset ? [] : Array.from({ length: 50 }, (_, n) => ({ id: `${1000 + n}@c.us`, name: `Synthetic contact ${n}`, lastMessage: { body: 'Fixture' } })) });
        }
        if (path === '/community/groups/7') return send({ data: { id: 7, name: 'Synthetic group', posts: [], members_count: 0, posts_count: 0 } });
        if (path === '/public/profile/fixture') return send({ user: { id: 1 } });
        if (path.includes('/profile-picture')) return send({ data: { url: null } });
        return send({ data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 25 }, unread: 0, unread_count: 0, sectors: [] });
    });
    return { writes, calls };
}
async function geometry(page: Page, width: number) {
    const rail = page.locator('.ws-secondary-navigation-slot > .ws-context-navigation');
    await expect(rail).toBeVisible();
    const r = await rail.boundingBox();
    expect(r).not.toBeNull();
    expect(r!.y).toBe(0); expect(r!.height).toBe(page.viewportSize()!.height); expect(r!.width).toBe(width);
    const header = (await page.locator('.ws-header').boundingBox())!;
    const main = (await page.locator('#workspace-content').boundingBox())!;
    const rtl = await page.locator('html').getAttribute('dir') === 'rtl';
    expect(rtl ? header.x + header.width <= r!.x + 1 : header.x >= r!.x + r!.width - 1).toBe(true);
    expect(rtl ? main.x + main.width <= r!.x + 1 : main.x >= r!.x + r!.width - 1).toBe(true);
    const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, offenders: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 || el.getBoundingClientRect().left < -1).slice(-12).map(el => `${el.tagName}.${el.className}`) }));
    expect(overflow.width, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewport);
    return rail;
}
const community = ['/community', '/community/following', '/community/saved', '/community/trending', '/community/search', '/community/connections/fixture', '/community/tag/synthetic', '/community/groups', '/community/groups/7', '/community/create'];
for (const locale of ['en', 'ar'] as const) {
    for (const [name, path, width, admin] of [
        ['apps', '/store/apps?tab=discover', 288, false], ['admin-apps', '/stores/9/apps?tab=discover', 288, true],
        ['services', '/services', 288, false], ['community', '/community', 288, false], ['chat', '/chat', 330, true], ['wavex', '/wavex/chats', 380, true],
    ] as const) test(`${locale} ${name} occupies full shell height and collapses independently`, async ({ page }, info) => {
        const { writes } = await fixture(page, locale, admin, locale === 'ar');
        await page.setViewportSize({ width: 1600, height: 900 }); await page.goto(path);
        const rail = await geometry(page, width);
        const primary = page.locator('#workspace-sidebar');
        expect((await primary.boundingBox())!.width).toBe(272);
        const toggle = rail.locator('.ws-secondary-sidebar-heading button');
        await toggle.click(); await expect(rail).toHaveClass(/is-collapsed/); expect((await rail.boundingBox())!.width).toBe(48);
        expect((await primary.boundingBox())!.width).toBe(272);
        await toggle.click(); await geometry(page, width);
        await page.setViewportSize({ width: 1024, height: 650 }); await geometry(page, width);
        const headerButtons = page.locator('.ws-header button');
        for (const button of await headerButtons.all()) if (await button.isVisible()) {
            const r = (await button.boundingBox())!; expect(r.x).toBeGreaterThanOrEqual(0); expect(r.x + r.width).toBeLessThanOrEqual(1025);
        }
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.screenshot({ path: info.outputPath(`${name}-${locale}.png`) });
        const result = await new AxeBuilder({ page }).include('.ws-context-navigation').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
        expect(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join('|')}`)).toEqual([]);
        expect(writes).toEqual([]);
    });
    test(`${locale} every community shell route uses one full-height navigation`, async ({ page }) => {
        const { writes } = await fixture(page, locale);
        await page.setViewportSize({ width: 1440, height: 900 });
        for (const path of community) { await page.goto(path); await geometry(page, 288); await expect(page.locator('.ws-context-navigation nav')).toHaveCount(1); }
        expect(writes).toEqual([]);
    });
    for (const [name, path] of [['apps', '/store/apps?tab=discover'], ['services', '/services'], ['community', '/community']] as const) test(`${locale} ${name} mobile drawer closes with focus restored and on desktop resize`, async ({ page }) => {
        await fixture(page, locale, false, locale === 'ar'); await page.setViewportSize({ width: 390, height: 844 }); await page.goto(path);
        const opener = page.locator('.ws-settings-mobile-toolbar button'); await opener.click();
        const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
        const input = dialog.getByRole('searchbox'); await input.fill('not-a-destination');
        await expect(dialog.locator('nav a,nav button,[role=tab]')).toHaveCount(name === 'community' ? 1 : 0); // profile remains accessible when filtering routes
        await page.keyboard.press('Escape'); await expect(dialog).toBeHidden(); await expect(opener).toBeFocused();
        await opener.click(); await expect(dialog).toBeVisible(); await page.setViewportSize({ width: 1024, height: 650 }); await expect(dialog).toBeHidden();
        await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
        await geometry(page, 288);
    });
    for (const wavex of [false, true]) test(`${locale} ${wavex ? 'wavex' : 'chat'} conversation and draft survive breakpoint/fullscreen moves`, async ({ page }) => {
        const { writes, calls } = await fixture(page, locale, true);
        await page.setViewportSize({ width: 1440, height: 900 }); await page.goto(wavex ? '/wavex/chats' : '/chat');
        const rail = await geometry(page, wavex ? 380 : 330);
        if (wavex) await rail.getByRole('button', { name: /Synthetic contact 0/ }).click();
        else await rail.getByRole('button', { name: /Synthetic colleague/ }).click();
        const composer = page.locator('textarea').first(); await expect(composer).toBeVisible(); await composer.fill('Unsent synthetic draft');
        for (const viewport of [{ width: 900, height: 700 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
            await page.setViewportSize(viewport); await expect(composer).toHaveValue('Unsent synthetic draft');
        }
        await geometry(page, wavex ? 380 : 330);
        if (wavex) {
            await page.getByRole('button', { name: 'Fullscreen', exact: true }).click(); await expect(page.locator('.ws-secondary-navigation-slot')).toBeHidden(); await expect(composer).toHaveValue('Unsent synthetic draft');
            await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click(); await geometry(page, 380); await expect(composer).toHaveValue('Unsent synthetic draft');
            await rail.getByRole('searchbox').fill('Synthetic contact 49'); await expect(rail.getByRole('button', { name: /Synthetic contact 49/ })).toBeVisible();
            await rail.getByRole('searchbox').fill('');
            await rail.locator('.ws-wavex-list-in-shell > div').last().evaluate(el => { el.scrollTop = el.scrollHeight; });
            await expect.poll(() => calls.some(url => url.includes('/wavex/chats?') && new URL(url).searchParams.get('offset') === '50')).toBe(true);
        }
        expect(writes.every(path => /\/chat\/conversations\/4\/read$/.test(path))).toBe(true); // pre-existing read call is intercepted, never sent
    });
}
