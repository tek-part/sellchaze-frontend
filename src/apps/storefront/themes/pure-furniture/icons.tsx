import type { ReactElement } from 'react';
export function PureIcon({ kind }: { kind: 'bag' | 'search' | 'menu' | 'plus' | 'minus' | 'trash' | 'arrow' }): ReactElement {
  const paths = { bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>, search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>, menu: <path d="M3 6h18M3 12h18M3 18h18" />, plus: <path d="M12 5v14M5 12h14" />, minus: <path d="M5 12h14" />, trash: <><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /></>, arrow: <path d="M4 12h16m-6-6 6 6-6 6" /> };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[kind]}</svg>;
}
