/**
 * NotFoundPage — 404. Editorial dead-end with a way home (§32.5 ErrorState). Template-driven when the
 * active theme registers a `not-found` template; otherwise the luxury-fashion fallback.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonLink, Container, ErrorState, Section } from '../themes/luxury-fashion/components';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { useStore } from '../state/store-context';
import { flowContext } from './flow-context';

export function NotFoundPage(): ReactElement {
  const { t } = useTranslation();
  const { store } = useStore();
  const tpl = useTemplate('not-found');
  if (tpl) return <ThemeRenderer page={tpl} context={flowContext(store)} />;

  return (
    <Section>
      <Container>
        <ErrorState
          code="404"
          title={t('notFound.title')}
          description={t('notFound.body')}
          actions={<ButtonLink href="/">{t('notFound.returnHome')}</ButtonLink>}
        />
      </Container>
    </Section>
  );
}
