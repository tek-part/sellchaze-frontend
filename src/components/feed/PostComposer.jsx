import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { HiOutlinePaperClip, HiOutlineXMark, HiOutlineSparkles } from 'react-icons/hi2';
import api from '../../api/client';
import { langParam } from '../../api/lang';
import SearchableSelect from '../ui/SearchableSelect';
import { useDebounced } from '../../hooks/useDebounced';
import { POST_TYPES } from './helpers';
import UpgradeModal from './UpgradeModal';

// Compact rich-text toolbar (bold/italic/lists/link) — mirrors StoreContentPageEditor.
const QUILL_MODULES = {
    toolbar: [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']],
};

/**
 * The composer at the top of the feed. Picks a post type, writes a rich-text body,
 * optionally attaches one of the user's own products, and POSTs /posts. On success
 * it calls onCreated(newPostCard) so the page can prepend it.
 */
export default function PostComposer({ onCreated }) {
    const { t, i18n } = useTranslation();
    const { lang } = langParam(i18n);

    const [type, setType] = useState(POST_TYPES[0]);
    const [body, setBody] = useState('');
    const [showProduct, setShowProduct] = useState(false);
    const [productId, setProductId] = useState('');
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const debouncedSearch = useDebounced(productSearch, 400);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState('');

    // Subscription quota shown as a badge near Publish, and the 402 upgrade modal.
    const [quota, setQuota] = useState(null);
    const [upgradeOpen, setUpgradeOpen] = useState(false);

    const loadQuota = () => {
        api.get('/me/subscription', { params: { lang } })
            .then(({ data }) => setQuota(data))
            .catch(() => {});
    };

    // Fetch the quota on mount and whenever the language changes (plan name is localized).
    useEffect(() => {
        let alive = true;
        api.get('/me/subscription', { params: { lang } })
            .then(({ data }) => {
                if (alive) setQuota(data);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, [lang]);

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

    // A body with only empty tags (e.g. "<p><br></p>") counts as empty.
    const isEmptyBody = (html) => !html || html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() === '';

    const reset = () => {
        setBody('');
        setType(POST_TYPES[0]);
        setProductId('');
        setShowProduct(false);
        setProductSearch('');
    };

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setErr('');
        setSubmitting(true);
        try {
            const payload = { type, body };
            if (showProduct && productId) payload.product_id = Number(productId);
            const { data } = await api.post('/posts', payload);
            onCreated?.(data.data);
            reset();
            // Keep the quota badge current after a successful publish.
            if (quota && !quota.unlimited && typeof quota.used === 'number') {
                setQuota((q) =>
                    q
                        ? {
                              ...q,
                              used: q.used + 1,
                              remaining: q.remaining == null ? q.remaining : Math.max(0, q.remaining - 1),
                          }
                        : q,
                );
            } else {
                loadQuota();
            }
        } catch (e2) {
            // 402 = monthly free limit reached → open the upgrade modal instead of a generic error.
            if (e2.response?.status === 402) {
                if (e2.response?.data?.quota) setQuota(e2.response.data.quota);
                setUpgradeOpen(true);
            } else {
                setErr(e2.response?.data?.message || e2.message);
            }
        } finally {
            setSubmitting(false);
        }
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
        const tone = empty
            ? 'bg-red-50 text-red-700'
            : low
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-600';
        return (
            <Link
                to="/pricing"
                className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold transition hover:opacity-80 ${tone}`}
                title={t('sub_plans_title', 'Plans')}
            >
                {t('sub_posts_this_month', '{{used}}/{{limit}} posts this month', {
                    used: quota.used ?? 0,
                    limit: quota.limit ?? 0,
                })}
            </Link>
        );
    };

    return (
        <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            <style>{`.feed-quill .ql-toolbar{border-top-left-radius:.75rem;border-top-right-radius:.75rem;border-color:rgb(226 232 240);background:rgb(248 250 252)}.feed-quill .ql-container{border-bottom-left-radius:.75rem;border-bottom-right-radius:.75rem;border-color:rgb(226 232 240);font-family:inherit}.feed-quill .ql-editor{min-height:110px;font-size:.9rem}`}</style>

            {/* Post-type segmented control */}
            <div className="mb-3 flex flex-wrap gap-1.5">
                {POST_TYPES.map((tp) => (
                    <button
                        key={tp}
                        type="button"
                        onClick={() => setType(tp)}
                        className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                            type === tp ? 'bg-brand text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {t(`feed_type_${tp}`, tp)}
                    </button>
                ))}
            </div>

            <div className="feed-quill">
                <ReactQuill
                    theme="snow"
                    value={body}
                    onChange={setBody}
                    modules={QUILL_MODULES}
                    placeholder={t('feed_composer_placeholder', 'Share something with the community…')}
                />
            </div>

            {/* Optional collapsible product attachment */}
            {showProduct ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-[12px] font-semibold text-slate-600">{t('feed_attach_product', 'Attach product')}</label>
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

            <div className="mt-3 flex items-center justify-between gap-2">
                {!showProduct ? (
                    <button
                        type="button"
                        onClick={() => setShowProduct(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
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
                        disabled={submitting || isEmptyBody(body)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-brand-dark disabled:opacity-50"
                    >
                        {submitting ? t('feed_publishing', 'Publishing…') : t('feed_publish', 'Publish')}
                    </button>
                </div>
            </div>

            <UpgradeModal
                open={upgradeOpen}
                onClose={() => setUpgradeOpen(false)}
                onUpgraded={loadQuota}
            />
        </form>
    );
}
