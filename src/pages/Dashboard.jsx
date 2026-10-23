import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { storeAccess } from '../lib/storeAccess';
import StorePerformancePanel from '../components/dashboard/StorePerformancePanel';
import useDashboardGuide from '../components/dashboard/useDashboardGuide';
import { DashboardPromotions, DashboardSetupGuide, DashboardResources, DashboardGuideDialog, useDashboardGuideDialog } from '../components/dashboard/DashboardGuide';

export default function Dashboard() {
    const { me, permissions = [] } = useOutletContext();
    const { i18n } = useTranslation();
    const roles = me?.roles ?? [];
    if (roles.includes('Admin') && !roles.some((role) => ['Merchant', 'Customer', 'Employee'].includes(role))) return <Navigate to="/admin/dashboard" replace />;
    const access = storeAccess(roles, permissions);
    if (!access.hasStoreAccess) return <Navigate to="/community" replace />;
    return <MerchantDashboard key={me?.id} access={access} ar={i18n.language.startsWith('ar')} />;
}
function MerchantDashboard({ access, ar }) {
    const guide = useDashboardGuide(access.canStoreSettings);const help = useDashboardGuideDialog();
    const setup = access.canStoreSettings ? <DashboardSetupGuide guide={guide} access={access} ar={ar} onHelp={help.open} /> : null;
    const resources = access.canStoreSettings ? <DashboardResources guide={guide} ar={ar} onHelp={help.open} /> : null;
    return <div className="ws-merchant-dashboard">
        {access.canStoreSettings ? <DashboardPromotions access={access} ar={ar} /> : null}
        {access.canStoreAnalytics ? <StorePerformancePanel canOrders={access.canStoreOrders} canInventory={access.canStoreInventory} beforeMetrics={setup}>{resources}</StorePerformancePanel> : <><div className="ws-dashboard-heading"><h1>{ar ? 'لوحة الإحصائيات' : 'Statistics dashboard'}</h1></div>{setup}<p className="ws-note">{ar ? 'استخدم القائمة لإدارة أقسام المتجر المتاحة لحسابك.' : 'Use the navigation to manage the store sections available to your account.'}</p>{resources}</>}
        <DashboardGuideDialog selected={help.selected} onClose={help.close} access={access} ar={ar} />
    </div>;
}
