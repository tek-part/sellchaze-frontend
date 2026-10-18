import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Container } from './Container';
import { Section } from './Section';
import { Spinner } from './Spinner';

/** Keep the route's content area present while its code or published content loads. */
export function PageLoading(): ReactElement {
  const { t } = useTranslation();
  return (
    <Section className="sf-page-loading" aria-busy="true">
      <Container>
        <div className="sf-page-loading__content">
          <Spinner />
          <p aria-hidden="true">{t('common.loading')}</p>
        </div>
      </Container>
    </Section>
  );
}
