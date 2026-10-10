const fields = ['email_enabled', 'sender_name', 'email_subject', 'email_body', 'whatsapp_enabled', 'whatsapp_body'];
export const deliveryFields = (settings) => Object.fromEntries(fields.map((key) => [key, settings[key] ?? '']));
export function addDeliveryOverride(settings, productId) {
    if (!Number.isSafeInteger(productId) || productId <= 0 || settings.overrides.some((entry) => entry.product_id === productId)) return settings;
    return { ...settings, overrides: [...settings.overrides, { product_id: productId, ...deliveryFields(settings) }] };
}
export function renderDeliveryTemplate(template, values) {
    return String(template ?? '').replace(/\{(customer_name|code_or_link|store_name|product_name)\}/g, (_token, key) => String(values[key] ?? ''));
}
