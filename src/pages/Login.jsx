import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api, { clearTokens, setTokens } from '../api/client';
import { loginErrorMessage } from '../utils/apiError';
import { safeRedirect } from '../lib/safeRedirect';
import AuthLayout from '../components/auth/AuthLayout';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { Field, FormError, PasswordInput, SubmitButton, inputClass } from '../components/auth/AuthFields';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = safeRedirect(searchParams.get('redirect'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Already signed in (valid token): skip the form.
    useEffect(() => {
        if (!localStorage.getItem('sellchase_access_token')) return undefined;
        let cancelled = false;
        api.get('/auth/me')
            .then(() => { if (!cancelled) navigate(redirectTo, { replace: true }); })
            .catch(() => { if (!cancelled) clearTokens(); });
        return () => { cancelled = true; };
    }, [navigate, redirectTo]);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
            toast.success(t('toast_welcome'));
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(loginErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title={t('auth_login_title')}
            subtitle={t('auth_login_subtitle')}
            footer={<>{t('auth_no_store')} <Link to="/register" className="font-semibold text-brand hover:underline">{t('auth_create_store_link')}</Link></>}
        >
            <GoogleAuthButton redirectTo={redirectTo} onError={setError} onBusy={setLoading} text="signin_with" />
            <form onSubmit={onSubmit} className="grid gap-4">
                <FormError>{error}</FormError>
                <Field id="email" label={t('email')}>
                    <input id="email" type="email" autoComplete="email" inputMode="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required autoFocus />
                </Field>
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-semibold text-slate-800">{t('password')}</label>
                        <Link to="/forgot-password" className="text-sm font-medium text-brand hover:underline">{t('auth_forgot_link')}</Link>
                    </div>
                    <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <SubmitButton loading={loading}>{t('auth_login_submit')}</SubmitButton>
            </form>
        </AuthLayout>
    );
}
