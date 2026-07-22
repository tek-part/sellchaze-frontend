import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { HiOutlineArrowLeft, HiOutlinePhoto, HiOutlineXMark } from 'react-icons/hi2';
import api from '../api/client';

const EMPTY = {
    slug: '',
    title: '',
    title_ar: '',
    excerpt: '',
    excerpt_ar: '',
    content: '',
    content_ar: '',
    meta_title: '',
    meta_title_ar: '',
    meta_description: '',
    meta_description_ar: '',
    published: false,
    published_at: '',
};

export default function AdminArticleFormPage() {
    const { id } = useParams();
    const editing = Boolean(id);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [form, setForm] = useState(EMPTY);
    const [tab, setTab] = useState('en'); // 'en' | 'ar'
    const [featuredFile, setFeaturedFile] = useState(null);
    const [featuredPreview, setFeaturedPreview] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const [loading, setLoading] = useState(editing);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const quillRef = useRef(null);
    const quillArRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!editing) return;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/admin/articles/${id}`);
                const a = data.data ?? data;
                setForm({
                    slug: a.slug ?? '',
                    title: a.title ?? '',
                    title_ar: a.title_ar ?? '',
                    excerpt: a.excerpt ?? '',
                    excerpt_ar: a.excerpt_ar ?? '',
                    content: a.content ?? '',
                    content_ar: a.content_ar ?? '',
                    meta_title: a.meta_title ?? '',
                    meta_title_ar: a.meta_title_ar ?? '',
                    meta_description: a.meta_description ?? '',
                    meta_description_ar: a.meta_description_ar ?? '',
                    published: Boolean(a.published),
                    published_at: a.published_at ? a.published_at.slice(0, 16) : '',
                });
                setExistingImage(a.featured_image_url ?? null);
            } catch (e) {
                setErr(e.response?.data?.message || e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, editing]);

    const setField = (k) => (e) => {
        const v = e && e.target ? e.target.value : e;
        setForm((f) => ({ ...f, [k]: v }));
    };

    function onFeaturedChange(e) {
        const f = e.target.files?.[0];
        if (!f) return;
        setFeaturedFile(f);
        setFeaturedPreview(URL.createObjectURL(f));
    }

    // Upload inline images from Quill toolbar to /admin/articles/upload-image.
    const quillImageHandler = useCallback(async (ref) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append('file', file);
            try {
                const { data } = await api.post('/admin/articles/upload-image', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const quill = ref.current?.getEditor();
                const range = quill?.getSelection(true);
                quill?.insertEmbed(range?.index ?? 0, 'image', data.url);
            } catch (err) {
                toast.error(err.response?.data?.message || err.message);
            }
        };
        input.click();
    }, []);

    const modulesEn = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'link', 'image'],
                    ['clean'],
                ],
                handlers: { image: () => quillImageHandler(quillRef) },
            },
        }),
        [quillImageHandler]
    );

    const modulesAr = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['blockquote', 'link', 'image'],
                    ['clean'],
                ],
                handlers: { image: () => quillImageHandler(quillArRef) },
            },
        }),
        [quillImageHandler]
    );

    async function onSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setErr('');
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k === 'published') fd.append(k, v ? '1' : '0');
                else if (v != null) fd.append(k, v);
            });
            if (featuredFile) fd.append('featured_image', featuredFile);
            if (editing) fd.append('_method', 'PUT');

            const url = editing ? `/admin/articles/${id}` : '/admin/articles';
            await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(t('saved', 'Saved'));
            navigate('/admin/articles');
        } catch (e2) {
            setErr(e2.response?.data?.message || e2.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="p-6 text-sm text-slate-500">{t('loading', 'Loading…')}</div>;
    }

    return (
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/articles')}
                        className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">
                        {editing
                            ? t('admin_articles_edit', 'Edit article')
                            : t('admin_articles_new', 'New article')}
                    </h1>
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
                >
                    {saving ? t('saving', 'Saving…') : t('save', 'Save')}
                </button>
            </header>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
            ) : null}

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setTab('en')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === 'en' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                    English
                </button>
                <button
                    type="button"
                    onClick={() => setTab('ar')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === 'ar' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'}`}
                >
                    العربية
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    {tab === 'en' ? (
                        <>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                                <label className="text-xs font-semibold text-slate-600">
                                    {t('admin_articles_f_title', 'Title (EN)')}
                                </label>
                                <input
                                    value={form.title}
                                    onChange={setField('title')}
                                    required
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-hidden"
                                />
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                                <label className="text-xs font-semibold text-slate-600">
                                    {t('admin_articles_f_excerpt', 'Excerpt (EN)')}
                                </label>
                                <textarea
                                    value={form.excerpt}
                                    onChange={setField('excerpt')}
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-hidden"
                                />
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                                <label className="text-xs font-semibold text-slate-600">
                                    {t('admin_articles_f_content', 'Content (EN)')}
                                </label>
                                <ReactQuill
                                    ref={quillRef}
                                    value={form.content}
                                    onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                                    modules={modulesEn}
                                    theme="snow"
                                    className="mt-2"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs" dir="rtl">
                                <label className="text-xs font-semibold text-slate-600">
                                    {t('admin_articles_f_title_ar', 'العنوان (AR)')}
                                </label>
                                <input
                                    value={form.title_ar}
                                    onChange={setField('title_ar')}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-hidden"
                                />
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs" dir="rtl">
                                <label className="text-xs font-semibold text-slate-600">
                                    {t('admin_articles_f_excerpt_ar', 'المقتطف (AR)')}
                                </label>
                                <textarea
                                    value={form.excerpt_ar}
                                    onChange={setField('excerpt_ar')}
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-hidden"
                                />
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                                <label className="text-xs font-semibold text-slate-600">
                                    {t('admin_articles_f_content_ar', 'المحتوى (AR)')}
                                </label>
                                <ReactQuill
                                    ref={quillArRef}
                                    value={form.content_ar}
                                    onChange={(v) => setForm((f) => ({ ...f, content_ar: v }))}
                                    modules={modulesAr}
                                    theme="snow"
                                    className="mt-2"
                                />
                            </div>
                        </>
                    )}

                    {/* SEO */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                        <h3 className="mb-3 text-sm font-semibold text-slate-800">
                            {t('admin_articles_seo', 'SEO')}
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <input
                                value={form.meta_title}
                                onChange={setField('meta_title')}
                                placeholder={t('admin_articles_f_meta_title', 'Meta title (EN)')}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-hidden"
                            />
                            <input
                                value={form.meta_title_ar}
                                onChange={setField('meta_title_ar')}
                                placeholder={t('admin_articles_f_meta_title_ar', 'Meta title (AR)')}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-hidden"
                                dir="rtl"
                            />
                            <textarea
                                value={form.meta_description}
                                onChange={setField('meta_description')}
                                placeholder={t('admin_articles_f_meta_description', 'Meta description (EN)')}
                                rows={2}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2 focus:border-brand focus:outline-hidden"
                            />
                            <textarea
                                value={form.meta_description_ar}
                                onChange={setField('meta_description_ar')}
                                placeholder={t('admin_articles_f_meta_description_ar', 'Meta description (AR)')}
                                rows={2}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2 focus:border-brand focus:outline-hidden"
                                dir="rtl"
                            />
                        </div>
                    </div>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                        <label className="text-xs font-semibold text-slate-600">
                            {t('admin_articles_f_featured_image', 'Featured image')}
                        </label>
                        <div className="mt-2 flex flex-col items-center gap-3">
                            {featuredPreview || existingImage ? (
                                <div className="relative w-full">
                                    <img
                                        src={featuredPreview || existingImage}
                                        alt=""
                                        className="w-full rounded-xl border border-slate-200 object-cover"
                                    />
                                    {featuredPreview ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFeaturedFile(null);
                                                setFeaturedPreview(null);
                                            }}
                                            className="absolute right-2 top-2 rounded-full bg-white/90 p-1 shadow-sm"
                                        >
                                            <HiOutlineXMark className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="flex h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                                    <HiOutlinePhoto className="h-10 w-10" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                            >
                                {t('admin_articles_choose_image', 'Choose image')}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={onFeaturedChange}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                        <h3 className="mb-3 text-sm font-semibold text-slate-800">
                            {t('admin_articles_publishing', 'Publishing')}
                        </h3>
                        <label className="flex items-center justify-between gap-3 text-sm">
                            <span>{t('admin_articles_published', 'Published')}</span>
                            <input
                                type="checkbox"
                                checked={form.published}
                                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                            />
                        </label>
                        <div className="mt-3">
                            <label className="text-xs font-semibold text-slate-600">
                                {t('admin_articles_published_at', 'Publish date')}
                            </label>
                            <input
                                type="datetime-local"
                                value={form.published_at}
                                onChange={setField('published_at')}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="text-xs font-semibold text-slate-600">
                                {t('admin_articles_slug', 'Slug')}
                            </label>
                            <input
                                value={form.slug}
                                onChange={setField('slug')}
                                placeholder={t('admin_articles_slug_auto', 'Auto-generated if empty')}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </aside>
            </div>
        </form>
    );
}
