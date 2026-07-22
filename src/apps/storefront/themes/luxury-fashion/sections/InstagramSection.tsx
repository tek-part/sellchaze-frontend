/**
 * instagram / ugc-gallery — social proof; lifestyle context. Settings: title, handle, images (one
 * URL per line), columns. Square media grid linking to the profile. Self-hides with no images. §08.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { StoreImage } from '../components/Image';
import { SectionShell } from './SectionShell';
import { lines, range, text } from './section-settings';

export function InstagramSection(props: SectionRenderProps): ReactElement | null {
  const { settings } = props;
  const handle = text(settings, 'handle');
  const title = text(settings, 'title', handle ? `@${handle.replace(/^@/, '')}` : 'Follow us');
  const columns = range(settings, 'columns', 4, 2, 6);
  const images = lines(settings, 'images');
  if (images.length === 0) return null;

  const href = handle ? `https://instagram.com/${handle.replace(/^@/, '')}` : undefined;
  const style = {
    '--sf-cols': columns,
    '--sf-cols-lg': Math.min(columns, 4),
    '--sf-cols-md': 3,
    '--sf-cols-sm': 2,
  } as CSSProperties;

  return (
    <SectionShell title={title} align="center" {...(href ? { viewAllHref: href, viewAllLabel: 'Follow' } : {})}>
      <div className="sf-grid" style={style}>
        {images.map((src, i) =>
          href ? (
            <a key={i} className="sf-ugc-tile" href={href} target="_blank" rel="noreferrer noopener" aria-label="View on Instagram">
              <StoreImage className="sf-ugc-tile__img" src={src} alt="" />
            </a>
          ) : (
            <div key={i} className="sf-ugc-tile">
              <StoreImage className="sf-ugc-tile__img" src={src} alt="" />
            </div>
          ),
        )}
      </div>
    </SectionShell>
  );
}
