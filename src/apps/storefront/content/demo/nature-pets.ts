import { PETS_CATALOG, PETS_AR } from './pets';
import type { DemoCatalog } from './types';
const portrait = (slug?: string): string => `/media/theme-campaigns/nature-pets-${slug === 'cat-essentials' ? 'cat' : slug === 'dog-essentials' ? 'dog' : 'bed'}-mobile-v1.png`;
export const NATURE_PETS_CATALOG: DemoCatalog = { ...PETS_CATALOG,
 products: PETS_CATALOG.products.map(product => ({ ...product, image: { src: portrait(product.categorySlug), alt: product.title }, hoverImage: product.image })),
 categories: PETS_CATALOG.categories.map(category => ({ ...category, image: { src: portrait(category.url.split('/').pop()), alt: category.title } })),
};
export { PETS_AR as NATURE_PETS_AR };
