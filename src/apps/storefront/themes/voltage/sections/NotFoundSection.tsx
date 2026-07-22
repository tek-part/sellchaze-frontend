/**
 * Voltage 404 — a systems-diagnostic dead end. Big mono error code, a clear way back. Voltage's own.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ButtonLink } from '../components/ButtonLink';

export function NotFoundSection(_props: SectionRenderProps): ReactElement {
  return (
    <Section>
      <Container>
        <div className="vlt-404">
          <span className="vlt-404__code vlt-num">404</span>
          <span className="vlt-eyebrow">// Signal lost</span>
          <h1 className="vlt-404__title">This page is off the grid</h1>
          <p className="vlt-404__text">The route you requested returned no match — it may have moved or powered down.</p>
          <ButtonLink href="/" variant="primary" className="vlt-404__cta">Return home</ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
