import { useNavigate } from 'react-router-dom';
import AppStatusScreen from '../components/AppStatusScreen';

function hasToken() {
    return Boolean(localStorage.getItem('sellchase_access_token'));
}

export default function ServiceUnavailablePage() {
    const navigate = useNavigate();
    const authed = hasToken();

    return (
        <AppStatusScreen
            code="503"
            variant="503"
            titleKey="error_503_title"
            descriptionKey="error_503_description"
            primaryAction={{
                to: authed ? '/dashboard' : '/login',
                labelKey: authed ? 'error_cta_dashboard' : 'error_cta_login',
            }}
            secondaryAction={{
                labelKey: 'error_cta_retry',
                onClick: () => window.location.reload(),
            }}
        />
    );
}
