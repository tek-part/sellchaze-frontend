/** G4: calendar presets for analytics reports, computed as inclusive local dates in a given IANA timezone. */
export const RANGE_PRESETS = ['today', 'yesterday', 'day', 'seven', 'month', 'custom'];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function todayIn(timeZone, now = new Date()) {
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: timeZone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    } catch {
        return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    }
}

export function addDays(key, days) {
    const date = new Date(`${key}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

export function inclusiveDays(from, to) {
    return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000 + 1;
}

/** Returns `{ from, to }` or null when the chosen day/custom range is incomplete or longer than 366 days. */
export function analyticsRange(preset, values = {}, today) {
    if (preset === 'today') return { from: today, to: today };
    if (preset === 'yesterday') { const day = addDays(today, -1); return { from: day, to: day }; }
    if (preset === 'seven') return { from: addDays(today, -6), to: today };
    if (preset === 'month') return { from: `${today.slice(0, 8)}01`, to: today };
    if (preset === 'day') return datePattern.test(values.day || '') ? { from: values.day, to: values.day } : null;
    if (preset === 'custom') {
        const { from, to } = values;
        if (!datePattern.test(from || '') || !datePattern.test(to || '')) return null;
        const days = inclusiveDays(from, to);
        return days >= 1 && days <= 366 ? { from, to } : null;
    }
    return null;
}
