import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiOutlinePaperAirplane,
    HiOutlinePencilSquare,
    HiOutlineChatBubbleLeftRight,
    HiOutlineMagnifyingGlass,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../api/client';
import { getEcho } from '../lib/echo';

function initials(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
}

function Avatar({ name, src, size = 46 }) {
    const s = { width: size, height: size };
    if (src) {
        return <div className="shrink-0 rounded-full bg-slate-100 bg-cover bg-center" style={{ ...s, backgroundImage: `url('${src}')` }} />;
    }
    return (
        <div className="flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand" style={s}>
            {initials(name)}
        </div>
    );
}

export default function ChatPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [me, setMe] = useState(null);
    const [convs, setConvs] = useState([]);
    const [current, setCurrent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [dir, setDir] = useState([]);
    const [dirLoading, setDirLoading] = useState(false);
    const [search, setSearch] = useState('');
    const msgsRef = useRef(null);
    const echoRef = useRef(null);
    const subRef = useRef(null);

    const scrollDown = () => {
        requestAnimationFrame(() => {
            if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
        });
    };

    const loadConvs = useCallback(async () => {
        try {
            const { data } = await api.get('/chat/conversations');
            setConvs(data.data || []);
            window.dispatchEvent(new CustomEvent('chat:unread-changed'));
        } catch (e) { /* noop */ }
    }, []);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data } = await api.get('/auth/me');
                if (alive) setMe(data.data || data.user || data);
            } catch (e) { /* noop */ }
            await loadConvs();
            if (alive) setLoading(false);
        })();
        return () => { alive = false; };
    }, [loadConvs]);

    // Deep-link: /chat?u=<userId> opens (or starts) a conversation with that user.
    useEffect(() => {
        const u = searchParams.get('u');
        if (u && me) {
            startWith(Number(u));
            setSearchParams({}, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me]);

    // subscribe to the open conversation
    useEffect(() => {
        if (!current) return undefined;
        const echo = getEcho();
        echoRef.current = echo;
        if (!echo) return undefined;
        const channel = `chat.conversation.${current.id}`;
        subRef.current = channel;
        echo.private(channel).listen('.message.sent', (e) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === e.id)) return prev;
                return [...prev, { id: e.id, body: e.body, mine: e.user?.id === me?.id, user: e.user, created_at: e.created_at }];
            });
            scrollDown();
            markRead(current.id);
            loadConvs();
        });
        return () => {
            try { echo.leave(channel); } catch (err) { /* noop */ }
        };
    }, [current, me, loadConvs]);

    async function openConv(conv) {
        setCurrent(conv);
        setMessages([]);
        try {
            const { data } = await api.get(`/chat/conversations/${conv.id}/messages`, { params: { per_page: 50 } });
            setMessages(data.data || []);
            scrollDown();
            markRead(conv.id);
            loadConvs();
        } catch (e) { /* noop */ }
    }

    async function markRead(id) {
        try {
            await api.post(`/chat/conversations/${id}/read`);
            window.dispatchEvent(new CustomEvent('chat:unread-changed'));
        } catch (e) { /* noop */ }
    }

    async function send() {
        const body = text.trim();
        if (!body || !current) return;
        setText('');
        try {
            const { data } = await api.post(`/chat/conversations/${current.id}/messages`, { body });
            setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
            scrollDown();
            loadConvs();
        } catch (e) { /* noop */ }
    }

    async function openNew() {
        setShowNew(true);
        setDirLoading(true);
        try {
            const { data } = await api.get('/public/directory', { params: { per_page: 48 } });
            setDir((data.data || []).filter((u) => u.user_id && u.user_id !== me?.id));
        } catch (e) { setDir([]); }
        setDirLoading(false);
    }

    async function startWith(userId) {
        setShowNew(false);
        try {
            const { data } = await api.post('/chat/conversations', { user_id: userId });
            await loadConvs();
            openConv({ id: data.id, other_user: data.other_user });
        } catch (e) { /* noop */ }
    }

    const fmt = (iso) => {
        try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
    };
    const dirFiltered = dir.filter((u) => !search || (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.company || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="mx-auto h-[calc(100vh-150px)] min-h-[520px] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="grid h-full grid-cols-1 md:grid-cols-[330px_1fr]">
                {/* sidebar */}
                <div className={`flex min-h-0 flex-col border-slate-100 md:border-e ${current ? 'hidden md:flex' : 'flex'}`}>
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                        <h1 className="text-lg font-semibold text-slate-900">{t('chat_title', 'Messages')}</h1>
                        <button onClick={openNew} className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand transition hover:bg-brand/20" aria-label={t('chat_new', 'New chat')}>
                            <HiOutlinePencilSquare className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-2">
                        {loading ? (
                            <div className="p-6 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</div>
                        ) : convs.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-400">{t('chat_empty', 'No conversations yet. Tap + to start one.')}</div>
                        ) : convs.map((c) => {
                            const o = c.other_user || {};
                            const active = current && current.id === c.id;
                            return (
                                <button key={c.id} onClick={() => openConv(c)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition ${active ? 'bg-brand/10' : 'hover:bg-slate-50'}`}>
                                    <Avatar name={o.name} src={o.avatar} />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-slate-900">{o.name || 'User'}</div>
                                        <div className="truncate text-xs text-slate-400">{c.last_message?.body || ''}</div>
                                    </div>
                                    {c.unread > 0 && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* thread */}
                <div className={`min-h-0 flex-col ${current ? 'flex' : 'hidden md:flex'}`}>
                    {!current ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
                            <HiOutlineChatBubbleLeftRight className="h-12 w-12 text-slate-300" />
                            <div>{t('chat_select', 'Select a conversation or start a new one.')}</div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
                                <button className="md:hidden" onClick={() => setCurrent(null)} aria-label={t('chat_back', 'Back')}><HiOutlineXMark className="h-5 w-5 text-slate-500" /></button>
                                <Avatar name={current.other_user?.name} src={current.other_user?.avatar} size={40} />
                                <div>
                                    <div className="text-base font-semibold text-slate-900">{current.other_user?.name || 'User'}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t('chat_online', 'online')}</div>
                                </div>
                            </div>
                            <div ref={msgsRef} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-slate-50 p-5">
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-white text-slate-900 shadow-xs'}`}>
                                            <div className="whitespace-pre-wrap wrap-break-word">{m.body}</div>
                                            <div className={`mt-1 text-[10px] ${m.mine ? 'text-white/70' : 'text-slate-400'} text-end`}>{fmt(m.created_at)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-end gap-3 border-t border-slate-100 p-3">
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                                    rows={1}
                                    placeholder={t('chat_placeholder', 'Type a message…')}
                                    className="max-h-32 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20"
                                />
                                <button onClick={send} disabled={!text.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:brightness-110 disabled:opacity-40">
                                    <HiOutlinePaperAirplane className="h-5 w-5" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* new conversation modal */}
            {showNew && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-6 backdrop-blur-xs" onClick={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}>
                    <div className="mt-16 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                            <span className="font-semibold text-slate-900">{t('chat_new', 'Start a conversation')}</span>
                            <button onClick={() => setShowNew(false)}><HiOutlineXMark className="h-5 w-5 text-slate-500" /></button>
                        </div>
                        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
                            <HiOutlineMagnifyingGlass className="h-4 w-4 text-slate-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search', 'Search…')} className="w-full py-1.5 text-sm outline-hidden" />
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-2">
                            {dirLoading ? (
                                <div className="p-5 text-center text-sm text-slate-400">{t('loading', 'Loading…')}</div>
                            ) : dirFiltered.length === 0 ? (
                                <div className="p-5 text-center text-sm text-slate-400">{t('chat_no_users', 'No users found.')}</div>
                            ) : dirFiltered.map((u) => (
                                <button key={u.user_id} onClick={() => startWith(u.user_id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition hover:bg-slate-50">
                                    <Avatar name={u.name} src={u.photo} />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-slate-900">{u.name}</div>
                                        <div className="truncate text-xs text-slate-400">{u.role}{u.company ? ` · ${u.company}` : ''}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
