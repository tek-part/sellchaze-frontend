import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlinePlay,
    HiOutlineQrCode,
    HiOutlineServerStack,
} from '../../components/workspace/WorkspaceIcons';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../api/client';
import { QR_REFRESH_SEC, isSessionWorkingPayload, parseSessionBundle, wavexErrorMessage, sleep } from './connect/connectHelpers';
import StepProgress from './connect/StepProgress';
import WavexConnectedCard from './connect/WavexConnectedCard';

// The setup flow (QR, steps, framer-motion transitions) only renders while WhatsApp is not connected.
const WavexConnectFlow = lazy(() => import('./connect/WavexConnectFlow'));

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
                            <Suspense
                                fallback={(
                                    <div className="flex min-h-[220px] items-center justify-center">
                                        <p className="text-sm text-slate-500">{t('loading')}</p>
                                    </div>
                                )}
                            >
                                <WavexConnectFlow
                                    t={t}
                                    isRtl={isRtl}
                                    flowPhase={flowPhase}
                                    setFlowPhase={setFlowPhase}
                                    err={err}
                                    setErr={setErr}
                                    loading={loading}
                                    qr={qr}
                                    secondsLeft={secondsLeft}
                                    qrRefreshSeconds={QR_REFRESH_SEC}
                                    createInstanceOnly={createInstanceOnly}
                                    startSession={startSession}
                                    stopSession={stopSession}
                                    fetchQr={fetchQr}
                                />
                            </Suspense>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
