/** Resolve native fragment CSS against its page viewport without adopting merchant styles. */
export function pageViewportCss(css: string, width: number, height: number, matches: (query: string) => boolean | null): { css: string; queries: string[] } {
  const queries = new Set<string>();
  const boundary = (text: string, from: number, close = false): number => {
    let quote = '', comment = false, parentheses = 0, brackets = 0, depth = 1;
    for (let i = from; i < text.length; i++) {
      const c = text[i], next = text[i + 1];
      if (comment) { if (c === '*' && next === '/') { comment = false; i++; } continue; }
      if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
      if (c === '/' && next === '*') { comment = true; i++; continue; }
      if (c === '\\') { i++; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === '(') parentheses++; else if (c === ')') parentheses = Math.max(0, parentheses - 1);
      if (c === '[') brackets++; else if (c === ']') brackets = Math.max(0, brackets - 1);
      if (parentheses || brackets) continue;
      if (close) { if (c === '{') depth++; if (c === '}' && --depth === 0) return i; }
      else if (c === '{' || c === ';') return i;
    }
    return text.length;
  };
  const resolve = (text: string, depth: number, declarations = false): string => {
    if (depth > 64) return text;
    let out = '', start = 0;
    while (start < text.length) {
      const end = boundary(text, start);
      if (end === text.length) return out + text.slice(start);
      if (text[end] === ';') { out += text.slice(start, end + 1); start = end + 1; continue; }
      const close = boundary(text, end + 1, true);
      if (close === text.length) return out + text.slice(start);
      const header = text.slice(start, end), body = text.slice(end + 1, close);
      const query = /^\s*@media\b([\s\S]*)$/i.exec(header.replace(/\/\*[\s\S]*?\*\//g, ' '));
      if (query) {
        const condition = (query[1] ?? '').trim(); queries.add(condition);
        const selected = matches(condition);
        if(selected===null)out+=header+'{'+resolve(body,depth+1,declarations)+'}';
        else if (selected) {
          const resolved = resolve(body, depth + 1, declarations);
          out += resolved + (declarations && resolved.trim() && !resolved.trimEnd().endsWith(';') ? ';' : '');
        }
      } else {
        const cleanHeader = header.replace(/\/\*[\s\S]*?\*\//g, ' ').trim();
        const childDeclarations = !cleanHeader.startsWith('@') || /^@(font-face|page|property)\b/i.test(cleanHeader) || declarations && !/^@(?:-\w+-)?keyframes\b/i.test(cleanHeader);
        out += header + '{' + (/^\s*--[\w-]+\s*:/.test(header) ? body : resolve(body, depth + 1, childDeclarations)) + '}';
      }
      start = close + 1;
    }
    return out;
  };
  const selected = resolve(css, 0);
  let out = '', quote = '', comment = false, urlDepth = 0;
  const dimensions: Record<string, number> = { vw: width, vh: height, vmin: Math.min(width, height), vmax: Math.max(width, height), svw: width, lvw: width, dvw: width, svh: height, lvh: height, dvh: height };
  for (let i = 0; i < selected.length; i++) {
    const c = selected[i], next = selected[i + 1];
    if (comment) { out += c; if (c === '*' && next === '/') { out += next; i++; comment = false; } continue; }
    if (quote) { out += c; if (c === '\\' && next) { out += next; i++; } else if (c === quote) quote = ''; continue; }
    if (c === '/' && next === '*') { out += '/*'; i++; comment = true; continue; }
    if (c === '"' || c === "'") { quote = c; out += c; continue; }
    if (c === '\\') { out += c + (next ?? ''); i++; continue; }
    if (!urlDepth && /^url\(/i.test(selected.slice(i, i + 4))) { out += selected.slice(i, i + 4); i += 3; urlDepth = 1; continue; }
    if (urlDepth) { if (c === '(') urlDepth++; else if (c === ')') urlDepth--; out += c; continue; }
    const unit = !/[\w\u0080-\uFFFF-]/.test(selected[i - 1] ?? '') ? /^([+-]?(?:\d*\.\d+|\d+\.?\d*))(dvw|dvh|svw|svh|lvw|lvh|vmin|vmax|vw|vh)\b/i.exec(selected.slice(i)) : null;
    const dimension = unit ? dimensions[unit[2]!.toLowerCase()] : undefined;
    if (unit && dimension !== undefined && Number.isFinite(dimension)) { out += Number((Number(unit[1]) * dimension / 100).toFixed(5)) + 'px'; i += unit[0].length - 1; }
    else out += c;
  }
  return { css: out, queries: [...queries] };
}
