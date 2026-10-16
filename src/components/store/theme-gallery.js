export const THEME_CATEGORIES = [
    ['general', 'متجر عام', 'General store'], ['garden', 'الزراعة والحدائق', 'Garden'],
    ['digital', 'المنتجات الرقمية', 'Digital products'], ['tools', 'الأدوات والمعدات', 'Tools'],
    ['handmade', 'الهدايا والهاند ميد', 'Gifts & handmade'], ['food', 'الطعام والمشروبات', 'Food & drink'],
    ['pets', 'الحيوانات الأليفة', 'Pets'], ['cars', 'السيارات والإكسسوارات', 'Cars & accessories'],
    ['books', 'الكتب', 'Books'], ['hobbies', 'الألعاب والهوايات', 'Games & hobbies'],
    ['kids', 'مستلزمات الأطفال', 'Kids'], ['furniture', 'الأثاث والديكور', 'Furniture & decor'],
    ['home', 'المنزل والمطبخ', 'Home & kitchen'], ['electronics', 'الإلكترونيات', 'Electronics'],
    ['health', 'الصحة واللياقة', 'Health & fitness'], ['cosmetics', 'مستحضرات تجميل', 'Cosmetics'],
    ['perfumes', 'عطور', 'Perfumes'], ['watches', 'ساعات ونظارات', 'Watches & glasses'],
    ['jewelry', 'إكسسوارات ومجوهرات', 'Accessories & jewelry'], ['shoes', 'أحذية وشنط', 'Shoes & bags'],
    ['fashion', 'ملابس وأزياء', 'Fashion'],
];

// Compatibility while a paired API release is rolling out. These are actual runtime
// packages, never aliases or placeholders for the rest of the reference catalog.
const modern = {
    'blast-pets': { categories: ['pets'], rank: 3 },
    'pure-furniture': { categories: ['furniture'], rank: 21 },
    'nature-kids': { categories: ['hobbies', 'kids'], rank: 24 },
    'elite-furniture': { categories: ['furniture'], rank: 108 },
};
export function galleryMetadata(theme) {
    const fallback = modern[theme.key];
    return {
        collection: ['modern', 'classic'].includes(theme.galleryCollection) ? theme.galleryCollection : fallback ? 'modern' : 'classic',
        categories: Array.isArray(theme.galleryCategories) ? theme.galleryCategories.filter(key => THEME_CATEGORIES.some(row => row[0] === key)) : fallback?.categories ?? [],
        rank: Number.isFinite(theme.galleryRank) ? theme.galleryRank : fallback?.rank ?? 1000,
    };
}
export function filterGallery(themes, { collection, category = '', price = 'all' }) {
    return themes.filter(theme => {
        const meta = galleryMetadata(theme);
        return meta.collection === collection && (!category || meta.categories.includes(category)) && (price === 'all' || (price === 'paid' ? theme.premium : !theme.premium));
    }).sort((a, b) => galleryMetadata(a).rank - galleryMetadata(b).rank || a.name.localeCompare(b.name));
}
export function galleryPages(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, 'end', total];
    if (current >= total - 3) return [1, 'start', total - 4, total - 3, total - 2, total - 1, total];
    return [1, 'start', current - 1, current, current + 1, 'end', total];
}
