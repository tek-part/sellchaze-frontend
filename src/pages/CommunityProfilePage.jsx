import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HiCheckBadge,
    HiOutlineBriefcase,
    HiOutlineCamera,
    HiOutlineGlobeAlt,
    HiOutlineMapPin,
    HiOutlinePencilSquare,
    HiOutlineUsers,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api from '../api/client';
import { langParam } from '../api/lang';
import CommunityShell from '../features/community/components/CommunityShell';
import FeedSkeleton from '../features/community/components/FeedSkeleton';
import PostCard from '../components/feed/PostCard';
import notify from '../components/ui/notify';
import { initials } from '../components/feed/helpers';

/**
 * The member's social profile inside the platform — the Facebook shape:
 * cover, overlapping avatar, identity row, tabs. When the viewer is looking
 * at their own profile the cover and avatar become uploadable and the About
 * panel becomes an inline edit form; everyone else gets a read-only page.
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
            <CommunityShell rightRail={false}>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center">
                    <p className="text-base font-bold text-slate-600">{t('profile_not_found', 'This profile is not available')}</p>
                </div>
            </CommunityShell>
        );
    }

    if (!data) {
        return (
            <CommunityShell rightRail={false}>
                <div className="space-y-5">
                    <div className="sc-skeleton h-56 rounded-2xl" />
                    <FeedSkeleton count={2} />
                </div>
            </CommunityShell>
        );
    }

    const { user, profile, stats } = data;
    const memberYear = user.created_at ? new Date(user.created_at).getFullYear() : null;

    const statChip = (value, label) => (
        <span className="flex flex-col items-center rounded-xl bg-slate-50 px-4 py-2 ring-1 ring-slate-200/70">
            <span className="text-base font-bold text-slate-900">{value}</span>
            <span className="text-[11px] font-semibold text-slate-500">{label}</span>
        </span>
    );

    return (
        <CommunityShell rightRail={false}>
            <div className="space-y-5">
                {/* Cover + identity */}
                <section className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80">
                    <div className="relative h-44 bg-gradient-to-r from-brand-dark via-brand to-accent sm:h-56">
                        {profile.cover_photo ? (
                            <img src={profile.cover_photo} alt="" className="h-full w-full object-cover" />
                        ) : null}
                        {isMe ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => coverInputRef.current?.click()}
                                    disabled={coverBusy}
                                    className="sc-press absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur transition hover:bg-white disabled:opacity-60"
                                >
                                    <HiOutlineCamera className="h-4 w-4" aria-hidden />
                                    {coverBusy ? t('profile_saving', 'Saving…') : t('profile_edit_cover', 'Edit cover')}
                                </button>
                                <input ref={coverInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { uploadImage('cover', e.target.files?.[0]); e.target.value = ''; }} />
                            </>
                        ) : null}
                    </div>

                    <div className="px-5 pb-5 sm:px-7">
                        <div className="-mt-10 flex flex-wrap items-end gap-4 sm:-mt-12">
                            <div className="relative">
                                {profile.photo ? (
                                    <img src={profile.photo} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-white sm:h-28 sm:w-28" />
                                ) : (
                                    <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand text-2xl font-bold text-white ring-4 ring-white sm:h-28 sm:w-28">
                                        {initials(profile.company || user.name)}
                                    </span>
                                )}
                                {isMe ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => photoInputRef.current?.click()}
                                            disabled={photoBusy}
                                            aria-label={t('profile_edit_photo', 'Change photo')}
                                            className="sc-press absolute bottom-1 end-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
                                        >
                                            <HiOutlineCamera className="h-4 w-4" aria-hidden />
                                        </button>
                                        <input ref={photoInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { uploadImage('avatar', e.target.files?.[0]); e.target.value = ''; }} />
                                    </>
                                ) : null}
                            </div>

                            <div className="min-w-0 flex-1 pb-1">
                                <h1 className="flex items-center gap-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    <span className="truncate">{profile.company || user.name}</span>
                                    {user.is_verified ? <HiCheckBadge className="h-6 w-6 shrink-0 text-brand" aria-hidden /> : null}
                                </h1>
                                <p className="truncate text-sm text-slate-500">
                                    @{profile.username}
                                    {profile.tagline ? ` · ${profile.tagline}` : ''}
                                </p>
                            </div>

                            {isMe ? (
                                <button
                                    type="button"
                                    onClick={() => { setEditing((v) => !v); setTab('about'); }}
                                    className="sc-press mb-1 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark"
                                >
                                    <HiOutlinePencilSquare className="h-4 w-4" aria-hidden />
                                    {t('profile_edit_about', 'Edit profile')}
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {statChip(stats.partners_count ?? 0, t('profile_partners', 'Partners'))}
                            {stats.products_count ? statChip(stats.products_count, t('profile_products', 'Products')) : null}
                            {statChip(stats.years_active ?? 0, t('profile_years', 'Years active'))}
                            {memberYear ? (
                                <span className="ms-auto text-xs font-semibold text-slate-400">
                                    {t('profile_member_since', 'Member since {{year}}', { year: memberYear })}
                                </span>
                            ) : null}
                        </div>

                        {/* Tabs */}
                        <div className="mt-4 flex gap-1 border-t border-slate-100 pt-2">
                            {[['posts', t('profile_tab_posts', 'Posts')], ['about', t('profile_tab_about', 'About')]].map(([id, label]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setTab(id)}
                                    aria-pressed={tab === id}
                                    className={`sc-press relative rounded-lg px-4 py-2 text-sm font-bold transition ${
                                        tab === id ? 'text-brand' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                                >
                                    {label}
                                    <span className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand transition-transform duration-300 ${tab === id ? 'scale-x-100' : 'scale-x-0'}`} aria-hidden />
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {tab === 'about' ? (
                    <section className="rounded-2xl bg-white p-5 shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80 sm:p-7">
                        {editing && isMe ? (
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
                                <div className="grid gap-4 sm:grid-cols-2">
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
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-base font-bold text-slate-900">{t('profile_about_title', 'About')}</h2>
                                {profile.biography ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{profile.biography}</p> : null}
                                <ul className="space-y-2.5 text-sm text-slate-600">
                                    {profile.company ? (
                                        <li className="flex items-center gap-2.5"><HiOutlineBriefcase className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />{profile.company}</li>
                                    ) : null}
                                    {profile.city || profile.country ? (
                                        <li className="flex items-center gap-2.5"><HiOutlineMapPin className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />{[profile.city, profile.country].filter(Boolean).join('، ')}</li>
                                    ) : null}
                                    {profile.website ? (
                                        <li className="flex items-center gap-2.5">
                                            <HiOutlineGlobeAlt className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                                            <a href={profile.website} target="_blank" rel="noreferrer" className="truncate font-semibold text-brand hover:underline">{profile.website}</a>
                                        </li>
                                    ) : null}
                                </ul>
                            </div>
                        )}
                    </section>
                ) : postsLoading ? (
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
                )}
            </div>
        </CommunityShell>
    );
}
