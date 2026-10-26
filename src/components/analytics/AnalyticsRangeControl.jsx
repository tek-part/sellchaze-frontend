import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { RANGE_PRESETS } from '../../lib/analytics-range';
import './analytics-reports.css';

/** G4: today, yesterday, a specific day, last 7 days, this month or a custom inclusive range. */
export default function AnalyticsRangeControl({ value, onChange, invalid = false }) {
    const { t } = useTranslation(); const id = useId();
    const set = (patch) => onChange({ ...value, ...patch });
    const date = (key, label) => (
        <div className="ws-analytics-field">
            <label htmlFor={`${id}-${key}`}>{label}</label>
            <input id={`${id}-${key}`} type="date" dir="ltr" value={value[key] || ''} onChange={(event) => set({ [key]: event.target.value })} />
        </div>
    );
    return (
        <div className="ws-analytics-controls">
            <div className="ws-analytics-field">
                <label htmlFor={`${id}-preset`}>{t('g4_range_label', 'Period')}</label>
                <select id={`${id}-preset`} value={value.preset} onChange={(event) => set({ preset: event.target.value })}>
                    {RANGE_PRESETS.map((preset) => <option key={preset} value={preset}>{t(`g4_range_${preset}`)}</option>)}
                </select>
            </div>
            {value.preset === 'day' ? date('day', t('g4_range_day_input', 'Day')) : null}
            {value.preset === 'custom' ? <>{date('from', t('g4_range_from', 'From'))}{date('to', t('g4_range_to', 'To'))}</> : null}
            {invalid ? <p role="status" className="ws-analytics-invalid">{t('g4_range_invalid')}</p> : null}
        </div>
    );
}
