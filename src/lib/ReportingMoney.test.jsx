import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ReportingMoney from '../components/ReportingMoney';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
const report = { reporting_currency: 'KWD', equivalent: true, complete: true, totals_by_currency: { USD: { total: '100.00', average: '100.00' }, KWD: { total: '10.00', average: '10.00' } } };

describe('reporting money presentation', () => {
    it('shows the equivalent and the retained original currency breakdown', () => {
        const html = renderToStaticMarkup(<ReportingMoney value="40.82" report={report} />);
        expect(html).toContain('40.82 KWD equivalent');
        expect(html).toContain('100.00 USD + 10.00 KWD');
    });
    it('shows unavailable for an unknown equivalent without turning it into zero', () => {
        const html = renderToStaticMarkup(<ReportingMoney value={null} report={{ ...report, complete: false }} />);
        expect(html).toContain('—');
        expect(html).toContain('Equivalent unavailable: missing pinned rate');
        expect(html).toContain('100.00 USD + 10.00 KWD');
        expect(html).not.toContain('0.00 KWD equivalent');
    });
});
