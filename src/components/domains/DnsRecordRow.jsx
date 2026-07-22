import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * One copyable DNS record instruction.
 *
 * DNS values are long, opaque and unforgiving of typos, so every field is
 * copy-to-clipboard and rendered LTR/monospace even in an RTL layout — a
 * hostname or token must never be visually reordered by bidi.
 */
export default function DnsRecordRow({ type, name, value, ok }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(null);

    const copy = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            setCopied(null);
        }
    };

    const cell = 'flex items-stretch gap-2';
    const box =
        'min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-700';
    const btn =
        'shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500';

    return (
        <div className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{type}</span>
                {ok === true && (
                    <span className="text-xs font-medium text-emerald-600">{t('domain_record_found')}</span>
                )}
                {ok === false && (
                    <span className="text-xs font-medium text-rose-600">{t('domain_record_missing')}</span>
                )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-500">{t('domain_record_name')}</div>
                    <div className={cell}>
                        <code dir="ltr" className={box} title={name}>
                            {name}
                        </code>
                        <button type="button" className={btn} onClick={() => copy(name, 'name')}>
                            {copied === 'name' ? t('action_copied') : t('action_copy')}
                        </button>
                    </div>
                </div>

                <div>
                    <div className="mb-1 text-[11px] font-medium text-slate-500">{t('domain_record_value')}</div>
                    <div className={cell}>
                        <code dir="ltr" className={box} title={value}>
                            {value}
                        </code>
                        <button type="button" className={btn} onClick={() => copy(value, 'value')}>
                            {copied === 'value' ? t('action_copied') : t('action_copy')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
