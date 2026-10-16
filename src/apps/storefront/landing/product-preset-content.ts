import { landingUrl, type LandingImage, type LandingItem } from './document';
import { landingStaticHtml } from './StaticLandingFrame';
import type { ProductPresetContent, ProductPresetFragment } from './product-preset-types';

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
const imageUrl = (image?: LandingImage) => image?.url && landingUrl(image.url) && !image.url.startsWith('#') ? image.url : '';
const photograph = (image?: LandingImage) => imageUrl(image) ? `<img src="${escape(imageUrl(image))}" alt="${escape(image?.alt)}" loading="lazy" data-landing-image>` : '';
const link = (url?: string) => url && landingUrl(url) ? `<a href="${escape(url)}">عرض التفاصيل</a>` : '';
const itemExtra = (item?: LandingItem) => item ? landingStaticHtml((item.html ?? '').slice(0, 6000)) + [item.caption,item.platform,item.date].filter(Boolean).map(text=>`<p class="ps-bound-text">${escape(text)}</p>`).join('') + (item.rating!==undefined&&Number.isFinite(item.rating)?`<p aria-label="التقييم">${Math.max(0,Math.min(5,item.rating))} / 5</p>`:'') + link(item.url) : '';

export interface PresetMarkupOptions {
  padding?: number;
  radius?: number;
  fontSize?: number;
  clockColor?: string;
  clockLabelColor?: string;
  foreground?: string;
  secondaryForeground?: string;
  background?: string;
  backgroundImage?: LandingImage;
  align?: 'start' | 'center' | 'end';
  descriptionAlign?: 'start' | 'center' | 'end';
  motion?: boolean;
}

