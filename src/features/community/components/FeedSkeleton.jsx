/**
 * Placeholder cards shown while the first page of posts loads. They mirror the
 * real card's geometry so the feed does not jump when the data lands — a plain
 * "Loading…" line used to collapse the layout and then push everything down.
 */
export default function FeedSkeleton({ count = 3 }) {
    return (
        <div className="space-y-5" aria-hidden>
            {Array.from({ length: count }, (_, i) => (
                <article key={i} className="rounded-2xl bg-white p-5 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                    <div className="flex items-center gap-3">
                        <div className="sc-skeleton h-11 w-11 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="sc-skeleton h-3.5 w-40 max-w-[60%] rounded-full" />
                            <div className="sc-skeleton h-3 w-28 max-w-[40%] rounded-full" />
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="sc-skeleton h-3 w-full rounded-full" />
                        <div className="sc-skeleton h-3 w-11/12 rounded-full" />
                        <div className="sc-skeleton h-3 w-2/3 rounded-full" />
                    </div>
                    <div className="sc-skeleton mt-4 h-44 w-full rounded-xl" />
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                        {Array.from({ length: 4 }, (__, j) => (
                            <div key={j} className="sc-skeleton h-8 flex-1 rounded-lg" />
                        ))}
                    </div>
                </article>
            ))}
        </div>
    );
}
