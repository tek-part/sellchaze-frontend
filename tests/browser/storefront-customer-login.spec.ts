import { createHash } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

// G2: WhatsApp-code and Google sign-in on the storefront, and guest order tracking. Synthetic store,
// customer and order; the API is fully mocked — no WhatsApp message is sent and Google is never reached.
const STORE_ID = 7654321;
const CODE = 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C9d0E1f2';

type Locale = 'en' | 'ar';
type Posts = Array<{ path: string; body: Record<string, unknown> }>;

const tracked = {
  number: 'ORD-SYN-0042', status: 'shipped', payment_status: 'pending', fulfillment_status: 'partial', currency: 'USD', placed_at: '2026-10-20T10:00:00Z',
  timeline: [{ status: 'placed', at: '2026-10-20T10:00:00Z' }, { status: 'confirmed', at: '2026-10-20T12:00:00Z' }, { status: 'shipped', at: '2026-10-21T09:00:00Z' }],
  fulfillments: [{ id: 5, status: 'in_transit', carrier: 'aramex', carrier_name: 'Aramex', tracking_number: 'SYN123', tracking_url: 'https://tracking.example/SYN123',
    items: [{ store_order_item_id: 1, name: 'Synthetic linen shirt', variant_name: null, quantity: 1 }], shipped_at: '2026-10-21T09:00:00Z', delivered_at: null }],
  items: [{ id: 1, name: 'Synthetic linen shirt', variant_name: null, quantity: 2, unit_price: '50.00', line_total: '100.00' }],
  subtotal: '100.00', shipping_total: '20.00', discount_total: '10.00', tax_total: '0.00', grand_total: '110.00', refunded_total: '0.00', amount_due: '110.00',
};

async function mockStore(page: Page, locale: Locale, methods: { phone: boolean; google: boolean }): Promise<Posts> {
  const posts: Posts = [];
  let signedIn = false;
  await page.route('https://accounts.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Synthetic Google</title><p>Synthetic consent screen</p>' }));
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/\/$/, '');
    if (path === '/api/v1/storefront') return route.fulfill({ json: { store: { id: STORE_ID, name: 'Synthetic Atelier', slug: 'synthetic-atelier', currency: 'USD', supported_currencies: ['USD'], default_locale: locale, supported_locales: ['en', 'ar'], tracking_enabled: false }, theme: { key: 'naseem', version: '1.0.0', settings: {} }, navigation: { header: [], footer: [] } } });
    if (path === '/api/v1/storefront/auth/methods') return route.fulfill({ json: { data: { email: true, ...methods, phone_country: 'EG', expires_in: 300, resend_in: 60 } } });
    if (path === '/api/v1/storefront/auth/google/start') {
      posts.push({ path, body: { challenge: url.searchParams.get('challenge') } });
      return route.fulfill({ json: { data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=synthetic&state=synthetic' } } });
    }
    if (path === '/api/v1/storefront/account') {
      return signedIn ? route.fulfill({ json: { data: { id: 9, name: 'Nour', email: null, phone: '+201001234567', has_password: false } } }) : route.fulfill({ status: 401, json: { message: 'Unauthenticated.' } });
    }
    if (request.method() === 'POST') {
      const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
      if (path === '/api/v1/storefront/auth/phone/send') {
        posts.push({ path, body });
        return route.fulfill({ json: { data: { state: 'sent', phone: '+201001234567', expires_at: new Date(Date.now() + 300_000).toISOString(), resend_at: new Date(Date.now() + 60_000).toISOString() } } });
      }
      if (path === '/api/v1/storefront/auth/phone/verify') {
        posts.push({ path, body });
        if (body.code === '000000') return route.fulfill({ status: 422, json: { message: 'The code is incorrect or expired.', errors: { code: [locale === 'ar' ? 'الرمز غير صحيح أو انتهت صلاحيته.' : 'The code is incorrect or expired.'] } } });
        if (!body.name) return route.fulfill({ json: { data: { status: 'name_required' } } });
        signedIn = true;
        return route.fulfill({ json: { data: { id: 9, name: body.name, email: null, phone: '+201001234567' }, token: 'synthetic-customer-token' } });
      }
      if (path === '/api/v1/storefront/auth/google/exchange') {
        posts.push({ path, body });
        signedIn = true;
        return route.fulfill({ json: { data: { id: 9, name: 'Nour', email: 'nour@example.test' }, token: 'synthetic-google-token' } });
      }
      if (path === '/api/v1/storefront/orders/track') {
        posts.push({ path, body });
        return body.contact === '01001234567' && body.order_number === tracked.number
          ? route.fulfill({ json: { data: tracked } })
          : route.fulfill({ status: 404, json: { message: locale === 'ar' ? 'لم نعثر على طلب بهذه البيانات.' : 'We could not find an order with these details.' } });
      }
      return route.fulfill({ json: { message: 'ok' } });
    }
    return route.fulfill({ json: { data: [] } });
  });
  return posts;
}

