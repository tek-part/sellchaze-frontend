/**
 * Store Theme Manager — the merchant/supplier Appearance dashboard.
 *
 * The backend theme registry and per-store install state are the source of truth.
 * Every lifecycle action below is persisted through `/my-store/themes` (or the
 * equivalent admin store scope), so onboarding and the public storefront see
 * exactly the same active theme as this screen.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, NavLink, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlineEye,
    HiOutlineAdjustmentsHorizontal,
    HiOutlineInformationCircle,
    HiOutlineArrowUpCircle,
    HiOutlineArrowPath,
    HiOutlineCheckBadge,
    HiOutlineSparkles,
    HiOutlineXMark,
    HiOutlineSwatch,
    HiOutlineSquares2X2,
} from 'react-icons/hi2';
import useStoreScope from '../hooks/useStoreScope';
import api from '../api/client';

/* ------------------------------------------------------------------ helpers */

function fmtDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function resolveThemeImageUrl(rawImage) {
    if (typeof rawImage !== 'string' || rawImage.trim() === '') {
        return null;
    }

    const normalized = rawImage.trim();
    if (/^https?:\/\//i.test(normalized) || normalized.startsWith('data:')) {
        return normalized;
    }
    if (normalized.startsWith('//')) {
        return `${window.location.protocol}${normalized}`;
    }

    if (!normalized.startsWith('/')) {
        return `${window.location.origin}/${normalized}`;
    }

    return `${window.location.origin}${normalized}`;
}

/* ------------------------------------------------------------------ small UI atoms */

