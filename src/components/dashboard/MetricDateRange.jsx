import { useLayoutEffect, useRef, useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { HiOutlineCalendarDays, HiOutlineChevronRight } from '../workspace/WorkspaceIcons';
import { calendarMonthMove, localDateKey, metricPreset, rangeDays } from './metric-range';

function DateRangeEditor({ value, onApply, close, ar }) {
    const locale = ar ? 'ar-EG' : 'en-GB'; const text = (a, e) => ar ? a : e;
    const [draft, setDraft] = useState(value); const [choosingEnd, setChoosingEnd] = useState(false);
    const [month, setMonth] = useState(() => new Date(`${value.from}T12:00:00`));
    const [focusDate, setFocusDate] = useState(''); const panel = useRef(null);
    useLayoutEffect(() => { if (focusDate) panel.current?.querySelector(`[data-date="${focusDate}"]`)?.focus(); }, [focusDate, month]);
    const valid = draft.from && draft.to && rangeDays(draft.from, draft.to) >= 0 && rangeDays(draft.from, draft.to) <= 365;
    function choose(date) {
        const key = localDateKey(date);
        if (!choosingEnd) { setDraft({ from: key, to: '' }); setChoosingEnd(true); }
        else { setDraft({ from: key < draft.from ? key : draft.from, to: key < draft.from ? draft.from : key }); setChoosingEnd(false); }
    }
    function keyboard(event, date) {
        let next = new Date(date); const move = { ArrowLeft: ar ? 1 : -1, ArrowRight: ar ? -1 : 1, ArrowUp: -7, ArrowDown: 7 };
        if (event.key in move) next.setDate(next.getDate() + move[event.key]);
        else if (event.key === 'Home') next.setDate(1);
        else if (event.key === 'End') next.setMonth(next.getMonth() + 1, 0);
        else if (event.key === 'PageUp') next = calendarMonthMove(next, -1);
        else if (event.key === 'PageDown') next = calendarMonthMove(next, 1);
        else return;
        event.preventDefault();
        const mobile = window.matchMedia('(max-width: 650px)').matches;
        const start = new Date(month.getFullYear(), month.getMonth(), 1); const end = new Date(month.getFullYear(), month.getMonth() + (mobile ? 1 : 2), 0);
        if (next < start || next > end) setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
        setFocusDate(localDateKey(next));
    }
    const weekStart = ar ? 6 : 0;
    const presets = [['today', 'اليوم', 'Today'], ['seven', 'اخر 7 ايام', 'Last 7 days'], ['thirty', 'اخر 30 يوم', 'Last 30 days'], ['week', 'هذا الاسبوع', 'This week'], ['month', 'هذا الشهر', 'This month'], ['year', 'هذه السنة', 'This year'], ['previousYear', 'السنة الماضية', 'Last year']];
    return <div ref={panel} className="ws-metric-range-editor" dir={ar ? 'rtl' : 'ltr'}>
        <aside><h3>{text('اختيارات سريعة', 'Quick selections')}</h3>{presets.map(([key, a, e]) => <button type="button" key={key} onClick={() => { const next = metricPreset(key, new Date(), ar); setDraft(next); setChoosingEnd(false); setMonth(new Date(`${next.from}T12:00:00`)); }}>{text(a, e)}</button>)}</aside>
        <div className="ws-metric-range-calendars"><nav aria-label={text('شريط التنقل', 'Calendar navigation')}><button type="button" aria-label={text('اذهب إلى الشهر السابق', 'Previous month')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><HiOutlineChevronRight /></button><button type="button" aria-label={text('اذهب إلى الشهر التالي', 'Next month')} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><HiOutlineChevronRight /></button></nav>
            <div className="ws-metric-months">{[0, 1].map((offset) => {
                const first = new Date(month.getFullYear(), month.getMonth() + offset, 1); const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
                const empty = (first.getDay() - weekStart + 7) % 7; const rows = Math.ceil((days + empty) / 7);
                const monthKey = localDateKey(first).slice(0, 7);
                const tabbable = focusDate.startsWith(monthKey) ? focusDate : draft.from.startsWith(monthKey) ? draft.from : localDateKey(first);
                const title = first.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
                return <section key={offset} className={offset ? 'ws-metric-second-month' : ''}><h4 aria-live="polite">{title}</h4><div role="grid" aria-label={title}><div role="row" className="ws-metric-weekdays">{Array.from({ length: 7 }, (_, index) => <span role="columnheader" key={index}>{ar ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'][index] : new Date(2026, 9, 4 + index).toLocaleDateString(locale, { weekday: 'short' })}</span>)}</div>
                    {Array.from({ length: rows }, (_, row) => <div role="row" className="ws-metric-days" key={row}>{Array.from({ length: 7 }, (_, col) => {
                        const n = row * 7 + col - empty + 1; if (n < 1 || n > days) return <span role="gridcell" key={col} />;
                        const date = new Date(first.getFullYear(), first.getMonth(), n); const key = localDateKey(date);
                        const selected = key >= draft.from && key <= (draft.to || draft.from); const boundary = key === draft.from || key === draft.to;
                        return <div role="gridcell" aria-selected={selected} key={col} className={selected ? 'is-in-range' : ''}><button type="button" data-date={key} tabIndex={key === tabbable ? 0 : -1} aria-label={date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} aria-current={key === localDateKey(new Date()) ? 'date' : undefined} className={boundary ? 'is-boundary' : ''} onClick={() => choose(date)} onKeyDown={(event) => keyboard(event, date)}>{n}</button></div>;
                    })}</div>)}
                </div></section>;
            })}</div>
            <div className="ws-metric-range-inputs"><label>{text('من', 'From')}<input type="date" value={draft.from} onChange={(event) => { setDraft((old) => ({ ...old, from: event.target.value })); setChoosingEnd(false); }} /></label><label>{text('إلى', 'To')}<input type="date" value={draft.to} onChange={(event) => { setDraft((old) => ({ ...old, to: event.target.value })); setChoosingEnd(false); }} /></label></div>
            {!valid ? <p role="status">{text('اختر نهاية الفترة، بحد أقصى 366 يومًا.', 'Choose an end date within an inclusive range of 366 days.')}</p> : null}
            <button type="button" className="ws-primary-button" disabled={!valid} onClick={() => { onApply(draft); close(); }}>{text('تطبيق', 'Apply')}</button>
        </div>
    </div>;
}

export default function MetricDateRange({ value, onApply, ar, theme = 'light' }) {
    const locale = ar ? 'ar-EG' : 'en-GB';
    const format = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    return <Popover className="ws-metric-range">{({ close }) => <><PopoverButton className="ws-metric-range-button" aria-label={ar ? 'حدد مدى الفترة لفلترة الإحصائيات' : 'Choose a statistics date range'}><HiOutlineCalendarDays /><span>{format(value.from)} - {format(value.to)}</span></PopoverButton>
        <PopoverPanel transition anchor="bottom end" className="ws-metric-range-popover" data-workspace-theme={theme}><DateRangeEditor value={value} onApply={onApply} close={close} ar={ar} /></PopoverPanel></>}</Popover>;
}
