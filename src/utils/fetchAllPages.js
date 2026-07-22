import api from '../api/client';

/**
 * Fetch all pages for list endpoints returning { data, meta }.
 * @param {string} path — e.g. '/products'
 * @param {Record<string, unknown>} baseParams — filters without page/per_page
 * @param {{ perPage?: number, maxPages?: number, unwrap?: (row: unknown) => unknown }} opts
 */
export async function fetchAllPages(path, baseParams = {}, opts = {}) {
    const perPage = opts.perPage ?? 100;
    const maxPages = opts.maxPages ?? 100;
    const unwrap = opts.unwrap ?? ((row) => row);
    const rows = [];
    let page = 1;
    let lastPage = 1;

    do {
        const { data } = await api.get(path, {
            params: { ...baseParams, page, per_page: perPage },
        });
        const batch = Array.isArray(data.data) ? data.data : [];
        for (const row of batch) {
            rows.push(unwrap(row));
        }
        const meta = data.meta;
        if (meta && typeof meta.last_page === 'number') {
            lastPage = meta.last_page;
        } else {
            break;
        }
        page += 1;
    } while (page <= lastPage && page <= maxPages);

    return rows;
}
