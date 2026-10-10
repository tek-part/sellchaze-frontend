import type { ApiProduct } from '../api/types';
import type { AsyncState } from '../api/useAsync';

export interface ThankYouPageData {
  enabled: boolean;
  content_html: string;
  show_home_button: boolean;
  category: { slug: string; name: string } | null;
  products: ReadonlyArray<ApiProduct>;
}

export interface ThankYouResponse { locale: string; data: ThankYouPageData }

/** useAsync retains the old response during refetch; never present another locale's saved content. */
export function currentThankYou(query: Pick<AsyncState<ThankYouResponse>, 'data' | 'loading' | 'error'>, locale: string): ThankYouPageData | null {
  return !query.loading && !query.error && query.data?.locale === locale && query.data.data.enabled ? query.data.data : null;
}
