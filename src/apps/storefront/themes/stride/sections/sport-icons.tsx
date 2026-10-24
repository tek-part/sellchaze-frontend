/** Stride sport glyphs — 2px strokes on a 24px box, drawn for the shop-by-sport tiles and kit slots. */
import type { ReactElement, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P): P => ({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, ...p });

const GLYPHS: Readonly<Record<string, (p: P) => ReactElement>> = {
  running: (p) => <svg {...base(p)}><path d="M2.5 18.5h19v.8a1.2 1.2 0 0 1-1.2 1.2H3.7a1.2 1.2 0 0 1-1.2-1.2z" /><path d="M2.5 18.5V11l4-1.2 3.2 3.2h3.1l6.4 2.1c1.6.5 2.3 1.6 2.3 3.4" /><path d="M8.6 11.2l1.6-1.5M10.9 12.4l1.6-1.5" /></svg>,
  gym: (p) => <svg {...base(p)}><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></svg>,
  football: (p) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7.6l3.7 2.7-1.4 4.4H9.7l-1.4-4.4z" /><path d="M12 3v4.6M20.6 9.4l-4.9.9M17.4 19.2l-3.1-4.5M6.6 19.2l3.1-4.5M3.4 9.4l4.9.9" /></svg>,
  basketball: (p) => <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3v18" /><path d="M5.7 5.7a9 9 0 0 1 0 12.6M18.3 5.7a9 9 0 0 0 0 12.6" /></svg>,
  racket: (p) => <svg {...base(p)}><circle cx="9.5" cy="9.5" r="6" /><path d="M13.8 13.8L20.5 20.5" /><path d="M5.6 7.6l5.8 5.8M7.6 5.6l5.8 5.8M5 10.5l3.5-3.5M8.5 14l5.5-5.5" /><circle cx="19" cy="5" r="1.6" /></svg>,
  cycling: (p) => <svg {...base(p)}><circle cx="5.5" cy="16.5" r="3.8" /><circle cx="18.5" cy="16.5" r="3.8" /><path d="M5.5 16.5L9.4 9h5.4l3.7 7.5M9.4 9l3.4 7.5H5.5M13.5 5.5h3" /></svg>,
  yoga: (p) => <svg {...base(p)}><circle cx="12" cy="4.8" r="2" /><path d="M12 8v6M4.5 10.5l7.5 3.5 7.5-3.5M6.5 20.5l5.5-6.5 5.5 6.5" /></svg>,
  swimming: (p) => <svg {...base(p)}><circle cx="17" cy="6" r="2" /><path d="M2.5 18c1.6 1.3 3.2 1.3 4.8 0s3.2-1.3 4.8 0 3.2 1.3 4.8 0 3.2-1.3 4.6 0M2.5 14c1.6 1.3 3.2 1.3 4.8 0s3.2-1.3 4.8 0 3.2 1.3 4.8 0 3.2-1.3 4.6 0M6 11l4.5-4.3 3.5 3.3" /></svg>,
  training: (p) => <svg {...base(p)}><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.6 2.4M10 2.5h4M12 2.5V6M18.2 6.6l1.6-1.6" /></svg>,
  outdoor: (p) => <svg {...base(p)}><path d="M2.5 20.5l6.8-11.5 4.2 6.8 2.6-4.2 5.4 8.9z" /><path d="M7.6 12l1.7 1.1 1.7-1.1" /></svg>,
  supplements: (p) => <svg {...base(p)}><path d="M7.5 7h9l-1.2 14H8.7z" /><path d="M9 7V3.5h6V7M8.2 11.5h7.6" /></svg>,
  socks: (p) => <svg {...base(p)}><path d="M9 2.5h7v9.2l-5.6 7.6a3.2 3.2 0 0 1-5.1-3.8L9 11.5z" /><path d="M9 6h7" /></svg>,
  bag: (p) => <svg {...base(p)}><path d="M3.5 9h17l-1.5 11.5H5z" /><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9M3.5 13h17" /></svg>,
};

export const SPORT_ICON_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'running', label: 'Running shoe' },
  { value: 'gym', label: 'Gym / dumbbell' },
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'racket', label: 'Tennis / padel' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'training', label: 'Training / stopwatch' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'supplements', label: 'Supplements / shaker' },
  { value: 'socks', label: 'Socks' },
  { value: 'bag', label: 'Bag' },
];

export function SportIcon(props: { name: string } & P): ReactElement {
  const { name, ...rest } = props;
  const Glyph = GLYPHS[name] ?? GLYPHS['training']!;
  return <Glyph {...rest} />;
}
