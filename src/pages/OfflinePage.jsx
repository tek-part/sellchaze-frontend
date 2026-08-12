import AppStatusScreen from '../components/AppStatusScreen';

function hasToken() {
    return Boolean(localStorage.getItem('sellchase_access_token'));
}

export default function OfflinePage() {
    const authed = hasToken();

    return (
        <AppStatusScreen
            code="!"
            variant="offline"
            titleKey="error_offline_title"
            descriptionKey="error_offline_description"
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
