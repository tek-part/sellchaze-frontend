/** Voltage CompareButton — toggle a product in the compare set. Disabled when the set is full. */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconCompare } from './icons';

export interface CompareButtonProps {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export function CompareButton(props: CompareButtonProps): ReactElement {
  const { active, onToggle, disabled = false, className } = props;
  const { t } = useTranslation();
  const label = active ? t('product.removeFromCompare') : t('product.addToCompare');
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={disabled && !active ? t('product.compareFull') : label}
      disabled={disabled && !active}
      className={cn('vlt-icon-btn', 'vlt-compare-btn', active && 'vlt-compare-btn--active', className)}
      onClick={onToggle}
    >
      <span aria-hidden><IconCompare /></span>
    </button>
  );
}
