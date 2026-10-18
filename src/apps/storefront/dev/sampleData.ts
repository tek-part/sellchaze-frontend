/**
 * DEV-ONLY preview data — a small, realistic slice of the catalog so sections/pages can be built and
 * visually verified before the backend is wired. This is NOT production data: Phase 6 replaces it by
 * loading `StorefrontContext.data` from the real API. Keep it out of any production code path.
 */
import type { CategoryCardModel, ProductCardModel, ProductDetailModel } from '../types/catalog';
import { catalogFor } from '../content/demo';

/**
 * Optional translator. DEV fixtures are also read by non-React callers (and by tests), so the
 * translator is optional and falls back to the English literal — a fixture must never be the reason
 * a caller has to set up i18n.
 */
type Translator = (key: string) => string;

function translator(t?: Translator): (key: string, fallback: string) => string {
  return (key, fallback) => (t ? t(key) : fallback);
}
import type { FooterGroup, NavItem } from '../types/navigation';

const img = (seed: string, w = 800, h = 1000): string => `https://picsum.photos/seed/${seed}/${w}/${h}`;


// Exported as functions (not top-level consts) so that in production — where every caller is behind
// an `import.meta.env.DEV` guard that Vite replaces with `false` — these are unreferenced and Rollup
// dead-code-eliminates the whole module (no picsum URLs / sample data ship to prod).
/**
 * Every fixture takes the active theme id explicitly. An earlier version read `data-theme-id` off
 * the DOM, which raced the very render that creates that element — the first paint resolved to the
 * fallback catalogue, so Rouge briefly showed Luxury's announcements. Callers already hold the
 * manifest, so passing the id is both correct and cheaper.
 */
export const sampleNewest = (themeId?: string, locale?: string): ProductCardModel[] => [...catalogFor(themeId, locale).products];

export const sampleFeatured = (themeId?: string, locale?: string): ProductCardModel[] => [...catalogFor(themeId, locale).products].slice(0, 8);

export const sampleCategories = (themeId?: string, locale?: string): CategoryCardModel[] => [...catalogFor(themeId, locale).categories];

/**
 * The demo category behind a `/collections/:slug` URL.
 *
 * Products already fall back to sample data when the API is unavailable, but the
 * category record did not — so a collection page rendered a slug-cased title and
 * no hero image while the demo content had both.
 */
export const sampleCategory = (slug: string, themeId?: string, locale?: string): CategoryCardModel | undefined =>
  catalogFor(themeId, locale).categories.find((c) => c.url === `/collections/${slug}`);

export const sampleNav = (themeId?: string, t?: Translator, locale?: string): NavItem[] => {
  const tr = translator(t);
  // Categories come from the active theme's catalogue, so Hearth's mega menu lists rooms rather
  // than the fashion categories every theme used to inherit.
  const cats = catalogFor(themeId, locale).categories.slice(0, 8).map((c) => ({ label: c.title, url: c.url }));
  return [
    { label: tr('nav.home', 'Home'), url: '/' },
    {
      label: tr('nav.shop', 'Shop'),
      url: '/shop',
      children: [
        { label: tr('nav.allProducts', 'All products'), url: '/shop' },
        { label: tr('nav.newArrivals', 'New arrivals'), url: '/collections/new-arrivals' },
        { label: tr('nav.bestSellers', 'Best sellers'), url: '/collections/best-sellers' },
        { label: tr('nav.collections', 'Collections'), url: '/collections' },
        { label: tr('nav.categories', 'Categories'), url: '/categories' },
        { label: tr('nav.brands', 'Brands'), url: '/brands' },
      ],
      ...(cats.length > 0 ? { columns: [{ title: tr('nav.shopByCategory', 'Shop by category'), items: cats }] } : {}),
    },
    { label: tr('nav.about', 'About us'), url: '/about' },
    { label: tr('nav.blog', 'Blog'), url: '/blog' },
    { label: tr('nav.contact', 'Contact'), url: '/contact' },
  ];
};

export const sampleFooter = (themeId?: string, t?: Translator, locale?: string): FooterGroup[] => {
  const tr = translator(t);
  const cats = catalogFor(themeId, locale).categories.slice(0, 4).map((c) => ({ label: c.title, url: c.url }));
  return [
    { title: tr('nav.shop', 'Shop'), links: cats },
    {
      title: tr('footer.help', 'Help'),
      links: [
        { label: 'Contact us', url: '/contact' },
        { label: 'FAQ', url: '/faq' },
        { label: 'Shipping', url: '/pages/shipping' },
        { label: 'Returns', url: '/pages/returns' },
      ],
    },
    {
      title: tr('footer.accountColumn', 'Account'),
      links: [
        { label: 'Sign in', url: '/login' },
        { label: 'My orders', url: '/account/orders' },
        { label: 'Wishlist', url: '/wishlist' },
        { label: 'Addresses', url: '/account/addresses' },
      ],
    },
    {
      title: tr('footer.company', 'Company'),
      links: [
        { label: tr('nav.about', 'About us'), url: '/about' },
        { label: 'Journal', url: '/blog' },
        { label: tr('nav.brands', 'Brands'), url: '/brands' },
      ],
    },
  ];
};

export const sampleAnnouncements = (themeId?: string, locale?: string): string[] => [...catalogFor(themeId, locale).announcements];

