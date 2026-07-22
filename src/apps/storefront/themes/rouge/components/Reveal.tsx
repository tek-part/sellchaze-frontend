/** Rouge Reveal — wraps content in the "bloom" scroll-entrance (drift + slight scale + fade). */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { useReveal } from './useReveal';

export interface RevealProps {
  children: ReactNode;
  className?: string;
}

export function Reveal(props: RevealProps): ReactElement {
  const { children, className } = props;
  const { ref, revealed } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={cn('rge-reveal', className)} data-revealed={revealed ? 'true' : 'false'}>
      {children}
    </div>
  );
}
