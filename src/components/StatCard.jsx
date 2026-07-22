/**
 * Dashboard statistic card — matches the existing card system
 * (rounded-2xl, shadow-card, brand accent). Shared across analytics + orders.
 */
export default function StatCard({ label, value, sub = null, icon: Icon = null }) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                {Icon ? <Icon className="h-5 w-5 text-brand/70" aria-hidden /> : null}
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            {sub != null ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
        </div>
    );
}
