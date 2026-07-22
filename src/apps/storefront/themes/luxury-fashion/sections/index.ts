/**
 * Section registry for Theme 01 — maps each documented section `type` to its component, plus the
 * theme's default template compositions. The engine resolves `instance.type` through the section
 * registry and drops unknown types gracefully. Merchant page-builder configs (Phase 6) override
 * these defaults; the templates here are the out-of-the-box starting point.
 */
import type { PageDefinition, SectionMap, TemplateMap } from '../../../theme-engine/rendering';
import { BrandLogosSection } from './BrandLogosSection';
import { CategoryHeaderSection } from './CategoryHeaderSection';
import { CategoryListSection } from './CategoryListSection';
import { CollectionSection } from './CollectionSection';
import { CouponsStripSection } from './CouponsStripSection';
import { EditorialBannerSection } from './EditorialBannerSection';
import { FaqSection } from './FaqSection';
import { FlashDealsSection } from './FlashDealsSection';
import { HeroSection } from './HeroSection';
import { HeroSliderSection } from './HeroSliderSection';
import { InstagramSection } from './InstagramSection';
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
import { TestimonialsSection } from './TestimonialsSection';
import { ValuesSection } from './ValuesSection';

export const luxurySections: SectionMap = {
  hero: HeroSection,
  'hero-slider': HeroSliderSection,
  'category-header': CategoryHeaderSection,
  'category-list': CategoryListSection,
  'featured-categories': CategoryListSection,
  'product-grid': ProductGridSection,
  'product-details': ProductDetailsSection,
  'product-carousel': ProductCarouselSection,
  'flash-deals': FlashDealsSection,
  'brand-logos': BrandLogosSection,
  instagram: InstagramSection,
  'ugc-gallery': InstagramSection,
  'coupons-strip': CouponsStripSection,
  'new-arrivals': NewArrivalsSection,
  'best-sellers': BestSellersSection,
  'related-products': RelatedProductsSection,
  'recently-viewed': RecentlyViewedSection,
  collection: CollectionSection,
  lookbook: CollectionSection,
  testimonials: TestimonialsSection,
  'editorial-banner': EditorialBannerSection,
  'why-choose-us': ValuesSection,
  values: ValuesSection,
  faq: FaqSection,
  'rich-text': RichTextSection,
};

const home: PageDefinition = {
  template: 'home',
  sections: [
    {
      type: 'hero',
      id: 'hero',
      settings: {
        eyebrow: 'Autumn / Winter',
        heading: 'Quiet luxury, considered.',
        subheading: 'Timeless pieces, made to last — crafted from the finest natural materials.',
        cta_label: 'Shop new in',
        cta_url: '/collections/new-in',
        align: 'start',
      },
    },
    { type: 'featured-categories', id: 'categories', settings: { title: 'Shop by category', columns: 3 } },
    {
      type: 'product-grid',
      id: 'new-arrivals',
      settings: { title: 'New arrivals', source: 'newest', limit: 8, columns: 4 },
    },
    {
      type: 'editorial-banner',
      id: 'editorial',
      settings: {
        eyebrow: 'The edit',
        heading: 'The winter coat, reimagined',
        body: 'A study in restraint — clean lines, considered proportions, and cloth woven to endure.',
        cta_label: 'Explore the edit',
        cta_url: '/collections/outerwear',
        media_side: 'left',
      },
    },
    {
      type: 'product-grid',
      id: 'featured',
      settings: { title: 'Featured', source: 'featured', limit: 4, columns: 4 },
    },
    {
      type: 'why-choose-us',
      id: 'values',
      settings: {
        title: 'The house promise',
        columns: 3,
        icon_style: 'numbered',
        items:
          'Complimentary shipping | On every order over $200, worldwide.\nArchival craftsmanship | Made by hand to last a lifetime.\nConsidered returns | Fourteen days, simple and unhurried.',
      },
    },
    {
      type: 'faq',
      id: 'faq',
      settings: {
        title: 'Frequently asked',
        items:
          'Do you ship internationally? | Yes — to more than 40 countries, duties calculated at checkout.\nHow do returns work? | Return any unworn piece within 14 days for a full refund.\nHow should I care for natural fibres? | Each piece ships with considered care instructions.',
      },
    },
  ],
};

const category: PageDefinition = {
  template: 'category',
  sections: [
    { type: 'category-header', id: 'head' },
    { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: 4, limit: 24 } },
  ],
};

const product: PageDefinition = {
  template: 'product',
  sections: [
    { type: 'product-details', id: 'pdp', settings: { show_share: true, show_sku: false } },
    { type: 'related-products', id: 'related', settings: { title: 'You may also like' } },
    { type: 'recently-viewed', id: 'recent', settings: { title: 'Recently viewed' } },
  ],
};

export const luxuryTemplates: TemplateMap = { home, category, product };
