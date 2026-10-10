import { describe, expect, it } from 'vitest';
import { richTextColor, richTextStyle } from './richTextFormatting';

describe('bounded rich text formatting', () => {
  it('canonicalizes browser RGB colors and short hex without expanding the CSS grammar', () => {
    expect(richTextColor('rgb(1, 2, 255)')).toBe('#0102ff');
    expect(richTextColor('#ABC')).toBe('#aabbcc');
    for (const color of ['rgb(256,0,0)', 'url(https://example.test)', 'expression(x)', 'var(--x)', '#112233;position:fixed']) expect(richTextColor(color)).toBeNull();
  });
  it('preserves color/background/alignment while stripping executable, overlay and network styles', () => {
    expect(richTextStyle('color:rgb(1,2,255);position:fixed;background-color:#abc;background-image:url(https://example.test);text-align:center;width:99999px')).toBe('color:#0102ff;background-color:#aabbcc;text-align:center');
    expect(richTextStyle('color:expression(bad());text-align:var(--x);background-color:url(x)')).toBe('');
  });
  it('supports logical RTL alignment and keeps only valid declarations', () => {
    expect(richTextStyle('text-align:start;COLOR:#fff;color:#123456;color:invalid')).toBe('text-align:start;color:#123456');
  });
});
