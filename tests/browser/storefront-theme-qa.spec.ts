import axeCore from 'axe-core';
import { expect, test, type Page } from 'playwright/test';

/**
 * Theme QA audit — every storefront theme × {ar, en} × {1440, 390} walks every customer-facing
 * template in preview mode (demo data, no store API) and checks the basics a shopper relies on:
 * no runtime errors, no sideways scrolling, a page heading, described images, no serious axe
 * findings inside <main>, correct document direction, reachable header navigation / currency /
 * language controls, no dead internal links, add-to-cart updating the cart count and search
 * returning results.
 *
 * One page per theme+locale: the app boots once and every template is reached through the router
 * (history.pushState + popstate), so a full theme sweep costs one bundle load per locale. The API is
 * unreachable (as on the dashboard's preview host) and every off-origin request is answered locally,
 * so no real network is used.
 */

const THEMES = ['bazaar', 'blast-pets', 'elite-furniture', 'elite-wallets', 'fresh', 'glow', 'hype-fashion', 'hype-perfumes', 'karat', 'maison', 'naseem', 'nature-kids', 'nature-pets', 'pure-furniture', 'sahra', 'sphinx-v3', 'stride', 'techno'] as const;
type Theme = typeof THEMES[number];
type Locale = 'ar' | 'en';
const WIDTHS = [1440, 390] as const;

/**
 * Checks that do not apply to a theme by design. Each entry is reported as a skip annotation on the
 * test so the gap stays visible instead of silently passing. (Kept empty when every theme supports
 * every template — add `{ theme: { check: 'reason' } }` rather than weakening a check.)
 */
const NOT_APPLICABLE: Partial<Record<Theme, Partial<Record<string, string>>>> = {};

/** Internal link targets the route table (pages/AppRoutes.tsx) serves without the catch-all 404. */
const ROUTES = [
  /^\/$/,
  /^\/(shop|collections|categories|brands|search|cart|checkout|wishlist|login|register|forgot-password|reset-password|account|about|contact|faq|blog)$/,
  /^\/account\/(orders|addresses)$/,
  /^\/account\/orders\/[^/]+$/,
  // Catalogue/journal slugs resolve against store data (demo data in previews).
  /^\/(products|collections|blog|funnels|ab|invoices)\/[^/]+$/,
];
/** Content slugs that may or may not exist: each one is opened to prove it is not a dead end. */
const CONTENT_ROUTE = /^\/(pages|policies)\/[^/]+$/;

const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const CART_LINES = [
  { id: 'qa-line-1', productId: '9001', title: 'QA sample item', url: '/products/qa-sample-item', price: 120, currency: 'USD', quantity: 2 },
];

interface PageReport {
  overflow: number;
  dir: string;
  lang: string;
  hasMain: boolean;
  h1: string[];
  imagesWithoutAlt: string[];
  wrongArrows: string[];
}

async function isolate(page: Page, errors: string[]): Promise<void> {
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const url = message.location()?.url ?? '';
    // Requests the audit deliberately answers locally (the unreachable store API) log a load failure.
    if (/Failed to load resource/.test(message.text()) && (/\/api\/v1\//.test(url) || !url.startsWith('http://127.0.0.1'))) return;
    errors.push(`console: ${message.text()}${url ? ` (${url})` : ''}`);
  });
  // The dashboard preview host has no store API: demo data renders instead.
  await page.route('**/api/v1/**', (route) => route.abort());
  // No real network: off-origin images get a 1px PNG, stylesheets (web fonts) an empty sheet.
  await page.route((url) => url.hostname !== '127.0.0.1', (route) => {
    const type = route.request().resourceType();
    if (type === 'image') return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1PX });
    if (type === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (type === 'font') return route.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
    return route.abort();
  });
  await page.addInitScript((lines) => {
    if (window.top !== window) return; // embedded frames (maps, video) may not have storage
    // Seed the preview store's cart in every display currency a theme preview may start in.
    for (const currency of ['USD', 'EGP', 'SAR']) {
      const key = `sf-cart-v2:dev:${currency}`;
      if (!window.localStorage.getItem(key)) window.localStorage.setItem(key, JSON.stringify({ version: 2, storeId: 'dev', currency, lines: lines.map((line) => ({ ...line, currency })) }));
    }
  }, CART_LINES);
}

