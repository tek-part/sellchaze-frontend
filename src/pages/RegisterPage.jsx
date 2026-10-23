import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api, { setTokens } from '../api/client';
import { loginErrorMessage } from '../utils/apiError';
import { savedPlatformReferral, clearPlatformReferral } from '../shared/marketing/platform-referral';
import { safeRedirect } from '../lib/safeRedirect';
import { marketingUrl } from '../config/marketing';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { Field, FormError, PasswordInput, PasswordStrength, SubmitButton, inputClass } from '../components/auth/AuthFields';

/** Preview of the store's subdomain; the server makes the final, unique slug. */
export function storeSlugPreview(name) {
    const slug = name
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    return slug || 'yourstore';
}

export default function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = safeRedirect(searchParams.get('redirect'));
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [storeName, setStoreName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const slug = useMemo(() => storeSlugPreview(storeName), [storeName]);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', {
                name,
                email,
                password,
                // One password field with show/hide; the API still expects a confirmation.
                password_confirmation: password,
                registration_role: 'Merchant',
                company_name: storeName,
                store_name: storeName,
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
            setError(loginErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title={t('auth_register_store_title')}
            subtitle={t('auth_register_store_subtitle')}
            footer={<>{t('auth_have_store')} <Link to="/login" className="font-semibold text-brand hover:underline">{t('auth_sign_in_link')}</Link></>}
        >
            <GoogleAuthButton redirectTo={redirectTo} onError={setError} onBusy={setLoading} text="signup_with" />
            <form onSubmit={onSubmit} className="grid gap-4">
                <FormError>{error}</FormError>
                <Field id="reg-store" label={t('auth_store_name')}>
                    <input id="reg-store" type="text" autoComplete="organization" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClass} maxLength={160} required autoFocus />
                    <p className="mt-1.5 truncate text-xs text-slate-500">
                        {t('auth_store_address')}{' '}
                        <span className="font-semibold text-slate-700" dir="ltr">{slug}.sellchaze.com</span>
                    </p>
                </Field>
                <Field id="reg-name" label={t('auth_full_name')}>
                    <input id="reg-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={255} required />
                </Field>
                <Field id="reg-email" label={t('email')}>
                    <input id="reg-email" type="email" autoComplete="email" inputMode="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
                </Field>
                <div>
                    <label htmlFor="reg-password" className="mb-1.5 block text-sm font-semibold text-slate-800">{t('password')}</label>
                    <PasswordInput id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} describedBy="reg-password-strength" />
                    <PasswordStrength value={password} id="reg-password-strength" />
                </div>
                <SubmitButton loading={loading}>{t('auth_register_store_submit')}</SubmitButton>
                <p className="text-center text-xs leading-relaxed text-slate-500">
                    {t('auth_terms_prefix')}{' '}
                    <a href={marketingUrl('/legal/terms')} className="font-medium text-slate-700 underline-offset-2 hover:underline">{t('auth_footer_terms')}</a>{' '}
                    {t('auth_terms_and')}{' '}
                    <a href={marketingUrl('/legal/privacy')} className="font-medium text-slate-700 underline-offset-2 hover:underline">{t('auth_footer_privacy')}</a>.
                </p>
            </form>
        </AuthLayout>
    );
}
