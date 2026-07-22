import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineEnvelope, HiOutlineKey, HiOutlineSquares2X2, HiOutlineUser } from 'react-icons/hi2';
import api from '../api/client';

export default function SupplierFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [categories, setCategories] = useState([]);
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const [{ data: catData }, supplierRes] = await Promise.all([
                    api.get('/categories', { params: { per_page: 200 } }),
                    isEdit ? api.get(`/suppliers/${id}`) : Promise.resolve(null),
                ]);
                if (!active) return;
                setCategories(Array.isArray(catData?.data) ? catData.data : []);
                if (supplierRes?.data?.data) {
                    setName(supplierRes.data.data.name || '');
                    setEmail(supplierRes.data.data.email || '');
                    const { data } = await api.get(`/suppliers/${id}/routing-categories`);
                    if (!active) return;
                    setSelected(Array.isArray(data?.category_ids) ? data.category_ids : []);
                }
            } catch (e) {
                if (!active) return;
                setErr(e.response?.data?.message || e.message);
            }
        })();
        return () => {
            active = false;
        };
    }, [id, isEdit]);

    const toggleCategory = (cid) => {
        setSelected((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const payload = { name, email, ...(password ? { password } : {}) };
            let supplierId = Number(id);
            if (isEdit) {
                await api.put(`/suppliers/${id}`, payload);
            } else {
                const { data } = await api.post('/suppliers', payload);
                supplierId = Number(data?.data?.id);
            }
            if (supplierId > 0) {
                await api.put(`/suppliers/${supplierId}/routing-categories`, { category_ids: selected });
                navigate(`/suppliers/${supplierId}`);
            } else {
                navigate('/suppliers');
            }
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isEdit ? t('supplier_edit') : t('supplier_create')}
                </h1>
            </div>
            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
            <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlineUser className="h-4 w-4" />{t('col_name')}</span>
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
                    </label>
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlineEnvelope className="h-4 w-4" />{t('email')}</span>
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </label>
                </div>
                <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlineKey className="h-4 w-4" />{t('password')}</span>
                    <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? t('password_optional') : ''} required={!isEdit} />
                </label>
                <div>
                    <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlineSquares2X2 className="h-4 w-4" />{t('col_routing_categories')}</p>
                    <div className="flex max-h-64 flex-wrap gap-2 overflow-auto rounded-lg border border-slate-200 p-3">
                        {categories.map((c) => (
                            <label key={c.id} className="inline-flex items-center gap-1 rounded-sm border border-slate-200 px-2 py-1 text-xs">
                                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                                <span>{c.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('save')}</button>
                    <button type="button" onClick={() => navigate('/suppliers')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">{t('cancel')}</button>
                </div>
            </form>
        </div>
    );
}
