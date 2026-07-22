import { useNavigate } from 'react-router-dom';
import AppStatusScreen from '../components/AppStatusScreen';

function hasToken() {
    return Boolean(localStorage.getItem('sellchase_access_token'));
}

/**
 * @param {{ onRetry?: () => void }} [props] — when set (e.g. from error boundary), retry resets UI without full reload
 */
export default function ServerErrorPage({ onRetry } = {}) {
    const navigate = useNavigate();
    const authed = hasToken();

    return (
        <AppStatusScreen
            code="500"
            variant="500"
            titleKey="error_500_title"
            descriptionKey="error_500_description"
            primaryAction={{
                to: authed ? '/dashboard' : '/login',
                labelKey: authed ? 'error_cta_dashboard' : 'error_cta_login',
            }}
            secondaryAction={{
                labelKey: 'error_cta_retry',
                onClick: () => {
                    if (typeof onRetry === 'function') {
                        onRetry();
                    } else {
                        window.location.reload();
                    }
                },
            }}
        />
    );
}