/** Client-side navigation through the storefront router, keeping the preview session params. */
async function visit(page: Page, path: string): Promise<void> {
  await page.evaluate((target) => {
    // Mark the outgoing page so settle() waits for the new route instead of measuring the old one.
    for (const el of document.querySelectorAll('main, main *')) el.setAttribute('data-qa-stale', '');
    const [pathname, query = ''] = target.split('?');
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of new URLSearchParams(query)) params.set(key, value);
    if (!new URLSearchParams(query).has('q')) params.delete('q');
    (window as unknown as { __qaNav: number }).__qaNav = performance.now();
    window.history.pushState({}, '', `${pathname}?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await settle(page);
}

async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    if (!main || document.querySelector('main [aria-busy="true"]')) return false;
    // A heading (or any new content) rendered by the new route, not the outgoing one.
    const since = performance.now() - ((window as unknown as { __qaNav?: number }).__qaNav ?? 0);
    return Boolean(document.querySelector('main h1:not([data-qa-stale])')) || (since > 1_500 && Boolean(main.querySelector(':not([data-qa-stale])')));
  }, undefined, { timeout: 4_000, polling: 'raf' }).catch(() => undefined);
  // Let lazily mounted sections and images paint before measuring.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function inspect(page: Page, locale: Locale): Promise<PageReport> {
  return page.evaluate((loc) => {
    const visible = (el: Element): boolean => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const hidden = (el: Element): boolean => Boolean(el.closest('[aria-hidden="true"], [role="presentation"], [role="none"], [hidden]'));
    const root = document.documentElement;
    const imagesWithoutAlt = [...document.querySelectorAll('img')]
      .filter((img) => !img.hasAttribute('alt') && !hidden(img))
      .map((img) => (img.getAttribute('src') ?? '').slice(0, 80));
    // A forward arrow in a call to action must point along the reading direction. Glyphs mirrored
    // with a CSS transform count as mirrored (inline boxes ignore transforms, so they do not).
    const back = /back|return|previous|رجوع|العودة|عودة|السابق/i;
    const forward = loc === 'ar' ? -1 : 1;
    const mirrored = (from: Element, stop: Element): number => {
      let sign = 1;
      for (let el: Element | null = from; el; el = el === stop ? null : el.parentElement) {
        const style = getComputedStyle(el);
        if (style.display === 'inline' || style.transform === 'none') continue;
        if (new DOMMatrixReadOnly(style.transform).a < 0) sign = -sign;
      }
      return sign;
    };
    const wrongArrows: string[] = [];
    for (const control of document.querySelectorAll('a, button')) {
      if (!visible(control) || back.test(`${control.textContent} ${control.getAttribute('aria-label') ?? ''}`)) continue;
      const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? '';
        const glyph = text.includes('→') ? 1 : text.includes('←') ? -1 : 0;
        if (!glyph || !node.parentElement) continue;
        if (glyph * mirrored(node.parentElement, control) !== forward) wrongArrows.push((control.textContent ?? '').trim().slice(0, 60));
      }
    }
    return {
      overflow: Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth,
      dir: root.getAttribute('dir') ?? '',
      lang: root.getAttribute('lang') ?? '',
      hasMain: Boolean(document.querySelector('main')),
      h1: [...document.querySelectorAll('h1')].map((h) => (h.textContent ?? '').trim()).filter(Boolean),
      imagesWithoutAlt,
      wrongArrows,
    };
  }, locale);
}

/**
 * axe (wcag2a/aa) inside <main>, serious and critical only. axe is injected once per document and
 * reused across router navigations — re-injecting it for every template (as AxeBuilder does) costs
 * more than the audit itself.
 */
async function axeMain(page: Page): Promise<string[]> {
  if (!(await page.evaluate(() => 'axe' in window))) await page.evaluate(axeCore.source);
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: typeof import('axe-core') }).axe;
    const results = await axe.run({ include: [['main']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, resultTypes: ['violations'] });
    return results.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.slice(0, 4).map((n) => {
        // Colour pairs make contrast findings actionable straight from the CI log.
        const data = n.any[0]?.data as { fgColor?: string; bgColor?: string; contrastRatio?: number } | undefined;
        return `${n.target.join(' ')}${data?.fgColor ? ` (${data.fgColor} on ${data.bgColor} = ${data.contrastRatio})` : ''}`;
      }).join(' | ')}`);
  });
}

