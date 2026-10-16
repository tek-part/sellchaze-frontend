import { describe, expect, it } from 'vitest';
import { pageViewportCss } from './viewport-css';

describe('native page viewport CSS', () => {
  it('selects media branches against the page rather than the fragment width', () => {
    const css = '@media (min-width:1200px){h1{font-size:80px}}@media (max-width:1200px){h1{font-size:50px}}';
    const desktop = pageViewportCss(css, 1920, 975, q => q.includes('min-width'));
    expect(desktop.css).toBe('h1{font-size:80px}'); expect(desktop.queries).toHaveLength(2);
    expect(pageViewportCss(css, 390, 844, q => q.includes('max-width')).css).toBe('h1{font-size:50px}');
  });
  it('handles nested groups and media after declarations without losing ordinary rules', () => {
    const css = '@layer native{@supports(display:grid){.box{color:red;/* own */ @media (min-width:1200px){width:75vw}border:0}}}';
    expect(pageViewportCss(css, 1920, 975, () => true).css).toBe('@layer native{@supports(display:grid){.box{color:red;width:1440px;border:0}}}');
    expect(pageViewportCss(css, 390, 844, () => false).css).toBe('@layer native{@supports(display:grid){.box{color:red;border:0}}}');
  });
  it('leaves quoted content, comments, URLs and identifiers opaque while converting viewport dimensions', () => {
    const css = '/* 50vw } */ .item-50vw,.عرض50vw{content:"@media (x){50vh}";background:url(asset-50vw.svg);mask:url("data:image/svg+xml,{50vh}");width:calc(100vw - 30px);margin:-2.5vh}';
    const out = pageViewportCss(css, 1920, 1000, () => true).css;
    expect(out).toContain('/* 50vw } */ .item-50vw,.عرض50vw'); expect(out).toContain('content:"@media (x){50vh}"'); expect(out).toContain('url(asset-50vw.svg)'); expect(out).toContain('url("data:image/svg+xml,{50vh}")'); expect(out).toContain('calc(1920px - 30px)'); expect(out).toContain('margin:-25px');
  });
  it('keeps viewport height independent of a long fragment and supports dynamic/min/max units', () => {
    expect(pageViewportCss('.x{height:70vh;width:75vw;padding:2vmin;margin:1vmax;max-height:90dvh;min-height:1svh}', 1920, 900, () => true).css).toBe('.x{height:630px;width:1440px;padding:18px;margin:19.2px;max-height:810px;min-height:9px}');
  });
  it('preserves imports, font declarations and custom token blocks', () => {
    const css = '@import url("https://fonts.googleapis.com/css2?family=Own");@font-face{font-family:Own;src:url("/own.woff2")} .x{--tokens:{@media(fake){a:b}};color:#123456}';
    expect(pageViewportCss(css, 1920, 975, () => false).css).toBe(css);
  });
  it('can retain fragment-width media while fixing viewport units to the simulated phone screen', () => {
    expect(pageViewportCss('@media(max-width:1200px){h1{font-size:50px;max-height:70vh;width:50vw}}',390,844,()=>null).css).toBe('@media(max-width:1200px){h1{font-size:50px;max-height:590.8px;width:195px}}');
  });
  it('does not crash or repair incomplete and deeply nested input', () => {
    const incomplete = '@media (min-width:1200px){h1{color:red';
    expect(pageViewportCss(incomplete, 1920, 975, () => true).css).toBe(incomplete);
    const deep = '@supports(display:block){'.repeat(200) + '.x{color:red}' + '}'.repeat(200);
    expect(pageViewportCss(deep, 1920, 975, () => true).css).toBe(deep);
  });
});
