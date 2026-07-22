/**
 * Avatar — customer / reviewer identity. Round with a hairline ring; serif initials fallback on
 * --surface-2 when there's no image. Sizes 24 / 32 / 48. AvatarStack overlaps a group. See §32.6.
 */
import { useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  src?: string;
  /** Full name — drives the alt text and the initials fallback. */
  name?: string;
  size?: AvatarSize;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar(props: AvatarProps): ReactElement {
  const { src, name, size = 'md', className } = props;
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn('sf-avatar', `sf-avatar--${size}`, className)}
      role="img"
      aria-label={name || 'Avatar'}
    >
      {showImage ? (
        <img className="sf-avatar__img" src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden>{name ? initials(name) : ''}</span>
      )}
    </span>
  );
}

export interface AvatarStackProps {
  className?: string;
  children: ReactNode;
}

export function AvatarStack(props: AvatarStackProps): ReactElement {
  return <span className={cn('sf-avatar-stack', props.className)}>{props.children}</span>;
}
