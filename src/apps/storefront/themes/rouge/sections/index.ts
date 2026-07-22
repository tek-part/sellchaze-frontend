/**
 * Rouge section registry — maps section `type` → component, plus default template compositions. The
 * engine resolves instance.type through this registry (unknown types are dropped, so a theme/merchant
 * mismatch degrades gracefully). Rouge's own — no other theme imported.
 */
import type { PageDefinition, SectionMap, TemplateMap } from '../../../theme-engine/rendering';
import { BrandLogosSection } from './BrandLogosSection';
import { CategoryHeaderSection } from './CategoryHeaderSection';
import { CategoryListSection } from './CategoryListSection';
import { CleanStandardsSection } from './CleanStandardsSection';
import { CollectionSection } from './CollectionSection';
import { CouponsStripSection } from './CouponsStripSection';
import { EditorialBannerSection } from './EditorialBannerSection';
import { FaqSection } from './FaqSection';
import { FlashDealsSection } from './FlashDealsSection';
import { HeroSection } from './HeroSection';
import { HeroSliderSection } from './HeroSliderSection';
import { InstagramSection } from './InstagramSection';
import { NewsletterSection } from './NewsletterSection';
import { ProductDetailsSection } from './ProductDetailsSection';
import { ProductGridSection } from './ProductGridSection';
import {
  BestSellersSection,
  NewArrivalsSection,
  ProductCarouselSection,
  RelatedProductsSection,
} from './ProductRailSection';
import { RecentlyViewedSection } from './RecentlyViewedSection';
import { RichTextSection } from './RichTextSection';
import { ShadeFinderSection } from './ShadeFinderSection';
import { TestimonialsSection } from './TestimonialsSection';
import { ValuesSection } from './ValuesSection';

export const rougeSections: SectionMap = {
  hero: HeroSection,
  'category-header': CategoryHeaderSection,
  'category-list': CategoryListSection,
  'featured-categories': CategoryListSection,
  'product-grid': ProductGridSection,
  'product-details': ProductDetailsSection,
  'product-carousel': ProductCarouselSection,
  'new-arrivals': NewArrivalsSection,
  'best-sellers': BestSellersSection,
  'bestsellers-by-shade': BestSellersSection,
  'related-products': RelatedProductsSection,
  'recently-viewed': RecentlyViewedSection,
  'limited-drop': FlashDealsSection,
  'flash-deals': FlashDealsSection,
  'hero-slider': HeroSliderSection,
  'editorial-banner': EditorialBannerSection,
  collection: CollectionSection,
  lookbook: CollectionSection,
  'brand-logos': BrandLogosSection,
  instagram: InstagramSection,
  'ugc-gallery': InstagramSection,
  'coupons-strip': CouponsStripSection,
  faq: FaqSection,
  'why-choose-us': ValuesSection,
  values: ValuesSection,
  'rich-text': RichTextSection,
  'shade-finder': ShadeFinderSection,
  'clean-standards': CleanStandardsSection,
  testimonials: TestimonialsSection,
  newsletter: NewsletterSection,
};

const home: PageDefinition = {
  template: 'home',
  sections: [
    {
      type: 'hero',
      id: 'hero',
      settings: {
        eyebrow: 'New · The Luminous Edit',
        heading: 'Skin-first colour, made to',
        flourish: 'glow',
        subheading:
          'Weightless, buildable formulas in a spectrum of undertones — clean, cruelty-free, and endlessly wearable.',
        cta_label: 'Shop the edit',
        cta_url: '/collections/new-in',
        secondary_label: 'Find your shade',
        secondary_url: '/search?q=foundation',
        align: 'center',
      },
    },
    { type: 'category-list', id: 'cats', settings: { eyebrow: 'Explore', title: 'Shop by ritual', columns: 4 } },
    {
      type: 'product-grid',
      id: 'best',
      settings: { eyebrow: 'Most-loved', title: 'Bestsellers', source: 'bestsellers', limit: 4, columns: 4, view_all_url: '/collections/bestsellers' },
    },
    { type: 'shade-finder', id: 'finder', settings: {} },
    {
      type: 'editorial-banner',
      id: 'editorial',
      settings: {
        eyebrow: 'The Rouge Édit',
        heading: 'Colour, considered',
        body: 'Skin-first pigments developed with dermatologists — buildable, breathable, and made to flatter every undertone.',
        cta_label: 'Read the story',
        cta_url: '/about',
        media_side: 'right',
      },
    },
    {
      type: 'product-grid',
      id: 'new',
      settings: { eyebrow: 'Just dropped', title: 'New arrivals', source: 'newest', limit: 4, columns: 4, view_all_url: '/collections/new-in' },
    },
    { type: 'clean-standards', id: 'promise', settings: {} },
    {
      type: 'testimonials',
      id: 'reviews',
      // Demo copy lives in the merchant-editable preset, never as a component fallback — a merchant
      // who clears this field gets an empty section, not invented social proof.
      settings: {
        quotes:
          'The shade match was uncanny — it disappears into my skin and wears all day without a touch-up. | Verified buyer · Deep neutral | 5\nLightweight, luminous, and the packaging feels like a gift to myself. | Verified buyer · Medium warm | 5\nFinally a clean formula that actually performs. I have repurchased three times. | Verified buyer · Fair cool | 5',
      },
    },
    {
      type: 'faq',
      id: 'faq',
      settings: {
        items:
          'Are your formulas clean? | Yes — vegan, cruelty-free, and made without 1,800+ questionable ingredients.\nHow do I find my shade? | Try the Shade Finder, or order up to three samples with any purchase.\nWhat is your returns policy? | Return gently-used products within 30 days for a full refund.',
      },
    },
    { type: 'newsletter', id: 'news', settings: {} },
  ],
};

const category: PageDefinition = {
  template: 'category',
  sections: [
    { type: 'category-header', id: 'head', settings: { eyebrow: 'The edit' } },
    { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: 4, limit: 24 } },
  ],
};

const product: PageDefinition = {
  template: 'product',
  sections: [
    { type: 'product-details', id: 'pdp', settings: { show_share: true, show_sku: false } },
    { type: 'related-products', id: 'related', settings: {} },
    { type: 'recently-viewed', id: 'recent', settings: {} },
  ],
};

export const rougeTemplates: TemplateMap = { home, category, product };
