/**
 * spacer — vertical breathing room with separate desktop / mobile heights and an optional rule.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection } from '../schema';
import { bool, num, useSectionSettings } from '../use-section';

export const spacerSchema = defineSection({
  type: 'spacer',
  label: 'Spacer',
  description: 'Empty vertical space between sections.',
  category: 'layout',
  icon: 'HiOutlineArrowsUpDown',
  settings: [
    { id: 'height', type: 'range', label: 'Height (desktop)', default: 48, min: 0, max: 240, step: 4, responsive: true, css_property: 'padding-block' },
    { id: 'height_mobile', type: 'range', label: 'Height (mobile)', default: 24, min: 0, max: 160, step: 4 },
    { id: 'divider', type: 'toggle', label: 'Show a divider line', default: false },
  ],
});

export function Spacer(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(spacerSchema, props.settings);
  const style = { '--lib-space': `${num(s, 'height', 48)}px`, '--lib-space-m': `${num(s, 'height_mobile', 24)}px` } as CSSProperties;
  return (
    <div className={cn('lib-spacer', bool(s, 'divider') && 'lib-spacer--rule')} style={style} aria-hidden>
      {bool(s, 'divider') ? <div className="lib-container"><hr className="lib-spacer__rule" /></div> : null}
    </div>
  );
}
