import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import toast from 'react-hot-toast';
import {
    HiOutlineCamera,
    HiOutlineClock,
    HiOutlineDevicePhoneMobile,
    HiOutlineKey,
    HiOutlineShieldCheck,
    HiOutlineUser,
} from 'react-icons/hi2';
import api from '../api/client';
import UserAvatar from '../components/UserAvatar';
import ConfirmDialog from '../components/ConfirmDialog';
import PaginationBar from '../components/table/PaginationBar';
import { useGoogleOAuthClientId } from '../hooks/useGoogleOAuthClientId';

function unwrapUser(payload) {
    if (!payload) return null;
    return payload.data ?? payload;
}

export default function ProfilePage() {
    const { t } = useTranslation();
    const [me, setMe] = useState(null);
    const [name, setName] = useState('');
    const [notifyLoginEmail, setNotifyLoginEmail] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [profile, setProfile] = useState({
        username: '',
        phone: '',
        company: '',
        city: '',
        country: '',
        address: '',
        biography: '',
        tagline: '',
        website: '',
        cover_color: '',
        is_public: true,
    });
    const [coverUrl, setCoverUrl] = useState('');
    const [uploadingCover, setUploadingCover] = useState(false);
    const [tab, setTab] = useState('profile'); // profile | account | activity
    const [socials, setSocials] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [googleBusy, setGoogleBusy] = useState(false);
    const [err, setErr] = useState('');

    const [historyRows, setHistoryRows] = useState([]);
    const [historyMeta, setHistoryMeta] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);

    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [confirmSessionId, setConfirmSessionId] = useState(null);
    const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);
    const [revoking, setRevoking] = useState(false);

    const { clientId: googleClientId, resolved: googleConfigResolved } = useGoogleOAuthClientId();

    const loadProfile = useCallback(async () => {
        const { data } = await api.get('/auth/me');
        const u = unwrapUser(data.user);
        if (!u) return;
        setMe(u);
        setName(u.name || '');
        setNotifyLoginEmail(!!u.notify_login_email);
        const pr = u.profile || {};
        setProfile({
            username: pr.username || '',
            phone: pr.phone || '',
            company: pr.company || '',
            city: pr.city || '',
            country: pr.country || '',
            address: pr.address || '',
            biography: pr.biography || '',
            tagline: pr.tagline || '',
            website: pr.website || '',
            cover_color: pr.cover_color || '',
            is_public: pr.is_public !== false,
        });
        setCoverUrl(pr.cover_photo_url || '');
        let sm = {};
        if (pr.social_media) {
            try { sm = typeof pr.social_media === 'string' ? JSON.parse(pr.social_media) : pr.social_media; } catch { sm = {}; }
        }
        setSocials(sm && typeof sm === 'object' ? sm : {});
    }, []);

    const loadHistory = useCallback(async (page = 1) => {
        setHistoryLoading(true);
        try {
            const { data } = await api.get('/auth/login-history', { params: { page, per_page: 10 } });
            setHistoryRows(data.data ?? []);
            setHistoryMeta(data.meta ?? null);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    const loadSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const { data } = await api.get('/auth/sessions');
            setSessions(data.data ?? []);
        } finally {
            setSessionsLoading(false);
        }
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                await Promise.all([loadProfile(), loadHistory(1), loadSessions()]);
            } catch (e) {
                if (active) setErr(e.response?.data?.message || e.message);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [loadProfile, loadHistory, loadSessions]);

    useEffect(() => {
        if (!loading) {
            void loadHistory(historyPage);
        }
    }, [historyPage, loading, loadHistory]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const cleanSocials = Object.fromEntries(
                Object.entries(socials).map(([k, v]) => [k, String(v || '').trim()]).filter(([, v]) => v),
            );
            const payload = {
                name,
                notify_login_email: notifyLoginEmail,
                profile: {
                    ...profile,
                    social_media: Object.keys(cleanSocials).length ? JSON.stringify(cleanSocials) : null,
                },
            };
            const { data } = await api.patch('/auth/me', payload);
            const u = unwrapUser(data.user);
            if (u) {
                setMe(u);
                window.dispatchEvent(new Event('sellchase:me-updated'));
            }
            toast.success(t('profile_saved_toast'));
        } catch (e2) {
            const msg = e2.response?.data?.message;
            const errors = e2.response?.data?.errors;
            if (errors && typeof errors === 'object') {
                setErr(Object.values(errors).flat().join(' ') || msg || e2.message);
            } else {
                setErr(msg || e2.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const onChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t('profile_password_mismatch'));
            return;
        }
        setPasswordSaving(true);
        setErr('');
        try {
            await api.put('/auth/password', {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            toast.success(t('profile_password_updated_toast'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (e2) {
            const msg = e2.response?.data?.message;
            const errors = e2.response?.data?.errors;
            if (errors && typeof errors === 'object') {
                setErr(Object.values(errors).flat().join(' ') || msg || e2.message);
            } else {
                setErr(msg || e2.message);
            }
            toast.error(msg || e2.message);
        } finally {
            setPasswordSaving(false);
        }
    };

    const onCoverUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        setErr('');
        try {
            const fd = new FormData();
            fd.append('cover', file);
            const { data } = await api.post('/auth/me/cover', fd);
            const u = unwrapUser(data.user);
            const pr = u?.profile || {};
            setCoverUrl(pr.cover_photo_url || '');
            setProfile((p) => ({ ...p, cover_color: '' }));
            toast.success(data.message || t('profile_cover_uploaded', 'Cover updated'));
        } catch (e2) {
            const msg = e2.response?.data?.message || e2.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setUploadingCover(false);
            e.target.value = '';
        }
    };

    const applyCoverColor = async (color) => {
        setUploadingCover(true);
        setErr('');
        try {
            if (coverUrl) {
                await api.delete('/auth/me/cover');
                setCoverUrl('');
            }
            await api.patch('/auth/me', { profile: { cover_color: color } });
            setProfile((p) => ({ ...p, cover_color: color }));
            toast.success(t('profile_cover_color_applied', 'Cover color applied'));
        } catch (e2) {
            toast.error(e2.response?.data?.message || e2.message);
        } finally {
            setUploadingCover(false);
        }
    };

    const removeCover = async () => {
        setUploadingCover(true);
        try {
            if (coverUrl) await api.delete('/auth/me/cover');
            await api.patch('/auth/me', { profile: { cover_color: null } });
            setCoverUrl('');
            setProfile((p) => ({ ...p, cover_color: '' }));
            toast.success(t('profile_cover_removed', 'Cover removed'));
        } catch (e2) {
            toast.error(e2.response?.data?.message || e2.message);
        } finally {
            setUploadingCover(false);
        }
    };

    const onAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        setErr('');
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const { data } = await api.post('/auth/me/avatar', fd);
            const u = unwrapUser(data.user);
            if (u) {
                setMe(u);
                window.dispatchEvent(new Event('sellchase:me-updated'));
            }
            toast.success(t('profile_avatar_uploaded'));
        } catch (e2) {
            const msg = e2.response?.data?.message || e2.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const onAvatarDelete = async () => {
        setUploadingAvatar(true);
        setErr('');
        try {
            const { data } = await api.delete('/auth/me/avatar');
            const u = unwrapUser(data.user);
            if (u) {
                setMe(u);
                window.dispatchEvent(new Event('sellchase:me-updated'));
            }
            toast.success(t('profile_avatar_removed'));
        } catch (e2) {
            const msg = e2.response?.data?.message || e2.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const disconnectGoogle = async () => {
        setGoogleBusy(true);
        try {
            const { data } = await api.delete('/auth/google/disconnect');
            const u = unwrapUser(data.user);
            if (u) {
                setMe(u);
                window.dispatchEvent(new Event('sellchase:me-updated'));
            }
            toast.success(t('profile_google_disconnected'));
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setGoogleBusy(false);
        }
    };

    const revokeOne = async () => {
        if (!confirmSessionId) return;
        setRevoking(true);
        try {
            await api.delete(`/auth/sessions/${confirmSessionId}`);
            toast.success(t('profile_session_revoked'));
            setConfirmSessionId(null);
            await loadSessions();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setRevoking(false);
        }
    };

    const revokeOthers = async () => {
        setRevoking(true);
        try {
            await api.delete('/auth/sessions/others');
            toast.success(t('profile_sessions_others_revoked'));
            setConfirmRevokeOthers(false);
            await loadSessions();
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setRevoking(false);
        }
    };

    const sortedSessions = useMemo(() => {
        return [...sessions].sort((a, b) => {
            if (a.current) return -1;
            if (b.current) return 1;
            return new Date(b.last_used_at || 0).getTime() - new Date(a.last_used_at || 0).getTime();
        });
    }, [sessions]);

    if (loading) {
        return <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">{t('loading')}</div>;
    }

    // Shared style tokens keep the cards, headers, and fields visually consistent.
    const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-xs';
    const cardHeadClass = 'mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 text-base font-semibold text-slate-900';
    const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';
    const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-xs transition focus:border-brand focus:outline-hidden focus:ring-2 focus:ring-brand/20';

    const TABS = [
        { key: 'profile', label: t('profile_tab_profile', 'Profile'), icon: HiOutlineUser },
        { key: 'account', label: t('profile_tab_account', 'Account & security'), icon: HiOutlineShieldCheck },
        { key: 'activity', label: t('profile_tab_activity', 'Activity'), icon: HiOutlineClock },
    ];

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('profile_page_title')}</h1>
                <p className="mt-1 text-sm text-slate-500">{t('profile_page_subtitle')}</p>
            </div>

            {err ? <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}

            {/* Tab bar */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label={t('profile_page_title')}>
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            aria-current={tab === key ? 'page' : undefined}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                                tab === key
                                    ? 'border-brand text-brand'
                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                            }`}
                        >
                            <Icon className="h-4 w-4" aria-hidden />
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Profile tab — identity details */}
            <div className={tab === 'profile' ? 'block' : 'hidden'}>
                <form onSubmit={onSubmit} className={`space-y-5 ${cardClass}`}>
                    <h2 className={cardHeadClass}>
                        <HiOutlineUser className="h-5 w-5 text-brand" aria-hidden />
                        {t('profile_section_basic')}
                    </h2>

                    <label className="block">
                        <span className={`${labelClass} flex items-center gap-1`}>
                            <HiOutlineUser className="h-4 w-4" aria-hidden />
                            {t('col_name')}
                        </span>
                        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                        <input type="checkbox" className="mt-0.5" checked={notifyLoginEmail} onChange={(e) => setNotifyLoginEmail(e.target.checked)} />
                        <span className="text-sm text-slate-700">{t('profile_notify_login_email')}</span>
                    </label>

                    {/* Cover photo / color */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                        <span className={labelClass}>{t('profile_cover', 'Cover')}</span>
                        <div
                            className="mt-2 h-28 w-full overflow-hidden rounded-xl bg-cover bg-center ring-1 ring-slate-200"
                            style={coverUrl
                                ? { backgroundImage: `url('${coverUrl}')` }
                                : { background: profile.cover_color || 'linear-gradient(120deg,#062f63,#0a4ea8 55%,#00c0a9)' }}
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 ${uploadingCover ? 'opacity-60' : ''}`}>
                                {uploadingCover ? '…' : t('profile_cover_upload', 'Upload image')}
                                <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} disabled={uploadingCover} />
                            </label>
                            <span className="text-xs text-slate-400">{t('or', 'or')}</span>
                            <input
                                type="color"
                                value={profile.cover_color || '#004BB4'}
                                onChange={(e) => applyCoverColor(e.target.value)}
                                className="h-9 w-12 cursor-pointer rounded-sm border border-slate-200 bg-white p-0.5"
                                title={t('profile_cover_color', 'Cover color')}
                                disabled={uploadingCover}
                            />
                            {['#004BB4', '#0a4ea8', '#00C0A9', '#0f172a', '#7c3aed', '#dc2626', '#ea580c', '#16a34a'].map((c) => (
                                <button key={c} type="button" onClick={() => applyCoverColor(c)} disabled={uploadingCover}
                                    className="h-7 w-7 rounded-full ring-1 ring-slate-300 transition hover:scale-110" style={{ background: c }} aria-label={c} />
                            ))}
                            {(coverUrl || profile.cover_color) ? (
                                <button type="button" onClick={removeCover} disabled={uploadingCover}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                                    {t('remove', 'Remove')}
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="block">
                            <span className={labelClass}>{t('profile_username')}</span>
                            <input className={inputClass} value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
                        </label>
                        <label className="block">
                            <span className={labelClass}>{t('profile_phone')}</span>
                            <input className={inputClass} value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                        </label>
                        <label className="block md:col-span-2">
                            <span className={labelClass}>{t('profile_company')}</span>
                            <input className={inputClass} value={profile.company} onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))} />
                        </label>
                        <label className="block">
                            <span className={labelClass}>{t('profile_city')}</span>
                            <input className={inputClass} value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
                        </label>
                        <label className="block">
                            <span className={labelClass}>{t('profile_country')}</span>
                            <input className={inputClass} value={profile.country} onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))} />
                        </label>
                        <label className="block md:col-span-2">
                            <span className={labelClass}>{t('profile_address')}</span>
                            <input className={inputClass} value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
                        </label>
                        <label className="block md:col-span-2">
                            <span className={labelClass}>{t('profile_tagline')}</span>
                            <input className={inputClass} value={profile.tagline} onChange={(e) => setProfile((p) => ({ ...p, tagline: e.target.value }))} placeholder={t('profile_tagline_placeholder')} />
                        </label>
                        <label className="block md:col-span-2">
                            <span className={labelClass}>{t('profile_biography')}</span>
                            <textarea rows={4} className={inputClass} value={profile.biography} onChange={(e) => setProfile((p) => ({ ...p, biography: e.target.value }))} />
                        </label>
                        <label className="block md:col-span-2">
                            <span className={labelClass}>{t('profile_website')}</span>
                            <input className={inputClass} value={profile.website} onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))} placeholder="https://" />
                        </label>
                        <div className="md:col-span-2">
                            <span className={`${labelClass} mb-2`}>{t('profile_social', 'Social media')}</span>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { key: 'instagram', label: 'Instagram' },
                                    { key: 'linkedin', label: 'LinkedIn' },
                                    { key: 'facebook', label: 'Facebook' },
                                    { key: 'x', label: 'X (Twitter)' },
                                    { key: 'youtube', label: 'YouTube' },
                                    { key: 'tiktok', label: 'TikTok' },
                                    { key: 'whatsapp', label: 'WhatsApp' },
                                    { key: 'telegram', label: 'Telegram' },
                                ].map(({ key, label }) => (
                                    <label key={key} className="block">
                                        <span className="mb-1 block text-xs text-slate-500">{label}</span>
                                        <input
                                            className={inputClass}
                                            value={socials[key] || ''}
                                            onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
                                            placeholder="https://…"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2 md:col-span-2">
                            <input type="checkbox" checked={!!profile.is_public} onChange={(e) => setProfile((p) => ({ ...p, is_public: e.target.checked }))} />
                            <span className="text-sm text-slate-700">{t('profile_is_public_label')}</span>
                        </label>
                        {profile.username ? (
                            <div className="md:col-span-2 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                                <span className="text-slate-600">{t('profile_public_url')}</span>
                                <code className="text-brand">/u/{profile.username}</code>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = `${window.location.origin}/u/${profile.username}`;
                                        navigator.clipboard?.writeText(url);
                                    }}
                                    className="ms-auto rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-white"
                                >
                                    {t('profile_copy_link')}
                                </button>
                                <a href={`/u/${profile.username}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-white">
                                    {t('profile_open_public')}
                                </a>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <a href="/settings/verification" className="text-xs font-medium text-brand hover:underline">
                            {t('profile_request_verification_link')}
                        </a>
                        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50">
                            {t('product_form_save')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Account & security tab — avatar, password, Google */}
            <div className={tab === 'account' ? 'block' : 'hidden'}>
                <div className="grid items-start gap-6 lg:grid-cols-2">
                    <div className={cardClass}>
                        <h2 className={cardHeadClass}>
                            <HiOutlineCamera className="h-5 w-5 text-brand" aria-hidden />
                            {t('profile_section_avatar')}
                        </h2>
                        <div className="flex items-center gap-4">
                            <UserAvatar user={me || {}} sizeClass="h-16 w-16" />
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                                    <input type="file" className="hidden" accept="image/*" onChange={onAvatarUpload} disabled={uploadingAvatar} />
                                    {uploadingAvatar ? '…' : t('profile_avatar_upload')}
                                </label>
                                <button type="button" onClick={onAvatarDelete} disabled={uploadingAvatar} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                    {t('profile_avatar_remove')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={onChangePassword} className={`space-y-4 ${cardClass}`}>
                        <h2 className={cardHeadClass}>
                            <HiOutlineShieldCheck className="h-5 w-5 text-brand" aria-hidden />
                            {t('profile_section_security')}
                        </h2>
                        <label className="block">
                            <span className={labelClass}>{t('profile_current_password')}</span>
                            <input className={inputClass} type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        </label>
                        <label className="block">
                            <span className={labelClass}>{t('profile_new_password')}</span>
                            <input className={inputClass} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </label>
                        <label className="block">
                            <span className={labelClass}>{t('profile_confirm_password')}</span>
                            <input className={inputClass} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </label>
                        <button
                            type="submit"
                            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            {t('profile_change_password_btn')}
                        </button>
                    </form>

                    <div className={cardClass}>
                        <h2 className={cardHeadClass}>
                            <HiOutlineKey className="h-5 w-5 text-brand" aria-hidden />
                            {t('profile_section_google')}
                        </h2>
                        <p className="text-sm text-slate-600">
                            {me?.google_connected ? t('profile_google_connected') : t('profile_google_not_connected')}
                        </p>
                        <div className="mt-3">
                            {me?.google_connected ? (
                                <button type="button" onClick={disconnectGoogle} disabled={googleBusy} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
                                    {t('profile_google_disconnect')}
                                </button>
                            ) : googleConfigResolved && googleClientId ? (
                                <GoogleOAuthProvider clientId={googleClientId}>
                                    <GoogleLogin
                                        onSuccess={async (cred) => {
                                            setGoogleBusy(true);
                                            try {
                                                const { data } = await api.post('/auth/google/connect', {
                                                    id_token: cred.credential,
                                                });
                                                const u = unwrapUser(data.user);
                                                if (u) {
                                                    setMe(u);
                                                    window.dispatchEvent(new Event('sellchase:me-updated'));
                                                }
                                                toast.success(t('profile_google_connected_toast'));
                                            } catch (e) {
                                                toast.error(e.response?.data?.message || e.message);
                                            } finally {
                                                setGoogleBusy(false);
                                            }
                                        }}
                                        onError={() => toast.error(t('google_login_failed'))}
                                        theme="outline"
                                        size="large"
                                        text="continue_with"
                                        shape="rectangular"
                                    />
                                </GoogleOAuthProvider>
                            ) : googleConfigResolved ? (
                                <p className="text-xs text-slate-500">{t('profile_google_missing_client')}</p>
                            ) : (
                                <p className="text-xs text-slate-400">{t('loading')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity tab — login history + active sessions */}
            <div className={`space-y-6 ${tab === 'activity' ? 'block' : 'hidden'}`}>
            <div className={cardClass}>
                <h2 className={cardHeadClass}>
                    <HiOutlineClock className="h-5 w-5 text-brand" aria-hidden /> {t('profile_section_login_history')}
                </h2>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-auto">
                        <table className="min-w-full text-start text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                                <tr>
                                    <th className="px-4 py-3">{t('profile_login_method')}</th>
                                    <th className="px-4 py-3">IP</th>
                                    <th className="px-4 py-3">UA</th>
                                    <th className="px-4 py-3">{t('created_at')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyRows.length === 0 && !historyLoading ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>{t('empty')}</td>
                                    </tr>
                                ) : null}
                                {historyRows.map((row) => (
                                    <tr key={row.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">{t(`profile_login_method_${row.login_method}`, { defaultValue: row.login_method })}</td>
                                        <td className="px-4 py-3">{row.ip_address || '—'}</td>
                                        <td className="px-4 py-3 max-w-md truncate" title={row.user_agent || ''}>{row.user_agent || '—'}</td>
                                        <td className="px-4 py-3">{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar meta={historyMeta} loading={historyLoading} onPageChange={setHistoryPage} />
                </div>
            </div>

            <div className={cardClass}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <HiOutlineDevicePhoneMobile className="h-5 w-5 text-brand" aria-hidden /> {t('profile_section_active_sessions')}
                    </h2>
                    <button type="button" onClick={() => setConfirmRevokeOthers(true)} disabled={sessionsLoading} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                        {t('profile_revoke_others')}
                    </button>
                </div>
                <div className="grid gap-3">
                    {sortedSessions.length === 0 && !sessionsLoading ? (
                        <p className="text-sm text-slate-500">{t('empty')}</p>
                    ) : null}
                    {sortedSessions.map((s) => (
                        <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                    {s.device_name || t('profile_unknown_device')}
                                    {s.current ? <span className="ms-2 rounded-sm bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">{t('profile_current_session')}</span> : null}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600">{s.ip_address || '—'} · {s.last_used_at ? new Date(s.last_used_at).toLocaleString() : '—'}</p>
                                <p className="mt-0.5 max-w-160 truncate text-xs text-slate-500" title={s.user_agent || ''}>{s.user_agent || '—'}</p>
                            </div>
                            {!s.current ? (
                                <button type="button" onClick={() => setConfirmSessionId(s.id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
                                    {t('profile_revoke_session')}
                                </button>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
            </div>

            <ConfirmDialog
                open={!!confirmSessionId}
                onClose={() => setConfirmSessionId(null)}
                title={t('profile_revoke_session_title')}
                body={t('profile_revoke_session_body')}
                confirmLabel={t('btn_confirm')}
                cancelLabel={t('cancel')}
                danger
                loading={revoking}
                onConfirm={revokeOne}
            />

            <ConfirmDialog
                open={confirmRevokeOthers}
                onClose={() => setConfirmRevokeOthers(false)}
                title={t('profile_revoke_others_title')}
                body={t('profile_revoke_others_body')}
                confirmLabel={t('btn_confirm')}
                cancelLabel={t('cancel')}
                danger
                loading={revoking}
                onConfirm={revokeOthers}
            />
        </div>
    );
}
