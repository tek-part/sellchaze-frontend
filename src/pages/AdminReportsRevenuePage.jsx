import { useTranslation } from 'react-i18next';
import ReportShell from '../components/admin/ReportShell';

export default function AdminReportsRevenuePage() {
    const { t } = useTranslation();
    return (
        <ReportShell
            title={t('admin_reports_revenue', 'Revenue')}
            subtitle={t('admin_reports_revenue_sub', 'Total accepted deal value (USD) over time.')}
            endpoint="/admin/reports/revenue"
            chartType="line"
            valueKey="amount"
            formatValue={(_, v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : v)}
        />
    );
}
