/** Rouge SectionHead — gilt eyebrow + didone headline (+ optional intro / "View all"). Centerable. */
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
  const { eyebrow, title, intro, align = 'start', headingLevel: Tag = 'h2', viewAllHref, viewAllLabel = t('common.viewAll'), className } = props;
  const row = Boolean(viewAllHref) && align === 'start';
  return (
    <header
      className={cn('rge-section-head', align === 'center' && 'rge-section-head--center', row && 'rge-section-head--row', className)}
    >
      <div className="rge-section-head__group">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Tag className="rge-section-head__title">{title}</Tag>
        {intro ? <p className="rge-section-head__intro">{intro}</p> : null}
      </div>
      {viewAllHref && align === 'start' ? (
        <LinkButton arrow href={viewAllHref}>
          {viewAllLabel}
        </LinkButton>
      ) : null}
    </header>
  );
}
