import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineSparkles, HiXMark } from 'react-icons/hi2';
import api from '../../api/client';

const DISMISS_KEY = 'sellchase_community_welcome_dismissed';

/**
 * The community on-ramp a member sees on their first visits: a personal welcome
 * plus an "introduce yourself" action that pre-fills an introduction post they
 * can edit and publish. Disappears once they have posted (or dismissed it).
 */
export default function CommunityWelcome() {
    const { t } = useTranslation();
    const [me, setMe] = useState(null);
    const [hasPosted, setHasPosted] = useState(true); // assume yes until known
    const [draft, setDraft] = useState('');
    const [composing, setComposing] = useState(false);
    const [posting, setPosting] = useState(false);
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
    });

    useEffect(() => {
        let active = true;
        Promise.all([
            api.get('/auth/me').catch(() => null),
            api.get('/feed', { params: { scope: 'mine', per_page: 1 } }).catch(() => null),
        ]).then(([meRes, feedRes]) => {
            if (!active) return;
            const user = meRes?.data?.user ?? meRes?.data ?? null;
            setMe(user);
            const myId = user?.id;
            const posts = feedRes?.data?.data ?? [];
            // "New to the community" = this member has not authored a post yet.
            setHasPosted(posts.some((p) => p?.user?.id === myId));
        });
        return () => { active = false; };
    }, []);

    const dismiss = () => {
        setDismissed(true);
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    };

    const startIntro = () => {
        const company = me?.profile?.company || me?.name || '';
        setDraft(
            t(
                'feed_intro_template',
                'Hello everyone 👋 I am {{name}}. We work in our sector and are looking to connect with merchants and suppliers here. Happy to answer any questions about what we produce.',
                { name: company },
            ),
        );
        setComposing(true);
    };

    const publish = async () => {
        if (!draft.trim()) return;
        setPosting(true);
        try {
            await api.post('/posts', { type: 'update_news', body: draft.trim() });
            dismiss();
        } catch {
            /* keep the draft so nothing is lost */
        } finally {
            setPosting(false);
        }
    };

    if (dismissed || hasPosted) return null;

    const name = me?.profile?.company || me?.name || '';

    return (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                    <HiOutlineSparkles className="h-5 w-5" aria-hidden />
                    {t('feed_welcome_title', 'Welcome to the community, {{name}}!', { name })}
                </h2>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label={t('dismiss', 'Dismiss')}
                    className="rounded-lg p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                    <HiXMark className="h-5 w-5" aria-hidden />
                </button>
            </div>

            <p className="mt-1 text-sm text-white/85">
                {t('feed_welcome_body', 'Share products, offers and supply requests with merchants and suppliers in your sector.')}
            </p>

            {composing ? (
                <div className="mt-4">
                    <textarea
                        rows={4}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full rounded-xl border-0 bg-white/95 px-4 py-3 text-sm text-slate-800 outline-none"
                    />
                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={publish}
                            disabled={posting || !draft.trim()}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-white/90 disabled:opacity-50"
                        >
                            {posting ? t('sending', 'Sending…') : t('feed_intro_publish', 'Publish')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setComposing(false)}
                            className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
                        >
                            {t('cancel', 'Cancel')}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={startIntro}
                    className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-white/90"
                >
                    {t('feed_intro_cta', 'Introduce yourself')}
                </button>
            )}
        </section>
    );
}
