/** Bazaar chrome icons — 1.8px strokes, 22px box. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const IconCart = (p: P): ReactElement => <svg {...base(p)}><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.5L21.5 8H6" /><circle cx="10" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IconGrid = (p: P): ReactElement => <svg {...base(p)}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconChevronEnd = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path className="bz-icon-dir" d="M9 6l6 6-6 6" /></svg>;
export const IconTrash = (p: P): ReactElement => <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconTruck = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg>;
export const IconBolt = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>;
