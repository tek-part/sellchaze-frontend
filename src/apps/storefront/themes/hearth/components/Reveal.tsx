/**
 * Reveal — wraps children in a gentle fade-up that plays once as it scrolls into view. Purely
 * presentational; content is always in the DOM (SEO- and no-JS-safe) and simply un-transformed for
 * reduced-motion users. Compose it around section heads / cards for Hearth's calm, weighted motion.
 */
import type { ElementType, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { useReveal } from './useReveal';

export interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  /** Stagger delay in ms (for lists). */
  delay?: number;
  className?: string;
}

export function Reveal(props: RevealProps): ReactElement {
  const { children, as: Tag = 'div', delay = 0, className } = props;
  const { ref, revealed } = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref}
      className={cn('hh-reveal', revealed && 'hh-reveal--in', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
