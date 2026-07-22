/**
 * Typography primitives — Eyebrow (tracked-caps label), Heading (serif display) and Text (sans
 * body). Size maps to a `--fs-*` token; the semantic tag is chosen separately via `as`, so visual
 * scale and document outline stay independent (accessibility). Serif carries emotion, sans carries
 * function. See 01-visual-identity / 02-design-tokens.
 */
import type { CSSProperties, ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

type FontSize = '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'base' | 'sm' | 'xs';

function sizeStyle(size: FontSize | undefined, base?: CSSProperties): CSSProperties | undefined {
  if (!size) return base;
  return { ...base, fontSize: `var(--fs-${size})` };
}

/* ---------------------------------------------------------------------------- Eyebrow */
export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}
export function Eyebrow(props: EyebrowProps): ReactElement {
  const { as: Tag = 'span', className, children, ...rest } = props;
  return (
    <Tag className={cn('sf-eyebrow', className)} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------------------- Heading */
export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level — chosen for document structure, independent of visual `size`. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: FontSize;
  children: ReactNode;
}
export function Heading(props: HeadingProps): ReactElement {
  const { as: Tag = 'h2', size, className, style, children, ...rest } = props;
  return (
    <Tag className={cn('sf-heading', className)} style={sizeStyle(size, style)} {...rest}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------------------- Text */
export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: FontSize;
  /** Muted secondary colour (`--muted`). */
  muted?: boolean;
  children: ReactNode;
}
export function Text(props: TextProps): ReactElement {
  const { as: Tag = 'p', size, muted = false, className, style, children, ...rest } = props;
  return (
    <Tag
      className={cn('sf-text', muted && 'sf-text--muted', className)}
      style={sizeStyle(size, style)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
