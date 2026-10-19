import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

for (const locale of ['ar', 'en'] as const) for (const width of [1440, 390, 320]) {
  test(`Skin Care catalog retains its distinct editorial layout and interactions in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const mutations: string[] = []; const commerce: string[] = [];
    await page.route('**/api/v1/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname;
      if (request.method() !== 'GET') mutations.push(path);
      if (/\/(products|checkout)\b/.test(path)) commerce.push(path);
      return route.fulfill({ status: 503, json: { message: 'Isolated unavailable store' } });
    });
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/funnel-templates/skin-care-${locale}?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
    await expect(page.locator('.skc-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('.skc-demo-note')).toContainText(locale === 'ar' ? 'الشراء معطّل' : 'checkout disabled');
    await expect(page.locator('.skc-section')).toHaveCount(locale === 'en' ? 14 : 12);
    await expect(page.locator('.skc-feature-cover')).toHaveCount(locale === 'en' ? 2 : 1);
    await expect(page.locator('.skc-quote')).toHaveCount(locale === 'en' ? 2 : 1);
    await expect(page.locator('.skc-marquee')).toHaveCount(2);
    await expect(page.locator('.skc-policies button')).toHaveCount(3);
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
    await expect(page.locator('fieldset input').first()).toBeDisabled();
    await expect(page.locator('.skc-gallery-main')).toBeVisible();
    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.skc-campaign')!; const specs = document.querySelector('.skc-specs')!;
      const heading = document.querySelector('.skc-hero h1')!; const intro = document.querySelector('.skc-section[data-skincare-section=skincare-intro]')!;
      return { font: getComputedStyle(heading).fontFamily, heroRadius: getComputedStyle(hero).borderRadius, heroHeight: hero.getBoundingClientRect().height, viewport: innerHeight, specsColumns: getComputedStyle(specs).gridTemplateColumns.split(' ').length, intro: getComputedStyle(intro).backgroundColor, motion: getComputedStyle(document.querySelector('.skc-marquee>div')!).animationName, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    expect(layout.font).toContain('Changa'); expect(layout.heroRadius).toBe('0px'); expect(layout.heroHeight).toBeGreaterThanOrEqual(layout.viewport);
    expect(layout.specsColumns).toBe(width < 992 ? 1 : 2); expect(layout.intro).toBe('rgb(6, 2, 1)');
    expect(layout.motion).toBe('none'); expect(layout.overflow).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('catalog-top.png') });
    const previewHeight = width >= 768 ? 1800 : 1400;
    const preview = await page.screenshot({ path: testInfo.outputPath('catalog-preview.png'), fullPage: true, clip: { x: 0, y: 0, width, height: previewHeight } });
    expect(preview.readUInt32BE(20)).toBe(previewHeight);
    if (width < 992) {
      const menu = page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true });
      await menu.click(); await expect(page.locator('.skc-menu-dialog')).toBeVisible();
      const drawer = await page.locator('.skc-menu-panel').boundingBox(); expect(drawer?.width).toBe(250);
      expect(Math.round(drawer?.x ?? -1)).toBe(locale === 'ar' ? width - 250 : 0);
      await page.keyboard.press('Escape'); await expect(page.locator('.skc-menu-dialog')).not.toBeVisible(); await expect(menu).toBeFocused();
      await menu.click();
    }
    await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
    await expect(page.locator('.skc-menu-dialog')).not.toBeVisible();
    const questions = page.locator('.skc-faq button');
    await questions.nth(0).click(); await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await questions.nth(1).click(); await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false'); await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
    const policy = page.locator('.skc-policies button').first(); await policy.click();
    await expect(policy).toHaveAttribute('aria-expanded', 'true'); await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.skc-specs').screenshot({ path: testInfo.outputPath('catalog-specifications.png') });
    await page.locator('.skc-story').screenshot({ path: testInfo.outputPath('catalog-story.png') });
    const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
    expect(violations, JSON.stringify(violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })))).toEqual([]);
    expect(mutations).toEqual([]); expect(commerce).toEqual([]);
  });
}
