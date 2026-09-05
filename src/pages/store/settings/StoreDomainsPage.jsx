import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowTopRightOnSquare, HiOutlineCheck, HiOutlineClipboard, HiOutlineGlobeAlt } from 'react-icons/hi2';
import CustomDomainsPanel from '../../../components/domains/CustomDomainsPanel';
import PageHeader from '../../../components/PageHeader';
import SettingsCard from '../../../components/ui/SettingsCard';
import useStoreContext from '../../../hooks/useStoreContext';

function CopyButton({ value }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };
    return (
        <button
            type="button"
            onClick={copy}
            disabled={!value}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
            {copied ? <HiOutlineCheck className="h-4 w-4 text-emerald-600" aria-hidden /> : <HiOutlineClipboard className="h-4 w-4" aria-hidden />}
            {copied ? t('action_copied', 'Copied') : t('action_copy', 'Copy')}
        </button>
    );
}

export default function StoreDomainsPage() {
    const { t } = useTranslation();
    const { store, apiBase } = useStoreContext();
    const subdomain = store?.subdomain_host || '';
    const publicUrl = store?.public_url || store?.storefront_url || (subdomain ? `https://${subdomain}` : '');
    const isLive = store?.status === 'active';

    return (
        <div className="mx-auto max-w-5xl space-y-5">
            <PageHeader
                title={t('store_domains_title', 'Domains')}
                subtitle={t('store_domains_subtitle', 'Your free subdomain, plus any custom domains you connect.')}
            />

            <SettingsCard
                title={t('store_domains_subdomain', 'Subdomain')}
                description={t('store_domains_subdomain_hint', 'Always available. It follows your store slug, which you can change under General.')}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-slate-700">{t('store_slug', 'Slug')}</p>
                        <input value={store?.slug ?? ''} readOnly dir="ltr" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-600" />
                    </div>
                    <div>
                        <p className="mb-1.5 text-sm font-medium text-slate-700">{t('store_generated_subdomain', 'Generated subdomain')}</p>
                        <div className="flex items-stretch gap-2">
                            <input value={subdomain} readOnly dir="ltr" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-700" />
                            <CopyButton value={subdomain} />
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
                    <HiOutlineGlobeAlt className="h-5 w-5 text-brand" aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-mono text-sm text-slate-700" dir="ltr">{publicUrl || '—'}</span>
                    {publicUrl ? (
                        isLive ? (
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                            >
                                <HiOutlineArrowTopRightOnSquare className="h-4 w-4" aria-hidden />
                                {t('store_domains_open', 'Open')}
                            </a>
                        ) : (
                            <span className="text-xs text-slate-500">{t('store_domains_not_live', 'Opens once the store is published.')}</span>
                        )
                    ) : null}
                </div>
            </SettingsCard>

            {/* Custom domains: connect, verify, SSL, health and audit history. */}
            <CustomDomainsPanel apiBase={apiBase} />
        </div>
    );
}
