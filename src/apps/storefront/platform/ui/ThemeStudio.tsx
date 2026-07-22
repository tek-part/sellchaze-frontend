/**
 * Theme Studio — the Multi-Theme Platform's management surface. Composes the domain-backed platform
 * context with the marketplace, installed, live editor, updates, and import/export panels. A single
 * self-contained admin app (its own entry + CSS), fully isolated from the storefront and dashboards.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { PlatformProvider, usePlatform } from '../state/platform-context';
import { MarketplacePanel } from './MarketplacePanel';
import { InstalledPanel } from './InstalledPanel';
import { EditorPanel } from './EditorPanel';
import { UpdatesPanel } from './UpdatesPanel';
import { ImportExportPanel } from './ImportExportPanel';
import { DistributionPanel } from './DistributionPanel';
import { cx } from './studio-utils';
import './studio.css';

type Tab = 'marketplace' | 'installed' | 'editor' | 'updates' | 'io' | 'distribution';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'installed', label: 'Installed' },
  { id: 'editor', label: 'Editor' },
  { id: 'updates', label: 'Updates' },
  { id: 'io', label: 'Import / Export' },
  { id: 'distribution', label: 'Distribution' },
];

function Toasts(): ReactElement | null {
  const { notice, error, clearMessages } = usePlatform();
  useEffect(() => {
    if (!notice && !error) return;
    const t = window.setTimeout(clearMessages, 4200);
    return () => window.clearTimeout(t);
  }, [notice, error, clearMessages]);
  if (!notice && !error) return null;
  return (
    <div className="ts-toasts" role="status" aria-live="polite">
      {error ? <div className="ts-toast ts-toast--error">{error}</div> : null}
      {notice ? <div className="ts-toast ts-toast--ok">{notice}</div> : null}
    </div>
  );
}

function StudioShell(): ReactElement {
  const platform = usePlatform();
  const [tab, setTab] = useState<Tab>('marketplace');
  const [selectedId, setSelectedId] = useState<string | null>(platform.state.activeId);
  const { activeId } = platform.state;
  const activeEntry = activeId ? platform.catalog.find((e) => e.id === activeId) : undefined;
  const updateCount = platform.updates.length;

  const openEditor = (id: string): void => {
    setSelectedId(id);
    setTab('editor');
  };

  return (
    <div className="ts-app">
      <header className="ts-header">
        <div className="ts-header__brand">
          <span className="ts-header__logo" aria-hidden>◧</span>
          <div>
            <div className="ts-header__title">Theme Studio</div>
            <div className="ts-header__tagline">Multi-Theme Platform · Engine {platform.engineVersion}</div>
          </div>
        </div>
        <div className="ts-header__live">
          <span className="ts-header__live-label">Live theme</span>
          <span className="ts-header__live-name">{activeEntry?.name ?? 'None (default)'}</span>
        </div>
      </header>

      <nav className="ts-tabs" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cx('ts-tab', tab === t.id && 'ts-tab--on')}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            {t.label}
            {t.id === 'updates' && updateCount > 0 ? <span className="ts-tab__count">{updateCount}</span> : null}
          </button>
        ))}
      </nav>

      <main className="ts-main">
        {tab === 'marketplace' ? <MarketplacePanel onEdit={openEditor} /> : null}
        {tab === 'installed' ? <InstalledPanel onEdit={openEditor} /> : null}
        {tab === 'editor' ? <EditorPanel selectedId={selectedId} /> : null}
        {tab === 'updates' ? <UpdatesPanel /> : null}
        {tab === 'io' ? <ImportExportPanel /> : null}
        {tab === 'distribution' ? <DistributionPanel /> : null}
      </main>

      <Toasts />
    </div>
  );
}

export function ThemeStudio(): ReactElement {
  return (
    <PlatformProvider>
      <StudioShell />
    </PlatformProvider>
  );
}
