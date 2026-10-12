export const currencyDigits = (currency) => new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
export function parseServicePrice(value, currency) {
    const digits = currencyDigits(currency);
    const normalized = String(value).trim().replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776)).replace(/٫/g, '.');
    if (!new RegExp(`^(?:0|[1-9][0-9]*)(?:\\.[0-9]{1,${digits}})?$`).test(normalized)) return null;
    const [whole, fraction = ''] = normalized.split('.');
    const minor = Number(whole + fraction.padEnd(digits, '0'));
    return Number.isSafeInteger(minor) && minor >= 0 && minor <= 99999999 ? minor : null;
}
