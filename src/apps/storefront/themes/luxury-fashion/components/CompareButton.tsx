/**
 * CompareButton — add / remove a product from the compare set. Thin scales icon that fills on
 * select; disabled when the set is full. See §32.3.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconCompare } from './icons';

export interface CompareButtonProps {
  active: boolean;
  onToggle: () => void;
  /** Disable when the compare set is full and this item is not already in it. */
  disabled?: boolean;
  labelledText?: string;
  className?: string;
}

export function CompareButton(props: CompareButtonProps): ReactElement {
  const { active, onToggle, disabled = false, labelledText, className } = props;
  const { t } = useTranslation();
  const label = active ? t('product.removeFromCompare') : t('product.addToCompare');
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={labelledText ? undefined : label}
      title={label}
      disabled={disabled && !active}
      className={cn('sf-icon-btn', 'sf-compare', active && 'sf-compare--active', className)}
      onClick={onToggle}
    >
      <IconCompare aria-hidden />
      {labelledText ? <span className="sf-compare__text">{labelledText}</span> : null}
    </button>
  );
}
