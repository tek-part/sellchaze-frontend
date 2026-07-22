import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineArrowRightOnRectangle,
    HiOutlineClipboardDocument,
    HiOutlineClock,
    HiOutlinePause,
    HiOutlinePlay,
    HiOutlineQrCode,
    HiOutlineServerStack,
    HiOutlineStop,
} from 'react-icons/hi2';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../api/client';

const QR_REFRESH_SEC = 30;

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function wavexErrorMessage(data, t) {
    if (!data || data.ok !== false) {
        return '';
    }
    const d = data.data;
    if (typeof d === 'object' && d !== null && d.code === 'qr_not_available') {
        return d.message ? String(d.message) : t('wavex_qr_not_ready');
    }
    const msg =
        (typeof d === 'object' && d !== null && (d.message || d.error)) ||
        (typeof d === 'string' ? d : null);
    const rec =
        typeof d === 'object' && d !== null && d.details && typeof d.details.recommendation === 'string'
            ? d.details.recommendation
            : '';
    const primary = msg
        ? String(msg)
        : data.upstream_status === 404
          ? t('wavex_session_upstream_404')
          : data.upstream_status === 401
            ? t('wavex_session_upstream_401')
            : t('wavex_session_upstream_generic', { code: data.upstream_status ?? '—' });
    return rec ? `${primary}\n\n${rec}` : primary;
}

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

