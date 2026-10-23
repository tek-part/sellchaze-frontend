import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api, { setTokens } from '../../api/client';
import { loginErrorMessage } from '../../utils/apiError';
import { savedPlatformReferral, clearPlatformReferral } from '../../shared/marketing/platform-referral';
import { useGoogleOAuthClientId } from '../../hooks/useGoogleOAuthClientId';
import { OrDivider } from './AuthFields';

/**
 * "Continue with Google" for sign-in and sign-up. A new Google account is created as a merchant
 * (Sellchaze is a store builder); an existing one simply signs in.
 */
export default function GoogleAuthButton({ redirectTo, onError, onBusy, text = 'continue_with' }) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { clientId, resolved } = useGoogleOAuthClientId();

    const handleSuccess = useCallback(async (cred) => {
        onError?.('');
        onBusy?.(true);
        try {
            const { data } = await api.post('/auth/google', {
                id_token: cred.credential,
                registration_role: 'Merchant',
                platform_referral_code: savedPlatformReferral(),
            });
            clearPlatformReferral();
            if (data.access_token && data.refresh_token) {
                setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
            }
            if (data.pending_approval) {
                toast.success(data.message || t('auth_register_pending_toast'));
                navigate('/pending-approval', { replace: true });
                return;
            }
            toast.success(t('toast_welcome'));
            navigate(data.onboarding?.next || redirectTo, { replace: true });
        } catch (err) {
            onError?.(loginErrorMessage(err, t) || t('google_login_failed'));
        } finally {
            onBusy?.(false);
        }
    }, [navigate, onBusy, onError, redirectTo, t]);

    const handleError = useCallback(() => onError?.(t('google_login_failed')), [onError, t]);

    // Without a configured client there is no Google option, and no "or" divider either.
    if (!resolved || !clientId) return null;
    return (
        <>
        <GoogleOAuthProvider clientId={clientId}>
            <div className="flex justify-center [&>div]:flex [&>div]:w-full [&>div]:justify-center">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    theme="outline"
                    size="large"
                    text={text}
                    shape="rectangular"
                    width="400"
                    locale={i18n.language?.startsWith('ar') ? 'ar' : 'en'}
                />
            </div>
        </GoogleOAuthProvider>
        <OrDivider />
        </>
    );
}
