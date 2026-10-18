/** Isolated DEV catalog. All names, prices and stock below are explicitly sample data. */
import type { DemoCatalog } from './types';
import type { CatalogOverlay } from './localize';
const photos = ['elite-wallets-wallet-v1.png', 'elite-wallets-look-v1.png', 'elite-wallets-hero-v1.png'];
const kinds = [
  { slug: 'wallets', name: 'Wallets', ar: 'محافظ', title: 'Green Wallet', arTitle: 'محفظة خضراء' },
  { slug: 'crossbody-bags', name: 'Crossbody bags', ar: 'حقائب كتف', title: 'Black Crossbody', arTitle: 'حقيبة كتف سوداء' },
  { slug: 'everyday-essentials', name: 'Everyday essentials', ar: 'اختيارات يومية', title: 'Everyday Carry', arTitle: 'إكسسوارات يومية' },
];
export const WALLET_CATALOG: DemoCatalog = {
  vertical: 'accessories', currency: 'USD',
  products: Array.from({ length: 30 }, (_, index) => {
    const kind = kinds[index % 3]!; const handle = `sample-${kind.slug}-${index + 1}`;
    return { id: `wallet-demo-${index + 1}`, handle, title: `Sample ${kind.title} ${index + 1}`, url: `/products/${handle}`, price: 35 + index * 3, currency: 'USD', image: { src: `/media/theme-campaigns/${photos[index % 3]}`, alt: `Sample ${kind.title}` }, vendor: 'Sample catalog', availableStock: 4, badge: 'Sample', categorySlug: kind.slug, categoryName: kind.name };
  }),
  categories: kinds.map((kind, index) => ({ id: `wallet-category-${index}`, slug: kind.slug, title: kind.name, url: `/collections/${kind.slug}`, image: { src: `/media/theme-campaigns/${photos[index]}`, alt: kind.name } })),
  brands: [], testimonials: [], faqs: [], announcements: ['Sample accessories catalog'],
};
export const WALLET_AR: CatalogOverlay = {
  vertical: 'إكسسوارات',
  products: Object.fromEntries(WALLET_CATALOG.products.map((product, index) => [product.id, { title: `مثال ${kinds[index % 3]!.arTitle} ${index + 1}`, badge: 'مثال', vendor: 'كتالوج تجريبي', categoryName: kinds[index % 3]!.ar }])),
  categories: Object.fromEntries(kinds.map((kind, index) => [`wallet-category-${index}`, { title: kind.ar }])),
  announcements: ['كتالوج إكسسوارات تجريبي'],
};
