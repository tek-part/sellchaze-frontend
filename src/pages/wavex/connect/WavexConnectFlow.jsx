import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineClock,
    HiOutlinePlay,
    HiOutlineQrCode,
    HiOutlineServerStack,
    HiOutlineStop,
} from '../../../components/workspace/WorkspaceIcons';

function QrCountdownRing({ secondsLeft, total }) {
    const pct = total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 0;
    const circumference = 2 * Math.PI * 18;
    const offset = circumference * (1 - pct);

    return (
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="-rotate-90 transform" width="56" height="56" viewBox="0 0 44 44" aria-hidden>
                <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-slate-100"
                />
                <circle
                    cx="22"
                    cy="22"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="text-brand transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
            </svg>
            <span className="absolute text-sm font-bold tabular-nums text-slate-800">{secondsLeft}</span>
        </div>
    );
}

/**
 * The three-step setup flow (create instance → scan QR → start session). Split from
 * WavexConnectPage and lazy-loaded so a merchant whose WhatsApp is already connected — the common
 * case — never downloads this flow or its animation library.
 */
export default function WavexConnectFlow({
    t,
    isRtl,
    flowPhase,
    setFlowPhase,
    err,
    setErr,
    loading,
    qr,
    secondsLeft,
    qrRefreshSeconds,
    createInstanceOnly,
    startSession,
    stopSession,
    fetchQr,
}) {
    const phaseVariants = {
        initial: { opacity: 0, x: isRtl ? -16 : 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: isRtl ? 16 : -16 },
    };

    return (
            <AnimatePresence mode="wait">
            {flowPhase === 1 ? (
                <motion.div
                    key="phase-1"
                    variants={phaseVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 xl:grid-cols-12 xl:gap-10"
                >
                    <div className="flex min-h-[min(520px,calc(100dvh-16rem))] flex-col items-center justify-center text-center xl:col-span-12">
                        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-2">
                            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20">
                                <HiOutlineServerStack className="h-10 w-10" aria-hidden />
                            </span>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                                    {t('wavex_connect_step1_title')}
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                    {t('wavex_connect_step1_desc')}
                                </p>
                            </div>
                            {err ? (
                                <div className="w-full space-y-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-start text-sm text-red-700">
                                    <p className="whitespace-pre-wrap">{err}</p>
                                    <p className="text-xs text-red-800/90">
                                        <Link
                                            to="/wavex/settings"
                                            className="font-semibold underline hover:no-underline"
                                        >
                                            {t('wavex_open_settings')}
                                        </Link>
                                    </p>
                                </div>
                            ) : null}
                            <div className={`flex w-full flex-col gap-3 sm:max-w-md ${isRtl ? 'sm:items-stretch' : ''}`}>
                                <button
                                    type="button"
                                    onClick={() => void createInstanceOnly()}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand/40 bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark sm:py-4 sm:text-base"
                                >
                                    <HiOutlineServerStack className="h-5 w-5 shrink-0" aria-hidden />
                                    {t('wavex_session_create')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setErr('');
                                        setFlowPhase(2);
                                    }}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    {t('wavex_connect_skip_to_session')}
                                </button>
                                <p className="text-xs text-slate-500">
                                    <Link
                                        to="/wavex/settings"
                                        className="font-semibold text-brand underline-offset-2 hover:underline"
                                    >
                                        {t('wavex_open_settings')}
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : null}

            {flowPhase === 2 ? (
                <motion.div
                    key="phase-2-qr"
                    variants={phaseVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-10"
                >
                    <div className="space-y-4 xl:col-span-12">
                        <div className={`flex flex-wrap items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <button
                                type="button"
                                onClick={() => {
                                    setErr('');
                                    setFlowPhase(1);
                                }}
                                className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                                <HiOutlineArrowLeft
                                    className={`h-4 w-4 shrink-0 ${isRtl ? 'rotate-180' : ''}`}
                                    aria-hidden
                                />
                                {t('wavex_connect_back_to_instance')}
                            </button>
                        </div>
                        {err ? (
                            <div className="space-y-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <p className="whitespace-pre-wrap">{err}</p>
                                <p className="text-xs text-red-800/90">
                                    <Link
                                        to="/wavex/settings"
                                        className="font-semibold underline hover:no-underline"
                                    >
                                        {t('wavex_open_settings')}
                                    </Link>
                                </p>
                            </div>
                        ) : null}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{t('wavex_connect_step3_title')}</h2>
                            <p className="mt-1 text-sm text-slate-600">{t('wavex_connect_step3_desc')}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-10">
                            <div className="xl:col-span-7">
                                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-inner lg:min-h-[320px] xl:min-h-[360px]">
                                    {loading && !qr ? (
                                        <p className="text-sm text-slate-500">{t('loading')}</p>
                                    ) : qr ? (
                                        <img
                                            src={qr}
                                            alt="WhatsApp QR"
                                            className="max-h-[min(24rem,calc(100vw-4rem))] w-full object-contain xl:max-h-112"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <HiOutlineQrCode className="h-12 w-12 text-slate-300" aria-hidden />
                                            <p className="text-sm text-slate-500">{t('wavex_no_qr')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div
                                className={`flex flex-col justify-center gap-4 xl:col-span-5 ${isRtl ? 'xl:items-end xl:text-end' : ''}`}
                            >
                                <div className="flex flex-wrap items-center gap-4">
                                    <QrCountdownRing secondsLeft={secondsLeft} total={qrRefreshSeconds} />
                                    <div className="text-sm text-slate-600">
                                        <p className="flex items-center gap-1.5 font-medium text-slate-800">
                                            <HiOutlineClock className="h-4 w-4 text-brand" aria-hidden />
                                            {t('wavex_qr_next_refresh')}
                                        </p>
                                        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                                            {secondsLeft}
                                            <span className="text-base font-semibold text-slate-500">
                                                {t('wavex_qr_seconds_short')}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {t('wavex_connect_step2_title')}
                            </p>
                            <p className="mb-3 flex items-center gap-2 text-xs text-slate-600">
                                <HiOutlineClock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                                {t('wavex_session_engine_wait')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void startSession()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                                >
                                    <HiOutlinePlay className="h-5 w-5" aria-hidden />
                                    {t('wavex_session_start')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void stopSession()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <HiOutlineStop className="h-5 w-5" aria-hidden />
                                    {t('wavex_session_stop')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void fetchQr()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <HiOutlineArrowPath className="h-5 w-5" aria-hidden />
                                    {t('wavex_refresh_qr')}
                                </button>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFlowPhase(3)}
                            className="w-full rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand/10"
                        >
                            {t('wavex_connect_next_to_session')}
                        </button>
                    </div>
                </motion.div>
            ) : null}

            {flowPhase === 3 ? (
                <motion.div
                    key="phase-3-session"
                    variants={phaseVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="grid grid-cols-1 xl:grid-cols-12 xl:gap-8"
                >
                    <div className="space-y-6 xl:col-span-12">
                        <div className={`flex flex-wrap items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <button
                                type="button"
                                onClick={() => {
                                    setErr('');
                                    setFlowPhase(2);
                                }}
                                className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                                <HiOutlineArrowLeft
                                    className={`h-4 w-4 shrink-0 ${isRtl ? 'rotate-180' : ''}`}
                                    aria-hidden
                                />
                                {t('wavex_connect_back_to_qr')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setErr('');
                                    setFlowPhase(1);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                {t('wavex_connect_back_to_instance')}
                            </button>
                        </div>
                        {err ? (
                            <div className="space-y-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <p className="whitespace-pre-wrap">{err}</p>
                                <p className="text-xs text-red-800/90">
                                    <Link
                                        to="/wavex/settings"
                                        className="font-semibold underline hover:no-underline"
                                    >
                                        {t('wavex_open_settings')}
                                    </Link>
                                </p>
                            </div>
                        ) : null}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">{t('wavex_connect_step2_title')}</h2>
                            <p className="mt-1 text-sm text-slate-600">{t('wavex_connect_step2_desc')}</p>
                        </div>
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                            <HiOutlineClock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                            {t('wavex_session_engine_wait')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => void startSession()}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark"
                            >
                                <HiOutlinePlay className="h-5 w-5" aria-hidden />
                                {t('wavex_session_start')}
                            </button>
                            <button
                                type="button"
                                onClick={() => void stopSession()}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <HiOutlineStop className="h-5 w-5" aria-hidden />
                                {t('wavex_session_stop')}
                            </button>
                            <button
                                type="button"
                                onClick={() => void fetchQr()}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                <HiOutlineArrowPath className="h-5 w-5" aria-hidden />
                                {t('wavex_refresh_qr')}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">{t('wavex_no_qr')}</p>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
