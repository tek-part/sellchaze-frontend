import type { ReactElement } from 'react';
import { ButtonLink, Container, Section } from '../foundation/components';
import { LibGrid, LibProductCard, LibSection } from '../sections-lib/primitives';
import { toProductCard } from '../api/mappers';
import { useStore } from '../state/store-context';
import { useLocale } from '../i18n/useLocale';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml';
import type { ThankYouPageData } from './thank-you';
import './thank-you.css';

export function ThankYouContent({ page, number }: { page: ThankYouPageData; number: string | null }): ReactElement {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  return <Section><Container narrow className="sf-thank-you">
    <h1>{ar ? 'شكرًا لطلبك' : 'Thank you for your order'}</h1>
    {number ? <p>{ar ? 'رقم الطلب' : 'Order number'}: <bdi>{number}</bdi></p> : null}
    <div className="sf-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content_html, { formatting: true }) }} />
    {page.show_home_button ? <ButtonLink href="/">{ar ? 'العودة للرئيسية' : 'Back to home'}</ButtonLink> : null}
  </Container></Section>;
}

/** Cards use the shared variant/personalization/stock gates and this theme's tokens. No demo products. */
export function ThankYouProducts({ page }: { page: ThankYouPageData }): ReactElement | null {
  const { store } = useStore();
  const { locale } = useLocale();
  if (!page.category || !page.products.length) return null;
  return <LibSection title={locale === 'ar' ? 'قد يعجبك أيضًا' : 'You may also like'} subtitle={page.category.name}>
    <LibGrid style={{ '--lib-cols-sm': 2, '--lib-cols-lg': 4 } as React.CSSProperties}>
      {page.products.map((product) => <LibProductCard key={product.id} product={toProductCard(product, store.currency, store.currencyMultipliers[store.currency] ?? 1)} />)}
    </LibGrid>
  </LibSection>;
}
