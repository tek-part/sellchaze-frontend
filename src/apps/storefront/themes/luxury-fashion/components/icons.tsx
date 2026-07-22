/**
 * Line-icon set — thin 1.25–1.5px strokes, `currentColor`, square viewBox. The theme's chrome and
 * commerce controls draw from here so stroke weight and metrics stay consistent. Icons inherit
 * size from the `width`/`height` (default `1em`), so callers size them with font-size or explicit
 * props. Decorative by default (`aria-hidden`); the interactive wrapper carries the label.
 */
import type { ReactElement, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

function Svg(props: IconProps & { children: ReactElement | ReactElement[] }): ReactElement {
  const { children, width = '1em', height = '1em', ...rest } = props;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </Svg>
  );
}

export function IconBag(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </Svg>
  );
}

export function IconUser(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </Svg>
  );
}

export function IconClose(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconMenu(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function IconChevronRight(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m9 5 7 7-7 7" />
    </Svg>
  );
}

export function IconChevronLeft(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m15 5-7 7 7 7" />
    </Svg>
  );
}

export function IconCheck(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </Svg>
  );
}

export function IconChevronDown(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m5 9 7 7 7-7" />
    </Svg>
  );
}

export function IconCompare(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M12 4v16M7 8 4 14h6L7 8ZM17 8l-3 6h6l-3-6ZM6 20h12" />
    </Svg>
  );
}

export function IconShare(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="m8.1 10.9 7.8-3.8M8.1 13.1l7.8 3.8" />
    </Svg>
  );
}

/** Heart — outline at rest, solid when `filled` (the one duotone icon the theme allows). */
export function IconHeart(props: IconProps & { filled?: boolean }): ReactElement {
  const { filled = false, ...rest } = props;
  return (
    <Svg fill={filled ? 'currentColor' : 'none'} {...rest}>
      <path d="M12 20.5 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13L12 20.5Z" />
    </Svg>
  );
}

/** Star — solid path; fill colour is set by the parent (`currentColor`). */
export function IconStar(props: IconProps): ReactElement {
  const { width = '1em', height = '1em', ...rest } = props;
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...rest}>
      <path d="m12 3 2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7L12 3Z" />
    </svg>
  );
}
