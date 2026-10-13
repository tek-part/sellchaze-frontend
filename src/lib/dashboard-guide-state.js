/** Preview the merchant's acknowledgement; detected setup and billing facts stay authoritative. */
export function previewDashboardGuide(data, changes) {
    const completed = { ...data.completed, ...(changes.completed || {}) };
    const done = Object.values(completed).filter(Boolean).length;
    return { ...data, completed, done_count:done, percent:Math.round(done / data.total * 100),
        preferences:{ ...data.preferences, ...changes } };
}
