import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { wavexMediaNeedsProxy } from '../wavexHelpers';

/** Message attachments (image, video, audio, file) — fetched through the API proxy when the host requires it. */
function useWavexMediaSrc(url) {
    const [blobSrc, setBlobSrc] = useState(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setBlobSrc(null);
        setFailed(false);
        if (!url || !wavexMediaNeedsProxy(url)) {
            return undefined;
        }
        let cancelled = false;
        let objectUrl = null;
        api.get('/wavex/chats/media/proxy', { params: { url }, responseType: 'blob' })
            .then((res) => {
                if (cancelled) {
                    return;
                }
                objectUrl = URL.createObjectURL(res.data);
                setBlobSrc(objectUrl);
            })
            .catch(() => {
                if (!cancelled) {
                    setFailed(true);
                }
            });
        return () => {
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [url]);

    return { blobSrc, failed };
}

export function ThreadMediaImage({ url, thumb, className, alt }) {
    const { blobSrc, failed } = useWavexMediaSrc(url);
    const needProxy = Boolean(url && wavexMediaNeedsProxy(url));
    const thumbOk = typeof thumb === 'string' && thumb.startsWith('data:');

    if (!url && !thumbOk) {
        return null;
    }

    // If no URL but we have a thumbnail, display it directly
    if (!url && thumbOk) {
        return (
            <img src={thumb} alt={alt || 'media'} className={className} />
        );
    }

    if (!needProxy && url) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
                <img
                    src={url}
                    alt={alt}
                    className={className}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                        if (!e.target.dataset.proxied) {
                            e.target.dataset.proxied = '1';
                            const base = api.defaults.baseURL || '/api/v1';
                            const token = localStorage.getItem('sellchase_access_token') || '';
                            e.target.src = `${base}/wavex/chats/media/proxy?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`;
                        }
                    }}
                />
            </a>
        );
    }

    // Never upscale thumbnail when a full URL exists: wait for full media/proxy first.
    if (needProxy && url && !blobSrc && !failed) {
        return (
            <div
                className={`${className} mb-0 min-h-[220px] animate-pulse rounded-2xl bg-slate-200/70`}
                aria-hidden
            />
        );
    }

    if (needProxy && url && !blobSrc && failed) {
        if (thumbOk) {
            return <img src={thumb} alt={alt} className={className} />;
        }
        return (
            <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
                <img src={url} alt={alt} className={className} referrerPolicy="no-referrer" />
            </a>
        );
    }

    const src = blobSrc || (!url && thumbOk ? thumb : null);
    if (!src) {
        return thumbOk && !url ? (
            <img src={thumb} alt={alt} className={className} />
        ) : (
            <p className="mb-1 text-xs text-slate-500">Media unavailable</p>
        );
    }

    const openHref = blobSrc || url || src;
    return (
        <a href={openHref} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
            <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" />
        </a>
    );
}

export function ThreadMediaVideo({ url, thumb, className }) {
    const { blobSrc, failed } = useWavexMediaSrc(url);
    const needProxy = Boolean(url && wavexMediaNeedsProxy(url));
    const thumbOk = typeof thumb === 'string' && thumb.startsWith('data:');
    if (!url && !thumbOk) {
        return null;
    }
    if (!url && thumbOk) {
        return <img src={thumb} alt="video thumbnail" className={className} />;
    }
    if (!needProxy) {
        return (
            <video
                src={url}
                controls
                className={className}
                referrerPolicy="no-referrer"
                onError={(e) => {
                    if (!e.target.dataset.proxied) {
                        e.target.dataset.proxied = '1';
                        e.target.src = `${api.defaults.baseURL || "/api/v1"}/wavex/chats/media/proxy?url=${encodeURIComponent(url)}&token=${localStorage.getItem("sellchase_access_token") || ""}`;
                    }
                }}
            />
        );
    }
    if (!blobSrc && !failed) {
        return (
            <div
                className={`${className} mb-0 min-h-[220px] animate-pulse rounded-2xl bg-slate-800/25`}
                aria-hidden
            />
        );
    }
    if (!blobSrc) {
        if (url) {
            return <video src={url} controls className={className} referrerPolicy="no-referrer" />;
        }
        return thumbOk ? <img src={thumb} alt="video thumbnail" className={className} /> : <p className="mb-1 text-xs text-slate-500">Video unavailable</p>;
    }
    return <video src={blobSrc} controls className={className} />;
}

export function ThreadMediaAudio({ url, className }) {
    const { blobSrc, failed } = useWavexMediaSrc(url);
    const needProxy = Boolean(url && wavexMediaNeedsProxy(url));
    if (!url) {
        return null;
    }
    if (!needProxy) {
        return (
            <audio
                src={url}
                controls
                className={className}
                onError={(e) => {
                    if (!e.target.dataset.proxied) {
                        e.target.dataset.proxied = '1';
                        e.target.src = `${api.defaults.baseURL || "/api/v1"}/wavex/chats/media/proxy?url=${encodeURIComponent(url)}&token=${localStorage.getItem("sellchase_access_token") || ""}`;
                    }
                }}
            />
        );
    }
    if (!blobSrc && !failed) {
        return <span className="mb-1 block text-xs text-slate-500">Loading audio…</span>;
    }
    if (!blobSrc) {
        return <p className="mb-1 text-xs text-slate-500">Audio unavailable</p>;
    }
    return <audio src={blobSrc} controls className={className} />;
}

export function ThreadMediaFileLink({ url, label, className }) {
    const { blobSrc, failed } = useWavexMediaSrc(url);
    const needProxy = Boolean(url && wavexMediaNeedsProxy(url));
    if (!url) {
        return null;
    }
    if (!needProxy) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className={className}>
                {label}
            </a>
        );
    }
    if (!blobSrc && !failed) {
        return <span className={className}>Loading…</span>;
    }
    if (!blobSrc) {
        return <span className={className}>Unavailable</span>;
    }
    return (
        <a href={blobSrc} target="_blank" rel="noreferrer" className={className}>
            {label}
        </a>
    );
}
