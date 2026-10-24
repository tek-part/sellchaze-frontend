/**
 * Resized WebP copies of images on the Sellchaze storage disk (served from /storage/_img/w{width}/…).
 * The backend renders a width once and Apache serves it as a cached static file afterwards; this
 * module only builds URLs. It mirrors App\Services\Media\ImageDerivatives — keep the ladder in sync.
 * Images from elsewhere (other hosts, GIFs, SVGs) are returned unchanged.
 */
export const IMAGE_WIDTHS: ReadonlyArray<number> = [160, 320, 480, 640, 800, 960, 1280, 1600, 1920];
const LARGEST_WIDTH = 1920;

const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1600];
const STORAGE_PATH = /^\/storage\/(?!_img\/)([A-Za-z0-9_\-./%]+\.(?:png|jpe?g|webp))$/i;

function trustedHosts(): Set<string> {
  const hosts = new Set<string>(['api.sellchaze.com']);
  if (typeof window !== 'undefined') hosts.add(window.location.host);
  const api = import.meta.env.VITE_API_URL as string | undefined;
  if (api) {
    try { hosts.add(new URL(api).host); } catch { /* ignore malformed env */ }
  }
  return hosts;
}

export function snapWidth(width: number): number {
  return IMAGE_WIDTHS.find((candidate) => candidate >= width) ?? LARGEST_WIDTH;
}

function parse(src: string | undefined): { origin: string; path: string } | null {
  if (!src) return null;
  try {
    const url = new URL(src, typeof window !== 'undefined' ? window.location.href : 'https://api.sellchaze.com');
    const path = STORAGE_PATH.exec(url.pathname)?.[1];
    if (!path || url.search || !trustedHosts().has(url.host) || path.includes('..')) return null;
    return { origin: url.origin, path };
  } catch {
    return null;
  }
}

/** URL of the image at (at least) `width` pixels wide, or the original when it cannot be resized. */
export function sizedImage(src: string | undefined, width: number): string | undefined {
  const parsed = parse(src);
  return parsed ? `${parsed.origin}/storage/_img/w${snapWidth(width)}/${parsed.path}.webp` : src;
}

/** src + srcSet for a responsive <img>/<source>; srcSet is omitted for images we cannot resize. */
export function responsiveImage(src: string | undefined, widths: ReadonlyArray<number> = DEFAULT_WIDTHS): { src?: string; srcSet?: string } {
  const parsed = parse(src);
  if (!parsed) return { src };
  const ladder = [...new Set(widths.map(snapWidth))].sort((a, b) => a - b);
  const url = (w: number) => `${parsed.origin}/storage/_img/w${w}/${parsed.path}.webp`;
  const fallback = ladder[Math.min(2, ladder.length - 1)] ?? LARGEST_WIDTH;
  return { src: url(fallback), srcSet: ladder.map((w) => `${url(w)} ${w}w`).join(', ') };
}

/** Fixed-size images (logos, avatars): 1x and 2x density candidates. */
export function densityImage(src: string | undefined, cssWidth: number): { src?: string; srcSet?: string } {
  const parsed = parse(src);
  if (!parsed) return { src };
  const one = sizedImage(src, cssWidth);
  const two = sizedImage(src, cssWidth * 2);
  return { src: one, srcSet: `${one} 1x, ${two} 2x` };
}

/** srcSet for a full-width mobile art-direction <source>; falls back to the original URL. */
export function mobileSrcSet(src: string | undefined): string | undefined {
  return responsiveImage(src, [480, 800, 1280]).srcSet ?? src;
}
