/**
 * Voltage 404 — a systems-diagnostic dead end. Big mono error code, a clear way back. Voltage's own.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';

export function NotFoundSection(_props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Section>
      <Container>
        <div className="vlt-404">
          <span className="vlt-404__code vlt-num">404</span>
          <span className="vlt-eyebrow">{t('notFound.voltageEyebrow')}</span>
          <h1 className="vlt-404__title">{t('notFound.voltageTitle')}</h1>
          <p className="vlt-404__text">{t('notFound.voltageBody')}</p>
          <ButtonLink href="/" variant="primary" className="vlt-404__cta">{t('notFound.returnHome')}</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
