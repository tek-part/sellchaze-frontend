/**
 * Voltage section registry — maps section `type` → component, plus default template compositions.
 * The engine resolves instance.type through this registry (unknown types dropped). Voltage's own.
 */
import type { PageDefinition, SectionMap, TemplateMap } from '../../../theme-engine/rendering';
import { CategoryListSection } from './CategoryListSection';
import { HeroSection } from './HeroSection';
import { ProductDetailsSection } from './ProductDetailsSection';
import { ProductGridSection } from './ProductGridSection';
import { CartSection } from './CartSection';
import { WishlistSection } from './WishlistSection';
import { NotFoundSection } from './NotFoundSection';
import { SearchSection } from './SearchSection';
import { AuthSection } from './AuthSection';
import { CheckoutSection } from './CheckoutSection';
import { OrderSuccessSection } from './OrderSuccessSection';
import { AccountProfileSection } from './AccountProfileSection';
import { OrdersSection } from './OrdersSection';
import { OrderDetailSection } from './OrderDetailSection';
import { AddressesSection } from './AddressesSection';
import { CategoryHeaderSection } from './CategoryHeaderSection';
import { BreadcrumbsSection } from './BreadcrumbsSection';
import { WhyChooseUsSection } from './WhyChooseUsSection';
import { CouponsStripSection } from './CouponsStripSection';
import { BrandLogosSection } from './BrandLogosSection';
import { RichTextSection } from './RichTextSection';
import { UgcGallerySection } from './UgcGallerySection';
import { EditorialBannerSection } from './EditorialBannerSection';
import { FlashDealsSection } from './FlashDealsSection';
import { HeroSliderSection } from './HeroSliderSection';
import { FaqSection } from './FaqSection';
import { NewsletterSection } from './NewsletterSection';
import { AboutSection } from './AboutSection';
import { ContactSection } from './ContactSection';
import { BlogSection } from './BlogSection';

export const voltageSections: SectionMap = {
  hero: HeroSection,
  'category-list': CategoryListSection,
  'featured-categories': CategoryListSection,
  'product-grid': ProductGridSection,
  'product-details': ProductDetailsSection,
  'product-carousel': ProductGridSection,
  'new-arrivals': ProductGridSection,
  'best-sellers': ProductGridSection,
  'related-products': ProductGridSection,
  'recently-viewed': ProductGridSection,
  cart: CartSection,
  wishlist: WishlistSection,
  'not-found': NotFoundSection,
  search: SearchSection,
  auth: AuthSection,
  checkout: CheckoutSection,
  'order-success': OrderSuccessSection,
  'account-profile': AccountProfileSection,
  'account-orders': OrdersSection,
  'account-order': OrderDetailSection,
  'account-addresses': AddressesSection,
  'hero-slider': HeroSliderSection,
  breadcrumbs: BreadcrumbsSection,
  'category-header': CategoryHeaderSection,
  'why-choose-us': WhyChooseUsSection,
  'brand-logos': BrandLogosSection,
  'coupons-strip': CouponsStripSection,
  'editorial-banner': EditorialBannerSection,
  'flash-deals': FlashDealsSection,
  'rich-text': RichTextSection,
  'ugc-gallery': UgcGallerySection,
  faq: FaqSection,
  newsletter: NewsletterSection,
  about: AboutSection,
  contact: ContactSection,
  blog: BlogSection,
};

const home: PageDefinition = {
  template: 'home',
  sections: [
    {
      type: 'coupons-strip',
      id: 'promo',
      settings: { message: 'Free 24h shipping on orders over $150 —', code: 'VOLT24', cta_label: 'Shop new in', cta_url: '/collections/new-in' },
    },
    {
      type: 'hero',
      id: 'hero',
      settings: {
        eyebrow: 'New // 2026 lineup',
        heading: 'Spec-grade gear. Priced to compare.',
        subheading: 'Every number that matters, up front — so you buy on the facts, not the hype.',
        cta_label: 'Shop the drop',
        cta_url: '/collections/new-in',
        align: 'start',
      },
    },
    { type: 'category-list', id: 'cats', settings: { title: 'Browse by system', columns: 4 } },
    { type: 'product-grid', id: 'new', settings: { title: 'New arrivals', source: 'newest', limit: 8, columns: 4 } },
    {
      type: 'why-choose-us',
      id: 'why',
      settings: {
        title: 'Built to a spec',
        items: '2-year warranty | Every build is covered, no fine print.\nFree 24h shipping | Over $150, dispatched same day.\n30-day returns | Change your mind, no questions.',
      },
    },
    { type: 'flash-deals', id: 'flash', settings: { title: 'Flash deals', source: 'newest', ends_in_hours: 24, limit: 4, columns: 4 } },
    {
      type: 'editorial-banner',
      id: 'editorial',
      settings: {
        eyebrow: 'Field notes',
        heading: 'Engineered for the people who read the spec sheet.',
        text: 'We publish every number — weight, draw, tolerance — so the decision is yours to make on the facts.',
        cta_label: 'Read the standard',
        cta_url: '/collections/new-in',
        align: 'end',
      },
    },
    { type: 'product-grid', id: 'featured', settings: { title: 'Featured builds', source: 'featured', limit: 4, columns: 4 } },
    {
      type: 'brand-logos',
      id: 'brands',
      settings: { title: 'Trusted by builders at', brands: 'NORTHWIND\nAPEX LABS\nVANTA\nHELIX\nMERIDIAN\nGRIDWORKS' },
    },
    {
      type: 'faq',
      id: 'faq',
      settings: {
        title: 'Questions, answered',
        items: 'How fast is shipping? | Orders over $150 ship free within 24 hours, worldwide tracked.\nWhat if it doesn’t fit my build? | 30-day returns, no questions — we cover return shipping.\nIs there a warranty? | Every build carries a 2-year warranty against defects.\nDo you price match? | We publish the spec and the price — if you find better, tell us.',
      },
    },
    {
      type: 'newsletter',
      id: 'newsletter',
      settings: { title: 'Get the drop first', text: 'New builds, restocks and field notes — no noise.', cta_label: 'Subscribe' },
    },
  ],
};

