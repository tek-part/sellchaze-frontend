/**
 * Shared storefront bootstrap request (`GET /api/v1/storefront`).
 *
 * The entry (`main.tsx`) needs the payload BEFORE React mounts — the merchant's active theme key
 * and published settings decide which theme package the ThemeProvider loads — and `StoreProvider`
 * needs the same payload for currency/navigation. One in-flight promise is shared between them so
 * the document never issues the request twice. A failed request is NOT memoised: the next caller
 * (StoreProvider's fetch, or a `reload()`) retries, which keeps today's DEV/preview fallback path
 * exactly as it was.
 *
 * In production the inline boot script (vite/storefront-boot.js) starts this request while the
 * entry JS is still downloading. It is adopted only when its URL is exactly the one this module
 * would request; a network failure falls back to a normal request.
 */
import { ApiError, storefrontRequestUrl } from './client';
import { getStore, type ApiStorefrontBootstrap } from './storefront';

interface EarlyBootstrap {
  url: string;
  promise: Promise<{ status: number; body: unknown }>;
}

declare global {
  interface Window {
    __sfBoot?: EarlyBootstrap;
  }
}

let inflight: Promise<ApiStorefrontBootstrap> | null = null;

function adoptEarlyRequest(): Promise<ApiStorefrontBootstrap> | null {
  if (typeof window === 'undefined' || !window.__sfBoot) return null;
  const early = window.__sfBoot;
  delete window.__sfBoot;
  if (early.url !== storefrontRequestUrl('/')) return null;
  return early.promise.then(
    ({ status, body }) => {
      if (status >= 200 && status < 300 && body && typeof body === 'object') return body as ApiStorefrontBootstrap;
      const message = (body as { message?: unknown } | null)?.message;
      throw new ApiError(status, typeof message === 'string' && message ? message : `Request failed (${status})`, body ?? undefined);
    },
    () => getStore(),
  );
}

export function loadStorefrontBootstrap(): Promise<ApiStorefrontBootstrap> {
  if (!inflight) {
    inflight = (adoptEarlyRequest() ?? getStore()).catch((error: unknown) => {
      inflight = null;
      throw error;
    });
  }
  return inflight;
}

/** Test seam — forget the cached request. */
export function resetStorefrontBootstrapCache(): void {
  inflight = null;
}
