/** Rouge Avatar — a round image or initials chip (reviews, account). */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar(props: AvatarProps): ReactElement {
  const { name, src, size = 'md', className } = props;
  return (
    <span className={cn('rge-avatar', `rge-avatar--${size}`, className)} aria-hidden>
      {src ? <img className="rge-avatar__img" src={src} alt="" loading="lazy" decoding="async" /> : <span>{initials(name)}</span>}
    </span>
  );
}
