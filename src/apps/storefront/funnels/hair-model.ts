/** Only known video providers are embedded; arbitrary campaign URLs remain video files. */
export function hairVideoEmbed(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const youtube = ['youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname);
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : youtube ? (url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.startsWith('/embed/') ? url.pathname.slice(7) : null) : null;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  } catch { return null; }
}

export function hairVideoFile(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && /\.(mp4|webm|ogv)$/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