/** Escape schema values once; replacement values never become new template tokens. */
export function productPresetMarkup(fragment: ProductPresetFragment, content: ProductPresetContent, options: PresetMarkupOptions = {}): string {
  function render(template: string, item?: LandingItem, index = 0): string {
    return template.replace(/\{\{([\w:.-]+)\}\}/g, (_, token: string) => {
      if (token.startsWith('region:')) {
        const region = fragment.regions[Number(token.slice(7))];
        if (!region?.templates.length) return '';
        const items: LandingItem[] = region.kind === 'images' ? (content.images ?? []).map(image => ({ image })) : content.items ?? [];
        return items.map((entry, position) => render(region.templates[position % region.templates.length]!, entry, position)).join('');
      }
      if (token === 'index') return String(index);
      if (token === 'html') return landingStaticHtml(content.html ?? '');
      if (token === 'item.extra') return itemExtra(item);
      if (token === 'item.answer') return `${item?.text ? `<p class="ps-bound-text">${escape(item.text)}</p>` : ''}${photograph(item?.image)}${itemExtra(item)}`;
      if (token === 'item.image') return escape(imageUrl(item?.image));
      if (token === 'item.alt') return escape(item?.image?.alt);
      if (token === 'item.author') return escape(item?.title || item?.author);
      if (token === 'item.title') return escape(item?.title || item?.author);
      if (token === 'item.text') return escape(item?.text);
      if (token === 'image') return escape(imageUrl(content.image));
      if (token === 'image_alt') return escape(content.image?.alt);
      if (token.startsWith('image:')) return escape(imageUrl(content.images?.[Number(token.slice(6))]));
      if (token.startsWith('image-alt:')) return escape(content.images?.[Number(token.slice(10))]?.alt);
      if (['title', 'description', 'caption', 'button_text'].includes(token)) return escape(content[token as keyof ProductPresetContent]);
      return '';
    });
  }
  const html = render(fragment.html);
  const document = new DOMParser().parseFromString(html, 'text/html');
  const root = document.body.firstElementChild as HTMLElement | null;
  if (!root) return '';
  root.setAttribute('data-motion', options.motion === false ? 'paused' : 'playing');
  if(fragment.kind==='testimonials'){
    const track=root.querySelector('[data-preset-carousel]');track?.setAttribute('role','region');track?.setAttribute('aria-label',content.title||'شهادات العملاء');
    root.querySelectorAll('.slider_buttons_container .slider_button').forEach((button,index)=>{button.setAttribute(index===0?'data-preset-prev':'data-preset-next','');button.setAttribute('aria-label',index===0?'السابق':'التالي');});
  }
  if (options.background) root.style.setProperty('background-color',options.background,'important');
  if(options.padding!==undefined)root.style.setProperty('padding',`${Math.max(0,Math.min(160,options.padding))}px`,'important');
  if(options.radius!==undefined)root.style.setProperty('border-radius',`${Math.max(0,Math.min(48,options.radius))}px`,'important');
  const backdrop = imageUrl(options.backgroundImage);
  if (backdrop) { root.style.setProperty('background-image',`url(${JSON.stringify(backdrop)})`,'important'); root.style.setProperty('--ps-preset-artwork',`url(${JSON.stringify(backdrop)})`,'important'); root.style.backgroundSize = 'cover'; root.style.backgroundPosition = 'center'; }
  const title = root.querySelector<HTMLElement>('[data-landing-text="title"]');
  const description = root.querySelector<HTMLElement>('[data-landing-text="description"]');
  if ((!title && content.title) || (!description && content.description)) {
    const heading = document.createElement('header'); heading.className = 'ps-added-heading'; heading.setAttribute('data-landing-reveal', '');
    heading.innerHTML = `${!title && content.title ? `<h3 data-landing-text="title">${escape(content.title)}</h3>` : ''}${!description && content.description ? `<p data-landing-text="description">${escape(content.description)}</p>` : ''}`;
    root.prepend(heading);
  }
  for(const node of root.querySelectorAll<HTMLElement>('[data-landing-text="title"]')) { if(options.foreground) node.style.setProperty('color',options.foreground,'important'); if(options.align) node.style.setProperty('text-align',options.align,'important'); if(options.fontSize)node.style.setProperty('font-size',`${Math.max(12,Math.min(96,options.fontSize))}px`,'important'); }
  for(const node of root.querySelectorAll<HTMLElement>('[data-landing-text="description"]')) { if(options.secondaryForeground) node.style.setProperty('color',options.secondaryForeground,'important'); if(options.descriptionAlign) node.style.setProperty('text-align',options.descriptionAlign,'important'); }
  if(options.clockColor)for(const node of root.querySelectorAll<HTMLElement>('[data-landing-clock]'))node.style.setProperty('color',options.clockColor,'important');
  if(options.clockLabelColor)for(const node of root.querySelectorAll<HTMLElement>('.days-text,.hours-text,.minutes-text,.seconds-text'))node.style.setProperty('color',options.clockLabelColor,'important');
  for (const image of root.querySelectorAll('img')) if (!image.getAttribute('src')) image.remove();
  for (const node of root.querySelectorAll<HTMLElement>('[data-landing-item]')) {
    const item = content.items?.[Number(node.getAttribute('data-landing-item'))];
    if (item?.background) node.style.setProperty('background-color',item.background,'important');
    if(item?.background)for(const child of node.querySelectorAll<HTMLElement>('[style]'))if(child.style.getPropertyValue('--bg-color'))child.style.setProperty('--bg-color',item.background);
    if (item?.foreground) { node.style.setProperty('color',item.foreground,'important'); for(const text of node.querySelectorAll<HTMLElement>('.ps-bound-text')) text.style.setProperty('color',item.foreground,'important'); }
  }
  const extras: string[] = [];
  if (!fragment.html.includes('{{html}}') && content.html) extras.push(landingStaticHtml(content.html));
  if (!fragment.image && content.image) extras.push(photograph(content.image));
  if (!fragment.regions.some(region => region.kind === 'images') && fragment.kind !== 'gallery') extras.push(...(content.images ?? []).map(photograph));
  if (!fragment.regions.some(region => region.kind === 'items')) {
    for (const item of content.items ?? []) extras.push(`<article>${photograph(item.image)}${item.author || item.title ? `<h4>${escape(item.author || item.title)}</h4>` : ''}${item.text ? `<p class="ps-bound-text">${escape(item.text)}</p>` : ''}${itemExtra(item)}</article>`);
  }
  if (extras.some(Boolean)) root.insertAdjacentHTML('beforeend', `<div class="ps-extra">${extras.join('')}</div>`);
  return root.outerHTML;
}

export function productPresetRichContent(template: string, product: { name?: string; title?: string; description?: string }): string {
  const name = product.name || product.title || 'المنتج';
  const description = new DOMParser().parseFromString(product.description ?? '', 'text/html').body.textContent ?? '';
  return template.replace(/\{\{(name|description|heading)\}\}/g, (_, token) => escape(token === 'name' ? name : token === 'description' ? description : 'عن المنتج'));
}
