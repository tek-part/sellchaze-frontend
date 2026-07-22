/**
 * category-header — the top of a room/category page: breadcrumb trail, serif title and a short
 * intro, over a warm band. Reads the page header from `context.data.pageHeader`; the breadcrumb
 * falls back to Home ▸ Category when the full trail is a data gap (never fabricated).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Heading, Text } from '../components/Typography';
import { pageHeaderOf } from './section-data';
import { text } from './section-settings';

export function CategoryHeaderSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const header = pageHeaderOf(context);
  const title = header.title || text(settings, 'heading');
  const description = header.description || text(settings, 'subheading');
  const crumbs = header.breadcrumbs ?? [];

  if (!title) return null;

  return (
    <header className="hh-section hh-section--sand hh-section--tight hh-cat-header">
      <Container>
        {crumbs.length > 0 ? (
          <nav className="hh-breadcrumb" aria-label="Breadcrumb">
            <ol className="hh-breadcrumb__list">
              {crumbs.map((c, i) => (
                <li key={c.url} className="hh-breadcrumb__item">
                  {i < crumbs.length - 1 ? (
                    <a href={c.url}>{c.label}</a>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <Heading as="h1" size="3xl" className="hh-cat-header__title">
          {title}
        </Heading>
        {description ? (
          <Text muted size="md" className="hh-cat-header__intro">
            {description}
          </Text>
        ) : null}
      </Container>
    </header>
  );
}
