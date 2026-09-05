/** Techno chrome icons — 1.75px technical strokes, 22px box. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const IconCart = (p: P): ReactElement => <svg {...base(p)}><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.4a1 1 0 0 0 1-.8L21 8H6.5" /><circle cx="9.5" cy="20" r="1.2" /><circle cx="17.5" cy="20" r="1.2" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" /></svg>;
export const IconCompare = (p: P): ReactElement => <svg {...base(p)}><path d="M9 3v18M15 3v18" /><path d="M4 8l5-5 5 5M10 16l5 5 5-5" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IconGrid = (p: P): ReactElement => <svg {...base(p)}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconTrash = (p: P): ReactElement => <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconPhone = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
export const IconBolt = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, fill: 'currentColor', stroke: 'none', ...p })}><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>;
