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

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sellchase_access_token');
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

export function setTokens({ access_token, refresh_token }) {
    if (access_token) {
        localStorage.setItem('sellchase_access_token', access_token);
    }
    if (refresh_token) {
        localStorage.setItem('sellchase_refresh_token', refresh_token);
    }
}

export function clearTokens() {
    localStorage.removeItem('sellchase_access_token');
    localStorage.removeItem('sellchase_refresh_token');
    localStorage.removeItem('sellchase_impersonation_backup_access_token');
    localStorage.removeItem('sellchase_impersonation_backup_refresh_token');
}

export default api;
