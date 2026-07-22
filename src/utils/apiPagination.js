/**
 * Rows from Laravel paginator JSON: { data: [...], current_page, ... }
 * or a wrapped shape { data: { data: [...] } }.
 */
export function getPaginatedRows(payload) {
    if (!payload || typeof payload !== 'object') {
        return [];
    }
    const d = payload.data;
    if (Array.isArray(d)) {
        return d;
    }
    if (d && typeof d === 'object' && Array.isArray(d.data)) {
        return d.data;
    }
    return [];
}
