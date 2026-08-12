import writeExcelFile from 'write-excel-file/browser';

function normalizeValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object' && !(value instanceof Date)) {
        return JSON.stringify(value);
    }
    return value;
}

function sheetData(columns, rows) {
    const header = columns.map((column) => ({
        value: column.header,
        fontWeight: 'bold',
        backgroundColor: '#E9F7F2',
    }));
    const body = rows.map((row) => columns.map((column) => normalizeValue(row[column.key])));

    return [header, ...body];
}

function safeFilename(filename) {
    return String(filename || 'export').replace(/[/\\?%*:|"<>]/g, '-');
}

/**
 * @param {{ key: string, header: string }[]} columns
 * @param {Record<string, unknown>[]} rows — flat objects keyed by column keys
 * @param {string} filename without extension
 * @param {{ sheetName?: string }} options
 */
export async function exportRowsToExcel(columns, rows, filename, options = {}) {
    const sheetName = options.sheetName || 'Export';
    await writeExcelFile(sheetData(columns, rows), {
        sheet: sheetName.slice(0, 31) || 'Sheet1',
        stickyRowsCount: 1,
        rightToLeft: document.documentElement.dir === 'rtl',
    }).toFile(`${safeFilename(filename)}.xlsx`);
}

/**
 * Multi-sheet workbook (e.g. roles + permissions).
 * @param {{ name: string, columns: { key: string, header: string }[], rows: Record<string, unknown>[] }[]} sheets
 * @param {string} filename
 */
export async function exportWorkbookSheets(sheets, filename) {
    const rightToLeft = document.documentElement.dir === 'rtl';
    const workbook = sheets.map((sheet) => ({
        data: sheetData(sheet.columns, sheet.rows),
        sheet: sheet.name.slice(0, 31) || 'Sheet',
        stickyRowsCount: 1,
        rightToLeft,
    }));

    await writeExcelFile(workbook).toFile(`${safeFilename(filename)}.xlsx`);
}
