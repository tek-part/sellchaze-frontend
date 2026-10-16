import { landingUrl } from './document';

export function landingVideoSource(url?: string): { kind: 'file' | 'embed'; src: string } | null {
  if (!url || !landingUrl(url)) return null;
  if (/\.mp4(?:[?#]|$)/i.test(url)) return { kind: 'file', src: url };
  let parsed: URL; try { parsed = new URL(url); } catch { return null; }
  const host = parsed.hostname.toLowerCase();
  if (['youtu.be', 'www.youtu.be', 'youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    const id = host.endsWith('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v') ?? parsed.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) return { kind: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` };
  } else if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    const id = parsed.pathname.match(/(?:\/video)?\/(\d+)$/)?.[1];
    if (id) return { kind: 'embed', src: `https://player.vimeo.com/video/${id}` };
  }
  return null;
}

export function LandingVideo({ url, title }: { url?: string; title: string }) {
  const source = landingVideoSource(url);
  if (!source) return null;
  return source.kind === 'file' ? <video src={source.src} controls playsInline preload="metadata" aria-label={title} /> : <iframe className="sf-landing-video" title={title} src={source.src} loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" allow="fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />;
}
