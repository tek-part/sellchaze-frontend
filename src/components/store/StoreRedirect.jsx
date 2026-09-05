import { Navigate } from 'react-router-dom';
import useStoreScope from '../../hooks/useStoreScope';

/**
 * Legacy-path redirect that stays inside the current store scope:
 * `/store/settings` → `/store/settings/general`, `/stores/7/onboarding` →
 * `/stores/7/overview`, and so on.
 */
export default function StoreRedirect({ to }) {
    const { uiBase } = useStoreScope();
    return <Navigate to={`${uiBase}/${to}`} replace />;
}
