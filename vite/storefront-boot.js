import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Storefront first-view boot script (build only).
 *
 * Without it a store's first view is a serial waterfall: entry JS → bootstrap API request → the
 * active theme's chunks → the route's page chunk → images. This plugin inlines a tiny script into
 * storefront.html that, while the entry JS is still downloading:
 *
 *   1. starts the bootstrap read (`GET {api}/storefront?lang=…`) and the current route's data reads
 *      (home: `/home`, `/layout?template=home`; product: `/products/{slug}`), parked on
 *      `window.__sfEarly[url]`; `api/client.ts`
 *      adopts one only when the URL matches exactly the one it would have requested, so a mismatch
 *      simply costs one extra request;
 *   2. modulepreloads the current route's page chunk (home, product, collection, cart, checkout);
 *   3. modulepreloads the active theme's chunks as soon as the bootstrap names the theme.
 *
 * Signed previews and the customizer keep the old path: they carry tokens and query state the
 * script does not reproduce.
 */
const LOADERS = fileURLToPath(new URL('../src/apps/storefront/platform/catalog/loaders.ts', import.meta.url));
const ALIASES = fileURLToPath(new URL('../src/apps/storefront/theme-resolution.ts', import.meta.url));
const I18N = fileURLToPath(new URL('../src/apps/storefront/i18n/index.ts', import.meta.url));

/**
 * [path pattern, page module, storefront API reads the page always makes on first render]. `$1` in
 * a read is the pattern's first capture, re-encoded the way the page's API call encodes it.
 */
const ROUTES = [
  ['^/$', 'pages/HomePage.tsx', ['/home', '/layout?template=home']],
  ['^/products/([^/]+)/?$', 'pages/ProductPage.tsx', ['/products/$1']],
  ['^/(shop|collections/[^/]+|categories/[^/]+)/?$', 'pages/CategoryPage.tsx'],
  ['^/cart/?$', 'pages/CartPage.tsx'],
  ['^/checkout/?$', 'pages/CheckoutPage.tsx'],
];

function themeDirectories() {
  const source = readFileSync(LOADERS, 'utf8');
  const map = {};
  for (const match of source.matchAll(/'?([\w-]+)'?:\s*\(\)\s*=>\s*import\('\.\.\/\.\.\/themes\/([\w-]+)'\)/g)) map[match[1]] = match[2];
  return map;
}

function legacyAliases() {
  const block = readFileSync(ALIASES, 'utf8').match(/LEGACY_THEME_ALIASES[^{]*\{([^}]*)\}/)?.[1] ?? '';
  const map = {};
  for (const match of block.matchAll(/'?([\w-]+)'?:\s*'([\w-]+)'/g)) map[match[1]] = match[2];
  return map;
}

function locales() {
  const source = readFileSync(I18N, 'utf8');
  const supported = [...(source.match(/SUPPORTED_LOCALES = \[([^\]]*)\]/)?.[1] ?? "'en'").matchAll(/'([\w-]+)'/g)].map(m => m[1]);
  const fallback = source.match(/DEFAULT_LOCALE: Locale = '([\w-]+)'/)?.[1] ?? supported[0];
  return [fallback, ...supported.filter(locale => locale !== fallback)];
}

/** Every file a chunk needs at load time: itself, its static imports (recursively) and their CSS. */
function closure(bundle, fileName, seen = new Set()) {
  const chunk = bundle[fileName];
  if (!chunk || chunk.type !== 'chunk' || seen.has(fileName)) return seen;
  seen.add(fileName);
  for (const css of chunk.viteMetadata?.importedCss ?? []) seen.add(css);
  for (const dependency of chunk.imports) closure(bundle, dependency, seen);
  return seen;
}

function chunkFor(bundle, moduleSuffix) {
  const chunks = Object.values(bundle).filter(item => item.type === 'chunk');
  return chunks.find(chunk => chunk.facadeModuleId?.endsWith(moduleSuffix))
    ?? chunks.find(chunk => chunk.moduleIds?.some(id => id.endsWith(moduleSuffix)));
}

