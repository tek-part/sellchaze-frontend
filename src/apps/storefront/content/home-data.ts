/**
 * Shared home/content data contract. The editable `home` content page (and `about` testimonials)
 * plus the merchandising APIs (brands, coupons, collections) are normalised here into plain
 * view-models, packed into `context.data` by HomePage, and read back by every theme's content
 * sections via the `*From(context)` helpers. This is the single bridge that lets each theme's
 * Hero / WhyChooseUs / Testimonials / BrandLogos / Coupons / Editorial / UGC / Newsletter sections
 * render real, merchant-editable data instead of hardcoded settings.
 */
import type { StorefrontContext } from '../theme-engine/rendering';
import type { BrandModel, CollectionCardModel, CouponModel, ReviewModel } from '../types/catalog';
import { toBrand, toCollectionCard, toCoupon } from '../api/mappers';
import type { ApiBrand, ApiCollection, ApiCoupon } from '../api/types';

export interface HeroContent {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  cta2Label?: string;
  cta2Url?: string;
  image?: string;
}
export interface SlideContent {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  image?: string;
}
export interface WhyItem {
  title: string;
  text: string;
}
export interface EditorialContent {
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  image?: string;
}
export interface UgcItem {
  image: string;
  url?: string;
}
export interface UgcContent {
  handle?: string;
  images: ReadonlyArray<UgcItem>;
}
export interface NewsletterContent {
  title?: string;
  text?: string;
  cta?: string;
}
export interface HomeSectionTitles {
  collections?: string;
  brands?: string;
  why?: string;
  ugc?: string;
}
/** Testimonials are carried in the shared ReviewModel shape so every theme (incl. luxury's
 *  `testimonialsFor`, which expects ReviewModel) reads them without conversion. */
export type TestimonialContent = ReviewModel;
export interface FaqItem {
  question: string;
  answer: string;
}

export interface HomeExtras {
  hero: HeroContent;
  slides: ReadonlyArray<SlideContent>;
  whyChooseUs: ReadonlyArray<WhyItem>;
  editorial: EditorialContent;
  ugc: UgcContent;
  newsletter: NewsletterContent;
  sectionTitles: HomeSectionTitles;
  brands: ReadonlyArray<BrandModel>;
  coupons: ReadonlyArray<CouponModel>;
  testimonials: ReadonlyArray<TestimonialContent>;
  featuredCollections: ReadonlyArray<CollectionCardModel>;
  faq: ReadonlyArray<FaqItem>;
  faqHeading?: string;
}

/* ---------- builders (raw content/API → normalised) ---------- */

type Raw = Record<string, unknown> | null | undefined;

function str(o: Raw, k: string): string | undefined {
  const v = o?.[k];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}
function list(o: Raw, k: string): ReadonlyArray<Record<string, unknown>> {
  const v = o?.[k];
  return Array.isArray(v) ? (v as ReadonlyArray<Record<string, unknown>>) : [];
}

