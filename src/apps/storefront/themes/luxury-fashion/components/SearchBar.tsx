/**
 * SearchBar — underline query input with a thin search icon and a clear affordance. Used inline on
 * the PLP and (large) inside the SearchOverlay. Submits on Enter. See §32.6.
 */
import type { FormEvent, ReactElement, Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconButton } from './IconButton';
import { IconClose, IconSearch } from './icons';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  size?: 'md' | 'lg';
  ariaLabel?: string;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}

export function SearchBar(props: SearchBarProps): ReactElement {
  const {
    value,
    onChange,
    onSubmit,
    onClear,
    placeholder = 'Search',
    size = 'md',
    ariaLabel = 'Search',
    inputRef,
    className,
  } = props;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form
      role="search"
      className={cn('sf-searchbar', size === 'lg' && 'sf-searchbar--lg', className)}
      onSubmit={handleSubmit}
    >
      <span className="sf-searchbar__icon" aria-hidden>
        <IconSearch width={size === 'lg' ? 24 : 20} height={size === 'lg' ? 24 : 20} />
      </span>
      <input
        ref={inputRef}
        type="search"
        className="sf-searchbar__input"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <IconButton
          label="Clear search"
          className="sf-searchbar__clear"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
        >
          <IconClose width={18} height={18} />
        </IconButton>
      ) : null}
    </form>
  );
}
