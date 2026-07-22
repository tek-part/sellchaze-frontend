/** Rouge ProductCard skeleton — matches the card footprint (CLS-safe). */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
export function ProductCardSkeleton(props: { className?: string }): ReactElement {
  return (
    <div className={cn('rge-card', props.className)} aria-hidden>
      <span className="rge-skel rge-skel--media" />
      <div className="rge-card__body">
        <span className="rge-skel rge-skel--text" style={{ width: '38%' }} />
        <span className="rge-skel rge-skel--text" style={{ width: '80%' }} />
        <span className="rge-skel rge-skel--text" style={{ width: '30%' }} />
      </div>
    </div>
  );
}
