import AxeBuilder from '@axe-core/playwright';
import { expect, test } from 'playwright/test';

const themes = ['naseem', 'bazaar', 'sahra', 'fresh', 'techno', 'elite-furniture', 'blast-pets', 'hype-perfumes', 'hype-fashion', 'elite-wallets', 'stride'] as const;

for (const locale of ['en', 'ar'] as const) {
  for (const width of [1440, 390, 320]) {
    test(`Electric Biker preview navigation, gallery and checkout isolation in ${locale} at ${width}px`, async ({ page }) => {
      const commerceRequests: string[] = [];
      page.on('request', request => { if (/\/storefront\/(checkout|products\/|product-reviews)/.test(request.url())) commerceRequests.push(request.url()); });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/funnel-templates/electric-biker-${locale}?preview=1&lang=${locale}&theme=${locale === 'ar' ? 'sahra' : 'elite-wallets'}`, { waitUntil: 'networkidle' });
      await expect(page.locator('.eb-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('.eb-hero h1')).toHaveCSS('font-family', /^"Readex Pro"/);
      await expect(page.locator('.eb-purchase-panel label').first()).toHaveCSS('font-family', locale === 'ar' ? /^"Readex Pro"/ : /^"DM Sans"/);
      await expect(page.locator('.eb-section')).toHaveCount(11);
      await expect(page.locator('.eb-editorial article')).toHaveCount(2);
      await expect(page.locator('form')).toHaveCount(0);
      await expect(page.locator('.eb-purchase-panel input').first()).toBeDisabled();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.locator('.eb-gallery-rail button').nth(1).click();
      await expect(page.locator('.eb-gallery-main')).toHaveAttribute('src', /electric-biker-detail/);
      if (width < 992) {
        const toggle = page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true });
        await toggle.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        const menu = await page.locator('.eb-menu-panel').boundingBox();
        expect(menu?.width).toBe(250);
        expect(menu?.x).toBeGreaterThan(0);
        await expect(page.locator('.eb-menu-panel')).toHaveCSS('background-color', 'rgba(18, 18, 18, 0.97)');
        await expect(page.locator('.eb-menu-dock')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(toggle).toBeFocused();
        await toggle.click();
      }
      await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
      await expect(page).toHaveURL(/#eb-section-10$/);
      await expect(page.getByRole('dialog')).not.toBeVisible();
      const questions = page.locator('.eb-faq button');
      await questions.nth(0).click(); await questions.nth(1).click();
      await expect(page.locator('.eb-faq button[aria-expanded=true]')).toHaveCount(1);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const blocking = results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? ''));
      expect(blocking, blocking.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
      expect(commerceRequests).toEqual([]);
    });
  }
}

for (const locale of ['en', 'ar'] as const) {
  for (const width of [1440, 390, 320]) {
    test(`Litter Robot preview navigation, gallery and checkout isolation in ${locale} at ${width}px`, async ({ page }) => {
      const commerceRequests: string[] = [];
      page.on('request', request => { if (/\/storefront\/(checkout|products\/|product-reviews)/.test(request.url())) commerceRequests.push(request.url()); });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/funnel-templates/litter-robot-${locale}?preview=1&lang=${locale}&theme=${locale === 'ar' ? 'sahra' : 'elite-wallets'}`, { waitUntil: 'networkidle' });
      await expect(page.locator('.lr-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('.lr-hero h1')).toHaveCSS('font-family', /^Rubik/);
      await expect(page.locator('.lr-purchase-panel label').first()).toHaveCSS('font-family', /^"DM Sans"/);
      await expect(page.locator('.lr-section')).toHaveCount(16);
      await expect(page.locator('.lr-editorial')).toHaveCount(4);
      await expect(page.locator('form')).toHaveCount(0);
      await expect(page.locator('.lr-purchase-panel input').first()).toBeDisabled();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await page.locator('.lr-gallery-rail button').nth(1).click();
      await expect(page.locator('.lr-gallery-main')).toHaveAttribute('src', /litter-robot-hero/);
      if (width < 992) {
        const toggle = page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true });
        await toggle.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        const menu = await page.locator('.lr-menu-panel').boundingBox();
        expect(menu?.width).toBe(250);
        expect(menu?.x).toBeGreaterThan(0);
        await expect(page.locator('.lr-menu-panel')).toHaveCSS('background-color', 'rgba(255, 133, 91, 0.98)');
        await expect(page.locator('.lr-menu-dock')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(toggle).toBeFocused();
        await toggle.click();
      }
      await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
      const questions = page.locator('.lr-faq button');
      await questions.nth(0).click(); await questions.nth(1).click();
      await expect(page.locator('.lr-faq button[aria-expanded=true]')).toHaveCount(1);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const blocking = results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? ''));
      expect(blocking, blocking.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
      expect(commerceRequests).toEqual([]);
    });
  }
}

