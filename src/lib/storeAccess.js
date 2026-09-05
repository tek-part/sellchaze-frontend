/**
 * Type-based store access. A Merchant/Supplier OWNS exactly one store and
 * sees its full dashboard by virtue of their account type — no per-feature
 * permission needed. Granular store.* permissions still apply to their
 * employees and to admin-internal users (who are not owners themselves).
 *
 * Shared by the global SidebarNav (which decides whether to show the store
 * section at all) and StoreLayout / StoreSidebar (which gate each item).
 */
export function storeAccess(roles = [], permissions = []) {
    const can = (p) => permissions.includes(p);
    const isStoreOwner = Array.isArray(roles) && roles.some((r) => ['Merchant', 'Supplier'].includes(r));
    const canStoreView = isStoreOwner || can('store.view');
    const canStoreProducts = isStoreOwner || can('store.products.manage');
    const canStoreCategories = isStoreOwner || can('store.categories.manage');
    const canStoreOrders = isStoreOwner || can('store.orders.manage');
    const canStoreCoupons = isStoreOwner || can('store.coupons.manage');
    const canStoreReviews = isStoreOwner || can('store.reviews.manage');
    const canStoreAnalytics = isStoreOwner || can('store.analytics.view');
    const canStoreThemes = isStoreOwner || can('store.themes.manage');
    const canStorePages = isStoreOwner || can('store.pages.manage');
    const canStoreMenus = isStoreOwner || can('store.menus.manage');
    const canStoreSettings = isStoreOwner || can('store.settings.manage');
    const canStorePayments = isStoreOwner || can('store.settings.manage');
    const storeMyGroup = canStoreSettings || canStorePayments || canStoreThemes || canStorePages || canStoreMenus;
    const storeCatalogGroup = canStoreProducts || canStoreCategories;
    const storeSalesGroup = canStoreOrders || canStoreCoupons;
    const hasStoreAccess = canStoreView || storeMyGroup || storeCatalogGroup
        || storeSalesGroup || canStoreReviews || canStoreAnalytics;

    return {
        isStoreOwner,
        canStoreView,
        canStoreProducts,
        canStoreCategories,
        canStoreOrders,
        canStoreCoupons,
        canStoreReviews,
        canStoreAnalytics,
        canStoreThemes,
        canStorePages,
        canStoreMenus,
        canStoreSettings,
        canStorePayments,
        storeMyGroup,
        storeCatalogGroup,
        storeSalesGroup,
        hasStoreAccess,
    };
}

/**
 * Every flag switched on — the admin console (`/stores/:id/*`, gated by
 * `stores-edit`) manages any store in full, regardless of store.* grants.
 */
export function fullStoreAccess() {
    const all = storeAccess(['Merchant'], []);
    return { ...all, isStoreOwner: false };
}

export default storeAccess;