async function healthy(page: Page, include: string): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
}

const copy = {
  en: { whatsapp: 'Sign in with WhatsApp', google: 'Continue with Google', number: 'WhatsApp number', send: 'Send code', code: 'Code', signIn: 'Sign in', name: 'Full name', create: 'Create account',
    welcome: 'Welcome! What should we call you?', wrong: 'The code is incorrect or expired.', track: 'Track your order', orderNo: 'Order number', contact: 'Phone or email', submit: 'Track order',
    notFound: 'We could not find an order with these details.', shipped: 'Shipped', confirmed: 'Confirmed', placed: 'Order placed', tracking: 'Track shipment', total: 'Total', setPassword: 'Set a password' },
  ar: { whatsapp: 'الدخول عبر واتساب', google: 'المتابعة باستخدام جوجل', number: 'رقم واتساب', send: 'أرسل الرمز', code: 'الرمز', signIn: 'تسجيل الدخول', name: 'الاسم الكامل', create: 'إنشاء الحساب',
    welcome: 'أهلًا بك! بماذا نناديك؟', wrong: 'الرمز غير صحيح أو انتهت صلاحيته.', track: 'تتبّع طلبك', orderNo: 'رقم الطلب', contact: 'الهاتف أو البريد الإلكتروني', submit: 'تتبّع الطلب',
    notFound: 'لم نعثر على طلب بهذه البيانات.', shipped: 'تم الشحن', confirmed: 'تم التأكيد', placed: 'تم استلام الطلب', tracking: 'تتبع الشحنة', total: 'الإجمالي', setPassword: 'تعيين كلمة مرور' },
};

