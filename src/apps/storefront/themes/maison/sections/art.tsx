/**
 * Maison fallback art — small inline SVG compositions drawn with token colours (classes styled in
 * theme.css), shown wherever a merchant has not uploaded a photo yet: a still life for the hero, a
 * whole living room for shop-the-room (its default hotspots sit on these objects), line drawings
 * for each room tile and woven/grained swatches for the material notes. No image files.
 */
import type { ReactElement } from 'react';

const svgProps = { xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true, focusable: false } as const;

/** Hero still life: arch backdrop, low sun, vase with branches, bowl and candle on a plinth. */
export function StillLifeArt(props: { className?: string }): ReactElement {
  return (
    <svg {...svgProps} viewBox="0 0 600 750" preserveAspectRatio="xMidYMid slice" className={props.className}>
      <rect width="600" height="750" className="mai-art__wall" />
      <path d="M90 750V320a210 210 0 0 1 420 0v430z" className="mai-art__arch" />
      <circle cx="398" cy="236" r="58" className="mai-art__sun" />
      <rect x="40" y="598" width="520" height="152" className="mai-art__plinth" />
      <path d="M40 598h520" className="mai-art__edge" />
      <g className="mai-art__branch">
        <path d="M276 412c-6-70 4-130 40-190M276 412c-30-60-70-96-118-118M282 404c30-40 70-62 118-70" />
      </g>
      <g className="mai-art__leaf">
        <ellipse cx="318" cy="246" rx="16" ry="7" transform="rotate(-60 318 246)" />
        <ellipse cx="300" cy="300" rx="16" ry="7" transform="rotate(-30 300 300)" />
        <ellipse cx="196" cy="318" rx="16" ry="7" transform="rotate(30 196 318)" />
        <ellipse cx="226" cy="346" rx="14" ry="6" transform="rotate(20 226 346)" />
        <ellipse cx="372" cy="340" rx="16" ry="7" transform="rotate(-15 372 340)" />
      </g>
      <path d="M252 598c-44-34-48-120-4-158v-30h56v30c44 38 40 124-4 158z" className="mai-art__vase" />
      <path d="M252 470h52" className="mai-art__glaze" />
      <path d="M352 598a76 44 0 0 0 152 0z" className="mai-art__bowl" />
      <rect x="128" y="520" width="30" height="78" rx="4" className="mai-art__candle" />
      <path d="M143 492c10 10 10 22 0 26-10-4-10-16 0-26z" className="mai-art__flame" />
    </svg>
  );
}

/** Shop-the-room scene (3:2): arch window, sofa with cushions, floor lamp, side table + vase, rug, print. */
export function RoomSceneArt(props: { className?: string }): ReactElement {
  return (
    <svg {...svgProps} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className={props.className}>
      <rect width="1200" height="800" className="mai-art__wall" />
      <rect y="640" width="1200" height="160" className="mai-art__floor" />
      <path d="M0 640h1200" className="mai-art__edge" />
      <path d="M470 560V270a130 130 0 0 1 260 0v290z" className="mai-art__window" />
      <path d="M600 140v420M470 380h260" className="mai-art__mullion" />
      <rect x="170" y="200" width="150" height="190" rx="6" className="mai-art__frame" />
      <circle cx="245" cy="275" r="38" className="mai-art__sun" />
      <path d="M190 370l40-46 30 30 22-18 22 34z" className="mai-art__hill" />
      <ellipse cx="580" cy="722" rx="430" ry="52" className="mai-art__rug" />
      <ellipse cx="580" cy="722" rx="380" ry="38" className="mai-art__rug-line" />
      <rect x="322" y="468" width="476" height="116" rx="44" className="mai-art__sofa-back" />
      <rect x="298" y="548" width="524" height="84" rx="30" className="mai-art__sofa" />
      <rect x="272" y="512" width="74" height="120" rx="32" className="mai-art__sofa-arm" />
      <rect x="774" y="512" width="74" height="120" rx="32" className="mai-art__sofa-arm" />
      <path d="M318 632v24M802 632v24" className="mai-art__leg" />
      <rect x="388" y="492" width="108" height="78" rx="22" transform="rotate(-6 442 531)" className="mai-art__cushion" />
      <rect x="626" y="494" width="104" height="76" rx="22" transform="rotate(5 678 532)" className="mai-art__cushion-2" />
      <path d="M960 330v300" className="mai-art__pole" />
      <ellipse cx="960" cy="640" rx="46" ry="10" className="mai-art__lamp-base" />
      <path d="M896 336h128l-30-92h-68z" className="mai-art__shade" />
      <ellipse cx="160" cy="566" rx="64" ry="12" className="mai-art__table" />
      <path d="M124 570l-14 76M196 570l14 76M160 578v68" className="mai-art__leg" />
      <path d="M146 554c-18-16-18-50 2-66v-16h26v16c20 16 20 50 2 66z" className="mai-art__vase" />
      <g className="mai-art__branch">
        <path d="M160 474c-4-40 4-70 24-96M160 474c-16-30-36-48-60-58" />
      </g>
    </svg>
  );
}

export type RoomKey = 'living' | 'bedroom' | 'kitchen' | 'dining' | 'bath' | 'outdoor';

