/**
 * video — a YouTube/Vimeo embed or a direct MP4 with a poster. Third-party iframes load only after
 * the visitor presses play (poster first), so the page stays fast and cookie-free by default.
 */
import { useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, spacingFields, tr } from '../schema';
import { bool, spacingStyle, str, useSectionSettings } from '../use-section';
import { LibImage, LibSection } from '../primitives';
import { useLibT } from '../i18n';

export const videoSchema = defineSection({
  type: 'video',
  label: 'Video',
  description: 'A YouTube, Vimeo or MP4 video with a cover image.',
  category: 'content',
  icon: 'HiOutlinePlayCircle',
  settings: [
    fields.text('heading', 'Heading', tr('شاهد قصتنا', 'Watch our story'), { translatable: true }),
    fields.text('text', 'Text', ''),
    fields.url('url', 'Video URL', 'https://www.youtube.com/watch?v=ysz5S6PUM-U'),
    fields.image('poster', 'Cover image', 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1600&h=900&q=80'),
    fields.select('aspect', 'Ratio', [{ value: 'wide', label: '16:9' }, { value: 'landscape', label: '4:3' }, { value: 'square', label: '1:1' }], 'wide'),
    fields.toggle('autoplay', 'Autoplay (muted, MP4 only)', false),
    fields.toggle('loop', 'Loop', false),
    fields.select('width', 'Width', [{ value: 'narrow', label: 'Narrow' }, { value: 'wide', label: 'Full container' }], 'wide'),
    ...spacingFields(),
  ],
});

/** Turn a watch URL into an embed URL; null for a direct file. */
function embedUrl(url: string, autoplay: boolean, loop: boolean): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com') {
      const id = host === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? '';
      if (!id) return null;
      const q = new URLSearchParams({ autoplay: '1', rel: '0', ...(loop ? { loop: '1', playlist: id } : {}), ...(autoplay ? { mute: '1' } : {}) });
      return `https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`;
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop() ?? '';
      if (!id) return null;
      return `https://player.vimeo.com/video/${id}?autoplay=1${loop ? '&loop=1' : ''}${autoplay ? '&muted=1' : ''}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function Video(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(videoSchema, props.settings);
  const t = useLibT();
  const url = str(s, 'url');
  const [playing, setPlaying] = useState(false);
  if (!url) return null;
  const autoplay = bool(s, 'autoplay');
  const loop = bool(s, 'loop');
  const embed = embedUrl(url, autoplay, loop);
  const isFile = !embed && /\.(mp4|webm|ogg)(\?|$)/i.test(url);
  const showPlayer = playing || (isFile && autoplay);

  return (
    <LibSection title={str(s, 'heading')} subtitle={str(s, 'text')} align="center" narrow={str(s, 'width') === 'narrow'} style={spacingStyle(s)}>
      <div className={cn('lib-video', `lib-ratio lib-ratio--${str(s, 'aspect', 'wide')}`)}>
        {showPlayer && embed ? (
          <iframe className="lib-video__frame" src={embed} title={str(s, 'heading') || 'Video'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : showPlayer && isFile ? (
          <video className="lib-video__frame" src={url} poster={str(s, 'poster') || undefined} controls autoPlay={autoplay} muted={autoplay} loop={loop} playsInline />
        ) : (
          <button type="button" className="lib-video__poster" onClick={() => setPlaying(true)} aria-label={t('play')}>
            <LibImage src={str(s, 'poster')} alt="" className="lib-video__img" />
            <span className="lib-video__play" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </button>
        )}
      </div>
    </LibSection>
  );
}
