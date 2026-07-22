/**
 * Rouge line-icon set — thin, rounded (1.5px, round caps/joins), soft to match the pillowy language.
 * Includes beauty-specific glyphs (droplet, leaf, sparkle, swatch, pipette). `currentColor`; decorative
 * by default (`aria-hidden`), interactive wrappers carry labels. Rouge's own — no other theme reused.
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
      strokeWidth="1.5"
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

export const IconSearch = (p: IconProps): ReactElement => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.5-3.5" /></Svg>
);
export const IconBag = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M6 8h12l-.8 11a1 1 0 0 1-1 .9H7.8a1 1 0 0 1-1-.9L6 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></Svg>
);
export const IconUser = (p: IconProps): ReactElement => (
  <Svg {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5.5 19a6.5 6.5 0 0 1 13 0" /></Svg>
);
export const IconHeart = (p: IconProps & { filled?: boolean }): ReactElement => {
  const { filled, ...rest } = p;
  return <Svg fill={filled ? 'currentColor' : 'none'} {...rest}><path d="M12 20 4.8 12.9a4.5 4.5 0 0 1 6.4-6.3l.8.8.8-.8a4.5 4.5 0 0 1 6.4 6.3L12 20Z" /></Svg>;
};
export const IconClose = (p: IconProps): ReactElement => (<Svg {...p}><path d="m6 6 12 12M18 6 6 18" /></Svg>);
export const IconMenu = (p: IconProps): ReactElement => (<Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>);
export const IconChevronRight = (p: IconProps): ReactElement => (<Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>);
export const IconChevronLeft = (p: IconProps): ReactElement => (<Svg {...p}><path d="m15 5-7 7 7 7" /></Svg>);
export const IconChevronDown = (p: IconProps): ReactElement => (<Svg {...p}><path d="m5 9 7 7 7-7" /></Svg>);
export const IconArrowRight = (p: IconProps): ReactElement => (<Svg {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Svg>);
export const IconCheck = (p: IconProps): ReactElement => (<Svg {...p}><path d="m5 12.5 4.5 4.5L19 6.5" /></Svg>);
export const IconMinus = (p: IconProps): ReactElement => (<Svg {...p}><path d="M5 12h14" /></Svg>);
export const IconPlus = (p: IconProps): ReactElement => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>);

/* Beauty-specific glyphs */
export const IconDroplet = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M12 3.5c3 3.6 5.5 6.6 5.5 9.5a5.5 5.5 0 0 1-11 0c0-2.9 2.5-5.9 5.5-9.5Z" /></Svg>
);
export const IconLeaf = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z" /><path d="M5 19c3-4 6-6 10-8" /></Svg>
);
export const IconSparkle = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M12 3.5c.6 4 1.5 4.9 5.5 5.5-4 .6-4.9 1.5-5.5 5.5-.6-4-1.5-4.9-5.5-5.5 4-.6 4.9-1.5 5.5-5.5Z" /><path d="M18.5 15c.3 1.7.7 2.1 2.5 2.5-1.8.4-2.2.8-2.5 2.5-.3-1.7-.7-2.1-2.5-2.5 1.8-.4 2.2-.8 2.5-2.5Z" /></Svg>
);
export const IconSwatch = (p: IconProps): ReactElement => (
  <Svg {...p}><circle cx="8.5" cy="8.5" r="4" /><circle cx="15.5" cy="8.5" r="4" /><circle cx="12" cy="15" r="4" /></Svg>
);
export const IconPipette = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M4 20s2-1 3-2l7-7" /><path d="m13 5 6 6-2 2-6-6 2-2Z" /><path d="m15.5 7.5 1-1" /></Svg>
);
export const IconShare = (p: IconProps): ReactElement => (
  <Svg {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" /></Svg>
);
export const IconTruck = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="17.5" cy="17" r="1.6" /></Svg>
);
export const IconReturn = (p: IconProps): ReactElement => (
  <Svg {...p}><path d="M4 9h11a4 4 0 0 1 0 8H9" /><path d="M7 6 4 9l3 3" /></Svg>
);
export const IconStar = (p: IconProps): ReactElement => {
  const { width = '1em', height = '1em', ...rest } = p;
  return <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...rest}><path d="m12 3 2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7L12 3Z" /></svg>;
};
