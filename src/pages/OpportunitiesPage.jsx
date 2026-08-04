import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    HiOutlineRocketLaunch,
    HiOutlineBuildingOffice2,
    HiOutlineUsers,
    HiOutlineMapPin,
    HiOutlineCheckBadge,
} from 'react-icons/hi2';
import api from '../api/client';

const KINDS = ['investment', 'partnership'];

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rejected: 'bg-red-50 text-red-700 border-red-100',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const EMPTY_FORM = {
    kind: 'investment',
    title: '',
    description: '',
    amount_sought: '',
    equity_offered: '',
    city: '',
    contact_email: '',
    contact_phone: '',
};

/**
 * Investment & partnership opportunities. Factories list themselves as open to
 * investment or partnership (reviewed by Sellchaze before publishing), and
 * everyone can browse the approved board.
 */
export default function OpportunitiesPage() {
    const { t } = useTranslation();

    const [tab, setTab] = useState('board'); // board | mine | new
    const [kindFilter, setKindFilter] = useState('');
    const [board, setBoard] = useState([]);
    const [mine, setMine] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');
    const [success, setSuccess] = useState('');

    const loadBoard = () => {
        setLoading(true);
        api.get('/opportunities', { params: kindFilter ? { kind: kindFilter } : {} })
            .then((res) => setBoard(res.data?.data ?? []))
            .catch(() => setBoard([]))
            .finally(() => setLoading(false));
    };

    const loadMine = () => {
        api.get('/me/opportunities')
            .then((res) => setMine(res.data?.data ?? []))
            .catch(() => setMine([]));
    };

    useEffect(loadBoard, [kindFilter]);
    useEffect(loadMine, []);

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        setSuccess('');
        setSubmitting(true);
        try {
            await api.post('/opportunities', {
                kind: form.kind,
                title: form.title.trim(),
                description: form.description.trim(),
                amount_sought: form.amount_sought ? Number(form.amount_sought) : null,
                equity_offered: form.equity_offered ? Number(form.equity_offered) : null,
                city: form.city.trim() || null,
                contact_email: form.contact_email.trim() || null,
                contact_phone: form.contact_phone.trim() || null,
            });
            setSuccess(t('opp_submitted', 'Your listing was submitted and is under review.'));
            setForm(EMPTY_FORM);
            loadMine();
            setTab('mine');
        } catch (e2) {
            setErr(e2?.response?.data?.message || t('opp_error', 'Could not submit your listing. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    const fieldClass =
        'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
    const tabClass = (key) =>
        `rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === key ? 'bg-brand text-white shadow-xs' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
        }`;

    const KindBadge = ({ kind }) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
            {kind === 'investment' ? (
                <HiOutlineBuildingOffice2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
                <HiOutlineUsers className="h-3.5 w-3.5" aria-hidden />
            )}
            {t(`opp_kind_${kind}`, kind)}
        </span>
    );

    const Card = ({ o, showStatus = false }) => (
        <li className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <KindBadge kind={o.kind} />
                        {o.sector ? <span className="text-xs text-slate-400">{o.sector.name}</span> : null}
                    </div>
                    <h3 className="mt-2 text-base font-bold text-slate-900">{o.title}</h3>
                </div>
                {showStatus ? (
                    <span
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            STATUS_STYLES[o.status] || STATUS_STYLES.closed
                        }`}
                    >
                        {o.status === 'approved' ? <HiOutlineCheckBadge className="h-3.5 w-3.5" aria-hidden /> : null}
                        {t(`opp_status_${o.status}`, o.status)}
                    </span>
                ) : null}
            </div>

            <p className="mt-2 line-clamp-3 text-sm text-slate-600">{o.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {o.amount_sought ? (
                    <span className="font-semibold text-slate-700">
                        {Number(o.amount_sought).toLocaleString()} {o.currency}
                    </span>
                ) : null}
                {o.equity_offered ? <span>{t('opp_equity_short', '{{n}}% equity', { n: o.equity_offered })}</span> : null}
                {o.city ? (
                    <span className="inline-flex items-center gap-1">
                        <HiOutlineMapPin className="h-3.5 w-3.5" aria-hidden />
                        {o.city}
                    </span>
                ) : null}
                {o.owner ? <span className="ms-auto">{o.owner.name}</span> : null}
            </div>

            {o.review_note ? (
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    {t('opp_review_note', 'Note')}: {o.review_note}
                </p>
            ) : null}
        </li>
    );

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-sm">
                <h1 className="flex items-center gap-2 text-2xl font-bold">
                    <HiOutlineRocketLaunch className="h-7 w-7" aria-hidden />
                    {t('opp_title', 'Investment & partnership opportunities')}
                </h1>
                <p className="mt-1 text-sm text-white/85">
                    {t('opp_subtitle', 'Factories open to investment or partnership — find them, or list yours.')}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button type="button" className={tabClass('board')} onClick={() => setTab('board')}>
                    {t('opp_tab_board', 'Opportunities')}
                </button>
                <button type="button" className={tabClass('mine')} onClick={() => setTab('mine')}>
                    {t('opp_tab_mine', 'My listings')}
                </button>
                <button type="button" className={tabClass('new')} onClick={() => setTab('new')}>
                    {t('opp_tab_new', 'List my factory')}
                </button>
            </div>

            {success ? (
                <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
            ) : null}
            {err ? <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p> : null}

            {tab === 'board' ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setKindFilter('')}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                                !kindFilter ? 'bg-brand text-white ring-brand' : 'bg-white text-slate-600 ring-slate-200'
                            }`}
                        >
                            {t('all', 'All')}
                        </button>
                        {KINDS.map((k) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setKindFilter(k)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                                    kindFilter === k ? 'bg-brand text-white ring-brand' : 'bg-white text-slate-600 ring-slate-200'
                                }`}
                            >
                                {t(`opp_kind_${k}`, k)}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <p className="py-10 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</p>
                    ) : board.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
                            <p className="text-sm font-medium text-slate-500">{t('opp_none_board', 'No opportunities yet.')}</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {board.map((o) => (
                                <Card key={o.id} o={o} />
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}

            {tab === 'mine' ? (
                mine.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-16 text-center">
                        <p className="text-sm font-medium text-slate-500">{t('opp_none_mine', 'You have no listings yet.')}</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {mine.map((o) => (
                            <Card key={o.id} o={o} showStatus />
                        ))}
                    </ul>
                )
            ) : null}

            {tab === 'new' ? (
                <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-slate-200">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('opp_kind', 'I am seeking')}</label>
                        <select value={form.kind} onChange={update('kind')} className={fieldClass}>
                            {KINDS.map((k) => (
                                <option key={k} value={k}>
                                    {t(`opp_kind_${k}`, k)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('opp_field_title', 'Title')}</label>
                        <input
                            type="text"
                            required
                            minLength={5}
                            value={form.title}
                            onChange={update('title')}
                            placeholder={t('opp_title_ph', 'e.g. Textile factory seeking expansion capital')}
                            className={fieldClass}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                            {t('opp_field_description', 'Describe your factory and what you offer')}
                        </label>
                        <textarea
                            rows={4}
                            required
                            minLength={20}
                            value={form.description}
                            onChange={update('description')}
                            placeholder={t('opp_description_ph', 'Production capacity, current clients, what you need…')}
                            className={fieldClass}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                {t('opp_amount', 'Amount sought (optional)')}
                            </label>
                            <input type="number" min="0" value={form.amount_sought} onChange={update('amount_sought')} className={fieldClass} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                {t('opp_equity', 'Equity offered % (optional)')}
                            </label>
                            <input type="number" min="0" max="100" step="0.5" value={form.equity_offered} onChange={update('equity_offered')} className={fieldClass} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('city', 'City')}</label>
                            <input type="text" value={form.city} onChange={update('city')} className={fieldClass} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('email', 'Email')}</label>
                            <input type="email" value={form.contact_email} onChange={update('contact_email')} className={fieldClass} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t('phone', 'Phone')}</label>
                            <input type="text" value={form.contact_phone} onChange={update('contact_phone')} className={fieldClass} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50"
                    >
                        {submitting ? t('sending', 'Sending…') : t('opp_submit', 'Submit listing')}
                    </button>
                </form>
            ) : null}
        </div>
    );
}
