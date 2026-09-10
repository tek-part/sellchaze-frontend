/**
 * `__style` / `__responsive` → CSS (contract §7). Pure and DOM-free so it is unit-tested in node;
 * `SectionFrame` is the thin React wrapper that applies the result. Every section's frame consumes
 * `--lib-frame-pt` / `--lib-frame-pb` for its block padding (see `.lib-section` in styles.css).
 */
import type { CSSProperties } from 'react';

export type FrameBackground = 'none' | 'surface' | 'primary' | 'custom';
export type FrameContainer = 'boxed' | 'narrow' | 'full';
export type FrameAlign = 'auto' | 'start' | 'center' | 'end';

export interface FrameStyle {
  readonly padding_top?: number;
  readonly padding_bottom?: number;
  readonly background: FrameBackground;
  readonly background_color: string;
  readonly background_image: string;
  readonly container: FrameContainer;
  readonly text_align: FrameAlign;
  readonly hide_mobile: boolean;
  readonly hide_desktop: boolean;
  readonly anchor: string;
  readonly css_class: string;
}

/** Per-viewport overrides of the padding fields: `{ padding_top: { tablet: 48, mobile: 32 } }`. */
export type FrameResponsive = Readonly<Record<'padding_top' | 'padding_bottom', { tablet?: number; mobile?: number }>>;

const BACKGROUNDS: ReadonlyArray<FrameBackground> = ['none', 'surface', 'primary', 'custom'];
const CONTAINERS: ReadonlyArray<FrameContainer> = ['boxed', 'narrow', 'full'];
const ALIGNS: ReadonlyArray<FrameAlign> = ['auto', 'start', 'center', 'end'];
const PAD_KEYS = ['padding_top', 'padding_bottom'] as const;
const PAD_VAR: Readonly<Record<(typeof PAD_KEYS)[number], string>> = { padding_top: '--lib-frame-pt', padding_bottom: '--lib-frame-pb' };

export const DEFAULT_FRAME_STYLE: FrameStyle = Object.freeze({
  background: 'none', background_color: '', background_image: '', container: 'boxed', text_align: 'auto',
  hide_mobile: false, hide_desktop: false, anchor: '', css_class: '',
});

