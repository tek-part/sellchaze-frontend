/**
 * Distribution context — React binding over the distribution domain. Holds the persisted
 * DistributionState, a publisher Signer + a Verifier trust store (demo keys), and exposes
 * package/sign/export, import+verify, install, uninstall, and rollback. Mutations use functional
 * setState so concurrent actions compose; persistence is the fail-safe localStorage port.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ENGINE_VERSION } from '../../theme-engine';
import { getCatalogEntry, listCatalog } from '../catalog/catalog';
import type { ThemeCatalog } from '../catalog/types';
import {
  DISTRIBUTION_STORAGE_KEY,
  canRollback,
  createDistributionPort,
  createHmacSigner,
  createHmacVerifier,
  installPackage,
  packageFromCatalogEntry,
  parsePackage,
  rollback as rollbackState,
  serializePackage,
  signPackage,
  uninstallPackage,
  verifyPackage,
  type DistributionState,
  type ThemeDistributionPackage,
  type VerificationReport,
  type Verifier,
} from '../distribution';

/** Demo signing identity. HMAC is symmetric, so the trust store holds the same key; the Signer/Verifier
 *  seam supports swapping in asymmetric keys (private with the publisher, public in the trust store). */
const PUBLISHER_KEY_ID = 'sellchase-official-2026';
const PUBLISHER_SECRET = 'sellchase-distribution-demo-key';

const now = (): string => new Date().toISOString();

export interface VerifyPreview {
  readonly package: ThemeDistributionPackage;
  readonly report: VerificationReport;
}

export interface DistributionContextValue {
  readonly catalog: ThemeCatalog;
  readonly state: DistributionState;
  readonly engineVersion: string;
  readonly trustedKeyId: string;
  readonly canUndo: boolean;
  readonly notice: string | null;
  readonly error: string | null;
  clearMessages(): void;
  /** Build + sign a distribution package for a catalogued theme. */
  buildSignedPackage(id: string): ThemeDistributionPackage | null;
  exportPackage(id: string): string | null;
  /** Parse + verify a package JSON without installing (for the import preview). */
  previewPackage(json: string): VerifyPreview | { readonly error: string };
  /** Publish + install a catalogued theme (self-signed) through the verification pipeline. */
  installTheme(id: string, requireSignature: boolean): void;
  /** Install from an imported package JSON. */
  installFromJson(json: string, requireSignature: boolean): void;
  uninstall(id: string): void;
  rollback(): void;
}

const DistributionContext = createContext<DistributionContextValue | null>(null);

export function DistributionProvider(props: { children: ReactNode }): ReactElement {
  const portRef = useRef(createDistributionPort(DISTRIBUTION_STORAGE_KEY));
  const signerRef = useRef(createHmacSigner(PUBLISHER_KEY_ID, PUBLISHER_SECRET));
  const verifierRef = useRef<Verifier>(createHmacVerifier({ [PUBLISHER_KEY_ID]: PUBLISHER_SECRET }));
  const [state, setState] = useState<DistributionState>(() => portRef.current.load());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const catalog = listCatalog();

  useEffect(() => { portRef.current.save(state); }, [state]);

  const buildSignedPackage = useCallback((id: string): ThemeDistributionPackage | null => {
    const entry = getCatalogEntry(id);
    if (!entry) return null;
    return signPackage(packageFromCatalogEntry(entry, now()), signerRef.current);
  }, []);

  const exportPackage = useCallback((id: string): string | null => {
    const pkg = buildSignedPackage(id);
    return pkg ? serializePackage(pkg) : null;
  }, [buildSignedPackage]);

  const previewPackage = useCallback((json: string): VerifyPreview | { error: string } => {
    const parsed = parsePackage(json);
    if (!parsed.ok) return { error: parsed.error };
    const report = verifyPackage(parsed.package, { verifier: verifierRef.current, engineVersion: ENGINE_VERSION });
    return { package: parsed.package, report };
  }, []);

  const doInstall = useCallback((pkg: ThemeDistributionPackage, requireSignature: boolean): void => {
    setError(null);
    let failure: string | undefined;
    setState((prev) => {
      const result = installPackage(prev, pkg, { verifier: verifierRef.current, engineVersion: ENGINE_VERSION, requireSignature, at: now() });
      if (!result.ok) { failure = result.error; return prev; }
      return result.state;
    });
    if (failure) setError(`Install blocked — ${failure}`);
    else setNotice(`Installed ${pkg.payload.manifest.name} ${pkg.payload.manifest.version} (verified).`);
  }, []);

  const installTheme = useCallback((id: string, requireSignature: boolean): void => {
    const pkg = buildSignedPackage(id);
    if (!pkg) { setError('Unknown theme.'); return; }
    doInstall(pkg, requireSignature);
  }, [buildSignedPackage, doInstall]);

  const installFromJson = useCallback((json: string, requireSignature: boolean): void => {
    const parsed = parsePackage(json);
    if (!parsed.ok) { setError(`Import failed — ${parsed.error}`); return; }
    doInstall(parsed.package, requireSignature);
  }, [doInstall]);

  const uninstall = useCallback((id: string): void => {
    setState((prev) => uninstallPackage(prev, id, now()));
    setNotice('Theme uninstalled (rollback available).');
  }, []);

  const rollback = useCallback((): void => {
    let undone: string | undefined;
    setState((prev) => {
      const r = rollbackState(prev);
      if (!r.ok) return prev;
      undone = r.undone ? `${r.undone.action} of ${r.undone.packageId}` : undefined;
      return r.state;
    });
    if (undone) setNotice(`Rolled back the ${undone}.`);
    else setError('Nothing to roll back.');
  }, []);

  const clearMessages = useCallback((): void => { setNotice(null); setError(null); }, []);

  const value = useMemo<DistributionContextValue>(() => ({
    catalog,
    state,
    engineVersion: ENGINE_VERSION,
    trustedKeyId: PUBLISHER_KEY_ID,
    canUndo: canRollback(state),
    notice,
    error,
    clearMessages,
    buildSignedPackage,
    exportPackage,
    previewPackage,
    installTheme,
    installFromJson,
    uninstall,
    rollback,
  }), [catalog, state, notice, error, clearMessages, buildSignedPackage, exportPackage, previewPackage, installTheme, installFromJson, uninstall, rollback]);

  return <DistributionContext.Provider value={value}>{props.children}</DistributionContext.Provider>;
}

export function useDistribution(): DistributionContextValue {
  const ctx = useContext(DistributionContext);
  if (!ctx) throw new Error('useDistribution must be used within a DistributionProvider');
  return ctx;
}
