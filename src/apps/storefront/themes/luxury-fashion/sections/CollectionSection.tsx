/**
 * collection / lookbook — editorial grouping; aspirational styling. CollectionCard grid + SectionHead.
 * Settings: title, columns, layout. Self-hides when there are no collections. §08 collection/lookbook.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { CollectionCard } from '../components/CollectionCard';
import { SectionShell } from './SectionShell';
import { featuredCollectionsFor } from './section-data';
import { range, text } from './section-settings';

export function CollectionSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const columns = range(settings, 'columns', 3, 2, 4);
  const collections = featuredCollectionsFor(context);
  if (collections.length === 0) return null;

  const style = {
    '--sf-cols': columns,
    '--sf-cols-lg': Math.min(columns, 3),
    '--sf-cols-md': 2,
    '--sf-cols-sm': 1,
  } as CSSProperties;

  return (
    <SectionShell title={title || undefined}>
      <div className="sf-grid" style={style}>
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </SectionShell>
  );
}
