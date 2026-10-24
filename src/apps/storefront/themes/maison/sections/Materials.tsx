/**
 * maison-materials — material & care notes. An intro column (sticky on desktop) beside a list of
 * materials, each with a drawn swatch (weave, grain, glaze…), what it is like to live with, and
 * care steps (one per line in the editor, shown as a short list). Works on the home page and as a
 * compact block under the product details.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { cn } from '../../../../../shared/utils/cn';
import { defineSection, fields, tr, list, str, useLocaleCode, useSectionSettings } from '../../../sections-lib';
import { maiText } from '../components/i18n';
import { MaterialSwatch } from './art';

const MATERIAL_OPTIONS = [
  { value: 'linen', label: 'Linen' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'wool', label: 'Wool' },
  { value: 'ceramic', label: 'Ceramic / stoneware' },
  { value: 'wood', label: 'Wood' },
  { value: 'glass', label: 'Glass' },
  { value: 'brass', label: 'Brass / metal' },
  { value: 'rattan', label: 'Rattan / jute' },
  { value: 'marble', label: 'Marble / stone' },
  { value: 'other', label: 'Other' },
];

const note = (material: string, title: ReturnType<typeof tr>, text: ReturnType<typeof tr>, care: ReturnType<typeof tr>): Record<string, string | ReturnType<typeof tr>> => ({ material, title, text, care });

export const maisonMaterialsSchema = defineSection({
  type: 'maison-materials',
  label: 'Maison · Material & care notes',
  description: 'Material swatches with how each one lives and how to care for it.',
  category: 'content',
  icon: 'HiOutlineSparkles',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('الخامات والعناية', 'Materials & care')),
    fields.text('title', 'Heading', tr('خامات تدوم معك لسنوات', 'Materials made to live with')),
    fields.textarea('text', 'Text', tr('نختار خامات طبيعية تزداد جمالاً مع الاستخدام، وتكفيها عناية بسيطة لتبقى كما تحبها.', 'We choose natural materials that get better with use. A little simple care keeps them beautiful for years.')),
    fields.select('layout', 'Layout', [
      { value: 'split', label: 'Intro beside the list' },
      { value: 'cards', label: 'Cards in a row' },
    ], 'split'),
    fields.list('items', 'Materials', [
      fields.select('material', 'Material', MATERIAL_OPTIONS, 'linen'),
      fields.text('title', 'Title', ''),
      fields.textarea('text', 'About', ''),
      fields.textarea('care', 'Care steps (one per line)', ''),
    ], [
      note('linen', tr('كتان مغسول', 'Washed linen'), tr('يصبح أنعم مع كل غسلة، وتجاعيده الخفيفة جزء من جماله.', 'Softens with every wash; its gentle creasing is part of the charm.'), tr('غسيل على ٤٠ درجة ببرنامج هادئ\nتجفيف على الحبل في الظل\nكيّ وهو رطب قليلاً', 'Wash at 40° on a gentle cycle\nLine-dry in the shade\nIron while slightly damp')),
      note('ceramic', tr('فخّار مصنوع يدوياً', 'Hand-thrown stoneware'), tr('تختلف كل قطعة قليلاً في اللون والطلاء، وهذه بصمة الصنعة اليدوية.', 'Each piece varies slightly in tone and glaze — the mark of the maker’s hand.'), tr('آمن في غسالة الأطباق\nتجنّب التغيّر المفاجئ في الحرارة\nلا يوضع على النار مباشرة', 'Dishwasher safe\nAvoid sudden temperature changes\nNot for direct flame')),
      note('wood', tr('خشب طبيعي صلب', 'Solid wood'), tr('تزداد عروق الخشب ولونه عمقاً مع الوقت والضوء.', 'Grain and colour deepen naturally with time and light.'), tr('امسحه بقطعة قماش جافة\nأبعده عن الشمس المباشرة ومخارج التكييف\nادهنه بالزيت مرة في السنة', 'Wipe with a dry cloth\nKeep away from direct sun and vents\nRe-oil once a year')),
      note('brass', tr('نحاس أصفر', 'Solid brass'), tr('يكتسب لمعة دافئة عتيقة مع الوقت إن تركته دون تلميع.', 'Develops a warm, antique patina if left unpolished.'), tr('امسحه بقطعة ناعمة\nلمّعه بالخل والملح لاستعادة بريقه', 'Dust with a soft cloth\nPolish with vinegar and salt to restore shine')),
    ], 6),
  ],
});

export function MaisonMaterials(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(maisonMaterialsSchema, props.settings);
  const code = useLocaleCode();
  const items = list(s, 'items').filter((it) => str(it, 'title').trim() !== '' || str(it, 'text').trim() !== '');
  const title = str(s, 'title');
  if (items.length === 0 && !title) return null;
  return (
    <section className={cn('lib-section mai-mat', `mai-mat--${str(s, 'layout', 'split')}`)}>
      <div className="lib-container mai-mat__grid">
        <div className="mai-mat__intro">
          {str(s, 'eyebrow') ? <p className="mai-eyebrow">{str(s, 'eyebrow')}</p> : null}
          {title ? <h2 className="mai-mat__title">{title}</h2> : null}
          {str(s, 'text') ? <p className="mai-mat__text">{str(s, 'text')}</p> : null}
        </div>
        <ul className="mai-mat__list">
          {items.map((it, i) => {
            const care = str(it, 'care').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            return (
              <li key={i} className="mai-mat__item">
                <MaterialSwatch material={str(it, 'material', 'other')} className="mai-mat__swatch" />
                <div className="mai-mat__body">
                  {str(it, 'title') ? <h3 className="mai-mat__name">{str(it, 'title')}</h3> : null}
                  {str(it, 'text') ? <p className="mai-mat__about">{str(it, 'text')}</p> : null}
                  {care.length > 0 ? (
                    <div className="mai-mat__care">
                      <p className="mai-mat__care-title">{maiText(code, 'care')}</p>
                      <ul className="mai-mat__steps">
                        {care.map((c) => <li key={c}>{c}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
