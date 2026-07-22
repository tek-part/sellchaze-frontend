/** Theme Studio — Import / Export: portable `.theme.json` packages (settings + scheme/direction). */
import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import { usePlatform } from '../state/platform-context';
import { getCatalogEntry } from '../catalog/catalog';
import { listInstalled } from '../domain';
import { downloadText } from './studio-utils';

export function ImportExportPanel(): ReactElement {
  const { state, exportTheme, importPackageJson } = usePlatform();
  const [json, setJson] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const records = listInstalled(state);

  const onExport = (id: string): void => {
    const text = exportTheme(id);
    const entry = getCatalogEntry(id);
    if (text) downloadText(`${id}-${entry?.version ?? '1.0.0'}.theme.json`, text);
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => setJson(text));
  };

  const onImport = (): void => {
    if (json.trim() === '') return;
    void importPackageJson(json);
  };

  return (
    <div className="ts-panel">
      <header className="ts-panel__head">
        <h2 className="ts-panel__title">Import &amp; Export</h2>
        <p className="ts-panel__sub">Move a theme’s configuration between stores as a portable package.</p>
      </header>

      <div className="ts-io">
        <section className="ts-io__col">
          <h3 className="ts-io__title">Export</h3>
          {records.length === 0 ? (
            <p className="ts-field__help">No installed themes to export.</p>
          ) : (
            <ul className="ts-io__list">
              {records.map((record) => {
                const entry = getCatalogEntry(record.id);
                return (
                  <li key={record.id} className="ts-io__item">
                    <span>{entry?.name ?? record.id} <span className="ts-row__meta">v{record.version}</span></span>
                    <button type="button" className="ts-btn ts-btn--ghost ts-btn--sm" onClick={() => onExport(record.id)}>Download</button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ts-io__col">
          <h3 className="ts-io__title">Import</h3>
          <input ref={fileRef} type="file" accept="application/json,.json" className="ts-file" onChange={onFile} />
          <textarea
            className="ts-input ts-textarea ts-io__paste"
            aria-label="Theme package JSON to import"
            placeholder="…or paste a .theme.json package here"
            rows={8}
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
          <button type="button" className="ts-btn ts-btn--primary" onClick={onImport} disabled={json.trim() === ''}>Import package</button>
          <p className="ts-field__help">Settings are re-validated against the target theme’s schema; unknown keys are dropped.</p>
        </section>
      </div>
    </div>
  );
}
