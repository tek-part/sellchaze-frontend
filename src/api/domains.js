import api from './client';

/**
 * Custom-domain API.
 *
 * Every mutating call maps 1:1 to a backend endpoint under:
 *   • /my-store/domains (owner scope)
 *   • /stores/{id}/domains (admin scope)
 *
 * Use `makeDomainsApi(apiBase)` for any non-owner store scope.
 * Verification, DNS refresh and SSL actions return 202 (queued) — callers must
 * poll `list`/`health` rather than expecting an immediate result.
 */
export function makeDomainsApi(apiBase = '/my-store') {
    const base = `${apiBase.replace(/\/$/, '')}/domains`;

    return {
        list: () => api.get(base).then((r) => r.data?.data ?? []),

        summary: () => api.get(`${base}/health`).then((r) => r.data?.data ?? null),

        health: (id) => api.get(`${base}/${id}/health`).then((r) => r.data?.data ?? null),

        events: (params = {}) => api.get(`${base}/events`, { params }).then((r) => r.data),

        domainEvents: (id, params = {}) =>
            api.get(`${base}/${id}/events`, { params }).then((r) => r.data),

        connect: (host) => api.post(base, { host }).then((r) => r.data?.data ?? null),

        /** Rotates the challenge token — invalidates any previously published TXT record. */
        restartVerification: (id) =>
            api.post(`${base}/${id}/verification`).then((r) => r.data?.data ?? null),

        /** Queued: returns 202. */
        verify: (id) => api.post(`${base}/${id}/verify`).then((r) => r.data),

        refreshDns: (id) => api.post(`${base}/${id}/dns`).then((r) => r.data),

        retrySsl: (id) => api.post(`${base}/${id}/ssl/retry`).then((r) => r.data),

        refreshSsl: (id) => api.post(`${base}/${id}/ssl/refresh`).then((r) => r.data),

        makePrimary: (id) => api.post(`${base}/${id}/primary`).then((r) => r.data?.data ?? null),

        disable: (id) => api.post(`${base}/${id}/disable`).then((r) => r.data?.data ?? null),

        enable: (id) => api.post(`${base}/${id}/enable`).then((r) => r.data?.data ?? null),

        // POST is an explicit backend alias for hosting proxies that normalize
        // DELETE before PHP receives the request.
        remove: (id) => api.post(`${base}/${id}`).then((r) => r.data),
    };
}

const domainsApi = makeDomainsApi('/my-store');

/**
 * Normalises an axios error into a message the UI can show directly.
 *
 * Rate-limited responses (429) carry Retry-After; surfacing the wait explicitly
 * is much clearer than a generic failure, since these endpoints are throttled
 * deliberately.
 */
export function domainErrorMessage(error, t) {
    const status = error?.response?.status;

    if (status === 429) {
        const retry = Number(error?.response?.headers?.['retry-after']);
        return Number.isFinite(retry) && retry > 0
            ? t('domain_err_rate_limited_in', { seconds: retry })
            : t('domain_err_rate_limited');
    }

    const data = error?.response?.data;
    const firstFieldError = data?.errors && Object.values(data.errors)?.[0]?.[0];

    return firstFieldError || data?.message || t('domain_err_generic');
}

export default domainsApi;
