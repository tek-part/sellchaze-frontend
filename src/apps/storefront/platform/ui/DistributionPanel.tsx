/**
 * Theme Studio — Distribution: package + sign themes, import + verify packages (integrity / manifest /
 * compatibility / license / signature), install through the verification gate, uninstall, and roll back.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { DistributionProvider, useDistribution, type VerifyPreview } from '../state/distribution-context';
import { getCatalogEntry } from '../catalog/catalog';
import { listInstalledPackages, type VerificationCheck } from '../distribution';
import { EmptyState } from './pieces';
import { cx, downloadText } from './studio-utils';

function CheckRow(props: { check: VerificationCheck }): ReactElement {
  const { check } = props;
  const glyph = check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✕';
  return (
    <li className={cx('ts-check', `ts-check--${check.status}`)}>
      <span className="ts-check__glyph" aria-hidden>{glyph}</span>
      <span className="ts-check__name">{check.name}</span>
      <span className="ts-check__detail">{check.detail}</span>
    </li>
  );
}

function VerifyReport(props: { preview: VerifyPreview }): ReactElement {
  const { preview } = props;
  return (
    <div className="ts-verify">
      <div className="ts-verify__head">
        <span>{preview.package.payload.manifest.name} · v{preview.package.payload.manifest.version}</span>
        <span className={cx('ts-badge', preview.report.ok ? 'ts-badge--ok' : 'ts-badge--bad')}>{preview.report.ok ? 'Verified' : 'Rejected'}</span>
      </div>
      <ul className="ts-checks">
        {preview.report.checks.map((c) => <CheckRow key={c.name} check={c} />)}
      </ul>
      <p className="ts-verify__digest">sha256: <code>{preview.package.integrity.digest.slice(0, 24)}…</code></p>
    </div>
  );
}

function DistributionInner(): ReactElement {
  const dist = useDistribution();
  const [requireSig, setRequireSig] = useState(true);
  const [json, setJson] = useState('');
  const installed = listInstalledPackages(dist.state);

  const { notice, error, clearMessages } = dist;
  useEffect(() => {
    if (!notice && !error) return;
    const t = window.setTimeout(clearMessages, 4200);
    return () => window.clearTimeout(t);
  }, [notice, error, clearMessages]);

  const preview = useMemo<VerifyPreview | { error: string } | null>(() => {
    if (json.trim() === '') return null;
    return dist.previewPackage(json);
  }, [json, dist]);

  const onExport = (id: string): void => {
    const text = dist.exportPackage(id);
    const entry = getCatalogEntry(id);
    if (text) downloadText(`${id}-${entry?.version ?? '1.0.0'}.theme-pkg.json`, text);
  };

  const previewOk = preview && 'report' in preview ? preview.report.ok : false;

  return (
    <div className="ts-panel">
      <header className="ts-panel__head ts-panel__head--row">
        <div>
          <h2 className="ts-panel__title">Theme Distribution</h2>
          <p className="ts-panel__sub">Package · sign · verify · install · rollback · Engine {dist.engineVersion} · trusted key <code>{dist.trustedKeyId}</code></p>
        </div>
        <div className="ts-editor__toolbar">
          <label className="ts-reqsig"><input type="checkbox" checked={requireSig} onChange={(e) => setRequireSig(e.target.checked)} /> Require valid signature</label>
          <button type="button" className="ts-btn" disabled={!dist.canUndo} onClick={dist.rollback}>Rollback ({dist.state.history.length})</button>
        </div>
      </header>

      <section className="ts-dist-section">
        <h3 className="ts-io__title">Registry — package &amp; install</h3>
        <ul className="ts-list">
          {dist.catalog.map((entry) => {
            const isInstalled = Boolean(dist.state.installed[entry.id]);
            return (
              <li key={entry.id} className="ts-row">
                <div className="ts-row__main">
                  <span className="ts-row__swatch" style={{ background: `linear-gradient(135deg, ${entry.accent}, ${entry.accentAlt ?? entry.accent})` }} />
                  <div>
                    <div className="ts-row__name">{entry.name}{isInstalled ? <span className="ts-pill ts-pill--installed">Installed</span> : null}</div>
                    <div className="ts-row__meta">v{entry.version} · loaderId {entry.id} · {entry.license.type}</div>
                  </div>
                </div>
                <div className="ts-row__actions">
                  <button type="button" className="ts-btn ts-btn--primary" onClick={() => dist.installTheme(entry.id, requireSig)}>Package &amp; install</button>
                  <button type="button" className="ts-btn ts-btn--ghost" onClick={() => onExport(entry.id)}>Export .theme-pkg</button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ts-dist-section">
        <h3 className="ts-io__title">Import &amp; verify</h3>
        <div className="ts-io">
          <div className="ts-io__col">
            <textarea className="ts-input ts-textarea ts-io__paste" rows={10} aria-label="Package JSON to verify and install" placeholder="Paste a .theme-pkg.json package to verify…" value={json} onChange={(e) => setJson(e.target.value)} />
            <button type="button" className="ts-btn ts-btn--primary" disabled={!previewOk} onClick={() => dist.installFromJson(json, requireSig)}>Install verified package</button>
          </div>
          <div className="ts-io__col">
            {preview === null ? (
              <p className="ts-field__help">Paste a package to run the verification pipeline (integrity · manifest · compatibility · license · signature).</p>
            ) : 'error' in preview ? (
              <div className="ts-note ts-note--error">Parse error: {preview.error}</div>
            ) : (
              <VerifyReport preview={preview} />
            )}
          </div>
        </div>
      </section>

      <section className="ts-dist-section">
        <h3 className="ts-io__title">Installed packages</h3>
        {installed.length === 0 ? (
          <EmptyState title="No packages installed" text="Package & install a theme above, or import a package." />
        ) : (
          <ul className="ts-list">
            {installed.map((pkg) => (
              <li key={pkg.id} className="ts-row">
                <div className="ts-row__main">
                  <div>
                    <div className="ts-row__name">
                      {getCatalogEntry(pkg.id)?.name ?? pkg.id}
                      {pkg.signatureTrusted ? <span className="ts-pill ts-pill--active">Signed ✓</span> : <span className="ts-pill ts-pill--muted">Unsigned</span>}
                    </div>
                    <div className="ts-row__meta">v{pkg.version} · sha256 {pkg.integrity.slice(0, 16)}… · installed {pkg.installedAt.slice(0, 10)}</div>
                  </div>
                </div>
                <div className="ts-row__actions">
                  <button type="button" className="ts-btn ts-btn--danger" onClick={() => dist.uninstall(pkg.id)}>Uninstall</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(notice || error) ? (
        <div className="ts-toasts" role="status" aria-live="polite">
          {error ? <div className="ts-toast ts-toast--error">{error}</div> : null}
          {notice ? <div className="ts-toast ts-toast--ok">{notice}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export function DistributionPanel(): ReactElement {
  return (
    <DistributionProvider>
      <DistributionInner />
    </DistributionProvider>
  );
}
