import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowPath, HiOutlineArrowTopRightOnSquare, HiOutlineRocketLaunch } from 'react-icons/hi2';
import api from '../../../api/client';
import PageHeader from '../../../components/PageHeader';
import ReadinessChecklist, { useStoreReadiness } from '../../../components/store/ReadinessChecklist';
import StoreStatusPill from '../../../components/store/StoreStatusPill';
import { confirmDialog } from '../../../components/ui/confirmDialog';
import { notify } from '../../../components/ui/notify';
import SettingsCard from '../../../components/ui/SettingsCard';
import useStoreContext from '../../../hooks/useStoreContext';

export default function StorePublishPage() {
    const { t } = useTranslation();
    const { store, setStore, apiBase, uiBase } = useStoreContext();
    const { checks, loading, error, reload, done, total, ready } = useStoreReadiness(apiBase);
    const [busy, setBusy] = useState(false);

    const status = store?.status || 'draft';
    const isLive = status === 'active';
    const isSuspended = status === 'suspended';
    const storefrontUrl = store?.public_url || store?.storefront_url || null;

    const publish = async () => {
        setBusy(true);
        try {
            const { data } = await api.post(`${apiBase}/publish`);
            if (data?.data) setStore(data.data);
            notify.success(t('store_publish_success', 'Store published'), t('store_publish_success_hint', 'Your storefront is now live.'));
            await reload();
        } catch (e) {
            const detail = e.response?.data?.errors?.store?.[0] || e.response?.data?.message || e.message;
            notify.error(t('store_publish_failed', 'Could not publish'), detail);
            await reload();
        } finally {
            setBusy(false);
        }
    };

    const unpublish = async () => {
        const ok = await confirmDialog({
            title: t('store_unpublish_confirm_title', 'Take the store offline?'),
            text: t('store_unpublish_confirm_text', 'Shoppers will see a "store unavailable" page until you publish again. Nothing is deleted.'),
            confirmText: t('store_unpublish_action', 'Unpublish'),
            danger: true,
        });
        if (!ok) return;
        setBusy(true);
        try {
            const { data } = await api.post(`${apiBase}/unpublish`);
            if (data?.data) setStore(data.data);
            notify.success(t('store_unpublish_success', 'Store unpublished'), t('store_unpublish_success_hint', 'The storefront is now hidden from shoppers.'));
        } catch (e) {
            notify.error(t('store_unpublish_failed', 'Could not unpublish'), e.response?.data?.message || e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-5">
            <PageHeader
                title={t('store_publish_title', 'Publish')}
                subtitle={t('store_publish_subtitle', 'Control whether shoppers can reach your storefront.')}
                badge={<StoreStatusPill status={status} />}
            />

            {/* Status hero */}
            <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-card ${
                isLive ? 'border-emerald-200 bg-emerald-50/70' : isSuspended ? 'border-red-200 bg-red-50/70' : 'border-slate-200/80 bg-white'
            }`}>
                <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-white/60 blur-2xl" aria-hidden />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-lg font-semibold text-slate-900">
                            {isLive
                                ? t('store_publish_state_live', 'Your storefront is live')
                                : isSuspended
                                    ? t('store_publish_state_suspended', 'This store is suspended')
                                    : t('store_publish_state_draft', 'Your storefront is not public yet')}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            {isLive
                                ? t('store_publish_state_live_hint', 'Customers can browse and buy. You can take it offline at any time.')
                                : isSuspended
                                    ? t('store_publish_state_suspended_hint', 'Suspended stores are managed by the platform team. Contact support to restore it.')
                                    : t('store_publish_state_draft_hint', 'Complete the checks below and publish when you are ready.')}
                        </p>
                        {isLive && storefrontUrl ? (
                            <a href={storefrontUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-brand hover:underline" dir="ltr">
                                <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" aria-hidden />
                                {storefrontUrl}
                            </a>
                        ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {isLive ? (
                            <button
                                type="button"
                                onClick={unpublish}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-xs transition hover:bg-red-50 disabled:opacity-50"
                            >
                                {busy ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : null}
                                {t('store_unpublish_action', 'Unpublish')}
                            </button>
                        ) : !isSuspended ? (
                            <button
                                type="button"
                                onClick={publish}
                                disabled={!ready || busy || loading}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-40"
                            >
                                {busy ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden /> : <HiOutlineRocketLaunch className="h-4 w-4" aria-hidden />}
                                {t('store_publish_action', 'Publish store')}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <SettingsCard
                title={t('store_publish_checklist', 'Publishing checklist')}
                description={t('store_overview_progress', '{{done}} of {{total}} complete', { done, total })}
                actions={
                    <button
                        type="button"
                        onClick={() => void reload()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                    >
                        <HiOutlineArrowPath className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                        {t('action_refresh', 'Refresh')}
                    </button>
                }
                footer={!isLive ? (
                    <p className="text-xs text-slate-500">
                        {ready
                            ? t('store_publish_ready_hint', 'All checks passed — you can publish now.')
                            : t('store_publish_missing_hint', 'Publishing is enabled once every check passes.')}
                    </p>
                ) : null}
            >
                {error ? <p className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
                <ReadinessChecklist checks={checks} uiBase={uiBase} loading={loading} />
            </SettingsCard>
        </div>
    );
}
