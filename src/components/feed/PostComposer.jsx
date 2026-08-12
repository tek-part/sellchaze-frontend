import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    HiOutlineChevronDown,
    HiOutlineFaceSmile,
    HiOutlineMapPin,
    HiOutlinePaperClip,
    HiOutlinePhoto,
    HiOutlinePlayCircle,
    HiOutlineRectangleStack,
    HiOutlineSparkles,
    HiOutlineXMark,
} from 'react-icons/hi2';
import api, { v2Request } from '../../api/client';
import { langParam } from '../../api/lang';
import SearchableSelect from '../ui/SearchableSelect';
import { useDebounced } from '../../hooks/useDebounced';
import { POST_TYPES } from './helpers';
import UpgradeModal from './UpgradeModal';
import ComposerMediaTray from '../../features/community/components/ComposerMediaTray';
import EmojiPicker from '../../features/community/components/EmojiPicker';
import MentionSuggestions from '../../features/community/components/MentionSuggestions';
import { enqueuePublish } from '../../features/community/publish/publishQueue';
import { extractHashtags } from '../../features/community/social/socialText';

// Bold/italic/lists/link — links also carry mentions, so keep them enabled.
const QUILL_MODULES = {
    toolbar: [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']],
};

/** The three shapes a post can take, Facebook-style: post, carousel, reel. */
const FORMATS = [
    { id: 'post', labelKey: 'composer_format_post', Icon: HiOutlinePhoto, tone: 'text-brand' },
    { id: 'carousel', labelKey: 'composer_format_carousel', Icon: HiOutlineRectangleStack, tone: 'text-emerald-600' },
    { id: 'reel', labelKey: 'composer_format_reel', Icon: HiOutlinePlayCircle, tone: 'text-fuchsia-600' },
];

/**
 * The create-post surface.
 *
 * Publishing is non-blocking: Publish hands the draft (body + local files) to
 * the background queue and calls onQueued immediately, so the member is back
 * in the feed while uploads run. The feed renders the job's progress card.
 *
 * The editor understands the social grammar: an emoji library on the toolbar,
 * @-mentions with a live company dropdown, and hashtags extracted on publish.
 */
export default function PostComposer({ onQueued, initialFormat = 'post', initialType, groupId = null, fullPage = false }) {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [format, setFormat] = useState(FORMATS.some((f) => f.id === initialFormat) ? initialFormat : 'post');
    const [type, setType] = useState(initialType && POST_TYPES.includes(initialType) ? initialType : POST_TYPES[0]);
    const [body, setBody] = useState('');
    const [files, setFiles] = useState([]);
    const [showProduct, setShowProduct] = useState(false);
    const [productId, setProductId] = useState('');
    const [products, setProducts] = useState([]);
    const [productSearch] = useState('');
    const debouncedSearch = useDebounced(productSearch, 400);
    const [err, setErr] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [actingOrganizationId, setActingOrganizationId] = useState('');
    const [audience, setAudience] = useState('public');
    const [locationName, setLocationName] = useState('');
    const [commentsEnabled, setCommentsEnabled] = useState(true);
    const [ctaType, setCtaType] = useState('');
    const [ctaLabel, setCtaLabel] = useState('');
    const [ctaUrl, setCtaUrl] = useState('');
    const [moreOpen, setMoreOpen] = useState(false);

    // Toolbar popovers
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [mention, setMention] = useState(null); // { index, query }
    const quillRef = useRef(null);

    // Subscription quota shown as a badge near Publish, and the 402 upgrade modal.
    const [quota, setQuota] = useState(null);
    const [upgradeOpen, setUpgradeOpen] = useState(false);

    const loadQuota = useCallback(() => {
        api.get('/me/subscription', { params: { lang } })
            .then(({ data }) => setQuota(data))
            .catch(() => {});
    }, [lang]);

    useEffect(() => {
        loadQuota();
    }, [loadQuota]);

    useEffect(() => {
        v2Request({ method: 'get', url: '/organizations' })
            .then(({ data }) => setOrganizations(data.data ?? []))
            .catch(() => setOrganizations([]));
    }, []);

    // Load the current user's products for the picker (debounced by its search box).
    useEffect(() => {
        if (!showProduct) return;
        let alive = true;
        api.get('/products', { params: { per_page: 20, ...(debouncedSearch.trim() ? { q: debouncedSearch.trim() } : {}) } })
            .then(({ data }) => {
                if (alive) setProducts(data.data ?? []);
            })
            .catch(() => {
                if (alive) setProducts([]);
            });
        return () => {
            alive = false;
        };
    }, [showProduct, debouncedSearch]);

    // ---- @mention detection -------------------------------------------------
    // Watch the text just before the caret for an "@query" run. Quill's own
    // change events drive this, so it works for typing, deleting and pasting.
    const trackMention = useCallback(() => {
        const quill = quillRef.current?.getEditor?.();
        const range = quill?.getSelection();
        if (!quill || !range) {
            setMention(null);
            return;
        }
        const before = quill.getText(Math.max(0, range.index - 40), Math.min(40, range.index));
        const match = /(^|\s)@([\p{L}\p{N}_.-]{1,30})$/u.exec(before);
        if (match) {
            setMention({ index: range.index - match[2].length - 1, query: match[2] });
        } else {
            setMention(null);
        }
    }, []);

    const insertMention = useCallback((row) => {
        const quill = quillRef.current?.getEditor?.();
        if (!quill || !mention) return;
        const caret = quill.getSelection()?.index ?? mention.index + mention.query.length + 1;
        const length = caret - mention.index;
        quill.deleteText(mention.index, length, 'user');
        // A mention is a link with data-mention; the sanitiser keeps <a href>.
        quill.insertText(mention.index, `@${row.name}`, { link: `/u/${row.username}` }, 'user');
        quill.insertText(mention.index + `@${row.name}`.length, ' ', {}, 'user');
        quill.setSelection(mention.index + `@${row.name}`.length + 1, 0, 'user');
        setMention(null);
    }, [mention]);

    const insertEmoji = useCallback((emoji) => {
        const quill = quillRef.current?.getEditor?.();
        if (!quill) return;
        const index = quill.getSelection()?.index ?? quill.getLength() - 1;
        quill.insertText(index, emoji, 'user');
        quill.setSelection(index + emoji.length, 0, 'user');
    }, []);

    // A body with only empty tags (e.g. "<p><br></p>") counts as empty.
    const isEmptyBody = (html) => !html || html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() === '';

    const imageCount = files.filter((file) => file.kind === 'image').length;
    const hasVideo = files.some((file) => file.kind === 'video');

    const formatProblem =
        format === 'reel' && !hasVideo
            ? t('composer_reel_hint', 'A reel needs a video.')
            : format === 'carousel' && imageCount < 2
                ? t('composer_carousel_hint', 'A carousel needs at least 2 images.')
                : '';

    const canPublish = !formatProblem && (!isEmptyBody(body) || files.length > 0);

    const publish = (event) => {
        event.preventDefault();
        if (!canPublish) return;
        setErr('');

        // Free plans hit the wall here rather than after a long upload.
        if (quota && !quota.unlimited && typeof quota.remaining === 'number' && quota.remaining <= 0) {
            setUpgradeOpen(true);
            return;
        }

        const payload = { type, body, format, audience, comments_enabled: commentsEnabled };
        const hashtags = extractHashtags(body);
        if (hashtags.length) payload.hashtags = hashtags;
        if (showProduct && productId) payload.product_id = Number(productId);
        if (actingOrganizationId) payload.acting_organization_id = Number(actingOrganizationId);
        if (groupId) payload.community_group_id = Number(groupId);
        if (locationName.trim()) payload.location_name = locationName.trim();
        if (ctaType) {
            payload.cta_type = ctaType;
            if (ctaLabel.trim()) payload.cta_label = ctaLabel.trim();
            if (ctaUrl.trim()) payload.cta_url = ctaUrl.trim();
        }

        const jobId = enqueuePublish(payload, files);
        onQueued?.(jobId, { format });
    };

    // Free plan → "used/limit posts this month" (amber/red as the user runs low).
    // Paid/unlimited → a subtle Pro pill.
    const renderQuota = () => {
        if (!quota) return null;
        if (quota.unlimited) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-[12px] font-semibold text-brand-dark">
                    <HiOutlineSparkles className="h-3.5 w-3.5" aria-hidden />
                    {t('sub_pro_pill', 'Pro · unlimited')}
                </span>
            );
        }
        const low = typeof quota.remaining === 'number' && quota.remaining <= 1;
        const empty = typeof quota.remaining === 'number' && quota.remaining <= 0;
        const tone = empty ? 'bg-red-50 text-red-700' : low ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600';
        return (
            <Link to="/pricing" className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition hover:opacity-80 ${tone}`} title={t('sub_plans_title', 'Plans')}>
                {t('sub_posts_this_month', '{{used}}/{{limit}} posts this month', { used: quota.used ?? 0, limit: quota.limit ?? 0 })}
            </Link>
        );
    };

    return (
        <form onSubmit={publish} className={`rounded-2xl bg-white shadow-[0_10px_35px_-26px_rgba(15,23,42,.5)] ring-1 ring-slate-200/80 ${fullPage ? 'p-5 md:p-7' : 'p-5'}`}>
            <style>{`.feed-quill .ql-toolbar{border-top-left-radius:.75rem;border-top-right-radius:.75rem;border-color:rgb(226 232 240);background:rgb(248 250 252)}.feed-quill .ql-container{border-bottom-left-radius:.75rem;border-bottom-right-radius:.75rem;border-color:rgb(226 232 240);font-family:inherit}.feed-quill .ql-editor{min-height:120px;font-size:.95rem}`}</style>

            {/* Format cards: post / carousel / reel */}
            <div className="grid grid-cols-3 gap-2">
                {FORMATS.map(({ id, labelKey, Icon, tone }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setFormat(id)}
                        aria-pressed={format === id}
                        className={`sc-press flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-sm font-bold transition ${
                            format === id ? 'bg-brand text-white shadow-md shadow-brand/25' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                    >
                        <Icon className={`h-5 w-5 ${format === id ? 'text-white' : tone}`} aria-hidden />
                        {t(labelKey)}
                    </button>
                ))}
            </div>

            {/* Business post types */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {POST_TYPES.map((tp) => (
                    <button
                        key={tp}
                        type="button"
                        onClick={() => setType(tp)}
                        aria-pressed={type === tp}
                        className={`sc-press rounded-full px-3 py-1.5 text-[12px] font-bold transition ${
                            type === tp ? 'bg-brand-light text-brand-dark ring-1 ring-brand/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                    >
                        {t(`feed_type_${tp}`, tp)}
                    </button>
                ))}
            </div>

            {organizations.length ? (
                <label className="mt-3 block text-xs font-bold text-slate-500">
                    {t('feed_acting_as', 'Publish as')}
                    <select
                        value={actingOrganizationId}
                        onChange={(event) => setActingOrganizationId(event.target.value)}
                        className="ms-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    >
                        <option value="">{t('feed_as_person', 'My personal profile')}</option>
                        {organizations.map((organization) => (
                            <option key={organization.id} value={organization.id}>{organization.name}</option>
                        ))}
                    </select>
                </label>
            ) : null}

            {/* Editor + social toolbar */}
            <div className="relative mt-3">
                <div className="feed-quill" onKeyUp={trackMention} onClick={trackMention}>
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={body}
                        onChange={(value) => {
                            setBody(value);
                            trackMention();
                        }}
                        modules={QUILL_MODULES}
                        placeholder={t('feed_composer_placeholder', 'Share something with the community…')}
                    />
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">{t('composer_mention_hint', 'Type @ to mention a company, # for a hashtag.')}</p>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setEmojiOpen((open) => !open)}
                            aria-expanded={emojiOpen}
                            aria-label={t('composer_emoji', 'Emoji')}
                            className="sc-press flex h-9 w-9 items-center justify-center rounded-full text-amber-500 transition hover:bg-amber-50"
                        >
                            <HiOutlineFaceSmile className="h-6 w-6" aria-hidden />
                        </button>
                        {emojiOpen ? (
                            <div className="absolute bottom-11 end-0 z-40">
                                <EmojiPicker onPick={insertEmoji} onClose={() => setEmojiOpen(false)} />
                            </div>
                        ) : null}
                    </div>
                </div>

                {mention ? (
                    <div className="absolute start-3 top-full z-40 -mt-8">
                        <MentionSuggestions query={mention.query} onPick={insertMention} onClose={() => setMention(null)} />
                    </div>
                ) : null}
            </div>

            {/* Media: local previews only; upload happens after Publish, in the queue. */}
            <div className="mt-4">
                <ComposerMediaTray files={files} onChange={setFiles} mode={format === 'reel' ? 'reel' : 'post'} />
            </div>

            {formatProblem ? <p className="mt-2 text-xs font-semibold text-amber-600">{formatProblem}</p> : null}

            {/* Audience & extras, folded away like Facebook's "Add to your post" */}
            <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen}
                className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-slate-100"
            >
                {t('composer_more_options', 'More options')}
                <HiOutlineChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>

            {moreOpen ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-xs font-bold text-slate-600">
                        {t('composer_audience', 'Audience')}
                        <select value={audience} onChange={(event) => setAudience(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                            <option value="public">{t('composer_audience_public', 'Everyone')}</option>
                            <option value="followers">{t('composer_audience_followers', 'Followers')}</option>
                            <option value="sector">{t('composer_audience_sector', 'My sector')}</option>
                        </select>
                    </label>
                    <label className="text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1"><HiOutlineMapPin className="h-3.5 w-3.5" aria-hidden />{t('composer_location', 'Location')}</span>
                        <input value={locationName} onChange={(event) => setLocationName(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder={t('composer_location_ph', 'Cairo, Egypt')} />
                    </label>
                    <label className="text-xs font-bold text-slate-600">
                        {t('composer_cta', 'Action button')}
                        <select value={ctaType} onChange={(event) => setCtaType(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                            <option value="">{t('composer_cta_none', 'None')}</option>
                            <option value="request_quote">{t('composer_cta_request_quote', 'Request a quote')}</option>
                            <option value="view_product">{t('composer_cta_view_product', 'View product')}</option>
                            <option value="contact">{t('composer_cta_contact', 'Contact now')}</option>
                            <option value="register">{t('composer_cta_register', 'Register')}</option>
                            <option value="apply">{t('composer_cta_apply', 'Apply')}</option>
                        </select>
                    </label>
                    {ctaType ? (
                        <label className="text-xs font-bold text-slate-600">
                            {t('composer_cta_url', 'Action link')}
                            <input type="url" value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="https://" />
                        </label>
                    ) : null}
                    {ctaType ? (
                        <label className="text-xs font-bold text-slate-600 md:col-span-2">
                            {t('composer_cta_label', 'Button text')}
                            <input value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
                        </label>
                    ) : null}
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 md:col-span-2">
                        <input type="checkbox" checked={commentsEnabled} onChange={(event) => setCommentsEnabled(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand" />
                        {t('composer_allow_comments', 'Allow comments')}
                    </label>
                </div>
            ) : null}

            {/* Optional collapsible product attachment */}
            {showProduct ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-[12px] font-bold text-slate-600">{t('feed_attach_product', 'Attach product')}</label>
                        <button
                            type="button"
                            onClick={() => {
                                setShowProduct(false);
                                setProductId('');
                            }}
                            className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                            aria-label={t('action_remove', 'Remove')}
                        >
                            <HiOutlineXMark className="h-4 w-4" aria-hidden />
                        </button>
                    </div>
                    <SearchableSelect
                        value={String(productId)}
                        onChange={(ev) => setProductId(ev.target.value)}
                        options={[
                            { value: '', label: t('feed_attach_product', 'Attach product') },
                            ...products.map((p) => ({ value: String(p.id), label: p.name })),
                        ]}
                    />
                </div>
            ) : null}

            {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                {!showProduct ? (
                    <button
                        type="button"
                        onClick={() => setShowProduct(true)}
                        className="sc-press inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200/70"
                    >
                        <HiOutlinePaperClip className="h-4 w-4" aria-hidden /> {t('feed_attach_product', 'Attach product')}
                    </button>
                ) : (
                    <span />
                )}
                <div className="flex items-center gap-3">
                    {renderQuota()}
                    <button
                        type="submit"
                        disabled={!canPublish}
                        className="sc-press inline-flex items-center gap-1.5 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-50"
                    >
                        {t('composer_publish_bg', 'Publish')}
                    </button>
                </div>
            </div>

            <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onUpgraded={loadQuota} />
        </form>
    );
}
