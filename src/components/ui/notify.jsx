import toast, { resolveValue } from 'react-hot-toast';
import { HiCheckCircle, HiExclamationTriangle, HiInformationCircle, HiOutlineXMark, HiXCircle } from 'react-icons/hi2';

/**
 * The platform's action-state notifications.
 *
 * Every toast in the app renders through <PlatformToast>, which the single
 * <Toaster> in main.jsx installs as its render prop. That means the ~70
 * existing `toast.success(…)` / `toast.error(…)` call sites scattered across
 * the dashboard pick up this design without being touched: react-hot-toast
 * hands us the toast object and we decide how it looks.
 *
 * `notify` adds the richer shape on top — a title with an optional supporting
 * line, and `notify.promise` for actions that report running → done/failed.
 */

const VARIANTS = {
    success: { Icon: HiCheckCircle, chip: 'bg-emerald-50 text-emerald-600 ring-emerald-100', accent: 'bg-emerald-500' },
    error: { Icon: HiXCircle, chip: 'bg-red-50 text-red-600 ring-red-100', accent: 'bg-red-500' },
    warning: { Icon: HiExclamationTriangle, chip: 'bg-amber-50 text-amber-600 ring-amber-100', accent: 'bg-amber-500' },
    loading: { Icon: HiInformationCircle, chip: 'bg-brand-light text-brand ring-brand/10', accent: 'bg-brand' },
    blank: { Icon: HiInformationCircle, chip: 'bg-brand-light text-brand ring-brand/10', accent: 'bg-brand' },
};

/** A rich toast travels as `{ title, description, variant }`; a plain string is just the title. */
function readPayload(value, fallbackVariant) {
    if (value && typeof value === 'object' && !Array.isArray(value) && ('title' in value || 'description' in value)) {
        return {
            title: value.title ?? '',
            description: value.description ?? '',
            variant: value.variant ?? fallbackVariant,
        };
    }
    return { title: value, description: '', variant: fallbackVariant };
}

export function PlatformToast({ t }) {
    const { title, description, variant } = readPayload(resolveValue(t.message, t), t.type);
    const style = VARIANTS[variant] ?? VARIANTS.blank;
    const isLoading = variant === 'loading';
    const { Icon } = style;

    return (
        <div
            role={variant === 'error' ? 'alert' : 'status'}
            className={`${t.visible ? 'sc-toast-in' : 'sc-toast-out'} pointer-events-auto flex w-[min(92vw,25rem)] items-start gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-[0_18px_50px_-20px_rgba(15,23,42,.35)] ring-1 ring-slate-200/80`}
        >
            {/* An accent edge carries the state colour without shouting. */}
            <span className={`-my-3 -ms-3 w-1 self-stretch ${style.accent}`} aria-hidden />

            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${style.chip}`} aria-hidden>
                {isLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                    <Icon className="h-5 w-5" />
                )}
            </span>

            <div className="min-w-0 flex-1 py-0.5">
                <p className="break-words text-sm font-bold leading-snug text-slate-900">{title}</p>
                {description ? <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">{description}</p> : null}
            </div>

            {/* A loading toast is dismissed by its own resolution, not by hand. */}
            {isLoading ? null : (
                <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    aria-label="Dismiss"
                    className="sc-press -m-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                    <HiOutlineXMark className="h-4 w-4" aria-hidden />
                </button>
            )}
        </div>
    );
}

/**
 * `toast.custom` takes (renderer, options) only, so the rich payload is handed
 * to the renderer directly rather than through the toast's own message.
 */
function emit(variant, title, description, options = {}) {
    return toast.custom(
        (t) => <PlatformToast t={{ ...t, message: { title, description, variant } }} />,
        { duration: variant === 'error' ? 6000 : 4000, ...options },
    );
}

export const notify = {
    success: (title, description, options) => emit('success', title, description, options),
    error: (title, description, options) => emit('error', title, description, options),
    warning: (title, description, options) => emit('warning', title, description, options),
    info: (title, description, options) => emit('blank', title, description, options),
    loading: (title, description, options) => emit('loading', title, description, { duration: Infinity, ...options }),
    dismiss: (id) => toast.dismiss(id),

    /**
     * Report an action's whole lifecycle: a loading toast while it runs, then
     * the outcome in its place. Returns the original promise so callers can
     * still await the value and handle the failure themselves.
     */
    async promise(promise, { loading, success, error } = {}) {
        const id = loading ? notify.loading(loading) : undefined;
        try {
            const result = await promise;
            if (id !== undefined) toast.dismiss(id);
            if (success) notify.success(typeof success === 'function' ? success(result) : success);
            return result;
        } catch (failure) {
            if (id !== undefined) toast.dismiss(id);
            if (error) notify.error(typeof error === 'function' ? error(failure) : error);
            throw failure;
        }
    },
};

export default notify;
