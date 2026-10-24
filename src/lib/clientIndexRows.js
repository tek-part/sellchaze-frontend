/**
 * Search, filter, sort and paginate an in-memory list with an index-table state (see
 * features/data-table/state.ts). For endpoints that return the whole list at once, so the
 * shared IndexTable gets the same `rows` + `meta` it receives from paginated endpoints.
 *
 * @param {Array} rows
 * @param {{ search: string, sort: { by: string, direction: 'asc'|'desc' } | null, page: number, perPage: number, filters: Record<string, unknown> }} state
 * @param {{ search?: Array<(row) => unknown>, filters?: Record<string, (row, value) => boolean>, sorts?: Record<string, (row) => unknown> }} [config]
 */
export function clientIndexRows(rows, state, { search = [], filters = {}, sorts = {} } = {}) {
    const term = state.search.trim().toLowerCase();
    let list = term ? rows.filter((row) => search.some((field) => String(field(row) ?? '').toLowerCase().includes(term))) : rows;
    for (const [key, value] of Object.entries(state.filters)) {
        if (filters[key]) list = list.filter((row) => filters[key](row, value));
    }
    const sortValue = state.sort ? sorts[state.sort.by] : null;
    if (sortValue) {
        const direction = state.sort.direction === 'desc' ? -1 : 1;
        list = [...list].sort((a, b) => compare(sortValue(a), sortValue(b), direction));
    }

    const total = list.length;
    const lastPage = Math.max(1, Math.ceil(total / state.perPage));
    const page = Math.min(state.page, lastPage);
    return {
        all: list,
        rows: list.slice((page - 1) * state.perPage, page * state.perPage),
        meta: { total, last_page: lastPage, current_page: page, per_page: state.perPage },
    };
}

/** Empty values always sort last, whatever the direction. */
function compare(a, b, direction) {
    const empty = (value) => value === null || value === undefined || value === '';
    if (empty(a) || empty(b)) return empty(a) === empty(b) ? 0 : empty(a) ? 1 : -1;
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * direction;
}
