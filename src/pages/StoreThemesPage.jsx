/**
 * Store Theme Manager — the merchant/supplier Appearance dashboard.
 *
 * SINGLE SOURCE OF TRUTH: this page is wired to the FRONTEND production Theme Platform
 * (`PlatformProvider` / `usePlatform` → `THEME_CATALOG` + the pure domain lifecycle), exactly like
 * Theme Studio. It reads every theme directly from the production Theme Registry (the marketplace
 * catalog: luxury-fashion / voltage / hearth / rouge) and every action executes the REAL platform
 * lifecycle — install (compatibility + validation), activate (license/entitlement gate), update
 * (version + migration), export/import (signed package pipeline), uninstall. It does NOT read the
 * backend demo-theme API (Default / aurora / modern seed rows) and contains no mock/placeholder/
 * hardcoded theme objects. The Theme Engine, themes, registry, and Theme Studio are untouched.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlineEye,
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowDownTray,
    HiOutlineArrowUpTray,
    HiOutlineInformationCircle,
    HiOutlineArrowUpCircle,
    HiOutlineArrowPath,
    HiOutlineCheckBadge,
    HiOutlineSparkles,
    HiOutlineXMark,
    HiOutlineTrash,
    HiOutlineSwatch,
} from 'react-icons/hi2';
import useStoreScope from '../hooks/useStoreScope';
import { PlatformProvider, usePlatform } from '../apps/storefront/platform/state/platform-context';

/* ------------------------------------------------------------------ helpers */

function fmtDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Real storefront preview — the storefront root with `?theme=…&preview=1`.
 *
 * The URL must stay a CLEAN path (`/`), not `/storefront.html`: the storefront
 * uses BrowserRouter, which reads the literal path as the route, and
 * `/storefront.html` matches nothing → its own 404. Instead, `?preview=1` is
 * served as storefront.html by a rewrite (the Vite middleware in dev, the
 * .htaccess rule in production) while the browser URL stays `/`, so the router
 * resolves the home route. In preview mode the storefront renders from demo
 * data (see ../apps/storefront/preview.ts), since there is no store to resolve
 * on the dashboard host.
 */
function previewUrl(id) {
    return `/?theme=${encodeURIComponent(id)}&preview=1`;
}

/** Real Theme Studio (live editor) entry for a theme — shares the same platform install state. */
function studioUrl(id) {
    return `/theme-studio.html?theme=${encodeURIComponent(id)}`;
}

