export default function ManualOrderField({ label, value, onChange, textarea = false, required = false, type = 'text', disabled, maxLength }) {
    const Tag = textarea ? 'textarea' : 'input';
    return <label className={`ws-manual-field ${textarea ? 'is-textarea' : ''} ${value ? 'has-value' : ''}`}><span>{label}{required ? ' *' : ''}</span><Tag aria-label={label} required={required} type={textarea ? undefined : type} value={value} onChange={event => onChange(event.target.value)} disabled={disabled} maxLength={maxLength} /></label>;
}

