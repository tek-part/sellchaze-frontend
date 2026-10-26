import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineArrowPath,
    HiOutlineArrowRightOnRectangle,
    HiOutlineClipboardDocument,
    HiOutlinePause,
} from '../../../components/workspace/WorkspaceIcons';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { pickWaDisplay } from './connectHelpers';

export default function WavexConnectedCard({ bundle, t, isRtl, onRefresh, onPause, onDisconnect }) {
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
