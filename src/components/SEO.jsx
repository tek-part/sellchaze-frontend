import { Helmet } from 'react-helmet-async';

/**
 * SEO component using react-helmet-async.
 * Injects title, meta tags, Open Graph, Twitter cards, canonical, and JSON-LD.
 * Works with future SSR/pre-render (vite-plugin-ssg, react-snap).
 */
export default function SEO({ title, description, canonical, ogImage, jsonLd, noIndex = false }) {
    const url = canonical || (typeof window !== 'undefined' ? window.location.href : undefined);
    const image = ogImage || (typeof window !== 'undefined' ? window.location.origin + '/logo.png' : '/logo.png');

    return (
        <Helmet>
            {title ? <title>{title}</title> : null}
            {description ? <meta name="description" content={description} /> : null}
            {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
            {url ? <link rel="canonical" href={url} /> : null}

            {title ? <meta property="og:title" content={title} /> : null}
            {description ? <meta property="og:description" content={description} /> : null}
            <meta property="og:type" content="website" />
            {url ? <meta property="og:url" content={url} /> : null}
            <meta property="og:image" content={image} />

            <meta name="twitter:card" content="summary_large_image" />
            {title ? <meta name="twitter:title" content={title} /> : null}
            {description ? <meta name="twitter:description" content={description} /> : null}
            <meta name="twitter:image" content={image} />

            {jsonLd ? (
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            ) : null}
        </Helmet>
    );
}
