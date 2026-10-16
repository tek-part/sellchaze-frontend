import { useState } from 'react';
import { landingUrl, type LandingItem, type LandingSettings } from './document';
import { promoDesign } from './promo-designs';
import { StaticLandingFrame } from './StaticLandingFrame';
import './promo-banners.css';

function BannerImage({ item, index, preview }: { item: LandingItem; index: number; preview: boolean }) {
  const [loaded, setLoaded] = useState(false);
  return item.image?.url && landingUrl(item.image.url) ? <img className={loaded && !preview ? 'lp-promo-loaded' : ''} src={item.image.url} alt={item.image.alt || item.title || ''} loading="lazy" onLoad={() => setLoaded(true)} /> : <div className="lp-promo-placeholder">{preview ? <span>صورة {index + 1}</span> : null}</div>;
}

export function PromoBanners({ settings, preview = false, onImageSelect }: { settings: LandingSettings; preview?: boolean; onImageSelect?: (index: number) => void }) {
  const variant = settings.variant?.startsWith('banners-') ? settings.variant as `banners-${1|2|3|4|5|6|7|8|9}` : 'banners-1';
  const design = promoDesign(variant);
  // Keep empty editor slots in place. Public rendering removes only blank slots;
  // it never manufactures images or silently discards items exceeding a preset.
  const supplied = settings.items ?? [];
  const meaningful = (item: LandingItem) => !!item.image?.url && landingUrl(item.image.url) || !!item.title?.trim() || !!item.text?.trim() || !!item.html?.trim();
  const items: LandingItem[] = preview ? supplied.length ? supplied : Array.from({ length: design.count }, () => ({})) : supplied.filter(meaningful);
  if (!items.length) return null;
  const count = design.count;
  const chunks = Array.from({ length: Math.ceil(items.length / count) }, (_, index) => items.slice(index * count, (index + 1) * count));
  return <div className={`lp-promos lp-promos--${variant.slice(8)}`}>
    {settings.title || settings.description ? <header className="lp-promo-heading">{settings.description ? <p>{settings.description}</p> : null}{settings.title ? <h2>{settings.title}</h2> : null}</header> : null}
    <div className="lp-promo-groups">{chunks.map((group, groupIndex) => <div className={`lp-promo-grid${group.length < count ? ' lp-promo-grid--partial' : ''}`} key={groupIndex}>{group.map((item, index) => {
      const content = <><BannerImage item={item} index={groupIndex * count + index} preview={preview} />{item.title || item.text || item.html ? <div className="lp-promo-copy">{item.title ? <h3>{item.title}</h3> : null}{item.text ? <p>{item.text}</p> : null}{item.html ? <StaticLandingFrame title={item.title || 'محتوى اللافتة'} html={item.html} /> : null}</div> : null}</>;
      return preview && onImageSelect ? <button type="button" className="lp-promo-panel" key={index} aria-label={`تعديل صورة اللافتة ${groupIndex * count + index + 1}`} onClick={() => onImageSelect(groupIndex * count + index)}>{content}</button> : item.url && landingUrl(item.url) && !preview ? <a className="lp-promo-panel" href={item.url} key={index} aria-label={item.title || item.image?.alt || `عرض الصورة ${groupIndex * count + index + 1}`}>{content}</a> : <div className="lp-promo-panel" key={index}>{content}</div>;
    })}</div>)}</div>
    {preview && !supplied.some(meaningful) ? <p className="lp-promo-note">أضف صورك وحدد وجهة كل صورة من الإعدادات.</p> : null}
  </div>;
}
