/** Rouge category-list — CategoryCard grid + centered SectionHead. Settings: title, eyebrow, columns. */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';
import { CategoryCard } from '../components/CategoryCard';
import { Reveal } from '../components/Reveal';
import { categoriesFor } from './section-data';
import { range, text } from './section-settings';

export function CategoryListSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const eyebrow = text(settings, 'eyebrow');
  const columns = range(settings, 'columns', 4, 2, 6);
  const categories = categoriesFor(context);
  if (categories.length === 0) return null;
  const style = { '--rge-cols': columns, '--rge-cols-lg': Math.min(columns, 3), '--rge-cols-md': 2, '--rge-cols-sm': 2 } as CSSProperties;
  return (
    <Section>
      <Container>
        {title || eyebrow ? (
          <SectionHead align="center" {...(eyebrow ? { eyebrow } : {})} title={title || eyebrow} className="rge-section__head-wrap" />
        ) : null}
        <Reveal>
          <div className="rge-grid" style={style}>
            {categories.map((c, i) => <CategoryCard key={c.id} category={c} eager={i < 2} />)}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
