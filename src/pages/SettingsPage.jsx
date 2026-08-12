import { Navigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineEnvelope, HiOutlineCog6Tooth } from 'react-icons/hi2';
import { FaGoogle } from 'react-icons/fa';

export default function SettingsPage() {
    const { t } = useTranslation();
    const { isAdmin } = useOutletContext();

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const cards = [
        {
            to: '/settings/email',
            title: t('settings_email'),
            desc: t('settings_email_card_desc'),
            Icon: HiOutlineEnvelope,
        },
        {
            to: '/settings/google',
            title: t('settings_google'),
            desc: t('settings_google_card_desc'),
            Icon: FaGoogle,
        },
        {
            to: '/settings/wigpleasure-sync',
            title: t('wigpleasure_sync_title'),
            desc: t('wigpleasure_sync_card_desc'),
            Icon: HiOutlineArrowPath,
        },
    ];

    return (
        <div className="space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('settings')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('settings_subtitle')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {cards.map(({ to, title, desc, Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-brand/35 hover:shadow-md"
                    >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                            <Icon className="h-6 w-6" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <h2 className="font-semibold text-slate-900 group-hover:text-brand">{title}</h2>
                            <p className="mt-1 text-sm text-slate-600">{desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
            <p className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                <HiOutlineCog6Tooth className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                {t('settings_env_hint')}
            </p>
        </div>
    );
}
