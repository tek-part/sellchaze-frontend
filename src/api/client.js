import axios from 'axios';

/**
 * API base URL. Prefer same-origin `/api/v1` in dev so the Vite proxy (see vite.config.js)
 * forwards to Laravel — avoids CORS (localhost:5173 vs 127.0.0.1:8000).
 * Set VITE_API_URL to call Laravel directly (you must allow that origin in config/cors.php).
 * Production builds use same-origin `/api/v1` unless VITE_API_URL is set at build time.
 */
function resolveBaseURL() {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (fromEnv && String(fromEnv).trim() !== '') {
        let url = String(fromEnv).trim().replace(/\/$/, '');
        // SPA on https:// + API URL baked as http:// → browsers block (mixed content). Force https in that case.
        if (typeof window !== 'undefined' && window.location?.protocol === 'https:' && /^http:\/\//i.test(url)) {
            url = url.replace(/^http:\/\//i, 'https://');
        }
        return url;
    }
    if (import.meta.env.DEV) {
        return '/api/v1';
    }
    return '/api/v1';
}

const baseURL = resolveBaseURL();

function resolveV2BaseURL() {
    const normalized = String(baseURL || '').replace(/\/$/, '');
    if (/\/api\/v1$/i.test(normalized)) {
        return normalized.replace(/\/api\/v1$/i, '/api/v2');
    }
    if (/\/v1$/i.test(normalized)) {
        return normalized.replace(/\/v1$/i, '/v2');
    }
    return `${normalized}/api/v2`;
}

const v2BaseURL = resolveV2BaseURL();

const ACCESS_TOKEN_KEY = 'sellchase_access_token';
const REFRESH_TOKEN_KEY = 'sellchase_refresh_token';

/** Default serializers (JSON, etc.) — must run after the FormData guard below. */
const defaultTransformRequest = axios.defaults.transformRequest;
const transformRequestChain = [
    function formDataPreserveMultipart(data, headers) {
        if (typeof FormData !== 'undefined' && data instanceof FormData) {
            if (headers) {
                if (typeof headers.delete === 'function') {
                    headers.delete('Content-Type');
                }
                if (typeof headers.setContentType === 'function') {
                    headers.setContentType(false);
                }
            }
            return data;
        }
        return data;
    },
    ...(Array.isArray(defaultTransformRequest)
        ? defaultTransformRequest
        : defaultTransformRequest != null
          ? [defaultTransformRequest]
          : []),
];

const api = axios.create({
    baseURL,
    headers: {
        Accept: 'application/json',
        // No global Content-Type — axios sets application/json in transformRequest for plain objects.
    },
    transformRequest: transformRequestChain,
});

let refreshPromise = null;

function readToken(key) {
    if (typeof localStorage === 'undefined') {
        return null;
    }
    return localStorage.getItem(key);
}

function writeToken(key, value) {
    if (typeof localStorage === 'undefined') {
        return;
    }
    localStorage.setItem(key, value);
}

function removeToken(key) {
    if (typeof localStorage === 'undefined') {
        return;
    }
    localStorage.removeItem(key);
}

function requestRefresh() {
    const refreshToken = readToken(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
        return Promise.reject(new Error('Missing refresh token.'));
    }

    if (!refreshPromise) {
        refreshPromise = api
            .post(
                '/auth/refresh',
                { refresh_token: refreshToken },
                { _skipRefresh: true },
            )
            .then((response) => {
                const { data } = response;
                if (!data?.access_token) {
                    throw new Error('Refresh response missing access token.');
                }
                writeToken(ACCESS_TOKEN_KEY, data.access_token);
                if (data.refresh_token) {
                    writeToken(REFRESH_TOKEN_KEY, data.refresh_token);
                }
                return data.access_token;
            })
            .catch((error) => {
                throw error;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

api.interceptors.request.use((config) => {
    const token = readToken(ACCESS_TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Match src/i18n.js: default English when sellchase_locale is unset (first visit).
    // If this header is missing, the API falls back to Arabic for localized fields.
    const saved = localStorage.getItem('sellchase_locale');
    const code = saved === 'ar' ? 'ar' : 'en';
    config.headers['Accept-Language'] = code === 'ar' ? 'ar,en;q=0.8' : 'en,ar;q=0.8';
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        const h = config.headers;
        if (h && typeof h.delete === 'function') {
            h.delete('Content-Type');
        }
        if (h && typeof h.setContentType === 'function') {
            h.setContentType(false);
        } else if (h) {
            delete h['Content-Type'];
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const original = error?.config || {};

        // A deactivated account 403s on every call; individual components
        // swallow their own errors, so the session must end centrally or the
        // member is left on a half-dead page logging silent failures.
        if (status === 403 && error.response?.data?.code === 'account_deactivated') {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('sellchase:session-expired'));
            }
            throw error;
        }

        if (!error?.response || status !== 401) {
            throw error;
        }

        if (original._retry || original._skipRefresh) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('sellchase:session-expired'));
            }
            throw error;
        }

        const url = String(original.url || '');
        if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/google')) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('sellchase:session-expired'));
            }
            throw error;
        }

        original._retry = true;
        try {
            const token = await requestRefresh();
            if (!token) {
                throw new Error('Could not refresh session.');
            }
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
        } catch (refreshError) {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('sellchase:session-expired'));
            }
            throw refreshError;
        }
    },
);

export function setTokens({ access_token, refresh_token }) {
    if (access_token) {
        writeToken(ACCESS_TOKEN_KEY, access_token);
    }
    if (refresh_token) {
        writeToken(REFRESH_TOKEN_KEY, refresh_token);
    }
}

export function clearTokens() {
    removeToken(ACCESS_TOKEN_KEY);
    removeToken(REFRESH_TOKEN_KEY);
    removeToken('sellchase_impersonation_backup_access_token');
    removeToken('sellchase_impersonation_backup_refresh_token');
}

/**
 * Run a request through the same auth/refresh interceptors against the v2
 * contract. Keeping one configured Axios instance prevents token behavior from
 * diverging while v1 and v2 coexist.
 */
export function v2Request(config) {
    const method = String(config?.method || 'get').toLowerCase();
    const mutating = ['post', 'put', 'patch'].includes(method);
    const headers = { ...(config?.headers || {}) };
    if (mutating && !headers['Idempotency-Key']) {
        headers['Idempotency-Key'] = globalThis.crypto?.randomUUID?.()
            || `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    return api.request({ ...config, headers, baseURL: v2BaseURL });
}

export default api;
