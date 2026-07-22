/**
 * why-choose-us / values — reassure (shipping, returns, authenticity). FeatureCard row + SectionHead.
 * Settings: title, items (one "Headline | one-line detail" per line), columns, icon_style. §08 values.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { FeatureCard } from '../components/FeatureCard';
import { SectionShell } from './SectionShell';
import { option, pairs, range, text } from './section-settings';

export function ValuesSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const title = text(settings, 'title');
  const columns = range(settings, 'columns', 3, 2, 4);
  const layout = option(settings, 'icon_style', ['icon-top', 'icon-inline', 'numbered'] as const, 'icon-top');
  const items = pairs(settings, 'items').filter((p) => p.term);

  if (items.length === 0) return null;

  const style = {
    '--sf-cols': columns,
    '--sf-cols-lg': columns,
    '--sf-cols-md': 2,
    '--sf-cols-sm': 1,
  } as CSSProperties;

  return (
    <SectionShell title={title || undefined} align="center">
      <div className="sf-grid" style={style}>
        {items.map((item, i) => (
          <FeatureCard key={i} title={item.term} text={item.definition} layout={layout} number={i + 1} />
        ))}
      </div>
    </SectionShell>
  );
}
