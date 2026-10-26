/**
 * EmptyState / ErrorState — the dead-end surfaces. One piece of art, a headline, one sentence, one
 * way forward.
 *
 * Shared because the audit found ZERO sections in ANY of the four themes rendered an error state:
 * every theme degraded by returning `null`, so an API failure rendered a silently blank page. One
 * implementation here means fixing that once rather than 86 times.
 *
 * Themes style `${ns}-state`, `${ns}-state--error`, `${ns}-state__art|title|text|actions|code` and
 * supply their own `art` node, so the visual language stays per-theme.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../shared/utils/cn';
import { block, mod, el, DEFAULT_NS, type ClassNamespace } from './ns';

interface StateBaseProps {
  title: ReactNode;
  description?: ReactNode;
  /** One primary CTA (and optionally a secondary) — keep it to a way forward. */
  actions?: ReactNode;
  /** Theme-supplied line-drawing or illustration. */
  art?: ReactNode;
  className?: string;
  ns?: ClassNamespace;
  /**
   * 1 when the state IS the page (404, a missing article, a failed product load) so the page keeps
   * its one top-level heading; 2 (default) when it sits under the page's own title.
   */
  headingLevel?: 1 | 2;
}

export type EmptyStateProps = StateBaseProps;

export function EmptyState(props: EmptyStateProps): ReactElement {
  const { title, description, actions, art, className, ns = DEFAULT_NS, headingLevel = 2 } = props;
  const Heading = headingLevel === 1 ? 'h1' : 'h2';

  return (
    <div className={cn(block('state', ns), className)}>
      {art ? (
        <div className={el('state', 'art', ns)} aria-hidden>
          {art}
        </div>
      ) : null}
      <Heading className={el('state', 'title', ns)}>{title}</Heading>
      {description ? <p className={el('state', 'text', ns)}>{description}</p> : null}
      {actions ? <div className={el('state', 'actions', ns)}>{actions}</div> : null}
    </div>
  );
}

export interface ErrorStateProps extends StateBaseProps {
  /** Large code shown as the art (e.g. "404", "500"). */
  code?: string;
}

/**
 * `role="alert"` so assistive tech announces the failure — a silent blank region is the exact
 * degradation this component exists to prevent.
 */
export function ErrorState(props: ErrorStateProps): ReactElement {
  const { code, title, description, actions, art, className, ns = DEFAULT_NS, headingLevel = 2 } = props;
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const artNode = art ?? (code ? <span className={el('state', 'code', ns)}>{code}</span> : null);

  return (
    <div className={cn(block('state', ns), mod('state', 'error', ns), className)} role="alert">
      {artNode ? (
        <div className={el('state', 'art', ns)} aria-hidden>
          {artNode}
        </div>
      ) : null}
      <Heading className={el('state', 'title', ns)}>{title}</Heading>
      {description ? <p className={el('state', 'text', ns)}>{description}</p> : null}
      {actions ? <div className={el('state', 'actions', ns)}>{actions}</div> : null}
    </div>
  );
}
