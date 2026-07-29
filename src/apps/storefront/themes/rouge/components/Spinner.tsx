/** Rouge Spinner — soft rouge ring; sized in em. Reduced-motion handled globally. */
import type { HTMLAttributes, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
}

export function Spinner(props: SpinnerProps): ReactElement {
  const { label, className, ...rest } = props;
  const { t } = useTranslation();
  const decorative = rest['aria-hidden'] === true || rest['aria-hidden'] === 'true';
  return (
    <span
      className={cn('rge-spinner', className)}
      role={decorative ? undefined : 'status'}
      aria-label={decorative ? undefined : (label ?? t('common.loading'))}
      {...rest}
    />
  );
}
