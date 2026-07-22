/** Voltage ProductCard skeleton — matches the card footprint (CLS-safe). */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
export function ProductCardSkeleton(props: { className?: string }): ReactElement {
  return (
    <div className={cn('vlt-card', props.className)} aria-hidden>
      <span className="vlt-skel vlt-skel--media" />
      <div className="vlt-card__body">
        <span className="vlt-skel vlt-skel--text" style={{ width: '40%' }} />
        <span className="vlt-skel vlt-skel--text" style={{ width: '80%' }} />
        <span className="vlt-skel vlt-skel--text" style={{ width: '30%' }} />
      </div>
    </div>
  );
}
