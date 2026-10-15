import { category, product, type DemoCatalog } from './types';
import type { CatalogOverlay } from './localize';

const categories = [
  ['Cat essentials', 'cat-essentials', 'cat', 'احتياجات القطط'],
  ['Dog essentials', 'dog-essentials', 'dog', 'احتياجات الكلاب'],
  ['Beds & accessories', 'beds-accessories', 'bed', 'الأسرة والإكسسوارات'],
] as const;
const products = [
  ['Everyday cat favorites', 'اختيارات يومية للقطط', 325, 425, 0],
  ['Cat feeding collection', 'تشكيلة إطعام القطط', 240, 320, 0],
  ['Companion cat essentials', 'احتياجات رفيقك من القطط', 450, 600, 0],
  ['Cat comfort collection', 'تشكيلة راحة القطط', 560, 690, 0],
  ['Everyday dog favorites', 'اختيارات يومية للكلاب', 800, 950, 1],
  ['Dog walking collection', 'تشكيلة تنزه الكلاب', 430, 580, 1],
  ['Dog feeding essentials', 'احتياجات إطعام الكلاب', 350, 490, 1],
  ['Soft companion bed', 'سرير ناعم لرفيقك', 640, 850, 2],
  ['Rest and play collection', 'تشكيلة الراحة واللعب', 520, 680, 2],
  ['Cozy pet essentials', 'احتياجات مريحة لحيوانك الأليف', 390, 540, 2],
  ['Indoor pet collection', 'تشكيلة الحيوانات المنزلية', 460, 620, 2],
  ['Everyday play favorites', 'اختيارات اللعب اليومية', 250, 360, 1],
] as const;
/** Isolated demo data only; live storefronts use their own catalog and photography. */
export const PETS_CATALOG: DemoCatalog = {
  vertical: 'Pets', currency: 'EGP',
  products: products.map(([title, , price, was, index], i) => {
    const [categoryName, categorySlug, photo] = categories[index];
    return { ...product({ i: i + 1, title, price, was, vendor: '', photo: '', rating: 0, reviews: 0, currency: 'EGP', categoryName, categorySlug }), id: `pets-preview-p${i + 1}`, image: { src: `/media/theme-campaigns/blast-pets-${photo}-v1.png`, alt: title }, availableStock: 5, orderMaxQuantity: 3 };
  }),
  categories: categories.map(([title, slug, photo], i) => ({ ...category(`pets-preview-c${i + 1}`, title, slug, '', ''), image: { src: `/media/theme-campaigns/blast-pets-${photo}-v1.png`, alt: title } })),
  brands: [], testimonials: [], faqs: [], announcements: ['Everyday favorites for your companion'],
};
export const PETS_AR: CatalogOverlay = {
  vertical: 'الحيوانات الأليفة',
  products: Object.fromEntries(products.map(([, title, , , index], i) => [`pets-preview-p${i + 1}`, { title, categoryName: categories[index][3] }])),
  categories: Object.fromEntries(categories.map(([, , , title], i) => [`pets-preview-c${i + 1}`, { title }])),
  announcements: ['اختيارات يومية لرفيقك الأليف'],
};
