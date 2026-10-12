import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const furniture = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85';
export const sphinxHome: ReadonlyArray<SectionInstance> = [
  { type: 'hero-slider', id: 'hero', settings: { height: 'medium', autoplay: true, show_arrows: false, slides: [{ image: furniture, mobile_image: furniture, eyebrow: '', text: '', heading: tr('راحة وأسلوب لكل مساحة', 'Comfort and style for every space'), cta_label: tr('تسوق الآن', 'Shop now'), cta_url: '/shop', align: 'center', overlay: 20 }] } },
  { type: 'sphinx-categories', id: 'categories', settings: { title: tr('استكشف أقسام المتجر', 'Browse our featured categories'), subtitle: tr('اختيارات متنوعة، مصممة لتناسب احتياجاتك', 'Explore a carefully selected collection'), limit: 6 } },
  { type: 'sphinx-shelf', id: 'best', settings: { title: tr('الأكثر مبيعًا', 'Best sellers'), collection: 'bestsellers', limit: 6 } },
  { type: 'hero-banner', id: 'banner', settings: { image: furniture, eyebrow: '', text: '', heading: tr('تفاصيل تصنع الفرق', 'Details make the difference'), cta_label: tr('استكشف المنتجات', 'Explore products'), cta_url: '/shop', align: 'center', overlay: 15 } },
  { type: 'featured-products', id: 'latest', settings: { title: tr('أحدث المنتجات', 'Latest products'), collection: 'newest', layout: 'carousel', columns: '4', limit: 8, show_wishlist: false, show_ratings: false, view_all_url: '/collections/new-arrivals' } },
  { type: 'featured-products', id: 'offers', settings: { title: tr('عروض المتجر', 'Store offers'), collection: 'sale', columns: '4', limit: 8, show_wishlist: false, show_ratings: false, view_all_url: '/collections/on-sale' } },
  { type: 'testimonials', id: 'testimonials', settings: { title: tr('آراء عملائنا', 'Customer testimonials'), layout: 'carousel', items: [] } },
  { type: 'features', id: 'features', settings: { title: tr('مزايا المتجر', 'Store features'), style: 'plain', items: [] } },
  { type: 'faq', id: 'faq', settings: { title: tr('الأسئلة الشائعة', 'Frequently asked questions'), items: [] } },
];
export const sphinxTemplates = baseTemplates({ home: sphinxHome, product: [{ type: 'product-details', id: 'pdp', settings: { show_share: false, show_sku: false } }, { type: 'related-products', id: 'related', settings: { show_wishlist: false } }], category: [{ type: 'category-header', id: 'head', settings: { banner_mode: 'none', show_breadcrumbs: false } }, { type: 'product-grid', id: 'grid', settings: { columns: '4', limit: 24, show_wishlist: false, show_ratings: false } }] });


