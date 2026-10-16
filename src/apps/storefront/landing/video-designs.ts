import type { LandingSettings, VideoVariant } from './document';

export const videoDesigns: { id: VideoVariant; name: string; kind: string }[] = [
  { id: 'video-1', name: 'فيديو عريض بإطار ملون', kind: 'framed' },
  { id: 'video-2', name: 'فيديو بخلفية متداخلة', kind: 'offset' },
  { id: 'video-3', name: 'فيديو مع بطاقات المزايا', kind: 'benefits' },
  { id: 'video-4', name: 'فيديو بجانب النص وزر الشراء', kind: 'split' },
  { id: 'video-5', name: 'فيديو رأسي', kind: 'portrait' },
];
export const videoDesign = (id?: string) => videoDesigns.find(d => d.id === id) ?? videoDesigns[0]!;
export const videoDefaults = (id: VideoVariant): Partial<LandingSettings> => ({ variant: id });
