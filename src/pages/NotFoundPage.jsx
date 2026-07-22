import { useNavigate } from 'react-router-dom';
import AppStatusScreen from '../components/AppStatusScreen';

function hasToken() {
    return Boolean(localStorage.getItem('sellchase_access_token'));
}

export default function NotFoundPage() {
    const navigate = useNavigate();
    const authed = hasToken();

    return (
        <AppStatusScreen
            code="404"
            variant="404"
            titleKey="error_404_title"
            descriptionKey="error_404_description"
            primaryAction={{
                to: authed ? '/dashboard' : '/login',
                labelKey: authed ? 'error_cta_dashboard' : 'error_cta_login',
            }}
            secondaryAction={{
                labelKey: 'error_cta_back',
                onClick: () => {
                    if (window.history.length > 1) {
                        navigate(-1);
                    } else {
                        navigate(authed ? '/dashboard' : '/login', { replace: true });
                    }
                },
            }}
        />
    );
}
