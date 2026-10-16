import { useState, type CSSProperties } from 'react';
import { landingUrl, type LandingItem, type LandingSettings } from './document';
import { StaticLandingFrame } from './StaticLandingFrame';
import { StoreFeatureIcon } from './StoreFeatureIcon';
import { storeFeatureDesign, storeFeatureExamples } from './store-feature-designs';
import './store-features.css';

const itemHasContent = (item: LandingItem) => !!(item.title?.trim() || item.text?.trim() || item.html?.trim() || item.icon?.trim() || item.image?.url && landingUrl(item.image.url));
export function hasStoreFeatureContent(settings: LandingSettings) {
  return !!settings.items?.some(itemHasContent) || storeFeatureDesign(settings.variant).header && !!(settings.title?.trim() || settings.description?.trim());
}
export function StoreFeatures({ settings, preview = false, onItemSelect }: { settings: LandingSettings; preview?: boolean; onItemSelect?: (index: number) => void }) {
  const d = storeFeatureDesign(settings.variant);
  const [paused, setPaused] = useState(false);
  const supplied = settings.items ?? [];
  const examples = preview && !supplied.some(itemHasContent);
  const items = preview ? examples ? storeFeatureExamples(d.id) : supplied : supplied.filter(itemHasContent);
  if (!preview && !hasStoreFeatureContent(settings)) return null;
  const color = settings.foreground ?? d.foreground;
  const bodyColor = settings.secondary_foreground ?? d.bodyColor;
  const style = {
    '--feature-columns': d.columns, '--feature-gap': `${d.gap}px`, '--feature-radius': `${d.radius}px`, '--feature-padding': d.cardPadding,
    '--feature-border': d.border, '--feature-accent': settings.accent ?? d.accent, '--feature-background': settings.card_background ?? d.cardBackground,
    '--feature-color': color, '--feature-body': bodyColor, '--feature-hover-bg': settings.hover_background ?? d.hoverBackground ?? settings.card_background ?? d.cardBackground,
    '--feature-hover-color': settings.hover_foreground ?? d.hoverForeground ?? color, '--feature-hover-body': settings.hover_secondary_foreground ?? d.hoverForeground ?? bodyColor,
    '--feature-icon-color': settings.icon_color ?? d.iconColor, '--feature-badge-bg': settings.icon_background ?? d.badgeBackground,
    '--feature-badge-size': `${d.badgeSize}px`, '--feature-icon-size': `${d.iconSize}px`, '--feature-title-size': `${settings.font_size ?? 21}px`,
    '--feature-align': d.align, '--feature-heading-align': settings.align ?? d.headingAlign,
  } as CSSProperties;
  const moving = d.kind === 'ticker';
  const compact = moving || ['features-19', 'features-28', 'features-32', 'features-34', 'features-35', 'features-36', 'features-37', 'features-38', 'features-39', 'features-44'].includes(d.id);
  const renderItem = (item: LandingItem, index: number, duplicate = false) => {
    const own = { ...(item.accent ? { '--feature-icon-color': item.accent } : {}), ...(item.background ? { '--feature-background': item.background } : {}), ...(item.foreground ? { '--feature-color': item.foreground } : {}), '--feature-delay': `${Math.min(index, 8) * 0.1}s` } as CSSProperties;
    const image = item.image?.url && landingUrl(item.image.url) ? <img src={item.image.url} alt={item.image.alt || ''} loading="lazy" /> : <StoreFeatureIcon name={item.icon || (preview ? ['truck', 'box', 'shield', 'support'][index % 4] : undefined)} />;
    const text = <>{item.title ? <h3>{item.title}</h3> : preview ? <h3>{d.kind === 'logos' ? `شعار ${index + 1}` : `عنوان الميزة ${index + 1}`}</h3> : null}{!compact && item.text ? <p>{item.text}</p> : null}{!compact && item.html ? <StaticLandingFrame title={item.title || 'تفاصيل الميزة'} html={item.html} /> : null}</>;
    return <article className="lp-feature-card" key={index} style={own} {...(duplicate ? { 'aria-hidden': true, inert: true } : {})}>
      {!moving && d.kind !== 'numbers' && d.kind !== 'statement' ? <div className={`lp-feature-badge lp-feature-badge--${d.badge}`}>{image}</div> : null}
      <div className="lp-feature-text">{item.url && landingUrl(item.url) && !preview && !duplicate ? <a className="lp-feature-link" href={item.url}>{text}</a> : text}</div>
      {preview && onItemSelect && !duplicate ? <button type="button" className="lp-feature-edit" aria-label={`تعديل الميزة ${index + 1}`} onClick={() => onItemSelect(index)} /> : null}
    </article>;
  };
  const title = settings.title || (preview && d.header ? d.kind === 'statement' ? 'اكتب عبارة متجرك هنا' : 'مميزات المتجر' : '');
  const description = settings.description || '';
  return <div className={`lp-features lp-features--${d.id.slice(9)} lp-features--${d.kind}${preview ? ' lp-features--preview' : ''}${d.shadow ? ' lp-features--shadow' : ''}${d.frame ? ' lp-features--frame' : ''}${d.wobble ? ' lp-features--wobble' : ''}${d.glow ? ' lp-features--glow' : ''}`} style={style} data-motion={settings.motion === false || preview || paused ? 'paused' : 'playing'}>
    <div className="lp-feature-layout">
      {d.header && (title || description) ? <header className="lp-feature-heading">{description ? <p>{description}</p> : null}{title ? <h2>{title}</h2> : null}</header> : null}
      {moving ? <><div className="lp-feature-ticker-viewport"><div className="lp-feature-ticker-track"><div className="lp-feature-grid" dir="rtl">{items.map((item, index) => renderItem(item, index))}</div>{!preview && settings.motion !== false ? <div className="lp-feature-grid lp-feature-ticker-copy" dir="rtl" aria-hidden inert>{items.map((item, index) => renderItem(item, index, true))}</div> : null}</div></div>{!preview && settings.motion !== false && items.length ? <button className="lp-feature-motion" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'تشغيل حركة المزايا' : 'إيقاف حركة المزايا'}</button> : null}</> : <div className="lp-feature-grid">{items.map((item, index) => renderItem(item, index))}</div>}
    </div>
    {examples ? <p className="lp-feature-note">بيانات تجريبية للمعاينة — أضف مزايا متجرك وأيقوناتك من الإعدادات.</p> : null}
  </div>;
}
