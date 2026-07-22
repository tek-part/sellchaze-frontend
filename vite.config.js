import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/**
 * Dev-only: serve the storefront document for storefront URLs.
 *
 * In production the storefront is the ROOT of a store's own host (the `resolve.store` middleware
 * maps a subdomain or custom domain to a store), so `/about` is unambiguously the storefront's
 * about page and BrowserRouter gives clean, crawlable URLs.
 *
 * Dev has only one origin (localhost:5173) shared with the B2B dashboard, and the dashboard already
 * owns `/`, `/about`, `/blog`, `/contact`, `/products`, `/login` and more. `?preview=1` — which the
 * preview links already carry — is what disambiguates: with it, the request is a theme preview and
 * gets the storefront; without it, the dashboard is served exactly as before.
 *
 * This is the dev shim ONLY. It replaces the old `storefront.html` + hash-routing workaround, and
 * nothing in the application depends on it: on a real store host the storefront is simply the root.
 */
function storefrontPreviewRouting() {
  return {
    name: 'storefront-preview-routing',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next();
        // Only rewrite document navigations. Asset, module and HMR requests must pass through
        // untouched or the page cannot boot.
        const accept = req.headers.accept ?? '';
        if (!accept.includes('text/html')) return next();

        const url = new URL(req.url, 'http://localhost');
        if (url.searchParams.get('preview') === '1') {
          req.url = `/storefront.html${url.search}`;
        }
        return next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const proxyTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000';

    return {
        plugins: [react(), storefrontPreviewRouting()],
        build: {
            rollupOptions: {
                // Three independent HTML entries in one Vite app: the dashboards (index.html →
                // src/main.jsx), the isolated storefront (storefront.html →
                // src/apps/storefront/main.tsx), and the Theme Studio / Multi-Theme Platform
                // (theme-studio.html → src/apps/storefront/platform/studio-main.tsx). Each gets its
                // own CSS bundle, so their design systems never collide.
                input: {
                    main: fileURLToPath(new URL('./index.html', import.meta.url)),
                    storefront: fileURLToPath(new URL('./storefront.html', import.meta.url)),
                    'theme-studio': fileURLToPath(new URL('./theme-studio.html', import.meta.url)),
                },
                output: {
                    // Split heavy, independently-cacheable vendors out of the shared `vendor`
                    // chunk. Crucially, libraries that are ONLY imported by lazy routes (xlsx,
                    // the Quill rich-text editor, chart.js, TipTap) get their own chunks so they
                    // load ON DEMAND — a catch-all `vendor` would merge them with eager libs and
                    // force the whole bundle to load up-front. Each named chunk is also cached
                    // independently across deploys. Pure build-time chunking — no UI/behaviour change.
                    manualChunks(id) {
                        if (!id.includes('node_modules')) return undefined;
                        // Lazy-route-only libraries → their own on-demand chunks.
                        if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
                        if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor';
                        if (id.includes('react-quill') || id.includes('/quill')) return 'vendor-richtext';
                        if (
                            id.includes('/xlsx') ||
                            id.includes('/codepage') ||
                            id.includes('/cfb') ||
                            id.includes('/ssf') ||
                            id.includes('/crc-32')
                        ) {
                            return 'vendor-xlsx';
                        }
                        // Independently-cacheable large libs.
                        if (id.includes('framer-motion')) return 'vendor-motion';
                        if (id.includes('pusher-js') || id.includes('laravel-echo')) return 'vendor-realtime';
                        if (id.includes('react-icons')) return 'vendor-icons';
                        if (id.includes('i18next')) return 'vendor-i18n';
                        // React core + react-router are intentionally left in the shared `vendor`
                        // chunk. Splitting them into a dedicated `vendor-react` chunk creates a
                        // Rollup circular-chunk advisory (react ↔ its transitive runtime helpers
                        // that other `vendor` libs also use). Keeping them together makes `vendor`
                        // a clean dependency root that the lazy/isolated chunks import one-way.
                        return 'vendor';
                    },
                },
                // The three isolated entries are code-split; the remaining >500kB notice is the
                // admin `main` app-code chunk (internal dashboard), tracked in docs/performance.
                chunkSizeWarningLimit: 900,
            },
        },
        server: {
            port: 5173,
            proxy: {
                // The storefront API resolves the tenant store from the Host header
                // (subdomain of the base domain). In dev, set VITE_STOREFRONT_HOST to a
                // seeded store's host (e.g. "demo.sellchze.com") so /api/storefront/* resolves
                // a store; without it the proxy behaves as before for the dashboards.
                '/api': env.VITE_STOREFRONT_HOST
                    ? { target: proxyTarget, changeOrigin: false, headers: { host: env.VITE_STOREFRONT_HOST } }
                    : { target: proxyTarget, changeOrigin: true },
            },
        },
    };
});
