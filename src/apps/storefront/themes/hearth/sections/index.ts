/**
 * Section registry for Theme 03 — maps each section `type` to its bespoke component, plus the
 * theme's default template compositions. The engine resolves `instance.type` through this map and
 * drops unknown types gracefully. Later phases add PDP details, shop-the-room, materials story,
 * large gallery and testimonials.
 */
import type { PageDefinition, SectionMap, TemplateMap } from '../../../theme-engine/rendering';
import { CartSection } from './CartSection';
import { CategoryHeaderSection } from './CategoryHeaderSection';
import { CategoryStorySection } from './CategoryStorySection';
import { CheckoutSection } from './CheckoutSection';
import { FaqSection } from './FaqSection';
import { HeroSection } from './HeroSection';
import { LargeGallerySection } from './LargeGallerySection';
import { MaterialsStorySection } from './MaterialsStorySection';
import { NewsletterSection } from './NewsletterSection';
import { NotFoundSection } from './NotFoundSection';
import { OrderSuccessSection } from './OrderSuccessSection';
import { ProductDetailsSection } from './ProductDetailsSection';
import { ProductGridSection } from './ProductGridSection';
import { ProductRailSection } from './ProductRailSection';
import { RichTextSection } from './RichTextSection';
import { RoomCategoriesSection } from './RoomCategoriesSection';
import { SearchSection } from './SearchSection';
import { ShopTheRoomSection } from './ShopTheRoomSection';
import { TestimonialsSection } from './TestimonialsSection';
import { UspBandSection } from './UspBandSection';
import { WishlistSection } from './WishlistSection';

export const hearthSections: SectionMap = {
  hero: HeroSection,
  'roomset-hero': HeroSection,
  'room-categories': RoomCategoriesSection,
  'featured-categories': RoomCategoriesSection,
  'category-header': CategoryHeaderSection,
  'category-story': CategoryStorySection,
  'featured-collection': CategoryStorySection,
  'shop-the-room': ShopTheRoomSection,
  'materials-story': MaterialsStorySection,
  'large-gallery': LargeGallerySection,
  lookbook: LargeGallerySection,
  testimonials: TestimonialsSection,
  'product-grid': ProductGridSection,
  'product-details': ProductDetailsSection,
  'product-rail': ProductRailSection,
  'related-products': ProductRailSection,
  'recently-viewed': ProductRailSection,
  'usp-band': UspBandSection,
  faq: FaqSection,
  newsletter: NewsletterSection,
  'rich-text': RichTextSection,
  // Flow pages (rendered by the app via useTemplate → ThemeRenderer).
  cart: CartSection,
  checkout: CheckoutSection,
  search: SearchSection,
  wishlist: WishlistSection,
  'not-found': NotFoundSection,
  'order-success': OrderSuccessSection,
};

