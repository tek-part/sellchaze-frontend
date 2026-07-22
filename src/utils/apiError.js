/**
 * Map axios errors (incl. Vite proxy ECONNREFUSED → 500 HTML) to a user-facing string.
 */
export function loginErrorMessage(err, t) {
    const d = err.response?.data;
    const status = err.response?.status;

    if (!err.response) {
        return t('api_unreachable');
    }
    if (status === 502 || status === 504) {
        return t('api_bad_gateway');
    }

    const likelyProxyOrDown =
        status === 500 &&
        (typeof d === 'string' ||
            (d && typeof d === 'object' && typeof d.message !== 'string' && !d.errors));

    if (likelyProxyOrDown) {
        return t('api_unreachable');
    }

    return (
        (typeof d?.message === 'string' && d.message) ||
        (Array.isArray(d?.errors?.email) && d.errors.email[0]) ||
        err.response?.statusText ||
        err?.message ||
        t('login_failed')
    );
}
