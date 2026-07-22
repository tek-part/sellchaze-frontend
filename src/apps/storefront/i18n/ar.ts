/**
 * Arabic storefront copy.
 *
 * Written as Arabic retail language, not as a word-for-word rendering of the English. Where a
 * literal translation would read as a translation, the idiomatic phrasing wins: "أضف إلى السلة"
 * rather than a calque of "add to cart", "الترتيب حسب" rather than a literal "sort by", "نفد
 * المخزون" rather than "مباع".
 *
 * Typed against the English shape, so a key added on one side fails the build until the other is
 * written — the mechanism that keeps a locale from silently falling back to English in production.
 */
import type { TranslationShape } from './en';

export const ar: TranslationShape = {
  common: {
    storeName: 'المتجر',
    loading: 'جارٍ التحميل',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    remove: 'إزالة',
    edit: 'تعديل',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    viewAll: 'عرض الكل',
    readMore: 'اقرأ المزيد',
    learnMore: 'اعرف المزيد',
    optional: 'اختياري',
    required: 'مطلوب',
  },

  nav: {
    home: 'الرئيسية',
    shop: 'تسوّق',
    about: 'من نحن',
    blog: 'المدونة',
    contact: 'تواصل معنا',
    primary: 'التنقل الرئيسي',
    footer: 'روابط التذييل',
    browse: 'تصفّح',
    shopByCategory: 'تسوّق حسب الفئة',
    allProducts: 'كل المنتجات',
    newArrivals: 'وصل حديثًا',
    bestSellers: 'الأكثر مبيعًا',
    collections: 'التشكيلات',
    categories: 'الفئات',
    brands: 'العلامات التجارية',
    skipToContent: 'تخطَّ إلى المحتوى',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
  },

  header: {
    search: 'بحث',
    account: 'حسابي',
    wishlist: 'المفضلة',
    cart: 'السلة',
    cartWithCount: 'السلة، {{count}} من المنتجات',
    language: 'اللغة',
    changeLanguage: 'تغيير اللغة',
  },

  footer: {
    keepInTouch: 'ابقَ على تواصل',
    signupNote: 'وصولات جديدة وأدلة مختارة وعروض بين الحين والآخر — دون إزعاج.',
    signUp: 'اشترك',
    emailLabel: 'البريد الإلكتروني',
    social: 'وسائل التواصل',
    payments: 'وسائل الدفع المقبولة',
    shipsWorldwide: 'شحن إلى جميع أنحاء العالم · الأسعار بـ {{currency}}',
    allRightsReserved: '© {{year}} {{store}}. جميع الحقوق محفوظة.',
    privacy: 'الخصوصية',
    terms: 'الشروط',
    accessibility: 'إتاحة الوصول',
    help: 'المساعدة',
    company: 'الشركة',
    shopColumn: 'تسوّق',
    accountColumn: 'الحساب',
  },

  shop: {
    filters: 'تصفية',
    filtersWithCount: 'تصفية ({{count}})',
    clearAll: 'مسح الكل',
    clearAllWithCount: 'مسح الكل ({{count}})',
    sortBy: 'الترتيب حسب',
    viewMode: 'طريقة العرض',
    grid: 'شبكة',
    list: 'قائمة',
    resultCount: '{{shown}} من {{total}} منتجًا',
    showResults: 'عرض {{count}} نتيجة',
    availability: 'التوفّر',
    inStockOnly: 'المتوفر فقط',
    onSale: 'عليه تخفيض',
    price: 'السعر',
    category: 'الفئة',
    brand: 'العلامة التجارية',
    colour: 'اللون',
    size: 'المقاس',
    material: 'الخامة',
    tag: 'الوسم',
    rating: 'التقييم',
    discount: 'الخصم',
    ratingAndUp: '{{value}} نجوم فأكثر',
    discountOrMore: 'خصم {{value}}% فأكثر',
    removeFilter: 'إزالة عامل التصفية',
    priceMin: '{{label}} — الحد الأدنى',
    priceMax: '{{label}} — الحد الأعلى',
    noMatches: 'لا توجد منتجات مطابقة لعوامل التصفية',
    noMatchesHint: 'جرّب توسيع نطاق السعر أو إزالة أحد عوامل التصفية.',
    nothingYet: 'لا يوجد شيء هنا بعد',
    nothingYetHint: 'قطع جديدة في الطريق — عاود الزيارة قريبًا.',
  },

  sort: {
    featured: 'المختارة',
    priceAsc: 'السعر: من الأقل إلى الأعلى',
    priceDesc: 'السعر: من الأعلى إلى الأقل',
    nameAsc: 'الاسم: أ – ي',
    nameDesc: 'الاسم: ي – أ',
    ratingDesc: 'الأعلى تقييمًا',
  },

  product: {
    addToCart: 'أضف إلى السلة',
    addToWishlist: 'أضف إلى المفضلة',
    removeFromWishlist: 'إزالة من المفضلة',
    quickView: 'عرض سريع',
    compare: 'قارن',
    soldOut: 'نفد المخزون',
    inStock: 'متوفر',
    quantity: 'الكمية',
    share: 'مشاركة',
    reviews: '{{count}} تقييمًا',
    ratedOutOf: 'التقييم {{rating}} من 5، بناءً على {{count}} تقييمًا',
  },

  cart: {
    title: 'سلة التسوق',
    empty: 'سلتك فارغة',
    emptyHint: 'ستظهر هنا القطع التي تضيفها.',
    subtotal: 'المجموع الفرعي',
    checkout: 'إتمام الشراء',
    viewBag: 'عرض السلة',
    continueShopping: 'مواصلة التسوق',
    freeShippingProgress: 'يفصلك {{amount}} عن الشحن المجاني',
    freeShippingReached: 'حصلت على الشحن المجاني',
    taxNote: 'تُحتسب رسوم الشحن والضرائب عند إتمام الشراء',
  },

  pagination: {
    label: 'تنقّل بين الصفحات',
    page: 'صفحة {{page}}',
    previousPage: 'الصفحة السابقة',
    nextPage: 'الصفحة التالية',
  },

  search: {
    title: 'البحث',
    placeholder: 'ابحث في المتجر',
    resultsFor: 'نتائج البحث عن «{{query}}»',
    noResults: 'لا توجد نتائج',
    noResultsHint: 'لم نعثر على شيء يطابق «{{query}}».',
    popular: 'الأكثر بحثًا',
    recent: 'عمليات البحث الأخيرة',
  },

  states: {
    errorTitle: 'حدث خطأ ما',
    errorHint: 'تعذّر تحميل هذا المحتوى الآن. يُرجى المحاولة مرة أخرى.',
    loadFailed: 'تعذّر تحميل المنتجات',
    notFoundTitle: 'الصفحة غير موجودة',
    notFoundHint: 'ربما نُقلت هذه الصفحة أو أن الرابط لم يعد صالحًا.',
    backToShop: 'العودة إلى المتجر',
  },

  newsletter: {
    title: 'اشترك ليصلك جديدنا',
    invalid: 'يُرجى إدخال بريد إلكتروني صحيح.',
    saved: 'حُفظ على هذا الجهاز. خدمة الاشتراك غير مفعّلة بعد — تواصل معنا لإضافتك إلى القائمة.',
    error: 'تعذّر حفظ بريدك على هذا الجهاز. يُرجى التواصل معنا بدلًا من ذلك.',
    subscribed: 'تم اشتراكك — شكرًا لانضمامك.',
    subscribe: 'اشترك',
    subscribing: 'جارٍ الاشتراك…',
  },

  curated: {
    allTitle: 'كل المنتجات',
    allDescription: 'كل ما هو متوفر لدينا الآن، في مكان واحد.',
    newTitle: 'وصل حديثًا',
    newDescription: 'أحدث ما أُضيف إلى التشكيلة، الأجدد أولًا.',
    bestTitle: 'الأكثر مبيعًا',
    bestDescription: 'القطع الأكثر تقييمًا لدينا، مرتّبة حسب آراء العملاء.',
  },
  policy: {
    lastUpdated: 'آخر تحديث {{date}}',
    noticeTitle: 'نموذج استرشادي — يُراجَع قبل النشر.',
    noticeBody:
      'هذه الوثيقة نقطة انطلاق مرفقة مع القالب. اعرِضها على مختصّ لمراجعتها في ضوء طبيعة نشاطك والقانون المعمول به لديك، ثم عدّلها بما يطابق واقعك. وهي ليست استشارة قانونية.',
    questions: 'هل لديك سؤال عن هذه السياسة؟ يسعدنا مساعدتك.',
  },
  blog: {
    title: 'المدوّنة',
    subtitle: 'مقالات وأدلة عن الخامات والعناية بها، وعن الأشياء المصنوعة لتدوم.',
    readingTime: 'قراءة {{count}} دقائق',
    onThisPage: 'في هذه الصفحة',
    relatedReading: 'مقالات ذات صلة',
    trending: 'الأكثر قراءة',
    tags: 'الوسوم',
    searchArticles: 'ابحث في المقالات',
    noArticles: 'لا توجد مقالات',
    clearFilters: 'مسح عوامل التصفية',
    shareOnX: 'مشاركة على X',
    shareOnFacebook: 'مشاركة على فيسبوك',
    shareByEmail: 'مشاركة عبر البريد',
  },
};
