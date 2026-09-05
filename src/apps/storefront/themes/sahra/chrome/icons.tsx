/** Sahra chrome icons — hairline 1.5px strokes, 22px box. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const IconBag = (p: P): ReactElement => <svg {...base(p)}><path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M4 8h16M4 16h16" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconTrash = (p: P): ReactElement => <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconArrow = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M4 12h16M14 6l6 6-6 6" /></svg>;
