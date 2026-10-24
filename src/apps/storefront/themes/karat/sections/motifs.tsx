/**
 * Karat line-art motifs — fine single-weight drawings used wherever a merchant has not uploaded an
 * image (hero arch, metal tiles, concierge), so every section reads as a finished composition. Pure
 * SVG in `currentColor`; decorative (aria-hidden).
 */
import type { ReactElement } from 'react';

export type MotifKind = 'diamond' | 'ring' | 'pearl' | 'chain' | 'watch' | 'gem' | 'hallmark';

const COMMON = { fill: 'none', stroke: 'currentColor', strokeWidth: 0.9, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' } as const;

export function Motif(props: { kind: MotifKind; className?: string }): ReactElement {
  const { kind, className } = props;
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden focusable="false">
      {kind === 'diamond' ? (
        <g {...COMMON}>
          <path d="M30 44 L44 28 H76 L90 44 L60 94 Z" />
          <path d="M30 44 H90 M44 28 L52 44 L60 28 L68 44 L76 28 M52 44 L60 94 L68 44" />
        </g>
      ) : null}
      {kind === 'ring' ? (
        <g {...COMMON}>
          <ellipse cx="60" cy="72" rx="28" ry="28" />
          <ellipse cx="60" cy="72" rx="23" ry="23" />
          <path d="M50 44 L54 36 H66 L70 44 L60 52 Z M50 44 H70 M54 36 L58 44 M66 36 L62 44" />
        </g>
      ) : null}
      {kind === 'pearl' ? (
        <g {...COMMON}>
          {Array.from({ length: 11 }, (_, i) => {
            const t = i / 10;
            const u = 1 - t;
            const x = 22 * u * u * u + 102 * u * u * t + 258 * u * t * t + 98 * t * t * t;
            const y = 34 + 90 * t * u;
            return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.4" />;
          })}
          <path d="M60 60 V70" />
          <circle cx="60" cy="78" r="8" />
          <path d="M56.5 74.5 a4 4 0 0 1 4.5 -1.2" />
        </g>
      ) : null}
      {kind === 'chain' ? (
        <g {...COMMON}>
          <path d="M20 40 C34 70 86 70 100 40" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const t = (i + 0.5) / 7;
            const u = 1 - t;
            const x = 20 * u * u * u + 102 * u * u * t + 258 * u * t * t + 100 * t * t * t;
            const y = 40 + 90 * t * u;
            return <ellipse key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} rx="4.6" ry="2.8" transform={`rotate(${((t - 0.5) * -60).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`} />;
          })}
          <path d="M60 62.5 V72 M60 72 L53 81 L60 94 L67 81 Z M53 81 H67" />
        </g>
      ) : null}
      {kind === 'watch' ? (
        <g {...COMMON}>
          <path d="M48 22 H72 L70 36 M50 36 L48 22 M48 98 H72 L70 84 M50 84 L48 98" />
          <circle cx="60" cy="60" r="25" />
          <circle cx="60" cy="60" r="20" />
          <path d="M60 46 V60 L69 66 M85 60 H89" />
        </g>
      ) : null}
      {kind === 'gem' ? (
        <g {...COMMON}>
          <path d="M60 22 L88 42 L80 86 H40 L32 42 Z" />
          <path d="M60 22 L60 86 M32 42 L80 86 M88 42 L40 86 M46 52 H74" />
        </g>
      ) : null}
      {kind === 'hallmark' ? (
        <g {...COMMON}>
          <rect x="24" y="40" width="72" height="40" rx="6" />
          <rect x="29" y="45" width="62" height="30" rx="3" />
        </g>
      ) : null}
    </svg>
  );
}
