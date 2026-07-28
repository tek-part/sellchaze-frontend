/**
 * brand-logos — credibility; designer roster. Settings: title, logos (one "Name" or "Name|imageUrl"
 * per line), grayscale. Text logos render in serif; image logos as <img>. Self-hides with no logos.
 * §08 brand-logos.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { SectionShell } from './SectionShell';
import { flag, lines, text } from './section-settings';
import { brandsFrom, sectionTitlesFrom } from '../../../content/home-data';

export function BrandLogosSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const fromData = brandsFrom(context);
  const title = sectionTitlesFrom(context).brands ?? text(settings, 'title');
  const grayscale = flag(settings, 'grayscale', true);
  const items = fromData.length
    ? fromData.map((b) => ({ name: b.name, url: b.logo ?? '' }))
    : lines(settings, 'logos').map((line) => {
        const [name, url] = line.split('|').map((s) => s.trim());
        return { name: name ?? '', url: url ?? '' };
      });

  if (items.length === 0) return null;

  return (
    <SectionShell title={title || undefined} align="center" tight>
      <div className={cn('sf-logos', grayscale && 'sf-logos--grayscale')}>
        {items.map((item, i) =>
          item.url ? (
            <img key={i} className="sf-logos__item" src={item.url} alt={item.name} loading="lazy" height={28} />
          ) : (
            <span key={i} className="sf-logos__item">
              {item.name}
            </span>
          ),
        )}
      </div>
    </SectionShell>
  );
}
