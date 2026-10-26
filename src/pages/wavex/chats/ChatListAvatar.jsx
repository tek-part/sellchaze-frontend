import { useEffect, useRef, useState } from 'react';
import { initials } from './chatFormat';

export default function ChatListAvatar({
    chatId,
    label,
    unread,
    imageUrl,
    showImage,
    onRequestImage,
    listScrollRef,
    onVisible,
}) {
    const [failed, setFailed] = useState(false);
    const wrapRef = useRef(null);
    const onVisibleRef = useRef(onVisible);
    onVisibleRef.current = onVisible;

    useEffect(() => {
        setFailed(false);
    }, [chatId, imageUrl]);

    useEffect(() => {
        const el = wrapRef.current;
        const root = listScrollRef?.current ?? null;
        if (!el || !chatId) {
            return undefined;
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    onVisibleRef.current(chatId);
                    io.disconnect();
                }
            },
            { root, rootMargin: '80px', threshold: 0.01 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [chatId, listScrollRef]);

    return (
        <span ref={wrapRef} className="relative shrink-0">
            {showImage && imageUrl && !failed ? (
                <img
                    src={imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-full object-cover shadow-xs ring-1 ring-slate-200/80"
                    onError={() => {
                        setFailed(true);
                        onRequestImage?.(chatId, true);
                    }}
                />
            ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#128c7e] to-[#075e54] text-sm font-bold text-white shadow-xs">
                    {initials(label)}
                </span>
            )}
            {unread > 0 ? (
                <span className="absolute -inset-e-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#25d366] px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                    {unread > 99 ? '99+' : unread}
                </span>
            ) : null}
        </span>
    );
}
