/**
 * Rouge typography — Eyebrow (uppercase, gilt rule + tracked, the recurring structural label),
 * Heading (didone display), Text (humanist body), Script (gilt flourish, ≤2% use). Size maps to a
 * `--fs-*` token; the semantic tag is chosen via `as` (visual scale ≠ document outline).
 */
import type { CSSProperties, ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

type FontSize = '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'base' | 'sm' | 'xs';

function sizeStyle(size: FontSize | undefined, base?: CSSProperties): CSSProperties | undefined {
  if (!size) return base;
  return { ...base, fontSize: `var(--fs-${size})` };
}

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Hide the leading gilt rule. */
  bare?: boolean;
  children: ReactNode;
}
export function Eyebrow(props: EyebrowProps): ReactElement {
  const { as: Tag = 'span', bare = false, className, children, ...rest } = props;
  return <Tag className={cn('rge-eyebrow', bare && 'rge-eyebrow--bare', className)} {...rest}>{children}</Tag>;
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: FontSize;
  children: ReactNode;
}
export function Heading(props: HeadingProps): ReactElement {
  const { as: Tag = 'h2', size, className, style, children, ...rest } = props;
  return <Tag className={cn('rge-heading', className)} style={sizeStyle(size, style)} {...rest}>{children}</Tag>;
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: FontSize;
  muted?: boolean;
  children: ReactNode;
}
export function Text(props: TextProps): ReactElement {
  const { as: Tag = 'p', size, muted = false, className, style, children, ...rest } = props;
  return (
    <Tag className={cn('rge-text', muted && 'rge-text--muted', className)} style={sizeStyle(size, style)} {...rest}>
      {children}
    </Tag>
  );
}

export interface ScriptProps extends HTMLAttributes<HTMLElement> { as?: ElementType; gilt?: boolean; children: ReactNode; }
export function Script(props: ScriptProps): ReactElement {
  const { as: Tag = 'span', gilt = false, className, children, ...rest } = props;
  return <Tag className={cn('rge-script', gilt && 'rge-gilt', className)} {...rest}>{children}</Tag>;
}
