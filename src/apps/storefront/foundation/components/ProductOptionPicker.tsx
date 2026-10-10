import { useTranslation } from 'react-i18next';
import type { ProductVariantModel } from '../../types/catalog';
import type { OptionDisplay } from '../../types/product-options';
import { optionGroup, optionKey, selectionFor, type VariantSelection } from '../../state/variant-selection';
import { Select } from './Select';

export function ProductOptionPicker({ variants, display, selection, onChange }: {
  variants: ReadonlyArray<ProductVariantModel>; display: ReadonlyArray<OptionDisplay>;
  selection: VariantSelection; onChange: (selection: VariantSelection) => void;
}) {
  const { i18n, t } = useTranslation(); const ar = i18n.language.startsWith('ar');
  const groups = Array.from(new Set(variants.map(optionGroup)));
  const rows = variants.filter((v) => optionGroup(v) === selection.group);
  const names = Object.keys(rows[0]?.options ?? {});
  const axes = names.map((name) => {
    const config = display.find((axis) => optionKey(axis.name) === optionKey(name));
    const values = new Map<string, string>();
    for (const row of rows) for (const [key, value] of Object.entries(row.options ?? {})) {
      if (optionKey(key) === optionKey(name)) values.set(optionKey(value), value);
    }
    const ordered = [...(config?.values.map((v) => optionKey(v.value)).filter((v) => values.has(v)) ?? []), ...values.keys()];
    return { name, config, values: Array.from(new Set(ordered)).map((key) => ({ key, raw: values.get(key) ?? key, meta: config?.values.find((v) => optionKey(v.value) === key) })) };
  }).sort((a, b) => {
    const rank = (name: string) => { const index = display.findIndex((axis) => optionKey(axis.name) === optionKey(name)); return index < 0 ? display.length : index; };
    return rank(a.name) - rank(b.name);
  });
  return <div className="sf-option-picker">
    {groups.length > 1 ? <Select label={ar ? 'مجموعة الخيارات' : 'Option group'} value={selection.group} options={groups.map((group) => {
      const first = variants.find((v) => optionGroup(v) === group)!;
      return { value: group, label: Object.keys(first.options ?? {}).map((name) => display.find((a) => optionKey(a.name) === optionKey(name))?.label || name).join(' / ') || (ar ? 'خيارات أخرى' : 'Other options') };
    })} onChange={(e) => { const group = variants.filter((v) => optionGroup(v) === e.target.value); const first = group.find((v) => v.available) ?? group[0]; if (first) onChange(selectionFor(first)); }} /> : null}
    {names.length === 0 ? <Select label={t('pdp.variant')} value={selection.id ?? ''} options={rows.map((v) => ({ value: v.id, label: v.label, disabled: !v.available }))} onChange={(e) => { const row = rows.find((v) => v.id === e.target.value); if (row) onChange(selectionFor(row)); }} /> : axes.map(({ name, config, values }) => {
      const key = optionKey(name); const label = config?.label || name;
      const change = (value: string) => onChange({ group: selection.group, values: { ...selection.values, [key]: value } });
      if (config?.type === 'dropdown') return <Select key={key} label={label} value={selection.values[key] ?? ''} options={values.map((v) => ({ value: v.key, label: v.meta?.label || v.raw }))} onChange={(e) => change(e.target.value)} />;
      return <fieldset key={key} className="sf-option-axis"><legend>{label}</legend><div className="sf-option-values">{values.map(({ key: value, raw, meta }) => {
        const image = meta?.image_url && /^(https?:\/\/|\/(?!\/))/i.test(meta.image_url) ? meta.image_url : undefined;
        return <button key={value} type="button" className="sf-option-value" aria-pressed={selection.values[key] === value} onClick={() => change(value)}>
          {config?.type === 'color' && meta?.color && /^#[0-9a-f]{6}$/i.test(meta.color) ? <span className="sf-option-swatch" style={{ backgroundColor: meta.color }} aria-hidden="true" /> : null}
          {config?.type === 'image' && image ? <img src={image} alt="" loading="lazy" /> : null}<span>{meta?.label || raw}</span>
        </button>;
      })}</div></fieldset>;
    })}
  </div>;
}
