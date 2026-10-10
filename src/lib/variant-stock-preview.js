export function variantStockPreview(rows, mode, quantity, tracking) {
    const amount = quantity === '' ? NaN : Number(quantity);
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 100000000) return { rows: [], error: 'quantity' };
    const preview = rows.map((row) => ({
        id: row.id, name: row.name, before: row.stock_quantity, reserved: row.reserved_quantity,
        after: mode === 'increase' ? row.stock_quantity + amount : mode === 'decrease' ? row.stock_quantity - amount : amount,
        tracking: tracking === 'keep' ? row.track_inventory : tracking === 'on',
    }));
    const error = preview.some((row) => row.after < 0 || row.after > 100000000) ? 'quantity'
        : preview.some((row) => row.after < row.reserved || (!row.tracking && row.reserved > 0)) ? 'reserved' : null;
    return { rows: preview, error };
}

export function variantStockTargets(rows) {
    return rows.map((row) => ({ id: row.id, version: row.edit_version, expected_stock: row.stock_quantity,
        expected_reserved: row.reserved_quantity, expected_tracking: row.track_inventory }));
}
