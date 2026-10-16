export const landingTypes = ['slider', 'image', 'banner', 'youtube', 'simple', 'advanced', 'heading', 'rich_text', 'html', 'checkout', 'faq', 'store_features', 'custom_reviews', 'promo_banners', 'countdown', 'video', 'gallery', 'how_to', 'content', 'buy_button', 'product_features', 'reviews', 'product_description', 'billboard'] as const;
export type LandingType = typeof landingTypes[number];
export interface LandingImage { media_id?: number; url?: string; alt?: string }
export type TestimonialVariant = `testimonials-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}`;
export const testimonialVariants: TestimonialVariant[] = Array.from({ length: 11 }, (_, index) => `testimonials-${index + 1}` as TestimonialVariant);
export interface LandingItem { title?: string; text?: string; html?: string; image?: LandingImage; url?: string; icon?: string; rating?: number; author?: string; caption?: string; date?: string | null; platform?: string }
export interface LandingSettings {
  title?: string; description?: string; html?: string; image?: LandingImage; background_image?: LandingImage; images?: LandingImage[]; video?: string;
  variant?: TestimonialVariant; accent?: string; card_background?: string; question_background?: string;
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
    for (const key of ['title', 'description', 'html', 'css', 'button_text', 'video']) if (key in s && typeof s[key] !== 'string') return null;
    for (const key of ['padding', 'radius', 'font_size', 'hours', 'rating']) if (key in s && (typeof s[key] !== 'number' || !Number.isFinite(s[key]))) return null;
    for (const key of ['background', 'foreground', 'accent', 'card_background', 'question_background']) if (key in s && (typeof s[key] !== 'string' || !/^(#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})|transparent)$/i.test(s[key]))) return null;
    if (s.variant !== undefined && (section.type !== 'custom_reviews' || !testimonialVariants.includes(s.variant as TestimonialVariant))) return null;
    const validImage = (image: unknown) => object(image) && (landingUrl(image.url) || Number.isSafeInteger(image.media_id) && Number(image.media_id) > 0) && (image.alt === undefined || typeof image.alt === 'string');
    if (s.image !== undefined && !validImage(s.image)) return null;
    if (s.background_image !== undefined && !validImage(s.background_image)) return null;
    if (s.images !== undefined && (!Array.isArray(s.images) || s.images.length > 30 || !s.images.every(validImage))) return null;
    if (s.items !== undefined && (!Array.isArray(s.items) || s.items.length > 30 || !s.items.every((item) => object(item) && ['title', 'text', 'html', 'icon', 'author', 'caption', 'platform'].every(key => item[key] === undefined || typeof item[key] === 'string') && (item.date === undefined || item.date === null || typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)) && (item.image === undefined || validImage(item.image)) && (item.url === undefined || item.url === '' || landingUrl(item.url)) && (item.rating === undefined || typeof item.rating === 'number' && Number.isFinite(item.rating))))) return null;
  }
  return { ...value, sections: value.sections.map(section => ({ ...section, settings: object(section.settings) ? section.settings : {} })) } as unknown as LandingDocument;
}

export function moveLanding(sections: LandingSection[], id: string, delta: number): LandingSection[] {
  const index = sections.findIndex(section => section.id === id); const target = index + delta;
  if (index < 0 || target < 0 || target >= sections.length) return sections;
  const next = [...sections]; const [section] = next.splice(index, 1); if (section) next.splice(target, 0, section); return next;
}
