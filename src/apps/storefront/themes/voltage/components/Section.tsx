/** Voltage Section — vertical rhythm wrapper. Optional `reveal` fades/rises it in on scroll. */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { useReveal } from './overlay/useReveal';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tight?: boolean;
  as?: ElementType;
  /** Fade + rise into view on first scroll (reduced-motion → shows immediately). */
  reveal?: boolean;
  children: ReactNode;
}
export function Section(props: SectionProps): ReactElement {
  const { tight = false, as: Tag = 'section', reveal = false, className, children, ...rest } = props;
  const ref = useReveal<HTMLElement>();
  const cls = cn('vlt-section', tight && 'vlt-section--tight', reveal && 'vlt-reveal', className);

  // Reveal uses a concrete <section> so the observer ref attaches reliably (no polymorphic ref spread).
  if (reveal) {
    return (
      <section ref={ref} className={cls} {...rest}>
        {children}
      </section>
    );
  }
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
