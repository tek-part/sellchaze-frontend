/**
 * karat-hero — the opening vitrine. `split`: the copy beside an arched window (the house motif) that
 * frames the merchant's photograph — or, with no photograph, a gold-on-ink line drawing of a cut
 * stone, so the hero is complete on day one. `full`: a full-bleed photograph with centred copy.
 * The image is the page's LCP element: eager, high priority, sized per layout.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ThemeSettings } from '../../../theme-engine/types';
import { mobileSrcSet } from '../../../foundation/media/responsive';
import { themeCampaignAsset } from '../../../theme-campaign-asset';
import { LibImage, defineSection, fields, num, str, tr, useSectionSettings } from '../../../sections-lib';
import { cn } from '../../../../../shared/utils/cn';
import { Motif, type MotifKind } from './motifs';

const MOTIFS = [
  { value: 'diamond', label: 'Cut diamond' },
  { value: 'ring', label: 'Solitaire ring' },
  { value: 'chain', label: 'Chain & pendant' },
  { value: 'pearl', label: 'Pearl strand' },
  { value: 'watch', label: 'Watch' },
] as const;

export const karatHeroSchema = defineSection({
  type: 'karat-hero',
  label: 'Karat — arched hero',
  description: 'Opening statement beside an arched window (photo or line drawing), or a full-bleed photo.',
  category: 'hero',
  icon: 'HiOutlineSparkles',
  settings: [
    fields.select('layout', 'Layout', [{ value: 'split', label: 'Copy beside an arched window' }, { value: 'full', label: 'Full-bleed photograph' }], 'split'),
    fields.image('image', 'Photograph', '', 'Portrait photos suit the arch (about 4:5). Leave empty for the line drawing.'),
    fields.image('mobile_image', 'Mobile photograph (full layout)', ''),
    fields.select('motif', 'Line drawing (no photo)', MOTIFS, 'diamond'),
    fields.text('eyebrow', 'Eyebrow', tr('مجوهرات راقية مختارة بعناية', 'Fine jewellery, chosen with care')),
    fields.text('heading', 'Heading', tr('قطعٌ تُورَّث جيلاً بعد جيل', 'Pieces made to be inherited')),
    fields.textarea('text', 'Text', tr('ذهب عيار ١٨ و٢١، ألماس بشهادات معتمدة، ولؤلؤ طبيعي — مختارة بعناية ومصاغة لتبقى معك سنوات طويلة.', 'Hallmarked 18K and 21K gold, certified diamonds and natural pearls — chosen with care and crafted to stay with you for years.')),
    fields.text('cta_label', 'Button label', tr('تسوّق المجموعة', 'Shop the collection')),
    fields.url('cta_url', 'Button link', '/shop'),
    fields.text('link_label', 'Second link label', tr('احجز موعداً خاصاً', 'Book a private viewing')),
    fields.url('link_url', 'Second link', '/contact'),
    fields.text('caption', 'Caption under the arch', tr('مجموعة الموسم', 'The season’s edit')),
    fields.range('overlay', 'Photo darkening (full layout)', 40, 0, 80, 5),
  ],
});

function HeroCopy(props: { s: ThemeSettings; centered?: boolean }): ReactElement {
  const { s } = props;
  const eyebrow = str(s, 'eyebrow');
  const text = str(s, 'text');
  const cta = str(s, 'cta_label');
  const link = str(s, 'link_label');
  return (
    <div className={cn('kr-hero__copy', props.centered && 'kr-hero__copy--center')}>
      {eyebrow ? <p className="kr-eyebrow kr-hero__eyebrow">{eyebrow}</p> : null}
      <h1 className="kr-hero__title">{str(s, 'heading')}</h1>
      {text ? <p className="kr-hero__text">{text}</p> : null}
      {cta || link ? (
        <div className="kr-hero__actions">
          {cta ? <a href={str(s, 'cta_url', '/shop') || '/shop'} className="kr-btn kr-btn--primary">{cta}</a> : null}
          {link ? <a href={str(s, 'link_url') || '/contact'} className="kr-textlink">{link}<span aria-hidden className="kr-textlink__arrow">→</span></a> : null}
        </div>
      ) : null}
    </div>
  );
}

export function KaratHero(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(karatHeroSchema, props.settings);
  const image = str(s, 'image');
  const mobile = str(s, 'mobile_image');
  const motif = str(s, 'motif', 'diamond') as MotifKind;
  const caption = str(s, 'caption');

  if (str(s, 'layout') === 'full') {
    return (
      <section className={cn('kr-hero kr-hero--full', !image && 'kr-hero--noimage')}>
        <div className="kr-hero__bg">
          {image ? (
            <picture>
              {mobile ? <source media="(max-width: 767px)" srcSet={mobileSrcSet(themeCampaignAsset(mobile))} sizes="100vw" /> : null}
              <LibImage src={image} alt="" eager sizes="100vw" className="kr-hero__photo" />
            </picture>
          ) : (
            <Motif kind={motif} className="kr-hero__motif kr-hero__motif--full" />
          )}
          <span className="kr-hero__shade" style={{ '--kr-shade': image ? num(s, 'overlay', 40) / 100 : 0 } as CSSProperties} aria-hidden />
        </div>
        <div className="lib-container kr-hero__inner">
          <HeroCopy s={s} centered />
        </div>
      </section>
    );
  }

  return (
    <section className="kr-hero kr-hero--split">
      <div className="lib-container kr-hero__grid">
        <HeroCopy s={s} />
        <figure className="kr-hero__window">
          <div className="kr-hero__frame">
            <div className={cn('kr-arch', !image && 'kr-arch--empty')}>
              {image ? (
                <LibImage src={image} alt="" eager sizes="(min-width: 900px) 40vw, 80vw" className="kr-arch__img" />
              ) : (
                <Motif kind={motif} className="kr-hero__motif" />
              )}
            </div>
          </div>
          {caption ? <figcaption className="kr-hero__caption">{caption}</figcaption> : null}
        </figure>
      </div>
    </section>
  );
}
