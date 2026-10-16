import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { landingUrl, type LandingItem, type LandingSettings } from './document';
import { faqDesign } from './faq-designs';
import { StaticLandingFrame } from './StaticLandingFrame';
import './faq.css';

const populated = (item: LandingItem) => !!(item.title?.trim() || item.text?.trim() || item.html?.trim() || item.image?.url && landingUrl(item.image.url));
export const hasFaqContent = (settings: LandingSettings) => !!(settings.title?.trim() || settings.description?.trim() || settings.items?.some(populated) || faqDesign(settings.variant).purchase && settings.button_text?.trim());

export function Faq({ settings: s, preview = false, onItemSelect, onPurchase }: { settings: LandingSettings; preview?: boolean; onItemSelect?: (index: number) => void; onPurchase?: () => void }) {
  const d = faqDesign(s.variant); const uid = useId();
  const [open, setOpen] = useState<number | null>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const supplied = s.items ?? [];
  // Keep original indices for direct editing, including any intervening blanks.
  const items = supplied.map((item, index) => ({ item, index })).filter(({ item }) => preview || populated(item));
  if (preview && !items.length) for (let index = 0; index < d.count; index++) items.push({ item: {}, index });
  const style = {
    '--faq-columns': d.columns, '--faq-width': `${d.width}px`, '--faq-gap': d.gap,
    '--faq-color': s.foreground ?? d.foreground, '--faq-question': s.foreground ?? d.questionColor,
    '--faq-card': s.question_background ?? d.questionBackground, '--faq-border': d.border,
    '--faq-rule': d.rule ?? d.border, '--faq-radius': `${d.radius}px`, '--faq-shadow': d.shadow,
    '--faq-group': s.card_background ?? d.groupBackground, '--faq-group-padding': d.groupPadding,
    '--faq-group-radius': `${d.groupRadius}px`, '--faq-group-shadow': d.groupShadow, '--faq-mobile-padding': d.groupPadding === '0px' ? '0px' : 'min(20px,5cqw)',
    '--faq-accent': s.accent ?? d.eyebrow, '--faq-icon': s.icon_color ?? d.iconColor,
    '--faq-heading-size': `${s.font_size ?? d.headingSize}px`, '--faq-align': s.align ?? d.headingAlign,
    '--faq-question-size': `${d.questionSize ?? 18}px`, '--faq-question-padding': `${d.questionPadding ?? 18}px`,
  } as CSSProperties;
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, position: number) {
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (position + 1) % items.length : event.key === 'ArrowUp' ? (position - 1 + items.length) % items.length : null;
    if (target !== null) { event.preventDefault(); buttons.current[target]?.focus(); }
  }
  return <div className={`lp-faq lp-faq--${d.id}${d.split ? ' lp-faq--split' : ''}${d.gradient && !s.foreground ? ' lp-faq--gradient' : ''}${d.badge ? ' lp-faq--badge' : ''}${d.frame ? ' lp-faq--frame' : ''}${d.headerFrame ? ' lp-faq--header-frame' : ''}`} style={style} data-motion={s.motion === false ? 'paused' : 'playing'}>
    {s.title || s.description || preview ? <header className={`lp-faq-header${d.descriptionBelow ? ' lp-faq-header--description-below' : ''}`}>{s.description && !d.descriptionBelow ? <p>{s.description}</p> : null}{s.title || preview ? <h2>{s.title || 'الأسئلة الشائعة'}</h2> : null}{s.description && d.descriptionBelow ? <p>{s.description}</p> : null}</header> : null}
    <div className="lp-faq-group">{items.map(({ item, index }, position) => {
      const expanded = open === index; const panelId = `${uid}-answer-${index}`; const buttonId = `${uid}-question-${index}`;
      return <article className="lp-faq-item" key={index} style={{ ...(item.background ? { '--faq-card': item.background } : {}), ...(item.foreground ? { '--faq-question': item.foreground } : {}) } as CSSProperties}>
        <h3><button type="button" id={buttonId} ref={el => { buttons.current[position] = el; }} aria-expanded={expanded} aria-controls={panelId} onKeyDown={event => keyboard(event, position)} onClick={() => { setOpen(expanded ? null : index); onItemSelect?.(index); }}><span>{item.title || (preview ? `السؤال ${index + 1}` : 'عرض الإجابة')}</span><svg className={`lp-faq-icon lp-faq-icon--${d.icon}`} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button></h3>
        <div className="lp-faq-answer" data-open={expanded} id={panelId} role="region" aria-labelledby={buttonId} aria-hidden={!expanded} inert={!expanded}>
          <div className="lp-faq-answer-inner"><div className="lp-faq-answer-content">
            {item.text ? <p>{item.text}</p> : preview && !item.html && !item.image ? <p>أضف إجابتك هنا.</p> : null}
            {item.image?.url && landingUrl(item.image.url) ? <img src={item.image.url} alt={item.image.alt || ''} loading="lazy" /> : null}
            {item.html ? <StaticLandingFrame title={item.title || 'إجابة السؤال'} html={item.html} /> : null}
            {item.url && landingUrl(item.url) ? preview ? <span>{item.url}</span> : <a href={item.url}>عرض التفاصيل</a> : null}
          </div></div>
        </div>
      </article>;
    })}</div>
    {d.purchase && s.button_text !== '' ? <button type="button" className="lp-faq-buy" onClick={preview ? undefined : onPurchase}>{s.button_text ?? 'الشراء الآن'}</button> : null}
  </div>;
}