function StepProgress({ flowPhase, steps, t, isRtl }) {
    return (
        <div
            className={`flex flex-wrap items-center justify-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6 ${isRtl ? 'flex-row-reverse' : ''}`}
            role="navigation"
            aria-label={t('wavex_connect_step_of', { current: flowPhase, total: steps.length })}
        >
            {steps.map((step, idx) => {
                const Icon = step.icon;
                const done = flowPhase > step.n;
                const active = flowPhase === step.n;
                return (
                    <div key={step.n} className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {idx > 0 ? (
                            <span
                                className={`hidden h-px w-6 sm:block ${done || active ? 'bg-brand/40' : 'bg-slate-200'}`}
                                aria-hidden
                            />
                        ) : null}
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                done
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : active
                                      ? 'bg-brand text-white shadow-xs'
                                      : 'bg-white text-slate-400 ring-1 ring-slate-200'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                            <span className="tabular-nums">{step.n}</span>
                            <span className="hidden sm:inline">{t(step.titleKey)}</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function normalizeProfileImageUrl(raw) {
    if (typeof raw !== 'string') {
        return null;
    }
    const u = raw.trim();
    if (!u) {
        return null;
    }
    if (u.startsWith('data:')) {
        return u;
    }
    if (u.startsWith('//')) {
        return `https:${u}`;
    }
    if (u.startsWith('http://') || u.startsWith('https://')) {
        return u;
    }
    return null;
}

function pickWaDisplay(info, profile) {
    const p = profile && typeof profile === 'object' ? profile : null;
    const inner = p?.me && typeof p.me === 'object' ? p.me : null;
    const im = info?.me && typeof info.me === 'object' ? info.me : null;
    const pushName = String(p?.pushName || inner?.name || im?.pushName || im?.name || '').trim();
    const waId = String(p?.id || inner?.id || im?.id || '').trim();
    const rawPic =
        p?.profilePictureUrl ||
        p?.profilePicUrl ||
        p?.picture ||
        p?.avatar ||
        p?.photo ||
        p?.url ||
        inner?.profilePictureUrl ||
        inner?.url ||
        im?.profilePictureUrl ||
        im?.url ||
        null;
    const pic = normalizeProfileImageUrl(rawPic);
    return { pushName, waId, pic };
}

function isSessionWorkingPayload(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    return Boolean(data.ok && String(data.info?.status ?? '').toUpperCase() === 'WORKING');
}

function parseSessionBundle(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }
    return {
        info: data.info ?? null,
        profile: data.profile ?? null,
        instance_id: data.instance_id ?? null,
        base_url: data.base_url ?? null,
    };
}

function WavexConnectedCard({ bundle, t, isRtl, onRefresh, onPause, onDisconnect }) {
    const { pushName, waId, pic } = useMemo(() => pickWaDisplay(bundle?.info, bundle?.profile), [bundle]);
    const displayName = pushName || '—';
    const instanceId = bundle?.instance_id ?? '';
    const [avatarFailed, setAvatarFailed] = useState(false);

    useEffect(() => {
        setAvatarFailed(false);
    }, [pic]);

    async function copyInstanceId() {
        if (!instanceId) {
            return;
        }
        try {
            await navigator.clipboard.writeText(instanceId);
            toast.success(t('wavex_instance_copied'));
        } catch {
            toast.error(t('wavex_instance_copy'));
        }
    }

    return (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-8">
            <div
                className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${isRtl ? 'sm:flex-row-reverse' : ''}`}
            >
                <div className={`flex items-center gap-4 min-w-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    {pic && !avatarFailed ? (
                        <img
                            src={pic}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-emerald-100"
                            referrerPolicy="no-referrer"
                            onError={() => setAvatarFailed(true)}
                        />
                    ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800">
                            {(displayName.charAt(0) || '?').toUpperCase()}
                        </div>
                    )}
                    <div className={`min-w-0 ${isRtl ? 'text-end' : ''}`}>
                        <h2 className="truncate text-2xl font-bold text-emerald-950">{displayName}</h2>
                        <p className="mt-1 text-sm text-slate-500">{t('wavex_connected_subtitle')}</p>
                    </div>
                </div>
                <span className="inline-flex shrink-0 self-start rounded-full bg-emerald-800 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                    {t('wavex_connected_badge')}
                </span>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
                <div
                    className={`flex items-start gap-3 text-sm text-slate-600 ${isRtl ? 'flex-row-reverse text-end' : ''}`}
                >
                    <FaWhatsapp className="mt-0.5 h-5 w-5 shrink-0 text-[#25D366]" aria-hidden />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('wavex_wa_account')}</p>
                        <p className="mt-0.5 break-all font-mono text-slate-800">{waId || '—'}</p>
                    </div>
                </div>
                <div
                    className={`flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                        <span className="font-medium text-slate-500">{t('wavex_instance_row')}: </span>
                        <span className="font-mono text-slate-900">{instanceId || '—'}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => void copyInstanceId()}
                        disabled={!instanceId}
                        className="shrink-0 rounded-lg p-2 text-slate-600 transition hover:bg-white hover:text-brand disabled:opacity-40"
                        title={t('wavex_instance_copy')}
                        aria-label={t('wavex_instance_copy')}
                    >
                        <HiOutlineClipboardDocument className="h-5 w-5" aria-hidden />
                    </button>
                </div>
            </div>

            <div
                className={`mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
                <button
                    type="button"
                    onClick={() => void onRefresh()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#0d3d3d] text-white shadow-xs transition hover:bg-[#0a3030]"
                    title={t('wavex_connected_refresh')}
                    aria-label={t('wavex_connected_refresh')}
                >
                    <HiOutlineArrowPath className="h-5 w-5" aria-hidden />
                </button>
                <button
                    type="button"
                    onClick={() => void onPause()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50"
                    title={t('wavex_connected_pause')}
                    aria-label={t('wavex_connected_pause')}
                >
                    <HiOutlinePause className="h-5 w-5" aria-hidden />
                </button>
                <Link
                    to="/wavex/chats"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#22c55e] text-white shadow-xs ring-1 ring-black/5 transition hover:bg-[#1fb855]"
                    title={t('wavex_connected_open_chats')}
                    aria-label={t('wavex_connected_open_chats')}
                >
                    <FaWhatsapp className="h-5 w-5" aria-hidden />
                </Link>
                <button
                    type="button"
                    onClick={() => void onDisconnect()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#be123c] text-white shadow-xs transition hover:bg-[#9f1239]"
                    title={t('wavex_connected_disconnect')}
                    aria-label={t('wavex_connected_disconnect')}
                >
                    <HiOutlineArrowRightOnRectangle className="h-5 w-5" aria-hidden />
                </button>
            </div>
        </div>
    );
}

export default function WavexConnectPage() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language?.startsWith('ar');
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const [qr, setQr] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(QR_REFRESH_SEC);
    const [flowPhase, setFlowPhase] = useState(1);
    const isInitialQrLoad = useRef(true);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [bundle, setBundle] = useState(null);

    const fetchQr = useCallback(async () => {
        setErr('');
        setLoading(true);
        let hadQr = false;
        try {
            const { data } = await api.get('/wavex/session/qr');
            if (data?.ok === false) {
                setErr(wavexErrorMessage(data, t));
                setQr(null);
            } else {
                setErr('');
                if (data?.data?.qr) {
                    setQr(data.data.qr);
                    hadQr = true;
                } else if (typeof data?.data === 'string') {
                    setQr(data.data);
                    hadQr = true;
                } else {
                    setQr(null);
                }
            }
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
            setQr(null);
        } finally {
            if (isInitialQrLoad.current) {
                isInitialQrLoad.current = false;
                setFlowPhase(hadQr ? 2 : 1);
            }
            setLoading(false);
            setSecondsLeft(QR_REFRESH_SEC);
        }
    }, [t]);

    const syncSessionFromApi = useCallback(async () => {
        try {
            const { data } = await api.get('/wavex/session/info');
            setBundle(parseSessionBundle(data));
            const working = isSessionWorkingPayload(data);
            setConnected(working);
            return working;
        } catch {
            setBundle(null);
            setConnected(false);
            return false;
        }
    }, []);

    const runBootstrap = useCallback(async () => {
        setSessionLoading(true);
        try {
            const working = await syncSessionFromApi();
            if (working) {
                isInitialQrLoad.current = false;
            } else {
                await fetchQr();
            }
        } finally {
            setSessionLoading(false);
        }
    }, [fetchQr, syncSessionFromApi]);

    useEffect(() => {
        if (!permissions.includes('wavex-access')) {
            return;
        }
        void runBootstrap();
    }, [permissions, runBootstrap]);

    useEffect(() => {
        if (connected || sessionLoading || flowPhase !== 2) {
            return;
        }
        const id = setInterval(() => {
            void syncSessionFromApi();
        }, 8000);
        return () => clearInterval(id);
    }, [connected, sessionLoading, flowPhase, syncSessionFromApi]);

    useEffect(() => {
        if (!permissions.includes('wavex-access')) {
            return;
        }
        if (connected || (flowPhase !== 2 && flowPhase !== 3)) {
            return;
        }
        const id = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    void fetchQr();
                    return QR_REFRESH_SEC;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [fetchQr, permissions, flowPhase, connected]);

    async function startSession() {
        setErr('');
        try {
            const { data } = await api.post('/wavex/session/start');
            if (data?.ok === false) {
                setErr(wavexErrorMessage(data, t));
                return;
            }
            await sleep(3500);
            await fetchQr();
            await syncSessionFromApi();
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        }
    }

    async function createInstanceOnly() {
        setErr('');
        try {
            const { data } = await api.post('/wavex/session/create');
            if (data?.ok === false) {
                setErr(wavexErrorMessage(data, t));
                return;
            }
            await sleep(500);
            setFlowPhase(2);
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        }
    }

    async function stopSession() {
        setErr('');
        try {
            const { data } = await api.post('/wavex/session/stop');
            if (data?.ok === false) {
                setErr(wavexErrorMessage(data, t));
            }
        } catch (e) {
            setErr(e.response?.data?.message || e.message);
        }
        setQr(null);
        setFlowPhase(2);
        await syncSessionFromApi();
    }

    async function refreshConnectedCard() {
        const working = await syncSessionFromApi();
        if (!working) {
            await fetchQr();
        }
    }

    if (!can('wavex-access')) {
        return <Navigate to="/dashboard" replace />;
    }

    const steps = [
        { n: 1, titleKey: 'wavex_connect_step1_title', descKey: 'wavex_connect_step1_desc', icon: HiOutlineServerStack },
        { n: 2, titleKey: 'wavex_connect_step3_title', descKey: 'wavex_connect_step3_desc', icon: HiOutlineQrCode },
        { n: 3, titleKey: 'wavex_connect_step2_title', descKey: 'wavex_connect_step2_desc', icon: HiOutlinePlay },
    ];

    const phaseVariants = {
        initial: { opacity: 0, x: isRtl ? -16 : 16 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: isRtl ? 16 : -16 },
    };

    return (
        <div className="w-full max-w-none">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50/80 to-brand/5 shadow-card">
                <div className="border-b border-slate-100 bg-white/90 px-4 py-4 sm:px-6 lg:px-8">
                    <div className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${isRtl ? 'lg:flex-row-reverse' : ''}`}>
                        <div className={`flex items-start gap-3 min-w-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span
                                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    connected ? 'bg-emerald-100 text-emerald-700' : 'bg-[#25D366]/15 text-[#25D366]'
                                }`}
                            >
                                <FaWhatsapp className="h-5 w-5" aria-hidden />
                            </span>
                            <div className="min-w-0 border-s-4 border-brand ps-4">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    {connected ? t('wavex_connected_title') : t('wavex_connect_title')}
                                </h1>
                                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                    {connected ? t('wavex_connected_subtitle') : t('wavex_connect_subtitle')}
                                </p>
                                {!connected && !sessionLoading ? (
                                    <p className="mt-2 text-xs font-medium text-slate-500">
                                        {t('wavex_connect_step_of', { current: flowPhase, total: steps.length })}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {!connected && !sessionLoading ? (
                    <StepProgress flowPhase={flowPhase} steps={steps} t={t} isRtl={isRtl} />
                ) : null}

                <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <div className="mx-auto w-full max-w-none xl:max-w-[120rem]">
                        {sessionLoading ? (
                            <div className="flex min-h-[220px] items-center justify-center">
                                <p className="text-sm text-slate-500">{t('loading')}</p>
                            </div>
                        ) : connected ? (
                            <WavexConnectedCard
                                bundle={bundle}
                                t={t}
                                isRtl={isRtl}
                                onRefresh={refreshConnectedCard}
                                onPause={stopSession}
                                onDisconnect={stopSession}
                            />
                        ) : (
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
                                                    <QrCountdownRing secondsLeft={secondsLeft} total={QR_REFRESH_SEC} />
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
