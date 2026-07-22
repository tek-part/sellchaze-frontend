/**
 * Rouge ShareButton — native share where available, else copy-to-clipboard. Reports the outcome so
 * the caller can raise a toast. Rendered as a tertiary link button.
 */
import { type ReactElement } from 'react';
import { IconShare } from './icons';

export type ShareResult = 'shared' | 'copied' | 'error';

export interface ShareButtonProps {
  url: string;
  title: string;
  label?: string;
  onResult?: (result: ShareResult) => void;
  className?: string;
}

export function ShareButton(props: ShareButtonProps): ReactElement {
  const { url, title, label = 'Share', onResult, className } = props;

  const onClick = async (): Promise<void> => {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    try {
      if (nav && typeof nav.share === 'function') {
        await nav.share({ title, url });
        onResult?.('shared');
        return;
      }
      if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
        await nav.clipboard.writeText(url);
        onResult?.('copied');
        return;
      }
      onResult?.('error');
    } catch {
      onResult?.('error');
    }
  };

  return (
    <button type="button" className={`rge-linkbtn ${className ?? ''}`.trim()} onClick={() => void onClick()}>
      <IconShare className="rge-linkbtn__icon" width={16} height={16} />
      <span>{label}</span>
    </button>
  );
}
