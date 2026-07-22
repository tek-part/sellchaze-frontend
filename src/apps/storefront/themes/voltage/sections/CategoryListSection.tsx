/** Voltage category-list — CategoryCard grid + SectionHead. Settings: title, columns. Self-hides empty. */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { CategoryCard } from '../components/CategoryCard';
import { categoriesFor } from './section-data';
import { range, text } from './section-settings';

export function CategoryListSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const columns = range(settings, 'columns', 4, 2, 6);
  const categories = categoriesFor(context);
  if (categories.length === 0) return null;
  const style = { '--vlt-cols': columns, '--vlt-cols-lg': Math.min(columns, 3), '--vlt-cols-md': 2, '--vlt-cols-sm': 2 } as CSSProperties;
  return (
    <Section>
      <Container>
        {title ? <SectionHead title={title} className="vlt-section__head-wrap" /> : null}
        <div className="vlt-grid" style={style}>
          {categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      </Container>
    </Section>
  );
}
