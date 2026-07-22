/**
 * SettingField — renders one merchant setting from a theme's `settingsSchema` (all 10 engine field
 * types). Controlled; emits the coerced value. The editor resolves the full map through the engine's
 * settings resolver on save, so this only needs to produce reasonable raw values.
 */
import type { ChangeEvent, ReactElement } from 'react';
import type { ThemeSettingField, ThemeSettingValue } from '../../theme-engine';

export interface SettingFieldProps {
  field: ThemeSettingField;
  value: ThemeSettingValue;
  onChange: (value: ThemeSettingValue) => void;
}

export function SettingField(props: SettingFieldProps): ReactElement {
  const { field, value, onChange } = props;
  const id = `ts-set-${field.id}`;

  const control = ((): ReactElement => {
    switch (field.type) {
      case 'toggle':
        return (
          <label className="ts-switch">
            <input
              id={id}
              type="checkbox"
              checked={value === true}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
            />
            <span className="ts-switch__track" aria-hidden />
          </label>
        );

      case 'select':
        return (
          <select
            id={id}
            className="ts-input"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );

      case 'color':
        return (
          <span className="ts-color">
            <input
              type="color"
              className="ts-color__swatch"
              value={typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`${field.label} colour`}
            />
            <input
              id={id}
              className="ts-input ts-color__hex"
              value={String(value)}
              onChange={(e) => onChange(e.target.value)}
            />
          </span>
        );

      case 'range':
      case 'number':
        return (
          <span className="ts-range">
            <input
              id={id}
              type={field.type === 'range' ? 'range' : 'number'}
              className={field.type === 'range' ? 'ts-range__slider' : 'ts-input'}
              value={Number(value)}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            {field.type === 'range' ? <span className="ts-range__value">{String(value)}</span> : null}
          </span>
        );

      case 'textarea':
      case 'richtext':
        return (
          <textarea
            id={id}
            className="ts-input ts-textarea"
            rows={3}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'text':
      case 'url':
      case 'image':
      default:
        return (
          <input
            id={id}
            className="ts-input"
            type={field.type === 'url' ? 'url' : 'text'}
            value={String(value)}
            placeholder={field.type === 'image' ? 'https://…' : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  })();

  return (
    <div className="ts-field">
      <label className="ts-field__label" htmlFor={id}>
        {field.label}
        {field.group ? <span className="ts-field__group">{field.group}</span> : null}
      </label>
      {control}
      {field.help ? <p className="ts-field__help">{field.help}</p> : null}
    </div>
  );
}
