/** Small CSS grammar: colors and text alignment only, never arbitrary style declarations. */
export function richTextColor(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (/^#[a-f0-9]{6}$/.test(value)) return value;
  const short = value.match(/^#([a-f0-9])([a-f0-9])([a-f0-9])$/);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (rgb && rgb.slice(1).every((v) => Number(v) <= 255)) return '#' + rgb.slice(1).map((v) => Number(v).toString(16).padStart(2, '0')).join('');
  return null;
}

export function richTextStyle(input: string): string {
  const safe = new Map<string, string>();
  for (const declaration of input.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim().toLowerCase();
    if (['color', 'background-color'].includes(property)) { const color = richTextColor(value); if (color) safe.set(property, color); }
    if (property === 'text-align' && ['left', 'right', 'center', 'justify', 'start', 'end'].includes(value)) safe.set(property, value);
  }
  return [...safe].map(([key, value]) => `${key}:${value}`).join(';');
}
