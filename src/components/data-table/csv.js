import { toCsv } from '../../features/data-table/state';

/**
 * Download the given rows as CSV. Columns with `csv(row)` are exported (others are skipped), in
 * the table's current order, so the file matches what the merchant sees.
 */
export function downloadCsv(filename, columns, rows) {
    const exported = columns.filter((column) => typeof column.csv === 'function');
    const blob = new Blob([toCsv(exported.map((column) => column.header), rows.map((row) => exported.map((column) => column.csv(row))))], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
