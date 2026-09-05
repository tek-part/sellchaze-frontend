/**
 * announcement-strip — a slim message band (free shipping, promo codes). Multiple messages rotate
 * (static under reduced motion) or scroll as a marquee. Not dismissible: it is page content placed
 * by the merchant; the chrome-level AnnouncementBar is the dismissible one.
 */
import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../shared/env/media';
import { defineSection, fields, tr } from '../schema';
import { list, num, str, useSectionSettings } from '../use-section';

export const announcementStripSchema = defineSection({
  type: 'announcement-strip',
  label: 'Announcement strip',
  description: 'A slim band of short messages — shipping, promo codes, news.',
  category: 'marketing',
  icon: 'HiOutlineMegaphone',
  settings: [
    fields.list(
      'items',
      'Messages',
      [fields.text('text', 'Text', ''), fields.url('url', 'Link', '')],
      [
        { text: tr('شحن مجاني للطلبات فوق ٢٠٠ ر.س', 'Free shipping on orders over 200'), url: '' },
        { text: tr('إرجاع مجاني خلال ١٤ يوماً', 'Free returns within 14 days'), url: '' },
      ],
      6,
    ),
    fields.select('mode', 'Display', [{ value: 'rotate', label: 'Rotate one at a time' }, { value: 'marquee', label: 'Scrolling marquee' }, { value: 'static', label: 'Show all inline' }], 'rotate'),
    fields.range('interval', 'Rotate every (s)', 5, 3, 15),
    fields.color('background', 'Background', ''),
    fields.color('color', 'Text colour', ''),
  ],
});

export function AnnouncementStrip(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(announcementStripSchema, props.settings);
  const items = list(s, 'items').filter((i) => str(i, 'text'));
  const mode = str(s, 'mode', 'rotate');
  const [index, setIndex] = useState(0);
  const interval = num(s, 'interval', 5) * 1000;

  useEffect(() => {
    if (mode !== 'rotate' || items.length <= 1 || prefersReducedMotion()) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), Math.max(3000, interval));
    return () => clearInterval(timer);
  }, [mode, items.length, interval]);

  if (items.length === 0) return null;
  const style: CSSProperties = {
    ...(str(s, 'background') ? { background: str(s, 'background') } : {}),
    ...(str(s, 'color') ? { color: str(s, 'color') } : {}),
  };
  const render = (item: (typeof items)[number], key: number): ReactElement => {
    const text = str(item, 'text');
    const url = str(item, 'url');
    return url ? <a key={key} href={url} className="lib-strip__item">{text}</a> : <span key={key} className="lib-strip__item">{text}</span>;
  };

  if (mode === 'marquee' && !prefersReducedMotion()) {
    const row = [...items, ...items];
    return (
      <section className="lib-strip lib-strip--marquee" style={style} role="region" aria-label="Announcements">
        <div className="lib-strip__track" aria-hidden>
          {row.map((item, i) => render(item, i))}
        </div>
        <span className="lib-sr-only">{items.map((i) => str(i, 'text')).join(' · ')}</span>
      </section>
    );
  }
  if (mode === 'static') {
    return (
      <section className="lib-strip lib-strip--static" style={style} role="region" aria-label="Announcements">
        <div className="lib-container lib-strip__inline">{items.map((item, i) => render(item, i))}</div>
      </section>
    );
  }
  const current = items[index] ?? items[0]!;
  return (
    <section className={cn('lib-strip', 'lib-strip--rotate')} style={style} role="region" aria-label="Announcements">
      <div className="lib-container" aria-live="polite">{render(current, index)}</div>
    </section>
  );
}