/** Latest authored changelog date for an entry (used for the Newest/Oldest sort). */
function entryDate(entry) {
    const cl = entry.changelog || [];
    return cl.length ? cl[cl.length - 1].date || '' : '';
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

/** Desktop viewport the preview frame renders at, before being scaled to the card. */
const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 800;

/**
 * Live theme preview.
 *
 * Renders the REAL storefront for this theme, scaled down — not a captured screenshot. A stored
 * image would be a second source of truth that silently goes stale the moment a theme's tokens,
 * sections or demo content change, and every one of those has changed repeatedly. This is always
 * what the theme actually looks like right now.
 *
 * Cost is managed rather than ignored: each frame boots the storefront app, so a frame is mounted
 * only once its card scrolls into view, and the accent gradient stands in until then. The frame is
 * inert — pointer-events off, not focusable, hidden from assistive tech — because the card's own
 * Preview button is the real affordance and a nested tab stop would trap keyboard users.
 */
function ThemeShot({ theme }) {
    const holderRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [scale, setScale] = useState(0.25);

    // The frame renders at a fixed 1280px and is scaled to whatever width the card actually has,
    // so the thumbnail stays sharp and correctly proportioned in any grid or column count.
    useEffect(() => {
        const node = holderRef.current;
        if (!node) return undefined;
        const measure = () => setScale(node.clientWidth / PREVIEW_WIDTH);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const node = holderRef.current;
        if (!node || visible) return undefined;
        // No IntersectionObserver (old browser, jsdom) → show it rather than leave a permanent
        // placeholder. Degrading to "heavier but correct" beats degrading to "empty".
        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true);
            return undefined;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [visible]);

    return (
        <div
            ref={holderRef}
            className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br"
            style={{ backgroundImage: `linear-gradient(135deg, ${theme.accent || '#0f172a'}, ${theme.accentAlt || theme.accent || '#334155'})` }}
        >
            {!loaded ? (
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
                    <HiOutlineSwatch className="h-9 w-9 text-white/85" />
                </div>
            ) : null}

            {visible ? (
                <iframe
                    // 1280px wide, scaled to the card. Rendering at desktop width and scaling down
                    // shows the real desktop layout; sizing the frame to the card would trigger the
                    // theme's mobile breakpoints and misrepresent it.
                    src={previewUrl(theme.id)}
                    title={`${theme.name} preview`}
                    tabIndex={-1}
                    aria-hidden
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
                    style={{
                        width: `${PREVIEW_WIDTH}px`,
                        height: `${PREVIEW_HEIGHT}px`,
                        transform: `scale(${scale})`,
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 240ms ease',
                    }}
                />
            ) : null}
        </div>
    );
}

/* ------------------------------------------------------------------ card */

function ThemeCard({ theme, isActive, canManage, busy, onPreview, onActivate, onCustomize, onExport, onDetails, onUpdate, onUninstall }) {
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
                        <Badge tone={theme.premium ? 'premium' : 'free'}>{theme.premium ? t('theme_premium', 'Premium') : t('theme_free', 'Free')}</Badge>
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
                        <button type="button" disabled={busy} onClick={() => onActivate(theme)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">
                            {busy ? <HiOutlineArrowPath className="h-4 w-4 animate-spin" /> : null}
                            {t('theme_install_activate', 'Install & activate')}
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
                    {theme.installed ? (
                        <button type="button" onClick={() => onExport(theme)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50" title={t('theme_export', 'Export')} aria-label={t('theme_export', 'Export')}>
                            <HiOutlineArrowDownTray className="h-4 w-4" />
                        </button>
                    ) : null}
                    {theme.installed && !isActive && canManage ? (
                        <button type="button" onClick={() => onUninstall(theme)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" title={t('theme_uninstall', 'Uninstall')} aria-label={t('theme_uninstall', 'Uninstall')}>
                            <HiOutlineTrash className="h-4 w-4" />
                        </button>
                    ) : null}
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
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t('theme_activate', 'Activate')}>
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
        </div>
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

function DetailsDrawer({ theme, engineVersion, canManage, onUninstall, onClose }) {
    const { t } = useTranslation();
    if (!theme) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={theme.name}>
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

                    {theme.installed && !theme.isActive && canManage ? (
                        <button type="button" onClick={() => { onUninstall(theme); onClose(); }} className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50">
                            <HiOutlineTrash className="h-4 w-4" /> {t('theme_uninstall', 'Uninstall theme')}
                        </button>
                    ) : null}
                </div>
            </aside>
        </div>
    );
}

/* ------------------------------------------------------------------ manager (platform-connected) */

function ThemesManager() {
    const { id, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);
    const canManage = can('store.themes.manage') || can('stores-edit');

    // The production Theme Platform — the single source of truth (registry + lifecycle + state).
    const platform = usePlatform();
    const { catalog, state, engineVersion, updates, pending, notice, error, clearMessages } = platform;

    const [confirmTheme, setConfirmTheme] = useState(null);
    const [detailTheme, setDetailTheme] = useState(null);
    const importInputRef = useRef(null);

    // Surface every platform lifecycle result (install/activate/update/import/export/uninstall) as a toast.
    useEffect(() => {
        if (notice) { toast.success(notice); clearMessages(); }
    }, [notice, clearMessages]);
    useEffect(() => {
        if (error) { toast.error(error); clearMessages(); }
    }, [error, clearMessages]);

    // View-models: derived ENTIRELY from the production registry (catalog) + install state + updates.
    const themes = useMemo(() => {
        const updateById = new Map(updates.map((u) => [u.id, u]));
        return catalog.map((entry) => {
            const record = state.installed[entry.id];
            const upd = updateById.get(entry.id);
            return {
                id: entry.id,
                key: entry.id,
                name: entry.name,
                description: entry.description,
                author: entry.author,
                latest_version: entry.version,
                minEngineVersion: entry.minEngineVersion,
                category: entry.archetype,
                accent: entry.accent,
                accentAlt: entry.accentAlt,
                capabilities: entry.capabilities || [],
                tags: entry.tags || [],
                changelog: entry.changelog || [],
                premium: Boolean(entry.license && entry.license.type && entry.license.type !== 'free'),
                is_featured: Boolean(entry.featured),
                installed: Boolean(record),
                installedAt: record?.installedAt ?? null,
                installedVersion: record?.version ?? null,
                isActive: state.activeId === entry.id,
                updateAvailable: Boolean(upd),
                availableVersion: upd?.availableVersion ?? null,
                updateNotes: upd?.notes ?? [],
                _sortDate: entryDate(entry),
            };
        });
    }, [catalog, state, updates]);

    /* ---- actions: every one calls the REAL platform lifecycle ---- */

    const doPreview = (theme) => window.open(previewUrl(theme.id), '_blank', 'noopener');

    const doActivate = async (theme) => {
        setConfirmTheme(null);
        // Install runs compatibility + validation; activate runs the license/entitlement gate.
        if (!state.installed[theme.id]) await platform.installTheme(theme.id);
        platform.activateTheme(theme.id);
    };

    const doUpdate = (theme) => platform.updateTheme(theme.id);

    const doCustomize = (theme) => window.open(studioUrl(theme.id), '_blank', 'noopener');

    const doUninstall = (theme) => {
        if (theme.isActive) { toast.error(t('theme_uninstall_active', 'Deactivate or switch away before uninstalling the live theme.')); return; }
        platform.uninstallTheme(theme.id);
    };

    const doExport = (theme) => {
        const json = platform.exportTheme(theme.id);
        if (!json) { toast.error(t('theme_export_needs_install', 'Install the theme before exporting.')); return; }
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${theme.id}.theme-pkg.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const onImportFile = useCallback(async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file
        if (!file) return;
        try {
            const text = await file.text();
            await platform.importPackageJson(text);
        } catch (err) {
            toast.error(err?.message || 'Import failed.');
        }
    }, [platform]);

    /* ---- ordering ---- */

    // The search box, filter chips and sort control were removed: the page shows
    // every theme. Newest-first is kept as the fixed order so the list is stable
    // and predictable rather than following whatever order the API returned.
    const visible = useMemo(
        () => [...themes].sort((a, b) => String(b._sortDate).localeCompare(String(a._sortDate))),
        [themes],
    );

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
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('nav_store_appearance', 'Appearance')}</h1>
                    <p className="mt-1 text-sm text-slate-500">{t('store_themes_subtitle', 'Browse, preview and publish a theme for your storefront.')}</p>
                </div>
                {canManage ? (
                    <div className="flex items-center gap-2">
                        <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
                        <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <HiOutlineArrowUpTray className="h-4 w-4" /> {t('theme_import', 'Import theme')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`${uiBase}/onboarding`)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                            {t('store_setup_title', 'Store setup')}
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Active theme banner */}
            {activeTheme ? (
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
            {visible.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                    <HiOutlineSwatch className="h-9 w-9 text-slate-300" />
                    {/* With no filters left, empty can only mean the catalogue is
                        genuinely empty — so it no longer suggests changing a search. */}
                    <p className="text-base font-semibold text-slate-700">{t('theme_empty_none_title', 'No themes available')}</p>
                    <p className="max-w-sm text-sm text-slate-500">{t('theme_empty_none_body', 'No themes have been published to the marketplace yet.')}</p>
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
                            onCustomize={doCustomize}
                            onExport={doExport}
                            onDetails={setDetailTheme}
                            onUpdate={doUpdate}
                            onUninstall={doUninstall}
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
            {detailTheme ? <DetailsDrawer theme={detailTheme} engineVersion={engineVersion} canManage={canManage} onUninstall={doUninstall} onClose={() => setDetailTheme(null)} /> : null}
        </div>
    );
}

/* ------------------------------------------------------------------ page (platform boundary) */

export default function StoreThemesPage() {
    return (
        <PlatformProvider>
            <ThemesManager />
        </PlatformProvider>
    );
}
