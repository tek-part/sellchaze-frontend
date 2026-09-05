/** Fresh chrome icons — friendly 2px rounded strokes, 22px box. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const IconBasket = (p: P): ReactElement => <svg {...base(p)}><path d="M3 10h18l-1.5 9a2 2 0 0 1-2 1.7h-11a2 2 0 0 1-2-1.7z" /><path d="M8 10l3-6M16 10l-3-6M9 14v3M12 14v3M15 14v3" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 21s-7-4.6-9.3-9.2C1.2 8.6 3 5 6.6 5c2 0 3.4 1.1 4.2 2.4C11.6 6.1 13 5 15 5c3.6 0 5.4 3.6 3.9 6.8C19 16.4 12 21 12 21z" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconTrash = (p: P): ReactElement => <svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconHome = (p: P): ReactElement => <svg {...base(p)}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>;
export const IconGrid = (p: P): ReactElement => <svg {...base(p)}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></svg>;
export const IconClock = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IconLeaf = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })}><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19c3-4 6-7 10-9" /></svg>;
export const IconPin = (p: P): ReactElement => <svg {...base({ width: 18, height: 18, ...p })}><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
