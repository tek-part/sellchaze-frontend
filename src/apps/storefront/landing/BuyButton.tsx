import type { CSSProperties } from 'react';
import { landingUrl, type LandingSettings } from './document';
import { buyButtonDesign } from './buy-button-designs';
import { buyButtonEffects } from './buy-button-effects';
import { StaticLandingFrame } from './StaticLandingFrame';
import baseCss from './buy-buttons.css?inline';
import './buy-buttons.css';
import './buy-button-effects.css';

const escape = (value: string) => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
export function BuyButton({ settings: s, preview = false, thumbnail = false, onPurchase, onSelect }: { settings: LandingSettings; preview?: boolean; thumbnail?: boolean; onPurchase?: () => void; onSelect?: () => void }) {
  const d = buyButtonDesign(s.variant); const label = s.button_text ?? 'الشراء الان';
  if (!label.trim()) return null;
  const icon = d.icon && s.image?.url && landingUrl(s.image.url) && !s.image.url.startsWith('#') ? s.image.url : '/landing-icons/cart-confirmation.png';
  const style = {
    '--buy-padding': s.padding === undefined ? '40px 15px' : `${s.padding}px`,
    ...(s.card_background ? { '--buy-background': s.card_background } : {}), ...(s.foreground ? { '--buy-foreground': s.foreground } : {}),
    ...(s.hover_background ? { '--buy-effect-background': s.hover_background } : {}), ...(s.hover_foreground ? { '--buy-effect-foreground': s.hover_foreground } : {}),
    ...(s.accent ? { '--buy-accent': s.accent } : {}), ...(s.font_size ? { '--buy-font-size': `${s.font_size}px` } : {}),
    ...(s.radius === undefined ? {} : { '--buy-radius': `${s.radius}px` }), '--buy-icon': `url(${JSON.stringify(icon)})`,
    justifyContent: s.align === 'start' ? 'flex-start' : s.align === 'end' ? 'flex-end' : 'center',
  } as CSSProperties;
  const motion = preview || s.motion === false ? 'paused' : 'playing';
  const attributes = { className: 'lp-buy-button', 'data-label': label, 'data-effect-label': s.caption || label, 'aria-label': label };
  if (s.css?.trim() && !thumbnail) {
    const inline = Object.entries(style).map(([key, value]) => `${key === 'justifyContent' ? 'justify-content' : key}:${value}`).join(';');
    const html = `<div class="lp-buy lp-buy--${d.id.slice(4)}" data-design="${d.id}" data-motion="${motion}" style="${escape(inline)}"><div class="lp-buy-inner"><button class="lp-buy-button" type="button" data-purchase data-label="${escape(label)}" data-effect-label="${escape(s.caption || label)}" aria-label="${escape(label)}">${escape(label)}</button></div></div>`;
    const native = `${baseCss}\n${(buyButtonEffects[d.id] ?? '').replace(/!important/g, '')}`;
    return <StaticLandingFrame title="تنسيق زر الشراء" html={html} css={s.css} baseCss={`@layer native {${native}}`} onPurchase={preview ? undefined : onPurchase} />;
  }
  return <div className={`lp-buy lp-buy--${d.id.slice(4)}`} data-design={d.id} data-motion={motion} data-thumbnail={thumbnail || undefined} style={style}><div className="lp-buy-inner">{thumbnail ? <span {...attributes}>{label}</span> : <button {...attributes} type="button" onClick={preview ? onSelect : onPurchase}>{label}</button>}</div></div>;
}
