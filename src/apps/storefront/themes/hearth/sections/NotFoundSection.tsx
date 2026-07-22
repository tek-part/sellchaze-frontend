/**
 * not-found — the 404 recovery page. Warm apology, a search prompt and routes back into the store.
 * The app sets the real 404 status; the theme provides the look.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { ButtonLink } from '../components/ButtonLink';
import { Container } from '../components/Container';
import { Section } from '../components/Section';

export function NotFoundSection(_props: SectionRenderProps): ReactElement {
  return (
    <Section>
      <Container narrow>
        <div className="hh-notfound">
          <p className="hh-notfound__code">404</p>
          <h1 className="hh-notfound__title">We can’t find that room</h1>
          <p className="hh-notfound__body">
            The page you’re after may have moved. Let’s get you back to something beautiful.
          </p>
          <div className="hh-notfound__actions">
            <ButtonLink href="/">Back home</ButtonLink>
            <ButtonLink href="/rooms" variant="outline">
              Browse rooms
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}
