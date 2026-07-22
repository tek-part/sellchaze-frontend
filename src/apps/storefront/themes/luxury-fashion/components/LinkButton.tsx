/**
 * LinkButton — tertiary inline action ("View all", "Continue shopping"). Gold underline wipes
 * from the inline-start on hover/focus; the `arrow` variant nudges a thin chevron. Renders an
 * anchor when `href` is given, otherwise a button. See §32.1.
 */
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type LinkButtonVariant = 'inline' | 'arrow';

interface LinkButtonBase {
  variant?: LinkButtonVariant;
  className?: string;
  children: ReactNode;
}

type AnchorProps = LinkButtonBase &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string };
type ButtonProps = LinkButtonBase &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };

export type LinkButtonProps = AnchorProps | ButtonProps;

function Chevron(): ReactElement {
  return (
    <svg
      className="sf-link__icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path d="M5 2.5 9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function LinkButton(props: LinkButtonProps): ReactElement {
  const { variant = 'inline', className, children } = props;
  const classes = cn('sf-link', variant === 'arrow' && 'sf-link--arrow', className);
  const inner = (
    <>
      <span className="sf-link__label">{children}</span>
      {variant === 'arrow' ? <Chevron /> : null}
    </>
  );

  if (props.href !== undefined) {
    const { variant: _v, className: _c, children: _ch, ...rest } = props;
    return (
      <a className={classes} {...rest}>
        {inner}
      </a>
    );
  }
  const { variant: _v, className: _c, children: _ch, href: _h, type = 'button', ...rest } = props;
  return (
    <button className={classes} type={type} {...rest}>
      {inner}
    </button>
  );
}
