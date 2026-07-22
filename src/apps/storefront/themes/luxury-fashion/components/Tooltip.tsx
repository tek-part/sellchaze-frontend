/**
 * Tooltip — micro-hint on hover AND focus (keyboard-reachable). Ink bubble, supplementary only —
 * never houses essential information. Associates itself to the trigger via aria-describedby. §32.5.
 */
import { cloneElement, useId, useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { callAll } from '../../../../../shared/utils/callAll';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps {
  content: ReactNode;
  placement?: TooltipPlacement;
  /** Single focusable trigger element. */
  children: ReactElement<HTMLAttributes<HTMLElement>>;
}

export function Tooltip(props: TooltipProps): ReactElement {
  const { content, placement = 'top', children } = props;
  const tipId = useId();
  const [show, setShow] = useState(false);
  const childProps = children.props;

  const trigger = cloneElement(children, {
    'aria-describedby': show ? tipId : childProps['aria-describedby'],
    onMouseEnter: callAll(childProps.onMouseEnter, () => setShow(true)),
    onMouseLeave: callAll(childProps.onMouseLeave, () => setShow(false)),
    onFocus: callAll(childProps.onFocus, () => setShow(true)),
    onBlur: callAll(childProps.onBlur, () => setShow(false)),
  });

  return (
    <span className="sf-anchor">
      {trigger}
      <span
        role="tooltip"
        id={tipId}
        data-show={show}
        className={cn('sf-floating', `sf-floating--${placement}-center`, 'sf-tooltip')}
      >
        {content}
      </span>
    </span>
  );
}
