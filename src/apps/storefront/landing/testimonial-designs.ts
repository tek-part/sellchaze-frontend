import type { LandingItem, LandingSettings, TestimonialVariant } from './document';

export const testimonialDesigns = [
  { id: 'testimonials-1', name: 'بطاقات بالاسم والصورة', accent: '#16a34a', align: 'start', carousel: true, columns: 3 },
  { id: 'testimonials-2', name: 'اقتباسات في المنتصف', accent: '#22c55e', align: 'center', carousel: false, columns: 3 },
  { id: 'testimonials-3', name: 'بطاقة وسطى بارزة', accent: '#b8204c', align: 'center', carousel: false, columns: 3 },
  { id: 'testimonials-4', name: 'تقييمات بمنصة المصدر', accent: '#111827', align: 'start', carousel: true, columns: 3 },
  { id: 'testimonials-5', name: 'أربع بطاقات ناعمة', accent: '#22c55e', align: 'start', carousel: false, columns: 4 },
  { id: 'testimonials-6', name: 'صفّان متحركان', accent: '#111827', align: 'center', carousel: false, columns: 3 },
  { id: 'testimonials-7', name: 'بطاقات عريضة ملوّنة', accent: '#4a7bea', align: 'start', carousel: true, columns: 2 },
  { id: 'testimonials-8', name: 'شبكة بظل متدرّج', accent: '#111827', align: 'center', carousel: false, columns: 2 },
  { id: 'testimonials-9', name: 'صور بارزة أعلى البطاقات', accent: '#22c55e', align: 'center', carousel: true, columns: 3 },
  { id: 'testimonials-10', name: 'فقاعات باقتباس داكن', accent: '#171717', align: 'center', carousel: false, columns: 3 },
  { id: 'testimonials-11', name: 'فقاعتان وبيانات العميل', accent: '#2ed4a0', align: 'center', carousel: false, columns: 2 },
] as const;

export function testimonialDesign(variant?: TestimonialVariant) {
  return testimonialDesigns.find(design => design.id === variant) ?? testimonialDesigns[0];
}
export function testimonialDefaults(variant: TestimonialVariant): Partial<LandingSettings> {
  const design = testimonialDesign(variant);
  return { variant, accent: design.accent, align: design.align, foreground: '#111827', background: variant === 'testimonials-6' ? '#f5f4fa' : '#ffffff', card_background: ['testimonials-5', 'testimonials-10', 'testimonials-11'].includes(variant) ? '#f4f3f8' : '#ffffff' };
}

/** Editor-only content. Applying a design never persists these example testimonials. */
export function testimonialExamples(variant: TestimonialVariant): LandingItem[] {
  const counts: Record<TestimonialVariant, number> = { 'testimonials-1': 5, 'testimonials-2': 3, 'testimonials-3': 3, 'testimonials-4': 5, 'testimonials-5': 4, 'testimonials-6': 6, 'testimonials-7': 4, 'testimonials-8': 4, 'testimonials-9': 5, 'testimonials-10': 3, 'testimonials-11': 2 };
  return Array.from({ length: counts[variant] }, (_, index) => ({ author: `اسم العميل ${index + 1}`, title: ['testimonials-1', 'testimonials-7'].includes(variant) ? 'عنوان التقييم' : '', text: 'يظهر نص تقييم العميل هنا. أضف آراء عملائك وصورهم وبياناتهم من إعدادات القسم لعرضها في صفحة المنتج.', date: '2026-01-01', ...(variant === 'testimonials-4' ? { platform: index % 2 ? 'Google' : 'Facebook', caption: 'صفة العميل' } : {}) }));
}
