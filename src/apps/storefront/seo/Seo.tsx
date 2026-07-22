/**
 * Seo — per-page document head. Uses React 19's native metadata hoisting (rendering <title>/<meta>/
 * <link> anywhere hoists them to <head>), so no helmet library is needed (react-helmet-async is not
 * React 19 compatible). Emits title, description, canonical, Open Graph, Twitter, robots and JSON-LD.
 * Canonical uses the clean route path (production URL form) regardless of the dev hash router.
 */
import type { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../state/store-context';

export interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: ReadonlyArray<Record<string, unknown>>;
}

function origin(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * Security: serialise JSON-LD for embedding in a <script> tag without allowing a `</script>` / `<!--`
 * breakout (a classic XSS vector when the schema contains attacker-influenced strings, e.g. a product
 * title). Escaping `<`, `>`, `&` and the JS line separators keeps the JSON valid while making a tag
 * breakout impossible.
 */
function safeJsonLd(schema: Record<string, unknown>): string {
  // Emit unicode-escaped text for < > & and JS line separators so an attacker-influenced
  // schema string (e.g. a product title) cannot break out of the surrounding script tag.
  // Built via fromCharCode(92) so the source carries no literal backslash or separator.
  const bs = String.fromCharCode(92);
  const ls = String.fromCharCode(0x2028);
  const ps = String.fromCharCode(0x2029);
  return JSON.stringify(schema)
    .split('<').join(bs + 'u003c')
    .split('>').join(bs + 'u003e')
    .split('&').join(bs + 'u0026')
    .split(ls).join(bs + 'u2028')
    .split(ps).join(bs + 'u2029');
}

export function Seo(props: SeoProps): ReactElement {
  const { title, description, image, path, type = 'website', noindex, jsonLd } = props;
  const { store } = useStore();
  const location = useLocation();

  const siteName = store.name;
  const fullTitle = title ? `${title} · ${siteName}` : siteName;
  const canonical = `${origin()}${path ?? location.pathname}`;
  const desc = description ?? store.description ?? '';
  const ogType = type === 'product' ? 'product' : 'website';

  return (
    <>
      <title>{fullTitle}</title>
      {desc ? <meta name="description" content={desc} /> : null}
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      {desc ? <meta property="og:description" content={desc} /> : null}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      {image ? <meta property="og:image" content={image} /> : null}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      {desc ? <meta name="twitter:description" content={desc} /> : null}
      {image ? <meta name="twitter:image" content={image} /> : null}

      {(jsonLd ?? []).map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      ))}
    </>
  );
}
