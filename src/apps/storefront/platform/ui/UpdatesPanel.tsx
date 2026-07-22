/** Theme Studio — Updates: themes with a newer catalog version, with changelog + one-click update. */
import type { ReactElement } from 'react';
import { usePlatform } from '../state/platform-context';
import { EmptyState } from './pieces';

export function UpdatesPanel(): ReactElement {
  const { updates, pending, updateTheme } = usePlatform();

  if (updates.length === 0) {
    return (
      <div className="ts-panel">
        <EmptyState title="Everything is up to date" text="Installed themes match the latest marketplace versions." />
      </div>
    );
  }

  return (
    <div className="ts-panel">
      <header className="ts-panel__head">
        <h2 className="ts-panel__title">Updates</h2>
        <p className="ts-panel__sub">{updates.length} theme(s) have a newer version available.</p>
      </header>
      <ul className="ts-list">
        {updates.map((update) => (
          <li key={update.id} className="ts-row ts-row--stack">
            <div className="ts-row__main">
              <div>
                <div className="ts-row__name">{update.name}</div>
                <div className="ts-row__meta">v{update.installedVersion} → <strong>v{update.availableVersion}</strong></div>
              </div>
              <button
                type="button"
                className="ts-btn ts-btn--primary"
                disabled={pending.has(update.id)}
                onClick={() => void updateTheme(update.id)}
              >
                {pending.has(update.id) ? 'Updating…' : `Update to ${update.availableVersion}`}
              </button>
            </div>
            {update.notes.length > 0 ? (
              <ul className="ts-changelog">
                {update.notes.map((note, i) => (
                  <li key={i} className="ts-changelog__item">{note}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
