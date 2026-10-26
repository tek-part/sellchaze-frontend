export default function StepProgress({ flowPhase, steps, t, isRtl }) {
    return (
        <div
            className={`flex flex-wrap items-center justify-center gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6 ${isRtl ? 'flex-row-reverse' : ''}`}
            role="navigation"
            aria-label={t('wavex_connect_step_of', { current: flowPhase, total: steps.length })}
        >
            {steps.map((step, idx) => {
                const Icon = step.icon;
                const done = flowPhase > step.n;
                const active = flowPhase === step.n;
                return (
                    <div key={step.n} className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {idx > 0 ? (
                            <span
                                className={`hidden h-px w-6 sm:block ${done || active ? 'bg-brand/40' : 'bg-slate-200'}`}
                                aria-hidden
                            />
                        ) : null}
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                done
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : active
                                      ? 'bg-brand text-white shadow-xs'
                                      : 'bg-white text-slate-400 ring-1 ring-slate-200'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                            <span className="tabular-nums">{step.n}</span>
                            <span className="hidden sm:inline">{t(step.titleKey)}</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
