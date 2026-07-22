/**
 * ShareButton — shares the current product/page. Uses the native Web Share sheet where available,
 * otherwise copies the URL to the clipboard and reports it via `onResult` so the caller can raise a
 * single calm confirmation (toast). Never fabricates success.
 */
import { useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconShare } from './icons';

export type ShareOutcome = 'shared' | 'copied' | 'unsupported' | 'error';

export interface ShareButtonProps {
  url: string;
  title?: string;
  text?: string;
  onResult?: (outcome: ShareOutcome) => void;
  labelledText?: string;
  className?: string;
}

export function ShareButton(props: ShareButtonProps): ReactElement {
  const { url, title, text, onResult, labelledText, className } = props;
  const [busy, setBusy] = useState(false);

  const handleShare = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
      };
      if (typeof nav.share === 'function') {
        await nav.share({ url, title, text });
        onResult?.('shared');
      } else if (nav.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
        onResult?.('copied');
      } else {
        onResult?.('unsupported');
      }
    } catch (err) {
      // AbortError = the user dismissed the native sheet; not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      onResult?.('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={labelledText ? undefined : 'Share'}
      title="Share"
      disabled={busy}
      className={cn('sf-icon-btn', className)}
      onClick={() => void handleShare()}
    >
      <IconShare aria-hidden />
      {labelledText ? <span className="sf-share__text">{labelledText}</span> : null}
    </button>
  );
}
