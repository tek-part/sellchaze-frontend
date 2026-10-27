import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { effectiveApiMethod } from './helpers/api-method';
type Locale = 'ar' | 'en';
async function fixture(page: Page, locale: Locale, theme = 'light', roles = ['Merchant'], permissions: string[] = []) {
    const calls: string[] = [], writes: string[] = [];
    const user = { id:1,name:'Navigation fixture',roles,permissions,is_active:true,profile:{username:'fixture'} };
    await page.addInitScript(({locale,theme}) => {
        localStorage.setItem('sellchase_access_token','synthetic-sidebar'); localStorage.setItem('sellchase_locale',locale); localStorage.setItem('sellchaze_workspace_appearance',theme);
    },{locale,theme});
    await page.route('**/api/v1/**',async route => {
        const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1',''),method=effectiveApiMethod(req);
        const headers={'Access-Control-Allow-Origin':req.headers().origin || 'http://127.0.0.1:4233','Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':'authorization,content-type,x-requested-with,x-http-method-override','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
        if(method==='OPTIONS')return route.fulfill({status:204,headers});
        if(method!=='GET'){writes.push(path);return route.fulfill({status:405,json:{message:'Synthetic fixture blocks every write.'},headers});}
        calls.push(path); const send=(json:unknown)=>route.fulfill({json,headers});
        if(path==='/auth/me')return send({user});
        if(path==='/my-store')return send({data:{id:9,owner_user_id:1,name:'Synthetic store',slug:'synthetic',status:'active',currency:'USD'}});
        if(path==='/my-store/apps')return send({data:[],categories:[{key:'tracking',ar:'التتبع',en:'Tracking',app_keys:[]}]});
        return send({data:[],meta:{current_page:1,last_page:1,total:0,per_page:25},unread:0,unread_count:0,sectors:[]});
    });
    return {calls,writes,user};
}
const primary=(page:Page)=>page.locator('#workspace-sidebar');
const rail=(page:Page)=>primary(page).locator('.ws-compact-nav');
const group=(page:Page,key:string)=>rail(page).locator(`button[aria-label="${key}"]`);
const flyout=(page:Page)=>page.locator('.ws-compact-flyout');
async function ready(page:Page,path='/store/apps'){
    await page.setViewportSize({width:1440,height:900});await page.goto(path);await expect(primary(page)).toHaveAttribute('data-collapsed');
    expect((await primary(page).boundingBox())!.width).toBe(64);await page.evaluate(()=>document.fonts.ready);
}
async function bounds(page:Page){
    const b=(await flyout(page).boundingBox())!,v=page.viewportSize()!;
    expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(v.width);expect(b.y+b.height).toBeLessThanOrEqual(v.height);
    await expect(flyout(page)).toHaveCount(1);expect((await primary(page).boundingBox())!.width).toBe(64);
}
const orders=(locale:Locale)=>locale==='ar'?'الطلبات':'Orders';
const products=(locale:Locale)=>locale==='ar'?'المنتجات':'Products';
const expectedOrders=['/store/orders','/store/returns','/store/draft-orders','/store/customers','/store/missed-orders','/store/blocked-phone-numbers','/store/blocked-phones','/store/newsletter'];
for(const locale of ['en','ar'] as const) for(const theme of ['light','dark']){
    test(`${locale} ${theme} fresh layouts start64; direct icons show hover/focus labels and search works`,async({page},info)=>{
        const {writes}=await fixture(page,locale,theme);await ready(page);
        const link=rail(page).locator('a[href="/community"]');const label=(await link.getAttribute('aria-label'))!;
        await link.hover();await expect(page.getByRole('tooltip')).toHaveText(label);await expect(page.getByRole('tooltip').locator('a,button')).toHaveCount(0);
        await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toBeHidden();
        await link.focus();await expect(page.getByRole('tooltip')).toHaveText(label);await page.keyboard.press('Escape');await expect(link).toBeFocused();
        await primary(page).locator('.ws-sidebar-tools button').click();const search=page.locator('.ws-search-dialog');await expect(search).toBeVisible();await search.getByRole('textbox').fill('phone-verification');await expect(search.locator('a[href="/store/settings/phone-verification"]')).toBeVisible();await page.keyboard.press('Escape');
        await primary(page).getByRole('button',{name:locale==='ar'?'إظهار القائمة الجانبية':'Show sidebar',exact:true}).first().click();await expect.poll(async()=>(await primary(page).boundingBox())!.width).toBe(272);
        await page.reload();await expect(primary(page)).toHaveAttribute('data-collapsed');expect((await primary(page).boundingBox())!.width).toBe(64);
        await page.screenshot({path:info.outputPath(`collapsed-${locale}-${theme}.png`)});expect(writes).toEqual([]);
    });
    test(`${locale} ${theme} group hover opens one complete authorized flyout without requests or layout expansion`,async({page},info)=>{
        const {calls,writes}=await fixture(page,locale,theme);await ready(page);await page.waitForLoadState('networkidle');const before=calls.length;
        const trigger=group(page,orders(locale));const start=Date.now();await trigger.hover();await expect(flyout(page)).toBeVisible();const elapsed=Date.now()-start;
        await info.attach('hover-latency.json',{body:JSON.stringify({elapsedMs:elapsed,configuredOpenDelayMs:100,configuredCloseDelayMs:120}),contentType:'application/json'});
        await expect(trigger).toHaveAttribute('aria-expanded','true');expect(await flyout(page).locator('a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))).toEqual(expectedOrders);await bounds(page);
        const b=(await flyout(page).boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+50,{steps:4});await page.waitForTimeout(160);await expect(flyout(page)).toBeVisible();
        expect(calls).toHaveLength(before);
        if(locale==='en' && theme==='light'){
            await page.evaluate(()=>window.dispatchEvent(new CustomEvent('sellchaze:workspace-appearance',{detail:'dark'})));
            await expect(flyout(page)).toHaveAttribute('data-workspace-theme','dark');
            await page.evaluate(()=>window.dispatchEvent(new CustomEvent('sellchaze:workspace-appearance',{detail:'light'})));
            await expect(flyout(page)).toHaveAttribute('data-workspace-theme','light');
        }
        await page.screenshot({path:info.outputPath(`flyout-${locale}-${theme}.png`)});
        const axe=await new AxeBuilder({page}).include('.ws-compact-flyout').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations.map(v=>v.id)).toEqual([]);
        const icon=await trigger.locator('svg').evaluate(el=>{const s=getComputedStyle(el);return{width:s.width,height:s.height}});expect(icon).toEqual({width:'22px',height:'22px'});
        await page.locator('.ws-apps-heading').click();await expect(flyout(page)).toBeHidden();await trigger.click();await expect(flyout(page)).toBeVisible();await page.locator('.ws-apps-heading').click();await expect(flyout(page)).toBeHidden();expect(writes).toEqual([]);
    });
    test(`${locale} ${theme} keyboard enters rows, returns focus, changes group and navigates without widening`,async({page})=>{
        await fixture(page,locale,theme);await ready(page);const trigger=group(page,orders(locale));await trigger.focus();await page.keyboard.press(locale==='ar'?'ArrowLeft':'ArrowRight');
        const first=flyout(page).locator('a').first();await expect(first).toBeFocused();await page.keyboard.press('End');await expect(flyout(page).locator('a').last()).toBeFocused();await page.keyboard.press('Home');await expect(first).toBeFocused();
        await page.keyboard.press('Shift+Tab');await expect(flyout(page)).toBeHidden();await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');await page.keyboard.press('Tab');await expect(flyout(page).locator('a').first()).toBeFocused();await page.keyboard.press('End');await page.keyboard.press('Tab');
        await expect(group(page,products(locale))).toBeFocused();await expect(flyout(page).getByRole('navigation')).toHaveAttribute('aria-label',products(locale));await page.keyboard.press('Escape');await expect(flyout(page)).toBeHidden();await expect(group(page,products(locale))).toBeFocused();
        await trigger.click();await flyout(page).locator('a[href="/store/orders"]').click();await expect(page).toHaveURL(/\/store\/orders$/);await expect(flyout(page)).toBeHidden();expect((await primary(page).boundingBox())!.width).toBe(64);
    });
}
for(const locale of ['en','ar'] as const){
    test(`${locale} employee permission refresh removes stale flyout before reuse; customer has no store groups`,async({page})=>{
        const {user}=await fixture(page,locale,'light',['Employee'],['store.products.manage','store.orders.manage']);await ready(page,'/community/search');
        await group(page,orders(locale)).click();await expect(flyout(page)).toBeVisible();user.permissions=['store.products.manage'];await page.evaluate(()=>window.dispatchEvent(new Event('sellchase:me-updated')));await expect(group(page,orders(locale))).toHaveCount(0);await expect(flyout(page)).toBeHidden();
        await group(page,products(locale)).click();expect(await flyout(page).locator('a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))).toEqual(['/store/products']);
        user.roles=['Customer'];user.permissions=[];await page.evaluate(()=>window.dispatchEvent(new Event('sellchase:me-updated')));await expect(rail(page).locator('button')).toHaveCount(0);await expect(flyout(page)).toBeHidden();await expect(rail(page).locator('a[href="/community"]')).toBeVisible();
    });
    test(`${locale} touch opens groups without hover; mobile keeps accessible complete navigation drawer`,async({browser})=>{
        const context=await browser.newContext({hasTouch:true,viewport:{width:1024,height:700}});const page=await context.newPage();await fixture(page,locale);await page.goto('/store/apps');
        const trigger=group(page,orders(locale));await trigger.tap();await expect(flyout(page)).toBeVisible();await bounds(page);await trigger.tap();await expect(flyout(page)).toBeHidden();
        await page.setViewportSize({width:390,height:844});await expect(primary(page)).toBeHidden();await page.locator('.ws-mobile-menu').tap();const drawer=page.locator('.ws-drawer');await expect(drawer).toBeVisible();await expect(drawer.locator('button').filter({hasText:orders(locale)})).toBeVisible();await page.keyboard.press('Escape');await expect(drawer).toBeHidden();await context.close();
    });
    test(`${locale} bottom flyout clamps, scroll closes and full-height second rail stays fixed`,async({page},info)=>{
        await fixture(page,locale,'dark');await ready(page,'/store/apps?tab=discover');await page.setViewportSize({width:1024,height:600});const secondary=page.locator('.ws-secondary-navigation-slot>.ws-context-navigation');
        await expect(secondary).toBeVisible();const before=await secondary.boundingBox();expect(before!.y).toBe(0);expect(before!.height).toBe(600);
        const wallet=rail(page).locator('button[aria-label="'+(locale==='ar'?'محفظتك':'Your wallet')+'"]');await wallet.scrollIntoViewIfNeeded();await wallet.hover();await expect(flyout(page)).toBeVisible();await bounds(page);expect(await secondary.boundingBox()).toEqual(before);
        await page.screenshot({path:info.outputPath(`secondary-flyout-${locale}.png`)});
        const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:6});
        await expect.poll(()=>page.evaluate(()=>{const box=document.querySelector('.ws-compact-flyout')!.getBoundingClientRect(),v=window.visualViewport!;return box.width<=v.width-16+1 && box.left>=v.offsetLeft && box.right<=v.offsetLeft+v.width;})).toBe(true);
        await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});await cdp.detach();
        await primary(page).locator('.ws-sidebar-scroll').evaluate(el=>{el.scrollTop=0});await expect(flyout(page)).toBeHidden();
        await page.goto('/services');await group(page,orders(locale)).hover();await expect(flyout(page)).toBeVisible();await bounds(page);const service=await page.locator('.ws-secondary-navigation-slot>.ws-context-navigation').boundingBox();expect(service!.y).toBe(0);expect(service!.height).toBe(600);
    });
    test(`${locale} administrator groups retain all links and one unread consumer`,async({page})=>{
        const {calls,writes}=await fixture(page,locale,'light',['Admin'],['wavex-access','stores-edit']);await ready(page,'/community/search');await page.waitForLoadState('networkidle');const before=calls.length;
        const wavex=rail(page).getByRole('button',{name:'Wavex',exact:true});await wavex.hover();await expect(flyout(page)).toBeVisible();expect(await flyout(page).locator('a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))).toEqual(['/wavex/settings','/wavex/connect','/wavex/chats','/wavex/templates','/wavex/groups','/wavex/campaigns']);
        await bounds(page);expect(calls).toHaveLength(before);expect(calls.filter(path=>path==='/chat/unread-count')).toHaveLength(1);expect(writes).toEqual([]);
    });
}
