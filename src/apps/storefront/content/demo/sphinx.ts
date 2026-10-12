import { category, product, type DemoCatalog } from './types';
import type { CatalogOverlay } from './localize';

const categories = [
  ['Bar cabinets', 'bar-cabinets', 'photo-1538688525198-9b88f6f53126', 'خزائن جانبية'],
  ['Office chairs', 'office-chairs', 'photo-1567538096630-e0c55bd6374c', 'كراسي المكتب'],
  ['Coffee tables', 'coffee-tables', 'photo-1533090161767-e6ffed986c88', 'طاولات القهوة'],
  ['Storage cabinets', 'storage-cabinets', 'photo-1594620302200-9a762244a156', 'خزائن التخزين'],
  ['Sofas', 'sofas', 'photo-1555041469-a586c61ea9bc', 'الأرائك'],
  ['Dining tables', 'dining-tables', 'photo-1567016432779-094069958ea5', 'طاولات الطعام'],
] as const;
const products = [
  ['Walnut sideboard', 'بوفيه من خشب الجوز', 750, 950, 0],
  ['Oak storage cabinet', 'خزانة تخزين من خشب البلوط', 890, 1050, 3],
  ['Upholstered office chair', 'كرسي مكتب مبطن', 580, 0, 1],
  ['Round marble coffee table', 'طاولة قهوة رخامية دائرية', 1200, 0, 2],
  ['Three seat linen sofa', 'أريكة كتّان ثلاثية المقاعد', 2800, 3300, 4],
  ['Solid oak dining table', 'طاولة طعام من خشب البلوط', 1800, 0, 5],
  ['Compact walnut cabinet', 'خزانة جوز صغيرة', 650, 0, 0],
  ['Low coffee table', 'طاولة قهوة منخفضة', 790, 950, 2],
] as const;

/** Preview data only. Published stores continue using their own tenant catalog. */
export const SPHINX_CATALOG: DemoCatalog = {
  vertical: 'Furniture', currency: 'EGP',
  products: products.map(([title, , price, was, index], i) => {
    const [categoryName, categorySlug, photo] = categories[index];
    return product({ i: i + 1, title, price, ...(was ? { was } : {}), vendor: '', photo, rating: 0, reviews: 0, currency: 'EGP', categoryName, categorySlug });
  }),
  categories: categories.map(([title, slug, photo], i) => category(`c${i + 1}`, title, slug, photo, '')),
  brands: [], testimonials: [], faqs: [], announcements: ['Furniture for everyday living'],
};
export const SPHINX_AR: CatalogOverlay = {
  vertical: 'الأثاث',
  products: Object.fromEntries(products.map(([, title, , , index], i) => [`p${i + 1}`, { title, categoryName: categories[index][3] }])),
  categories: Object.fromEntries(categories.map(([, , , title], i) => [`c${i + 1}`, { title }])),
  announcements: ['أثاث يناسب حياتك اليومية'],
};
