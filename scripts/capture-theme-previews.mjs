/**
 * Capture real marketplace preview screenshots for every storefront theme.
 *
 *   node scripts/capture-theme-previews.mjs [--base http://localhost:5173] [--lang en] [theme ...]
 *
 * Uses the locally installed Google Chrome through Playwright (no browser download). Each theme is
 * opened at `${base}/?preview=1&theme=<id>&lang=<lang>&defaults=1` (the theme's own defaults, not the
 * store's saved settings), waited for `data-storefront-ready`, then the 1440×900 viewport is saved to
 * public/media/theme-previews/<id>.jpg.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const base = opt('--base', 'http://localhost:5173');
const lang = opt('--lang', 'en');
const ids = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--base' && args[i - 1] !== '--lang');
const THEMES = ids.length ? ids : ['luxury-fashion', 'voltage', 'hearth', 'rouge', 'naseem', 'bazaar', 'sahra', 'fresh', 'techno'];
const outDir = path.resolve('public/media/theme-previews');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
// Reduced motion keeps carousels on their first slide (the library pauses autoplay under it).
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: lang === 'ar' ? 'ar-SA' : 'en-US' });
for (const id of THEMES) {
  const page = await context.newPage();
  const url = `${base}/?preview=1&theme=${id}&lang=${lang}&defaults=1`;
  try {
    // Countdown timers / analytics can keep the network busy; fall back to `load` when idle never comes.
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 25_000 });
    } catch {
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    }
    await page.waitForSelector('[data-storefront-ready="true"]', { timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    // Let lazy hero images and carousels settle.
    await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      const imgs = [...document.images].filter((i) => !i.complete);
      await Promise.all(imgs.map((i) => new Promise((r) => { i.onload = r; i.onerror = r; setTimeout(r, 4000); })));
    });
    await page.waitForTimeout(400);
    const file = path.join(outDir, `${id}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 86, fullPage: false });
    console.log(`✓ ${id} → ${path.relative(process.cwd(), file)}`);
  } catch (e) {
    console.error(`✗ ${id}: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await page.close();
  }
}
await browser.close();
