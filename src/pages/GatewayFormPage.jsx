import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../api/client';

function unwrap(payload) {
    return payload?.data ?? payload;
}

export default function GatewayFormPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAdmin, permissions } = useOutletContext();
    const can = (p) => isAdmin || permissions.includes(p);

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        if (!id || !can('gateways-list')) {
            return;
        }
        setErr('');
        api.get(`/gateways/${id}`)
            .then(({ data }) => {
                const row = unwrap(data);
                setName(row?.name ?? '');
                setSlug(row?.slug ?? '');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, isAdmin]);

    if (!can('gateways-edit')) {
        return <Navigate to="/gateways" replace />;
    }

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErr('');
        try {
            await api.put(`/gateways/${id}`, { name, slug });
            toast.success(t('action_edit'));
            navigate('/gateways');
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-lg space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('gateway_form_edit')}</h1>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('col_name')}</label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('col_slug')}</label>
                    <input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {t('product_form_save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/gateways')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
