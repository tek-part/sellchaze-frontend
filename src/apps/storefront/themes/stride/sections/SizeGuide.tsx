/**
 * stride-size-guide — "find your size": the merchant's own size chart (EU / US / UK / foot length)
 * as an accessible table, plus a finder that suggests the first size whose foot length covers the
 * shopper's measurement. Nothing is computed beyond the merchant's rows — no invented conversions.
 */
import { useId, useMemo, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import type { ThemeSettingListItem } from '../../../theme-engine/types';
import { cn } from '../../../../../shared/utils/cn';
import { bool, defineSection, fields, list, spacingFields, spacingStyle, str, tr, useLocaleCode, useSectionSettings } from '../../../sections-lib';
import { stText } from '../components/i18n';

const ROW_FIELDS = [
  { id: 'eu', type: 'text', label: 'EU', default: '' },
  { id: 'us', type: 'text', label: 'US', default: '' },
  { id: 'uk', type: 'text', label: 'UK', default: '' },
  { id: 'cm', type: 'text', label: 'Foot length (cm)', default: '' },
] as const;

const row = (eu: string, us: string, uk: string, cm: string): ThemeSettingListItem => ({ eu, us, uk, cm });

export const DEFAULT_SIZE_ROWS: ReadonlyArray<ThemeSettingListItem> = [
  row('39', '6.5', '5.5', '24.5'),
  row('40', '7', '6', '25'),
  row('40.5', '7.5', '6.5', '25.5'),
  row('41', '8', '7', '26'),
  row('42', '8.5', '7.5', '26.5'),
  row('42.5', '9', '8', '27'),
  row('43', '9.5', '8.5', '27.5'),
  row('44', '10', '9', '28'),
  row('44.5', '10.5', '9.5', '28.5'),
  row('45', '11', '10', '29'),
  row('46', '12', '11', '30'),
];

export const strideSizeGuideSchema = defineSection({
  type: 'stride-size-guide',
  label: 'Size guide',
  description: 'Your size chart (EU / US / UK / cm) with a foot-length size finder.',
  category: 'content',
  icon: 'HiOutlineTableCells',
  settings: [
    fields.text('eyebrow', 'Eyebrow', tr('دليل المقاسات', 'Size guide')),
    fields.text('title', 'Title', tr('اعرف مقاسك في ثواني', 'Find your size in seconds')),
    fields.textarea('text', 'Intro', tr('قِس طول قدمك من الكعب لأطول صباع واكتبه هنا — هنقترح عليك المقاس من جدولنا.', 'Measure your foot from heel to longest toe and enter it here — we’ll match it to our chart.')),
    fields.toggle('show_finder', 'Show the size finder', true),
    { id: 'rows', type: 'list', label: 'Size chart rows', item: ROW_FIELDS, default: DEFAULT_SIZE_ROWS, max: 30, hint: 'One row per size. Foot length in centimetres drives the finder.' },
    fields.textarea('tips', 'Fit tips', tr('قِس قدمك آخر اليوم وانت لابس شراب رياضي. لو بين مقاسين، اختار الأكبر للجري والأصغر للكرة.', 'Measure at the end of the day wearing sports socks. Between two sizes? Go up for running, down for football.')),
    fields.text('note', 'Small print', tr('المقاسات تقريبية وقد تختلف حسب الموديل.', 'Sizes are a guide and can vary by model.')),
    ...spacingFields(),
  ],
});

/** Index of the first row whose foot length (cm) is ≥ the shopper's length; -1 when none fits. */
export function suggestSizeRow(rows: ReadonlyArray<ThemeSettingListItem>, lengthCm: number): number {
  if (!Number.isFinite(lengthCm) || lengthCm <= 0) return -1;
  let best = -1;
  let bestCm = Infinity;
  rows.forEach((r, i) => {
    const cm = Number(String(r['cm'] ?? '').replace(',', '.'));
    if (Number.isFinite(cm) && cm >= lengthCm && cm < bestCm) {
      best = i;
      bestCm = cm;
    }
  });
  return best;
}

export function StrideSizeGuide(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(strideSizeGuideSchema, props.settings);
  const locale = useLocaleCode();
  const inputId = useId();
  const rows = list(s, 'rows').filter((r) => str(r, 'eu') || str(r, 'us') || str(r, 'uk'));
  const [value, setValue] = useState('');
  const length = Number(value.replace(',', '.'));
  const match = useMemo(() => (value.trim() ? suggestSizeRow(rows, length) : -1), [rows, length, value]);
  if (rows.length === 0) return null;
  const hit = match >= 0 ? rows[match] : undefined;
  const ar = locale.startsWith('ar');
  const cmLabel = ar ? 'سم' : 'cm';

  return (
    <section className="lib-section st-size" style={spacingStyle(s)}>
      <div className="lib-container st-size__inner">
        <div className="st-size__intro">
          {str(s, 'eyebrow') ? <p className="st-eyebrow"><span className="st-eyebrow__mark" aria-hidden />{str(s, 'eyebrow')}</p> : null}
          {str(s, 'title') ? <h2 className="st-display st-size__title">{str(s, 'title')}</h2> : null}
          {str(s, 'text') ? <p className="st-size__text">{str(s, 'text')}</p> : null}
          {bool(s, 'show_finder', true) ? (
            <div className="st-size__finder">
              <label htmlFor={inputId} className="st-size__label">{stText(locale, 'yourLength')}</label>
              <div className="st-size__field">
                <input
                  id={inputId}
                  className="st-size__input"
                  type="number"
                  inputMode="decimal"
                  min={15}
                  max={35}
                  step={0.5}
                  placeholder="26.5"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
                <span className="st-size__unit" aria-hidden>{cmLabel}</span>
              </div>
              <p className={cn('st-size__result', hit && 'is-match')} role="status" aria-live="polite">
                {value.trim() === '' ? null : hit ? (
                  <>
                    <span className="st-size__result-label">{stText(locale, 'recommended')}</span>
                    <strong className="st-size__result-value"><bdi>EU {str(hit, 'eu')}</bdi> · <bdi>US {str(hit, 'us')}</bdi> · <bdi>UK {str(hit, 'uk')}</bdi></strong>
                  </>
                ) : stText(locale, 'noMatch')}
              </p>
            </div>
          ) : null}
          {str(s, 'tips') ? <p className="st-size__tips">{str(s, 'tips')}</p> : null}
          <FootDiagram />
        </div>
        <div className="st-size__chart">
          <div className="st-size__scroll" tabIndex={0} role="region" aria-label={str(s, 'title') || 'Size chart'}>
            <table className="st-size__table">
              <thead>
                <tr>
                  <th scope="col">EU</th>
                  <th scope="col">US</th>
                  <th scope="col">UK</th>
                  <th scope="col">{cmLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${str(r, 'eu')}-${i}`} className={cn(i === match && 'is-match')} aria-current={i === match ? 'true' : undefined}>
                    <th scope="row">{str(r, 'eu')}</th>
                    <td>{str(r, 'us')}</td>
                    <td>{str(r, 'uk')}</td>
                    <td>{str(r, 'cm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {str(s, 'note') ? <p className="st-size__note">{str(s, 'note')}</p> : null}
        </div>
      </div>
    </section>
  );
}

/** Heel-to-toe measuring sketch (decorative). */
function FootDiagram(): ReactElement {
  return (
    <svg className="st-size__diagram" viewBox="0 0 220 64" aria-hidden>
      <path d="M14 40c0-12 10-20 26-20h86c22 0 44 4 62 12 10 4 16 10 16 16v2H14z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M14 56h190" stroke="currentColor" strokeWidth="2" />
      <path d="M14 51v10M204 51v10" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: 19 }, (_, i) => <path key={i} d={`M${24 + i * 10} 56v${i % 2 ? 3 : 5}`} stroke="currentColor" strokeWidth="1.5" />)}
      <circle className="st-size__diagram-dot" cx="14" cy="56" r="4" />
      <circle className="st-size__diagram-dot" cx="204" cy="56" r="4" />
    </svg>
  );
}
