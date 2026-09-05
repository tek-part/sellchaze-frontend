/**
 * White settings card: a title/description header, optional header actions,
 * the body, and an optional footer strip. Matches the dashboard's card look
 * (rounded-2xl, hairline border, soft shadow).
 */
export default function SettingsCard({ title, description, actions, footer, children, className = '', bodyClassName = '' }) {
    return (
        <section className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card ${className}`}>
            {title || actions ? (
                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="min-w-0">
                        {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
                        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
                    </div>
                    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
                </header>
            ) : null}
            <div className={`px-5 py-5 ${bodyClassName}`}>{children}</div>
            {footer ? <footer className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">{footer}</footer> : null}
        </section>
    );
}
