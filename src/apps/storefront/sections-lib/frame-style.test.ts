import { describe, expect, it } from 'vitest';
import { DEFAULT_FRAME_STYLE, frameClassName, frameInlineStyle, frameResponsiveCss, frameSelector, readFrameResponsive, readFrameStyle } from './frame-style';

describe('readFrameStyle', () => {
  it('returns defaults for missing/invalid input and only sets paddings that were given', () => {
    expect(readFrameStyle(undefined)).toBe(DEFAULT_FRAME_STYLE);
    expect(readFrameStyle('x')).toBe(DEFAULT_FRAME_STYLE);
    const s = readFrameStyle({ padding_top: '48', background: 'weird', container: 'narrow', text_align: 'center', hide_mobile: 'yes', anchor: ' my section! ', css_class: 'a b<script>' });
    expect(s.padding_top).toBe(48);
    expect(s.padding_bottom).toBeUndefined();
    expect(s.background).toBe('none');
    expect(s.container).toBe('narrow');
    expect(s.text_align).toBe('center');
    expect(s.hide_mobile).toBe(false);
    expect(s.anchor).toBe('mysection');
    expect(s.css_class).toBe('a bscript');
    expect(readFrameStyle({ padding_top: 9999, padding_bottom: -5 })).toMatchObject({ padding_top: 400, padding_bottom: 0 });
  });
});

describe('frameClassName / frameInlineStyle', () => {
  it('maps style keys to lib-frame modifiers and custom properties', () => {
    const s = readFrameStyle({ padding_top: 64, padding_bottom: 32, background: 'primary', container: 'full', text_align: 'end', hide_mobile: true, hide_desktop: true, css_class: 'promo' });
    expect(frameClassName(s)).toBe('lib-frame lib-frame--bg-primary lib-frame--full lib-frame--align-end lib-frame--hide-mobile lib-frame--hide-desktop promo');
    expect(frameInlineStyle(s)).toEqual({ '--lib-frame-pt': '64px', '--lib-frame-pb': '32px' });
    expect(frameClassName(DEFAULT_FRAME_STYLE)).toBe('lib-frame');
    expect(frameInlineStyle(DEFAULT_FRAME_STYLE)).toBeUndefined();
  });

  it('applies a custom background colour/image and refuses unsafe urls', () => {
    const ok = readFrameStyle({ background: 'custom', background_color: '#fff0e6', background_image: 'https://cdn.example.com/bg.jpg' });
    expect(frameInlineStyle(ok)).toEqual({ backgroundColor: '#fff0e6', backgroundImage: 'url("https://cdn.example.com/bg.jpg")' });
    const bad = readFrameStyle({ background: 'custom', background_image: 'javascript:alert(1)' });
    expect(frameInlineStyle(bad)).toBeUndefined();
    const quoted = readFrameStyle({ background: 'custom', background_image: '/media/a").jpg' });
    expect(frameInlineStyle(quoted)).toEqual({ backgroundImage: 'url("/media/a.jpg")' });
    // Colour/image are ignored unless background is `custom`.
    expect(frameInlineStyle(readFrameStyle({ background: 'surface', background_color: '#000' }))).toBeUndefined();
  });
});

describe('responsive paddings', () => {
  it('emits tablet/mobile media rules scoped to the section id, or nothing', () => {
    const r = readFrameResponsive({ padding_top: { tablet: 48, mobile: '24' }, padding_bottom: { mobile: 16 }, other: { mobile: 1 } });
    expect(r).toEqual({ padding_top: { tablet: 48, mobile: 24 }, padding_bottom: { mobile: 16 } });
    expect(frameResponsiveCss('hero', r)).toBe(
      '@media (max-width:1023px){[data-lib-frame="hero"]{--lib-frame-pt:48px;}}@media (max-width:767px){[data-lib-frame="hero"]{--lib-frame-pt:24px;--lib-frame-pb:16px;}}',
    );
    expect(frameResponsiveCss('hero', readFrameResponsive(undefined))).toBe('');
    // With a base style the desktop paddings move into the sheet (and are then skipped inline).
    const base = readFrameStyle({ padding_top: 96, padding_bottom: 64 });
    expect(frameResponsiveCss('hero', readFrameResponsive({ padding_top: { mobile: 16 } }), base)).toBe(
      '[data-lib-frame="hero"]{--lib-frame-pt:96px;--lib-frame-pb:64px;}@media (max-width:767px){[data-lib-frame="hero"]{--lib-frame-pt:16px;}}',
    );
    expect(frameResponsiveCss('hero', readFrameResponsive({}), base)).toBe('');
    expect(frameInlineStyle(base, false)).toBeUndefined();
    expect(frameSelector('a"b\\c')).toBe('[data-lib-frame="a\\"b\\\\c"]');
  });
});
