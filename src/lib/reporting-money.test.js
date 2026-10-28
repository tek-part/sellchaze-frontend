import { describe, expect, it } from 'vitest';
import { formatReportingMoney, reportingCurrencyLabel } from './reporting-money';

const report = { reporting_currency: 'KWD', equivalent: true, complete: true, totals_by_currency: { USD: { total: '100.00' }, KWD: { total: '10.00' } } };

describe('reporting currency equivalents', () => {
    it('labels a normalized scalar with its pinned reporting currency', () => {
        expect(formatReportingMoney('40.82', report)).toBe('40.82 KWD equivalent');
        expect(reportingCurrencyLabel(report, 'USD', true)).toBe('ما يعادل KWD');
    });
    it('keeps unknown equivalent values unavailable and native zero visible', () => {
        expect(formatReportingMoney(null, { ...report, complete: false })).toBe('—');
        expect(formatReportingMoney('0.00', null, 'USD')).toBe('0.00 USD');
    });
    it('labels foreign original buckets even when there is no pinned conversion policy', () => {
        expect(reportingCurrencyLabel({ ...report, equivalent: false })).toBe('KWD equivalent');
    });
});
