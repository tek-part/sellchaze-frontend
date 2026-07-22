import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../api/client';
import AppStatusScreen from '../components/AppStatusScreen';

export default function SessionExpiredPage() {
    const navigate = useNavigate();

    useEffect(() => {
        clearTokens();
    }, []);

    return (
        <AppStatusScreen
            code="401"
            variant="401"
            titleKey="error_401_title"
            descriptionKey="error_401_description"
            primaryAction={{
                to: '/login',
                labelKey: 'error_cta_login',
            }}
            secondaryAction={{
                labelKey: 'error_cta_back',
                onClick: () => {
                    if (window.history.length > 1) {
                        navigate(-1);
                    } else {
                        navigate('/login', { replace: true });
                    }
                },
            }}
        />
    );
}
