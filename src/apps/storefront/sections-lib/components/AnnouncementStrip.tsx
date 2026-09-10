/**
 * announcement-strip — a slim band of `message` blocks (free shipping, promo codes). Messages rotate
 * (static under reduced motion), scroll as a marquee, or show inline. Not dismissible: it is page
 * content placed by the merchant; the chrome-level AnnouncementBar is the dismissible one.
 */
import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { prefersReducedMotion } from '../../../../shared/env/media';
import { defineBlock, defineSection, fields, tr, variants, variantSelect } from '../schema';
import { num, str, useSectionBlocks, useSectionSettings, useVariant } from '../use-section';

const MESSAGE_FIELDS = [fields.text('text', 'Text', ''), fields.url('url', 'Link', '')] as const;

export const messageBlock = defineBlock({ type: 'message', label: 'Message', icon: 'HiOutlineMegaphone', settings: MESSAGE_FIELDS, limit: 6 });

export const STRIP_MODES = variants('mode', [
  { value: 'rotate', label: 'Rotate', description: 'One message at a time.', icon: 'HiOutlineArrowPath' },
  { value: 'marquee', label: 'Marquee', description: 'Continuous scrolling text.', icon: 'HiOutlineForward' },
  { value: 'static', label: 'Inline', description: 'All messages side by side.', icon: 'HiOutlineBars3' },
]);

export const announcementStripSchema = defineSection({
  type: 'announcement-strip',
  label: 'Announcement strip',
  description: 'A slim band of short messages — shipping, promo codes, news.',
  category: 'marketing',
  icon: 'HiOutlineMegaphone',
  variants: STRIP_MODES,
  blocks: { types: [messageBlock], max: 6, legacy: 'items' },
  settings: [
    variantSelect(STRIP_MODES, 'rotate', 'Display'),
    fields.list(
      'items',
      'Messages',
      MESSAGE_FIELDS,
      [
        { text: tr('شحن مجاني للطلبات فوق ٢٠٠ ر.س', 'Free shipping on orders over 200'), url: '' },
        { text: tr('إرجاع مجاني خلال ١٤ يوماً', 'Free returns within 14 days'), url: '' },
      ],
      6,
    ),
    fields.range('interval', 'Rotate every (s)', 5, 3, 15),
    fields.color('background', 'Background', ''),
    fields.color('color', 'Text colour', ''),
  ],
});

export function AnnouncementStrip(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(announcementStripSchema, props.settings);
  const mode = useVariant(announcementStripSchema, props.settings);
  const items = useSectionBlocks(announcementStripSchema, s).filter((b) => str(b.settings, 'text'));
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
  const render = (item: (typeof items)[number], key: string): ReactElement => {
    const text = str(item.settings, 'text');
    const url = str(item.settings, 'url');
    return url ? <a key={key} href={url} className="lib-strip__item">{text}</a> : <span key={key} className="lib-strip__item">{text}</span>;
  };

  if (mode === 'marquee' && !prefersReducedMotion()) {
    return (
      <section className="lib-strip lib-strip--marquee" style={style} role="region" aria-label="Announcements">
        <div className="lib-strip__track" aria-hidden>
          {items.map((item) => render(item, item.id))}
          {items.map((item) => render(item, `${item.id}-dup`))}
        </div>
        <span className="lib-sr-only">{items.map((i) => str(i.settings, 'text')).join(' · ')}</span>
      </section>
    );
  }
  if (mode === 'static') {
    return (
      <section className="lib-strip lib-strip--static" style={style} role="region" aria-label="Announcements">
        <div className="lib-container lib-strip__inline">{items.map((item) => render(item, item.id))}</div>
      </section>
    );
  }
  const current = items[index] ?? items[0]!;
  return (
    <section className={cn('lib-strip', 'lib-strip--rotate')} style={style} role="region" aria-label="Announcements">
      <div className="lib-container" aria-live="polite">{render(current, current.id)}</div>
    </section>
  );
}
