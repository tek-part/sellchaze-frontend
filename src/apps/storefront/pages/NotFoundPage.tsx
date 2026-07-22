/**
 * NotFoundPage — 404. Editorial dead-end with a way home (§32.5 ErrorState). Template-driven when the
 * active theme registers a `not-found` template; otherwise the luxury-fashion fallback.
 */
import type { ReactElement } from 'react';
import { ButtonLink, Container, ErrorState, Section } from '../themes/luxury-fashion/components';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { useStore } from '../state/store-context';
import { flowContext } from './flow-context';

export function NotFoundPage(): ReactElement {
  const { store } = useStore();
  const tpl = useTemplate('not-found');
  if (tpl) return <ThemeRenderer page={tpl} context={flowContext(store)} />;

  return (
    <Section>
      <Container>
        <ErrorState
          code="404"
          title="This page has slipped away"
          description="The page you're looking for can't be found — it may have moved."
          actions={<ButtonLink href="/">Return home</ButtonLink>}
        />
      </Container>
    </Section>
  );
}
