import { useTranslation } from 'react-i18next';
import ReportShell from '../components/admin/ReportShell';

export default function AdminReportsTicketsPage() {
    const { t } = useTranslation();
    return (
        <ReportShell
            title={t('admin_reports_tickets', 'Tickets & Support')}
            subtitle={t('admin_reports_tickets_sub', 'Ticket volume, resolution time, and status breakdown.')}
            endpoint="/admin/reports/tickets"
            chartType="bar"
        />
    );
}
