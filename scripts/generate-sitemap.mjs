#!/usr/bin/env node
// Generates dist/sitemap.xml after Vite build.
// Dynamically pulls published articles from the API if VITE_API_URL is set.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'dist');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const base = process.env.SITE_URL || 'https://sellchase.com';
const apiUrl = process.env.VITE_API_URL || process.env.SITE_API_URL || '';

const routes = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/features', priority: '0.9', changefreq: 'monthly' },
    { loc: '/about', priority: '0.7', changefreq: 'yearly' },
    { loc: '/blog', priority: '0.9', changefreq: 'weekly' },
    { loc: '/contact', priority: '0.7', changefreq: 'yearly' },
    { loc: '/legal/terms', priority: '0.3', changefreq: 'yearly' },
    { loc: '/legal/privacy', priority: '0.3', changefreq: 'yearly' },
];

async function fetchArticleSlugs() {
    if (!apiUrl) return [];
    try {
        const res = await fetch(`${apiUrl}/public/articles?per_page=1000`, {
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) return [];
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        return list
            .filter((a) => a && a.slug)
            .map((a) => ({
                loc: `/blog/${a.slug}`,
                priority: '0.8',
                changefreq: 'monthly',
                lastmod: a.updated_at ? String(a.updated_at).split('T')[0] : null,
            }));
    } catch (e) {
        console.warn('[sitemap] articles fetch failed:', e.message);
        return [];
    }
}

const today = new Date().toISOString().split('T')[0];
const articles = await fetchArticleSlugs();
const all = [...routes, ...articles];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
    .map(
        (r) => `    <url>
        <loc>${base}${r.loc}</loc>
        <lastmod>${r.lastmod || today}</lastmod>
        <changefreq>${r.changefreq}</changefreq>
        <priority>${r.priority}</priority>
    </url>`,
    )
    .join('\n')}
</urlset>
`;

writeFileSync(resolve(outDir, 'sitemap.xml'), xml, 'utf8');
console.log(`[sitemap] wrote ${all.length} urls (${articles.length} articles) → dist/sitemap.xml`);
