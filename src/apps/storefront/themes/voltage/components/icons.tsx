/**
 * Voltage line-icon set — technical, slightly angular, 1.75px strokes, `currentColor`. Distinct from
 * Theme 01's hairline set. Decorative by default (`aria-hidden`); interactive wrappers carry labels.
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
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: IconProps): ReactElement => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" /></Svg>
);
export const IconCart = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M4 5h2l1.6 10.2a1 1 0 0 0 1 .8h8.1a1 1 0 0 0 1-.8L20 8H7" /><circle cx="9.5" cy="20" r="1.2" /><circle cx="17.5" cy="20" r="1.2" /></Svg>
);
export const IconUser = (p: IconProps): ReactElement => (
  <Svg {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" /></Svg>
);
export const IconHeart = (p: IconProps & { filled?: boolean }): ReactElement => {
  const { filled, ...rest } = p;
  return <Svg fill={filled ? 'currentColor' : 'none'} {...rest}><path d="M12 20 4.5 12.6a4.6 4.6 0 0 1 6.5-6.5l1 .9 1-.9a4.6 4.6 0 0 1 6.5 6.5L12 20Z" /></Svg>;
};
export const IconCompare = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M4 7h11M4 7l3-3M4 7l3 3M20 17H9M20 17l-3-3M20 17l-3 3" /></Svg>
);
export const IconClose = (p: IconProps): ReactElement => (<Svg {...p}><path d="m6 6 12 12M18 6 6 18" /></Svg>);
export const IconMenu = (p: IconProps): ReactElement => (<Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>);
export const IconChevronRight = (p: IconProps): ReactElement => (<Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>);
export const IconChevronLeft = (p: IconProps): ReactElement => (<Svg {...p}><path d="m15 5-7 7 7 7" /></Svg>);
export const IconChevronDown = (p: IconProps): ReactElement => (<Svg {...p}><path d="m5 9 7 7 7-7" /></Svg>);
export const IconCheck = (p: IconProps): ReactElement => (<Svg {...p}><path d="m5 12.5 4.5 4.5L19 6.5" /></Svg>);
export const IconBolt = (p: IconProps): ReactElement => (<Svg {...p}><path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" /></Svg>);
export const IconStar = (p: IconProps): ReactElement => {
  const { width = '1em', height = '1em', ...rest } = p;
  return <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...rest}><path d="m12 3 2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7L12 3Z" /></svg>;
};
