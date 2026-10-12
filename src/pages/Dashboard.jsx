import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeAccess } from '../lib/storeAccess';
import StorePerformancePanel from '../components/dashboard/StorePerformancePanel';

export default function Dashboard() {
    const { me, permissions = [] } = useOutletContext();
    const { i18n } = useTranslation();
    const roles = me?.roles ?? [];
    if (roles.includes('Admin') && !roles.some((role) => ['Merchant', 'Supplier', 'Customer', 'Employee'].includes(role))) return <Navigate to="/admin/dashboard" replace />;
    const access = storeAccess(roles, permissions);
    if (!access.hasStoreAccess) return <Navigate to="/community" replace />;
    const ar = i18n.language.startsWith('ar');
    return <div className="space-y-6">
        {access.canStoreAnalytics ? <StorePerformancePanel canOrders={access.canStoreOrders} canInventory={access.canStoreInventory} /> : <><div className="ws-dashboard-heading"><h1>{ar ? 'لوحة الإحصائيات' : 'Statistics dashboard'}</h1></div><p className="ws-note">{ar ? 'استخدم القائمة لإدارة أقسام المتجر المتاحة لحسابك.' : 'Use the navigation to manage the store sections available to your account.'}</p></>}
    </div>;
}
