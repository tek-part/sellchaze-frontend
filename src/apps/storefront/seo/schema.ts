/**
 * JSON-LD structured-data builders (schema.org) — Organization, WebSite, Product, BreadcrumbList.
 * Emitted by the Seo component so search engines and social cards understand storefront pages.
 */
import type { ProductDetailModel } from '../types/catalog';

export function organizationSchema(name: string, url: string, logo?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo ? { logo } : {}),
  };
}

export function websiteSchema(name: string, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/search?q={query}`,
      'query-input': 'required name=query',
    },
  };
}

export function productSchema(product: ProductDetailModel, url: string): Record<string, unknown> {
  const inStock = product.inStock !== false;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    ...(product.images.length > 0 ? { image: product.images.map((i) => i.src) } : {}),
    ...(product.descriptionHtml ? { description: product.descriptionHtml.replace(/<[^>]+>/g, '').trim() } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.vendor ? { brand: { '@type': 'Brand', name: product.vendor } } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: product.currency,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
    },
    ...(typeof product.rating === 'number' && product.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
}

export function collectionSchema(
  name: string,
  url: string,
  products: ReadonlyArray<{ title: string; url: string }>,
  origin: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.title,
        url: `${origin}${p.url}`,
      })),
    },
  };
}

export function breadcrumbSchema(items: ReadonlyArray<{ label: string; url: string }>, origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: `${origin}${item.url}`,
    })),
  };
}

/**
 * BlogPosting — the audit flagged Article/BlogPosting as missing while every theme rendered
 * editorial content, so article pages produced no structured data at all.
 */
export function articleSchema(input: {
  title: string;
  description: string;
  url: string;
  image?: string;
  published: string;
  authorName: string;
  siteName: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    ...(input.image ? { image: [input.image] } : {}),
    datePublished: input.published,
    dateModified: input.published,
    author: { '@type': 'Person', name: input.authorName },
    publisher: { '@type': 'Organization', name: input.siteName },
  };
}

/** FAQPage — every theme ships an FAQ section; none of them emitted schema for it. */
export function faqSchema(items: ReadonlyArray<{ question: string; answer: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  };
}
