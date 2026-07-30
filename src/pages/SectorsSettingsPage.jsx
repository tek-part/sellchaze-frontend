import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlineSquares2X2, HiStar, HiOutlineStar } from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';

export default function SectorsSettingsPage() {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [sectors, setSectors] = useState([]);
    const [selected, setSelected] = useState(() => new Set());
    const [primaryId, setPrimaryId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const { data } = await api.get('/me/sectors', { params: { lang } });
            setSectors(Array.isArray(data?.sectors) ? data.sectors : []);
            setSelected(new Set(Array.isArray(data?.selected) ? data.selected : []));
            setPrimaryId(data?.primary_sector_id ?? null);
        } catch (e) {
            setError(true);
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setLoading(false);
        }
    }, [lang]);

    useEffect(() => { load(); }, [load]);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                // Unselecting the primary clears it — the backend will default to
                // the first selected node if none is chosen on save.
                setPrimaryId((p) => (p === id ? null : p));
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const setPrimary = (id) => {
        setPrimaryId((p) => (p === id ? null : id));
    };

    const count = selected.size;

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await api.put('/me/sectors', {
                sector_ids: [...selected],
                primary_sector_id: primaryId,
            });
            setSelected(new Set(Array.isArray(data?.selected) ? data.selected : []));
            setPrimaryId(data?.primary_sector_id ?? null);
            toast.success(data?.message || t('mysec_saved', 'Saved'));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    const hint = useMemo(
        () => t('mysec_count', '{{n}} selected').replace('{{n}}', String(count)),
        [t, count],
    );

    if (loading) return <div className="p-10 text-slate-400">{t('mysec_loading', 'Loading sectors…')}</div>;

    if (error) {
        return (
            <div className="space-y-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {t('mysec_error', 'Could not load your sectors. Please try again.')}
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
                >
                    {t('retry', 'Retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-24">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
                    <HiOutlineSquares2X2 className="h-7 w-7 text-brand" aria-hidden />
                    {t('mysec_title', 'My sectors')}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {t('mysec_intro', 'Choose the sectors your business appears under in the directory.')}
                </p>
            </div>

            {sectors.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500 shadow-card">
                    {t('mysec_empty', 'No sectors are available yet.')}
                </div>
            ) : (
                <div className="grid gap-4">
                    {sectors.map((sector) => {
                        const rootSelected = selected.has(sector.id);
                        return (
                            <section
                                key={sector.id}
                                className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200"
                            >
                                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={rootSelected}
                                            onChange={() => toggle(sector.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                                        />
                                        <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-900">
                                            {sector.icon ? <span aria-hidden>{sector.icon}</span> : null}
                                            <span className="truncate">{sector.name}</span>
                                        </span>
                                    </label>
                                    {rootSelected ? (
                                        <PrimaryToggle
                                            active={primaryId === sector.id}
                                            onClick={() => setPrimary(sector.id)}
                                            t={t}
                                        />
                                    ) : null}
                                </div>

                                {sector.children?.length ? (
                                    <div className="flex flex-wrap gap-2 p-4">
                                        {sector.children.map((child) => {
                                            const childSelected = selected.has(child.id);
                                            return (
                                                <div
                                                    key={child.id}
                                                    className={[
                                                        'flex items-center gap-1.5 rounded-full border px-1 py-1 ps-3 text-sm transition-colors',
                                                        childSelected
                                                            ? 'border-brand/40 bg-brand-light/60 text-brand-dark'
                                                            : 'border-slate-200 text-slate-600',
                                                    ].join(' ')}
                                                >
                                                    <label className="flex cursor-pointer items-center gap-1.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={childSelected}
                                                            onChange={() => toggle(child.id)}
                                                            className="h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand"
                                                        />
                                                        <span>{child.name}</span>
                                                    </label>
                                                    {childSelected ? (
                                                        <PrimaryToggle
                                                            active={primaryId === child.id}
                                                            onClick={() => setPrimary(child.id)}
                                                            t={t}
                                                            compact
                                                        />
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </section>
                        );
                    })}
                </div>
            )}

            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">{hint}</span>
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {saving ? t('mysec_saving', 'Saving…') : t('mysec_save', 'Save')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PrimaryToggle({ active, onClick, t, compact = false }) {
    const label = active ? t('mysec_primary', 'Primary') : t('mysec_set_primary', 'Set as primary');
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={[
                'inline-flex shrink-0 items-center gap-1 rounded-full font-semibold transition-colors',
                compact ? 'p-1' : 'px-2 py-1 text-xs',
                active ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500',
            ].join(' ')}
        >
            {active ? (
                <HiStar className={compact ? 'h-4 w-4' : 'h-4 w-4'} aria-hidden />
            ) : (
                <HiOutlineStar className={compact ? 'h-4 w-4' : 'h-4 w-4'} aria-hidden />
            )}
            {!compact ? <span>{label}</span> : null}
        </button>
    );
}
