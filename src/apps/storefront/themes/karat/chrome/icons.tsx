/** Karat chrome icons — hairline 1.25px strokes in a 24px box. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P): P => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false, ...props });

export const IconSearch = (p: P): ReactElement => <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.6-4.6" /></svg>;
export const IconBag = (p: P): ReactElement => <svg {...base(p)}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>;
export const IconUser = (p: P): ReactElement => <svg {...base(p)}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /></svg>;
export const IconHeart = (p: P): ReactElement => <svg {...base(p)}><path d="M12 20s-7-4.4-8.9-8.8C1.8 8.1 3.6 5 6.9 5c2 0 3.4 1.1 5.1 2.9C13.7 6.1 15.1 5 17.1 5c3.3 0 5.1 3.1 3.8 6.2C19 15.6 12 20 12 20z" /></svg>;
export const IconMenu = (p: P): ReactElement => <svg {...base(p)}><path d="M3.5 8h17M3.5 16h11" /></svg>;
export const IconClose = (p: P): ReactElement => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconChevronDown = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M6 9l6 6 6-6" /></svg>;
export const IconMinus = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M5 12h14" /></svg>;
export const IconPlus = (p: P): ReactElement => <svg {...base({ width: 14, height: 14, ...p })}><path d="M12 5v14M5 12h14" /></svg>;
export const IconPhone = (p: P): ReactElement => <svg {...base({ width: 16, height: 16, ...p })}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
export const IconWhatsapp = (p: P): ReactElement => (
  <svg {...base({ width: 18, height: 18, ...p })}>
    <path d="M4.5 19.5l1.1-3.9A8 8 0 1 1 8.6 18.6z" />
    <path d="M9.2 8.6c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .4-.1.6l-.5.6c.6 1.2 1.6 2.1 2.8 2.7l.6-.6c.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5v.4c0 .4-.2.8-.6 1-1 .6-2.4.4-4.2-.9a10 10 0 0 1-2.9-3.3c-.6-1.2-.4-2.3.1-3z" />
  </svg>
);
export const IconSpark = (p: P): ReactElement => <svg {...base({ width: 12, height: 12, ...p })}><path d="M12 3l1.6 7.4L21 12l-7.4 1.6L12 21l-1.6-7.4L3 12l7.4-1.6z" /></svg>;
