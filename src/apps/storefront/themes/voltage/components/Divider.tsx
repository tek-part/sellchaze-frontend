/** Voltage Divider — a hairline rule. */
import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
export function Divider(props: HTMLAttributes<HTMLHRElement>): ReactElement {
  const { className, ...rest } = props;
  return <hr className={cn('vlt-divider', className)} {...rest} />;
}
