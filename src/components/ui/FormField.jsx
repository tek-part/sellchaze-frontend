/** Shared input look for settings forms. */
export const INPUT_CLASS = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-slate-50 disabled:text-slate-500';
export const INPUT_ERROR_CLASS = 'border-red-300 focus:border-red-400 focus:ring-red-100';

/**
 * Label + control + hint/error. `error` accepts a string or the first entry
 * of a Laravel `errors[field]` array.
 */
export default function FormField({ label, htmlFor, hint, error, required = false, children, className = '' }) {
    const message = Array.isArray(error) ? error[0] : error;
    return (
        <div className={className}>
            {label ? (
                <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
                    {label}
                    {required ? <span className="ms-0.5 text-red-500" aria-hidden>*</span> : null}
                </label>
            ) : null}
            {children}
            {message ? (
                <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{message}</p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
            ) : null}
        </div>
    );
}
