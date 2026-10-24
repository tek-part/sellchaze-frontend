/**
 * maison-rooms — shop by room. Up to six tiles (living, bedroom, kitchen, dining, bath, outdoor)
 * set in an asymmetric magazine grid on desktop (one tall lead tile, staggered widths beside it)
 * and a two-column stack on phones. A tile without a photo shows a tinted panel with a line
 * drawing of its room, so the grid reads as designed before any photography exists.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { defineSection, fields, tr, LibImage, LibSection, list, str, useLocaleCode, useSectionSettings } from '../../../sections-lib';
import { IconArrow } from '../chrome/icons';
import { RoomArt } from './art';

const ROOM_OPTIONS = [
  { value: 'living', label: 'Living room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'dining', label: 'Dining' },
  { value: 'bath', label: 'Bath' },
  { value: 'outdoor', label: 'Outdoor & balcony' },
];

const ROOM_NAMES: Readonly<Record<string, { ar: string; en: string }>> = {
  living: { ar: 'غرفة المعيشة', en: 'Living room' },
  bedroom: { ar: 'غرفة النوم', en: 'Bedroom' },
  kitchen: { ar: 'المطبخ', en: 'Kitchen' },
  dining: { ar: 'السفرة', en: 'Dining' },
  bath: { ar: 'الحمّام', en: 'Bath' },
  outdoor: { ar: 'البلكونة والحديقة', en: 'Outdoor & balcony' },
};

const room = (key: string, title: ReturnType<typeof tr>, caption: ReturnType<typeof tr>, url: string): Record<string, string | ReturnType<typeof tr>> => ({ room: key, title, caption, image: '', url });

export const maisonRoomsSchema = defineSection({
  type: 'maison-rooms',
  label: 'Maison · Shop by room',
  description: 'Asymmetric grid of room tiles (living, bedroom, kitchen, bath, outdoor).',
  category: 'categories',
  icon: 'HiOutlineSquares2X2',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('غرفة غرفة', 'Room by room')),
    fields.text('title', 'Heading', tr('تسوّق حسب الغرفة', 'Shop by room')),
    fields.text('subtitle', 'Subheading', tr('من غرفة المعيشة إلى البلكونة — قطع تكمّل بعضها.', 'From the living room to the balcony — pieces that belong together.')),
    fields.list('rooms', 'Rooms', [
      fields.select('room', 'Room', ROOM_OPTIONS, 'living'),
      fields.text('title', 'Title', ''),
      fields.text('caption', 'Caption', ''),
      fields.image('image', 'Photo', ''),
      fields.url('url', 'Link', '/shop'),
    ], [
      room('living', tr('غرفة المعيشة', 'Living room'), tr('مصابيح، خداديات وبطانيات', 'Lamps, cushions & throws'), '/collections/living'),
      room('bedroom', tr('غرفة النوم', 'Bedroom'), tr('مفارش كتان وإضاءة هادئة', 'Linen bedding & soft light'), '/collections/bedroom'),
      room('kitchen', tr('المطبخ', 'Kitchen'), tr('فخّار، أطباق وأدوات تقديم', 'Stoneware, plates & serving'), '/collections/tableware'),
      room('bath', tr('الحمّام', 'Bath'), tr('مناشف قطن وسلال تخزين', 'Cotton towels & baskets'), '/collections/baskets'),
      room('outdoor', tr('البلكونة والحديقة', 'Outdoor & balcony'), tr('فوانيس، أصص وجلسات خارجية', 'Lanterns, planters & seating'), '/collections/outdoor'),
    ], 6),
  ],
});

export function MaisonRooms(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(maisonRoomsSchema, props.settings);
  const ar = useLocaleCode().startsWith('ar');
  const rooms = list(s, 'rooms');
  if (rooms.length === 0) return null;
  return (
    <LibSection className="mai-rooms" eyebrow={str(s, 'eyebrow')} title={str(s, 'title')} subtitle={str(s, 'subtitle')}>
      <ul className="mai-rooms__grid" data-count={rooms.length}>
        {rooms.map((r, i) => {
          const image = str(r, 'image');
          const key = str(r, 'room', 'living');
          const name = str(r, 'title').trim() || (ROOM_NAMES[key] ?? ROOM_NAMES['living']!)[ar ? 'ar' : 'en'];
          return (
            <li key={`${key}-${i}`} className={cn('mai-room', `mai-room--${key}`, image ? 'has-image' : 'is-art')}>
              <a href={str(r, 'url', '/shop') || '/shop'} className="mai-room__link">
                <span className="mai-room__media" aria-hidden>
                  {image ? (
                    <LibImage src={image} alt="" sizes={i === 0 ? '(min-width: 1024px) 520px, 92vw' : '(min-width: 1024px) 400px, 46vw'} className="mai-room__img" />
                  ) : (
                    <RoomArt room={key} className="mai-room__art" />
                  )}
                </span>
                <span className="mai-room__text">
                  <span className="mai-room__title">{name}</span>
                  {str(r, 'caption') ? <span className="mai-room__caption">{str(r, 'caption')}</span> : null}
                </span>
                <span className="mai-room__go" aria-hidden><IconArrow /></span>
              </a>
            </li>
          );
        })}
      </ul>
    </LibSection>
  );
}
