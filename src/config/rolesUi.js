/**
 * Spatie role names this deployment does not expose in admin UI (staff + suppliers only; no merchant tenants).
 */
export const ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX = ['Merchant'];

/** Roles not offered on admin user form — suppliers are managed under Suppliers; merchant role is unused here. */
export const ROLES_OMITTED_FROM_STAFF_USER_ROLE_PICKER = ['Supplier', 'Merchant'];
