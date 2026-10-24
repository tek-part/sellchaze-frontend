/** Stride chrome icons — 2px strokes, square caps, 22px box. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'square', strokeLinejoin: 'miter', 'aria-hidden': true, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.6-4.6" /></svg>;
export const IconBag = (p: P): ReactElement => <svg {...base(p)}><path d="M4 8h16l-1.2 13H5.2z" /><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 20.5s-7.5-4.6-9.5-9.3C1 7.7 3.2 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.4 0 5.6 3.2 4.1 6.7-2 4.7-9.5 9.3-9.5 9.3z" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M3 6.5h18M3 12h12M3 17.5h18" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M5.5 5.5l13 13M18.5 5.5l-13 13" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconTrash = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconBolt = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, fill: 'currentColor', stroke: 'none', ...p })}><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>;
