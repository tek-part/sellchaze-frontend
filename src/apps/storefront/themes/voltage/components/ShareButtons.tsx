/**
 * Voltage ShareButtons — share the current product via the Web Share API where available, else a
 * copy-link fallback with a transient "Copied" state. Voltage's own mono chip row.
 */
import { useState, type ReactElement } from 'react';
import { useToast } from './toast/toast-context';

export interface ShareButtonsProps {
  title: string;
  url: string;
}

function absoluteUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return url;
  }
}

export function ShareButtons(props: ShareButtonsProps): ReactElement {
  const { title, url } = props;
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const href = absoluteUrl(url);

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  const share = async (): Promise<void> => {
    if (nav?.share) {
      try {
        await nav.share({ title, url: href });
      } catch {
        /* user dismissed — no-op */
      }
      return;
    }
    await copy();
  };

  const copy = async (): Promise<void> => {
    try {
      await nav?.clipboard?.writeText(href);
      setCopied(true);
      toast.notify('Link copied', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.notify('Could not copy link', 'danger');
    }
  };

  return (
    <div className="vlt-share">
      <span className="vlt-share__label">Share</span>
      {nav?.share ? (
        <button type="button" className="vlt-share__btn" onClick={() => void share()}>Share…</button>
      ) : null}
      <a className="vlt-share__btn" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(href)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer">X</a>
      <a className="vlt-share__btn" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(href)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
      <button type="button" className="vlt-share__btn" onClick={() => void copy()}>{copied ? 'Copied ✓' : 'Copy link'}</button>
    </div>
  );
}
