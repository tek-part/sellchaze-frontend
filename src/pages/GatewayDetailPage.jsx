import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowLeft, HiOutlineWallet } from 'react-icons/hi2';
import api from '../api/client';
import PaginationBar from '../components/table/PaginationBar';
import TableLoadingOverlay from '../components/table/TableLoadingOverlay';

function unwrap(payload) {
    return payload?.data ?? payload;
}

function formatCount(value, locale) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        return '—';
    }
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n);
}

/** Wallet / USD totals from API — grouped digits + USD suffix. */
function formatUsdAmount(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        return '—';
    }
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
    return `${formatted} USD`;
}

/** Same digits as USD amounts, without suffix (column header already marks USD). */
function formatUsdNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

function formatMoneyAmount(amount, currency) {
    const n = Number(amount);
    if (!Number.isFinite(n)) {
        return '—';
    }
    const raw = currency != null ? String(currency).trim().toUpperCase() : '';
    const code = raw && raw !== 'N/A' && /^[A-Z]{3}$/.test(raw) ? raw : null;
    if (code) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: code,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(n);
        } catch {
            /* invalid code */
        }
    }
    const num = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
    return raw && raw !== '' ? `${num} ${raw}` : num;
}

export default function GatewayDetailPage() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const numberLocale = String(i18n.language || '').startsWith('ar') ? 'ar' : undefined;
    const dateLocale = numberLocale === 'ar' ? 'ar' : undefined;
    const { isAdmin, permissions } = useOutletContext();
    const can = (p) => isAdmin || permissions.includes(p);
    const [row, setRow] = useState(null);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const load = useCallback(() => {
        if (!id) {
            return;
        }
        setLoading(true);
        setErr('');
        api.get(`/gateways/${id}`, { params: { page, per_page: 20 } })
            .then(({ data }) => {
                setRow(unwrap(data));
                setMeta(data.meta ?? null);
            })
            .catch((e) => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [id, page]);

    useEffect(() => {
        load();
    }, [load]);

    if (!can('gateways-list')) {
        return <Navigate to="/dashboard" replace />;
    }

    const txRows = Array.isArray(row?.transactions) ? row.transactions : [];
    const currencyTotals = Array.isArray(row?.currency_totals) ? row.currency_totals : [];

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-slate-50/60 to-brand/6 px-5 py-6 shadow-[0_8px_40px_rgba(15,23,42,0.07)] sm:px-8">
                <div
                    className="pointer-events-none absolute -inset-e-16 -top-16 h-48 w-48 rounded-full bg-brand/[0.07] blur-3xl"
                    aria-hidden
                />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25">
                            <HiOutlineWallet className="h-6 w-6" aria-hidden />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {t('gateway_detail_title', { name: row?.name ?? id ?? '' })}
                            </h1>
                            {row?.slug ? (
                                <p className="mt-1 font-mono text-sm text-slate-500">{row.slug}</p>
                            ) : null}
                            <p className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                                <Link
                                    to="/gateways"
                                    className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
                                >
                                    <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                                    {t('payment_methods')}
                                </Link>
                                {can('gateways-edit') && id ? (
                                    <Link to={`/gateways/${id}/edit`} className="font-semibold text-brand hover:underline">
                                        {t('action_edit')}
                                    </Link>
                                ) : null}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {err && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span>{t('col_wallet_balance')}</span>
                        <span className="ms-1 font-normal normal-case text-slate-400">USD</span>
                    </p>
                    <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
                        {loading && !row ? '…' : formatUsdAmount(row?.wallet_balance)}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('col_paid_orders')}</p>
                    <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
                        {loading && !row ? '…' : formatCount(row?.paid_orders_count ?? 0, numberLocale)}
                    </p>
                </div>
            </div>

            {Array.isArray(row?.missing_rate_currencies) && row.missing_rate_currencies.length > 0 ? (
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
                    <span className="font-semibold">{t('gateway_missing_rates')}:</span>{' '}
                    {row.missing_rate_currencies.join(', ')}
                </p>
            ) : null}

            {currencyTotals.length > 0 ? (
                <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)]">
                    <p className="mb-4 text-sm font-semibold text-slate-800">{t('gateway_currency_totals')}</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {currencyTotals.map((rowTotal) => (
                            <div
                                key={rowTotal.currency}
                                className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 ring-1 ring-slate-100/80"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {rowTotal.currency}
                                </p>
                                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                                    {formatMoneyAmount(rowTotal.total_amount, rowTotal.currency)}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                    {t('col_paid_orders')}:{' '}
                                    <span className="font-semibold tabular-nums text-slate-700">
                                        {formatCount(rowTotal.orders_count ?? 0, numberLocale)}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-3.5 text-sm font-semibold text-slate-800">
                    {t('gateway_transactions')}
                </div>
                <div className="relative min-h-40 overflow-auto bg-white">
                    <TableLoadingOverlay show={loading} />
                    <table className="min-w-full text-start text-sm">
                        <thead className="bg-surface-muted/90 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-4 py-3.5">{t('col_created')}</th>
                                <th className="px-4 py-3.5">{t('col_type')}</th>
                                <th className="px-4 py-3.5">{t('col_reference')}</th>
                                <th className="px-4 py-3.5">{t('col_currency')}</th>
                                <th className="px-4 py-3.5">{t('col_amount')}</th>
                                <th className="px-4 py-3.5">
                                    <span className="inline-flex flex-wrap items-center gap-1">
                                        <span>{t('col_amount_usd')}</span>
                                        <span className="font-normal normal-case text-slate-500">USD</span>
                                    </span>
                                </th>
                                <th className="px-4 py-3.5">{t('col_notes')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && txRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">
                                        {t('empty')}
                                    </td>
                                </tr>
                            ) : null}
                            {txRows.map((tx) => (
                                <tr
                                    key={tx.id}
                                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60"
                                >
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                        {tx.created_at
                                            ? new Date(tx.created_at).toLocaleString(dateLocale)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{tx.type ?? '—'}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-800">
                                        {tx.reference_code ?? tx.reference_id ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{tx.currency ?? '—'}</td>
                                    <td className="px-4 py-3 tabular-nums text-slate-800">
                                        {formatMoneyAmount(tx.amount, tx.currency)}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-slate-800">
                                        {tx.amount_usd != null && Number.isFinite(Number(tx.amount_usd))
                                            ? formatUsdNumber(tx.amount_usd)
                                            : '—'}
                                    </td>
                                    <td className="max-w-56 px-4 py-3 text-slate-600">
                                        <span className="line-clamp-2" title={tx.notes ?? undefined}>
                                            {tx.notes ?? '—'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <PaginationBar meta={meta} loading={loading} onPageChange={setPage} />
            </div>
        </div>
    );
}
