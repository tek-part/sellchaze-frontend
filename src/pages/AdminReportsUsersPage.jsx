import { useTranslation } from 'react-i18next';
import ReportShell from '../components/admin/ReportShell';

export default function AdminReportsUsersPage() {
    const { t } = useTranslation();
    return (
        <ReportShell
            title={t('admin_reports_users', 'User Growth')}
            subtitle={t('admin_reports_users_sub', 'New signups over time, grouped by role.')}
            endpoint="/admin/reports/users"
            chartType="line"
        />
    );
}
