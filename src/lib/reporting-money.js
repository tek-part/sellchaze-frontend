export function reportingCurrencyLabel(report, currency = 'USD', ar = false) {
    const code = report?.reporting_currency || currency;
    const equivalent = report?.equivalent || Object.keys(report?.totals_by_currency || {}).some(original => original !== code);
    return equivalent ? (ar ? `ما يعادل ${code}` : `${code} equivalent`) : code;
}

export function formatReportingMoney(value, report, currency = 'USD', ar = false) {
    if (value === null || value === undefined) return '—';
    const amount = new Intl.NumberFormat(ar ? 'ar-EG' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
    return `${amount} ${reportingCurrencyLabel(report, currency, ar)}`;
}
