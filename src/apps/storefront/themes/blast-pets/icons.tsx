import type { ReactElement } from 'react';
export function PetIcon({ kind }: { kind: 'menu' | 'search' | 'cart' | 'arrow' | 'close' }): ReactElement {
  return <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{kind === 'menu' ? <path d="M3 6h18M3 12h18M3 18h18" /> : kind === 'search' ? <><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></> : kind === 'cart' ? <><path d="M2 3h3l3 13h11l3-10H6M9 20h.01M18 20h.01" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></> : kind === 'close' ? <path d="m5 5 14 14M19 5 5 19" /> : <path d="M4 12h16m-6-6 6 6-6 6" />}</svg>;
}
