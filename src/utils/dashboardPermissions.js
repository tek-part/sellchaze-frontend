/** Dashboard overview stat keys → Spatie permission (aligned with SidebarNav). */
export const STAT_KEY_PERMISSION = {
    orders_out: 'orders-out',
    orders_in: 'orders-in',
    quotations_out: 'quotations-out',
    quotations_in: 'quotations-in',
    deals_out: 'deals-out',
    deals_in: 'deals-in',
    users: 'users-list',
    products: 'products-list',
    categories: 'categories-list',
    bundles: 'bundles-list',
};

export const SUPPLIER_STAT_KEY_PERMISSION = {
    orders_out: 'orders-out',
    orders_awaiting_quotation: 'orders-out',
    quotations_out: 'quotations-out',
    deals_in: 'deals-in',
};

export const PIPELINE_KEYS = [
    'orders_out',
    'orders_in',
    'quotations_out',
    'quotations_in',
    'deals_out',
    'deals_in',
];

export const PIPELINE_KEY_PERMISSION = {
    orders_out: 'orders-out',
    orders_in: 'orders-in',
    quotations_out: 'quotations-out',
    quotations_in: 'quotations-in',
    deals_out: 'deals-out',
    deals_in: 'deals-in',
};

export const SUPPLIER_PIPELINE_KEYS = ['orders_out', 'orders_awaiting_quotation', 'quotations_out', 'deals_in'];

export const SUPPLIER_PIPELINE_KEY_PERMISSION = {
    orders_out: 'orders-out',
    orders_awaiting_quotation: 'orders-out',
    quotations_out: 'quotations-out',
    deals_in: 'deals-in',
};

/** i18n keys for pipeline bar labels */
export const PIPELINE_LABEL_KEYS = {
    orders_out: 'stat_orders_out',
    orders_in: 'stat_orders_in',
    quotations_out: 'stat_quotations_out',
    quotations_in: 'stat_quotations_in',
    deals_out: 'stat_deals_out',
    deals_in: 'stat_deals_in',
};

export const SUPPLIER_PIPELINE_LABEL_KEYS = {
    orders_out: 'stat_orders_out_supplier',
    orders_awaiting_quotation: 'stat_orders_awaiting_quotation',
    quotations_out: 'stat_quotations_out',
    deals_in: 'stat_deals_in',
};

export function canViewOrderAggregates(can) {
    return can('orders-in') || can('orders-out') || can('orders-create');
}

export function filterPipelineKeysForUser(isSupplierMode, can) {
    const keys = isSupplierMode ? SUPPLIER_PIPELINE_KEYS : PIPELINE_KEYS;
    const map = isSupplierMode ? SUPPLIER_PIPELINE_KEY_PERMISSION : PIPELINE_KEY_PERMISSION;
    return keys.filter((k) => {
        const p = map[k];
        return p ? can(p) : false;
    });
}

export function dashboardHasAnyAnalyticsSection(isSupplierMode, can) {
    if (canViewOrderAggregates(can)) {
        return true;
    }
    return filterPipelineKeysForUser(isSupplierMode, can).length > 0;
}