const MENU = /^(open )?(menu|main menu|navigation|more)$|^(افتح|فتح) القائمة|^القائمة|^المزيد$/i;
const LANGUAGE = /language|اللغة|^english$|^العربية$|^en$|^ar$|^ع$|^عربي$/i;

/** Header navigation, currency and language reachability: inline on desktop, via the menu on phones. */
async function headerControls(page: Page, width: number): Promise<string[]> {
  const issues: string[] = [];
  const state = () => page.evaluate((patterns) => {
    const language = new RegExp(patterns.language, 'i');
    const visible = (el: Element): boolean => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0;
    };
    // Inside a closed disclosure (a "More" <details>) a control is one click away: reachable.
    const reachable = (el: Element): boolean => visible(el) || Boolean(el.closest('details')?.querySelector(':scope > summary') && visible(el.closest('details')!.querySelector(':scope > summary')!));
    // Header chrome: the header itself, announcement/top bars, an open menu drawer and a phone tab bar.
    const scopes = [...document.querySelectorAll('header, [role="dialog"], [aria-modal="true"], [class*="announcement"], [class*="topbar"], nav')]
      .filter((scope) => !scope.closest('footer, main') || scope.matches('[role="dialog"], [aria-modal="true"]'));
    const within = (selector: string) => [...new Set(scopes.flatMap((scope) => [...scope.querySelectorAll(selector)]))].filter(reachable);
    const navLinks = within('nav a[href]').length;
    const currency = within('.sf-currency').length;
    const lang = within('button, a, select').filter((el) => {
      const name = `${el.getAttribute('aria-label') ?? ''}`.trim() || (el.textContent ?? '').trim();
      return language.test(name) || language.test((el.textContent ?? '').trim());
    }).length;
    return { navLinks, currency, lang };
  }, { language: LANGUAGE.source });

  let found = await state();
  let openedMenu = false;
  if (found.navLinks === 0 || found.currency === 0 || found.lang === 0) {
    const menu = page.getByRole('button', { name: MENU }).filter({ visible: true }).first();
    if (await menu.count()) {
      await menu.click();
      openedMenu = true;
      await page.locator('[role="dialog"], [aria-modal="true"]').filter({ visible: true }).first().waitFor({ timeout: 1_500 }).catch(() => undefined);
      await page.waitForTimeout(100);
      const inside = await state();
      found = { navLinks: Math.max(found.navLinks, inside.navLinks), currency: Math.max(found.currency, inside.currency), lang: Math.max(found.lang, inside.lang) };
    } else if (width < 768) {
      issues.push('no visible menu button on a phone');
    }
  }
  if (!found.navLinks) issues.push('header navigation links not reachable');
  if (!found.currency) issues.push('currency switcher not reachable');
  if (!found.lang) issues.push('language switcher not reachable');
  // Closed without waiting for the exit animation: the phone pass checks the header last.
  if (openedMenu) await page.keyboard.press('Escape');
  return issues;
}

/** Cart count shown in the header (aria-label "Cart (2)", a badge, …). */
async function cartCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const cart = /cart|bag|basket|السلة|سلة|الحقيبة|حقيبة|عربة/i;
    const candidates = [...document.querySelectorAll('header a, header button')]
      .filter((el) => cart.test(`${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''} ${el.getAttribute('href') ?? ''}`));
    const digits = (text: string): string => text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    let best = 0;
    for (const el of candidates) {
      // The count is in the accessible name ("Cart (2)") or a badge holding only digits — never a price.
      const label = digits(el.getAttribute('aria-label') ?? '').match(/\d+/);
      const badges = [...el.querySelectorAll('*')].map((node) => digits((node.textContent ?? '').trim())).filter((text) => /^\d+$/.test(text));
      for (const n of [...(label ? [label[0]] : []), ...badges]) best = Math.max(best, Number(n));
    }
    return best;
  });
}

