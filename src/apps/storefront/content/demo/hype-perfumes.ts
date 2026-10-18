import type { DemoCatalog } from './types';
import type { CatalogOverlay } from './localize';
const photo = (name: string): string => `/media/theme-campaigns/hype-perfumes-${name}-v1.png`;
const categoryNames = ['Floral notes', 'Amber notes', 'Botanical notes', 'Aromatic woods'];
const categorySlugs = ['floral', 'amber', 'botanical', 'woods'];
const titles = ['Violet Dawn', 'Amber Evening', 'Botanical Morning', 'Aromatic Woods', 'Soft Petals', 'Warm Amber', 'Green Garden', 'Cedar Notes', 'Violet Mist', 'Amber Glow', 'Herbal Notes', 'Woodland Air'];
export const HYPE_CATALOG: DemoCatalog = {
  vertical: 'Fragrances', currency: 'EGP',
  products: titles.map((title, index) => {
    const family = index % 4; const handle = title.toLowerCase().replaceAll(' ', '-'); const price = 950 + index * 75;
    return { id: `hype-${index + 1}`, handle, title, url: `/products/${handle}`, price, compareAtPrice: price + 150, currency: 'EGP', categorySlug: categorySlugs[family]!, categoryName: categoryNames[family]!, image: { src: photo(family === 0 ? 'hero' : family === 1 ? 'amber' : 'botanical'), alt: title }, hoverImage: { src: photo(family === 1 ? 'botanical' : 'amber'), alt: '' }, availableStock: 7,
      variants: [{ id: `hype-${index + 1}-30`, label: '30 ml', options: { Volume: '30 ml' }, price, available: true, availableStock: 2 }, { id: `hype-${index + 1}-50`, label: '50 ml', options: { Volume: '50 ml' }, price: price + 300, available: false, availableStock: 0 }],
    };
  }),
  categories: categoryNames.map((title, index) => ({ id: `hype-c${index + 1}`, title, url: `/collections/${categorySlugs[index]}`, image: { src: photo(index === 0 ? 'hero' : index === 1 ? 'amber' : 'botanical'), alt: '' } })),
  brands: [], testimonials: [], faqs: [], announcements: [],
};
const arTitles = ['فجر البنفسج', 'مساء العنبر', 'صباح النباتات', 'الأخشاب العطرية', 'بتلات ناعمة', 'عنبر دافئ', 'حديقة خضراء', 'نغمات الأرز', 'ضباب البنفسج', 'وهج العنبر', 'نغمات الأعشاب', 'نسيم الغابة'];
const arCategories = ['نغمات الزهور', 'نغمات العنبر', 'نغمات النباتات', 'الأخشاب العطرية'];
export const HYPE_AR: CatalogOverlay = { vertical: 'العطور', products: Object.fromEntries(arTitles.map((title, i) => [`hype-${i + 1}`, { title, categoryName: arCategories[i % 4] }])), categories: Object.fromEntries(arCategories.map((title, i) => [`hype-c${i + 1}`, { title }])) };
