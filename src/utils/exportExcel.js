import * as XLSX from 'xlsx';

/**
 * @param {{ key: string, header: string }[]} columns
 * @param {Record<string, unknown>[]} rows — flat objects keyed by column keys
 * @param {string} filename without extension
 * @param {{ sheetName?: string }} options
 */
export function exportRowsToExcel(columns, rows, filename, options = {}) {
    const sheetName = options.sheetName || 'Export';
    const header = columns.map((c) => c.header);
    const body = rows.map((row) =>
        columns.map((c) => {
            const v = row[c.key];
            if (v === null || v === undefined) {
                return '';
            }
            if (typeof v === 'object') {
                return JSON.stringify(v);
            }
            return v;
        }),
    );
    const aoa = [header, ...body];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31) || 'Sheet1');
    const safe = String(filename || 'export').replace(/[/\\?%*:|"<>]/g, '-');
    XLSX.writeFile(wb, `${safe}.xlsx`);
}

/**
 * Multi-sheet workbook (e.g. roles + permissions).
 * @param {{ name: string, columns: { key: string, header: string }[], rows: Record<string, unknown>[] }[]} sheets
 * @param {string} filename
 */
export function exportWorkbookSheets(sheets, filename) {
    const wb = XLSX.utils.book_new();
    for (const sheet of sheets) {
        const header = sheet.columns.map((c) => c.header);
        const body = sheet.rows.map((row) =>
            sheet.columns.map((c) => {
                const v = row[c.key];
                if (v === null || v === undefined) {
                    return '';
                }
                if (typeof v === 'object') {
                    return JSON.stringify(v);
                }
                return v;
            }),
        );
        const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31) || 'Sheet');
    }
    const safe = String(filename || 'export').replace(/[/\\?%*:|"<>]/g, '-');
    XLSX.writeFile(wb, `${safe}.xlsx`);
}