export function buildHomeExtras(
  home: Raw,
  about: Raw,
  brands: ReadonlyArray<ApiBrand>,
  coupons: ReadonlyArray<ApiCoupon>,
  collections: ReadonlyArray<ApiCollection>,
  faqContent?: Raw,
): HomeExtras {
  const hero: HeroContent = {
    ...opt('eyebrow', str(home, 'hero_eyebrow')),
    ...opt('heading', str(home, 'hero_heading')),
    ...opt('subheading', str(home, 'hero_subheading')),
    ...opt('ctaLabel', str(home, 'hero_cta_label')),
    ...opt('ctaUrl', str(home, 'hero_cta_url')),
    ...opt('cta2Label', str(home, 'hero_cta2_label')),
    ...opt('cta2Url', str(home, 'hero_cta2_url')),
    ...opt('image', str(home, 'hero_image')),
  };
  const slides = list(home, 'slides')
    .map((s) => ({
      ...opt('eyebrow', str(s, 'eyebrow')),
      ...opt('heading', str(s, 'heading')),
      ...opt('subheading', str(s, 'subheading')),
      ...opt('ctaLabel', str(s, 'cta_label')),
      ...opt('ctaUrl', str(s, 'cta_url')),
      ...opt('image', str(s, 'image')),
    }))
    .filter((s) => s.heading);
  const whyChooseUs = list(home, 'why_choose_us')
    .map((w) => ({ title: str(w, 'title') ?? '', text: str(w, 'text') ?? '' }))
    .filter((w) => w.title);
  const editorial: EditorialContent = {
    ...opt('eyebrow', str(home, 'editorial_eyebrow')),
    ...opt('heading', str(home, 'editorial_heading')),
    ...opt('body', str(home, 'editorial_body')),
    ...opt('ctaLabel', str(home, 'editorial_cta_label')),
    ...opt('ctaUrl', str(home, 'editorial_cta_url')),
    ...opt('image', str(home, 'editorial_image')),
  };
  const ugc: UgcContent = {
    ...opt('handle', str(home, 'ugc_handle')),
    images: list(home, 'ugc')
      .map((u) => ({ image: str(u, 'image') ?? '', ...opt('url', str(u, 'url')) }))
      .filter((u) => u.image),
  };
  const newsletter: NewsletterContent = {
    ...opt('title', str(home, 'newsletter_title')),
    ...opt('text', str(home, 'newsletter_text')),
    ...opt('cta', str(home, 'newsletter_cta')),
  };
  const sectionTitles: HomeSectionTitles = {
    ...opt('collections', str(home, 'collections_heading')),
    ...opt('brands', str(home, 'brands_heading')),
    ...opt('why', str(home, 'why_heading')),
    ...opt('ugc', str(home, 'ugc_heading')),
  };
  const testimonials: ReviewModel[] = list(about, 'testimonials')
    .map((t, i) => ({ id: `t${i}`, author: str(t, 'author') ?? 'Verified buyer', rating: 5, body: str(t, 'quote') ?? '' }))
    .filter((t) => t.body);
  const faq = list(faqContent, 'items')
    .map((f) => ({ question: str(f, 'question') ?? '', answer: str(f, 'answer') ?? '' }))
    .filter((f) => f.question && f.answer);

  return {
    hero,
    slides,
    whyChooseUs,
    editorial,
    ugc,
    newsletter,
    sectionTitles,
    brands: brands.map(toBrand),
    coupons: coupons.map(toCoupon),
    testimonials,
    featuredCollections: collections.map(toCollectionCard),
    faq,
    ...opt('faqHeading', str(faqContent, 'heading')),
  };
}

/** Drop undefined-valued keys so exactOptionalPropertyTypes stays happy. */
function opt<T>(key: string, value: T | undefined): Record<string, T> {
  return value === undefined ? {} : { [key]: value };
}

/* ---------- readers (context.data → view-models), theme-agnostic ---------- */

interface HomeBag {
  hero?: HeroContent;
  slides?: ReadonlyArray<SlideContent>;
  whyChooseUs?: ReadonlyArray<WhyItem>;
  editorial?: EditorialContent;
  ugc?: UgcContent;
  newsletter?: NewsletterContent;
  sectionTitles?: HomeSectionTitles;
  brands?: ReadonlyArray<BrandModel>;
  coupons?: ReadonlyArray<CouponModel>;
  testimonials?: ReadonlyArray<TestimonialContent>;
  featuredCollections?: ReadonlyArray<CollectionCardModel>;
  faq?: ReadonlyArray<FaqItem>;
  faqHeading?: string;
}
function bag(context: StorefrontContext): HomeBag {
  return context.data as HomeBag;
}

export const heroFrom = (c: StorefrontContext): HeroContent => bag(c).hero ?? {};
export const slidesFrom = (c: StorefrontContext): ReadonlyArray<SlideContent> => bag(c).slides ?? [];
export const whyChooseUsFrom = (c: StorefrontContext): ReadonlyArray<WhyItem> => bag(c).whyChooseUs ?? [];
export const editorialFrom = (c: StorefrontContext): EditorialContent => bag(c).editorial ?? {};
export const ugcFrom = (c: StorefrontContext): UgcContent => bag(c).ugc ?? { images: [] };
export const newsletterFrom = (c: StorefrontContext): NewsletterContent => bag(c).newsletter ?? {};
export const sectionTitlesFrom = (c: StorefrontContext): HomeSectionTitles => bag(c).sectionTitles ?? {};
export const brandsFrom = (c: StorefrontContext): ReadonlyArray<BrandModel> => bag(c).brands ?? [];
export const couponsFrom = (c: StorefrontContext): ReadonlyArray<CouponModel> => bag(c).coupons ?? [];
export const testimonialsFrom = (c: StorefrontContext): ReadonlyArray<TestimonialContent> => bag(c).testimonials ?? [];
export const featuredCollectionsFrom = (c: StorefrontContext): ReadonlyArray<CollectionCardModel> => bag(c).featuredCollections ?? [];
export const faqFrom = (c: StorefrontContext): ReadonlyArray<FaqItem> => bag(c).faq ?? [];
export const faqHeadingFrom = (c: StorefrontContext): string | undefined => bag(c).faqHeading;
