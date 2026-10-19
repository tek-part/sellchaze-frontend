import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

for (const locale of ['ar', 'en'] as const) for (const width of [1920, 900, 390, 320]) {
  test(`HABIT retains its independent composition and inline navigation in ${locale} at ${width}px`, async ({ page }, testInfo) => {
    const writes: string[] = []; const commerce: string[] = [];
    await page.route('**/api/v1/**', async route => {
      const request = route.request(); const path = new URL(request.url()).pathname;
      if (request.method() !== 'GET') writes.push(path);
      if (/\/(products|checkout)\b/.test(path)) commerce.push(path);
      return route.fulfill({ status: 503, json: { message: 'Isolated unavailable store' } });
    });
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/funnel-templates/habit-${locale}?preview=1&lang=${locale}&theme=sahra`, { waitUntil: 'networkidle' });
    await expect(page.locator('.hbt-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('.hbt-section')).toHaveCount(locale === 'ar' ? 12 : 10); await expect(page.locator('.hbt-feature-column article')).toHaveCount(4);
    await expect(page.locator('.hbt-story-grid img')).toHaveCount(locale === 'ar' ? 4 : 0);
    await expect(page.locator('.hbt-marquee')).toHaveCount(3); await expect(page.locator('.hbt-review-list article')).toHaveCount(4);
    await expect(page.locator('form')).toHaveCount(0); await expect(page.locator('fieldset')).toHaveAttribute('disabled', '');
    expect(await page.locator('.hbt-cover h1').evaluate(element => getComputedStyle(element).fontFamily.split(',')[0]!.replaceAll('"', '').trim())).toBe('Alexandria');
    expect(await page.locator('.hbt-feature-column h2').first().evaluate(element => getComputedStyle(element).fontFamily.split(',')[0]!.replaceAll('"', '').trim())).toBe('Alexandria');
    await expect(page.locator('.hbt-announcement')).toHaveCSS('background-color', 'rgb(72, 58, 151)');
    await expect(page.locator('[data-habit-section="habit-results"]')).toHaveCSS('background-color', 'rgb(184, 162, 255)');
    await expect(page.locator('.hbt-marquee>div').first()).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.hbt-cover h1')).toHaveCSS('font-size', width < 576 ? '36px' : '56px');
    await expect(page.locator('.hbt-feature-column h2').first()).toHaveCSS('font-size', width < 576 ? '24px' : '28px');
    await expect(page.locator('.hbt-reviews>header h2')).toHaveCSS('font-size', width < 576 ? '24px' : '32px');
    expect(await page.locator('.hbt-features').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(width < 992 ? 1 : 3);
    await expect(page.locator('.hbt-review-list article').first()).toHaveCSS('background-color', 'rgb(72, 58, 151)');
    await expect(page.locator('.hbt-review-list article').first()).toHaveCSS('border-top-color', 'rgb(72, 58, 151)');
    if (width < 768) {
      const rail = page.locator('.hbt-review-list'); await rail.scrollIntoViewIfNeeded(); await rail.focus();
      const before = await rail.evaluate(element => element.scrollLeft);
      await page.keyboard.press(locale === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      await expect.poll(() => rail.evaluate(element => Math.abs(element.scrollLeft))).toBeGreaterThan(Math.abs(before));
      expect(await rail.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    }
    if (width < 992) {
      const menu = page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true });
      await menu.click(); await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.hbt-mobile-nav')).not.toHaveAttribute('inert');
      await page.locator('.hbt-mobile-nav a').first().focus(); await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false'); await expect(menu).toBeFocused();
      await menu.click();
    }
    await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'FAQs', exact: true }).filter({ visible: true }).click();
    const questions = page.locator('.hbt-faq button'); await expect(questions).toHaveCount(6);
    await questions.first().click(); await questions.nth(1).click();
    await expect(questions.first()).toHaveAttribute('aria-expanded', 'false'); await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
    const thumbnail = page.locator('.hbt-gallery-rail button').nth(1); await thumbnail.click();
    await expect(thumbnail).toHaveAttribute('aria-pressed', 'true'); await expect(page.locator('.hbt-gallery-main')).toHaveAttribute('src', /habit-detail-/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).include('.hbt-root').analyze(); expect(result.violations).toEqual([]);
    expect(writes).toEqual([]); expect(commerce).toEqual([]);
    await page.locator('.hbt-cover').screenshot({ path: testInfo.outputPath('catalog-cover.png') });
  });
}
