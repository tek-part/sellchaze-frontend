/** Voltage SectionHead — mono eyebrow + grotesque headline (+ optional intro / "View all"). */
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { Eyebrow } from './Typography';
import { LinkButton } from './LinkButton';

export interface SectionHeadProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  headingLevel?: 'h1' | 'h2' | 'h3';
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function SectionHead(props: SectionHeadProps): ReactElement {
  const { t } = useTranslation();
  const { eyebrow, title, intro, headingLevel: Tag = 'h2', viewAllHref, viewAllLabel = t('common.viewAll'), className } = props;
  const row = Boolean(viewAllHref);
  return (
    <header className={cn('vlt-section-head', row && 'vlt-section-head--row', className)}>
      <div className="vlt-section-head__group">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Tag className="vlt-section-head__title">{title}</Tag>
        {intro ? <p className="vlt-section-head__intro">{intro}</p> : null}
      </div>
      {viewAllHref ? (
        <LinkButton arrow href={viewAllHref}>
          {viewAllLabel}
        </LinkButton>
      ) : null}
    </header>
  );
}
