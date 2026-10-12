import { useTranslation } from 'react-i18next';

const copy = {
    statisticsDashboard: ['لوحة الإحصائيات', 'Statistics dashboard'],
    quickAccess: ['الوصول السريع', 'Quick access'], storeDesign: ['تصميم المتجر', 'Store design'], company: ['مساحة الشركة', 'Company'], procurement: ['شبكة المشتريات', 'Procurement'], hello: ['مرحبًا', 'Hello'], language: ['تغيير اللغة', 'Change language'],
    search: ['ابحث في الأقسام…', 'Search sections…'], searchTitle: ['بحث في لوحة التحكم', 'Search your workspace'],
    searchHint: ['ابحث عن صفحة أو إعداد وانتقل إليه مباشرة.', 'Find a page or setting and jump straight to it.'],
    noResults: ['لا توجد أقسام مطابقة. جرّب كلمة أخرى.', 'No matching sections. Try another word.'],
    navigation: ['التنقل الرئيسي', 'Main navigation'], appearance: ['المظهر', 'Appearance'],
    openNavigation: ['افتح القائمة', 'Open navigation'],
    light: ['فاتح', 'Light'], dark: ['داكن', 'Dark'], system: ['حسب الجهاز', 'System'],
    refresh: ['إعادة تحميل الصفحة', 'Reload page'], help: ['المساعدة والدعم', 'Help & support'],
    workspace: ['مساحة العمل', 'Workspace'], admin: ['إدارة المنصة', 'Platform administration'],
    commerce: ['إحصاءات المتجر', 'Store overview'], business: ['الأعمال والعلاقات', 'Business & partners'],
    welcome: ['مرحبًا، {{name}}', 'Welcome, {{name}}'], welcomeHint: ['نظرة واضحة على متجرك وأعمالك، وكل ما تحتاجه في مكان واحد.', 'A clear view of your store and business, with everything in one place.'],
    allTime: ['منذ إنشاء المتجر', 'All time'], storeRevenue: ['إيراد الطلبات المسلّمة', 'Delivered order revenue'],
    today: ['اليوم', 'Today'], week: ['هذا الأسبوع', 'This week'], month: ['هذا الشهر', 'This month'],
    totalOrders: ['إجمالي الطلبات', 'Total orders'], newOrders: ['طلبات جديدة', 'New orders'],
    delivered: ['طلبات مسلّمة', 'Delivered orders'], average: ['متوسط الطلب المسلّم', 'Average delivered order'],
    customers: ['العملاء', 'Customers'], returning: ['عملاء متكررون', 'Returning customers'],
    items: ['الوحدات المباعة', 'Items sold'], cancelled: ['طلبات ملغاة', 'Cancelled orders'],
    topProducts: ['المنتجات الأكثر مبيعًا', 'Best selling products'], orderStatus: ['الطلبات حسب الحالة', 'Orders by status'],
    openAnalytics: ['كل الإحصاءات', 'All analytics'], salesHint: ['الإيراد والمبيعات يحتسبان الطلبات المسلّمة فقط. بقية الأعداد تشمل كل الفترة.', 'Revenue and sales count delivered orders only. Other counts cover all time.'],
    retry: ['إعادة المحاولة', 'Try again'], storeUnavailable: ['ملخص المتجر غير متاح حاليًا.', 'Your store overview is currently unavailable.'],
    setupStore: ['إعداد المتجر', 'Set up your store'], loading: ['جارٍ تحميل إحصاءات المتجر…', 'Loading store overview…'],
    product: ['المنتج', 'Product'], sold: ['المباع', 'Sold'], revenue: ['الإيراد', 'Revenue'],
    emptyProducts: ['ستظهر المنتجات الأكثر مبيعًا هنا عند تسليم أول طلب.', 'Best sellers will appear here after your first delivered order.'],
    setup: ['دليل إعداد حسابك', 'Account setup guide'], setupHint: ['خطوات بسيطة لتجهيز نشاطك والانطلاق.', 'Simple steps to get your business ready.'],
    complete: ['مكتمل', 'Complete'], next: ['ابدأ الخطوة', 'Start step'], quickHint: ['انتقل مباشرة إلى أدواتك اليومية', 'Jump straight to your everyday tools'],
    collapse: ['إخفاء القائمة الجانبية', 'Hide sidebar'], expand: ['إظهار القائمة الجانبية', 'Show sidebar'],
};
export default function useWorkspaceCopy() {
    const { i18n } = useTranslation();
    return (key, values = {}) => {
        const value = copy[key]?.[i18n.language.startsWith('ar') ? 0 : 1] ?? key;
        return value.replace(/\{\{(\w+)\}\}/g, (_, name) => String(values[name] ?? ''));
    };
}
