/**
 * Hashtag and mention text handling shared by the composer and every surface
 * that renders a post body (feed card, reel caption, post detail).
 *
 * Storage format: plain text inside the HTML body. `#hashtag` stays literal
 * text; a mention is stored as the anchor the composer inserted
 * (`<a data-mention href="/u/username">@Name</a>`). Rendering then only has to
 * linkify hashtags and style whatever mentions already exist.
 */

// Letters (any script) plus digits/underscore — covers Arabic hashtags.
export const HASHTAG_RE = /(^|[\s(>])#([\p{L}\p{N}_\u0640]{2,50})/gu;

/** Pull the unique hashtags out of a post body (HTML or plain text). */
export function extractHashtags(html) {
    const text = String(html ?? '').replace(/<[^>]*>/g, ' ');
    const tags = new Set();
    for (const match of text.matchAll(HASHTAG_RE)) {
        tags.add(match[2].toLowerCase());
        if (tags.size >= 10) break; // server caps at 10
    }
    return [...tags];
}

/**
 * Linkify hashtags in an already-sanitised HTML body and give stored mention
 * anchors their pill styling. Runs on render only — never on what is sent to
 * the server — so the stored body stays plain.
 */
export function decorateSocialHtml(html) {
    let out = String(html ?? '');
    // Hashtags → the tag's own page. Hashtags only ever sit in text nodes here
    // because the body was sanitised first.
    out = out.replace(HASHTAG_RE, (full, prefix, tag) =>
        `${prefix}<a href="/community/tag/${encodeURIComponent(tag)}" class="sc-hashtag">#${tag}</a>`);
    // Stored mention anchors get the pill class (idempotent).
    out = out.replace(/<a([^>]*data-mention[^>]*)>/g, (full, attrs) =>
        attrs.includes('class=') ? full : `<a${attrs} class="sc-mention">`);
    return out;
}
