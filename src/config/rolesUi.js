/**
 * Spatie role names this deployment does not expose in the admin roles index (merchant accounts
 * are managed under Merchants, not as staff roles).
 */
export const ROLES_OMITTED_FROM_ADMIN_ROLES_INDEX = ['Merchant'];

/**
 * Roles not offered on the admin (staff) user form. Merchants are managed under Merchants.
 * 'Supplier' is the retired B2B role: it stays hidden here until the backend deletes it.
 */
export const ROLES_OMITTED_FROM_STAFF_USER_ROLE_PICKER = ['Merchant', 'Supplier'];
