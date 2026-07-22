/**
 * Theme Studio — Live Theme Editor. Edits the selected installed theme's merchant settings against
 * its `settingsSchema`, with a live token preview (updates on every keystroke) and a full-fidelity
 * storefront iframe preview, plus scheme/direction, validation, and save/reset/export/set-live.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  ENGINE_VERSION,
  type ColorScheme,
  type ColorSchemePreference,
  type Direction,
  type ThemeModule,
  type ThemeSettingValue,
} from '../../theme-engine';
import { usePlatform } from '../state/platform-context';
import { getCatalogEntry } from '../catalog/catalog';
import { validateInstallable } from '../domain';
import { SettingField } from './SettingField';
import { TokenPreview } from './TokenPreview';
import { ThemePreview } from './ThemePreview';
import { EmptyState } from './pieces';
import { downloadText } from './studio-utils';

type Draft = Record<string, ThemeSettingValue>;

function initialDraft(module: ThemeModule, saved: Readonly<Record<string, ThemeSettingValue>>): Draft {
  const out: Draft = {};
  for (const field of module.manifest.settingsSchema) {
    out[field.id] = field.id in saved ? saved[field.id]! : field.default;
  }
  return out;
}

function resolveScheme(pref: ColorSchemePreference): ColorScheme {
  if (pref === 'auto') {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

export function EditorPanel(props: { selectedId: string | null }): ReactElement {
  const platform = usePlatform();
  const { selectedId } = props;
  const record = selectedId ? platform.state.installed[selectedId] : undefined;
  const entry = selectedId ? getCatalogEntry(selectedId) : undefined;

  const [module, setModule] = useState<ThemeModule | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [scheme, setScheme] = useState<ColorSchemePreference>('light');
  const [direction, setDirection] = useState<Direction>('ltr');
  const [showFull, setShowFull] = useState(false);

  // Load the module + seed the draft when the selection changes.
  useEffect(() => {
    let active = true;
    setModule(null);
    if (!selectedId || !record) return;
    void platform.loadModule(selectedId).then((m) => {
      if (!active || !m) return;
      setModule(m);
      setDraft(initialDraft(m, record.settings));
      setScheme(record.colorScheme ?? (m.manifest.supports.colorSchemes.includes('light') ? 'light' : m.manifest.supports.colorSchemes[0] ?? 'light'));
      setDirection(record.direction ?? 'ltr');
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, record?.version]);

  const validation = useMemo(
    () => (entry && module ? validateInstallable(entry, module, ENGINE_VERSION) : null),
    [entry, module],
  );

  const groups = useMemo(() => {
    if (!module) return [];
    const map = new Map<string, typeof module.manifest.settingsSchema[number][]>();
    for (const field of module.manifest.settingsSchema) {
      const key = field.group ?? 'General';
      const list = map.get(key) ?? [];
      list.push(field);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [module]);

  if (!selectedId || !record) {
    return (
      <div className="ts-panel">
        <EmptyState title="Nothing selected" text="Choose a theme from Installed or the Marketplace to customise it." />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="ts-panel">
        <EmptyState title="Loading theme…" text={`Fetching ${entry?.name ?? selectedId}.`} />
      </div>
    );
  }

  const onSave = (): void => {
    void platform.saveSettings(selectedId, draft);
    platform.setRecordScheme(selectedId, scheme);
    platform.setRecordDirection(selectedId, direction);
  };
  const onReset = (): void => setDraft(initialDraft(module, record.settings));
  const onExport = (): void => {
    const json = platform.exportTheme(selectedId);
    if (json) downloadText(`${selectedId}-${record.version}.theme.json`, json);
  };
  const setField = (id: string, value: ThemeSettingValue): void => setDraft((d) => ({ ...d, [id]: value }));

  const supportsDark = module.manifest.supports.colorSchemes.includes('dark');
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft(module, record.settings));

  return (
    <div className="ts-panel">
      <header className="ts-panel__head ts-panel__head--row">
        <div>
          <h2 className="ts-panel__title">{entry?.name ?? selectedId}</h2>
          <p className="ts-panel__sub">v{record.version} · {module.manifest.settingsSchema.length} settings{isDirty ? ' · unsaved changes' : ''}</p>
        </div>
        <div className="ts-editor__toolbar">
          <button type="button" className="ts-btn ts-btn--primary" onClick={onSave} disabled={!isDirty && scheme === (record.colorScheme ?? 'light')}>Save</button>
          <button type="button" className="ts-btn" onClick={onReset} disabled={!isDirty}>Reset</button>
          <button type="button" className="ts-btn ts-btn--ghost" onClick={onExport}>Export</button>
          <button type="button" className="ts-btn" onClick={() => platform.activateTheme(selectedId)}>Set live</button>
        </div>
      </header>

      {validation && !validation.valid ? (
        <div className="ts-note ts-note--error">
          {validation.errors.length} validation error(s): {validation.errors.map((e) => e.message).join('; ')}
        </div>
      ) : validation && validation.warnings.length > 0 ? (
        <div className="ts-note ts-note--warn">
          {validation.warnings.length} warning(s): {validation.warnings.map((w) => w.message).join('; ')}
        </div>
      ) : (
        <div className="ts-note ts-note--ok">Passes validation for engine {ENGINE_VERSION}.</div>
      )}

      <div className="ts-editor">
        <section className="ts-editor__form">
          <div className="ts-editor__modes">
            <div className="ts-seg" role="group" aria-label="Colour scheme">
              {(['light', ...(supportsDark ? ['dark'] : []), 'auto'] as ColorSchemePreference[]).map((s) => (
                <button key={s} type="button" className={scheme === s ? 'ts-seg__btn ts-seg__btn--on' : 'ts-seg__btn'} onClick={() => setScheme(s)}>{s}</button>
              ))}
            </div>
            <div className="ts-seg" role="group" aria-label="Direction">
              {(['ltr', 'rtl'] as Direction[]).map((d) => (
                <button key={d} type="button" className={direction === d ? 'ts-seg__btn ts-seg__btn--on' : 'ts-seg__btn'} onClick={() => setDirection(d)}>{d}</button>
              ))}
            </div>
          </div>

          {module.manifest.settingsSchema.length === 0 ? (
            <p className="ts-field__help">This theme exposes no merchant settings.</p>
          ) : (
            groups.map(([group, fields]) => (
              <fieldset key={group} className="ts-fieldset">
                <legend className="ts-fieldset__legend">{group}</legend>
                {fields.map((field) => (
                  <SettingField key={field.id} field={field} value={draft[field.id] ?? field.default} onChange={(v) => setField(field.id, v)} />
                ))}
              </fieldset>
            ))
          )}
        </section>

        <section className="ts-editor__preview">
          <div className="ts-editor__preview-head">
            <span>Live preview</span>
            <button type="button" className="ts-btn ts-btn--ghost ts-btn--sm" onClick={() => setShowFull((v) => !v)}>
              {showFull ? 'Show tokens' : 'Show full storefront'}
            </button>
          </div>
          {showFull ? (
            <ThemePreview themeId={selectedId} scheme={scheme} settings={draft} />
          ) : (
            <TokenPreview module={module} settings={draft} scheme={resolveScheme(scheme)} />
          )}
        </section>
      </div>
    </div>
  );
}
