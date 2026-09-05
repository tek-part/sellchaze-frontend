import { Description, Field, Label, Switch } from '@headlessui/react';

/**
 * Accessible on/off switch with a label and optional description, built on
 * Headless UI's Switch. `onChange` receives the next boolean.
 */
export default function Toggle({ checked, onChange, label, description, disabled = false, className = '', size = 'md' }) {
    const track = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
    const knob = size === 'sm' ? 'h-4 w-4 group-data-checked:translate-x-4 rtl:group-data-checked:-translate-x-4' : 'h-5 w-5 group-data-checked:translate-x-5 rtl:group-data-checked:-translate-x-5';

    const control = (
        <Switch
            checked={Boolean(checked)}
            onChange={onChange}
            disabled={disabled}
            className={`group relative inline-flex ${track} shrink-0 cursor-pointer items-center rounded-full bg-slate-200 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 data-checked:bg-brand data-disabled:cursor-not-allowed data-disabled:opacity-50`}
        >
            <span
                aria-hidden
                className={`pointer-events-none inline-block ${knob} translate-x-0.5 rtl:-translate-x-0.5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-200`}
            />
        </Switch>
    );

    if (!label) {
        return <span className={className}>{control}</span>;
    }

    return (
        <Field disabled={disabled} className={`flex items-start justify-between gap-4 ${className}`}>
            <span className="min-w-0">
                <Label className="block cursor-pointer text-sm font-medium text-slate-800 data-disabled:opacity-60">{label}</Label>
                {description ? <Description className="mt-0.5 block text-xs text-slate-500">{description}</Description> : null}
            </span>
            {control}
        </Field>
    );
}
