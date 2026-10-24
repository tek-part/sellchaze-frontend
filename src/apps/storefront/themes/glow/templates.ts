/**
 * Glow — default page compositions. Every string default is a bilingual `{ ar, en }` map. Product
 * references are handles: on a real store that does not carry them they simply resolve to nothing
 * (the hero falls back to its collection, the routine steps to their links), so no demo product is
 * ever shown as if it were the merchant's.
 */
import type { SectionInstance } from '../../theme-engine/rendering';
import { baseTemplates, tr } from '../../sections-lib';

export const glowHome: ReadonlyArray<SectionInstance> = [
  { type: 'glow-hero', id: 'hero', settings: { product: 'rosewater-hydrating-essence', collection: 'featured' } },
  { type: 'glow-trust', id: 'trust', settings: { layout: 'strip' } },
  { type: 'glow-concerns', id: 'concerns', settings: {} },
  {
    type: 'featured-products',
    id: 'bestsellers',
    settings: {
      title: tr('الأكثر طلباً', 'Most loved'),
      subtitle: tr('المنتجات التي تعود إليها عميلاتنا مرة بعد مرة', 'The formulas our customers come back for'),
      collection: 'top-rated',
      layout: 'carousel',
      columns: '4',
      limit: 8,
      view_all_url: '/shop',
    },
  },
  {
    type: 'glow-routine',
    id: 'routine',
    settings: {
      __style: { anchor: 'routine' },
      subtitle: tr('صباحاً ومساءً، بعد التنظيف: حضّري، عالجي، ثم رطّبي.', 'Morning and night, after cleansing: prep, treat, then moisturise.'),
      steps: [
        { label: tr('تحضير', 'Prep'), title: tr('رطوبة أولى بعد التنظيف', 'A first layer of hydration'), text: tr('إسنس خفيف بماء الورد يهيّئ البشرة لما بعده.', 'A light rosewater essence that preps skin for what follows.'), product: 'rosewater-hydrating-essence', url: '/collections/skincare' },
        { label: tr('علاج', 'Treat'), title: tr('سيروم يمنح الإشراقة', 'Brighten with a serum'), text: tr('بضع قطرات من فيتامين C صباحاً قبل الترطيب.', 'A few drops of vitamin C each morning, before moisturiser.'), product: 'radiance-vitamin-c-serum', url: '/collections/skincare' },
        { label: tr('ترطيب', 'Moisturise'), title: tr('احبسي الترطيب', 'Seal it in'), text: tr('مرطّب بالسيراميد يدعم حاجز البشرة ويحافظ على نعومتها.', 'A ceramide cream that supports the barrier and keeps skin soft.'), product: 'barrier-repair-moisturiser', url: '/collections/skincare' },
      ],
    },
  },
  {
    type: 'glow-ingredient',
    id: 'ingredient',
    settings: {
      name: tr('فيتامين C', 'Vitamin C'),
      tagline: tr('حمض الأسكوربيك', 'Ascorbic acid'),
      text: tr('مضاد أكسدة يساعد على إشراق مظهر البشرة الباهتة وتوحيد لونها. أفضل وقت لاستخدامه هو الصباح، تحت واقي الشمس.', 'An antioxidant that helps brighten the look of dull skin and even out tone. It works best in the morning, under sunscreen.'),
      benefits: [
        { text: tr('يمنح البشرة الباهتة مظهراً أكثر إشراقاً', 'Brightens the look of dull skin') },
        { text: tr('يساعد على توحيد مظهر لون البشرة', 'Helps even the look of skin tone') },
        { text: tr('يدعم البشرة في مواجهة الضغوط اليومية', 'Antioxidant support against daily stressors') },
      ],
      product: 'radiance-vitamin-c-serum',
      note: tr('استخدميه صباحاً واتبعيه دائماً بواقي الشمس.', 'Use in the morning and always follow with sunscreen.'),
    },
  },
  {
    type: 'featured-products',
    id: 'new-in',
    settings: {
      title: tr('وصل حديثاً', 'New in'),
      subtitle: tr('إضافات جديدة للعناية بالبشرة والمكياج والشعر', 'Fresh additions across skincare, make-up and hair'),
      collection: 'newest',
      layout: 'grid',
      columns: '4',
      limit: 8,
      view_all_url: '/collections/new-in',
    },
  },
  { type: 'glow-results', id: 'results', settings: {} },
  {
    type: 'testimonials',
    id: 'reviews',
    settings: { title: tr('بكلمات عميلاتنا', 'In their words'), subtitle: '', layout: 'carousel', items: [], use_store_reviews: true, background: 'none', columns: '3' },
  },
  { type: 'faq', id: 'faq', settings: { title: tr('أسئلة تصلنا كثيراً', 'Questions we hear often'), items: [], use_store_faq: true, open_first: true } },
];

export const glowProduct: ReadonlyArray<SectionInstance> = [
  { type: 'product-details', id: 'pdp', settings: { show_share: true, show_sku: false, show_wishlist: true } },
  { type: 'glow-trust', id: 'trust', settings: { layout: 'strip' } },
  { type: 'related-products', id: 'related', settings: { title: tr('يكمّل روتينك', 'Completes your routine'), layout: 'carousel', limit: 8 } },
  { type: 'recently-viewed', id: 'recent', settings: {} },
];

export const glowCategory: ReadonlyArray<SectionInstance> = [
  { type: 'category-header', id: 'head', settings: { banner_mode: 'none', show_breadcrumbs: true, align: 'center' } },
  { type: 'glow-concerns', id: 'concerns', settings: { layout: 'chips', eyebrow: '', title: '', padding_block: 0 } },
  { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: '4', limit: 24 } },
];

export const glowTemplates = baseTemplates({ home: glowHome, product: glowProduct, category: glowCategory });
