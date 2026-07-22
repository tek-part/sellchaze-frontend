/** Voltage breadcrumbs section — renders the page-header trail inside a container. Self-hides empty. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { breadcrumbsOf } from './section-data';

export function BreadcrumbsSection(props: SectionRenderProps): ReactElement | null {
  const items = breadcrumbsOf(props.context);
  if (items.length === 0) return null;
  return (
    <div className="vlt-crumbs-band">
      <Container>
        <Breadcrumbs items={items} />
      </Container>
    </div>
  );
}
