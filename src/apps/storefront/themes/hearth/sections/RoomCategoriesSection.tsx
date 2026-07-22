/**
 * room-categories — warm "shop by room" grid from the real `context.data.categories`. Self-hides
 * when there are no categories (data-gap safe); shows a skeleton grid while the page is loading.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { CategoryCard } from '../components/CategoryCard';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { Skeleton } from '../components/Skeleton';
import { categoriesFor, isLoading } from './section-data';
import { option, range, text } from './section-settings';

export function RoomCategoriesSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const heading = text(settings, 'heading', 'Shop by room');
  const label = text(settings, 'label');
  const columns = range(settings, 'columns', 4, 2, 5);
  const limit = range(settings, 'limit', 8, 1, 12);
  const bg = option(settings, 'bg', ['oat', 'sand', 'cream'] as const, 'oat');
  const loading = isLoading(context);
  const categories = categoriesFor(context).slice(0, limit);

  if (!loading && categories.length === 0) return null;

  const gridStyle = { '--hh-cols': String(columns) } as CSSProperties;

  return (
    <Section bg={bg}>
      <Container>
        <SectionHead {...(label ? { label } : {})} title={heading} />
        <div className="hh-grid hh-grid--rooms" style={gridStyle}>
          {loading
            ? Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} variant="media" ratio="4 / 5" />
              ))
            : categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </Container>
    </Section>
  );
}
