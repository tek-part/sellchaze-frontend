import { useTranslation } from 'react-i18next';
import ReportShell from '../components/admin/ReportShell';

export default function AdminReportsOrdersPage() {
    const { t } = useTranslation();
    return (
        <ReportShell
            title={t('admin_reports_orders', 'Orders Volume')}
            subtitle={t('admin_reports_orders_sub', 'Platform-wide order volume over time, by status.')}
            endpoint="/admin/reports/orders"
            chartType="bar"
        />
    );
}
