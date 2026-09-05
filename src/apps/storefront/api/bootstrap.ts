/**
 * Shared storefront bootstrap request (`GET /api/v1/storefront`).
 *
 * The entry (`main.tsx`) needs the payload BEFORE React mounts — the merchant's active theme key
 * and published settings decide which theme package the ThemeProvider loads — and `StoreProvider`
 * needs the same payload for currency/navigation. One in-flight promise is shared between them so
 * the document never issues the request twice. A failed request is NOT memoised: the next caller
 * (StoreProvider's fetch, or a `reload()`) retries, which keeps today's DEV/preview fallback path
 * exactly as it was.
 */
import { getStore, type ApiStorefrontBootstrap } from './storefront';

let inflight: Promise<ApiStorefrontBootstrap> | null = null;

export function loadStorefrontBootstrap(): Promise<ApiStorefrontBootstrap> {
  if (!inflight) {
    inflight = getStore().catch((error: unknown) => {
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
