/** Theme Studio — Marketplace: browse the catalog, install, preview, jump to customise. */
import type { ReactElement } from 'react';
import { usePlatform } from '../state/platform-context';
import type { CatalogEntry } from '../catalog/types';
import { CompatBadge, LicenseBadge, StatusPill } from './pieces';
import { previewUrl } from './studio-utils';

function ThemeCard(props: { entry: CatalogEntry; onEdit: (id: string) => void }): ReactElement {
  const { entry, onEdit } = props;
  const { state, pending, installTheme, activateTheme } = usePlatform();
  const installed = Boolean(state.installed[entry.id]);
  const active = state.activeId === entry.id;
  const busy = pending.has(entry.id);

  return (
    <article className="ts-card">
      <div
        className="ts-card__hero"
        style={{ background: `linear-gradient(135deg, ${entry.accent}, ${entry.accentAlt ?? entry.accent})` }}
      >
        <span className="ts-card__archetype">{entry.archetype}</span>
        {entry.featured ? <span className="ts-card__featured">Featured</span> : null}
      </div>
      <div className="ts-card__body">
        <div className="ts-card__head">
          <h3 className="ts-card__name">{entry.name}</h3>
          <span className="ts-card__version">v{entry.version}</span>
        </div>
        <p className="ts-card__desc">{entry.description}</p>
        <div className="ts-card__tags">
          {entry.tags.slice(0, 4).map((t) => (
            <span key={t} className="ts-tag">{t}</span>
          ))}
        </div>
        <div className="ts-card__badges">
          <LicenseBadge license={entry.license} />
          <CompatBadge entry={entry} />
          {active ? <StatusPill tone="active">Live</StatusPill> : installed ? <StatusPill tone="installed">Installed</StatusPill> : null}
        </div>
        <div className="ts-card__actions">
          {installed ? (
            <>
              <button type="button" className="ts-btn ts-btn--primary" onClick={() => onEdit(entry.id)}>Customise</button>
              {!active ? (
                <button type="button" className="ts-btn" onClick={() => activateTheme(entry.id)}>Set live</button>
              ) : null}
            </>
          ) : (
            <button type="button" className="ts-btn ts-btn--primary" disabled={busy} onClick={() => void installTheme(entry.id)}>
              {busy ? 'Installing…' : 'Install'}
            </button>
          )}
          <a className="ts-btn ts-btn--ghost" href={previewUrl(entry.id)} target="_blank" rel="noreferrer">Preview ↗</a>
        </div>
      </div>
    </article>
  );
}

export function MarketplacePanel(props: { onEdit: (id: string) => void }): ReactElement {
  const { catalog } = usePlatform();
  return (
    <div className="ts-panel">
      <header className="ts-panel__head">
        <h2 className="ts-panel__title">Theme Marketplace</h2>
        <p className="ts-panel__sub">{catalog.length} themes · install without touching application code.</p>
      </header>
      <div className="ts-grid">
        {catalog.map((entry) => (
          <ThemeCard key={entry.id} entry={entry} onEdit={props.onEdit} />
        ))}
      </div>
    </div>
  );
}
