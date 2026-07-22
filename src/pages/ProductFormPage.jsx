import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useMatch, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    HiOutlinePhoto,
    HiOutlineXMark,
    HiOutlineArrowUpTray,
    HiOutlinePlus,
    HiOutlineTag,
    HiOutlineRectangleGroup,
    HiOutlineArrowLeft,
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineInformationCircle,
} from 'react-icons/hi2';
import api from '../api/client';

function unwrap(p) { return p?.data ?? p; }

export default function ProductFormPage() {
    const { id } = useParams();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { permissions } = useOutletContext();
    const isNew = !!useMatch('/products/new');
    const can = (p) => permissions.includes(p);
    const fileInputRef = useRef(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [attributeIds, setAttributeIds] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [removeImage, setRemoveImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(!isNew);
    const [errors, setErrors] = useState({});
    const [topErr, setTopErr] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // New category modal
    const [catModalOpen, setCatModalOpen] = useState(false);
    const [newCatEn, setNewCatEn] = useState('');
    const [newCatAr, setNewCatAr] = useState('');
    const [catSaving, setCatSaving] = useState(false);

    // New attribute modal
    const [attrModalOpen, setAttrModalOpen] = useState(false);
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrType, setNewAttrType] = useState('text');
    const [newAttrValues, setNewAttrValues] = useState('');
    const [attrSaving, setAttrSaving] = useState(false);

    const reloadCategories = () => api.get('/categories', { params: { per_page: 200 } })
        .then(({ data }) => setCategories(data.data ?? []))
        .catch(() => {});

    const reloadAttributes = () => api.get('/attributes', { params: { per_page: 200 } })
        .then(({ data }) => setAttributes(data?.data?.data ?? data?.data ?? []))
        .catch(() => {});

    useEffect(() => { reloadCategories(); reloadAttributes(); }, []);

    useEffect(() => {
        if (isNew || !permissions.includes('products-list')) {
            return;
        }
        setTopErr('');
        setInitLoading(true);
        api.get(`/products/${id}`)
            .then(({ data }) => {
                const p = unwrap(data);
                setName(p.name ?? '');
                setDescription(p.description ?? '');
                setCategoryId(String(p.category_id ?? ''));
                setAttributeIds((p.attribute_ids ?? (p.attributes ?? []).map((a) => a.id)).map(Number));
                setExistingImageUrl(p.image_url || p.image_thumb_url || '');
            })
            .catch((e) => setTopErr(e.response?.data?.message || e.message))
            .finally(() => setInitLoading(false));
    }, [id, isNew, permissions]);

    const requiredPerm = isNew ? 'products-create' : 'products-edit';
    if (!can(requiredPerm)) {
        return <Navigate to="/products" replace />;
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

    const toggleAttribute = (aid) => {
        setAttributeIds((curr) => curr.includes(aid) ? curr.filter((x) => x !== aid) : [...curr, aid]);
    };

    const descriptionLen = (description || '').length;

    const hasImage = !!(imagePreview || (existingImageUrl && !removeImage));

    async function submit(e, stayOnPage = false) {
        e?.preventDefault?.();
        setErrors({});
        setTopErr('');
        if (!name.trim()) {
            setErrors({ name: t('required') || 'Required' });
            return;
        }
        if (!categoryId) {
            setErrors({ category_id: t('required') || 'Required' });
            return;
        }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', name.trim());
            fd.append('description', description || '');
            fd.append('category_id', String(Number(categoryId)));
            attributeIds.forEach((aid) => fd.append('attribute_ids[]', String(aid)));
            if (imageFile) fd.append('image', imageFile);
            if (!isNew && removeImage && !imageFile) fd.append('remove_image', '1');

            let resp;
            if (isNew) {
                resp = await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                fd.append('_method', 'PUT');
                resp = await api.post(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            toast.success(isNew ? (t('product_created') || 'Product created') : (t('product_updated') || 'Product updated'));

            if (stayOnPage && isNew) {
                const created = unwrap(resp.data);
                navigate(`/products/${created.id}/edit`, { replace: true });
            } else {
                navigate('/products');
            }
        } catch (e) {
            const data = e.response?.data;
            if (data?.errors) setErrors(Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])));
            const msg = data?.message || e.message;
            setTopErr(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    async function createCategory() {
        if (!newCatEn.trim() && !newCatAr.trim()) return;
        setCatSaving(true);
        try {
            const { data } = await api.post('/categories', {
                name_en: newCatEn.trim() || newCatAr.trim(),
                name_ar: newCatAr.trim() || newCatEn.trim(),
            });
            const created = unwrap(data);
            await reloadCategories();
            setCategoryId(String(created.id));
            setCatModalOpen(false);
            setNewCatEn(''); setNewCatAr('');
            toast.success(t('category_created') || 'Category created');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setCatSaving(false);
        }
    }

    async function createAttribute() {
        if (!newAttrName.trim()) return;
        setAttrSaving(true);
        try {
            const payload = { name: newAttrName.trim(), type: newAttrType };
            if (['select', 'multiselect', 'color'].includes(newAttrType)) {
                payload.values = newAttrValues.split(',').map((v) => v.trim()).filter(Boolean);
            }
            const { data } = await api.post('/attributes', payload);
            const created = unwrap(data);
            await reloadAttributes();
            setAttributeIds((curr) => [...curr, Number(created.id)]);
            setAttrModalOpen(false);
            setNewAttrName(''); setNewAttrType('text'); setNewAttrValues('');
            toast.success(t('attribute_created') || 'Attribute created');
        } catch (e) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setAttrSaving(false);
        }
    }

    if (initLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-brand"
                    >
                        <HiOutlineArrowLeft className="h-4 w-4" aria-hidden />
                        {t('products')}
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                        {isNew ? t('product_form_create') : t('product_form_edit')}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {isNew
                            ? (t('product_form_create_subtitle') || 'Fill in product details, upload an image, and set attributes.')
                            : (t('product_form_edit_subtitle') || 'Update product details.')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50"
                    >
                        {t('cancel')}
                    </button>
                    {isNew ? (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={(e) => submit(e, true)}
                            className="hidden rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-50 md:inline-flex md:items-center md:gap-1.5"
                        >
                            <HiOutlineCheckCircle className="h-4 w-4" aria-hidden />
                            {t('product_form_save_and_edit') || 'Save & keep editing'}
                        </button>
                    ) : null}
                    <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => submit(e, false)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-brand/90 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <HiOutlineCheckCircle className="h-4 w-4" aria-hidden />
                        )}
                        {t('product_form_save')}
                    </button>
                </div>
            </div>

            {topErr ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <HiOutlineInformationCircle className="h-5 w-5 shrink-0" aria-hidden />
                    <p>{topErr}</p>
                </div>
            ) : null}

            <form onSubmit={(e) => submit(e, false)} className="grid gap-6 lg:grid-cols-3">
                {/* Main column */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Basic info card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                                <HiOutlineDocumentText className="h-5 w-5" aria-hidden />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">{t('product_section_basic') || 'Basic information'}</h2>
                                <p className="text-xs text-slate-500">{t('product_section_basic_sub') || 'Name and description shown to buyers.'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                                    <span>{t('col_name')} <span className="text-red-500">*</span></span>
                                    <span className="text-xs text-slate-400">{name.length}/255</span>
                                </label>
                                <input
                                    required
                                    maxLength={255}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('product_name_placeholder') || 'e.g. Premium cotton t-shirt'}
                                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-hidden transition focus:ring-2 ${
                                        errors.name
                                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                                            : 'border-slate-200 focus:border-brand focus:ring-brand/20'
                                    }`}
                                />
                                {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                                    <span>{t('col_description')}</span>
                                    <span className="text-xs text-slate-400">{descriptionLen} {t('chars') || 'chars'}</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={6}
                                    placeholder={t('product_description_placeholder') || 'Describe materials, size, use-case, shipping notes…'}
                                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attributes card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600">
                                    <HiOutlineRectangleGroup className="h-5 w-5" aria-hidden />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">{t('product_section_attributes') || 'Attributes'}</h2>
                                    <p className="text-xs text-slate-500">{t('product_section_attributes_sub') || 'Select attributes buyers can choose on order.'}</p>
                                </div>
                            </div>
                            {can('attributes-create') ? (
                                <button
                                    type="button"
                                    onClick={() => setAttrModalOpen(true)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-brand hover:text-brand"
                                >
                                    <HiOutlinePlus className="h-3.5 w-3.5" aria-hidden />
                                    {t('product_new_attribute') || 'New attribute'}
                                </button>
                            ) : null}
                        </div>

                        {attributes.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-400">{t('product_no_attributes_yet') || 'No attributes yet.'}</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {attributes.map((a) => {
                                    const active = attributeIds.includes(Number(a.id));
                                    return (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => toggleAttribute(Number(a.id))}
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                                active
                                                    ? 'border-brand bg-brand text-white shadow-xs'
                                                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand/60 hover:text-brand'
                                            }`}
                                        >
                                            {active ? <HiOutlineCheckCircle className="h-3.5 w-3.5" aria-hidden /> : <HiOutlineTag className="h-3.5 w-3.5" aria-hidden />}
                                            {a.name}
                                            {a.type ? <span className={`ms-1 text-[10px] ${active ? 'text-white/80' : 'text-slate-400'}`}>· {a.type}</span> : null}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {attributeIds.length > 0 ? (
                            <p className="mt-3 text-xs text-slate-500">{attributeIds.length} {t('selected') || 'selected'}</p>
                        ) : null}
                    </div>
                </div>

                {/* Sidebar column */}
                <div className="space-y-6">
                    {/* Image card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <HiOutlinePhoto className="h-5 w-5" aria-hidden />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-slate-900">{t('product_section_image') || 'Product image'}</h2>
                                <p className="text-xs text-slate-500">JPG · PNG · WEBP — max 8 MB</p>
                            </div>
                        </div>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            className={`relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition ${
                                isDragging
                                    ? 'border-brand bg-brand/5'
                                    : hasImage
                                        ? 'border-slate-200 bg-slate-50'
                                        : 'border-slate-300 bg-slate-50 hover:border-brand/60'
                            }`}
                        >
                            {hasImage ? (
                                <>
                                    <img
                                        src={imagePreview || existingImageUrl}
                                        alt=""
                                        className="absolute inset-0 h-full w-full object-contain p-3"
                                    />
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
                                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200">
                                        <HiOutlineArrowUpTray className="h-6 w-6" aria-hidden />
                                    </div>
                                    <p className="px-4 text-sm font-medium text-slate-700">{t('product_image_drop') || 'Drag & drop or click to upload'}</p>
                                    <p className="mt-1 text-xs text-slate-400">{t('product_image_hint') || 'Square images look best (min 600×600)'}</p>
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
                        {errors.image ? <p className="mt-2 text-xs text-red-600">{errors.image}</p> : null}
                    </div>

                    {/* Category card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <HiOutlineTag className="h-5 w-5" aria-hidden />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-slate-900">{t('col_category')}</h2>
                                </div>
                            </div>
                            {can('categories-create') ? (
                                <button
                                    type="button"
                                    onClick={() => setCatModalOpen(true)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-brand hover:text-brand"
                                >
                                    <HiOutlinePlus className="h-3.5 w-3.5" aria-hidden />
                                    {t('product_new_category') || 'New'}
                                </button>
                            ) : null}
                        </div>
                        <select
                            required
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-hidden transition focus:ring-2 ${
                                errors.category_id
                                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                                    : 'border-slate-200 focus:border-brand focus:ring-brand/20'
                            }`}
                        >
                            <option value="">{t('select_category') || '— Select category —'}</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.category_id ? <p className="mt-1 text-xs text-red-600">{errors.category_id}</p> : null}
                    </div>
                </div>
            </form>

            {/* New category modal */}
            {catModalOpen ? (
                <Modal onClose={() => setCatModalOpen(false)} title={t('product_new_category_title') || 'New category'}>
                    <div className="space-y-3">
                        <FieldInput label={t('name_en') || 'Name (English)'} value={newCatEn} onChange={setNewCatEn} placeholder="Clothing" />
                        <FieldInput label={t('name_ar') || 'الاسم (عربي)'} value={newCatAr} onChange={setNewCatAr} placeholder="ملابس" />
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <button type="button" onClick={() => setCatModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('cancel')}</button>
                        <button type="button" onClick={createCategory} disabled={catSaving || (!newCatEn.trim() && !newCatAr.trim())} className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand/90 disabled:opacity-50">
                            <HiOutlinePlus className="h-4 w-4" aria-hidden />
                            {t('create') || 'Create'}
                        </button>
                    </div>
                </Modal>
            ) : null}

            {/* New attribute modal */}
            {attrModalOpen ? (
                <Modal onClose={() => setAttrModalOpen(false)} title={t('product_new_attribute_title') || 'New attribute'}>
                    <div className="space-y-3">
                        <FieldInput label={t('col_name')} value={newAttrName} onChange={setNewAttrName} placeholder="Color" />
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('attribute_type') || 'Type'}</label>
                            <select value={newAttrType} onChange={(e) => setNewAttrType(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                <option value="text">text</option>
                                <option value="number">number</option>
                                <option value="select">select</option>
                                <option value="multiselect">multiselect</option>
                                <option value="color">color</option>
                                <option value="boolean">boolean</option>
                            </select>
                        </div>
                        {['select', 'multiselect', 'color'].includes(newAttrType) ? (
                            <FieldInput
                                label={t('attribute_values_csv') || 'Values (comma-separated)'}
                                value={newAttrValues}
                                onChange={setNewAttrValues}
                                placeholder="Red, Blue, Green"
                            />
                        ) : null}
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <button type="button" onClick={() => setAttrModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('cancel')}</button>
                        <button type="button" onClick={createAttribute} disabled={attrSaving || !newAttrName.trim()} className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand/90 disabled:opacity-50">
                            <HiOutlinePlus className="h-4 w-4" aria-hidden />
                            {t('create') || 'Create'}
                        </button>
                    </div>
                </Modal>
            ) : null}
        </div>
    );
}

function Modal({ children, onClose, title }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <HiOutlineXMark className="h-5 w-5" aria-hidden />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function FieldInput({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-hidden transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
        </div>
    );
}
