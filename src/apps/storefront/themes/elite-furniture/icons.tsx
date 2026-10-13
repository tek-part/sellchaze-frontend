import type { ReactElement } from 'react';
export function EliteIcon({ kind }: { kind: 'menu' | 'search' | 'bag' | 'down' | 'arrow' | 'minus' | 'plus' | 'trash' }): ReactElement {
  const shapes = { menu: <path d="M3 6h18M3 12h18M3 18h18" />, search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>, bag: <><path d="m3 9 4 11h10l4-11H3Z" /><path d="m7 9 3-6h4l3 6" /></>, down: <path d="m7 10 5 5 5-5" />, arrow: <path d="M4 12h16m-6-6 6 6-6 6" />, minus: <path d="M5 12h14" />, plus: <path d="M5 12h14M12 5v14" />, trash: <><path d="M4 7h16M6 7l1 14h10l1-14M9 7V4h6v3M10 11v6M14 11v6" /></> };
  return <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{shapes[kind]}</svg>;
}
