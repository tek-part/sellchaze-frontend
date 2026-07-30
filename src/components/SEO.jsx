import { useEffect } from 'react';

/**
 * SEO head manager. Sets the document title, meta/OG/Twitter tags, canonical link, robots, and a
 * JSON-LD block for the current page.
 *
 * Implemented imperatively (direct <head> DOM updates in an effect) rather than via
 * react-helmet-async, because helmet-async v2 renders nothing under React 19 — so the app's client
 * SEO silently no-op'd. This keeps the exact same props API, so every existing caller works
 * unchanged; it just actually applies now. Tags that already exist in index.html are updated in
 * place (and restored on unmount) so no duplicates are created; tags this component adds are removed
 * on unmount / prop change.
 *
 * For crawlable-at-source SEO (bots that don't run JS), pair this with the planned build-time
 * prerender — this component populates the head the prerenderer snapshots.
 */
export default function SEO({ title, description, canonical, ogImage, jsonLd, noIndex = false }) {
    useEffect(() => {
        const url = canonical || (typeof window !== 'undefined' ? window.location.href : undefined);
        const image = ogImage || (typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '/logo.png');
        const head = document.head;
        const cleanups = [];

        // Title (remember + restore).
        if (title) {
            const prev = document.title;
            document.title = title;
            cleanups.push(() => { document.title = prev; });
        }

        /** Upsert a <meta>/<link> by a unique selector; update-in-place or create+track for removal. */
        const upsert = (selector, tagName, attrs) => {
            let el = head.querySelector(selector);
            if (el) {
                const prev = {};
                for (const [k, v] of Object.entries(attrs)) {
                    prev[k] = el.getAttribute(k);
                    el.setAttribute(k, v);
                }
                cleanups.push(() => {
                    for (const [k, v] of Object.entries(prev)) {
                        if (v === null) el.removeAttribute(k); else el.setAttribute(k, v);
                    }
                });
            } else {
                el = document.createElement(tagName);
                for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
                head.appendChild(el);
                cleanups.push(() => el.remove());
            }
        };

        if (description) {
            upsert('meta[name="description"]', 'meta', { name: 'description', content: description });
        }
        upsert('meta[name="robots"]', 'meta', { name: 'robots', content: noIndex ? 'noindex, nofollow' : 'index, follow' });
        if (url) {
            upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
        }

        // Open Graph + Twitter.
        if (title) upsert('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
        if (description) upsert('meta[property="og:description"]', 'meta', { property: 'og:description', content: description });
        upsert('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'website' });
        if (url) upsert('meta[property="og:url"]', 'meta', { property: 'og:url', content: url });
        upsert('meta[property="og:image"]', 'meta', { property: 'og:image', content: image });
        upsert('meta[name="twitter:card"]', 'meta', { name: 'twitter:card', content: 'summary_large_image' });
        if (title) upsert('meta[name="twitter:title"]', 'meta', { name: 'twitter:title', content: title });
        if (description) upsert('meta[name="twitter:description"]', 'meta', { name: 'twitter:description', content: description });
        upsert('meta[name="twitter:image"]', 'meta', { name: 'twitter:image', content: image });

        // JSON-LD structured data (always freshly created + removed for this instance).
        if (jsonLd) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo-jsonld', '');
            script.textContent = JSON.stringify(jsonLd);
            head.appendChild(script);
            cleanups.push(() => script.remove());
        }

        return () => { for (const fn of cleanups.reverse()) fn(); };
    }, [title, description, canonical, ogImage, noIndex, JSON.stringify(jsonLd ?? null)]);

    return null;
}
