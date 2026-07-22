/**
 * English storefront copy — the chrome and shared-page vocabulary.
 *
 * Scope: strings the SHARED layer renders (header, footer, cart, filters, forms, states). Long-form
 * editorial — policies, articles, company pages, demo catalogues — lives in `content/` and is
 * localised there, because it is prose rather than interface labels and reads badly when chopped
 * into keys.
 *
 * Keys are grouped by surface and named for meaning, not for the English wording, so a rewrite in
 * one language never forces a key rename in the other.
 */
export const en = {
  common: {
    storeName: 'Store',
    loading: 'Loading',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    remove: 'Remove',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    viewAll: 'View all',
    readMore: 'Read more',
    learnMore: 'Learn more',
    optional: 'Optional',
    required: 'Required',
  },

  nav: {
    home: 'Home',
    shop: 'Shop',
    about: 'About us',
    blog: 'Blog',
    contact: 'Contact',
    primary: 'Primary',
    footer: 'Footer',
    browse: 'Browse',
    shopByCategory: 'Shop by category',
    allProducts: 'All products',
    newArrivals: 'New arrivals',
    bestSellers: 'Best sellers',
    collections: 'Collections',
    categories: 'Categories',
    brands: 'Brands',
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  header: {
    search: 'Search',
    account: 'Account',
    wishlist: 'Wishlist',
    cart: 'Cart',
    cartWithCount: 'Cart, {{count}} items',
    language: 'Language',
    changeLanguage: 'Change language',
  },

  footer: {
    keepInTouch: 'Keep in touch',
    signupNote: 'New arrivals, guides and the occasional offer. No noise.',
    signUp: 'Sign up',
    emailLabel: 'Email address',
    social: 'Social media',
    payments: 'Accepted payment methods',
    shipsWorldwide: 'Ships worldwide · Prices in {{currency}}',
    allRightsReserved: '© {{year}} {{store}}. All rights reserved.',
    privacy: 'Privacy',
    terms: 'Terms',
    accessibility: 'Accessibility',
    help: 'Help',
    company: 'Company',
    shopColumn: 'Shop',
    accountColumn: 'Account',
  },

  shop: {
    filters: 'Filters',
    filtersWithCount: 'Filters ({{count}})',
    clearAll: 'Clear all',
    clearAllWithCount: 'Clear all ({{count}})',
    sortBy: 'Sort by',
    viewMode: 'View mode',
    grid: 'Grid',
    list: 'List',
    resultCount: '{{shown}} of {{total}} products',
    showResults: 'Show {{count}} results',
    availability: 'Availability',
    inStockOnly: 'In stock only',
    onSale: 'On sale',
    price: 'Price',
    category: 'Category',
    brand: 'Brand',
    colour: 'Colour',
    size: 'Size',
    material: 'Material',
    tag: 'Tag',
    rating: 'Rating',
    discount: 'Discount',
    ratingAndUp: '{{value}} stars & up',
    discountOrMore: '{{value}}% or more',
    removeFilter: 'Remove filter',
    priceMin: '{{label}} — minimum',
    priceMax: '{{label}} — maximum',
    noMatches: 'No products match those filters',
    noMatchesHint: 'Try widening the price range or clearing a filter.',
    nothingYet: 'Nothing here yet',
    nothingYetHint: 'New stock is on the way — check back shortly.',
  },

  sort: {
    featured: 'Featured',
    priceAsc: 'Price: low to high',
    priceDesc: 'Price: high to low',
    nameAsc: 'Name: A–Z',
    nameDesc: 'Name: Z–A',
    ratingDesc: 'Top rated',
  },

  product: {
    addToCart: 'Add to cart',
    addToWishlist: 'Add to wishlist',
    removeFromWishlist: 'Remove from wishlist',
    quickView: 'Quick view',
    compare: 'Compare',
    soldOut: 'Sold out',
    inStock: 'In stock',
    quantity: 'Quantity',
    share: 'Share',
    reviews: '{{count}} reviews',
    ratedOutOf: 'Rated {{rating}} out of 5, {{count}} reviews',
  },

  cart: {
    title: 'Your bag',
    empty: 'Your bag is empty',
    emptyHint: 'Pieces you add will appear here.',
    subtotal: 'Subtotal',
    checkout: 'Checkout',
    viewBag: 'View bag',
    continueShopping: 'Continue shopping',
    freeShippingProgress: '{{amount}} away from free shipping',
    freeShippingReached: 'You have free shipping',
    taxNote: 'Shipping & taxes calculated at checkout',
  },

  pagination: {
    label: 'Pagination',
    page: 'Page {{page}}',
    previousPage: 'Previous page',
    nextPage: 'Next page',
  },

  search: {
    title: 'Search',
    placeholder: 'Search the store',
    resultsFor: 'Results for “{{query}}”',
    noResults: 'No results',
    noResultsHint: 'We couldn’t find anything for “{{query}}”.',
    popular: 'Popular',
    recent: 'Recent searches',
  },

  states: {
    errorTitle: 'Something went wrong',
    errorHint: 'We couldn’t load this right now. Please try again.',
    loadFailed: 'Couldn’t load products',
    notFoundTitle: 'Page not found',
    notFoundHint: 'That page may have moved, or the link may be out of date.',
    backToShop: 'Back to shop',
  },

  newsletter: {
    title: 'Get new writing by email',
    invalid: 'Enter a valid email address.',
    saved: 'Saved on this device. Sign-up isn’t connected yet — contact us to be added to the list.',
    error: 'We couldn’t save your address on this device. Please contact us instead.',
    subscribed: 'You’re subscribed — thanks for joining.',
    subscribe: 'Subscribe',
    subscribing: 'Signing up…',
  },

  curated: {
    allTitle: 'Shop all',
    allDescription: 'Every piece currently available, in one place.',
    newTitle: 'New arrivals',
    newDescription: 'The latest additions to the collection, newest first.',
    bestTitle: 'Best sellers',
    bestDescription: 'Our most-reviewed pieces, ranked by customer feedback.',
  },
  policy: {
    lastUpdated: 'Last updated {{date}}',
    noticeTitle: 'Template — review before publishing.',
    noticeBody:
      'This document is a starting point provided with your theme. Have it reviewed against your own operations and the law that applies to you, then edit it to match. It is not legal advice.',
    questions: 'Questions about this policy? We’re happy to help.',
  },
  blog: {
    title: 'The journal',
    subtitle: 'Essays, guides and notes on materials, care and the long life of well-made things.',
    readingTime: '{{count}} min read',
    onThisPage: 'On this page',
    relatedReading: 'Related reading',
    trending: 'Trending',
    tags: 'Tags',
    searchArticles: 'Search articles',
    noArticles: 'No articles found',
    clearFilters: 'Clear filters',
    shareOnX: 'Share on X',
    shareOnFacebook: 'Share on Facebook',
    shareByEmail: 'Share by email',
  },
} as const;

/**
 * Structural shape of the copy: same keys, any string value.
 *
 * `typeof en` would make each value a LITERAL type (`'Home'`), so a translation could only satisfy
 * it by repeating the English. This widens the leaves to `string` while keeping the key structure
 * exact — so a missing or misspelled key still fails the build, which is the check that matters.
 */
export type TranslationShape = {
  readonly [Group in keyof typeof en]: { readonly [Key in keyof (typeof en)[Group]]: string };
};