function storedCartQuantity(page: Page): Promise<number> {
  return page.evaluate(() => {
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i) ?? '';
      if (!key.startsWith('sf-cart-v2:')) continue;
      try {
        const cart = JSON.parse(window.localStorage.getItem(key) ?? '{}') as { lines?: Array<{ quantity?: number }> };
        total = Math.max(total, (cart.lines ?? []).reduce((sum, line) => sum + (line.quantity ?? 0), 0));
      } catch { /* ignore malformed */ }
    }
    return total;
  });
}

/** Same-origin link paths on the current page (query and hash dropped). */
function internalLinks(page: Page): Promise<string[]> {
  return page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="/"]:not([href^="//"])')]
    .map((a) => (a.getAttribute('href') ?? '').split(/[?#]/)[0]!.replace(/(.)\/$/, '$1')))]);
}

test.describe.configure({ mode: 'parallel' });

for (const theme of THEMES) {
  for (const locale of ['ar', 'en'] as const) {
    test(`${theme} (${locale}): every template passes the theme QA audit at ${WIDTHS.join(' and ')}px`, async ({ page }, info) => {
      test.setTimeout(150_000);
      const errors: string[] = [];
      const issues: string[] = [];
      const skipped = NOT_APPLICABLE[theme] ?? {};
      for (const [check, reason] of Object.entries(skipped)) info.annotations.push({ type: 'skip', description: `${check}: ${reason}` });
      await isolate(page, errors);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: WIDTHS[0], height: 900 });
      await page.goto(`/?preview=1&theme=${theme}&lang=${locale}`);
      await settle(page);

      // Products, articles and the search term come from the theme's own pages as the sweep reaches
      // them; the not-found page goes first so every other template can be checked against it.
      let notFoundTitles = new Set<string>();
      let productPath = '/products/demo';
      let articlePath: string | undefined;
      let term = '';
      const links = new Map<string, string>(); // link path → first template it appeared on
      const firstHref = async (prefix: string): Promise<string | undefined> => (await page.locator(`main a[href^="${prefix}"]`).first().getAttribute('href', { timeout: 1_000 }).catch(() => null))?.split('?')[0];
      const templates: Array<{ name: string; path: () => string | undefined; after?: () => Promise<void> }> = [
        { name: '404', path: () => '/qa-no-such-page', after: async () => { notFoundTitles = new Set([...(await page.locator('main h1').allTextContents()).map((t) => t.trim()).filter(Boolean), 'Page not found', 'الصفحة غير موجودة']); } },
        { name: 'home', path: () => '/' },
        { name: 'shop', path: () => '/shop', after: async () => { productPath = (await firstHref('/products/')) ?? productPath; } },
        { name: 'collections', path: () => '/collections' },
        { name: 'product', path: () => productPath, after: async () => {
          const title = ((await page.locator('main h1').first().textContent({ timeout: 1_000 }).catch(() => '')) ?? '').trim();
          term = title.split(/\s+/).find((word) => word.length >= 3) ?? title.slice(0, 4);
        } },
        { name: 'search', path: () => `/search?q=${encodeURIComponent(term)}` },
        { name: 'cart', path: () => '/cart' },
        { name: 'checkout', path: () => '/checkout' },
        { name: 'login', path: () => '/login' },
        { name: 'register', path: () => '/register' },
        { name: 'wishlist', path: () => '/wishlist' },
        { name: 'blog', path: () => '/blog', after: async () => { articlePath = articlePath ?? await firstHref('/blog/'); } },
        { name: 'article', path: () => articlePath },
        { name: 'about', path: () => '/about' },
        { name: 'contact', path: () => '/contact' },
        { name: 'faq', path: () => '/faq' },
        { name: 'policy', path: () => '/pages/returns' },
      ];

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        // On phones the home page (with its menu drawer) goes last, so the drawer's exit animation
        // overlaps the link checks below instead of delaying the next template.
        const order = width === WIDTHS[0] ? templates : [...templates.filter((t) => t.name !== 'home'), ...templates.filter((t) => t.name === 'home')];
        for (const template of order) {
          if (skipped[template.name]) continue;
          const tag = `[${width} ${template.name}]`;
          const path = template.path();
          if (!path) { issues.push(`${tag} no link to this template was found`); continue; }
          const before = errors.length;
          await visit(page, path);
          const report = await inspect(page, locale);
          if (report.overflow > 1) issues.push(`${tag} horizontal overflow of ${report.overflow}px`);
          if (report.dir !== (locale === 'ar' ? 'rtl' : 'ltr')) issues.push(`${tag} <html dir="${report.dir}">`);
          if (!report.lang.startsWith(locale)) issues.push(`${tag} <html lang="${report.lang}">`);
          if (!report.hasMain) issues.push(`${tag} no <main> landmark`);
          if (report.h1.length === 0) issues.push(`${tag} no <h1>`);
          if (template.name !== '404' && report.h1.some((h) => notFoundTitles.has(h))) issues.push(`${tag} rendered the not-found state`);
          for (const src of report.imagesWithoutAlt) issues.push(`${tag} <img> without alt: ${src}`);
          for (const text of report.wrongArrows) issues.push(`${tag} arrow points against the reading direction: "${text}"`);
          if (template.name === 'search' && !(await page.locator('main a[href^="/products/"]').count())) issues.push(`${tag} search for "${term}" returned no products`);
          if (template.name === 'cart' && !(await page.locator('main').getByText('QA sample item').count())) issues.push(`${tag} seeded cart line is not listed`);
          // Colours and labels do not change with the viewport: one axe pass per template and
          // locale, plus the phone home page whose chrome differs.
          if (width === WIDTHS[0] || template.name === 'home') {
            for (const violation of await axeMain(page)) issues.push(`${tag} axe ${violation}`);
          }
          if (template.name === 'home' && !skipped.header) {
            for (const problem of await headerControls(page, width)) issues.push(`${tag} ${problem}`);
          }
          if (width === WIDTHS[0]) {
            for (const link of await internalLinks(page)) if (!links.has(link)) links.set(link, template.name);
            await template.after?.();
          }
          for (const error of errors.slice(before)) issues.push(`${tag} ${error}`);
        }
      }

      // No dead links: every internal link targets a real route, and content pages it names exist.
      await page.setViewportSize({ width: WIDTHS[0], height: 900 });
      for (const [link, from] of links) {
        if (CONTENT_ROUTE.test(link)) {
          await visit(page, link);
          const h1 = (await page.locator('main h1').allTextContents()).map((t) => t.trim());
          if (!h1.length || h1.some((h) => notFoundTitles.has(h))) issues.push(`[${from}] link to ${link} opens a not-found page`);
        } else if (!ROUTES.some((route) => route.test(link))) {
          issues.push(`[${from}] link to ${link} matches no storefront route`);
        }
      }

      // Add to cart from the product page updates the header cart count (seeded cart: 2 items). Last,
      // so its confirmation toast cannot cover the phone menu.
      if (!skipped['add-to-cart']) {
        await page.locator('[role="dialog"], [aria-modal="true"]').filter({ visible: true }).first().waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => undefined);
        await visit(page, productPath);
        const storedBefore = await storedCartQuantity(page);
        const countBefore = await cartCount(page);
        // The product's own purchase button, not a related-product quick add or the wishlist toggle.
        const add = page.locator('main').getByRole('button', { name: /^add to (cart|bag|basket)|^add$|^أضف (إلى|الى) (السلة|الحقيبة)|^أضف للسلة|^أضف$/i }).filter({ visible: true }).first();
        if (!(await add.count())) issues.push('[product] no visible add-to-cart button');
        else {
          await add.click();
          await expect.poll(() => storedCartQuantity(page), { timeout: 4_000 }).toBeGreaterThan(storedBefore).catch(() => issues.push('[product] add to cart did not add a line'));
          await page.keyboard.press('Escape');
          await expect.poll(() => cartCount(page), { timeout: 4_000 }).toBeGreaterThan(countBefore).catch(() => issues.push(`[product] header cart count did not update after add to cart (was ${countBefore})`));
        }
      }

      expect(issues, issues.join('\n')).toEqual([]);
    });
  }
}
