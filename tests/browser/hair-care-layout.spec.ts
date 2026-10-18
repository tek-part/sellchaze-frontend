import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

for (const locale of ['ar', 'en'] as const) for (const width of [1440, 390, 320]) {
  test(`Hair Care catalog keeps its editorial layout and accessible interactions in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const mutations: string[] = []; const commerce: string[] = [];
    await page.route('**/api/v1/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname;
      if (request.method() !== 'GET') mutations.push(path);
      if (/\/(products|checkout)\b/.test(path)) commerce.push(path);
      return route.fulfill({ status: 503, json: { message: 'Isolated unavailable store' } });
    });
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/funnel-templates/hair-care-${locale}?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
    await expect(page.locator('.hc-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('.hc-demo-note')).toContainText(locale === 'ar' ? 'الشراء معطّل' : 'checkout disabled');
    await expect(page.locator('.hc-section')).toHaveCount(11);
    await expect(page.locator('.hc-feature')).toHaveCount(3);
    await expect(page.locator('.hc-details-panel article')).toHaveCount(3);
    await expect(page.locator('.hc-marquee')).toHaveCount(3);
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
    await expect(page.locator('fieldset input').first()).toBeDisabled();
    await expect(page.locator('fieldset button')).toBeDisabled();
    await expect(page.locator('.hc-gallery-main')).toBeVisible();
    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.hc-campaign')!; const details = document.querySelector('.hc-details')!;
      return { background: getComputedStyle(document.querySelector('.hc-root')!).backgroundColor, font: getComputedStyle(document.querySelector('.hc-hero h1')!).fontFamily, heroRadius: getComputedStyle(hero).borderRadius, detailsColumns: getComputedStyle(details).gridTemplateColumns.split(' ').length, motion: getComputedStyle(document.querySelector('.hc-marquee>div')!).animationName, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
    });
    expect(layout.background).toBe('rgb(236, 255, 181)');
    expect(layout.font).toContain('Alexandria');
    expect(layout.detailsColumns).toBe(width < 768 ? 1 : 2);
    expect(layout.heroRadius).toBe(width < 768 ? '30px' : '80px');
    expect(layout.motion).toBe('none'); expect(layout.overflow).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('catalog-top.png') });
    await page.screenshot({ path: testInfo.outputPath('catalog-preview.png'), clip: { x: 0, y: 0, width, height: width >= 768 ? 1800 : 1400 } });
    if (width < 992) {
      const menu = page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true });
      await menu.click();
      await expect(page.locator('.hc-menu-dialog')).toBeVisible();
      const drawer = await page.locator('.hc-menu-panel').boundingBox();
      expect(drawer?.width).toBe(250);
      expect(Math.round(drawer?.x ?? -1)).toBe(locale === 'ar' ? width - 250 : 0);
      await page.keyboard.press('Escape');
      await expect(page.locator('.hc-menu-dialog')).not.toBeVisible();
      await expect(menu).toBeFocused();
      await menu.click();
    }
    await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
    await expect(page.locator('.hc-menu-dialog')).not.toBeVisible();
    const questions = page.locator('.hc-questions h3 button');
    await questions.nth(0).click(); await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await questions.nth(1).click(); await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false'); await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await page.locator('.hc-details').screenshot({ path: testInfo.outputPath('catalog-details.png') });
    const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
    expect(violations, JSON.stringify(violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })))).toEqual([]);
    expect(mutations).toEqual([]); expect(commerce).toEqual([]);
  });
}
