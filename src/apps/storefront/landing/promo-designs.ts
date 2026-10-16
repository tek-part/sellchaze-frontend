import type { BannerVariant, LandingSettings } from './document';

export const promoDesigns: { id: BannerVariant; name: string; count: number }[] = [
  { id: 'banners-1', name: 'صورتان متساويتان', count: 2 },
  { id: 'banners-2', name: 'صورة عريضة وصورتان جانبيتان', count: 3 },
  { id: 'banners-3', name: 'شبكة أربع صور', count: 4 },
  { id: 'banners-4', name: 'صورة طويلة في المنتصف', count: 5 },
  { id: 'banners-5', name: 'صور عريضة بالتبادل', count: 4 },
  { id: 'banners-6', name: 'صورتان ولافتة عريضة', count: 3 },
  { id: 'banners-7', name: 'ثلاث صور وصورتان', count: 5 },
  { id: 'banners-8', name: 'صورة طويلة وشبكة جانبية', count: 4 },
  { id: 'banners-9', name: 'لافتة عريضة وثلاث صور', count: 4 },
];
export const promoDesign = (id: BannerVariant) => promoDesigns.find(design => design.id === id) ?? promoDesigns[0]!;
export const promoDefaults = (variant: BannerVariant): LandingSettings => ({ variant, align: 'center', background: '#ffffff', foreground: '#111827', padding: 24 });
