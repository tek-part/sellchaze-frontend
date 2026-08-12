import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiCheckBadge,
    HiOutlineArrowLeft,
    HiOutlineBriefcase,
    HiOutlineCamera,
    HiOutlineCalendarDays,
    HiOutlineGlobeAlt,
    HiOutlineMapPin,
    HiOutlinePencilSquare,
    HiOutlineUsers,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';
import FeedSkeleton from '../features/community/components/FeedSkeleton';
import QuickComposer from '../features/community/components/QuickComposer';
import PostCard from '../components/feed/PostCard';
import notify from '../components/ui/notify';
import { initials } from '../components/feed/helpers';

/**
 * The member's social profile — the full Facebook shape, and the whole page:
 * no community rails here. A tall cover with the avatar breaking out of its
 * bottom edge, identity + actions on one row (including a Website button when
 * the merchant has one), a tab strip, then the classic two-column body — an
 * intro card beside the member's wall. The viewer's own profile turns the
 * cover, the avatar and the intro into editable surfaces.
 */
export default function CommunityProfilePage() {
    const { username } = useParams();
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [data, setData] = useState(null);
    const [missing, setMissing] = useState(false);
    const [me, setMe] = useState(null);
    const [tab, setTab] = useState('posts');

    const [posts, setPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ biography: '', tagline: '', website: '', company: '', city: '', country: '' });
    const [saving, setSaving] = useState(false);
    const [coverBusy, setCoverBusy] = useState(false);
    const [photoBusy, setPhotoBusy] = useState(false);
    const coverInputRef = useRef(null);
    const photoInputRef = useRef(null);

    const load = useCallback(() => {
        api.get(`/public/profile/${encodeURIComponent(username)}`)
            .then(({ data: payload }) => {
                setData(payload);
                setForm({
                    biography: payload.profile?.biography ?? '',
                    tagline: payload.profile?.tagline ?? '',
                    website: payload.profile?.website ?? '',
                    company: payload.profile?.company ?? '',
                    city: payload.profile?.city ?? '',
                    country: payload.profile?.country ?? '',
                });
            })
            .catch(() => setMissing(true));
    }, [username]);

    useEffect(() => {
        setData(null);
        setMissing(false);
        setTab('posts');
        load();
    }, [load]);

    useEffect(() => {
        api.get('/auth/me').then(({ data: payload }) => setMe(payload.user || payload)).catch(() => {});
    }, []);

    useEffect(() => {
        let alive = true;
        setPostsLoading(true);
        api.get('/feed', { params: { author: username, per_page: 10, lang } })
            .then(({ data: payload }) => {
                if (alive) setPosts(payload.data ?? []);
            })
            .catch(() => {
                if (alive) setPosts([]);
            })
            .finally(() => {
                if (alive) setPostsLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [username, lang]);

    const isMe = !!me?.profile?.username && me.profile.username === username;

    const uploadImage = async (kind, file) => {
        if (!file) return;
        const setBusy = kind === 'cover' ? setCoverBusy : setPhotoBusy;
        setBusy(true);
        try {
            const body = new FormData();
            body.append(kind === 'cover' ? 'cover' : 'avatar', file);
            await api.post(kind === 'cover' ? '/auth/me/cover' : '/auth/me/avatar', body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            notify.success(kind === 'cover' ? t('profile_cover_updated', 'Cover updated') : t('profile_photo_updated', 'Photo updated'));
            load();
        } catch (error) {
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || '');
        } finally {
            setBusy(false);
        }
    };

    const saveAbout = async (event) => {
        event.preventDefault();
        if (saving) return;
        setSaving(true);
        try {
            await api.patch('/auth/me', { profile: form });
            notify.success(t('profile_saved', 'Profile updated'));
            setEditing(false);
            load();
        } catch (error) {
            notify.error(t('toast_failed', 'Something went wrong'), error?.response?.data?.message || '');
        } finally {
            setSaving(false);
        }
    };

    if (missing) {
        return (
            <div className="mx-auto w-full max-w-[1100px]">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center">
                    <p className="text-base font-bold text-slate-600">{t('profile_not_found', 'This profile is not available')}</p>
                    <Link to="/community" className="sc-press mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white">
                        <HiOutlineArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                        {t('reels_back', 'Back')}
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="mx-auto w-full max-w-[1100px] space-y-5">
                <div className="sc-skeleton h-72 rounded-2xl" />
                <FeedSkeleton count={2} />
            </div>
        );
    }

    const { user, profile, stats } = data;
    const memberYear = user.created_at ? new Date(user.created_at).getFullYear() : null;
    const displayName = profile.company || user.name;

    const aboutRows = [
        profile.company ? { Icon: HiOutlineBriefcase, node: profile.company } : null,
        profile.city || profile.country ? { Icon: HiOutlineMapPin, node: [profile.city, profile.country].filter(Boolean).join('، ') } : null,
        profile.website
            ? {
                  Icon: HiOutlineGlobeAlt,
                  node: (
                      <a href={profile.website} target="_blank" rel="noreferrer" className="truncate font-semibold text-brand hover:underline">
                          {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                  ),
              }
            : null,
        memberYear ? { Icon: HiOutlineCalendarDays, node: t('profile_member_since', 'Member since {{year}}', { year: memberYear }) } : null,
    ].filter(Boolean);

    const editForm = (
        <form onSubmit={saveAbout} className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">{t('profile_edit_about', 'Edit profile')}</h2>
                <button type="button" onClick={() => setEditing(false)} aria-label={t('cancel', 'Cancel')} className="sc-press rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
                    <HiOutlineXMark className="h-5 w-5" aria-hidden />
                </button>
            </div>
            <label className="block text-xs font-bold text-slate-600">
                {t('profile_bio', 'Bio')}
                <textarea rows={4} value={form.biography} onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-bold text-slate-600">
                {t('profile_tagline', 'Tagline')}
                <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-bold text-slate-600">
                {t('profile_company', 'Company')}
                <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-bold text-slate-600">
                {t('profile_website', 'Website')}
                <input type="url" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="https://" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-600">
                    {t('profile_city', 'City')}
                    <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </label>
                <label className="block text-xs font-bold text-slate-600">
                    {t('profile_country', 'Country')}
                    <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                </label>
            </div>
            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="sc-press rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-50">
                    {saving ? t('profile_saving', 'Saving…') : t('profile_save', 'Save changes')}
                </button>
            </div>
        </form>
    );

    const introCard = (
        <section className="rounded-2xl bg-white p-5 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
            {editing && isMe ? (
                editForm
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900">{t('profile_about_title', 'About')}</h2>
                        {isMe ? (
                            <button
                                type="button"
                                onClick={() => setEditing(true)}
                                aria-label={t('profile_edit_about', 'Edit profile')}
                                className="sc-press rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <HiOutlinePencilSquare className="h-5 w-5" aria-hidden />
                            </button>
                        ) : null}
                    </div>
                    {profile.biography ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{profile.biography}</p> : null}
                    {aboutRows.length ? (
                        <ul className="mt-4 space-y-3 text-sm text-slate-600">
                            {aboutRows.map(({ Icon, node }, index) => (
                                <li key={index} className="flex items-center gap-2.5">
                                    <Icon className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                                    <span className="min-w-0 flex-1 truncate">{node}</span>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </>
            )}
        </section>
    );

    const wall = postsLoading ? (
        <FeedSkeleton count={2} />
    ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand">
                <HiOutlineUsers className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-500">{t('profile_no_posts', 'No posts yet')}</p>
        </div>
    ) : (
        <div className="space-y-5">
            {posts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
            ))}
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-[1100px]">
            {/* Cover — tall and edge to edge, the Facebook silhouette. */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                <div className="relative h-56 bg-gradient-to-r from-brand-dark via-brand to-accent sm:h-72 lg:h-80">
                    {profile.cover_photo ? <img src={profile.cover_photo} alt="" className="h-full w-full object-cover" /> : null}
                    {isMe ? (
                        <>
                            <button
                                type="button"
                                onClick={() => coverInputRef.current?.click()}
                                disabled={coverBusy}
                                className="sc-press absolute bottom-4 end-4 inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2 text-sm font-bold text-slate-800 shadow-lg backdrop-blur transition hover:bg-white disabled:opacity-60"
                            >
                                <HiOutlineCamera className="h-4.5 w-4.5" aria-hidden />
                                {coverBusy ? t('profile_saving', 'Saving…') : t('profile_edit_cover', 'Edit cover')}
                            </button>
                            <input ref={coverInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { uploadImage('cover', e.target.files?.[0]); e.target.value = ''; }} />
                        </>
                    ) : null}
                </div>

                {/* Identity row — avatar breaking the cover, actions at the end. */}
                <div className="px-5 pb-0 sm:px-8">
                    <div className="-mt-14 flex flex-col items-start gap-3 sm:-mt-16 sm:flex-row sm:items-end sm:gap-5">
                        <div className="relative shrink-0">
                            {profile.photo ? (
                                <img src={profile.photo} alt="" className="h-32 w-32 rounded-full object-cover ring-4 ring-white sm:h-40 sm:w-40" />
                            ) : (
                                <span className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand text-3xl font-bold text-white ring-4 ring-white sm:h-40 sm:w-40">
                                    {initials(displayName)}
                                </span>
                            )}
                            {isMe ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => photoInputRef.current?.click()}
                                        disabled={photoBusy}
                                        aria-label={t('profile_edit_photo', 'Change photo')}
                                        className="sc-press absolute bottom-2 end-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-lg ring-2 ring-white transition hover:bg-slate-200 disabled:opacity-60"
                                    >
                                        <HiOutlineCamera className="h-5 w-5" aria-hidden />
                                    </button>
                                    <input ref={photoInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { uploadImage('avatar', e.target.files?.[0]); e.target.value = ''; }} />
                                </>
                            ) : null}
                        </div>

                        <div className="min-w-0 flex-1 pb-1 sm:pb-4">
                            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                <span className="truncate">{displayName}</span>
                                {user.is_verified ? <HiCheckBadge className="h-7 w-7 shrink-0 text-brand" aria-hidden /> : null}
                            </h1>
                            <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">
                                @{profile.username}
                                {profile.tagline ? ` · ${profile.tagline}` : ''}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-600">
                                {stats.partners_count ?? 0} {t('profile_partners', 'Partners')}
                                {stats.products_count ? <> · {stats.products_count} {t('profile_products', 'Products')}</> : null}
                                {memberYear ? <span className="text-slate-400"> · {t('profile_member_since', 'Member since {{year}}', { year: memberYear })}</span> : null}
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 pb-1 sm:pb-4">
                            {profile.website ? (
                                <a
                                    href={profile.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="sc-press inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
                                >
                                    <HiOutlineGlobeAlt className="h-5 w-5 text-brand" aria-hidden />
                                    {t('profile_visit_website', 'Website')}
                                </a>
                            ) : null}
                            {isMe ? (
                                <button
                                    type="button"
                                    onClick={() => setEditing(true)}
                                    className="sc-press inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark"
                                >
                                    <HiOutlinePencilSquare className="h-4 w-4" aria-hidden />
                                    {t('profile_edit_about', 'Edit profile')}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Tab strip */}
                    <div className="mt-4 flex gap-1 border-t border-slate-200/80">
                        {[['posts', t('profile_tab_posts', 'Posts')], ['about', t('profile_tab_about', 'About')]].map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                aria-pressed={tab === id}
                                className={`sc-press relative px-5 py-3.5 text-sm font-bold transition ${
                                    tab === id ? 'text-brand' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                            >
                                {label}
                                <span className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand transition-transform duration-300 ${tab === id ? 'scale-x-100' : 'scale-x-0'}`} aria-hidden />
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Body — intro card beside the wall, exactly the Facebook column split. */}
            <div className="mt-5">
                {tab === 'about' ? (
                    <div className="mx-auto max-w-2xl">{introCard}</div>
                ) : (
                    <div className="grid items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                        <div className="space-y-5 lg:sticky lg:top-1">{introCard}</div>
                        <div className="space-y-5">
                            {isMe ? <QuickComposer /> : null}
                            {wall}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
