/**
 * Packager (author side) — builds a signed-or-unsigned distribution package from a theme's manifest
 * metadata. In this platform the four themes are packaged straight from the catalog (no module load
 * needed): the loader id binds to the engine-registered code-split loader, so an installed package
 * changes no application code. `packageFromCatalogEntry` is the convenience used by the UI/CLI.
 */
import type { ThemeManifest } from '../../theme-engine';
import type { CatalogEntry } from '../catalog/types';
import {
  DIST_FORMAT,
  DIST_FORMAT_VERSION,
  sealPackage,
  type PackageLicense,
  type PackagePayload,
  type ThemeDistributionPackage,
} from './package';

export interface BuildPackageInput {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly minEngineVersion: string;
  readonly author: string;
  readonly archetype: string;
  readonly capabilities: ReadonlyArray<string>;
  readonly license: PackageLicense;
  readonly loaderId: string;
  readonly defaults?: Readonly<Record<string, string | number | boolean>>;
  readonly createdAt: string;
}

export function buildPackage(input: BuildPackageInput): ThemeDistributionPackage {
  const payload: PackagePayload = {
    format: DIST_FORMAT,
    formatVersion: DIST_FORMAT_VERSION,
    manifest: {
      id: input.id,
      name: input.name,
      version: input.version,
      minEngineVersion: input.minEngineVersion,
      author: input.author,
      archetype: input.archetype,
      capabilities: input.capabilities,
    },
    license: input.license,
    source: { kind: 'registry', loaderId: input.loaderId },
    ...(input.defaults && Object.keys(input.defaults).length > 0 ? { defaults: input.defaults } : {}),
    createdAt: input.createdAt,
  };
  return sealPackage(payload);
}

/** Build a package from a catalog listing. An optional loaded manifest supplies accurate capabilities. */
export function packageFromCatalogEntry(
  entry: CatalogEntry,
  createdAt: string,
  manifest?: ThemeManifest,
): ThemeDistributionPackage {
  return buildPackage({
    id: entry.id,
    name: entry.name,
    version: manifest?.version ?? entry.version,
    minEngineVersion: manifest?.minEngineVersion ?? entry.minEngineVersion,
    author: manifest?.author ?? entry.author,
    archetype: manifest?.archetype ?? entry.archetype,
    capabilities: manifest?.capabilities ?? entry.capabilities,
    license: {
      type: entry.license.type,
      ...(entry.license.sku ? { sku: entry.license.sku } : {}),
      ...(entry.license.price !== undefined ? { price: entry.license.price } : {}),
      ...(entry.license.currency ? { currency: entry.license.currency } : {}),
      ...(entry.license.trialDays !== undefined ? { trialDays: entry.license.trialDays } : {}),
    },
    loaderId: entry.id,
    createdAt,
  });
}
