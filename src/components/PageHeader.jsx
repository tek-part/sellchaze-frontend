/**
 * Standard list-page header: title + subtitle on the start side, and an optional
 * action (e.g. a Create button) on the end side of the same row.
 */
export default function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
