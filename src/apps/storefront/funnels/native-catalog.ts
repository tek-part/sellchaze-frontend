type CatalogLocation = Pick<Location, 'pathname' | 'search'>;
const keys = new Set(['glasses-ar', 'glasses-en', 'hair-revive-ar', 'hair-revive-en', 'litter-robot-ar', 'litter-robot-en', 'electric-biker-ar', 'electric-biker-en', 'hair-care-ar', 'hair-care-en', 'skin-care-ar', 'skin-care-en', 'writing-board-ar', 'writing-board-en']);

/** Only the explicitly marked public catalog can warm demo assets. Merchant pages stay authoritative. */
export function nativeCatalogKey(location: CatalogLocation): string | null {
  const params = new URLSearchParams(location.search);
  const match = /^\/funnel-templates\/([^/]+)\/?$/.exec(location.pathname);
  return params.get('preview') === '1' && !params.has('__preview') && !params.has('customize') && match?.[1] && keys.has(match[1]) ? match[1] : null;
}

export function loadNativeCatalogPreview(key: string) {
  if (key === 'glasses-ar' || key === 'glasses-en') return import('./GlassesFunnel').then(m => ({ default: m.GlassesTemplatePreview }));
  if (key === 'hair-revive-ar' || key === 'hair-revive-en') return import('./HairReviveFunnel').then(m => ({ default: m.HairTemplatePreview }));
  if (key === 'litter-robot-ar' || key === 'litter-robot-en') return import('./LitterRobotFunnel').then(m => ({ default: m.LitterTemplatePreview }));
  if (key === 'electric-biker-ar' || key === 'electric-biker-en') return import('./ElectricBikerFunnel').then(m => ({ default: m.ElectricTemplatePreview }));
  if (key === 'hair-care-ar' || key === 'hair-care-en') return import('./HairCareFunnel').then(m => ({ default: m.HairCareTemplatePreview }));
  if (key === 'skin-care-ar' || key === 'skin-care-en') return import('./SkinCareFunnel').then(m => ({ default: m.SkinCareTemplatePreview }));
  if (key === 'writing-board-ar' || key === 'writing-board-en') return import('./WritingBoardFunnel').then(m => ({ default: m.WritingBoardTemplatePreview }));
  return Promise.reject(new Error('Unknown native catalog preview'));
}

export function warmNativeCatalogPreview(location: CatalogLocation): void {
  const key = nativeCatalogKey(location);
  if (!key) return;
  // Start the route module/CSS in parallel with store bootstrap instead of after React routing.
  void loadNativeCatalogPreview(key).catch(() => { /* The routed lazy boundary handles load failures. */ });
  if (key.startsWith('litter-robot-') || key.startsWith('electric-biker-') || key.startsWith('hair-care-') || key.startsWith('skin-care-') || key.startsWith('writing-board-')) {
    const image = document.createElement('link');
    image.rel = 'preload'; image.as = 'image'; image.href = key.startsWith('writing-board-') ? '/media/funnel-campaigns/writing-board-hero-v1.webp' : key.startsWith('skin-care-') ? '/media/funnel-campaigns/skin-care-hero-v1.webp' : key.startsWith('hair-care-') ? '/media/funnel-campaigns/hair-care-hero-v1.webp' : key.startsWith('electric-biker-') ? '/media/funnel-campaigns/electric-biker-hero-v1.webp' : '/media/funnel-campaigns/litter-robot-hero-v1.webp';
    image.fetchPriority = 'high'; document.head.appendChild(image);
  }
}
