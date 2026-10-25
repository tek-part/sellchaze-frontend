import { expect, test, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Article = { id: number; slug: string; draft: Record<string, Record<string, string | null>>; status: string; version: number; publish_at: string | null; is_live: boolean; has_unpublished_changes: boolean; updated_at: string };

// Every merchant API call is intercepted: these tests never reach a real store or account.
async function workspace(page: Page, locale: 'ar' | 'en') {
  const blank = { excerpt: null, body: null, image: null, seo_title: null, seo_description: null, date: null };
  const articles: Article[] = [
    { id: 1, slug: 'summer-care', draft: { en: { title: 'Summer care guide', ...blank, body: '<p>Stay cool.</p>' }, ar: { title: 'دليل العناية في الصيف', ...blank } }, status: 'published', version: 3, publish_at: '2026-10-01T10:00:00Z', is_live: true, has_unpublished_changes: true, updated_at: '2026-10-20T10:00:00Z' },
    { id: 2, slug: 'new-arrivals', draft: { en: { title: 'New arrivals', ...blank }, ar: { title: 'وصل حديثًا', ...blank } }, status: 'draft', version: 1, publish_at: null, is_live: false, has_unpublished_changes: true, updated_at: '2026-10-19T10:00:00Z' },
  ];
  const listQueries: Array<Record<string, string>> = [];
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  const state = { conflict: false };
  await page.addInitScript(language => {
    localStorage.setItem('sellchase_access_token', 'isolated-articles-fixture');
    localStorage.setItem('sellchase_locale', language);
    localStorage.setItem('sellchaze_workspace_appearance', 'light');
  }, locale);
  await page.route('**/api/v1/**', async route => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.replace('/api/v1', '');
    const headers = { 'Access-Control-Allow-Origin': req.headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const now = '2026-10-26T09:00:00Z';
    if (req.method() !== 'GET') {
      expect(path).toMatch(/^\/my-store\/articles(\/\d+(\/(publish|unpublish|archive|preview))?)?$/);
      const body = (req.postDataJSON() ?? {}) as Record<string, unknown>;
      writes.push({ path, body });
      if (path === '/my-store/articles') {
        const created: Article = { id: 99, slug: String(body.slug), draft: body.draft as Article['draft'], status: 'draft', version: 1, publish_at: null, is_live: false, has_unpublished_changes: true, updated_at: now };
        articles.unshift(created);
        return route.fulfill({ status: 201, json: { data: created }, headers });
      }
      const id = Number(path.split('/')[3]); const action = path.split('/')[4]; const row = articles.find(article => article.id === id)!;
      if (state.conflict) return route.fulfill({ status: 409, json: { message: 'This article changed in another session. Reload before saving.' }, headers });
      if (action === 'preview') return route.fulfill({ json: { preview_url: 'about:blank', expires_in: 1800 }, headers });
      expect(body.version).toBe(row.version);
      Object.assign(row, action === 'publish' ? { status: 'published', publish_at: now, is_live: true, has_unpublished_changes: false } : action ? {} : { slug: body.slug, draft: body.draft, has_unpublished_changes: true }, { version: row.version + 1, updated_at: now });
      return route.fulfill({ json: { data: row }, headers });
    }
    if (path === '/auth/me') return route.fulfill({ json: { user: { id: 1, name: 'Isolated articles fixture', roles: ['Merchant'], permissions: [], is_active: true } }, headers });
    if (path === '/my-store') return route.fulfill({ json: { data: { id: 1, owner_user_id: 1, name: 'Local articles fixture', slug: 'fixture', status: 'active', currency: 'USD', default_locale: 'en', supported_locales: ['en', 'ar'] } }, headers });
    if (path === '/my-store/articles') {
      const query = Object.fromEntries(url.searchParams.entries()); listQueries.push(query);
      const rows = articles.filter(article => !query.status || article.status === query.status)
        .map(article => ({ ...article, draft: Object.fromEntries(Object.entries(article.draft).map(([code, row]) => [code, { title: row.title, image: row.image }])) }));
      return route.fulfill({ json: { data: rows, current_page: 1, last_page: 1, per_page: Number(query.per_page ?? 20), total: rows.length, legacy_count: 0 }, headers });
    }
    const match = path.match(/^\/my-store\/articles\/(\d+)$/);
    if (match) return route.fulfill({ json: { data: articles.find(article => article.id === Number(match[1])) }, headers });
    return route.fulfill({ json: { data: [], unread_count: 0 }, headers });
  });
  return { listQueries, writes, state };
}

const words = {
  ar: { published: 'منشور', save: 'حفظ المسودة', publish: 'نشر', title: 'العنوان', excerpt: 'الملخص', saved: 'تم حفظ المسودة.', live: 'تم نشر المقال في متجرك.', conflict: 'تم تعديل هذا المقال في جلسة أخرى', reload: 'إعادة تحميل المقال', empty: 'اكتب أول مقال', english: 'الإنجليزية', arabic: 'العربية' },
  en: { published: 'Published', save: 'Save draft', publish: 'Publish', title: 'Title', excerpt: 'Excerpt', saved: 'Draft saved.', live: 'Post published on your store.', conflict: 'This post was changed in another session', reload: 'Reload post', empty: 'Write your first post', english: 'English', arabic: 'Arabic' },
};

async function seriousViolations(page: Page, selector: string) {
  const results = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return results.violations.filter(violation => ['serious', 'critical'].includes(violation.impact ?? '')).map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(' ')).join(', ')}`);
}

for (const locale of ['ar', 'en'] as const) {
  const w = words[locale];

  test(`Blog post list shows rows and filters by status in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/articles');
    await expect(page.getByRole('link', { name: locale === 'ar' ? 'دليل العناية في الصيف' : 'Summer care guide', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: locale === 'ar' ? 'وصل حديثًا' : 'New arrivals', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: w.published, exact: true }).click();
    await expect.poll(() => api.listQueries.at(-1)?.status).toBe('published');
    await expect(page.getByRole('link', { name: locale === 'ar' ? 'وصل حديثًا' : 'New arrivals', exact: true })).toHaveCount(0);
    expect(api.writes).toEqual([]);
  });

  test(`A new blog post is created, then published with its version, in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/articles/new');
    await expect(page.getByRole('tab', { name: new RegExp(w.english) })).toHaveAttribute('aria-selected', 'true');
    await page.getByLabel(w.title, { exact: true }).fill('Winter Tips & Tricks');
    await expect(page.locator('#article-slug')).toHaveValue('winter-tips-tricks');
    await page.getByLabel(w.excerpt, { exact: true }).fill('Short summary');
    await page.getByRole('tab', { name: new RegExp(w.arabic) }).click();
    await page.getByLabel(w.title, { exact: true }).fill('نصائح الشتاء');
    await page.getByRole('button', { name: w.save, exact: true }).click();
    await expect(page).toHaveURL(/\/store\/articles\/99$/);
    await expect(page.getByRole('status').filter({ hasText: w.saved })).toBeVisible();
    expect(api.writes[0]).toEqual({ path: '/my-store/articles', body: { slug: 'winter-tips-tricks', draft: {
      en: { title: 'Winter Tips & Tricks', excerpt: 'Short summary', body: null, image: null, seo_title: null, seo_description: null, date: null },
      ar: { title: 'نصائح الشتاء', excerpt: null, body: null, image: null, seo_title: null, seo_description: null, date: null },
    } } });
    await page.getByRole('button', { name: w.publish, exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: w.live })).toBeVisible();
    expect(api.writes[1]).toEqual({ path: '/my-store/articles/99/publish', body: { version: 1 } });
  });

  test(`A save conflict explains how to recover in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.goto('/store/articles/1');
    const title = page.getByLabel(w.title, { exact: true });
    await expect(title).toHaveValue('Summer care guide');
    await title.fill('Summer care guide, updated');
    api.state.conflict = true;
    await page.getByRole('button', { name: w.save, exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(w.conflict);
    await expect(page.getByRole('button', { name: w.save, exact: true })).toBeDisabled();
    api.state.conflict = false;
    await page.getByRole('button', { name: w.reload, exact: true }).click();
    await expect(title).toHaveValue('Summer care guide');
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(api.writes).toEqual([{ path: '/my-store/articles/1', body: expect.objectContaining({ version: 3, slug: 'summer-care' }) }]);
  });

  test(`Blog list and editor are accessible and fit 390px in ${locale}`, async ({ page }) => {
    await workspace(page, locale);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/store/articles');
    await expect(page.locator('.ws-dt-table tbody tr')).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await seriousViolations(page, '.ws-catalog-page')).toEqual([]);
    await page.goto('/store/articles/1');
    await expect(page.getByLabel(w.title, { exact: true })).toHaveValue('Summer care guide');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    expect(await seriousViolations(page, '.store-article-editor')).toEqual([]);
    await page.screenshot({ path: `test-results/store-articles-editor-${locale}-390.png`, fullPage: true });
  });

  test(`An empty blog invites the first post in ${locale}`, async ({ page }) => {
    const api = await workspace(page, locale);
    await page.route(url => url.pathname === '/api/v1/my-store/articles', route => route.fulfill({ json: { data: [], current_page: 1, last_page: 1, total: 0, per_page: 25, legacy_count: 0 }, headers: { 'Access-Control-Allow-Origin': route.request().headers()['origin'] || 'http://127.0.0.1:4183', 'Access-Control-Allow-Credentials': 'true' } }));
    await page.goto('/store/articles');
    await page.getByRole('link', { name: w.empty, exact: true }).click();
    await expect(page).toHaveURL(/\/store\/articles\/new$/);
    expect(api.writes).toEqual([]);
  });
}