const home: PageDefinition = {
  template: 'home',
  sections: [
    {
      type: 'roomset-hero',
      id: 'hero',
      settings: {
        label: 'New season',
        heading: 'Rooms made to live in',
        subheading:
          'Warm, considered furniture and home pieces — made from good materials, built to last, ' +
          'and styled to bring a room together.',
        cta_label: 'Shop the collection',
        cta_url: '/collections/new',
        cta2_label: 'Browse rooms',
        cta2_url: '/rooms',
        align: 'start',
      },
    },
    { type: 'room-categories', id: 'rooms', settings: { label: 'Explore', heading: 'Shop by room', columns: 4 } },
    {
      type: 'category-story',
      id: 'story',
      settings: {
        label: 'The edit',
        heading: 'The oak dining collection',
        body: 'Solid, FSC-certified oak with a soft matte finish — a table built to gather around for years.',
        cta_label: 'Explore the collection',
        cta_url: '/collections/dining',
        image_side: 'start',
        notes: 'Solid oak | FSC-certified\n3-year warranty | On every frame\nWhite-glove delivery | Room of choice',
      },
    },
    {
      type: 'product-grid',
      id: 'new-arrivals',
      settings: { label: 'Just in', heading: 'New arrivals', source: 'newest', limit: 8, columns: 4, view_all_url: '/collections/new' },
    },
    {
      type: 'product-rail',
      id: 'bestsellers',
      settings: { label: 'Loved at home', heading: 'Best sellers', source: 'featured', limit: 10 },
    },
    {
      type: 'shop-the-room',
      id: 'shop-room',
      settings: {
        label: 'Shop the look',
        heading: 'The living room, brought together',
        source: 'featured',
        limit: 4,
        cta_label: 'Shop the whole room',
        cta_url: '/rooms/living',
      },
    },
    {
      type: 'materials-story',
      id: 'materials',
      settings: {
        label: 'Craft',
        heading: 'Made from good materials',
        columns: 3,
        item1_title: 'Solid oak',
        item1_text: 'FSC-certified timber with a soft, hand-finished matte surface.',
        item2_title: 'Natural linen',
        item2_text: 'Stonewashed, breathable and softer with every wash.',
        item3_title: 'Honest metal',
        item3_text: 'Powder-coated steel frames built to outlast trends.',
      },
    },
    {
      type: 'testimonials',
      id: 'testimonials',
      settings: {
        label: 'In real homes',
        heading: 'Loved at home',
        quote1_text: 'The oak table is even better in person — it’s become the heart of our kitchen.',
        quote1_author: 'Amara, Lisbon',
        quote1_rating: 5,
        quote2_text: 'Delivery was calm and careful, and the sofa is unbelievably comfortable.',
        quote2_author: 'Ben, Leeds',
        quote2_rating: 5,
        quote3_text: 'Beautiful materials and it arrived exactly when they said it would.',
        quote3_author: 'Noor, Dubai',
        quote3_rating: 4,
      },
    },
    {
      type: 'usp-band',
      id: 'usp',
      settings: {
        items:
          'Free delivery | On orders over $150\nEasy 30-day returns | Simple and unhurried\n5-year warranty | On solid-wood frames\nOrder a swatch | Feel the material first',
        columns: 4,
      },
    },
    {
      type: 'faq',
      id: 'faq',
      settings: {
        heading: 'Good to know',
        items:
          'How does delivery work? | Small items ship by courier; larger furniture is delivered by our two-person team to your room of choice.\nCan I return furniture? | Yes — within 30 days, unused and in its original packaging.\nHow do I care for solid wood? | Each piece ships with simple care guidance; wipe with a soft, dry cloth and keep out of direct heat.',
      },
    },
    { type: 'newsletter', id: 'newsletter', settings: { label: 'Stay in touch' } },
  ],
};

const category: PageDefinition = {
  template: 'category',
  sections: [
    { type: 'category-header', id: 'head' },
    {
      type: 'product-grid',
      id: 'grid',
      settings: { source: 'category', columns: 3, limit: 24 },
    },
    { type: 'product-rail', id: 'related-rooms', settings: { label: 'Nearby', heading: 'Popular in related rooms', source: 'featured' } },
  ],
};

const product: PageDefinition = {
  template: 'product',
  sections: [
    { type: 'product-details', id: 'pdp' },
    { type: 'related-products', id: 'related', settings: { label: 'Complete the look', heading: 'Pairs well with', source: 'related' } },
    { type: 'recently-viewed', id: 'recent', settings: { label: 'Seen recently', heading: 'Recently viewed', source: 'recentlyViewed' } },
  ],
};

/* Flow-page templates — single-section pages the app resolves via `useTemplate(<name>)`. */
const cart: PageDefinition = { template: 'cart', sections: [{ type: 'cart', id: 'cart', settings: { free_ship_threshold: 150 } }] };
const checkout: PageDefinition = { template: 'checkout', sections: [{ type: 'checkout', id: 'checkout' }] };
const search: PageDefinition = { template: 'search', sections: [{ type: 'search', id: 'search' }] };
const wishlist: PageDefinition = { template: 'wishlist', sections: [{ type: 'wishlist', id: 'wishlist' }] };
const notFound: PageDefinition = { template: 'not-found', sections: [{ type: 'not-found', id: 'not-found' }] };
const orderSuccess: PageDefinition = { template: 'order-success', sections: [{ type: 'order-success', id: 'order-success' }] };

export const hearthTemplates: TemplateMap = {
  home,
  category,
  product,
  cart,
  checkout,
  search,
  wishlist,
  'not-found': notFound,
  'order-success': orderSuccess,
};
