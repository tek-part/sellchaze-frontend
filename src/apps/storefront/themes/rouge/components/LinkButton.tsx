/** Rouge LinkButton — tertiary inline/arrow link ("Discover", "View all"). Anchor or button. */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconArrowRight } from './icons';

interface Base { arrow?: boolean; className?: string; children: ReactNode; }
type AnchorProps = Base & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string };
type ButtonProps = Base & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };
export type LinkButtonProps = AnchorProps | ButtonProps;

export function LinkButton(props: LinkButtonProps): ReactElement {
  const { arrow = false, className, children } = props;
  const classes = cn('rge-linkbtn', className);
  const inner = (
    <>
      <span>{children}</span>
      {arrow ? <IconArrowRight className="rge-linkbtn__icon" width={16} height={16} /> : null}
    </>
  );
  if (props.href !== undefined) {
    const { arrow: _a, className: _c, children: _ch, ...rest } = props;
    return <a className={classes} {...rest}>{inner}</a>;
  }
  const { arrow: _a, className: _c, children: _ch, href: _h, type = 'button', ...rest } = props;
  return <button className={classes} type={type} {...rest}>{inner}</button>;
}
