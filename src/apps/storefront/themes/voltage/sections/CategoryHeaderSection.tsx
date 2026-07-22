/** Voltage category-header — a category hero band: eyebrow + title + description from the page header. */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { pageHeaderOf } from './section-data';
import { text } from './section-settings';

export function CategoryHeaderSection(props: SectionRenderProps): ReactElement | null {
  const header = pageHeaderOf(props.context);
  const title = header.title || text(props.settings, 'title');
  if (!title) return null;
  const description = header.description || text(props.settings, 'description');
  return (
    <div className="vlt-cat-header">
      <Container>
        <span className="vlt-eyebrow">// Collection</span>
        <h1 className="vlt-cat-header__title">{title}</h1>
        {description ? <p className="vlt-cat-header__desc">{description}</p> : null}
      </Container>
    </div>
  );
}