for (const locale of ['en', 'ar'] as const) {
  const c = copy[locale];

  test(`new customer signs up with a WhatsApp code (${locale})`, async ({ page }) => {
    const posts = await mockStore(page, locale, { phone: true, google: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/login?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('button', { name: c.google })).toHaveCount(0);
    await page.getByRole('button', { name: c.whatsapp }).click();
    const panel = page.locator('.sf-auth-phone');
    await panel.getByLabel(c.number).fill('٠١٠٠١٢٣٤٥٦٧');
    await panel.getByRole('button', { name: c.send }).click();
    await expect(panel.getByRole('status')).toContainText('+201001234567');
    await panel.getByLabel(c.code).fill('000000');
    await panel.getByRole('button', { name: c.signIn }).click();
    await expect(panel.getByRole('alert')).toHaveText(c.wrong);
    await panel.getByLabel(c.code).fill('123456');
    await panel.getByRole('button', { name: c.signIn }).click();
    await expect(panel.getByRole('heading', { name: c.welcome })).toBeVisible();
    await healthy(page, '.sf-auth');
    await panel.getByLabel(c.name).fill('Nour');
    await panel.getByRole('button', { name: c.create }).click();
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole('heading', { name: c.setPassword })).toBeVisible();

    const sent = posts.filter((post) => post.path.endsWith('/phone/send'));
    expect(sent).toHaveLength(1);
    expect(sent[0]!.body.phone).toBe('01001234567');
    const token = sent[0]!.body.token as string;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(posts.filter((post) => post.path.endsWith('/phone/verify')).map((post) => post.body)).toEqual([
      { token, code: '000000' }, { token, code: '123456' }, { token, name: 'Nour' },
    ]);
    expect(await page.evaluate(() => localStorage.getItem('sf:auth-token'))).toBe('synthetic-customer-token');
  });

  test(`guest tracks an order with the order number and phone (${locale})`, async ({ page }) => {
    const posts = await mockStore(page, locale, { phone: false, google: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/track?preview=1&theme=naseem&lang=${locale}`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1, name: c.track })).toBeVisible();
    await page.getByLabel(c.orderNo).fill(tracked.number);
    await page.getByLabel(c.contact).fill('01001234568');
    await page.getByRole('button', { name: c.submit }).click();
    await expect(page.getByRole('alert')).toHaveText(c.notFound);
    await healthy(page, '.sf-track');
    await page.getByLabel(c.contact).fill('٠١٠٠١٢٣٤٥٦٧');
    await page.getByRole('button', { name: c.submit }).click();

    const timeline = page.getByTestId('sf-order-timeline');
    await expect(timeline.getByRole('listitem')).toHaveText([new RegExp(c.placed), new RegExp(c.confirmed), new RegExp(c.shipped)]);
    await expect(timeline.locator('[aria-current="step"]')).toContainText(c.shipped);
    await expect(page.getByTestId('sf-shipment')).toContainText('SYN123');
    await expect(page.getByRole('link', { name: /SYN123/ })).toHaveAttribute('href', 'https://tracking.example/SYN123');
    await expect(page.locator('.sf-cart-summary__total')).toContainText(c.total);
    await healthy(page, '.sf-track');
    expect(posts.filter((post) => post.path.endsWith('/orders/track')).map((post) => post.body)).toEqual([
      { order_number: tracked.number, contact: '01001234568' }, { order_number: tracked.number, contact: '01001234567' },
    ]);
  });
}

test('Google sign-in keeps the verifier in the tab and exchanges the returned code', async ({ page }) => {
  const posts = await mockStore(page, 'en', { phone: true, google: true });
  await page.goto('/login?preview=1&theme=naseem&lang=en', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name: copy.en.whatsapp })).toBeVisible();
  await page.getByRole('button', { name: copy.en.google }).click();
  await page.waitForURL(/accounts\.google\.com/);
  // Session storage is per origin: read the verifier back on the storefront tab.
  await page.goBack({ waitUntil: 'networkidle' });
  const attempt = JSON.parse((await page.evaluate(() => sessionStorage.getItem('sf:google-login'))) ?? '{}') as { verifier: string; next: string };
  expect(attempt.verifier).toMatch(/^[A-Za-z0-9]{64}$/);
  expect(attempt.next).toMatch(/^\/account/);
  expect(posts[0]).toEqual({ path: '/api/v1/storefront/auth/google/start', body: { challenge: createHash('sha256').update(attempt.verifier).digest('hex') } });

  await page.goto(`/login/google?preview=1&theme=naseem&lang=en#code=${CODE}`, { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/account/);
  expect(posts.find((post) => post.path.endsWith('/google/exchange'))?.body).toEqual({ code: CODE, verifier: attempt.verifier });
  expect(await page.evaluate(() => sessionStorage.getItem('sf:google-login'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('sf:auth-token'))).toBe('synthetic-google-token');

  // A replayed link in a tab that never started the sign-in is refused without calling the API.
  await page.goto(`/login/google?preview=1&theme=naseem&lang=en#code=${CODE}`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('alert')).toHaveText('This Google sign-in has expired. Please start again.');
  expect(posts.filter((post) => post.path.endsWith('/google/exchange'))).toHaveLength(1);
});

test('login shows only e-mail when the store offers no other method, and explains a failed Google return', async ({ page }) => {
  await mockStore(page, 'en', { phone: false, google: false });
  await page.goto('/login?preview=1&theme=naseem&lang=en&google=failed', { waitUntil: 'networkidle' });
  await expect(page.getByRole('alert')).toHaveText('Google sign-in did not complete. Please try again.');
  await expect(page.getByRole('button', { name: copy.en.whatsapp })).toHaveCount(0);
  await expect(page.getByRole('button', { name: copy.en.google })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Track an order without signing in' })).toHaveAttribute('href', '/track');
});
