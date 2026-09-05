/**
 * instagram — a "follow us" photo grid. Images come from the merchant's list (no third-party
 * embed script); each tile links to the post or the profile.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { gridStyle, list, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { LibGrid, LibImage, LibSection } from '../primitives';
import { useLibT } from '../i18n';

const u = (id: string): string => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=600&q=80`;

export const instagramSchema = defineSection({
  type: 'instagram',
  label: 'Instagram',
  description: 'A photo grid linking to your Instagram.',
  category: 'social',
  icon: 'HiOutlineCamera',
  settings: [
    fields.text('title', 'Title', tr('تابعنا على إنستغرام', 'Follow us on Instagram')),
    fields.text('handle', 'Handle', '@yourstore'),
    fields.url('profile_url', 'Profile link', 'https://instagram.com'),
    fields.list(
      'items',
      'Photos',
      [fields.image('image', 'Image', ''), fields.url('url', 'Post link', '')],
      [
        { image: u('photo-1523275335684-37898b6baf30'), url: '' },
        { image: u('photo-1526170375885-4d8ecf77b99f'), url: '' },
        { image: u('photo-1542291026-7eec264c27ff'), url: '' },
        { image: u('photo-1503602642458-232111445657'), url: '' },
        { image: u('photo-1491553895911-0055eca6402d'), url: '' },
        { image: u('photo-1523381210434-271e8be1f52b'), url: '' },
      ],
      12,
    ),
    fields.select('columns', 'Columns', OPTIONS.columns(3, 6), '6'),
    fields.range('limit', 'Max photos', 6, 3, 12),
    ...spacingFields(48),
  ],
});

export function Instagram(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(instagramSchema, props.settings);
  const t = useLibT();
  const items = list(s, 'items').filter((i) => str(i, 'image')).slice(0, num(s, 'limit', 6));
  if (items.length === 0) return null;
  const profile = str(s, 'profile_url', 'https://instagram.com');
  const handle = str(s, 'handle');
  return (
    <LibSection title={str(s, 'title')} subtitle={handle} align="center" viewAllHref={profile} viewAllLabel={t('followUs')} style={spacingStyle(s)}>
      <LibGrid style={gridStyle(num(s, 'columns', 6), 3)} className="lib-ig lib-ratio lib-ratio--square">
        {items.map((item, i) => (
          <a key={i} href={str(item, 'url') || profile} className="lib-ig__tile" target="_blank" rel="noopener noreferrer" aria-label={handle || 'Instagram'}>
            <LibImage src={str(item, 'image')} alt="" className="lib-ig__img" />
          </a>
        ))}
      </LibGrid>
    </LibSection>
  );
}
