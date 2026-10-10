import type { ApiBuilderPage } from '../api/storefront';
import type { AsyncState } from '../api/useAsync';

export interface PublishedPageResponse { locale: string; data: { data: ApiBuilderPage } }

/** A retained response belongs to one URL/language; failed refreshes never publish it as current. */
export function currentPublishedPage(query: Pick<AsyncState<PublishedPageResponse>, 'data' | 'loading' | 'error'>, slug: string, locale: string): ApiBuilderPage | null {
  return !query.loading && !query.error && query.data?.locale === locale && query.data.data.data.slug === slug ? query.data.data.data : null;
}
