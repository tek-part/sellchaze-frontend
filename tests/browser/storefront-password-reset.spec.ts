import { expect, test } from 'playwright/test';

// Store customers reset their password through their own store's API (store-scoped links), never
// the platform account routes. Synthetic store; the API is fully mocked and no email is sent.
const STORE_ID = 7654321;

test('forgot and reset password use the store customer endpoints', async ({ page }) => {
  const posts: Array<{ path: string; body: unknown }> = [];
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: 'en', supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (request.method() === 'POST') {
      posts.push({ path, body: request.postDataJSON() });
      return route.fulfill({ json: { message: 'ok' } });
    }
    return route.fulfill({ json: { data: [] } });
  });

  const form = page.locator('form.sf-auth');
  await page.goto('/forgot-password?preview=1&theme=naseem&lang=en', { waitUntil: 'networkidle' });
  await form.getByLabel(/^Email/).fill('ada@example.com');
  await form.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.locator('.sf-newsletter__success')).toContainText('ada@example.com');

  await page.goto('/reset-password?preview=1&theme=naseem&lang=en&token=synthetic-token&email=ada%40example.com', { waitUntil: 'networkidle' });
  await expect(form.getByLabel(/^Email/)).toHaveValue('ada@example.com');
  await form.getByLabel(/^New password/).fill('brand-new-pass');
  await form.getByLabel(/^Confirm password/).fill('brand-new-pass');
  await form.getByRole('button', { name: 'Reset password' }).click();
  await expect(page).toHaveURL(/\/login/);

  expect(posts).toEqual([
    { path: '/api/v1/storefront/auth/forgot-password', body: { email: 'ada@example.com' } },
    { path: '/api/v1/storefront/auth/reset-password', body: { token: 'synthetic-token', email: 'ada@example.com', password: 'brand-new-pass', password_confirmation: 'brand-new-pass' } },
  ]);
});
