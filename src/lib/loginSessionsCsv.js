export function loginSessionsCsv(rows) {
    const escape = (value) => {
        let text = String(value ?? '');
        if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    };
    return '\uFEFF' + [['IP', 'Device Info', 'Email', 'Created at'], ...rows.map((row) => [row.ip_address, row.device_name || row.user_agent, row.email, row.created_at])]
        .map((row) => row.map(escape).join(',')).join('\r\n');
}
