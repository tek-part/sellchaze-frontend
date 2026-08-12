import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckBadge } from 'react-icons/hi2';
import api from '../../../api/client';
import { initials } from '../../../components/feed/helpers';

/**
 * The @-mention dropdown for the composer.
 *
 * The composer watches the Quill document for an "@query" run before the
 * caret and mounts this list with the query; picking a company tells the
 * composer to replace the run with a mention link. Suggestions come from the
 * public supplier directory (username + company name search).
 */
export default function MentionSuggestions({ query, onPick, onClose }) {
    const { t } = useTranslation();
    const [results, setResults] = useState([]);
    const [highlight, setHighlight] = useState(0);
    const rootRef = useRef(null);

    useEffect(() => {
        let alive = true;
        const timer = setTimeout(() => {
            api.get('/public/suppliers', { params: { q: query, per_page: 6 } })
                .then(({ data }) => {
                    if (!alive) return;
                    const rows = (data.data ?? data.suppliers ?? [])
                        .filter((row) => row.username)
                        .map((row) => ({
                            username: row.username,
                            name: row.company || row.name,
                            city: row.city,
                            verified: !!row.is_verified,
                            photo: row.photo || row.logo || null,
                        }));
                    setResults(rows);
                    setHighlight(0);
                })
                .catch(() => {
                    if (alive) setResults([]);
                });
        }, 250);
        return () => {
            alive = false;
            clearTimeout(timer);
        };
    }, [query]);

    // Keyboard driving happens at the document level so the editor keeps focus.
    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setHighlight((current) => Math.min(current + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setHighlight((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter' || event.key === 'Tab') {
                if (results[highlight]) {
                    event.preventDefault();
                    onPick?.(results[highlight]);
                }
            } else if (event.key === 'Escape') {
                onClose?.();
            }
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [results, highlight, onPick, onClose]);

    if (!results.length) return null;

    return (
        <div
            ref={rootRef}
            role="listbox"
            aria-label={t('composer_mention', 'Mention')}
            className="sc-pop w-72 overflow-hidden rounded-2xl bg-white py-1.5 shadow-[0_20px_60px_-20px_rgba(15,23,42,.4)] ring-1 ring-slate-200"
        >
            {results.map((row, index) => (
                <button
                    key={row.username}
                    type="button"
                    role="option"
                    aria-selected={index === highlight}
                    onMouseEnter={() => setHighlight(index)}
                    // mousedown, not click: the editor must not lose its selection first.
                    onMouseDown={(event) => {
                        event.preventDefault();
                        onPick?.(row);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-start transition ${index === highlight ? 'bg-brand-light/60' : ''}`}
                >
                    {row.photo ? (
                        <img src={row.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                    ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                            {initials(row.name)}
                        </span>
                    )}
                    <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 truncate text-sm font-bold text-slate-900">
                            {row.name}
                            {row.verified ? <HiOutlineCheckBadge className="h-4 w-4 shrink-0 text-brand" aria-hidden /> : null}
                        </span>
                        <span className="block truncate text-xs text-slate-500">@{row.username}{row.city ? ` · ${row.city}` : ''}</span>
                    </span>
                </button>
            ))}
        </div>
    );
}
