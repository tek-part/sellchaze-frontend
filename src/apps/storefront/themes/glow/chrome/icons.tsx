/** Glow icons — fine 1.5px strokes, rounded joins, 22px box. Decorative (aria-hidden) by default. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>;
export const IconBag = (p: P): ReactElement => <svg {...base(p)}><path d="M5.5 8h13l-1 12.2a1 1 0 0 1-1 .8h-9a1 1 0 0 1-1-.8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 20s-7-4.4-8.6-8.7C2.2 8 4 5 7.1 5c2 0 3.3 1.1 4.9 3 1.6-1.9 2.9-3 4.9-3 3.1 0 4.9 3 3.7 6.3C19 15.6 12 20 12 20z" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M4 8h16M4 16h11" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconArrow = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })} className={['gl-arrow', p.className].filter(Boolean).join(' ')}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconCheck = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const IconTrash = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })}><path d="M5 7h14M10 11v6M14 11v6M7 7l1 13h8l1-13M9.5 7V4.5h5V7" /></svg>;
export const IconSparkle = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" /></svg>;

/* ---- vertical icons (concerns, trust, ingredients) ---- */
export const IconDrop = (p: P): ReactElement => <svg {...base(p)}><path d="M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z" /><path d="M9.2 14.6a3 3 0 0 0 2.8 2.6" /></svg>;
export const IconSpot = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="9.5" cy="10" r="1.2" /><circle cx="14.5" cy="13.5" r="1.6" /><circle cx="10.5" cy="15.5" r=".8" /></svg>;
export const IconSun = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>;
export const IconClock = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
export const IconFeather = (p: P): ReactElement => <svg {...base(p)}><path d="M19 5c-6 0-11 4.5-11 11v3" /><path d="M19 5c0 6-3.5 10-9.5 10.5M8 16l-3 3" /><path d="M12.5 8.5L8 13" /></svg>;
export const IconLeaf = (p: P): ReactElement => <svg {...base(p)}><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" /><path d="M5 19l7-7" /></svg>;
export const IconShield = (p: P): ReactElement => <svg {...base(p)}><path d="M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z" /><path d="M9 12l2 2 4-4" /></svg>;
export const IconRabbit = (p: P): ReactElement => <svg {...base(p)}><path d="M9 10.5C8 7 8 3.5 9.5 3.5S11.2 7 11 10" /><path d="M13 10c-.2-3 .4-6.5 1.8-6.5S16 7 15 10.5" /><path d="M6.5 15.5a5.5 5 0 0 1 11 0c0 2.8-2.5 4.5-5.5 4.5s-5.5-1.7-5.5-4.5z" /><circle cx="10" cy="15" r=".5" fill="currentColor" /><circle cx="14" cy="15" r=".5" fill="currentColor" /></svg>;
export const IconFlask = (p: P): ReactElement => <svg {...base(p)}><path d="M9.5 3.5h5M10 3.5v6L5.2 17.8A2 2 0 0 0 7 20.5h10a2 2 0 0 0 1.8-2.7L14 9.5v-6" /><path d="M7.5 14.5h9" /></svg>;
export const IconSeal = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="10" r="6" /><path d="M9 15.2L8 21l4-2 4 2-1-5.8" /><path d="M9.8 10l1.5 1.5 3-3" /></svg>;
export const IconCrescent = (p: P): ReactElement => <svg {...base(p)}><path d="M16.5 4.5A8 8 0 1 0 19.5 16 6.5 6.5 0 0 1 16.5 4.5z" /></svg>;
export const IconCash = (p: P): ReactElement => <svg {...base(p)}><rect x="3" y="6.5" width="18" height="11" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 9.5v.01M17.5 14.5v.01" /></svg>;
export const IconTruck = (p: P): ReactElement => <svg {...base(p)}><path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>;
export const IconGift = (p: P): ReactElement => <svg {...base(p)}><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S9 9 12 9zM12 9c2-4 6-4 6-1.5S15 9 12 9z" /></svg>;

export const CONCERN_ICONS = {
  drop: IconDrop,
  spot: IconSpot,
  sun: IconSun,
  sparkle: (p: P): ReactElement => <IconSparkle width={22} height={22} {...p} />,
  clock: IconClock,
  feather: IconFeather,
  leaf: IconLeaf,
  shield: IconShield,
  flask: IconFlask,
  moon: IconCrescent,
} as const;

export type ConcernIcon = keyof typeof CONCERN_ICONS;

export const CONCERN_ICON_OPTIONS: ReadonlyArray<{ value: ConcernIcon; label: string }> = [
  { value: 'drop', label: 'Droplet (hydration)' },
  { value: 'spot', label: 'Spots (blemishes)' },
  { value: 'sparkle', label: 'Sparkle (glow)' },
  { value: 'sun', label: 'Sun (protection)' },
  { value: 'clock', label: 'Clock (ageing)' },
  { value: 'feather', label: 'Feather (sensitive)' },
  { value: 'leaf', label: 'Leaf (natural)' },
  { value: 'shield', label: 'Shield (barrier)' },
  { value: 'flask', label: 'Flask (actives)' },
  { value: 'moon', label: 'Moon (night care)' },
];

export function ConcernGlyph(props: { name: string } & P): ReactElement {
  const { name, ...rest } = props;
  const Icon = (CONCERN_ICONS as Record<string, (p: P) => ReactElement>)[name] ?? IconSparkle;
  return <Icon {...rest} />;
}
