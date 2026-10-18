import type { ReactElement } from 'react';
export function HypeIcon({ kind }: { kind: 'bag' | 'search' | 'menu' | 'heart' | 'eye' | 'arrow' | 'cart' }): ReactElement {
  const paths = {
    bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></>,
    search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    cart: <><path d="M2 3h3l3 13h11l3-10H6" /><circle cx="10" cy="21" r="1" /><circle cx="18" cy="21" r="1" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[kind]}</svg>;
}
