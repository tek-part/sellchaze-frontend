/**
 * maison-shop-the-room — a room photo with merchant-placed hotspot pins, each linked to a product.
 *
 * Pins are positioned by percentage (`x`, `y` of the photo box). The photo is never mirrored in
 * RTL, so pins use physical `left`/`top` on purpose — they must stay on the object they mark.
 * Pins are real buttons in reading order (Tab / Enter / Space), with `aria-expanded` wired to a
 * small product card beside the pin; Escape or a click elsewhere closes it. The same products are
 * listed, numbered, beside the photo on desktop and under it on phones — the list is the primary
 * interface on small screens (pin popovers are hidden there; tapping a pin highlights its row).
 *
 * A hotspot's product resolves by id/handle; an empty or unknown reference falls back to the next
 * unused product of the fallback collection, so the section is shoppable before it is configured.
 * Without a photo, the section draws a living room whose objects sit under the default pins.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ProductCardModel } from '../../../types/catalog';
import { cn } from '../../../../../shared/utils/cn';
import { defineSection, fields, tr, LibImage, LibPrice, list, num, str, useLibId, useLocaleCode, useSectionData, useSectionSettings } from '../../../sections-lib';
import { maiText } from '../components/i18n';
import { cardMetaLine } from '../components/card-meta';
import { IconArrow } from '../chrome/icons';
import { RoomSceneArt } from './art';

const ASPECTS: Readonly<Record<string, string>> = { landscape: '3 / 2', wide: '16 / 9', square: '1 / 1', portrait: '4 / 5' };

const pin = (x: number, y: number, note: ReturnType<typeof tr>): Record<string, string | number | ReturnType<typeof tr>> => ({ product: '', x, y, note });

export const maisonShopTheRoomSchema = defineSection({
  type: 'maison-shop-the-room',
  label: 'Maison · Shop the room',
  description: 'A room photo with hotspot pins linking to products, plus a numbered list.',
  category: 'products',
  icon: 'HiOutlineMapPin',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('تسوّق الغرفة', 'Shop the room')),
    fields.text('title', 'Heading', tr('غرفة معيشة في ضوء العصر', 'A living room in late-afternoon light')),
    fields.textarea('text', 'Text', tr('اضغط على أي نقطة في الصورة لترى القطعة وسعرها، أو اختر من القائمة.', 'Tap a marker on the photo to see the piece and its price — or pick from the list.')),
    fields.image('image', 'Room photo', '', 'Pins are placed as a percentage of the photo, so keep the same shape (below) after placing them.'),
    fields.select('aspect', 'Photo shape', [
      { value: 'landscape', label: 'Landscape 3:2' },
      { value: 'wide', label: 'Wide 16:9' },
      { value: 'square', label: 'Square 1:1' },
      { value: 'portrait', label: 'Portrait 4:5' },
    ], 'landscape'),
    fields.select('layout', 'Photo position', [
      { value: 'start', label: 'Photo first, list beside it' },
      { value: 'end', label: 'List first, photo beside it' },
    ], 'start'),
    fields.collection('collection', 'Fallback products', 'featured', 'Used for any pin without a product (in order).'),
    fields.text('cta_label', 'Button label', tr('تسوّق كل قطع الغرفة', 'See the whole room')),
    fields.url('cta_url', 'Button link', '/collections/living'),
    fields.list('hotspots', 'Hotspots', [
      fields.product('product', 'Product'),
      fields.range('x', 'Across (%)', 50, 0, 100, 1, 'From the left edge of the photo.'),
      fields.range('y', 'Down (%)', 50, 0, 100, 1, 'From the top edge of the photo.'),
      fields.text('note', 'Short note', ''),
    ], [
      pin(44, 64, tr('كتان مغسول', 'Washed linen')),
      pin(80, 36, tr('ضوء دافئ', 'Warm light')),
      pin(68, 90, tr('صوف منسوج يدوياً', 'Hand-woven wool')),
      pin(14, 64, tr('فخّار يدوي', 'Hand-thrown')),
    ], 8),
  ],
});

interface Spot {
  readonly product: ProductCardModel;
  readonly x: number;
  readonly y: number;
  readonly note: string;
}

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export function MaisonShopTheRoom(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(maisonShopTheRoomSchema, props.settings);
  const data = useSectionData(props.context);
  const code = useLocaleCode();
  const baseId = useLibId('mai-str');
  const figureRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);

  const hotspots = list(s, 'hotspots');
  const fallback = data.products(str(s, 'collection', 'featured'), 24);
  const spots = useMemo<ReadonlyArray<Spot>>(() => {
    const used = new Set<string>();
    const out: Spot[] = [];
    for (const h of hotspots) {
      const ref = str(h, 'product').trim();
      let product = ref ? data.product(ref) : undefined;
      if (product && used.has(product.id)) product = undefined;
      if (!product) product = fallback.find((p) => !used.has(p.id));
      if (!product) continue;
      used.add(product.id);
      out.push({ product, x: clamp(num(h, 'x', 50)), y: clamp(num(h, 'y', 50)), note: str(h, 'note') });
    }
    return out;
  }, [hotspots, fallback, data]);

  useEffect(() => {
    if (open === null) return;
    const onDoc = (e: MouseEvent): void => {
      if (figureRef.current && !figureRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape' && open !== null) {
      const index = open;
      setOpen(null);
      figureRef.current?.querySelector<HTMLButtonElement>(`[data-pin="${index}"]`)?.focus();
    }
  };

  const image = str(s, 'image');
  const title = str(s, 'title');
  const active = open ?? focus;
  const ratio = ASPECTS[str(s, 'aspect', 'landscape')] ?? ASPECTS['landscape']!;

  return (
    <section className={cn('lib-section mai-str', str(s, 'layout') === 'end' && 'mai-str--flip')}>
      <div className="lib-container mai-str__grid">
        <div className="mai-str__figure" ref={figureRef} onKeyDown={onKeyDown} style={{ '--mai-str-ratio': ratio } as CSSProperties}>
          <div className="mai-str__canvas">
            <RoomSceneArt className="mai-str__art" />
            {image ? <LibImage src={image} alt={title} sizes="(min-width: 1024px) 760px, 100vw" className="mai-str__img" /> : null}
            {spots.map((spot, i) => {
              const popId = `${baseId}-pop-${i}`;
              const isOpen = open === i;
              const style = { left: `${spot.x}%`, top: `${spot.y}%` } as CSSProperties;
              return (
                <div key={spot.product.id} className={cn('mai-pin', isOpen && 'is-open', active === i && 'is-active')} style={style} data-side-x={spot.x > 58 ? 'left' : 'right'} data-side-y={spot.y > 55 ? 'up' : 'down'}>
                  <button
                    type="button"
                    className="mai-pin__btn"
                    data-pin={i}
                    aria-expanded={isOpen}
                    aria-controls={popId}
                    aria-label={`${maiText(code, 'pinLabel')} ${i + 1}: ${spot.product.title}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    onFocus={() => setFocus(i)}
                    onBlur={() => setFocus(null)}
                  >
                    <span aria-hidden>{i + 1}</span>
                  </button>
                  <div id={popId} className="mai-pin__pop" hidden={!isOpen}>
                    <span className="mai-pin__thumb" aria-hidden>
                      <LibImage src={spot.product.image?.src} alt="" sizes="72px" monogram={spot.product.title.charAt(0)} />
                    </span>
                    <span className="mai-pin__info">
                      {spot.note ? <span className="mai-pin__note">{spot.note}</span> : null}
                      <a href={spot.product.url} className="mai-pin__title">{spot.product.title}</a>
                      <LibPrice amount={spot.product.price} compareAt={spot.product.compareAtPrice} currency={spot.product.currency} className="mai-pin__price" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mai-str__panel">
          {str(s, 'eyebrow') ? <p className="mai-eyebrow">{str(s, 'eyebrow')}</p> : null}
          {title ? <h2 className="mai-str__title">{title}</h2> : null}
          {str(s, 'text') ? <p className="mai-str__text">{str(s, 'text')}</p> : null}
          {spots.length > 0 ? (
            <>
              <h3 className="mai-str__list-title">{maiText(code, 'inThisRoom')}</h3>
              <ol className="mai-str__list">
                {spots.map((spot, i) => {
                  const meta = spot.note || cardMetaLine(spot.product);
                  return (
                    <li key={spot.product.id} className={cn('mai-str__item', active === i && 'is-active')} onMouseEnter={() => setFocus(i)} onMouseLeave={() => setFocus(null)}>
                      <span className="mai-str__num" aria-hidden>{i + 1}</span>
                      <span className="mai-str__thumb" aria-hidden>
                        <LibImage src={spot.product.image?.src} alt="" sizes="64px" monogram={spot.product.title.charAt(0)} />
                      </span>
                      <span className="mai-str__info">
                        <a href={spot.product.url} className="mai-str__name" onFocus={() => setFocus(i)} onBlur={() => setFocus(null)}>{spot.product.title}</a>
                        {meta ? <span className="mai-str__meta">{meta}</span> : null}
                      </span>
                      <LibPrice amount={spot.product.price} compareAt={spot.product.compareAtPrice} currency={spot.product.currency} className="mai-str__price" />
                    </li>
                  );
                })}
              </ol>
            </>
          ) : null}
          {str(s, 'cta_label') ? (
            <a href={str(s, 'cta_url', '/shop') || '/shop'} className="mai-textlink mai-str__cta">
              <span>{str(s, 'cta_label')}</span>
              <IconArrow />
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