function px(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.max(0, Math.min(400, Math.round(n))) : undefined;
}
function oneOf<T extends string>(value: unknown, allowed: ReadonlyArray<T>, fallback: T): T {
  return typeof value === 'string' && (allowed as ReadonlyArray<string>).includes(value) ? (value as T) : fallback;
}
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
/** Anchor ids and class names: letters, digits, `-`, `_`, separated by spaces for classes. */
function token(value: string, allowSpaces = false): string {
  return value.replace(allowSpaces ? /[^\w\s-]/g : /[^\w-]/g, '').replace(/\s+/g, ' ').trim();
}
/** A safe `url()` argument: no quotes/parens/newlines, no script schemes. */
function cssUrl(value: string): string {
  const v = value.replace(/["'()\\\n\r]/g, '');
  return /^(https?:\/\/|\/|\.\/|data:image\/)/i.test(v) ? v : '';
}

/** Fail-safe read of `settings.__style` (missing/invalid keys → defaults; paddings only when given). */
export function readFrameStyle(raw: unknown): FrameStyle {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_FRAME_STYLE;
  const s = raw as Record<string, unknown>;
  const pt = px(s['padding_top']);
  const pb = px(s['padding_bottom']);
  return {
    ...(pt !== undefined ? { padding_top: pt } : {}),
    ...(pb !== undefined ? { padding_bottom: pb } : {}),
    background: oneOf(s['background'], BACKGROUNDS, 'none'),
    background_color: text(s['background_color']),
    background_image: text(s['background_image']),
    container: oneOf(s['container'], CONTAINERS, 'boxed'),
    text_align: oneOf(s['text_align'], ALIGNS, 'auto'),
    hide_mobile: s['hide_mobile'] === true,
    hide_desktop: s['hide_desktop'] === true,
    anchor: token(text(s['anchor'])),
    css_class: token(text(s['css_class']), true),
  };
}

/** Fail-safe read of `settings.__responsive` (only the padding keys matter to the frame). */
export function readFrameResponsive(raw: unknown): FrameResponsive {
  const out: { padding_top: { tablet?: number; mobile?: number }; padding_bottom: { tablet?: number; mobile?: number } } = { padding_top: {}, padding_bottom: {} };
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const r = raw as Record<string, unknown>;
  for (const key of PAD_KEYS) {
    const entry = r[key];
    if (entry === null || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const tablet = px(e['tablet']);
    const mobile = px(e['mobile']);
    if (tablet !== undefined) out[key].tablet = tablet;
    if (mobile !== undefined) out[key].mobile = mobile;
  }
  return out;
}

/** Class list for the frame element. */
export function frameClassName(style: FrameStyle): string {
  const cls = ['lib-frame'];
  if (style.background !== 'none') cls.push(`lib-frame--bg-${style.background}`);
  if (style.container !== 'boxed') cls.push(`lib-frame--${style.container}`);
  if (style.text_align !== 'auto') cls.push(`lib-frame--align-${style.text_align}`);
  if (style.hide_mobile) cls.push('lib-frame--hide-mobile');
  if (style.hide_desktop) cls.push('lib-frame--hide-desktop');
  if (style.css_class) cls.push(style.css_class);
  return cls.join(' ');
}

/**
 * Inline style for the frame element (padding custom properties + custom background). Pass
 * `inlinePadding: false` when the paddings are emitted by `frameResponsiveCss` instead — an inline
 * custom property would otherwise beat the tablet/mobile media rules.
 */
export function frameInlineStyle(style: FrameStyle, inlinePadding = true): CSSProperties | undefined {
  const out: Record<string, string> = {};
  if (inlinePadding && style.padding_top !== undefined) out[PAD_VAR.padding_top] = `${style.padding_top}px`;
  if (inlinePadding && style.padding_bottom !== undefined) out[PAD_VAR.padding_bottom] = `${style.padding_bottom}px`;
  if (style.background === 'custom') {
    if (style.background_color) out['backgroundColor'] = style.background_color;
    const url = cssUrl(style.background_image);
    if (url) out['backgroundImage'] = `url("${url}")`;
  }
  return Object.keys(out).length > 0 ? (out as CSSProperties) : undefined;
}

/** Attribute-selector-safe section id. */
export function frameSelector(sectionId: string): string {
  return `[data-lib-frame="${sectionId.replace(/["\\]/g, '\\$&')}"]`;
}

/**
 * The per-section `<style>` text for tablet (≤1023px) / mobile (≤767px) padding overrides; empty
 * when there are none so most sections emit no style element at all. When `base` is given and
 * overrides exist, the desktop paddings are emitted in the same sheet (and must then NOT be set
 * inline, see `frameInlineStyle`) so the cascade lets the media rules win.
 */
export function frameResponsiveCss(sectionId: string, responsive: FrameResponsive, base?: FrameStyle): string {
  const sel = frameSelector(sectionId);
  const rule = (pick: (k: (typeof PAD_KEYS)[number]) => number | undefined): string => {
    const decls = PAD_KEYS.map((k) => {
      const v = pick(k);
      return v === undefined ? '' : `${PAD_VAR[k]}:${v}px;`;
    }).join('');
    return decls ? `${sel}{${decls}}` : '';
  };
  const tablet = rule((k) => responsive[k].tablet);
  const mobile = rule((k) => responsive[k].mobile);
  if (!tablet && !mobile) return '';
  const desktop = base ? rule((k) => base[k]) : '';
  return `${desktop}${tablet ? `@media (max-width:1023px){${tablet}}` : ''}${mobile ? `@media (max-width:767px){${mobile}}` : ''}`;
}
