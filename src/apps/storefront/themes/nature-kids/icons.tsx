import type { ReactElement } from 'react';
export function KidsIcon({ kind }: { kind: 'menu' | 'bag' | 'search' | 'eye' | 'arrow' | 'down' }): ReactElement {
  const paths = { menu: <path d="M4 6h16M4 12h16M4 18h16" />, bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>, search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>, eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>, arrow: <path d="M4 12h16m-6-6 6 6-6 6" />, down: <path d="m6 9 6 6 6-6" /> };
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[kind]}</svg>;
}
