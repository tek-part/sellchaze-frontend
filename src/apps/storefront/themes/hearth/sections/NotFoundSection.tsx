/**
 * not-found — the 404 recovery page. Warm apology, a search prompt and routes back into the store.
 * The app sets the real 404 status; the theme provides the look.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Section } from '../components/Section';

export function NotFoundSection(_props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Section>
      <Container narrow>
        <div className="hh-notfound">
          <p className="hh-notfound__code">404</p>
          <h1 className="hh-notfound__title">{t('notFound.hearthTitle')}</h1>
          <p className="hh-notfound__body">
            {t('notFound.hearthBody')}
          </p>
          <div className="hh-notfound__actions">
            <ButtonLink href="/">{t('notFound.backHome')}</ButtonLink>
            <ButtonLink href="/rooms" variant="outline">
              {t('hearth.browseRooms')}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