/** Line drawing for a room tile (200×160). */
export function RoomArt(props: { room: string; className?: string }): ReactElement {
  const room = props.room as RoomKey;
  return (
    <svg {...svgProps} viewBox="0 0 200 160" className={props.className}>
      <g className="mai-art__line">
        {room === 'bedroom' ? (
          <>
            <path d="M30 120V70a8 8 0 0 1 8-8h124a8 8 0 0 1 8 8v50M22 120h156M30 132v-12M170 132v-12" />
            <rect x="44" y="76" width="44" height="22" rx="10" />
            <rect x="112" y="76" width="44" height="22" rx="10" />
            <path d="M30 104h140" />
            <path d="M100 8v26M86 46a14 12 0 0 1 28 0z" />
          </>
        ) : room === 'kitchen' ? (
          <>
            <path d="M20 40h160M20 40v6M180 40v6" />
            <rect x="34" y="16" width="20" height="24" rx="4" />
            <rect x="62" y="22" width="18" height="18" rx="4" />
            <path d="M120 40V20l10-6 10 6v20" />
            <path d="M52 140h96M60 140l-6-50h92l-6 50M54 90h92M46 100h8M146 100h8M92 82h16" />
            <path d="M80 70c0-8 6-8 6-16M100 70c0-8 6-8 6-16M120 70c0-8 6-8 6-16" />
          </>
        ) : room === 'dining' ? (
          <>
            <path d="M30 96h140M44 96v44M156 96v44" />
            <path d="M100 6v30M80 52a20 16 0 0 1 40 0z" />
            <path d="M20 140V104M20 110h18v30M180 140V104M180 110h-18v30" />
            <path d="M84 88c0-10 32-10 32 0z" />
          </>
        ) : room === 'bath' ? (
          <>
            <path d="M18 86h164M28 86v18a30 30 0 0 0 30 30h84a30 30 0 0 0 30-30V86M52 134l-8 12M148 134l8 12" />
            <path d="M40 86V40a16 16 0 0 1 32 0v4M62 48h20" />
            <circle cx="120" cy="70" r="6" />
            <circle cx="138" cy="60" r="4" />
            <circle cx="104" cy="58" r="3" />
          </>
        ) : room === 'outdoor' ? (
          <>
            <circle cx="150" cy="38" r="16" />
            <path d="M150 10v6M150 60v6M122 38h6M172 38h6" />
            <path d="M40 140l8-34h40l8 34M52 106c-8-24 0-50 16-66M68 106c2-22 12-38 30-46M60 106c-14-16-30-20-44-18" />
            <path d="M120 140l14-46M134 94h40l-8 22h-44M128 116l-8 24M164 116l8 24" />
          </>
        ) : (
          <>
            <path d="M34 118V86a12 12 0 0 1 12-12h108a12 12 0 0 1 12 12v32" />
            <path d="M24 104a10 10 0 0 1 20 0v26h112v-26a10 10 0 0 1 20 0v26a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8z" />
            <path d="M40 138v10M160 138v10" />
            <rect x="58" y="84" width="34" height="24" rx="8" />
            <path d="M178 66V18M164 18h28l-6-14h-16z" />
          </>
        )}
      </g>
    </svg>
  );
}

export type MaterialKey = 'linen' | 'cotton' | 'wool' | 'ceramic' | 'wood' | 'glass' | 'brass' | 'rattan' | 'marble' | 'other';

/** Round material swatch (64×64) — woven, grained, glazed or veined, in token colours. */
export function MaterialSwatch(props: { material: string; className?: string }): ReactElement {
  const m = props.material as MaterialKey;
  return (
    <svg {...svgProps} viewBox="0 0 64 64" className={props.className}>
      <circle cx="32" cy="32" r="31" className={`mai-sw__base mai-sw__base--${m}`} />
      <g className="mai-sw__mark">
        {m === 'linen' || m === 'cotton' ? (
          <path d="M8 20h48M6 28h52M5 36h54M6 44h52M10 52h44M20 8v48M28 6v52M36 5v54M44 6v52M52 10v44" />
        ) : m === 'wool' ? (
          <path d="M12 22c6-6 12 6 18 0s12 6 18 0 6 6 6 6M8 34c6-6 12 6 18 0s12 6 18 0 12 6 12 6M12 46c6-6 12 6 18 0s12 6 18 0" />
        ) : m === 'wood' ? (
          <path d="M32 14c-14 4-18 30 0 36 18-6 14-32 0-36zM32 22c-7 3-9 17 0 20 9-3 7-17 0-20zM10 20c8 10 8 30 0 40M54 20c-8 10-8 30 0 40" />
        ) : m === 'rattan' ? (
          <path d="M4 32L32 4l28 28-28 28zM18 18l28 28M46 18L18 46M11 25l28 28M25 11l28 28M39 11L11 39M53 25L25 53" />
        ) : m === 'marble' ? (
          <path d="M6 22c14 2 18 14 30 12s16 8 22 6M14 52c8-10 18-8 22-16M40 10c-2 10 6 14 4 22" />
        ) : m === 'glass' ? (
          <path d="M20 16c-6 6-8 16-4 24M26 12c-2 2-3 3-4 5" />
        ) : m === 'brass' || m === 'ceramic' ? (
          <path d="M18 18c6-6 16-8 24-4" />
        ) : (
          <circle cx="32" cy="32" r="10" />
        )}
      </g>
    </svg>
  );
}
