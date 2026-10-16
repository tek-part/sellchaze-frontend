import { billboardDesign, type BillboardNode } from './billboard-designs';
import { escapeDescription } from './description-rich';
import { landingUrl, type LandingSettings } from './document';
import { landingStaticHtml } from './StaticLandingFrame';

export { escapeDescription } from './description-rich';
export const billboardSample = (text: string, length: number): string => (text + ' ').repeat(Math.ceil(Math.max(1, Math.min(length, 300)) / (text.length + 1))).slice(0, Math.max(1, Math.min(length, 300))).trimEnd();
export const hasBillboardContent = (s: LandingSettings): boolean => {
  if (s.billboard_mode === 'formatted') return !!(s.html?.trim() || s.image?.url && landingUrl(s.image.url));
  const extra = !!(s.billboard_mode !== 'fields' && s.html?.trim() || s.items?.some(i => i.title?.trim() || i.text?.trim() || i.html?.trim() || i.image?.url && landingUrl(i.image.url)));
  return billboardDesign(s.variant).advanced ? !!(extra || s.title?.trim() || s.description?.trim() || s.eyebrow?.trim() || s.image?.url && landingUrl(s.image.url)) : extra;
};

/** Rebuild the observed heading/emphasis structure using only merchant-owned text. */
export function billboardRichHtml(s: LandingSettings, examples = false): string {
  const design = billboardDesign(s.variant);
  const sample: Record<string, string> = { title: 'عرض منتجك', description: 'تفاصيل العرض وشروطه', eyebrow: 'تعرّف على المنتج' };
  const render = (node: BillboardNode): string => {
    if (!node.tag) {
      const value = node.slot === 'title' ? s.title : node.slot === 'description' ? s.description : node.slot === 'eyebrow' ? s.eyebrow : '';
      return escapeDescription(value || (examples ? billboardSample(sample[node.slot ?? 'title'] ?? '', node.length ?? 20) : '')).replace(/\n/g, '<br>');
    }
    const body = (node.children ?? []).map(render).join('');
    if (!body && node.tag !== 'br') return '';
    const alignment = /ql-align-(right|left|center|justify)/.exec(node.class ?? '')?.[1];
    const style = (node.style ?? '') + (alignment ? `;text-align:var(--pd-align,${alignment})` : '');
    return `<${node.tag}${node.class ? ` class="${escapeDescription(node.class)}"` : ''}${style ? ` style="${escapeDescription(style)}"` : ''}>${body}</${node.tag}>`;
  };
  const extras = (s.items ?? []).map(item => `<div class="bb-extra">${item.title ? `<p class="bb-extra-title">${escapeDescription(item.title)}</p>` : ''}${item.text ? `<p>${escapeDescription(item.text).replace(/\n/g, '<br>')}</p>` : ''}${item.html ? landingStaticHtml(item.html.slice(0, 6000)) : ''}${item.url && landingUrl(item.url) ? `<a href="${escapeDescription(item.url)}">عرض التفاصيل</a>` : ''}</div>`).join('');
  return (design.schema.children ?? []).map(render).join('') + extras;
}
