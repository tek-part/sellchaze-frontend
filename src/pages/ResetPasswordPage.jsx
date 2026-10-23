import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { loginErrorMessage } from '../utils/apiError';
import AuthLayout from '../components/auth/AuthLayout';
import { Field, FormError, PasswordInput, PasswordStrength, SubmitButton, inputClass } from '../components/auth/AuthFields';

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
    const emailParam = useMemo(() => searchParams.get('email') || '', [searchParams]);
    const [password, setPassword] = useState('');
    const [done, setDone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const invalidLink = !token || !emailParam;

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', {
                token,
                email: emailParam,
                password,
                password_confirmation: password,
            });
            setDone(data.message || t('auth_reset_success'));
            setPassword('');
        } catch (err) {
            setError(loginErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title={t('auth_reset_title')}
            subtitle={t('auth_reset_subtitle')}
            footer={<Link to="/login" className="font-semibold text-brand hover:underline">{t('auth_back_login')}</Link>}
        >
            {invalidLink ? (
                <FormError>{t('auth_reset_invalid_link')}</FormError>
            ) : done ? (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900">{done}</div>
            ) : (
                <form onSubmit={onSubmit} className="grid gap-4">
                    <FormError>{error}</FormError>
                    <Field id="reset-email" label={t('email')}>
                        <input id="reset-email" type="email" value={emailParam} className={inputClass} dir="ltr" disabled />
                    </Field>
                    <div>
                        <label htmlFor="reset-password" className="mb-1.5 block text-sm font-semibold text-slate-800">{t('auth_reset_new_password')}</label>
                        <PasswordInput id="reset-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} describedBy="reset-password-strength" />
                        <PasswordStrength value={password} id="reset-password-strength" />
                    </div>
                    <SubmitButton loading={loading}>{t('auth_reset_submit')}</SubmitButton>
                </form>
            )}
        </AuthLayout>
    );
}
