/** Rouge Divider — a soft petal hairline; `gilt` variant renders a thin gilt rule. */
import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
export interface DividerProps extends HTMLAttributes<HTMLHRElement> { gilt?: boolean; }
export function Divider(props: DividerProps): ReactElement {
  const { gilt = false, className, ...rest } = props;
  return <hr className={cn('rge-divider', gilt && 'rge-divider--gilt', className)} {...rest} />;
}
