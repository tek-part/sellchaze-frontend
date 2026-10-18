import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, tr } from '../../sections-lib/schema';
import { useSectionSettings, str, list } from '../../sections-lib/use-section';
import { LibImage } from '../../sections-lib/primitives';
import { themeCampaignAsset } from '../../theme-campaign-asset';
import { HypeShelf, hypeShelfSchema, HypeCompare, hypeCompareSchema, HypeReviewPhotos, hypeReviewPhotosSchema, HypeNewsletter, hypeNewsletterSchema } from '../hype-perfumes/sections';
import { KidsLook, kidsLookSchema } from '../nature-kids/sections';

export const FASHION_HERO = '/media/theme-campaigns/hype-fashion-hero-v1.png';
export const FASHION_LOOK = '/media/theme-campaigns/hype-fashion-look-v1.png';
export const fashionHeroSchema = defineSection({ type: 'fashion-hero', label: 'Fashion full-width campaign', category: 'hero', settings: [fields.image('image', 'Desktop photo', FASHION_HERO), fields.image('mobile_image', 'Mobile photo', FASHION_LOOK), fields.text('eyebrow', 'Eyebrow', tr('مجموعة الموسم', 'New season')), fields.text('title', 'Heading', tr('إطلالة الموسم', 'The season edit')), fields.text('text', 'Description', tr('قصات وخامات وتفاصيل لإطلالتك اليومية.', 'Silhouettes, textures and details for every day.')), fields.text('button', 'Button', tr('تسوق المجموعة', 'Shop collection')), fields.url('url', 'Link', '/shop'), fields.range('overlay', 'Overlay', 28, 0, 80)] });
export function FashionHero(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(fashionHeroSchema, props.settings);
  return <section className="hpf-hero"><picture>{str(s, 'mobile_image') ? <source media="(max-width:767px)" srcSet={themeCampaignAsset(str(s, 'mobile_image'))} /> : null}<LibImage src={str(s, 'image')} alt="" eager /></picture><div className="hpf-hero-shade" style={{ opacity: Number(s['overlay'] ?? 28) / 100 } as CSSProperties} /><div className="hpf-hero-copy">{str(s, 'eyebrow') ? <p className="hpf-eyebrow">{str(s, 'eyebrow')}</p> : null}<h1>{str(s, 'title')}</h1>{str(s, 'text') ? <p>{str(s, 'text')}</p> : null}{str(s, 'button') ? <a href={str(s, 'url', '/shop')}>{str(s, 'button')}</a> : null}</div></section>;
}
export const fashionMarqueeSchema = defineSection({ type: 'fashion-marquee', label: 'Fashion scrolling message', category: 'content', settings: [fields.text('text', 'Message', tr('اكتشف المجموعة الجديدة', 'Explore the new collection'))] });
export function FashionMarquee(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(fashionMarqueeSchema, props.settings); const text = str(s, 'text');
  return <div className="hpf-marquee"><p className="lib-sr-only">{text}</p><div aria-hidden>{Array.from({ length: 8 }, (_, index) => <span key={index}>{text}<b>•</b></span>)}</div></div>;
}
export const fashionShelfSchema = defineSection({ ...hypeShelfSchema, type: 'fashion-shelf', label: 'Fashion product collection', settings: hypeShelfSchema.settings.map(field => field.type === 'text' && field.id === 'title' ? { ...field, default: tr('تسوق المجموعة', 'Shop the collection') } : field) });
export function FashionShelf(props: SectionRenderProps): ReactElement { return <div className="hpf-shelf"><HypeShelf {...props} settings={useSectionSettings(fashionShelfSchema, props.settings)} /></div>; }
export const fashionCompareSchema = defineSection({ ...hypeCompareSchema, type: 'fashion-comparison', label: 'Fashion image comparison', settings: [fields.text('title', 'Heading', tr('اكتشف التفاصيل', 'Explore the details')), fields.image('before_image', 'First photo', FASHION_LOOK), fields.image('after_image', 'Second photo', FASHION_HERO), fields.text('before_label', 'First label', tr('الإطلالة الأولى', 'First look')), fields.text('after_label', 'Second label', tr('الإطلالة الثانية', 'Second look'))] });
export function FashionCompare(props: SectionRenderProps): ReactElement { return <div className="hpf-comparison"><HypeCompare {...props} settings={useSectionSettings(fashionCompareSchema, props.settings)} /></div>; }
export const fashionLookSchema = defineSection({ ...kidsLookSchema, type: 'fashion-linked-look', label: 'Fashion linked look', settings: kidsLookSchema.settings.map(field => field.type === 'image' && field.id === 'image' ? { ...field, default: FASHION_LOOK } : field) });
export function FashionLook(props: SectionRenderProps): ReactElement { return <div className="hpf-linked-look"><KidsLook {...props} settings={useSectionSettings(fashionLookSchema, props.settings)} /></div>; }
export const fashionPromotionSchema = defineSection({ type: 'fashion-promotion', label: 'Fashion merchant promotion', category: 'marketing', settings: [fields.text('title', 'Heading', tr('قطع تختارها لكل يوم', 'Everyday favorites')), fields.text('text', 'Description', tr('اكتشف أحدث اختيارات المتجر.', 'Discover the latest store selection.')), fields.text('button', 'Button', tr('تسوق الآن', 'Shop now')), fields.url('url', 'Link', '/shop'), fields.image('image', 'Optional background photo', '')] });
export function FashionPromotion(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(fashionPromotionSchema, props.settings);
  return <section className="hpf-promotion">{str(s, 'image') ? <LibImage src={str(s, 'image')} alt="" /> : null}<div><h2>{str(s, 'title')}</h2>{str(s, 'text') ? <p>{str(s, 'text')}</p> : null}{str(s, 'button') ? <a href={str(s, 'url', '/shop')}>{str(s, 'button')}</a> : null}</div></section>;
}
export const fashionReviewsSchema = defineSection({ ...hypeReviewPhotosSchema, type: 'fashion-review-photos', label: 'Fashion merchant review photos' });
export function FashionReviews(props: SectionRenderProps): ReactElement { return <div className="hpf-reviews"><HypeReviewPhotos {...props} settings={useSectionSettings(fashionReviewsSchema, props.settings)} /></div>; }
export const fashionFeaturesSchema = defineSection({ type: 'fashion-features', label: 'Fashion service columns', category: 'content', settings: [fields.list('items', 'Merchant service information', [fields.select('icon', 'Icon', [{ value: 'box', label: 'Box' }, { value: 'heart', label: 'Heart' }, { value: 'message', label: 'Message' }], 'box'), fields.text('title', 'Heading'), fields.text('text', 'Description'), fields.url('url', 'Optional link')], [], 3)] });
export function FashionFeatures(props: SectionRenderProps): ReactElement {
  const s = useSectionSettings(fashionFeaturesSchema, props.settings);
  return <section className="hpf-features">{list(s, 'items').map((item, index) => <div key={index}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>{str(item, 'icon') === 'heart' ? <path d="m12 20-8-8a5 5 0 0 1 8-6 5 5 0 0 1 8 6Z" /> : str(item, 'icon') === 'message' ? <path d="M3 4h18v13H9l-6 4V4Z" /> : <><path d="m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11" /></>}</svg><h3>{str(item, 'title')}</h3><p>{str(item, 'text')}</p>{str(item, 'url') ? <a href={str(item, 'url')}>{str(item, 'title')}</a> : null}</div>)}</section>;
}
export const fashionNewsletterSchema = defineSection({ ...hypeNewsletterSchema, type: 'fashion-newsletter', label: 'Fashion newsletter' });
export function FashionNewsletter(props: SectionRenderProps): ReactElement { return <div className="hpf-newsletter"><HypeNewsletter {...props} settings={useSectionSettings(fashionNewsletterSchema, props.settings)} /></div>; }
