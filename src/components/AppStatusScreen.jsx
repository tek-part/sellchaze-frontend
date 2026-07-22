import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineHomeModern,
    HiOutlineLockClosed,
    HiOutlineNoSymbol,
    HiOutlineSignalSlash,
    HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';
import LanguageSwitcher from './LanguageSwitcher';

const VARIANT_META = {
    404: {
        icon: HiOutlineNoSymbol,
        gradient: 'from-slate-100 via-brand-light/40 to-accent-light/30',
        ring: 'ring-brand/15',
        iconBg: 'bg-brand/10 text-brand',
        blobA: 'bg-brand/20',
        blobB: 'bg-accent/15',
    },
    403: {
        icon: HiOutlineLockClosed,
        gradient: 'from-amber-50/90 via-white to-brand-light/25',
        ring: 'ring-amber-200/60',
        iconBg: 'bg-amber-100 text-amber-800',
        blobA: 'bg-amber-200/40',
        blobB: 'bg-brand/10',
    },
    500: {
        icon: HiOutlineWrenchScrewdriver,
        gradient: 'from-rose-50/80 via-white to-slate-50',
        ring: 'ring-rose-200/50',
        iconBg: 'bg-rose-100 text-rose-800',
        blobA: 'bg-rose-200/35',
        blobB: 'bg-slate-200/40',
    },
    503: {
        icon: HiOutlineArrowPath,
        gradient: 'from-sky-50/90 via-white to-brand-light/30',
        ring: 'ring-sky-200/50',
        iconBg: 'bg-sky-100 text-sky-900',
        blobA: 'bg-sky-200/35',
        blobB: 'bg-brand/10',
    },
    401: {
        icon: HiOutlineLockClosed,
        gradient: 'from-indigo-50/80 via-white to-brand-light/25',
        ring: 'ring-indigo-200/45',
        iconBg: 'bg-indigo-100 text-indigo-900',
        blobA: 'bg-indigo-200/30',
        blobB: 'bg-brand/10',
    },
    offline: {
        icon: HiOutlineSignalSlash,
        gradient: 'from-slate-100 via-white to-slate-50',
        ring: 'ring-slate-200/80',
        iconBg: 'bg-slate-200 text-slate-700',
        blobA: 'bg-slate-300/40',
        blobB: 'bg-slate-200/50',
    },
};

/**
 * @param {object} props
 * @param {string} props.code — e.g. "404" (displayed large)
 * @param {'404'|'403'|'500'|'503'|'401'|'offline'} props.variant
 * @param {string} props.titleKey — i18n key
 * @param {string} props.descriptionKey — i18n key
 * @param {{ to: string, labelKey: string }} props.primaryAction
 * @param {{ labelKey: string, onClick: () => void } | null} [props.secondaryAction]
 */
export default function AppStatusScreen({
    code,
    variant,
    titleKey,
    descriptionKey,
    primaryAction,
    secondaryAction = null,
}) {
    const { t } = useTranslation();
    const meta = VARIANT_META[variant] ?? VARIANT_META[404];
    const Icon = meta.icon;

    return (
        <div
            className={`relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br ${meta.gradient}`}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{
                    backgroundImage:
                        'radial-gradient(ellipse 100% 70% at 10% 0%, rgba(0,75,180,0.12), transparent 50%), radial-gradient(at 90% 20%, rgba(0,192,169,0.1), transparent 45%)',
                }}
            />
            <motion.div
                aria-hidden
                className={`pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full blur-3xl ${meta.blobA}`}
                initial={{ opacity: 0.4, scale: 0.9 }}
                animate={{ opacity: 0.75, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
                aria-hidden
                className={`pointer-events-none absolute -right-20 bottom-1/4 h-64 w-64 rounded-full blur-3xl ${meta.blobB}`}
                initial={{ opacity: 0.35, scale: 0.85 }}
                animate={{ opacity: 0.65, scale: 1 }}
                transition={{ duration: 1.1, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            />

            <header className="relative flex justify-end p-4 sm:p-5">
                <LanguageSwitcher />
            </header>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-16 pt-4 sm:pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-lg text-center"
                >
                    <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
                        <div
                            className={`absolute inset-0 rounded-4xl bg-white/80 shadow-soft ring-1 ${meta.ring} backdrop-blur-xs`}
                        />
                        <span className="relative text-5xl font-bold tabular-nums tracking-tight text-slate-800/90">
                            {code}
                        </span>
                        <span
                            className={`absolute -bottom-1 -inset-e-1 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md ring-2 ring-white ${meta.iconBg}`}
                        >
                            <Icon className="h-7 w-7" aria-hidden />
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t(titleKey)}</h1>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
                        {t(descriptionKey)}
                    </p>
                    <p className="mt-4 text-xs text-slate-400">{t('error_brand_hint')}</p>

                    <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:gap-4">
                        <Link
                            to={primaryAction.to}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        >
                            <HiOutlineHomeModern className="h-5 w-5 opacity-90" aria-hidden />
                            {t(primaryAction.labelKey)}
                        </Link>
                        {secondaryAction ? (
                            <button
                                type="button"
                                onClick={secondaryAction.onClick}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-300 hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/30"
                            >
                                <HiOutlineArrowLeft className="h-5 w-5 text-slate-500" aria-hidden />
                                {t(secondaryAction.labelKey)}
                            </button>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
