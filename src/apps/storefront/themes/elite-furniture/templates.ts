import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

const room = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=85';
const sofa = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85';
const chair = 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1400&q=85';
export const eliteHome: ReadonlyArray<SectionInstance> = [
  { id: 'hero', type: 'elite-hero', settings: { image: room, mobile_image: room, overlay: 30 } },
  { id: 'categories', type: 'elite-categories', settings: { limit: 5 } },
  { id: 'featured', type: 'elite-shelf', settings: { title: tr('اختيارات مميزة', 'Featured furniture'), collection: 'bestsellers', limit: 7, layout: 'shelf' } },
  { id: 'comparison', type: 'elite-image-compare', settings: { before_image: sofa, after_image: chair, before_label: tr('أريكة كتانية', 'Linen sofa'), after_label: tr('كرسي مبطن', 'Upholstered chair') } },
  { id: 'chairs', type: 'elite-shelf', settings: { title: tr('تصاميم لكل مساحة', 'Designs for every space'), collection: 'newest', limit: 8, layout: 'carousel' } },
  { id: 'sale', type: 'countdown-banner', settings: { layout: 'centered', heading: tr('اكتشف عروض المتجر', 'Discover store offers'), text: tr('تشكيلة مختارة بأسعار مميزة', 'Selected furniture at special prices.'), ends_at: '', hide_when_expired: false, background: 'surface', blocks: [{ id: 'sale-link', type: 'cta', settings: { label: tr('تسوق الآن', 'Shop now'), url: '/collections/on-sale', style: 'primary' } }] } },
  { id: 'decor', type: 'elite-shelf', settings: { title: tr('تفاصيل مميزة', 'Finishing touches'), collection: 'sale', limit: 7, layout: 'shelf' } },
  { id: 'story', type: 'image-with-text', settings: { heading: tr('منزل يعبر عنك', 'A home that feels like you'), text: tr('اجمع بين الخامات الطبيعية والتفاصيل العملية لتصنع مساحة مريحة تناسب حياتك.', 'Bring natural materials and thoughtful details together in a comfortable space.'), image: room, image_position: 'left', cta_label: tr('استكشف المجموعة', 'Explore the collection'), cta_url: '/shop' } },
  { id: 'tables', type: 'elite-shelf', settings: { title: tr('مجموعة المتجر', 'Our collection'), collection: 'featured', limit: 6, layout: 'grid' } },
  { id: 'newsletter', type: 'elite-newsletter', settings: {} },
];
export const eliteTemplates = baseTemplates({ home: eliteHome,
  product: [{ id: 'product', type: 'product-details', settings: { show_buy_now: true, show_wishlist: false, show_share: false, show_sku: false, show_quantity_offers: true } }, { id: 'related', type: 'related-products', settings: { show_wishlist: false, show_ratings: false } }],
  category: [{ id: 'header', type: 'category-header', settings: { banner_mode: 'none', show_breadcrumbs: false, show_description: true } }, { id: 'products', type: 'product-grid', settings: { columns: '4', limit: 24, show_wishlist: false, show_ratings: false, show_quick_add: false } }],
});
