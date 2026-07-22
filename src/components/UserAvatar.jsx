import { useState } from 'react';

function initialsFromName(name) {
    if (!name || typeof name !== 'string') {
        return '?';
    }
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

/**
 * @param {{ user: { name?: string; avatar?: string | null; avatar_url?: string | null }; sizeClass?: string; className?: string; alt?: string }} props
 */
export default function UserAvatar({ user, sizeClass = 'h-9 w-9', className = '', alt = '' }) {
    const [failed, setFailed] = useState(false);
    const raw = user?.avatar_url || user?.avatar;
    const src = raw && !failed ? raw : null;

    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                onError={() => setFailed(true)}
                className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-white shadow-xs ${className}`.trim()}
            />
        );
    }

    const initials = initialsFromName(user?.name);

    return (
        <div
            className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand to-accent text-xs font-bold text-white shadow-xs ring-2 ring-white ${className}`.trim()}
            aria-hidden={!alt}
        >
            {initials}
        </div>
    );
}
