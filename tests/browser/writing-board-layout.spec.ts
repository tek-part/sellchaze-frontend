import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

for (const locale of ['ar', 'en'] as const) for (const width of [1920, 900, 390, 320]) {
  test(`Writing Board retains its independent composition and inline navigation in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const writes: string[] = []; const commerce: string[] = [];
    await page.route('**/api/v1/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname;
      if (request.method() !== 'GET') writes.push(path);
      if (/\/(products|checkout)\b/.test(path)) commerce.push(path);
      return route.fulfill({ status: 503, json: { message: 'Isolated unavailable store' } });
    });
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/funnel-templates/writing-board-${locale}?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
    await expect(page.locator('.wbc-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('.wbc-section')).toHaveCount(11); await expect(page.locator('.wbc-image-grid img')).toHaveCount(4);
    await expect(page.locator('.wbc-marquee')).toHaveCount(2); await expect(page.locator('.wbc-review-list article')).toHaveCount(6);
    await expect(page.locator('form')).toHaveCount(0); await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
    expect(await page.locator('.wbc-cover-photo h1').evaluate(element => getComputedStyle(element).fontFamily.split(',')[0]!.replaceAll('"', '').trim())).toBe('Alexandria');
    expect(await page.locator('.wbc-story h2').evaluate(element => getComputedStyle(element).fontFamily.split(',')[0]!.replaceAll('"', '').trim())).toBe('Cairo');
    await expect(page.locator('[data-writingboard-section="writingboard-hero"]')).toHaveCSS('background-color', 'rgb(217, 45, 54)');
    await expect(page.locator('[data-writingboard-section="writingboard-story"]')).toHaveCSS('background-color', 'rgb(27, 27, 27)');
    await expect(page.locator('.wbc-marquee>div').first()).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.wbc-cover-photo h1')).toHaveCSS('font-size', width < 992 ? '55px' : '80px');
    await expect(page.locator('.wbc-story h2')).toHaveCSS('font-size', width < 992 ? '32px' : '80px');
    await expect(page.locator('.wbc-reviews>header h2')).toHaveCSS('font-size', width < 992 ? '23px' : '80px');
    expect(await page.locator('.wbc-image-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(width < 992 ? 1 : 2);
    await expect(page.locator('.wbc-review-list article').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.locator('.wbc-review-list article').first()).toHaveCSS('border-top-color', 'rgb(251, 251, 251)');
    if (width < 768) {
      const rail = page.locator('.wbc-review-list'); await rail.scrollIntoViewIfNeeded(); await rail.focus();
      const before = await rail.evaluate(element => element.scrollLeft);
      await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      await expect.poll(() => rail.evaluate(element => Math.abs(element.scrollLeft))).toBeGreaterThan(Math.abs(before));
      expect(await rail.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    }
    if (width < 992) {
      const menu = page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true });
      await menu.click(); await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.wbc-mobile-nav')).not.toHaveAttribute('inert');
      await page.locator('.wbc-mobile-nav a').first().focus(); await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false'); await expect(menu).toBeFocused();
      await menu.click();
    }
    await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
    const questions = page.locator('.wbc-faq button'); await expect(questions).toHaveCount(6);
    await questions.first().click(); await questions.nth(1).click();
    await expect(questions.first()).toHaveAttribute('aria-expanded', 'false'); await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
    const thumbnail = page.locator('.wbc-gallery-rail button').nth(1); await thumbnail.click();
    await expect(thumbnail).toHaveAttribute('aria-pressed', 'true'); await expect(page.locator('.wbc-gallery-main')).toHaveAttribute('src', /writing-board-detail-/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).include('.wbc-root').analyze(); expect(result.violations).toEqual([]);
    expect(writes).toEqual([]); expect(commerce).toEqual([]);
    await page.locator('.wbc-cover-photo').screenshot({ path: testInfo.outputPath('catalog-cover.png') });
  });
}