export function buildBootData(bundle, entryFileName, apiBase) {
  const preloaded = closure(bundle, entryFileName);
  const files = [];
  const index = (file) => {
    let at = files.indexOf(file);
    if (at < 0) at = files.push(file) - 1;
    return at;
  };
  const listFor = (moduleSuffix) => {
    const chunk = chunkFor(bundle, moduleSuffix);
    if (!chunk) return null;
    return [...closure(bundle, chunk.fileName)].filter(file => !preloaded.has(file)).map(index);
  };

  const themes = {};
  for (const [key, directory] of Object.entries(themeDirectories())) {
    const list = listFor(`/src/apps/storefront/themes/${directory}/index.ts`) ?? listFor(`/src/apps/storefront/themes/${directory}/index.tsx`);
    if (list) themes[key] = list;
  }
  const routes = [];
  for (const [pattern, module, reads = []] of ROUTES) {
    const list = listFor(`/src/apps/storefront/${module}`);
    if (list) routes.push([pattern, list, reads]);
  }
  return { f: files, t: themes, a: legacyAliases(), p: routes, l: locales(), api: apiBase };
}

/* Kept ES5-only and defensive: it runs before any polyfill and must never block the real boot. */
const SCRIPT = `(function(M){try{
var d=document,q=new URLSearchParams(location.search),seen={},reads=[];
var s=d.querySelector('link[data-sf-assets]');
var b=s?s.href.slice(0,s.href.lastIndexOf('/assets/')+1):'/';
function pre(list){(list||[]).forEach(function(i){var f=M.f[i];if(seen[f])return;seen[f]=1;var k=d.createElement('link');if(/\\.css$/.test(f)){k.rel='preload';k.as='style'}else{k.rel='modulepreload'}k.crossOrigin='';k.href=b+f;d.head.appendChild(k)})}
function theme(key){key=M.a[key]||key;pre(M.t[key])}
M.p.forEach(function(r){var m=new RegExp(r[0]).exec(location.pathname);if(!m)return;pre(r[1]);
reads=r[2].map(function(x){var v='';try{v=m[1]?encodeURIComponent(decodeURIComponent(m[1])):''}catch(e){return null}return x.replace('$1',v)}).filter(Boolean)});
if(q.get('theme'))theme(q.get('theme'));
if(q.has('__preview')||q.has('preview')||q.has('customize')||q.has('settings')||!window.fetch)return;
var lang=q.get('lang'),token=null;
if(M.l.indexOf(lang)<0){try{lang=localStorage.getItem('sf:locale')}catch(e){lang=null}}
if(M.l.indexOf(lang)<0)lang=(navigator.language||'').slice(0,2).toLowerCase();
if(M.l.indexOf(lang)<0)lang=M.l[0];
try{token=localStorage.getItem('sf:auth-token')}catch(e){}
var h={Accept:'application/json','Accept-Language':lang};if(token)h.Authorization='Bearer '+token;
var E=window.__sfEarly={};
function get(path){var u=M.api+'/storefront'+path+(path.indexOf('?')<0?'?':'&')+'lang='+encodeURIComponent(lang);
var p=E[u]=fetch(u,{credentials:'include',headers:h}).then(function(r){
return r.json().then(function(j){return{status:r.status,body:j}},function(){return{status:r.status,body:null}})});
p.catch(function(){});return p}
get('').then(function(r){if(!q.get('theme')&&r.status===200&&r.body&&r.body.theme)theme(r.body.theme.key)},function(){});
reads.forEach(get);
}catch(e){}})(__DATA__);`;

export function storefrontBoot(apiBase = '/api/v1') {
  return {
    name: 'storefront-boot',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!context.filename.endsWith('storefront.html') || !context.bundle || !context.chunk) return html;
        const data = JSON.stringify(buildBootData(context.bundle, context.chunk.fileName, apiBase)).replace(/</g, '\\u003c');
        // Right after the charset (which must stay in the first 1024 bytes) and before any stylesheet:
        // a classic script waits for every stylesheet above it, so after the CSS links it ran only
        // once they had loaded. The production shell rewrites the `/assets/` href to the asset
        // origin, which is where the script reads its base from.
        const boot = `<link data-sf-assets rel="preconnect" href="/assets/" crossorigin>\n<script>${SCRIPT.replace('__DATA__', () => data)}</script>`;
        const anchor = /<meta\s+charset=[^>]*>/i.test(html) ? /<meta\s+charset=[^>]*>/i : /<head[^>]*>/i;
        return html.replace(anchor, match => `${match}\n${boot}`);
      },
    },
  };
}
