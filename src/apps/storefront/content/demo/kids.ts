import { category, product, type DemoCatalog } from './types';
import type { CatalogOverlay } from './localize';

const categories = [
  ['Boys clothing', 'boys-clothing', 'photo-1523381210434-271e8be1f52b', 'ملابس الأولاد'],
  ['Girls clothing', 'girls-clothing', 'photo-1512436991641-6745cdb1723f', 'ملابس البنات'],
  ['Play and games', 'play-games', 'photo-1441986300917-64674bd600d8', 'ألعاب وتسالي'],
  ['Everyday essentials', 'kids-essentials', 'photo-1542291026-7eec264c27ff', 'احتياجات يومية'],
] as const;
const products = [
  ['Everyday cotton T-shirt', 'تيشيرت قطني يومي', 249, 349, 0],
  ['Soft cotton hoodie', 'هودي قطني مريح', 699, 899, 0],
  ['Printed summer dress', 'فستان صيفي بنقشة', 599, 799, 1],
  ['Lightweight denim skirt', 'تنورة جينز خفيفة', 499, 0, 1],
  ['Creative play set', 'مجموعة لعب إبداعية', 399, 549, 2],
  ['Puzzle collection', 'مجموعة ألغاز', 199, 299, 2],
  ['Everyday trainers', 'حذاء يومي مريح', 449, 599, 3],
  ['Colorful backpack', 'حقيبة ظهر ملونة', 299, 399, 3],
  ['Weekend cotton shorts', 'شورت قطني للعطلة', 299, 399, 0],
  ['Striped summer top', 'بلوزة صيفية مخططة', 349, 449, 1],
  ['Playtime favorites', 'اختيارات وقت اللعب', 599, 749, 2],
  ['Soft everyday socks', 'جوارب يومية ناعمة', 99, 149, 3],
] as const;
/** Preview-only catalog. Merchants supply their own products and campaign photos. */
export const KIDS_CATALOG: DemoCatalog = {
  vertical: 'Kids & Lifestyle', currency: 'EGP',
  products: products.map(([title, , price, was, index], i) => {
    const [categoryName, categorySlug, photo] = categories[index];
    return { ...product({ i: i + 1, title, price, ...(was ? { was } : {}), vendor: '', photo, rating: 0, reviews: 0, currency: 'EGP', categoryName, categorySlug }), id: `kids-preview-p${i + 1}`, image: { src: `/media/theme-campaigns/nature-kids-${index === 1 || index === 2 ? 'pink' : 'green'}-desktop-v1.png`, alt: title }, hoverImage: { src: `/media/theme-campaigns/nature-kids-${index === 1 || index === 2 ? 'pink' : 'green'}-mobile-v1.png`, alt: title }, availableStock: 5, orderMaxQuantity: 3 };
  }),
  categories: categories.map(([title, slug, photo], i) => ({ ...category(`kids-preview-c${i + 1}`, title, slug, photo, ''), image: { src: `/media/theme-campaigns/nature-kids-${i === 1 || i === 2 ? 'pink' : 'green'}-mobile-v1.png`, alt: title } })),
  brands: [], testimonials: [], faqs: [], announcements: ['Everyday choices for happy days'],
};
export const KIDS_AR: CatalogOverlay = {
  vertical: 'الأطفال',
  products: Object.fromEntries(products.map(([, title, , , index], i) => [`kids-preview-p${i + 1}`, { title, categoryName: categories[index][3] }])),
  categories: Object.fromEntries(categories.map(([, , , title], i) => [`kids-preview-c${i + 1}`, { title }])),
  announcements: ['اختيارات يومية للأيام المميزة'],
};
