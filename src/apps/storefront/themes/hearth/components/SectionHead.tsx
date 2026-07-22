/**
 * SectionHead — the small serif label + rule, serif headline (+ optional intro / "View all") that
 * opens almost every section. Composes SectionLabel; the headline level is chosen for the document
 * outline (accessibility), independent of visual scale.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { SectionLabel } from './Typography';
import { LinkButton } from './LinkButton';
import { Reveal } from './Reveal';

export interface SectionHeadProps {
  label?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'start' | 'center';
  headingLevel?: 'h1' | 'h2' | 'h3';
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function SectionHead(props: SectionHeadProps): ReactElement {
  const {
    label,
    title,
    intro,
    align = 'start',
    headingLevel: Tag = 'h2',
    viewAllHref,
    viewAllLabel = 'View all',
    className,
  } = props;

  const withViewAll = Boolean(viewAllHref) && align === 'start';

  return (
    <Reveal
      as="header"
      className={cn(
        'hh-section-head',
        align === 'center' && 'hh-section-head--centered',
        withViewAll && 'hh-section-head--with-view-all',
        className,
      )}
    >
      <div className="hh-section-head__group">
        {label ? <SectionLabel>{label}</SectionLabel> : null}
        <Tag className="hh-section-head__title">{title}</Tag>
        {intro ? <p className="hh-section-head__intro">{intro}</p> : null}
      </div>
      {viewAllHref ? (
        <LinkButton variant="arrow" href={viewAllHref}>
          {viewAllLabel}
        </LinkButton>
      ) : null}
    </Reveal>
  );
}
