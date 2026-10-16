import type { LandingImage, LandingItem } from './document';

export type ProductPresetKind = 'html' | 'advanced' | 'features' | 'reviews' | 'faq' | 'purchase' | 'gallery' | 'video' | 'countdown' | 'testimonials' | 'text';
export interface ProductPresetRegion {
  templates: string[];
  indices: number[];
  kind: 'items' | 'images';
}
/** Generated layout geometry contains no reference merchant copy or photographs. */
export interface ProductPresetFragment {
  id: string;
  page: string;
  kind: ProductPresetKind;
  html: string;
  css: string;
  regions: ProductPresetRegion[];
  richTemplate?: string;
  title: boolean;
  description: boolean;
  image: boolean;
  purchase: boolean;
  itemCount: number;
  imageCount: number;
  pageStyle: boolean;
  background?: string;
  titleColor?: string;
  descriptionColor?: string;
  width: number;
  height: number;
}
export interface ProductPagePreset {
  id: string;
  name: string;
  mode: 'standalone' | 'below';
  fragments: string[];
}
export interface ProductPresetContent {
  title?: string;
  description?: string;
  html?: string;
  caption?: string;
  button_text?: string;
  image?: LandingImage;
  images?: LandingImage[];
  items?: LandingItem[];
}
