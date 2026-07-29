/**
 * SectionHead — the eyebrow + serif headline (+ optional intro / "View all" link) that opens almost
 * every section. Composes Eyebrow; the headline level is chosen for the document outline. §32.8.
 */
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { Eyebrow } from './Typography';
import { LinkButton } from './LinkButton';

export interface SectionHeadProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'start' | 'center';
  headingLevel?: 'h1' | 'h2' | 'h3';
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function SectionHead(props: SectionHeadProps): ReactElement {
  const { t } = useTranslation();
  const {
    eyebrow,
    title,
    intro,
    align = 'start',
    headingLevel: Tag = 'h2',
    viewAllHref,
    viewAllLabel = t('common.viewAll'),
    className,
  } = props;

  const withViewAll = Boolean(viewAllHref) && align === 'start';

  return (
    <header
      className={cn(
        'sf-section-head',
        align === 'center' && 'sf-section-head--centered',
        withViewAll && 'sf-section-head--with-view-all',
        className,
      )}
    >
      <div className="sf-section-head__group">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Tag className="sf-section-head__title">{title}</Tag>
        {intro ? <p className="sf-section-head__intro">{intro}</p> : null}
      </div>
      {viewAllHref ? (
        <LinkButton variant="arrow" href={viewAllHref}>
          {viewAllLabel}
        </LinkButton>
      ) : null}
    </header>
  );
}