const category: PageDefinition = {
  template: 'category',
  sections: [
    { type: 'breadcrumbs', id: 'cat-crumbs', settings: {} },
    { type: 'category-header', id: 'cat-head', settings: {} },
    // A full listing paginates: without it everything past `limit` was unreachable.
    { type: 'product-grid', id: 'grid', settings: { source: 'all', columns: 4, limit: 12, shop: true } },
  ],
};

const product: PageDefinition = {
  template: 'product',
  sections: [
    { type: 'breadcrumbs', id: 'pdp-crumbs', settings: {} },
    { type: 'product-details', id: 'pdp', settings: { show_sku: true, show_share: true } },
    { type: 'related-products', id: 'related', settings: { title: 'Compare / related', source: 'related', limit: 4, columns: 4 } },
  ],
};

const cart: PageDefinition = { template: 'cart', sections: [{ type: 'cart', id: 'cart' }] };
const wishlist: PageDefinition = { template: 'wishlist', sections: [{ type: 'wishlist', id: 'wishlist' }] };
const notFound: PageDefinition = { template: 'not-found', sections: [{ type: 'not-found', id: '404' }] };
const search: PageDefinition = { template: 'search', sections: [{ type: 'search', id: 'search' }] };
const login: PageDefinition = { template: 'login', sections: [{ type: 'auth', id: 'login', settings: { mode: 'login' } }] };
const registerPage: PageDefinition = { template: 'register', sections: [{ type: 'auth', id: 'register', settings: { mode: 'register' } }] };
const forgot: PageDefinition = { template: 'forgot-password', sections: [{ type: 'auth', id: 'forgot', settings: { mode: 'forgot' } }] };
const reset: PageDefinition = { template: 'reset-password', sections: [{ type: 'auth', id: 'reset', settings: { mode: 'reset' } }] };
const checkout: PageDefinition = { template: 'checkout', sections: [{ type: 'checkout', id: 'checkout' }] };
const orderSuccess: PageDefinition = { template: 'order-success', sections: [{ type: 'order-success', id: 'order-success' }] };
const accountProfile: PageDefinition = { template: 'account-profile', sections: [{ type: 'account-profile', id: 'account-profile' }] };
const accountOrders: PageDefinition = { template: 'account-orders', sections: [{ type: 'account-orders', id: 'account-orders' }] };
const accountOrder: PageDefinition = { template: 'account-order', sections: [{ type: 'account-order', id: 'account-order' }] };
const accountAddresses: PageDefinition = { template: 'account-addresses', sections: [{ type: 'account-addresses', id: 'account-addresses' }] };
const about: PageDefinition = { template: 'about', sections: [{ type: 'about', id: 'about', settings: {} }] };
const contact: PageDefinition = { template: 'contact', sections: [{ type: 'contact', id: 'contact', settings: {} }] };
const blog: PageDefinition = { template: 'blog', sections: [{ type: 'blog', id: 'blog', settings: {} }] };
const faqPage: PageDefinition = {
  template: 'faq',
  sections: [
    {
      type: 'faq',
      id: 'faq-page',
      settings: {
        title: 'Frequently asked',
        items: 'Where do you ship? | 40+ countries, duties calculated at checkout for a landed price.\nWhat is your returns policy? | 30 days for any unused item; we cover return shipping in the EU and US.\nHow fast is delivery? | Orders over $150 ship free within 24 hours, fully tracked.\nIs there a warranty? | Every build carries a 2-year warranty against defects.\nHow do I read the spec sheet? | Every product page lists weight, tolerances and runtime up front — no guesswork.',
      },
    },
  ],
};

export const voltageTemplates: TemplateMap = {
  home,
  category,
  product,
  cart,
  wishlist,
  'not-found': notFound,
  search,
  login,
  register: registerPage,
  'forgot-password': forgot,
  'reset-password': reset,
  checkout,
  'order-success': orderSuccess,
  'account-profile': accountProfile,
  'account-orders': accountOrders,
  'account-order': accountOrder,
  'account-addresses': accountAddresses,
  about,
  contact,
  blog,
  faq: faqPage,
};
