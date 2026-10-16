export const landingTypes = ['slider', 'image', 'banner', 'youtube', 'simple', 'advanced', 'heading', 'rich_text', 'html', 'checkout', 'faq', 'store_features', 'custom_reviews', 'promo_banners', 'countdown', 'video', 'gallery', 'how_to', 'content', 'buy_button', 'product_features', 'reviews', 'product_description', 'billboard'] as const;
export type LandingType = typeof landingTypes[number];
export interface LandingImage { media_id?: number; url?: string; alt?: string; destination?: LandingDestination; link_url?: string }
export type TestimonialVariant = `testimonials-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}`;
export const testimonialVariants: TestimonialVariant[] = Array.from({ length: 11 }, (_, index) => `testimonials-${index + 1}` as TestimonialVariant);
export type BannerVariant = `banners-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
export const bannerVariants: BannerVariant[] = Array.from({ length: 9 }, (_, index) => `banners-${index + 1}` as BannerVariant);
export type StoreFeatureVariant = `features-${number}`;
export const storeFeatureVariants: StoreFeatureVariant[] = Array.from({ length: 45 }, (_, index) => `features-${index + 1}` as StoreFeatureVariant);
export type FaqVariant = `faq-${number}`;
export const faqVariants: FaqVariant[] = Array.from({ length: 35 }, (_, index) => `faq-${index + 1}` as FaqVariant);
export type VideoVariant = `video-${1 | 2 | 3 | 4 | 5}`;
export const videoVariants: VideoVariant[] = Array.from({ length: 5 }, (_, index) => `video-${index + 1}` as VideoVariant);
export type HowToVariant = `howto-${1 | 2 | 3 | 4 | 5 | 6}`;
export const howToVariants: HowToVariant[] = Array.from({ length: 6 }, (_, index) => `howto-${index + 1}` as HowToVariant);
export type ContentVariant = `content-${1 | 2 | 3 | 4 | 5}`;
export const contentVariants: ContentVariant[] = Array.from({ length: 5 }, (_, index) => `content-${index + 1}` as ContentVariant);
export type BuyButtonVariant = `buy-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34}`;
export const buyButtonVariants: BuyButtonVariant[] = Array.from({ length: 34 }, (_, index) => `buy-${index + 1}` as BuyButtonVariant);
export type ProductFeatureVariant = `product-features-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44}`;
export const productFeatureVariants: ProductFeatureVariant[] = Array.from({ length: 44 }, (_, index) => `product-features-${index + 1}` as ProductFeatureVariant);
export type ReviewVariant = `reviews-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47}`;
export const reviewVariants: ReviewVariant[] = Array.from({ length: 47 }, (_, index) => `reviews-${index + 1}` as ReviewVariant);
export type DescriptionVariant = `description-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25}`;
export const descriptionVariants:DescriptionVariant[]=Array.from({length:25},(_,i)=>`description-${i+1}` as DescriptionVariant);
export interface LandingDestination { type: 'product' | 'category' | 'page'; id: number }
export interface LandingItem { title?: string; text?: string; html?: string; image?: LandingImage; url?: string; icon?: string; accent?: string; background?: string; foreground?: string; rating?: number; author?: string; caption?: string; date?: string | null; platform?: string; destination?: LandingDestination }
export interface LandingSettings {
  title?: string; description?: string; eyebrow?: string; author?: string; caption?: string; html?: string; image?: LandingImage; secondary_image?: LandingImage; background_image?: LandingImage; images?: LandingImage[]; video?: string;
  variant?: TestimonialVariant | BannerVariant | StoreFeatureVariant | FaqVariant | VideoVariant | HowToVariant | ContentVariant | BuyButtonVariant | ProductFeatureVariant | ReviewVariant | DescriptionVariant; description_mode?: 'fields' | 'formatted'; description_css_mode?:'template'|'custom'; eyebrow_color?: string; accent?: string; card_background?: string; question_background?: string;
  hover_background?: string; hover_foreground?: string; secondary_foreground?: string; hover_secondary_foreground?: string; icon_background?: string; icon_color?: string; motion?: boolean;
  button_text?: string; button_target?: 'purchase' | 'product'; background?: string; foreground?: string; align?: 'start' | 'center' | 'end';
  layout?: 'stack' | 'split' | 'reverse' | 'tiles' | 'columns' | 'overlay' | 'carousel' | 'grid'; items?: LandingItem[];
  hours?: number; ends_at?: string | null; rating?: number; css?: string; padding?: number; radius?: number; font_size?: number;
}
export interface LandingSection { id: string; type: LandingType; settings: LandingSettings }
export interface LandingDocument { schema: 1; mode: 'standard' | 'standalone' | 'below'; sections: LandingSection[] }
export const emptyLanding = (): LandingDocument => ({ schema: 1, mode: 'standard', sections: [] });
export const landingUrl = (value: unknown): value is string => typeof value === 'string' && value.length <= 2000 && !Array.from(value).some(char => char.charCodeAt(0) < 32) && /^(https?:\/\/[^\s<>"]+|\/(?!\/)[^\s<>"]*|#[a-zA-Z0-9_-]+)$/.test(value);
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Reject malformed documents rather than turning an unknown layout into a buy form. */
export function parseLanding(value: unknown): LandingDocument | null {
  if (!object(value) || value.schema !== 1 || !['standard', 'standalone', 'below'].includes(String(value.mode)) || !Array.isArray(value.sections) || value.sections.length > 60) return null;
  const ids = new Set<string>();
  for (const section of value.sections) {
    // PHP's associative JSON cast serializes a canonical empty settings map as [].
    // Accept that representation only when it is empty; populated lists are invalid.
    if (!object(section) || typeof section.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(section.id) || ids.has(section.id.toLowerCase()) || !landingTypes.includes(section.type as LandingType) || !(object(section.settings) || Array.isArray(section.settings) && section.settings.length === 0)) return null;
    ids.add(section.id.toLowerCase());
    const s = object(section.settings) ? section.settings : {};
    for (const key of ['title', 'description', 'eyebrow', 'author', 'caption', 'html', 'css', 'button_text', 'video']) if (key in s && typeof s[key] !== 'string') return null;
    for (const key of ['padding', 'radius', 'font_size', 'hours', 'rating']) if (key in s && (typeof s[key] !== 'number' || !Number.isFinite(s[key]))) return null;
    for (const key of ['background', 'foreground', 'eyebrow_color', 'accent', 'card_background', 'question_background', 'hover_background', 'hover_foreground', 'secondary_foreground', 'hover_secondary_foreground', 'icon_background', 'icon_color']) if (key in s && (typeof s[key] !== 'string' || !/^(#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})|transparent)$/i.test(s[key]))) return null;
    if(s.description_mode!==undefined && (section.type!=='product_description' || !descriptionVariants.includes(s.variant as DescriptionVariant) || !['fields','formatted'].includes(String(s.description_mode))))return null;
    if(s.description_css_mode!==undefined && (section.type!=='product_description' || !descriptionVariants.includes(s.variant as DescriptionVariant) || !['template','custom'].includes(String(s.description_css_mode))))return null;
    if (s.motion !== undefined && typeof s.motion !== 'boolean') return null;
    if (s.variant !== undefined && !(section.type === 'product_description' && descriptionVariants.includes(s.variant as DescriptionVariant) || section.type === 'reviews' && reviewVariants.includes(s.variant as ReviewVariant) || section.type === 'product_features' && productFeatureVariants.includes(s.variant as ProductFeatureVariant) || section.type === 'buy_button' && buyButtonVariants.includes(s.variant as BuyButtonVariant) || section.type === 'content' && contentVariants.includes(s.variant as ContentVariant) || section.type === 'how_to' && howToVariants.includes(s.variant as HowToVariant) || section.type === 'video' && videoVariants.includes(s.variant as VideoVariant) || section.type === 'faq' && faqVariants.includes(s.variant as FaqVariant) || section.type === 'custom_reviews' && testimonialVariants.includes(s.variant as TestimonialVariant) || section.type === 'promo_banners' && bannerVariants.includes(s.variant as BannerVariant) || section.type === 'store_features' && storeFeatureVariants.includes(s.variant as StoreFeatureVariant))) return null;
    const validImage = (image: unknown, allowLinks = false) => object(image) && (landingUrl(image.url) || Number.isSafeInteger(image.media_id) && Number(image.media_id) > 0) && (image.alt === undefined || typeof image.alt === 'string') && (image.destination === undefined || allowLinks && object(image.destination) && ['product', 'category', 'page'].includes(String(image.destination.type)) && Number.isSafeInteger(image.destination.id) && Number(image.destination.id) > 0) && (image.link_url === undefined || allowLinks && (image.link_url === '' || landingUrl(image.link_url)));
    if (s.image !== undefined && !validImage(s.image, section.type === 'content')) return null;
    if (s.secondary_image !== undefined && (section.type !== 'content' || !validImage(s.secondary_image, true))) return null;
    if (s.background_image !== undefined && !validImage(s.background_image)) return null;
    if (s.images !== undefined && (!Array.isArray(s.images) || s.images.length > 30 || !s.images.every(image => validImage(image, section.type === 'content')))) return null;
    if (s.items !== undefined && (!Array.isArray(s.items) || s.items.length > 30 || !s.items.every((item) => object(item) && ['title', 'text', 'html', 'icon', 'author', 'caption', 'platform'].every(key => item[key] === undefined || typeof item[key] === 'string') && ['accent', 'background', 'foreground'].every(key => item[key] === undefined || typeof item[key] === 'string' && /^(#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})|transparent)$/i.test(item[key])) && (item.date === undefined || item.date === null || typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) && (item.image === undefined || validImage(item.image, section.type === 'content')) && (item.destination === undefined || section.type === 'promo_banners' && object(item.destination) && ['product', 'category', 'page'].includes(String(item.destination.type)) && Number.isSafeInteger(item.destination.id) && Number(item.destination.id) > 0) && (item.url === undefined || item.url === '' || landingUrl(item.url)) && (item.rating === undefined || typeof item.rating === 'number' && Number.isFinite(item.rating))))) return null;
  }
  return { ...value, sections: value.sections.map(section => ({ ...section, settings: object(section.settings) ? section.settings : {} })) } as unknown as LandingDocument;
}

export function moveLanding(sections: LandingSection[], id: string, delta: number): LandingSection[] {
  const index = sections.findIndex(section => section.id === id); const target = index + delta;
  if (index < 0 || target < 0 || target >= sections.length) return sections;
  const next = [...sections]; const [section] = next.splice(index, 1); if (section) next.splice(target, 0, section); return next;
}
