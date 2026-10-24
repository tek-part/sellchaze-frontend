/**
 * maison-hero — the editorial opening spread: a large serif headline with copy and two calls to
 * action beside an arch-topped photograph, a small round detail shot overlapping its foot and a
 * caption chip. Without photos the arch holds a drawn still life, so the spread is never empty.
 * The main photo is the LCP image (eager + high priority).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { defineSection, fields, tr, LibImage, str, useSectionSettings } from '../../../sections-lib';
import { IconArrow } from '../chrome/icons';
import { StillLifeArt } from './art';

export const maisonHeroSchema = defineSection({
  type: 'maison-hero',
  label: 'Maison · Editorial hero',
  description: 'Large serif headline beside an arch-framed photo with a round detail shot.',
  category: 'hero',
  icon: 'HiOutlineHome',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('مجموعة الموسم', 'The season collection')),
    fields.text('title', 'Heading', tr('بيت دافئ يشبهك', 'Make it warm, make it yours')),
    fields.textarea('text', 'Text', tr('مصابيح بإضاءة هادئة، مفارش من الكتان، فخّار مصنوع يدوياً وهدايا مختارة بعناية لكل ركن في البيت.', 'Soft-glow lamps, washed linen, hand-thrown ceramics and thoughtful gifts for every corner of the home.')),
    fields.text('cta_label', 'Button label', tr('تسوّق الجديد', 'Shop new arrivals')),
    fields.url('cta_url', 'Button link', '/shop'),
    fields.text('secondary_label', 'Second link label', tr('تسوّق حسب الغرفة', 'Shop by room')),
    fields.url('secondary_url', 'Second link', '/categories'),
    fields.image('image', 'Main photo (arch frame)', '', 'Portrait photos work best (4:5).'),
    fields.image('detail_image', 'Detail photo (round)', '', 'A close-up: a lamp, a glaze, a weave.'),
    fields.text('caption', 'Photo caption', tr('فخّار مصنوع يدوياً', 'Hand-thrown stoneware')),
    fields.select('layout', 'Photo position', [
      { value: 'end', label: 'After the text' },
      { value: 'start', label: 'Before the text' },
    ], 'end'),
  ],
});

export function MaisonHero(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(maisonHeroSchema, props.settings);
  const image = str(s, 'image');
  const detail = str(s, 'detail_image');
  const caption = str(s, 'caption');
  const title = str(s, 'title');
  return (
    <section className={cn('lib-section mai-hero', str(s, 'layout') === 'start' && 'mai-hero--flip')}>
      <div className="lib-container mai-hero__grid">
        <div className="mai-hero__copy">
          {str(s, 'eyebrow') ? <p className="mai-eyebrow">{str(s, 'eyebrow')}</p> : null}
          {title ? <h1 className="mai-hero__title">{title}</h1> : null}
          {str(s, 'text') ? <p className="mai-hero__text">{str(s, 'text')}</p> : null}
          <div className="mai-hero__actions">
            {str(s, 'cta_label') ? (
              <a href={str(s, 'cta_url', '/shop') || '/shop'} className="lib-btn lib-btn--primary lib-btn--lg mai-btn">
                <span>{str(s, 'cta_label')}</span>
                <IconArrow />
              </a>
            ) : null}
            {str(s, 'secondary_label') ? (
              <a href={str(s, 'secondary_url', '/categories') || '/categories'} className="mai-textlink">{str(s, 'secondary_label')}</a>
            ) : null}
          </div>
        </div>
        <div className="mai-hero__visual">
          <span className="mai-hero__blob" aria-hidden />
          <div className="mai-hero__arch">
            <StillLifeArt className="mai-hero__art" />
            {image ? <LibImage src={image} alt="" eager sizes="(min-width: 1024px) 560px, 88vw" className="mai-hero__img" /> : null}
          </div>
          <div className="mai-hero__detail" aria-hidden={detail ? undefined : true}>
            {detail ? <LibImage src={detail} alt="" sizes="(min-width: 1024px) 200px, 34vw" className="mai-hero__detail-img" /> : <span className="mai-hero__detail-fallback" />}
          </div>
          {caption ? <p className="mai-hero__caption">{caption}</p> : null}
        </div>
      </div>
    </section>
  );
}
