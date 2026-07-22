/**
 * Hearth icon set — soft line icons, 2px stroke, rounded caps/joins on a 24px grid, matched to the
 * large radii and warm type. `currentColor` only (never multi-colour). Each icon is decorative by
 * default (`aria-hidden`); the composing control carries the accessible label.
 */
import type { ReactElement, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg(props: IconProps & { children: ReactElement | ReactElement[] }): ReactElement {
  const { children, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
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

export function SearchIcon(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </Svg>
  );
}

export function CartIcon(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M6 7h13l-1.2 8.5a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 4H3" />
      <circle cx="9.5" cy="20" r="1.1" />
      <circle cx="16" cy="20" r="1.1" />
    </Svg>
  );
}

export function HeartIcon(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M12 20s-7-4.4-9-9a4.6 4.6 0 0 1 9-1.4A4.6 4.6 0 0 1 21 11c-2 4.6-9 9-9 9Z" />
    </Svg>
  );
}

export function UserIcon(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Svg>
  );
}

export function MenuIcon(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps): ReactElement {
  return (
    <Svg {...props}>
      <path d="m9 5 7 7-7 7" />
    </Svg>
  );
}
