import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { loginErrorMessage } from '../utils/apiError';
import AuthLayout from '../components/auth/AuthLayout';
import { Field, FormError, SubmitButton, inputClass } from '../components/auth/AuthFields';

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            setSent(data.message || t('auth_forgot_check_email'));
        } catch (err) {
            setError(loginErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            title={t('auth_forgot_title')}
            subtitle={t('auth_forgot_subtitle')}
            footer={<Link to="/login" className="font-semibold text-brand hover:underline">{t('auth_back_login')}</Link>}
        >
            {sent ? (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900">{sent}</div>
            ) : (
                <form onSubmit={onSubmit} className="grid gap-4">
                    <FormError>{error}</FormError>
                    <Field id="forgot-email" label={t('email')}>
                        <input id="forgot-email" type="email" autoComplete="email" inputMode="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required autoFocus />
                    </Field>
                    <SubmitButton loading={loading}>{t('auth_forgot_submit')}</SubmitButton>
                </form>
            )}
        </AuthLayout>
    );
}
