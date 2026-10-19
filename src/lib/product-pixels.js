const patterns = { facebook: /^[1-9][0-9]{4,24}$/, tiktok: /^[A-Z0-9]{8,32}$/, snapchat: /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i };

export function productPixelRows(value) {
    if (value == null) return [];
    if (!Array.isArray(value)) return [{ provider: '', id: '' }];
    return value.map(row => ({ provider: typeof row?.provider === 'string' ? row.provider : '', id: typeof row?.id === 'string' ? row.id : '' }));
}

export function compileProductPixels(rows) {
    const clean = [], counts = {}, seen = new Set();
    let valid = rows.length <= 30;
    for (const row of rows) {
        const id = String(row.id ?? '').trim(), pattern = Object.hasOwn(patterns, row.provider) ? patterns[row.provider] : null;
        if (!pattern || !pattern.test(id)) { valid = false; continue; }
        const normalized = row.provider === 'snapchat' ? id.toLowerCase() : id;
        const key = `${row.provider}:${normalized}`;
        if (seen.has(key)) continue;
        seen.add(key); counts[row.provider] = (counts[row.provider] || 0) + 1;
        if (counts[row.provider] > 10) valid = false;
        clean.push({ provider: row.provider, id: normalized });
    }
    return { valid, value: clean.length ? clean : null };
}
