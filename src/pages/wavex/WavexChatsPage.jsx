import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import {
    HiOutlineArrowsPointingIn,
    HiOutlineArrowsPointingOut,
    HiOutlineArrowLeft,
    HiOutlineArrowPath,
    HiOutlineChatBubbleLeftRight,
    HiOutlineEllipsisVertical,
    HiOutlineInbox,
    HiOutlineMagnifyingGlass,
    HiOutlinePaperAirplane,
    HiOutlinePaperClip,
    HiOutlinePhoto,
    HiOutlineUserGroup,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import api from '../../api/client';
import {
    chatIdFrom,
    chatLabel,
    extractApiList,
    groupIdFrom,
    groupLabel,
    mergeChatsById,
    presentChatId,
    sortChatsByActivity,
    unreadCountFromChat,
    wavexMediaNeedsProxy,
} from './wavexHelpers';

const CHAT_PAGE_LIMIT = 40;

function initials(name) {
    if (!name || name === '—') {
        return '?';
    }
    const parts = String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .filter(Boolean);
    return parts.join('').toUpperCase().slice(0, 2) || '?';
}

function previewFromChat(c) {
    const lm = c?.lastMessage ?? c?.last_message ?? c?.conversation;
    if (!lm) {
        return '';
    }
    const t = lm.body ?? lm.text ?? lm.message ?? (typeof lm === 'string' ? lm : '');
    return String(t).slice(0, 80);
}

function formatMsgTime(iso) {
    if (!iso) {
        return '';
    }
    try {
        return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '';
    }
}

function normalizeMediaKind(msg) {
    const type = String(msg?.type || '').toLowerCase();
    const mime = String(msg?.mime || '').toLowerCase();
    const thumb = String(msg?.media_thumb || '');
    if (type.includes('image') || mime.startsWith('image/')) return 'image';
    if (type.includes('video') || mime.startsWith('video/')) return 'video';
    if (type.includes('audio') || type.includes('voice') || mime.startsWith('audio/')) return 'audio';
    if (type.includes('document') || type.includes('file') || mime !== '') return 'file';
    if (thumb.startsWith('data:image')) return 'image';
    return '';
}

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

function ThreadMediaImage({ url, thumb, className, alt }) {
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

function ThreadMediaVideo({ url, thumb, className }) {
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

function ThreadMediaAudio({ url, className }) {
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

function ThreadMediaFileLink({ url, label, className }) {
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

function ChatListAvatar({
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

export default function WavexChatsPage() {
    const { t } = useTranslation();
    const { permissions } = useOutletContext();
    const can = (p) => permissions.includes(p);

    const [listTab, setListTab] = useState('chats');
    const [chats, setChats] = useState([]);
    const [inboxPreview, setInboxPreview] = useState([]);
    const [inboxUnreadByChat, setInboxUnreadByChat] = useState({});
    const [groups, setGroups] = useState([]);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [threadErr, setThreadErr] = useState('');
    const [wawpOk, setWawpOk] = useState(true);
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingInbox, setLoadingInbox] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingThread, setLoadingThread] = useState(false);
    const [loadingOlderThread, setLoadingOlderThread] = useState(false);
    const [threadOffset, setThreadOffset] = useState(0);
    const [threadHasMore, setThreadHasMore] = useState(true);
    const [composer, setComposer] = useState('');
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [chatOffset, setChatOffset] = useState(0);
    const [contactOpen, setContactOpen] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [avatarByChatId, setAvatarByChatId] = useState({});
    const [pendingFile, setPendingFile] = useState(null);

    const threadEndRef = useRef(null);
    const threadScrollRef = useRef(null);
    const restoringScrollRef = useRef(false);
    const topLoadCooldownRef = useRef(0);
    const wasNearTopRef = useRef(false);
    const isNearBottomRef = useRef(true);
    /** Keeps pagination flags out of loadThread deps so thread fetch success does not retrigger the chat effect (429 storm). */
    const threadOffsetRef = useRef(0);
    const threadHasMoreRef = useRef(true);
    const loadingOlderThreadRef = useRef(false);
    const threadBackoffUntilRef = useRef(0);
    const listScrollRef = useRef(null);
    const loadMoreSentinelRef = useRef(null);
    const avatarAttemptedRef = useRef(new Set());
    const fileInputRef = useRef(null);
    const prevMsgCountRef = useRef(0);
    const notifAudioRef = useRef(null);

    // WhatsApp-style notification sound using Web Audio API
    useEffect(() => {
        const playNotif = () => {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                // Two-tone chime like WhatsApp
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            } catch { return; }
        };
        notifAudioRef.current = { play: playNotif };
    }, []);
    /** Same pattern as thread: keep offset/hasMore out of loadChats deps to avoid effect storms + 429. */
    const chatOffsetRef = useRef(0);
    const hasMoreRef = useRef(true);
    const loadingChatsRef = useRef(false);
    const loadingMoreRef = useRef(false);
    const chatsBackoffUntilRef = useRef(0);
    const chatAppendCooldownUntilRef = useRef(0);

    const effectiveChatId = selected?.id ? String(selected.id) : '';

    const fetchProfilePicture = useCallback(async (contactId, refresh = false) => {
        if (!contactId) {
            return null;
        }
        try {
            const { data } = await api.get('/wavex/contacts/profile-picture', {
                params: { contact_id: contactId, refresh: refresh ? 1 : 0 },
            });
            const url =
                data?.url ||
                data?.data?.url ||
                data?.data?.profilePictureURL ||
                data?.data?.profile_picture_url;
            return typeof url === 'string' && url ? url : null;
        } catch {
            return null;
        }
    }, []);

    const onAvatarVisible = useCallback(
        (chatId) => {
            if (!chatId || avatarAttemptedRef.current.has(chatId)) {
                return;
            }
            avatarAttemptedRef.current.add(chatId);
            void (async () => {
                const url = await fetchProfilePicture(chatId, false);
                if (url) {
                    setAvatarByChatId((prev) => ({ ...prev, [chatId]: url }));
                }
            })();
        },
        [fetchProfilePicture],
    );

    const loadChatsRef = useRef(null);

    useEffect(() => {
        const root = listScrollRef.current;
        const target = loadMoreSentinelRef.current;
        if (!root || !target || listTab !== 'chats' || !hasMore || loadingChats || loadingMore) {
            return undefined;
        }
        const obs = new IntersectionObserver(
            (entries) => {
                if (!entries[0]?.isIntersecting) {
                    return;
                }
                if (
                    loadingMoreRef.current ||
                    loadingChatsRef.current ||
                    !hasMoreRef.current ||
                    Date.now() < chatsBackoffUntilRef.current ||
                    Date.now() < chatAppendCooldownUntilRef.current
                ) {
                    return;
                }
                void loadChatsRef.current?.(true);
            },
            { root, rootMargin: '120px', threshold: 0 },
        );
        obs.observe(target);
        return () => obs.disconnect();
    }, [listTab, hasMore, loadingChats, loadingMore]);

    useEffect(() => {
        chatOffsetRef.current = chatOffset;
    }, [chatOffset]);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    useEffect(() => {
        loadingChatsRef.current = loadingChats;
    }, [loadingChats]);

    useEffect(() => {
        loadingMoreRef.current = loadingMore;
    }, [loadingMore]);

    const chatsLenRef = useRef(0);
    useEffect(() => { chatsLenRef.current = chats.length; }, [chats]);

    const loadChats = useCallback(async (append = false) => {
        if (Date.now() < chatsBackoffUntilRef.current) {
            return;
        }
        if (append) {
            if (loadingMoreRef.current || loadingChatsRef.current || !hasMoreRef.current) {
                return;
            }
            setLoadingMore(true);
            loadingMoreRef.current = true;
        } else {
            // Only show loading spinner on first load, silent refresh otherwise
            if (chatsLenRef.current === 0) {
                setLoadingChats(true);
            }
            loadingChatsRef.current = true;
        }
        try {
            const offset = append ? chatOffsetRef.current : 0;
            const { data } = await api.get('/wavex/chats', {
                params: {
                    limit: CHAT_PAGE_LIMIT,
                    offset,
                    sortBy: 'id',
                    sortOrder: 'DESC',
                },
            });
            const raw = extractApiList(data);
            const sortedBatch = sortChatsByActivity(raw);
            setChats((prev) => {
                const merged = append ? mergeChatsById(prev, sortedBatch) : mergeChatsById([], sortedBatch);
                return sortChatsByActivity(merged);
            });
            const nextOffset = offset + raw.length;
            setChatOffset(nextOffset);
            chatOffsetRef.current = nextOffset;
            const more = raw.length >= CHAT_PAGE_LIMIT;
            setHasMore(more);
            hasMoreRef.current = more;
            if (append) {
                chatAppendCooldownUntilRef.current = Date.now() + 600;
            }
        } catch (e) {
            const status = e.response?.status;
            if (status === 429) {
                chatsBackoffUntilRef.current = Date.now() + 25000;
            }
            if (!append) {
                setChats([]);
                setHasMore(false);
                hasMoreRef.current = false;
            }
        } finally {
            if (append) {
                setLoadingMore(false);
                loadingMoreRef.current = false;
            } else {
                setLoadingChats(false);
                loadingChatsRef.current = false;
            }
        }
    }, []);

    loadChatsRef.current = loadChats;

    const loadInboxPreview = useCallback(async () => {
        setLoadingInbox(true);
        try {
            const { data } = await api.get('/wavex/inbox', { params: { per_page: 40 } });
            const rows = Array.isArray(data?.data) ? data.data : [];
            const byChat = new Map();
            const unreadByChat = new Map();
            for (const row of rows) {
                const cid = row.chat_id;
                if (!cid) {
                    continue;
                }
                const isUnreadInbound =
                    String(row.direction || '').toLowerCase() === 'in' &&
                    !(
                        row.read === true ||
                        row.is_read === true ||
                        row.seen === true ||
                        row.viewed === true
                    );
                if (isUnreadInbound) {
                    unreadByChat.set(cid, (unreadByChat.get(cid) || 0) + 1);
                    // Also store by phone-only key for cross-format matching
                    const phoneOnly = cid.includes('@') ? cid.split('@')[0] : cid;
                    if (phoneOnly !== cid) {
                        unreadByChat.set(phoneOnly, (unreadByChat.get(phoneOnly) || 0) + 1);
                    }
                }
                if (!byChat.has(cid)) {
                    byChat.set(cid, row);
                }
            }
            setInboxPreview([...byChat.values()]);
            setInboxUnreadByChat(Object.fromEntries(unreadByChat));
        } catch {
            setInboxPreview([]);
            setInboxUnreadByChat({});
        } finally {
            setLoadingInbox(false);
        }
    }, []);

    const loadGroups = useCallback(async () => {
        setLoadingGroups(true);
        try {
            const { data } = await api.get('/wavex/groups');
            setGroups(extractApiList(data));
        } catch {
            setGroups([]);
        } finally {
            setLoadingGroups(false);
        }
    }, []);

    const mergeThreadById = useCallback((incoming, { prepend = false } = {}) => {
        if (!Array.isArray(incoming) || incoming.length === 0) {
            return;
        }
        setMessages((prev) => {
            const merged = prepend ? [...incoming, ...prev] : [...incoming];
            const map = new Map();
            for (const m of merged) {
                if (m?.id) {
                    map.set(m.id, m);
                }
            }
            return [...map.values()].sort((a, b) => (a?.sort_ms ?? 0) - (b?.sort_ms ?? 0));
        });
    }, []);

    useEffect(() => {
        threadOffsetRef.current = threadOffset;
    }, [threadOffset]);

    useEffect(() => {
        threadHasMoreRef.current = threadHasMore;
    }, [threadHasMore]);

    useEffect(() => {
        loadingOlderThreadRef.current = loadingOlderThread;
    }, [loadingOlderThread]);

    const loadThread = useCallback(async (chatId, opts = {}) => {
        const { appendOlder = false, force = false } = opts;
        if (!chatId) {
            return;
        }
        if (!force && Date.now() < threadBackoffUntilRef.current) {
            return;
        }
        if (appendOlder) {
            if (loadingOlderThreadRef.current || !threadHasMoreRef.current) {
                return;
            }
            setLoadingOlderThread(true);
            loadingOlderThreadRef.current = true;
        } else {
            setLoadingThread(true);
            setThreadErr('');
        }
        try {
            const offset = appendOlder ? threadOffsetRef.current : 0;
            const scrollEl = threadScrollRef.current;
            const prevScrollTop = appendOlder && scrollEl ? scrollEl.scrollTop : 0;
            const prevScrollHeight = appendOlder && scrollEl ? scrollEl.scrollHeight : 0;
            const enc = encodeURIComponent(chatId);
            const { data } = await api.get(`/wavex/chats/${enc}/messages`, {
                params: { limit: 80, offset, download_media: 1 },
            });
            setWawpOk(data?.ok !== false);
            const list = Array.isArray(data?.data?.messages) ? data.data.messages : [];
            if (appendOlder) {
                mergeThreadById(list, { prepend: true });
                setThreadOffset((v) => {
                    const next = v + list.length;
                    threadOffsetRef.current = next;
                    return next;
                });
                if (list.length > 0) {
                    requestAnimationFrame(() => {
                        const el = threadScrollRef.current;
                        if (!el) return;
                        const nextHeight = el.scrollHeight;
                        restoringScrollRef.current = true;
                        el.scrollTop = prevScrollTop + (nextHeight - prevScrollHeight);
                        requestAnimationFrame(() => {
                            restoringScrollRef.current = false;
                        });
                    });
                }
            } else {
                setMessages(list);
                setThreadOffset(list.length);
                threadOffsetRef.current = list.length;
                const hasMore = list.length >= 80;
                setThreadHasMore(hasMore);
                threadHasMoreRef.current = hasMore;
            }
            if (appendOlder && list.length < 80) {
                setThreadHasMore(false);
                threadHasMoreRef.current = false;
            }
        } catch (e) {
            const status = e.response?.status;
            if (status === 429) {
                threadBackoffUntilRef.current = Date.now() + 25000;
            }
            setThreadErr(e.response?.data?.message || e.message);
            if (!appendOlder) {
                setMessages([]);
            }
        } finally {
            if (appendOlder) {
                setLoadingOlderThread(false);
                loadingOlderThreadRef.current = false;
            } else {
                setLoadingThread(false);
            }
        }
    }, [mergeThreadById]);

    useEffect(() => {
        if (!permissions.includes('wavex-access')) {
            return;
        }
        if (listTab === 'chats') {
            setChatOffset(0);
            chatOffsetRef.current = 0;
            setHasMore(true);
            hasMoreRef.current = true;
            chatsBackoffUntilRef.current = 0;
            void loadChatsRef.current?.(false);
            void loadInboxPreview(); // Also load unread counts for badges
        } else if (listTab === 'groups') {
            void loadGroups();
        } else {
            void loadInboxPreview();
        }
    }, [listTab, loadGroups, loadInboxPreview, permissions]);

    // Real-time: auto-refresh chat list every 8s to show new messages/unread
    useEffect(() => {
        if (!permissions.includes('wavex-access') || listTab !== 'chats') return undefined;
        const interval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            if (loadingChatsRef.current || loadingMoreRef.current) return;
            void loadChatsRef.current?.(false);
        }, 8000);
        return () => clearInterval(interval);
    }, [permissions, listTab]);

    // Real-time: refresh inbox unread every 10s
    useEffect(() => {
        if (!permissions.includes('wavex-access') || listTab !== 'inbox') return undefined;
        const interval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            void loadInboxPreview();
        }, 10000);
        return () => clearInterval(interval);
    }, [permissions, listTab, loadInboxPreview]);

    useEffect(() => {
        if (!effectiveChatId) {
            return undefined;
        }
        let cancelled = false;
        void (async () => {
            const url = await fetchProfilePicture(effectiveChatId, false);
            if (!cancelled && url) {
                setAvatarByChatId((p) => ({ ...p, [effectiveChatId]: url }));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [effectiveChatId, fetchProfilePicture]);

    useEffect(() => {
        if (!effectiveChatId) {
            setMessages([]);
            setThreadOffset(0);
            setThreadHasMore(true);
            threadOffsetRef.current = 0;
            threadHasMoreRef.current = true;
            threadBackoffUntilRef.current = 0;
            return;
        }
        setMessages([]);
        setThreadOffset(0);
        setThreadHasMore(true);
        threadOffsetRef.current = 0;
        threadHasMoreRef.current = true;
        threadBackoffUntilRef.current = 0;
        void loadThread(effectiveChatId, { appendOlder: false });
    }, [effectiveChatId, loadThread]);

    useEffect(() => {
        if (!loadingOlderThread && isNearBottomRef.current) {
            threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        // Play sound on new incoming message
        const currentCount = messages.length;
        if (currentCount > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
            const newest = messages[messages.length - 1];
            if (newest?.direction === 'in') {
                notifAudioRef.current?.play();
            }
        }
        prevMsgCountRef.current = currentCount;
    }, [loadingOlderThread, messages]);

    // Auto-poll for new messages every 3 seconds
    useEffect(() => {
        if (!effectiveChatId) return undefined;
        const interval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            if (loadingOlderThreadRef.current) return;
            void loadThread(effectiveChatId, { force: true });
        }, 3000);
        return () => clearInterval(interval);
    }, [effectiveChatId, loadThread]);

    const onThreadScroll = useCallback(() => {
        const el = threadScrollRef.current;
        if (!el || !effectiveChatId) {
            return;
        }
        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
        isNearBottomRef.current = nearBottom;
        if (restoringScrollRef.current) {
            return;
        }
        const now = Date.now();
        if (now < topLoadCooldownRef.current) {
            return;
        }
        const nearTop = el.scrollTop <= 60;
        if (!nearTop) {
            wasNearTopRef.current = false;
            return;
        }
        if (wasNearTopRef.current) {
            return;
        }
        wasNearTopRef.current = true;
        if (threadHasMore && !loadingOlderThread && !loadingThread) {
            topLoadCooldownRef.current = now + 500;
            void loadThread(effectiveChatId, { appendOlder: true });
        }
    }, [effectiveChatId, loadThread, loadingOlderThread, loadingThread, threadHasMore]);

    useEffect(() => {
        return () => {
            if (pendingFile?.previewUrl) {
                URL.revokeObjectURL(pendingFile.previewUrl);
            }
        };
    }, [pendingFile]);

    useEffect(() => {
        if (!maximized) {
            return undefined;
        }
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setMaximized(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [maximized]);

    const filteredChats = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return chats;
        }
        return chats.filter((c) => {
            const id = chatIdFrom(c).toLowerCase();
            const lab = String(chatLabel(c)).toLowerCase();
            return id.includes(q) || lab.includes(q);
        });
    }, [chats, search]);

    const filteredGroups = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return groups;
        }
        return groups.filter((g) => {
            const id = groupIdFrom(g).toLowerCase();
            const lab = String(groupLabel(g)).toLowerCase();
            return id.includes(q) || lab.includes(q);
        });
    }, [groups, search]);

    function selectChatFromList(c) {
        setSelected({ id: chatIdFrom(c), label: chatLabel(c), raw: c });
    }

    function selectFromInboxRow(row) {
        setSelected({ id: String(row.chat_id), label: String(row.chat_id), raw: null });
        setListTab('chats');
    }

    function selectFromGroup(group) {
        setSelected({ id: groupIdFrom(group), label: groupLabel(group), raw: group });
    }

    async function onSend(e) {
        e?.preventDefault();
        if (!effectiveChatId || sending) {
            return;
        }

        if (pendingFile) {
            const fd = new FormData();
            fd.append('chat_id', effectiveChatId);
            const cap = composer.trim();
            if (cap) {
                fd.append('caption', cap);
            }
            fd.append('file', pendingFile.file);
            setSending(true);
            setUploadingInBg(true);
            setThreadErr('');
            try {
                const { data } = await api.post('/wavex/send/media', fd, {
                    onUploadProgress: (e) => {
                        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    },
                });
                if (pendingFile.previewUrl) {
                    URL.revokeObjectURL(pendingFile.previewUrl);
                }
                setPendingFile(null);
                setComposer('');
                if (data?.sent_message) {
                    setMessages((prev) => [...prev, data.sent_message]);
                }
                await loadThread(effectiveChatId, { force: true });
                toast.success(t('wavex_media_sent_ok'));
            } catch (e2) {
                setThreadErr(e2.response?.data?.message || e2.message);
                toast.error(t('wavex_media_sent_fail'));
            } finally {
                setSending(false);
                setUploadingInBg(false);
                setUploadProgress(0);
            }
            return;
        }

        const text = composer.trim();
        if (!text) {
            return;
        }
        const optimistic = {
            id: `opt-${Date.now()}`,
            body: text,
            direction: 'out',
            at: new Date().toISOString(),
            sort_ms: Date.now(),
            source: 'local',
        };
        setMessages((prev) => [...prev, optimistic]);
        setComposer('');
        setSending(true);
        setThreadErr('');
        try {
            await api.post('/wavex/send', { chat_id: effectiveChatId, message: text });
            await loadThread(effectiveChatId, { force: true });
        } catch (e2) {
            setThreadErr(e2.response?.data?.message || e2.message);
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        } finally {
            setSending(false);
        }
    }

    function onComposerKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void onSend();
        }
    }

    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingInBg, setUploadingInBg] = useState(false);

    function onPickFile(e) {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) {
            return;
        }
        const previewUrl = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
        setPendingFile((prev) => {
            if (prev?.previewUrl) {
                URL.revokeObjectURL(prev.previewUrl);
            }
            return { file: f, previewUrl };
        });
        setUploadProgress(0);
    }

    function clearPendingFile() {
        setPendingFile((prev) => {
            if (prev?.previewUrl) {
                URL.revokeObjectURL(prev.previewUrl);
            }
            return null;
        });
    }

    async function copyJid() {
        const jid = effectiveChatId;
        if (!jid) {
            return;
        }
        try {
            await navigator.clipboard.writeText(jid);
            toast.success(t('wavex_contact_copied'));
        } catch {
            toast.error(t('wavex_contact_copy_fail'));
        }
    }

    if (!can('wavex-access')) {
        return <Navigate to="/dashboard" replace />;
    }

    const headerTitle = selected?.label || t('wavex_wa_select_chat');
    const headerSub = effectiveChatId ? presentChatId(effectiveChatId) : '—';
    const headerAvatarUrl = effectiveChatId ? avatarByChatId[effectiveChatId] : null;

    return (
        <div
            className={[
                'flex flex-col overflow-hidden border border-slate-200/90 bg-[#f0f2f5] shadow-xl md:flex-row',
                maximized
                    ? 'fixed inset-0 z-120 h-dvh max-h-dvh w-screen max-w-none rounded-none'
                    : 'h-[min(100dvh-6rem,920px)] max-h-[min(100dvh-6rem,920px)] w-full max-w-[1400px] rounded-2xl',
            ].join(' ')}
        >
            {/* Left: list */}
            <aside className={[
                'h-full min-h-0 w-full shrink-0 flex-col border-slate-200/80 md:flex md:w-[min(100%,380px)] md:border-e',
                selected ? 'hidden' : 'flex',
            ].join(' ')}>
                <div className="flex shrink-0 items-center gap-2 bg-[#f0f2f5] px-3 py-3">
                    <div className="relative min-w-0 flex-1">
                        <HiOutlineMagnifyingGlass className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            className="w-full rounded-lg border-0 bg-white py-2 pe-3 ps-9 text-sm text-slate-800 shadow-xs ring-1 ring-slate-200/80 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#128c7e]/40"
                            placeholder={t('wavex_wa_search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex shrink-0 gap-1 border-b border-slate-200/80 bg-[#f0f2f5] px-2 pb-2">
                    <button
                        type="button"
                        onClick={() => setListTab('chats')}
                        className={[
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors',
                            listTab === 'chats' ? 'bg-white text-[#075e54] shadow-xs' : 'text-slate-600 hover:bg-white/60',
                        ].join(' ')}
                    >
                        <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                        {t('wavex_tab_chats')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setListTab('groups')}
                        className={[
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors',
                            listTab === 'groups' ? 'bg-white text-[#075e54] shadow-xs' : 'text-slate-600 hover:bg-white/60',
                        ].join(' ')}
                    >
                        <HiOutlineUserGroup className="h-4 w-4" />
                        {t('wavex_nav_groups')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setListTab('inbox')}
                        className={[
                            'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors',
                            listTab === 'inbox' ? 'bg-white text-[#075e54] shadow-xs' : 'text-slate-600 hover:bg-white/60',
                        ].join(' ')}
                    >
                        <HiOutlineInbox className="h-4 w-4" />
                        {t('wavex_tab_inbox')}
                    </button>
                </div>
                <div ref={listScrollRef} className="min-h-0 flex-1 overflow-y-auto bg-white">
                    {listTab === 'chats' ? (
                        loadingChats ? (
                            <p className="p-6 text-center text-sm text-slate-500">{t('loading')}</p>
                        ) : filteredChats.length === 0 ? (
                            <p className="p-6 text-center text-sm text-slate-500">{t('wavex_chats_empty')}</p>
                        ) : (
                            <ul>
                                {filteredChats.map((c, i) => {
                                    const id = chatIdFrom(c);
                                    const active = effectiveChatId && id === effectiveChatId;
                                    const pv = previewFromChat(c);
                                    const unread = unreadCountFromChat(c);
                                    return (
                                        <li key={id || `c-${i}`} className="border-b border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => selectChatFromList(c)}
                                                className={[
                                                    'flex w-full items-start gap-3 px-3 py-3 text-start transition-colors',
                                                    active ? 'bg-[#ebebeb]' : 'hover:bg-[#f5f6f6]',
                                                ].join(' ')}
                                            >
                                                <ChatListAvatar
                                                    chatId={id}
                                                    label={chatLabel(c)}
                                                    unread={unread}
                                                    imageUrl={avatarByChatId[id]}
                                                    showImage={Boolean(id)}
                                                    listScrollRef={listScrollRef}
                                                    onVisible={onAvatarVisible}
                                                    onRequestImage={(cid, refresh) => {
                                                        void (async () => {
                                                            const url = await fetchProfilePicture(cid, refresh);
                                                            if (url) {
                                                                setAvatarByChatId((p) => ({
                                                                    ...p,
                                                                    [cid]: url,
                                                                }));
                                                            }
                                                        })();
                                                    }}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="line-clamp-1 font-medium text-slate-900">
                                                        {chatLabel(c)}
                                                    </span>
                                                    <span className="line-clamp-1 text-xs text-slate-500">
                                                        {pv || presentChatId(id)}
                                                    </span>
                                                </span>
                                                {(() => {
                                                    // Match unread by both full JID and phone-only
                                                    const unread = inboxUnreadByChat[id]
                                                        || inboxUnreadByChat[id + '@c.us']
                                                        || inboxUnreadByChat[id + '@s.whatsapp.net']
                                                        || (id.includes('@') ? inboxUnreadByChat[id.split('@')[0]] : 0)
                                                        || unreadCountFromChat(c)
                                                        || 0;
                                                    return unread > 0 ? (
                                                        <span className="ms-auto flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#25d366] px-1 text-[10px] font-bold text-white">
                                                            {unread > 99 ? '99+' : unread}
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </button>
                                        </li>
                                    );
                                })}
                                <li ref={loadMoreSentinelRef} className="h-1" aria-hidden />
                                {loadingMore ? (
                                    <li className="px-3 py-2 text-center text-xs text-slate-500">
                                        {t('wavex_chats_loading_more')}
                                    </li>
                                ) : null}
                                {!hasMore && chats.length > 0 ? (
                                    <li className="px-3 py-2 text-center text-xs text-slate-400">
                                        {t('wavex_chats_no_more')}
                                    </li>
                                ) : null}
                            </ul>
                        )
                    ) : listTab === 'groups' ? (
                        loadingGroups ? (
                            <p className="p-6 text-center text-sm text-slate-500">{t('loading')}</p>
                        ) : filteredGroups.length === 0 ? (
                            <p className="p-6 text-center text-sm text-slate-500">{t('wavex_groups_subtitle')}</p>
                        ) : (
                            <ul>
                                {filteredGroups.map((g, i) => {
                                    const gid = groupIdFrom(g);
                                    const active = effectiveChatId && gid === effectiveChatId;
                                    return (
                                        <li key={gid || `g-${i}`} className="border-b border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => selectFromGroup(g)}
                                                className={[
                                                    'flex w-full items-start gap-3 px-3 py-3 text-start transition-colors',
                                                    active ? 'bg-[#ebebeb]' : 'hover:bg-[#f5f6f6]',
                                                ].join(' ')}
                                            >
                                                <ChatListAvatar
                                                    chatId={gid}
                                                    label={groupLabel(g)}
                                                    unread={0}
                                                    imageUrl={avatarByChatId[gid]}
                                                    showImage={Boolean(gid)}
                                                    listScrollRef={listScrollRef}
                                                    onVisible={onAvatarVisible}
                                                    onRequestImage={(cid, refresh) => {
                                                        void (async () => {
                                                            const url = await fetchProfilePicture(cid, refresh);
                                                            if (url) {
                                                                setAvatarByChatId((p) => ({
                                                                    ...p,
                                                                    [cid]: url,
                                                                }));
                                                            }
                                                        })();
                                                    }}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="line-clamp-1 font-medium text-slate-900">
                                                        {groupLabel(g)}
                                                    </span>
                                                    <span className="line-clamp-1 font-mono text-xs text-slate-500">
                                                        {presentChatId(gid)}
                                                    </span>
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )
                    ) : loadingInbox ? (
                        <p className="p-6 text-center text-sm text-slate-500">{t('loading')}</p>
                    ) : inboxPreview.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-500">{t('wavex_inbox_empty')}</p>
                    ) : (
                        <ul>
                            {inboxPreview.map((row) => {
                                const active = effectiveChatId && row.chat_id === effectiveChatId;
                                const unread = Number(inboxUnreadByChat[row.chat_id] || 0);
                                return (
                                    <li key={row.id} className="border-b border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => selectFromInboxRow(row)}
                                            className={[
                                                'flex w-full items-start gap-3 px-3 py-3 text-start transition-colors',
                                                active ? 'bg-[#ebebeb]' : 'hover:bg-[#f5f6f6]',
                                            ].join(' ')}
                                        >
                                            <ChatListAvatar
                                                chatId={String(row.chat_id)}
                                                label={String(row.chat_id)}
                                                unread={unread}
                                                imageUrl={avatarByChatId[row.chat_id]}
                                                showImage={Boolean(row.chat_id)}
                                                listScrollRef={listScrollRef}
                                                onVisible={onAvatarVisible}
                                                onRequestImage={(cid, refresh) => {
                                                    void (async () => {
                                                        const url = await fetchProfilePicture(cid, refresh);
                                                        if (url) {
                                                            setAvatarByChatId((p) => ({
                                                                ...p,
                                                                [cid]: url,
                                                            }));
                                                        }
                                                    })();
                                                }}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="line-clamp-1 font-mono text-xs text-slate-700">
                                                    {presentChatId(row.chat_id)}
                                                </span>
                                                <span className="line-clamp-2 text-xs text-slate-500">{row.body}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>

            {/* Right: conversation */}
            <section className={[
                'min-h-0 min-w-0 flex-1 flex-col bg-[#e5ddd5] md:flex md:min-h-0',
                selected ? 'flex' : 'hidden',
            ].join(' ')}>
                <header className="flex shrink-0 items-center gap-3 bg-[#f0f2f5] px-4 py-3 shadow-xs">
                    <button
                        type="button"
                        onClick={() => setSelected(null)}
                        className="shrink-0 rounded-full p-1.5 text-slate-600 hover:bg-slate-200/80 md:hidden"
                        aria-label={t('wavex_cg_back_to_list')}
                    >
                        <HiOutlineArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="relative shrink-0">
                        {headerAvatarUrl ? (
                            <img
                                src={headerAvatarUrl}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="flex h-10 w-10 rounded-full object-cover ring-1 ring-slate-200/80"
                                onError={() => {
                                    setAvatarByChatId((p) => {
                                        const n = { ...p };
                                        delete n[effectiveChatId];
                                        return n;
                                    });
                                }}
                            />
                        ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-[#128c7e] to-[#075e54] text-sm font-bold text-white">
                                {initials(headerTitle)}
                            </span>
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{headerTitle}</p>
                        <p className="truncate font-mono text-[11px] text-slate-500">{headerSub}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMaximized((v) => !v)}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-200/80"
                        title={maximized ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                        {maximized ? (
                            <HiOutlineArrowsPointingIn className="h-5 w-5" />
                        ) : (
                            <HiOutlineArrowsPointingOut className="h-5 w-5" />
                        )}
                    </button>
                    <button
                        type="button"
                        disabled={!effectiveChatId}
                        onClick={() => setContactOpen(true)}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-200/80 disabled:opacity-30"
                        title={t('wavex_contact_info')}
                    >
                        <HiOutlineEllipsisVertical className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => effectiveChatId && void loadThread(effectiveChatId, { force: true })}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-200/80"
                        title={t('wavex_reload_thread')}
                    >
                        <HiOutlineArrowPath className={loadingThread ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
                    </button>
                </header>

                <Dialog open={contactOpen} onClose={() => setContactOpen(false)} className="relative z-220">
                    <DialogBackdrop className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
                    <div className="fixed inset-0 flex justify-end">
                        <DialogPanel className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl ring-1 ring-slate-200/80">
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <DialogTitle className="text-base font-bold text-slate-900">
                                    {t('wavex_contact_info')}
                                </DialogTitle>
                                <button
                                    type="button"
                                    onClick={() => setContactOpen(false)}
                                    className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                                >
                                    {t('wavex_contact_close')}
                                </button>
                            </div>
                            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                                {!effectiveChatId ? (
                                    <p className="text-sm text-slate-500">{t('wavex_wa_select_chat')}</p>
                                ) : (
                                    <>
                                        <div className="flex flex-col items-center gap-2">
                                            {headerAvatarUrl ? (
                                                <img
                                                    src={headerAvatarUrl}
                                                    alt=""
                                                    referrerPolicy="no-referrer"
                                                    className="h-24 w-24 rounded-full object-cover shadow-md ring-2 ring-slate-100"
                                                />
                                            ) : (
                                                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-[#128c7e] to-[#075e54] text-2xl font-bold text-white shadow-md">
                                                    {initials(headerTitle)}
                                                </span>
                                            )}
                                            <p className="text-center font-semibold text-slate-900">{headerTitle}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                {t('wavex_contact_jid')}
                                            </p>
                                            <p className="mt-1 break-all font-mono text-sm text-slate-800">
                                                {effectiveChatId}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void copyJid()}
                                                className="rounded-xl bg-[#128c7e] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#075e54]"
                                            >
                                                {t('wavex_contact_copy_jid')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    void loadThread(effectiveChatId, { force: true });
                                                    setContactOpen(false);
                                                }}
                                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                            >
                                                {t('wavex_reload_thread')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </DialogPanel>
                    </div>
                </Dialog>

                {!wawpOk ? (
                    <div className="shrink-0 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
                        {t('wavex_wa_wawp_unavailable')}
                    </div>
                ) : null}
                {threadErr ? (
                    <div className="shrink-0 bg-red-50 px-3 py-2 text-center text-xs text-red-800">{threadErr}</div>
                ) : null}

                <div
                    ref={threadScrollRef}
                    onScroll={onThreadScroll}
                    className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
                    style={{
                        backgroundColor: '#e5ddd5',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9c5bd' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                >
                    {!effectiveChatId ? (
                        <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-slate-600">
                            <HiOutlineChatBubbleLeftRight className="h-14 w-14 text-slate-400" />
                            <p className="max-w-xs text-sm">{t('wavex_wa_select_chat')}</p>
                        </div>
                    ) : loadingThread && messages.length === 0 ? (
                        <p className="text-center text-sm text-slate-600">{t('loading')}</p>
                    ) : messages.length === 0 ? (
                        <p className="text-center text-sm text-slate-600">{t('wavex_wa_no_messages')}</p>
                    ) : (
                        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
                            {loadingOlderThread ? (
                                <p className="self-center rounded-sm bg-white/80 px-2 py-1 text-[11px] text-slate-500">
                                    {t('wavex_chats_loading_more')}
                                </p>
                            ) : null}
                            {messages.map((m) => {
                                const out = m.direction === 'out';
                                const mediaKind = normalizeMediaKind(m);
                                const mediaUrl = typeof m.media_url === 'string' ? m.media_url : '';
                                const mediaThumb = typeof m.media_thumb === 'string' ? m.media_thumb : '';
                                const hasMediaVisual =
                                    Boolean(mediaUrl) ||
                                    Boolean(mediaThumb && mediaThumb.startsWith('data:'));
                                const isImageBubble = hasMediaVisual && mediaKind === 'image';
                                const isVideoBubble =
                                    mediaKind === 'video' &&
                                    (Boolean(mediaUrl) || Boolean(mediaThumb && mediaThumb.startsWith('data:')));
                                const mediaHero = isImageBubble || isVideoBubble;
                                const threadImgClass =
                                    'mb-0 block h-[min(48dvh,430px)] w-full min-w-0 bg-slate-200/30 object-contain shadow-[0_4px_24px_-4px_rgba(0,0,0,0.18)]';
                                return (
                                    <div
                                        key={m.id}
                                        className={[
                                            'flex flex-col text-sm',
                                            mediaHero
                                                ? 'w-[min(480px,90%)] gap-1.5 rounded-2xl p-2 shadow-md ring-1 ring-black/6'
                                                : 'max-w-[85%] gap-0.5 rounded-lg px-3 py-2 shadow-xs',
                                            out
                                                ? mediaHero
                                                    ? 'self-end bg-[#dcf8c6] text-slate-900'
                                                    : 'self-end rounded-tr-none bg-[#dcf8c6] text-slate-900'
                                                : mediaHero
                                                  ? 'self-start bg-white text-slate-900'
                                                  : 'self-start rounded-tl-none bg-white text-slate-900',
                                        ].join(' ')}
                                    >
                                        {isImageBubble ? (
                                            <ThreadMediaImage
                                                url={mediaUrl}
                                                thumb={mediaThumb}
                                                alt={m.body || 'image'}
                                                className={`${threadImgClass} rounded-2xl`}
                                            />
                                        ) : null}
                                        {isVideoBubble ? (
                                            <ThreadMediaVideo
                                                url={mediaUrl}
                                                thumb={mediaThumb}
                                                className={`${threadImgClass} rounded-2xl bg-black`}
                                            />
                                        ) : null}
                                        {mediaUrl && mediaKind === 'audio' ? (
                                            <ThreadMediaAudio
                                                url={mediaUrl}
                                                className="mb-1 w-full max-w-[320px]"
                                            />
                                        ) : null}
                                        {mediaUrl && mediaKind === 'file' ? (
                                            <ThreadMediaFileLink
                                                url={mediaUrl}
                                                label={
                                                    m.body && m.body !== '[media]'
                                                        ? m.body
                                                        : 'Open attachment'
                                                }
                                                className="mb-1 inline-flex max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 underline"
                                            />
                                        ) : null}
                                        {(!hasMediaVisual || (m.body && m.body !== '[media]')) && (
                                            <p
                                                className={[
                                                    'whitespace-pre-wrap wrap-break-word',
                                                    mediaHero ? 'px-1 text-[13px] leading-snug' : '',
                                                ].join(' ')}
                                            >
                                                {m.body}
                                            </p>
                                        )}
                                        <span
                                            className={[
                                                'flex items-center gap-1 self-end text-[10px] text-slate-500',
                                                mediaHero ? 'px-2 pb-0.5 pt-0.5' : '',
                                            ].join(' ')}
                                        >
                                            {formatMsgTime(m.at)}
                                            {out ? (
                                                <svg className="h-3.5 w-3.5 text-[#53bdeb]" viewBox="0 0 16 15" fill="none">
                                                    <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88 5.64 6.37a.365.365 0 0 0-.54-.038l-.377.362a.365.365 0 0 0-.027.51l3.57 4.14a.365.365 0 0 0 .54.038L15.073 3.83a.365.365 0 0 0-.063-.514z" fill="currentColor"/>
                                                    <path d="M12.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L5.666 9.88 2.64 6.37a.365.365 0 0 0-.54-.038l-.377.362a.365.365 0 0 0-.027.51l3.57 4.14a.365.365 0 0 0 .54.038L12.073 3.83a.365.365 0 0 0-.063-.514z" fill="currentColor"/>
                                                </svg>
                                            ) : null}
                                        </span>
                                    </div>
                                );
                            })}
                            <div ref={threadEndRef} />
                        </div>
                    )}
                </div>

                <p className="shrink-0 px-3 pb-1 text-center text-[10px] text-slate-500">{t('wavex_wa_poll_hint')}</p>

                <form
                    onSubmit={onSend}
                    className="flex shrink-0 flex-col gap-2 border-t border-slate-200/80 bg-[#f0f2f5] px-3 py-3"
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/jpg,audio/*,.ogg,.opus,.webm,.mp3,.m4a,.wav,application/pdf,.pdf,.doc,.docx"
                        onChange={onPickFile}
                    />
                    {uploadingInBg && uploadProgress > 0 ? (
                        <div className="rounded-xl bg-brand/10 p-2">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-brand transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs font-semibold tabular-nums text-brand">{uploadProgress}%</span>
                            </div>
                        </div>
                    ) : null}
                    {pendingFile ? (
                        <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-xs ring-1 ring-slate-200/80">
                            {pendingFile.previewUrl ? (
                                <img
                                    src={pendingFile.previewUrl}
                                    alt=""
                                    className="h-14 w-14 rounded-lg object-cover"
                                />
                            ) : (
                                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100">
                                    <HiOutlinePhoto className="h-8 w-8 text-slate-400" />
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-slate-800">
                                    {pendingFile.file.name}
                                </p>
                                <p className="text-[10px] text-slate-500">{t('wavex_media_attach_hint')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={clearPendingFile}
                                className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                                {t('wavex_media_remove')}
                            </button>
                        </div>
                    ) : null}
                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            disabled={!effectiveChatId || sending}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-40"
                            title={t('wavex_media_attach')}
                            aria-label={t('wavex_media_attach')}
                        >
                            <HiOutlinePaperClip className="h-5 w-5" />
                        </button>
                        <textarea
                            rows={1}
                            className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none rounded-2xl border-0 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs ring-1 ring-slate-200/80 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#128c7e]/40"
                            placeholder={
                                pendingFile ? t('wavex_media_caption_placeholder') : t('wavex_wa_type_message')
                            }
                            value={composer}
                            onChange={(e) => setComposer(e.target.value)}
                            onKeyDown={onComposerKeyDown}
                            disabled={!effectiveChatId || sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || !effectiveChatId || (!pendingFile && !composer.trim())}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#128c7e] text-white shadow-md transition hover:bg-[#075e54] disabled:opacity-40"
                            aria-label={t('wavex_send')}
                        >
                            <HiOutlinePaperAirplane className="h-5 w-5 -rotate-45" />
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
