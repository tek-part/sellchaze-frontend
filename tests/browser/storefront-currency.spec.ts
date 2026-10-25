import { expect, test } from 'playwright/test';

// A currency pick re-keys the cart provider, which remounts the theme layout so every price is
// fetched again in the new currency. Themes that keep their menu state inside that subtree must
// reopen the drawer, so a phone shopper stays where they were and keyboard focus is not lost.
const LAYOUT_THEMES = ['blast-pets', 'nature-pets', 'nature-kids', 'elite-furniture', 'pure-furniture', 'hype-perfumes', 'hype-fashion', 'elite-wallets', 'sphinx-v3'];

for (const theme of LAYOUT_THEMES) {
  test(`${theme}: picking a currency in the phone drawer keeps the drawer open`, async ({ page }) => {
    await page.route('**/api/v1/**', (route) => route.abort());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/?preview=1&theme=${theme}&lang=en`, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /^(open )?(menu|more)/i }).first().click();
    const pill = page.locator('[role="dialog"] .sf-currency button:visible').first();
    await expect(pill).toBeVisible();
    const before = (await pill.textContent())?.trim();
    await pill.click();
    await page.locator('[role="dialog"] .sf-currency [role="option"]').filter({ hasNotText: before ?? '' }).first().click();

    const after = page.locator('[role="dialog"] .sf-currency button:visible').first();
    await expect(after).toBeVisible();
    await expect(after).not.toHaveText(before ?? '');
    await expect(after).toBeFocused();
  });
}
