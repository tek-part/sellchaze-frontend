/**
 * Storefront API client — a thin fetch wrapper over the existing Laravel `/api/storefront/*`
 * endpoints (host-resolved to the tenant store). Sends credentials for the customer session, parses
 * JSON, and normalises errors to ApiError. No endpoints are invented here — see ./storefront.ts.
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const response = await fetch(`${API_BASE}/storefront${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = response.statusText || `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;

  // Guard the success-path parse. A misrouted request can return HTTP 200 with
  // an HTML body — e.g. an SPA host that serves index.html for an unknown /api
  // path. Without this, response.json() throws a raw SyntaxError
  // ("Unexpected token '<'") that escapes as an unhandled promise rejection.
  // Converting it to an ApiError lets callers (useAsync) handle it and fall
  // back — in a theme preview, to demo data.
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, 'The API returned an unexpected non-JSON response.');
  }
}

export const apiGet = <T>(path: string): Promise<T> => apiFetch<T>(path);

export const apiSend = <T>(path: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<T> =>
  apiFetch<T>(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });

/** Call an API path OUTSIDE the /storefront prefix (e.g. shared /auth/* password-reset routes). */
export async function apiRootFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    let message = response.statusText || `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      /* non-JSON */
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) return undefined as T;

  // Guard the success-path parse. A misrouted request can return HTTP 200 with
  // an HTML body — e.g. an SPA host that serves index.html for an unknown /api
  // path. Without this, response.json() throws a raw SyntaxError
  // ("Unexpected token '<'") that escapes as an unhandled promise rejection.
  // Converting it to an ApiError lets callers (useAsync) handle it and fall
  // back — in a theme preview, to demo data.
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(response.status, 'The API returned an unexpected non-JSON response.');
  }
}
