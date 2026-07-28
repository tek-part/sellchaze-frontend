import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlineArrowLeft,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineArrowUp,
    HiOutlineArrowDown,
    HiOutlineDocumentText,
    HiOutlineRectangleStack,
    HiOutlineCheck,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';
const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20';

/** One scalar field (text/url/image/textarea/richtext/lines/toggle). */
function Field({ field, value, onChange, t }) {
    const { type } = field;
    const label = t(field.label, field.label);
    const placeholder = field.placeholder ? t(field.placeholder, '') : undefined;

    if (type === 'toggle') {
        return (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                />
                {label}
            </label>
        );
    }

    if (type === 'textarea' || type === 'richtext') {
        return (
            <div>
                <label className={labelClass}>{label}</label>
                <textarea rows={type === 'richtext' ? 6 : 3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
            </div>
        );
    }

    if (type === 'lines') {
        const text = Array.isArray(value) ? value.join('\n') : value ?? '';
        return (
            <div>
                <label className={labelClass}>{label}</label>
                <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.replace(/\r$/, '')))}
                    placeholder={placeholder}
                    className={`${inputClass} font-mono`}
                />
            </div>
        );
    }

    return (
        <div>
            <label className={labelClass}>{label}</label>
            <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? (type === 'image' ? 'https://…' : undefined)} className={inputClass} />
            {type === 'image' && value ? <img src={value} alt="" className="mt-2 h-24 w-auto rounded-lg object-cover ring-1 ring-slate-200" /> : null}
        </div>
    );
}

/** A repeater: an ordered list of objects edited with the item's sub-fields. */
function Repeater({ field, value, onChange, t }) {
    const items = Array.isArray(value) ? value : [];
    const blank = () => Object.fromEntries((field.item ?? []).map((f) => [f.key, f.type === 'toggle' ? false : f.type === 'lines' ? [] : '']));
    const update = (idx, key, v) => onChange(items.map((it, i) => (i === idx ? { ...it, [key]: v } : it)));
    const add = () => onChange([...items, blank()]);
    const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
    const move = (idx, dir) => {
        const j = idx + dir;
        if (j < 0 || j >= items.length) return;
        const next = items.slice();
        [next[idx], next[j]] = [next[j], next[idx]];
        onChange(next);
    };

    return (
        <div className="space-y-3">
            {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">{t('no_results', 'No items')}</p>
            ) : null}
            {items.map((it, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">#{idx + 1}</span>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => move(idx, -1)} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"><HiOutlineArrowUp className="h-4 w-4" /></button>
                            <button type="button" onClick={() => move(idx, 1)} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"><HiOutlineArrowDown className="h-4 w-4" /></button>
                            <button type="button" onClick={() => remove(idx)} className="rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600"><HiOutlineTrash className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {(field.item ?? []).map((sub) => (
                            <Field key={sub.key} field={sub} value={it[sub.key]} onChange={(v) => update(idx, sub.key, v)} t={t} />
                        ))}
                    </div>
                </div>
            ))}
            <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-brand hover:bg-slate-50">
                <HiOutlinePlus className="h-4 w-4" aria-hidden /> {t('add', 'Add')}
            </button>
        </div>
    );
}

/** A card shell matching the product form's look. */
function Card({ icon: Icon, title, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            </div>
            {children}
        </div>
    );
}

export default function StoreContentPageEditor() {
    const { key } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { apiBase, uiBase } = useStoreScope();

    const [page, setPage] = useState(null);
    // Bilingual payload: one full copy of the fields per locale.
    const [data, setData] = useState({ en: {}, ar: {} });
    const [locale, setLocale] = useState('ar');
    const [isPublished, setIsPublished] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        setLoading(true);
        api.get(`${apiBase}/content`)
            .then(({ data: res }) => {
                const found = (res.data ?? []).find((p) => p.key === key);
                if (!found) {
                    setErr('Page not found');
                    return;
                }
                const d = found.data && !Array.isArray(found.data) ? found.data : {};
                setPage(found);
                setData({ en: d.en ?? {}, ar: d.ar ?? {} });
                setIsPublished(found.is_published ?? true);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [apiBase, key]);

    const locData = data[locale] ?? {};
    const setField = (fk, v) => setData((d) => ({ ...d, [locale]: { ...(d[locale] ?? {}), [fk]: v } }));

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`${apiBase}/content/${key}`, { data, is_published: isPublished });
            toast.success(t('product_form_save', 'Save'));
            navigate(`${uiBase}/pages`);
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    const fields = useMemo(() => page?.fields ?? [], [page]);
    const scalarFields = fields.filter((f) => f.type !== 'repeater');
    const repeaterFields = fields.filter((f) => f.type === 'repeater');

    if (loading) return <div className="p-8 text-center text-slate-400">{t('loading', 'Loading…')}</div>;
    if (err) return <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header action bar (mirrors the product form). */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(`${uiBase}/pages`)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                        <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    </button>
                    <div className="border-s-4 border-brand ps-4">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t(page.label, page.label)}</h1>
                        <p className="mt-0.5 text-sm text-slate-500">{page.path}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => navigate(`${uiBase}/pages`)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <HiOutlineXMark className="h-4 w-4" aria-hidden /> {t('cancel', 'Cancel')}
                    </button>
                    <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50">
                        <HiOutlineCheck className="h-4 w-4" aria-hidden /> {saving ? '…' : t('product_form_save', 'Save')}
                    </button>
                </div>
            </div>

            {/* Language tabs — edit the English and Arabic copies of every field. */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                {[{ id: 'ar', label: 'العربية' }, { id: 'en', label: 'English' }].map((l) => (
                    <button
                        key={l.id}
                        type="button"
                        onClick={() => setLocale(l.id)}
                        className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${locale === l.id ? 'bg-brand text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        {l.label}
                    </button>
                ))}
            </div>

            {/* Scalar fields grouped into cards by `group` (default 'main'). */}
            {(() => {
                const order = [];
                const byGroup = {};
                scalarFields.forEach((f) => {
                    const g = f.group || 'main';
                    if (!byGroup[g]) { byGroup[g] = []; order.push(g); }
                    byGroup[g].push(f);
                });
                return order.map((g) => (
                    <Card key={g} icon={g === 'main' ? HiOutlineDocumentText : HiOutlineRectangleStack} title={g === 'main' ? t(page.label, page.label) : t(`cpg_${g}`, g)}>
                        <div className="space-y-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                            {byGroup[g].map((f) => (
                                <Field key={f.key} field={f} value={locData[f.key]} onChange={(v) => setField(f.key, v)} t={t} />
                            ))}
                        </div>
                        {g === 'main' ? (
                            <label className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm font-medium text-slate-700">
                                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30" />
                                {t('published', 'Published')}
                            </label>
                        ) : null}
                    </Card>
                ));
            })()}

            {/* Each repeater in its own card. */}
            {repeaterFields.map((f) => (
                <Card key={f.key} icon={HiOutlineRectangleStack} title={t(f.label, f.label)}>
                    <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                        <Repeater field={f} value={locData[f.key]} onChange={(v) => setField(f.key, v)} t={t} />
                    </div>
                </Card>
            ))}
        </div>
    );
}
