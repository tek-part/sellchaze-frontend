import { useTranslation } from 'react-i18next';
import { formatReportingMoney } from '../lib/reporting-money';

export default function ReportingMoney({ value, report, currency = 'USD', average = false, breakdownOnly = false }) {
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const originals = Object.entries(report?.totals_by_currency || {});
    const showOriginals = originals.length > 1 || report?.equivalent || report?.complete === false;
    return <span className="ws-reporting-money">
        {!breakdownOnly ? <span>{formatReportingMoney(value, report, currency, ar)}</span> : null}
        {showOriginals ? <small className="ws-dt-sub" style={{ display: 'block' }}>{ar ? 'الأصل: ' : 'Original: '}{originals.map(([code, bucket]) => formatReportingMoney(average ? bucket.average : bucket.total, null, code, ar)).join(' + ')}</small> : null}
        {report?.complete === false ? <small className="ws-dt-sub" style={{ display: 'block' }}>{ar ? 'المعادل غير متاح: سعر تحويل غير محفوظ' : 'Equivalent unavailable: missing pinned rate'}</small> : null}
    </span>;
}
