export function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function rangeDays(from, to) {
    return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
}
export function calendarMonthMove(date, direction) {
    const next = new Date(date); const day = next.getDate();
    next.setDate(1); next.setMonth(next.getMonth() + direction);
    next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    return next;
}
export function metricPreset(key, now = new Date(), saturday = true) {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const to = new Date(from);
    if (key === 'seven') from.setDate(from.getDate() - 7);
    if (key === 'thirty') from.setDate(from.getDate() - 30);
    if (key === 'week') from.setDate(from.getDate() - ((from.getDay() + (saturday ? 1 : 0)) % 7));
    if (key === 'month') from.setDate(1);
    if (key === 'year') from.setMonth(0, 1);
    if (key === 'previousYear') { from.setFullYear(from.getFullYear() - 1, 0, 1); to.setFullYear(to.getFullYear() - 1, 11, 31); }
    return { from: localDateKey(from), to: localDateKey(to) };
}
