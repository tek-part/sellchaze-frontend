import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineEnvelope, HiOutlineKey, HiOutlinePhone, HiOutlineUser } from 'react-icons/hi2';
import api from '../api/client';

export default function MerchantFormPage() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!isEdit) return undefined;
        let active = true;
        (async () => {
            try {
                const { data } = await api.get(`/merchants/${id}`);
                if (!active) return;
                const row = data?.data;
                if (row) {
                    setName(row.name || '');
                    setEmail(row.email || '');
                    setPhone(row.phone || '');
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

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const payload = { name, email, ...(phone ? { phone } : {}), ...(password ? { password } : {}) };
            if (isEdit) {
                await api.put(`/merchants/${id}`, payload);
                navigate(`/merchants/${id}`);
            } else {
                const { data } = await api.post('/merchants', payload);
                const newId = Number(data?.data?.id);
                navigate(newId > 0 ? `/merchants/${newId}` : '/merchants');
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
                    {isEdit ? t('merchant_edit', 'Edit merchant') : t('merchant_create', 'Create merchant')}
                </h1>
            </div>
            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
            <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlineUser className="h-4 w-4" />{t('col_name')}</span>
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
                    </label>
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlineEnvelope className="h-4 w-4" />{t('email')}</span>
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </label>
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlinePhone className="h-4 w-4" />{t('phone')}</span>
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </label>
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-slate-500"><HiOutlineKey className="h-4 w-4" />{t('password')}</span>
                        <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? t('password_optional') : ''} required={!isEdit} />
                    </label>
                </div>
                <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('save')}</button>
                    <button type="button" onClick={() => navigate('/merchants')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">{t('cancel')}</button>
                </div>
            </form>
        </div>
    );
}
