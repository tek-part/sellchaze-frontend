/** Theme Studio — Installed: switch the live theme, customise, export, or uninstall. */
import type { ReactElement } from 'react';
import { usePlatform } from '../state/platform-context';
import { getCatalogEntry } from '../catalog/catalog';
import { isUpdateAvailable, listInstalled, trialRemainingDays } from '../domain';
import { EmptyState, StatusPill } from './pieces';
import { downloadText } from './studio-utils';

export function InstalledPanel(props: { onEdit: (id: string) => void }): ReactElement {
  const { state, deactivateTheme, activateTheme, uninstallTheme, exportTheme } = usePlatform();
  const activeId = state.activeId;
  const records = listInstalled(state);

  if (records.length === 0) {
    return (
      <div className="ts-panel">
        <EmptyState title="No themes installed yet" text="Install a theme from the Marketplace to manage it here." />
      </div>
    );
  }

  const onExport = (id: string): void => {
    const json = exportTheme(id);
    const entry = getCatalogEntry(id);
    if (json) downloadText(`${id}-${entry?.version ?? '1.0.0'}.theme.json`, json);
  };

  const now = new Date().toISOString();

  return (
    <div className="ts-panel">
      <header className="ts-panel__head">
        <h2 className="ts-panel__title">Installed themes</h2>
        <p className="ts-panel__sub">{records.length} installed · one theme is live at a time.</p>
      </header>
      <ul className="ts-list">
        {records.map((record) => {
          const entry = getCatalogEntry(record.id);
          const live = activeId === record.id;
          const updatable = entry ? isUpdateAvailable(record.version, entry.version) : false;
          const trialDays = record.license.status === 'trial' ? trialRemainingDays(record.license, now) : 0;
          return (
            <li key={record.id} className="ts-row">
              <div className="ts-row__main">
                <span
                  className="ts-row__swatch"
                  style={{ background: entry ? `linear-gradient(135deg, ${entry.accent}, ${entry.accentAlt ?? entry.accent})` : '#ccc' }}
                />
                <div>
                  <div className="ts-row__name">
                    {entry?.name ?? record.id}
                    {live ? <StatusPill tone="active">Live</StatusPill> : null}
                    {updatable ? <StatusPill tone="update">Update</StatusPill> : null}
                    {record.license.status === 'trial' ? <StatusPill tone="muted">{trialDays}d trial</StatusPill> : null}
                    {record.license.status === 'none' ? <StatusPill tone="muted">Licence required</StatusPill> : null}
                  </div>
                  <div className="ts-row__meta">
                    v{record.version} · installed {record.installedAt.slice(0, 10)}
                  </div>
                </div>
              </div>
              <div className="ts-row__actions">
                {live ? (
                  <button type="button" className="ts-btn" onClick={deactivateTheme}>Unset live</button>
                ) : (
                  <button type="button" className="ts-btn ts-btn--primary" onClick={() => activateTheme(record.id)}>Set live</button>
                )}
                <button type="button" className="ts-btn" onClick={() => props.onEdit(record.id)}>Customise</button>
                <button type="button" className="ts-btn ts-btn--ghost" onClick={() => onExport(record.id)}>Export</button>
                <button type="button" className="ts-btn ts-btn--danger" onClick={() => uninstallTheme(record.id)}>Uninstall</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
