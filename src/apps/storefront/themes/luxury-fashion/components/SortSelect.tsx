/**
 * SortSelect — compact inline "Sort · [native select]" control for the PLP. Native select for
 * accessibility and mobile ergonomics; thin 45° chevron. See §32.6 (sort control).
 *
 * The control itself is `shared-ui/SortSelect`; Theme 01 supplies its field-box chrome and the `sf`
 * namespace, so the hairline border and chevron are unchanged and the option vocabulary is the
 * shared one rather than a second copy.
 */
import { useId, type ReactElement } from 'react';
import { SortSelect as SharedSortSelect, type SortKey } from '../../../shared-ui';

export type { SortKey };

export interface SortSelectProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
  label?: string;
  className?: string;
  options?: ReadonlyArray<{ value: SortKey; label: string }>;
}

export function SortSelect(props: SortSelectProps): ReactElement {
  const { value, onChange, label = 'Sort', className, options } = props;
  const id = useId();

  return (
    <SharedSortSelect
      ns="sf"
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      {...(className ? { className } : {})}
      {...(options ? { options } : {})}
      controlWrapperClassName="sf-field__box sf-field__box--select"
      controlClassName="sf-control sf-select"
    />
  );
}
