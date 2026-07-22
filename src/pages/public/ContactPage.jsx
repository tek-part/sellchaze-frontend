import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import SEO from '../../components/SEO';

const API = import.meta.env.VITE_API_URL || '/api';
const SUPPORT_EMAIL = 'sellcahase@wigpleasure.com';

export default function ContactPage() {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await axios.post(`${API}/v1/public/contact`, form);
            toast.success(t('contact_sent'));
            setForm({ name: '', email: '', subject: '', message: '' });
        } catch {
            toast.error(t('contact_error'));
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <SEO title={t('contact_meta_title')} description={t('contact_meta_description')} />
            <section className="mx-auto max-w-4xl px-4 pt-16 pb-10 text-center md:pt-20">
                <p className="sc-anim-fade-up inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand" style={{ animationDelay: '80ms' }}>
                    {t('nav_contact')}
                </p>
                <h1 className="sc-anim-fade-up mt-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl" style={{ animationDelay: '200ms' }}>
                    {t('contact_title')}
                </h1>
                <p className="sc-anim-fade-up mx-auto mt-4 max-w-2xl text-slate-600" style={{ animationDelay: '360ms' }}>{t('contact_subtitle')}</p>
                <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="sc-anim-fade-up mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs hover:border-brand hover:text-brand"
                    style={{ animationDelay: '520ms' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="M3 7l9 6 9-6" />
                    </svg>
                    {SUPPORT_EMAIL}
                </a>
            </section>

            <section className="mx-auto max-w-2xl px-4 pb-24">
                <form
                    onSubmit={submit}
                    className="sc-anim-fade-up space-y-4 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xs md:p-8"
                    style={{ animationDelay: '700ms' }}
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <input
                            required
                            value={form.name}
                            onChange={set('name')}
                            placeholder={t('contact_name')}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                        />
                        <input
                            required
                            type="email"
                            value={form.email}
                            onChange={set('email')}
                            placeholder={t('contact_email')}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                        />
                    </div>
                    <input
                        required
                        value={form.subject}
                        onChange={set('subject')}
                        placeholder={t('contact_subject')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                    />
                    <textarea
                        required
                        rows={6}
                        value={form.message}
                        onChange={set('message')}
                        placeholder={t('contact_message')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-hidden transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                        disabled={sending}
                        className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:brightness-110 disabled:opacity-60"
                    >
                        {sending ? t('sending') : t('contact_submit')}
                    </button>
                </form>
            </section>
        </>
    );
}
