// G3 catalog power tools (TAR-036): pure helpers shared by option ordering, price changes, sheets and phone imports.

/** A copy of `list` with the item at `from` moved to `to` (indexes are clamped). */
export function moveItem(list, from, to) {
    const next = [...list];
    if (from < 0 || from >= next.length) return next;
    const target = Math.max(0, Math.min(next.length - 1, to));
    const [item] = next.splice(from, 1);
    next.splice(target, 0, item);
    return next;
}

/** Target index for a keyboard reorder key, or null when the key does not move the item. */
export function keyboardTarget(key, index, length) {
    if (key === 'ArrowUp') return index > 0 ? index - 1 : null;
    if (key === 'ArrowDown') return index < length - 1 ? index + 1 : null;
    if (key === 'Home') return index > 0 ? 0 : null;
    if (key === 'End') return index < length - 1 ? length - 1 : null;
    return null;
}

/** True when two id lists differ in order. */
export const orderChanged = (original, current) => original.length !== current.length || original.some((id, i) => id !== current[i]);

/** Request body for a bulk price change. */
export function priceChangePayload(form, scope) {
    return {
        scope, direction: form.direction, kind: form.kind, value: String(form.value).trim(),
        apply_compare: Boolean(form.applyCompare), apply_variants: Boolean(form.applyVariants), rounding: form.rounding || 'none',
    };
}

export function validPriceValue(form) {
    const value = String(form.value ?? '').trim();
    if (!/^\d+(\.\d{1,4})?$/.test(value) || Number(value) <= 0) return false;
    return !(form.kind === 'percent' && form.direction === 'decrease' && Number(value) > 100);
}

/** Import progress percentage (0-100) or null while the total is unknown. */
export function importProgress(job) {
    if (!job) return null;
    if (job.status === 'completed') return 100;
    if (!job.total_rows) return null;
    return Math.min(100, Math.floor((job.processed_rows / job.total_rows) * 100));
}

export const importRunning = (job) => Boolean(job) && ['queued', 'processing'].includes(job.status);

const SHEET_ERRORS = {
    product_not_found: ['لا يوجد منتج مطابق في هذا المتجر.', 'No matching product exists in this store.'],
    variant_not_found: ['لا يوجد خيار مطابق لهذا المنتج. أضف الخيارات الجديدة من محرر المنتج.', 'No matching option exists for this product. Add new options in the product editor.'],
    no_variants: ['هذا المنتج بلا خيارات؛ امسح أعمدة الخيارات لهذا الصف.', 'This product has no options; clear the option columns for this row.'],
    duplicate_row: ['صف آخر يعدّل نفس المنتج أو الخيار.', 'Another row already changes the same product or option.'],
    product_conflict: ['قيمة المنتج تختلف عن أول صف له.', 'This product value differs from its first row.'],
    required: ['هذه الخانة مطلوبة.', 'This cell is required.'],
    invalid_price: ['السعر يجب أن يكون رقمًا موجبًا بحد أقصى خانتين عشريتين.', 'Prices must be positive numbers with at most two decimals.'],
    invalid_number: ['المخزون يجب أن يكون عددًا صحيحًا موجبًا.', 'Stock must be a whole positive number.'],
    invalid_boolean: ['استخدم 1 للتتبع أو 0 لإيقافه.', 'Use 1 to track inventory or 0 to stop tracking.'],
    invalid_status: ['استخدم active أو draft.', 'Use active or draft.'],
    sku_taken: ['رمز المخزون مستخدم في منتج آخر. امسحه أو استخدم وضع التحديث.', 'This SKU is already used. Clear it or use update mode.'],
    sku_duplicate: ['رمز المخزون مكرر في الملف.', 'This SKU is repeated in the file.'],
    stock_reserved: ['المخزون أقل من الكمية المحجوزة للطلبات.', 'Stock is below the quantity reserved for orders.'],
    stock_digital: ['مخزون المنتجات الرقمية يُدار من إعدادات التسليم.', 'Digital product stock is managed by delivery settings.'],
    category_permission: ['إنشاء أقسام جديدة يحتاج صلاحية إنشاء الأقسام.', 'Creating new categories requires the create-categories permission.'],
    too_long: ['النص أطول من المسموح.', 'The text is too long.'],
    options_mismatch: ['استخدم نفس أسماء الخيارات بنفس الترتيب في كل صفوف المنتج.', 'Use the same option names in the same order on every row of the product.'],
};

/** Localized text for a sheet row error, falling back to the server message. */
export function sheetErrorText(error, ar) {
    const known = SHEET_ERRORS[error?.code];
    if (!known || error.code === 'duplicate_row' || error.code === 'product_conflict') return known ? `${known[ar ? 0 : 1]} (${error.message})` : error?.message || '';
    return known[ar ? 0 : 1];
}

/** Rounding preview identical to the server for a single price (display only). */
export function estimatePrice(price, form) {
    const base = Number(price); const value = Number(form.value);
    if (!Number.isFinite(base) || !Number.isFinite(value)) return null;
    const delta = form.kind === 'percent' ? (base * value) / 100 : value;
    const next = form.direction === 'increase' ? base + delta : base - delta;
    if (next < 0) return null;
    const rounded = form.rounding === 'round' ? Math.round(next) : form.rounding === 'floor' ? Math.floor(next) : form.rounding === 'ceil' ? Math.ceil(next - 1e-9) : Math.round((next + Number.EPSILON) * 100) / 100;
    return rounded.toFixed(2);
}
