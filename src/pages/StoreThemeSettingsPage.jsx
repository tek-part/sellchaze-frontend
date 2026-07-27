import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import useStoreScope from '../hooks/useStoreScope';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';
import SearchableSelect from '../components/ui/SearchableSelect';

/** Flatten settings_schema groups -> field list. */
function fieldsOf(schema) {
    return (schema || []).flatMap((g) => (g.fields || []).map((f) => ({ ...f, group: g.label })));
}

function defaultsOf(schema) {
    const out = {};
    fieldsOf(schema).forEach((f) => {
        out[f.id] = f.default ?? (f.type === 'toggle' ? false : '');
    });
    return out;
}

/** Client-side live validation (mirrors the server ThemeSettingsValidator). */
function validate(field, value) {
    if (field.type === 'url' && value && !/^https?:\/\/.+/.test(value)) return 'Must be a valid URL';
    if ((field.type === 'number' || field.type === 'range') && value !== '' && Number.isNaN(Number(value))) return 'Must be a number';
    if (field.type === 'select' && field.options && value && !field.options.includes(value)) return 'Invalid option';
    return null;
}

export default function StoreThemeSettingsPage() {
    const { themeId } = useParams();
    const { id, apiBase, uiBase } = useStoreScope();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [schema, setSchema] = useState([]);
    const [values, setValues] = useState({});
    const [themeName, setThemeName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        api.get(`${apiBase}/themes/${themeId}`)
            .then(({ data }) => {
                const s = data.version?.settings_schema ?? [];
                setSchema(s);
                setThemeName(data.theme?.name ?? '');
                setValues({ ...defaultsOf(s), ...(data.install?.settings ?? {}) });
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [id, themeId]);

    useEffect(() => {
        load();
    }, [load]);

    const fields = useMemo(() => fieldsOf(schema), [schema]);
    const errors = useMemo(() => {
        const e = {};
        fields.forEach((f) => {
            const msg = validate(f, values[f.id]);
            if (msg) e[f.id] = msg;
        });
        return e;
    }, [fields, values]);
    const hasErrors = Object.keys(errors).length > 0;

    if (id && !can('stores-edit')) return <Navigate to="/stores" replace />;

    const setValue = (fid, v) => setValues((prev) => ({ ...prev, [fid]: v }));

    const save = async () => {
        if (hasErrors) return;
        setSaving(true);
        try {
            await api.put(`${apiBase}/themes/settings`, { theme_id: Number(themeId), settings: values });
            toast.success(t('theme_settings_saved', 'Settings saved'));
        } catch (e) {
            const serverErrors = e.response?.data?.errors?.settings;
            toast.error(Array.isArray(serverErrors) ? serverErrors.join(', ') : e.response?.data?.message || e.message);
        } finally {
            setSaving(false);
        }
    };

    const resetDefaults = () => setValues(defaultsOf(schema));

    const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';

    const renderField = (f) => {
        const v = values[f.id];
        switch (f.type) {
            case 'toggle':
                return <input type="checkbox" checked={!!v} onChange={(e) => setValue(f.id, e.target.checked)} />;
            case 'textarea':
                return <textarea rows={3} value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} className={inputClass} />;
            case 'select':
                return (
                    <SearchableSelect value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} className="w-full">
                        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </SearchableSelect>
                );
            case 'color':
                return <input type="color" value={v || '#000000'} onChange={(e) => setValue(f.id, e.target.value)} className="h-9 w-16 rounded-sm border border-slate-200" />;
            case 'number':
                return <input type="number" value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value === '' ? '' : Number(e.target.value))} className={inputClass} />;
            case 'range':
                return (
                    <div className="flex items-center gap-3">
                        <input type="range" min={f.min ?? 0} max={f.max ?? 100} value={v ?? f.min ?? 0} onChange={(e) => setValue(f.id, Number(e.target.value))} />
                        <span className="text-sm text-slate-600">{v}</span>
                    </div>
                );
            case 'url':
                return <input type="url" value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} placeholder="https://…" className={inputClass} />;
            default: // text, image (URL), etc.
                return <input type="text" value={v ?? ''} onChange={(e) => setValue(f.id, e.target.value)} className={inputClass} />;
        }
    };

    if (loading) return <p className="p-6 text-sm text-slate-500">…</p>;

    return (
        <div className="mx-auto max-w-6xl space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('theme_settings', 'Theme settings')}</h1>
                <p className="mt-1 text-sm text-slate-500">{themeName}</p>
            </div>
            {err && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

            <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                {schema.map((group) => (
                    <fieldset key={group.id} className="space-y-4">
                        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">{group.label}</legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {(group.fields || []).map((f) => (
                                <div key={f.id}>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">{f.label || f.id}</label>
                                    {renderField(f)}
                                    {errors[f.id] && <p className="mt-1 text-xs text-red-600">{errors[f.id]}</p>}
                                </div>
                            ))}
                        </div>
                    </fieldset>
                ))}

                <div className="flex gap-2 pt-2">
                    <button type="button" onClick={save} disabled={saving || hasErrors} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                        {t('product_form_save', 'Save')}
                    </button>
                    <button type="button" onClick={resetDefaults} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                        {t('theme_reset_defaults', 'Reset to defaults')}
                    </button>
                    <button type="button" onClick={() => navigate(`${uiBase}/themes`)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
                        {t('cancel', 'Cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
}
