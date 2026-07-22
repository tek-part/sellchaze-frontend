/**
 * Typography primitives — SectionLabel (small serif label + rule, Hearth's section marker),
 * Heading (warm humanist serif display) and Text (soft sans body). Visual scale (`--fs-*`) is
 * chosen separately from the semantic tag (`as`), so scale and document outline stay independent
 * (accessibility). Serif carries emotion, sans carries function.
 */
import type { CSSProperties, ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

type FontSize = '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'base' | 'sm' | 'xs';

function sizeStyle(size: FontSize | undefined, base?: CSSProperties): CSSProperties | undefined {
  if (!size) return base;
  return { ...base, fontSize: `var(--fs-${size})` };
}

/* --------------------------------------------------------------------------- SectionLabel */
export interface SectionLabelProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}
export function SectionLabel(props: SectionLabelProps): ReactElement {
  const { as: Tag = 'span', className, children, ...rest } = props;
  return (
    <Tag className={cn('hh-label', className)} {...rest}>
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
    <Tag className={cn('hh-heading', className)} style={sizeStyle(size, style)} {...rest}>
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
      className={cn('hh-text', muted && 'hh-text--muted', className)}
      style={sizeStyle(size, style)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