for (const locale of ['en', 'ar'] as const) {
  for (const width of [1440, 390, 320]) {
    test(`Hair Revive preview has working accessible navigation and inert checkout in ${locale} at ${width}px`, async ({ page }) => {
      const commerceRequests: string[] = [];
      await page.route('**/api/v1/storefront/checkout**', async route => { commerceRequests.push(route.request().url()); await route.abort(); });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/funnel-templates/hair-revive-${locale}?preview=1&lang=${locale}&theme=${locale === 'ar' ? 'sahra' : 'elite-wallets'}`, { waitUntil: 'networkidle' });
      await expect(page.locator('.hr-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('.hr-hero h1')).toHaveCSS('font-family', /^Alexandria/);
      await expect(page.locator('.hr-reviews-heading h2')).toHaveCSS('font-family', /^"Readex Pro"/);
      await expect(page.locator('.hr-section')).toHaveCount(15);
      await expect(page.locator('form')).toHaveCount(0);
      await expect(page.locator('.hr-purchase-panel input').first()).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (width < 768) {
        const toggle = page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true });
        await toggle.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        expect(await page.locator('.hr-menu-panel').evaluate(node => node.getBoundingClientRect().width)).toBe(250);
        await page.keyboard.press('Escape');
        await expect(toggle).toBeFocused();
        await toggle.click();
      }
      await page.getByRole('link', { name: locale === 'ar' ? 'أسئلة وأجوبة' : 'Questions & answers', exact: true }).filter({ visible: true }).click();
      const questions = page.locator('.hr-question button');
      await questions.nth(0).click(); await questions.nth(1).click();
      await expect(page.locator('.hr-question button[aria-expanded=true]')).toHaveCount(1);
      await expect(questions.nth(0)).toHaveAttribute('aria-expanded', 'false');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const blocking = results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? ''));
      expect(blocking, blocking.map(item => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
      expect(commerceRequests).toEqual([]);
    });
  }
}

for (const locale of ['en', 'ar'] as const) {
  for (const theme of themes) {
    test(`${theme} storefront has no serious accessibility violations in ${locale}`, async ({ page }) => {
      await page.addInitScript((language) => localStorage.setItem('sf:locale', language), locale);
      await page.goto(`/?preview=1&theme=${theme}`, { waitUntil: 'networkidle' });
      await expect(page.locator('#storefront-root')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
      expect(blocking, blocking.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
    });
  }
}

for (const locale of ['en', 'ar'] as const) {
  for (const width of [1440, 390, 320]) {
    test(`Glasses template preview is accessible and read-only in ${locale} at ${width}px`, async ({ page }) => {
      const checkoutRequests: string[] = [];
      await page.route('**/api/v1/storefront/checkout**', async (route) => { checkoutRequests.push(route.request().url()); await route.abort(); });
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/funnel-templates/glasses-${locale}?preview=1&lang=${locale}&theme=${locale === 'ar' ? 'sahra' : 'elite-wallets'}`, { waitUntil: 'networkidle' });
      await expect(page.locator('.gf-root')).toBeVisible();
      await expect(page.locator('.gf-root')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(page.locator('.gf-hero h1')).toHaveCSS('font-family', /^Alexandria/);
      await expect(page.locator('form')).toHaveCount(0);
      await expect(page.locator('.gf-purchase-panel input').first()).toBeDisabled();
      await expect(page.locator('.gf-purchase-panel button')).toBeDisabled();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      if (width < 768) await page.getByRole('button', { name: locale === 'ar' ? 'قائمة الصفحة' : 'Page menu', exact: true }).click();
      await page.getByRole('link', { name: locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQs', exact: true }).click();
      await page.locator('.gf-faq summary').first().click();
      await expect(page.locator('.gf-faq details[open]')).toHaveCount(1);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
      expect(blocking, blocking.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
      expect(checkoutRequests).toEqual([]);
    });
  }
}
