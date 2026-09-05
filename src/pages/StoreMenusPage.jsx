import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';
import useStoreLocales from '../hooks/useStoreLocales';
import SearchableSelect from '../components/ui/SearchableSelect';
import LocaleTabs, { localeLabel } from '../components/store/LocaleTabs';
import { completeness, pickLocalized, setLocalized, toLocalized } from '../lib/localized';

const TYPES = ['url', 'internal', 'category', 'product'];

function MenuEditor({ apiBase, handle, locales, defaultLocale }) {
    const { t } = useTranslation();
    const [name, setName] = useState(handle === 'header' ? 'Header menu' : 'Footer menu');
    // Item labels are localized objects `{ ar, en }` (the API returns `label` + `label_i18n`; a
    // legacy string label lands on the store's default locale).
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);
    const [locale, setLocale] = useState(defaultLocale);

    useEffect(() => { setLocale((cur) => (locales.includes(cur) ? cur : defaultLocale)); }, [locales, defaultLocale]);

    const load = useCallback(() => {
        api.get(`${apiBase}/menus/${handle}`)
            .then(({ data }) => {
                setName(data.menu?.name ?? name);
                setItems((data.items ?? []).map((it) => ({
                    label: toLocalized(it.label_i18n ?? it.label, locales, defaultLocale),
                    type: it.type,
                    target: it.target ?? '',
                })));
            })
            .catch(() => { /* not created yet */ });
    }, [apiBase, handle, locales, defaultLocale]); // eslint-disable-line

    useEffect(() => { load(); }, [load]);

    const addItem = () => setItems((p) => [...p, { label: toLocalized('New link', locales, defaultLocale), type: 'url', target: '/' }]);
    const setItem = (i, k, v) => setItems((p) => p.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
    const setLabel = (i, v) => setItems((p) => p.map((it, j) => (j === i ? { ...it, label: setLocalized(it.label, locale, v, locales, defaultLocale) } : it)));
    const removeItem = (i) => setItems((p) => p.filter((_, j) => j !== i));

    const progress = useMemo(
        () => completeness(Object.fromEntries(items.map((it, i) => [`item_${i}`, it.label])), locales),
        [items, locales],
    );

    const copyFrom = (from, to) => setItems((p) => p.map((it) => ({
        ...it,
        label: setLocalized(it.label, to, pickLocalized(it.label, from), locales, defaultLocale),
    })));

    const save = async () => {
        setSaving(true);
        try {
            await api.put(`${apiBase}/menus/${handle}`, { name, items });
            toast.success(t('menu_saved', 'Menu saved'));
            load();
        } catch (e) { toast.error(e.response?.data?.message || e.message); }
        finally { setSaving(false); }
    };

    const cls = 'rounded-lg border border-slate-200 px-2 py-1.5 text-sm';

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <input value={name} onChange={(e) => setName(e.target.value)} className={`${cls} font-semibold`} />
                <span className="text-xs uppercase text-slate-400">{handle}</span>
            </div>
            {items.length > 0 ? (
                <LocaleTabs
                    className="mb-3"
                    size="sm"
                    locales={locales}
                    value={locale}
                    onChange={setLocale}
                    defaultLocale={defaultLocale}
                    completeness={progress}
                    onCopyFrom={copyFrom}
                />
            ) : null}
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                        <input
                            value={it.label?.[locale] ?? ''}
                            onChange={(e) => setLabel(i, e.target.value)}
                            placeholder={t('menu_label_locale', { locale: localeLabel(locale, t), defaultValue: 'Label ({{locale}})' })}
                            dir={locale === 'ar' ? 'rtl' : 'ltr'}
                            lang={locale}
                            className={`${cls} flex-1 min-w-32`}
                        />
                        <SearchableSelect value={it.type} onChange={(e) => setItem(i, 'type', e.target.value)} className="w-full sm:w-56">
                            {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                        </SearchableSelect>
                        <input value={it.target} onChange={(e) => setItem(i, 'target', e.target.value)} placeholder="target (slug/url)" className={`${cls} flex-1 min-w-32`} />
                        <button type="button" onClick={() => removeItem(i)} className="rounded-sm border px-2 py-1 text-sm text-red-600">×</button>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex gap-2">
                <button type="button" onClick={addItem} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">{t('menu_add_item', '+ Item')}</button>
                <button type="button" disabled={saving} onClick={save} className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{t('product_form_save', 'Save')}</button>
            </div>
        </div>
    );
}

export default function StoreMenusPage() {
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const { locales, defaultLocale, loading: localesLoading } = useStoreLocales();
    // Owners (no id) manage their own store; admins need stores-edit.
    if (id && !permissions.includes('stores-edit')) return <Navigate to="/stores" replace />;

    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('menus_title', 'Menus')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('menus_subtitle', 'Header & footer navigation.')}</p>
            </div>
            {localesLoading ? <p className="text-sm text-slate-400">{t('loading', 'Loading…')}</p> : (
                <>
                    <MenuEditor apiBase={apiBase} handle="header" locales={locales} defaultLocale={defaultLocale} />
                    <MenuEditor apiBase={apiBase} handle="footer" locales={locales} defaultLocale={defaultLocale} />
                </>
            )}
            <button type="button" onClick={() => navigate(`${uiBase}/pages`)} className="text-sm text-slate-500 hover:underline">← {t('pages_title', 'Pages')}</button>
        </div>
    );
}
