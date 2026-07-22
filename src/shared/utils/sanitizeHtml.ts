/**
 * sanitizeHtml — a conservative, allowlist HTML sanitiser for untrusted rich text (merchant-authored
 * product descriptions, rich-text blocks) rendered via `dangerouslySetInnerHTML`.
 *
 * Threat: stored XSS. A store's product/page content is authored in the admin and rendered into
 * SHOPPERS' browsers, so a malicious/compromised author could inject `<script>`, `onerror=…`, or
 * `javascript:` URLs. This strips all of that while preserving safe formatting.
 *
 * Approach: parse with the browser's `DOMParser` (robust against the parser-differential tricks that
 * defeat regex sanitisers) and rebuild an allowlisted tree. In a non-DOM environment (SSR / worker)
 * it falls back to stripping ALL tags to text — never renders unsafe markup. This is a defence-in-
 * depth control; server-side sanitisation on write remains the primary line (see docs/security).
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'span', 'div',
  'strong', 'b', 'em', 'i', 'u', 's', 'small', 'mark', 'sub', 'sup',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'a', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
]);

/** Attributes allowed per-tag. Everything else (notably all `on*` handlers) is dropped. */
const ALLOWED_ATTRS: Readonly<Record<string, ReadonlyArray<string>>> = {
  a: ['href', 'title', 'target', 'rel'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
};

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#|\.\/|\.\.\/)/i;

/**
 * Non-DOM fallback: remove tags AND escape any remaining angle brackets so the result is inert when
 * assigned as innerHTML. It must NEVER decode entities (that could reintroduce `<script>`/`<img
 * onerror>` from an entity-encoded payload).
 */
function stripToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeNode(node: Node, doc: Document): Node | null {
  if (node.nodeType === 3 /* text */) return doc.createTextNode(node.textContent ?? '');
  if (node.nodeType !== 1 /* element */) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    // Drop the element but keep its (sanitised) text/children — e.g. an unknown wrapper.
    const frag = doc.createElement('span');
    for (const child of Array.from(el.childNodes)) {
      const clean = sanitizeNode(child, doc);
      if (clean) frag.appendChild(clean);
    }
    return frag.childNodes.length > 0 ? frag : null;
  }

  const clean = doc.createElement(tag);
  const allowed = ALLOWED_ATTRS[tag] ?? [];
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (!allowed.includes(name)) continue; // drops every on* handler, style, class, id, etc.
    const value = attr.value;
    if ((name === 'href' || name === 'src') && !SAFE_URL.test(value.trim())) continue; // block javascript:/data:
    clean.setAttribute(name, value);
  }
  // Force safe link semantics for target=_blank.
  if (tag === 'a' && clean.getAttribute('target') === '_blank') {
    clean.setAttribute('rel', 'noopener noreferrer nofollow');
  }
  for (const child of Array.from(el.childNodes)) {
    const cleanChild = sanitizeNode(child, doc);
    if (cleanChild) clean.appendChild(cleanChild);
  }
  return clean;
}

/**
 * Sanitise an untrusted HTML string to a safe subset. Returns `''` for empty/nullish input.
 * In a non-DOM runtime it strips all markup to text (safe-by-default).
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return '';
  if (typeof DOMParser === 'undefined') return stripToText(input);
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html');
    const out = doc.createElement('div');
    for (const child of Array.from(doc.body.childNodes)) {
      const clean = sanitizeNode(child, doc);
      if (clean) out.appendChild(clean);
    }
    return out.innerHTML;
  } catch {
    return stripToText(input);
  }
}