export function sampleProductDetail(slug: string, themeId?: string, locale?: string): ProductDetailModel {
  const base = sampleNewest(themeId, locale).find((p) => p.handle === slug) ?? sampleNewest(themeId, locale)[0]!;
  if (themeId === 'hype-perfumes') {
    return { ...base, images: [base.image, base.hoverImage].filter((image): image is NonNullable<typeof image> => Boolean(image)), inStock: true, sku: `PREVIEW-${base.id}`, descriptionHtml: locale === 'ar' ? '<p>بيانات معاينة فقط. يضيف المتجر صور منتجاته ووصفها وخياراتها الفعلية.</p>' : '<p>Preview content only. Each store supplies its actual fragrance photographs, descriptions and options.</p>' };
  }
  if (themeId === 'blast-pets' || themeId === 'nature-pets') {
    const ar = locale === 'ar'; const source = base.image?.src;
    return { ...base, images: source ? [{ src: source, alt: base.title }] : [], inStock: true, sku: `PETS-${base.id}`, descriptionHtml: ar ? '<p>بيانات معاينة فقط. يحدد كل متجر صور منتجاته ووصفها وخياراتها الفعلية.</p>' : '<p>Preview content only. Each store supplies its own product photographs, descriptions and options.</p>', variants: base.categorySlug === 'beds-accessories' ? [
      { id: 'pets-small', label: ar ? 'صغير' : 'Small', options: { [ar ? 'المقاس' : 'Size']: ar ? 'صغير' : 'Small' }, price: base.price, available: true, availableStock: 5 },
      { id: 'pets-large', label: ar ? 'كبير' : 'Large', options: { [ar ? 'المقاس' : 'Size']: ar ? 'كبير' : 'Large' }, price: base.price + 100, available: true, availableStock: 2 },
      { id: 'pets-unavailable', label: ar ? 'كبير جدًا' : 'Extra large', options: { [ar ? 'المقاس' : 'Size']: ar ? 'كبير جدًا' : 'Extra large' }, price: base.price + 200, available: false, availableStock: 0 },
    ] : [] };
  }
  if (themeId === 'nature-kids') {
    const ar = locale === 'ar'; const source = base.image?.src; const clothing = base.categorySlug?.includes('clothing');
    return { ...base, images: source ? [source, base.hoverImage?.src ?? source].map(src => ({ src, alt: base.title })) : [], inStock: true, sku: `KIDS-${base.id}`, descriptionHtml: ar ? '<p>بيانات معاينة للمتجر. يضيف التاجر وصف المنتجات ومواصفاتها الفعلية.</p>' : '<p>Store preview content. Merchants supply their actual product descriptions and specifications.</p>', variants: clothing ? [{ id: 'kids-small', label: ar ? '4–6 سنوات' : '4–6 years', options: { [ar ? 'المقاس' : 'Size']: ar ? '4–6 سنوات' : '4–6 years' }, price: base.price, available: true, availableStock: 5 }, { id: 'kids-medium', label: ar ? '7–9 سنوات' : '7–9 years', options: { [ar ? 'المقاس' : 'Size']: ar ? '7–9 سنوات' : '7–9 years' }, price: base.price, available: true, availableStock: 2 }] : [] };
  }
  if (themeId === 'elite-furniture' || themeId === 'pure-furniture' || themeId === 'sphinx-v3') {
    const ar = locale === 'ar';
    const source = base.image?.src;
    const images = source ? [source, source.replace('fit=crop', 'fit=crop&crop=top'), source.replace('fit=crop', 'fit=crop&crop=bottom')].map(src => ({ src, alt: base.title })) : [];
    return { ...base, images, sku: `FURNITURE-${base.id}`, inStock: true,
      descriptionHtml: ar ? '<p>قطعة أثاث عملية بخامات مختارة وتفاصيل تناسب الاستخدام اليومي. هذه بيانات معاينة؛ يضع كل متجر مواصفات منتجاته الفعلية.</p>' : '<p>Thoughtfully selected furniture for everyday living. This is preview content; each store supplies its own product specifications.</p>',
      variants: [
        { id: 'walnut', label: ar ? 'جوز' : 'Walnut', options: { [ar ? 'الخامة' : 'Finish']: ar ? 'جوز' : 'Walnut' }, available: true, price: base.price, availableStock: 5 },
        { id: 'oak', label: ar ? 'بلوط' : 'Oak', options: { [ar ? 'الخامة' : 'Finish']: ar ? 'بلوط' : 'Oak' }, available: true, price: base.price + 100, availableStock: 2 },
        { id: 'black', label: ar ? 'أسود' : 'Black', options: { [ar ? 'الخامة' : 'Finish']: ar ? 'أسود' : 'Black' }, available: false, price: base.price },
      ],
    };
  }
  return {
    ...base,
    images: [{ src: img('sc-0') }, { src: img('sc-0-b') }, { src: img('sc-0-c') }],
    sku: 'MS-0421',
    descriptionHtml:
      '<p>Cut from a wool-cashmere blend and finished by hand, this piece is designed to become a lasting part of your wardrobe. Considered proportions, a clean shoulder, and a quiet drape.</p>',
    variants: [
      { id: 's', label: 'Small', available: true },
      { id: 'm', label: 'Medium', available: true },
      { id: 'l', label: 'Large', available: false },
    ],
    inStock: true,
  };
}

/** DEV-only social handles for the footer utility row (never shipped to production chrome). */
export const sampleSocial = (): Array<{ label: string; url: string }> => [
  { label: 'Instagram', url: 'https://instagram.com' },
  { label: 'Pinterest', url: 'https://pinterest.com' },
  { label: 'YouTube', url: 'https://youtube.com' },
];
