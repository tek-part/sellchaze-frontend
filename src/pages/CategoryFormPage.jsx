import { useEffect, useRef, useState } from 'react';
import { Navigate, useMatch, useNavigate, useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { HiOutlinePhoto, HiOutlineArrowUpTray, HiOutlineXMark } from 'react-icons/hi2';
import api from '../api/client';

export default function CategoryFormPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const isNew = !!useMatch('/categories/new');
    const can = (p) => permissions.includes(p);

    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const fileInputRef = useRef(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [removeImage, setRemoveImage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (isNew || !permissions.includes('categories-list')) {
            return;
        }
        setErr('');
        api.get(`/categories/${id}`)
            .then(({ data }) => {
                const d = data.data ?? {};
                setNameEn(d.name_en ?? d.name ?? '');
                setNameAr(d.name_ar ?? d.name ?? '');
                setExistingImageUrl(d.image_url || '');
            })
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, [id, isNew, permissions]);

    const requiredPerm = isNew ? 'categories-create' : 'categories-edit';
    if (!can(requiredPerm)) {
        return <Navigate to="/categories" replace />;
    }

    const handleFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(t('product_image_only') || 'Only image files are allowed');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast.error(t('product_image_too_big') || 'Image must be under 8 MB');
            return;
        }
        setImageFile(file);
        setRemoveImage(false);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(String(reader.result));
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview('');
        if (existingImageUrl) setRemoveImage(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    };

    const hasImage = !!(imagePreview || (existingImageUrl && !removeImage));

    async function submit(e) {
        e.preventDefault();
        setLoading(true);
        setErr('');
        try {
            const fd = new FormData();
            fd.append('name_en', nameEn.trim());
            fd.append('name_ar', nameAr.trim());
            if (imageFile) fd.append('image', imageFile);
            if (!isNew && removeImage && !imageFile) fd.append('remove_image', '1');

            if (isNew) {
                await api.post('/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success(t('table_create'));
            } else {
                fd.append('_method', 'PUT');
                await api.post(`/categories/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success(t('action_edit'));
            }
            navigate('/categories');
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            setErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-lg space-y-5">
            <div className="border-s-4 border-brand ps-4">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    {isNew ? t('category_form_create') : t('category_form_edit')}
                </h1>
            </div>
            {err && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('category_name_en')}</label>
                    <input
                        required
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t('category_name_ar')}</label>
                    <input
                        required
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        dir="rtl"
                    />
                </div>

                <div>
                    <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <HiOutlinePhoto className="h-4 w-4 text-emerald-600" aria-hidden />
                        {t('category_image', 'Category image')}
                    </label>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        className={`relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition ${
                            isDragging ? 'border-brand bg-brand/5' : hasImage ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-slate-50 hover:border-brand/60'
                        }`}
                    >
                        {hasImage ? (
                            <>
                                <img src={imagePreview || existingImageUrl} alt="" className="absolute inset-0 h-full w-full object-contain p-3" />
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    className="absolute inset-e-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-xs ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600"
                                    title={t('remove') || 'Remove'}
                                >
                                    <HiOutlineXMark className="h-4 w-4" aria-hidden />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200">
                                    <HiOutlineArrowUpTray className="h-5 w-5" aria-hidden />
                                </div>
                                <p className="px-4 text-sm font-medium text-slate-700">{t('product_image_drop') || 'Drag & drop or click to upload'}</p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                    >
                        {t('product_form_save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/categories')}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
}
