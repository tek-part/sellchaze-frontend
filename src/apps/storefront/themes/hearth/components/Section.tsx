/**
 * Section — vertical rhythm wrapper. Applies the responsive `--section-y` block padding that gives
 * Hearth its calm, airy breathing room. Optional warm-band background. Pair with `Container`.
 */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type SectionBg = 'oat' | 'sand' | 'cream';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Reduced block padding for dense/secondary bands. */
  tight?: boolean;
  /** Background surface for the band. */
  bg?: SectionBg;
  as?: ElementType;
  children: ReactNode;
}

export function Section(props: SectionProps): ReactElement {
  const { tight = false, bg = 'oat', as: Tag = 'section', className, children, ...rest } = props;
  return (
    <Tag
      className={cn('hh-section', tight && 'hh-section--tight', `hh-section--${bg}`, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
