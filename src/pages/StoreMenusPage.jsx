import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import useStoreScope from '../hooks/useStoreScope';

const TYPES = ['url', 'internal', 'category', 'product'];

function MenuEditor({ apiBase, handle }) {
    const { t } = useTranslation();
    const [name, setName] = useState(handle === 'header' ? 'Header menu' : 'Footer menu');
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        api.get(`${apiBase}/menus/${handle}`)
            .then(({ data }) => {
                setName(data.menu?.name ?? name);
                setItems((data.items ?? []).map((it) => ({ label: it.label, type: it.type, target: it.target ?? '' })));
            })
            .catch(() => { /* not created yet */ });
    }, [apiBase, handle]); // eslint-disable-line

    useEffect(() => { load(); }, [load]);

    const addItem = () => setItems((p) => [...p, { label: 'New link', type: 'url', target: '/' }]);
    const setItem = (i, k, v) => setItems((p) => p.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
    const removeItem = (i) => setItems((p) => p.filter((_, j) => j !== i));

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
            <div className="mb-3 flex items-center justify-between">
                <input value={name} onChange={(e) => setName(e.target.value)} className={`${cls} font-semibold`} />
                <span className="text-xs uppercase text-slate-400">{handle}</span>
            </div>
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                        <input value={it.label} onChange={(e) => setItem(i, 'label', e.target.value)} placeholder="Label" className={`${cls} flex-1 min-w-32`} />
                        <select value={it.type} onChange={(e) => setItem(i, 'type', e.target.value)} className={cls}>
                            {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                        </select>
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
    // Owners (no id) manage their own store; admins need stores-edit.
    if (id && !permissions.includes('stores-edit')) return <Navigate to="/stores" replace />;

    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('menus_title', 'Menus')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('menus_subtitle', 'Header & footer navigation.')}</p>
            </div>
            <MenuEditor apiBase={apiBase} handle="header" />
            <MenuEditor apiBase={apiBase} handle="footer" />
            <button type="button" onClick={() => navigate(`${uiBase}/pages`)} className="text-sm text-slate-500 hover:underline">← {t('pages_title', 'Pages')}</button>
        </div>
    );
}
