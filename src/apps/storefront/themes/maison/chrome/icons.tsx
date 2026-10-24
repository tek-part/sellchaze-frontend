/** Maison chrome icons — fine 1.5px strokes with rounded joins, 22px box. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>;
export const IconBag = (p: P): ReactElement => <svg {...base(p)}><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 20s-7-4.4-8.6-8.8C2.3 8 4.2 5 7.3 5c1.9 0 3.3 1 4.7 2.8C13.4 6 14.8 5 16.7 5c3.1 0 5 3 3.9 6.2C19 15.6 12 20 12 20z" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M4 8h16M4 16h11" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconTrash = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })}><path d="M5 7h14M10 11v6M14 11v6M7 7l.8 12.2A2 2 0 0 0 9.8 21h4.4a2 2 0 0 0 2-1.8L17 7M9.5 7V4.5h5V7" /></svg>;
export const IconArrow = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })} className={['mai-arrow', p.className].filter(Boolean).join(' ')}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconLeaf = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19l7-7" /></svg>;
