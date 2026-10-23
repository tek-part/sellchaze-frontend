import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const inputClass =
    'block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[0.95rem] text-slate-900 shadow-xs outline-hidden transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-slate-50';

export function Field({ id, label, hint, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">{label}</label>
            {children}
            {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
        </div>
    );
}

const Eye = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOff = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7c1.5 0 2.9-.4 4.1-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
);

/** Password input with a show/hide toggle. */
export function PasswordInput({ id, value, onChange, autoComplete, minLength, describedBy }) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                autoComplete={autoComplete}
                value={value}
                onChange={onChange}
                minLength={minLength}
                aria-describedby={describedBy}
                className={`${inputClass} pe-11`}
                required
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-e-xl text-slate-400 transition hover:text-slate-700 focus-visible:text-slate-700"
                aria-label={visible ? t('auth_hide_password') : t('auth_show_password')}
                aria-pressed={visible}
            >
                {visible ? EyeOff : Eye}
            </button>
        </div>
    );
}

/** 0–4 score for the strength meter: length plus character variety. */
export function passwordScore(value) {
    if (!value) return 0;
    let score = value.length >= 8 ? 1 : 0;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(score, 4);
}

export function PasswordStrength({ value, id }) {
    const { t } = useTranslation();
    const score = passwordScore(value);
    const labels = ['auth_strength_short', 'auth_strength_weak', 'auth_strength_fair', 'auth_strength_good', 'auth_strength_strong'];
    const colors = ['bg-slate-200', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
    return (
        <div id={id} className="mt-2" aria-live="polite">
            <div className="flex gap-1.5" aria-hidden>
                {[1, 2, 3, 4].map((step) => (
                    <span key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${value && score >= step ? colors[score] : 'bg-slate-200'}`} />
                ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">{value ? t(labels[score]) : t('auth_password_hint')}</p>
        </div>
    );
}

export function FormError({ children }) {
    if (!children) return null;
    return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">{children}</div>;
}

export function SubmitButton({ loading, children }) {
    const { t } = useTranslation();
    return (
        <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-[0.95rem] font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:ring-4 focus-visible:ring-brand/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : null}
            <span>{loading ? t('auth_please_wait') : children}</span>
        </button>
    );
}

export function OrDivider() {
    const { t } = useTranslation();
    return (
        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400" role="separator">
            <span className="h-px flex-1 bg-slate-200" />
            {t('auth_or')}
            <span className="h-px flex-1 bg-slate-200" />
        </div>
    );
}