function Badge({ tone = 'slate', icon: Icon, children }) {
    const tones = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        update: 'bg-amber-50 text-amber-700 border-amber-200',
        premium: 'bg-violet-50 text-violet-700 border-violet-200',
        free: 'bg-slate-50 text-slate-600 border-slate-200',
        featured: 'bg-sky-50 text-sky-700 border-sky-200',
        slate: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone] || tones.slate}`}>
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : null}
            {children}
        </span>
    );
}

/* ------------------------------------------------------------------ theme screenshot */

function ThemeShot({ theme }) {
    const [imageFailed, setImageFailed] = useState(false);
    const hasPreview = typeof theme?.preview_image === 'string' && theme.preview_image.trim() !== '' && !imageFailed;
    const imageSrc = hasPreview ? resolveThemeImageUrl(theme.preview_image) : null;

    return (
        <div
            className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br"
            style={{ backgroundImage: `linear-gradient(135deg, ${theme.accent || '#0f172a'}, ${theme.accentAlt || theme.accent || '#334155'})` }}
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={theme.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <div className="text-center text-white" aria-hidden>
                    <HiOutlineSwatch className="mx-auto h-10 w-10 text-white/85" />
                    <span className="mt-2 block text-sm font-semibold text-white/90">{theme.name}</span>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ card */

function ThemeCard({ theme, isActive, canManage, busy, onPreview, onActivate, onPurchase, onCustomize, onDetails, onUpdate }) {
    const { t } = useTranslation();
    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition hover:shadow-lg">
            <div className="relative">
                <ThemeShot theme={theme} />
                <div className="absolute inset-x-2 top-2 flex flex-wrap items-center justify-between gap-1">
                    <div className="flex flex-wrap gap-1">
                        {isActive ? <Badge tone="active" icon={HiOutlineCheckBadge}>{t('theme_active', 'Active')}</Badge> : null}
                        {theme.updateAvailable ? <Badge tone="update" icon={HiOutlineArrowUpCircle}>{t('theme_update_available', 'Update')}</Badge> : null}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {theme.is_featured ? <Badge tone="featured" icon={HiOutlineSparkles}>{t('theme_featured', 'Featured')}</Badge> : null}
                        <Badge tone={theme.premium ? 'premium' : 'free'}>{theme.premium ? `${theme.price} ${theme.currency}` : t('theme_free', 'Free')}</Badge>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-base font-semibold text-slate-900">{theme.name}</h3>
                    {theme.latest_version ? <span className="shrink-0 text-xs font-medium text-slate-400">v{theme.latest_version}</span> : null}
                </div>
                {theme.description ? (
                    <p className="line-clamp-2 text-sm text-slate-500">{theme.description}</p>
                ) : (
                    <p className="text-sm text-slate-400">{theme.author ? `${t('theme_by', 'By')} ${theme.author}` : t('theme_no_description', 'Storefront theme')}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    {theme.author ? <span>{theme.author}</span> : null}
                    <span className="inline-flex items-center gap-1 text-emerald-600"><HiOutlineCheckBadge className="h-3.5 w-3.5" />{t('theme_compatible', 'Compatible')}</span>
                    {theme.installedAt ? <span>{t('theme_installed_on', 'Installed')} {fmtDate(theme.installedAt)}</span> : null}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <button type="button" onClick={() => onPreview(theme)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        <HiOutlineEye className="h-4 w-4" /> {t('theme_preview', 'Preview')}
                    </button>

                    {theme.installed && !isActive && canManage ? (
                        <button type="button" disabled={busy} onClick={() => onActivate(theme)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">
                            <HiOutlineCheckBadge className="h-4 w-4" /> {t('theme_activate', 'Activate')}
                        </button>
                    ) : null}

                    {!theme.installed && canManage ? (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => theme.licensed ? onActivate(theme) : onPurchase(theme)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50 ${theme.licensed ? 'bg-brand' : 'bg-slate-900'}`}
                        >
                            {busy ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" /> : null}
                            {theme.licensed
                                ? t('theme_install_activate', 'Install & activate')
                                : `${t('theme_buy_now', 'Buy theme')} · ${theme.price} ${theme.currency}`}
                        </button>
                    ) : null}

                    {theme.installed && canManage ? (
                        <button type="button" onClick={() => onCustomize(theme)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                            <HiOutlineAdjustmentsHorizontal className="h-4 w-4" /> {t('theme_customize', 'Customize')}
                        </button>
                    ) : null}

                    {theme.installed && theme.updateAvailable && canManage ? (
                        <button type="button" disabled={busy} onClick={() => onUpdate(theme)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50">
                            <HiOutlineArrowUpCircle className="h-4 w-4" /> {t('theme_update', 'Update')}
                        </button>
                    ) : null}

                    <button type="button" onClick={() => onDetails(theme)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        <HiOutlineInformationCircle className="h-4 w-4" /> {t('theme_details', 'Details')}
                    </button>
                </div>
            </div>
        </article>
    );
}

/* ------------------------------------------------------------------ activate confirmation */

function ActivateDialog({ theme, busy, onConfirm, onClose }) {
    const { t } = useTranslation();
    if (!theme) return null;
    const checks = [
        t('theme_check_license', 'License validated'),
        t('theme_check_compat', 'Compatibility verified'),
        t('theme_check_signature', 'Package signature verified'),
    ];
    // Portal to <body>: the page content is wrapped in an animated (transformed) element, which
    // would otherwise become the containing block of this `fixed` overlay and trap it inside the
    // store content column.
    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t('theme_activate', 'Activate')}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <h2 className="text-lg font-semibold text-slate-900">{t('theme_activate_title', 'Publish this theme?')}</h2>
                <p className="mt-1 text-sm text-slate-500">
                    {t('theme_activate_body', 'This will make')} <strong className="text-slate-800">{theme.name}</strong> {t('theme_activate_body2', 'your live storefront theme. Your current theme stays installed and can be restored.')}
                </p>
                <ul className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
                    {checks.map((c) => (
                        <li key={c} className="flex items-center gap-2 text-sm text-slate-600">
                            <HiOutlineCheckBadge className="h-4 w-4 text-emerald-500" /> {c}
                        </li>
                    ))}
                </ul>
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        {t('cancel', 'Cancel')}
                    </button>
                    <button type="button" disabled={busy} onClick={() => onConfirm(theme)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                        {busy ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" /> : <HiOutlineCheckBadge className="h-4 w-4" />}
                        {t('theme_confirm_activate', 'Activate & publish')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

/* ------------------------------------------------------------------ details drawer */

function DetailRow({ label, children }) {
    if (children === null || children === undefined || children === '') return null;
    return (
        <div className="grid grid-cols-3 gap-3 py-2 text-sm">
            <dt className="text-slate-400">{label}</dt>
            <dd className="col-span-2 text-slate-700">{children}</dd>
        </div>
    );
}

function DetailsDrawer({ theme, engineVersion, onClose }) {
    const { t } = useTranslation();
    if (!theme) return null;

    return createPortal(
        <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label={theme.name}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl">
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-slate-900">{theme.name}</h2>
                        <p className="truncate text-xs text-slate-400">{theme.author}{theme.latest_version ? ` · v${theme.latest_version}` : ''}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label={t('close', 'Close')}>
                        <HiOutlineXMark className="h-5 w-5" />
                    </button>
                </header>

                <div className="flex-1 px-5 py-4">
                    <div className="overflow-hidden rounded-xl border border-slate-100">
                        <ThemeShot theme={theme} />
                    </div>

                    {theme.description ? <p className="mt-4 text-sm leading-relaxed text-slate-600">{theme.description}</p> : null}

                    <dl className="mt-4 divide-y divide-slate-100">
                        <DetailRow label={t('theme_version', 'Version')}>{theme.latest_version ? `v${theme.latest_version}` : '—'}</DetailRow>
                        <DetailRow label={t('theme_author', 'Author')}>{theme.author || '—'}</DetailRow>
                        <DetailRow label={t('theme_license', 'License')}>{theme.premium ? t('theme_premium', 'Premium') : t('theme_free', 'Free')}</DetailRow>
                        {theme.premium ? <DetailRow label={t('theme_price', 'Price')}>{theme.price} {theme.currency}</DetailRow> : null}
                        <DetailRow label={t('theme_license_status', 'License status')}>
                            {theme.licensed ? t('theme_licensed', 'Licensed for this store') : t('theme_not_licensed', 'Purchase required')}
                        </DetailRow>
                        <DetailRow label={t('theme_signature', 'Signature')}>
                            <span className="inline-flex items-center gap-1 text-emerald-600"><HiOutlineCheckBadge className="h-4 w-4" />{t('theme_platform_verified', 'Platform-verified (first-party)')}</span>
                        </DetailRow>
                        <DetailRow label={t('theme_compatibility', 'Compatibility')}>
                            {`${t('theme_engine', 'Engine')} ≥ ${theme.minEngineVersion || '1.0.0'} · ${t('theme_engine_current', 'current')} ${engineVersion}`}
                        </DetailRow>
                        <DetailRow label={t('theme_category', 'Category')}>{theme.category || '—'}</DetailRow>
                        <DetailRow label={t('theme_installed_on', 'Installed')}>{fmtDate(theme.installedAt) || (theme.installed ? '—' : t('theme_not_installed', 'Not installed'))}</DetailRow>
                        {theme.installed ? <DetailRow label={t('theme_installed_version', 'Installed version')}>{theme.installedVersion ? `v${theme.installedVersion}` : '—'}</DetailRow> : null}
                    </dl>

                    {theme.capabilities?.length ? (
                        <div className="mt-4">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('theme_features', 'Supported features')}</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {theme.capabilities.map((f) => (
                                    <span key={f} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{f}</span>
                                ))}
                                {theme.tags?.map((f) => (
                                    <span key={f} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-500">{f}</span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {theme.updateAvailable && theme.updateNotes?.length ? (
                        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{t('theme_update_available', 'Update')} → v{theme.availableVersion}</h3>
                            <ul className="list-disc space-y-0.5 ps-4 text-sm text-amber-800">
                                {theme.updateNotes.map((n, i) => <li key={i}>{n}</li>)}
                            </ul>
                        </div>
                    ) : null}

                    <div className="mt-5">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('theme_update_history', 'Version history')}</h3>
                        {(theme.changelog || []).length === 0 ? (
                            <p className="text-sm text-slate-400">{t('theme_no_history', 'No history yet.')}</p>
                        ) : (
                            <ol className="space-y-2">
                                {[...(theme.changelog || [])].reverse().map((e) => (
                                    <li key={e.version} className="flex items-start gap-2 text-sm">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                        <span className="text-slate-600">
                                            <span className="font-medium text-slate-800">v{e.version}</span>
                                            {fmtDate(e.date) ? <span className="text-slate-400"> — {fmtDate(e.date)}</span> : null}
                                            {e.notes?.length ? <span className="block text-slate-500">{e.notes.join(' ')}</span> : null}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>

                </div>
            </aside>
        </div>,
        document.body,
    );
}

/* ------------------------------------------------------------------ manager (API-connected) */

const THEME_ACCENTS = [
    ['#312e81', '#7c3aed'],
    ['#075985', '#0ea5e9'],
    ['#064e3b', '#10b981'],
    ['#7c2d12', '#f97316'],
    ['#831843', '#ec4899'],
];

function ThemesManager({ mode = 'installed' }) {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const canManage = can('store.themes.manage') || can('stores-edit');
    const [rows, setRows] = useState([]);
    const [activeThemeId, setActiveThemeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [pending, setPending] = useState(() => new Set());
    const [confirmTheme, setConfirmTheme] = useState(null);
    const [detailTheme, setDetailTheme] = useState(null);
    // Marketplace only: category chips come from the public catalog; filtering is client-side.
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState('');
    const isMarketplace = mode === 'marketplace';

    useEffect(() => {
        if (!isMarketplace) return undefined;
        let cancelled = false;
        api.get('/marketplace/themes')
            .then(({ data }) => {
                if (cancelled) return;
                const list = Array.isArray(data?.categories) ? data.categories : [];
                setCategories(list.map((c) => String(c)).filter(Boolean));
            })
            .catch(() => { if (!cancelled) setCategories([]); });
        return () => { cancelled = true; };
    }, [isMarketplace]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`${apiBase}/themes`);
            setRows(Array.isArray(data?.data) ? data.data : []);
            setActiveThemeId(data?.active_theme_id ?? null);
            setLoadError('');
        } catch (error) {
            setLoadError(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        const currentUrl = new URL(window.location.href);
        const result = currentUrl.searchParams.get('theme_purchase');
        const session = currentUrl.searchParams.get('session_id');
        if (!result) return undefined;

        const clearResult = () => {
            currentUrl.searchParams.delete('theme_purchase');
            currentUrl.searchParams.delete('session_id');
            window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
        };

        if (result === 'cancelled') {
            toast(t('theme_purchase_cancelled', 'Theme purchase was cancelled.'));
            clearResult();
            return undefined;
        }

        if (result !== 'success' || !session) {
            clearResult();
            return undefined;
        }

        let cancelled = false;
        let timer;
        let attempt = 0;
        const terminal = new Set(['failed', 'expired', 'refunded', 'revoked']);

        const poll = async () => {
            attempt += 1;
            try {
                const { data } = await api.get(`${apiBase}/theme-purchases/${encodeURIComponent(session)}`);
                if (cancelled) return;
                if (data?.licensed) {
                    toast.success(t('theme_purchase_complete', 'Payment confirmed. Your theme license is active.'));
                    clearResult();
                    await load();
                    return;
                }
                if (terminal.has(data?.purchase?.status)) {
                    toast.error(t('theme_purchase_failed', 'The theme payment was not completed.'));
                    clearResult();
                    return;
                }
            } catch (error) {
                if (cancelled) return;
                if (error.response?.status !== 404 || attempt >= 6) {
                    toast.error(error.response?.data?.message || t('theme_purchase_pending', 'Payment is still being confirmed. Refresh shortly.'));
                    clearResult();
                    return;
                }
            }

            if (attempt >= 6) {
                toast(t('theme_purchase_pending', 'Payment is still being confirmed. Refresh shortly.'));
                clearResult();
                return;
            }
            timer = window.setTimeout(poll, 1500 * attempt);
        };

        void poll();
        return () => {
            cancelled = true;
            if (timer) window.clearTimeout(timer);
        };
    }, [apiBase, load, t]);

    const themes = useMemo(() => {
        return rows.map((entry, index) => {
            const [accent, accentAlt] = THEME_ACCENTS[index % THEME_ACCENTS.length];
            return {
                id: entry.id,
                key: entry.key,
                name: entry.name,
                description: entry.description || t('theme_no_description', 'Storefront theme'),
                author: entry.author,
                preview_image: entry.preview_image,
                latest_version: entry.latest_version,
                category: entry.category,
                minEngineVersion: '1.0.0',
                accent,
                accentAlt,
                capabilities: [],
                tags: [],
                changelog: [],
                premium: Number(entry.price || 0) > 0,
                price: entry.price,
                currency: entry.currency || 'USD',
                license_type: entry.license_type || 'free',
                licensed: Boolean(entry.licensed),
                is_featured: Boolean(entry.is_featured),
                installed: Boolean(entry.installed),
                installedVersion: entry.installed_version || null,
                isActive: Number(activeThemeId) === Number(entry.id),
                updateAvailable: Boolean(entry.update_available),
                _sortDate: String(entry.id).padStart(12, '0'),
            };
        });
    }, [activeThemeId, rows, t]);

    const run = useCallback(async (theme, action) => {
        setPending((current) => new Set(current).add(theme.id));
        try {
            return await action();
        } catch (error) {
            const fieldError = error.response?.data?.errors
                ? Object.values(error.response.data.errors)?.[0]?.[0]
                : null;
            const message = fieldError || error.response?.data?.message || error.message;
            toast.error(message);
            throw error;
        } finally {
            setPending((current) => {
                const next = new Set(current);
                next.delete(theme.id);
                return next;
            });
        }
    }, []);

    const installIfNeeded = useCallback(async (theme) => {
        if (!theme.installed) {
            await api.post(`${apiBase}/themes/install`, { theme_id: theme.id });
        }
    }, [apiBase]);

    const doPreview = (theme) => {
        // Open synchronously while the click still has browser activation, then
        // navigate it after the signed preview URL is returned by the API.
        const previewWindow = window.open('about:blank', '_blank');
        if (previewWindow) previewWindow.opener = null;
        void run(theme, async () => {
            const { data } = await api.post(`${apiBase}/themes/preview`, { theme_id: theme.id });
            if (!data?.preview_url) throw new Error(t('theme_preview_failed', 'Preview URL was not returned.'));
            if (previewWindow) previewWindow.location.href = data.preview_url;
            else window.open(data.preview_url, '_blank', 'noopener');
            await load();
        }).catch(() => previewWindow?.close());
    };

    const doPurchase = (theme) => {
        void run(theme, async () => {
            const { data } = await api.post(`${apiBase}/themes/${theme.id}/purchase`);
            if (data?.licensed) {
                toast.success(t('theme_license_ready', 'Theme license is ready.'));
                await load();
                return;
            }
            if (!data?.checkout_url) {
                throw new Error(t('theme_checkout_missing', 'Checkout URL was not returned.'));
            }
            window.location.assign(data.checkout_url);
        });
    };

    const doActivate = async (theme) => {
        setConfirmTheme(null);
        await run(theme, async () => {
            await installIfNeeded(theme);
            await api.post(`${apiBase}/themes/activate`, { theme_id: theme.id });
            toast.success(t('theme_activated', 'Theme activated and published.'));
            await load();
        });
    };

    const doUpdate = (theme) => {
        void run(theme, async () => {
            await api.post(`${apiBase}/themes/upgrade`, { theme_id: theme.id });
            toast.success(t('theme_updated', 'Theme updated.'));
            await load();
        });
    };

    const doCustomize = (theme) => navigate(`${uiBase}/themes/${theme.id}/settings`);

    /* ---- ordering ---- */

    // Installed tab: what this store has installed. Marketplace tab: the whole
    // catalog (installed ones included, so "Active"/"Installed" badges still show),
    // narrowed by the selected category chip.
    const visible = useMemo(() => {
        if (!isMarketplace) return themes.filter((th) => th.installed);
        if (!category) return themes;
        return themes.filter((th) => String(th.category || '').toLowerCase() === category.toLowerCase());
    }, [themes, isMarketplace, category]);

    const activeTheme = themes.find((th) => th.isActive) || null;

    // Admin (explicit store id) needs management permission; owners resolve their own store.
    if (id && !canManage) {
        return <Navigate to="/stores" replace />;
    }

    /* ---- render ---- */

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="border-s-4 border-brand ps-4">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        {isMarketplace ? t('store_themes_marketplace_title', 'Theme marketplace') : t('store_nav_themes', 'Themes')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {isMarketplace
                            ? t('store_themes_marketplace_subtitle', 'Discover, preview and install themes for your storefront.')
                            : t('store_themes_subtitle', 'Browse, preview and publish a theme for your storefront.')}
                    </p>
                </div>
                {canManage ? (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(`${uiBase}/overview`)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            <HiOutlineSquares2X2 className="h-4 w-4" aria-hidden />
                            {t('store_nav_overview', 'Overview')}
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Installed / Marketplace tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist">
                    <NavLink
                        to={`${uiBase}/themes`}
                        end
                        role="tab"
                        className={({ isActive }) => `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-white text-brand-dark shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <HiOutlineSwatch className="h-4 w-4" aria-hidden />
                        {t('theme_tab_installed', 'Installed')}
                        {!loading ? <span className="rounded-full bg-slate-200/70 px-1.5 text-[11px] text-slate-600">{themes.filter((th) => th.installed).length}</span> : null}
                    </NavLink>
                    <NavLink
                        to={`${uiBase}/themes/marketplace`}
                        role="tab"
                        className={({ isActive }) => `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-white text-brand-dark shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <HiOutlineSparkles className="h-4 w-4" aria-hidden />
                        {t('theme_tab_marketplace', 'Marketplace')}
                    </NavLink>
                </div>
                {isMarketplace && categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCategory('')}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${!category ? 'bg-brand text-white ring-brand' : 'bg-white text-slate-600 ring-slate-200 hover:bg-brand-light/70'}`}
                        >
                            {t('theme_category_all', 'All')}
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setCategory(c === category ? '' : c)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 transition ${category === c ? 'bg-brand text-white ring-brand' : 'bg-white text-slate-600 ring-slate-200 hover:bg-brand-light/70'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            {loadError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {loadError}
                    <button type="button" onClick={() => void load()} className="ms-3 font-semibold underline">
                        {t('action_retry', 'Retry')}
                    </button>
                </div>
            ) : null}

            {/* Active theme banner */}
            {activeTheme && !isMarketplace ? (
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="h-14 w-24 overflow-hidden rounded-lg border border-emerald-200 bg-white">
                        <ThemeShot theme={activeTheme} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <Badge tone="active" icon={HiOutlineCheckBadge}>{t('theme_active', 'Active')}</Badge>
                            <span className="truncate font-semibold text-slate-900">{activeTheme.name}</span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">{t('theme_current_live', 'This theme is live on your storefront.')}</p>
                    </div>
                    {canManage ? (
                        <button type="button" onClick={() => doCustomize(activeTheme)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
                            <HiOutlineAdjustmentsHorizontal className="h-4 w-4" /> {t('theme_customize', 'Customize')}
                        </button>
                    ) : null}
                </div>
            ) : null}

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
                    <HiOutlineArrowPath className="h-7 w-7 animate-spin text-brand" />
                </div>
            ) : visible.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                    <HiOutlineSwatch className="h-9 w-9 text-slate-300" />
                    {isMarketplace ? (
                        <>
                            <p className="text-base font-semibold text-slate-700">{t('theme_empty_none_title', 'No themes available')}</p>
                            <p className="max-w-sm text-sm text-slate-500">
                                {category
                                    ? t('theme_empty_category_body', 'No themes in this category yet.')
                                    : t('theme_empty_none_body', 'No themes have been published to the marketplace yet.')}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-base font-semibold text-slate-700">{t('theme_empty_installed_title', 'No themes installed yet')}</p>
                            <p className="max-w-sm text-sm text-slate-500">{t('theme_empty_installed_body', 'Pick a theme from the marketplace to get your storefront looking right.')}</p>
                            <NavLink to={`${uiBase}/themes/marketplace`} className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                                <HiOutlineSparkles className="h-4 w-4" aria-hidden />
                                {t('theme_tab_marketplace', 'Marketplace')}
                            </NavLink>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((th) => (
                        <ThemeCard
                            key={th.id}
                            theme={th}
                            isActive={th.isActive}
                            canManage={canManage}
                            busy={pending.has(th.id)}
                            onPreview={doPreview}
                            onActivate={setConfirmTheme}
                            onPurchase={doPurchase}
                            onCustomize={doCustomize}
                            onDetails={setDetailTheme}
                            onUpdate={doUpdate}
                        />
                    ))}
                </div>
            )}

            {/* Back link (admin multi-store) */}
            {id ? (
                <button type="button" onClick={() => navigate('/stores')} className="text-sm text-slate-500 hover:underline">
                    ← {t('stores_title', 'Stores')}
                </button>
            ) : null}

            {/* Overlays */}
            {confirmTheme ? <ActivateDialog theme={confirmTheme} busy={pending.has(confirmTheme.id)} onConfirm={doActivate} onClose={() => setConfirmTheme(null)} /> : null}
            {detailTheme ? <DetailsDrawer theme={detailTheme} engineVersion="1.0.0" onClose={() => setDetailTheme(null)} /> : null}
        </div>
    );
}

export default function StoreThemesPage({ mode = 'installed' }) {
    return <ThemesManager mode={mode} />;
}
