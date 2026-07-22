/**
 * Build signed theme distribution packages as release artifacts.
 *
 * Emits one `<id>-<version>.theme-pkg.json` per catalogued theme into `dist/theme-packages/`, plus an
 * `index.json` catalog and a `SHA256SUMS` checksum file. Reuses the platform's distribution layer
 * (packager + signing + integrity) — pure TS, so this runs under vite-node with NO app/CSS load
 * (catalog loaders are lazy and never invoked here).
 *
 * Signing (optional): set THEME_SIGNING_KEY_ID + THEME_SIGNING_KEY (CI secrets) to HMAC-sign each
 * package; without them, packages are emitted UNSIGNED (a warning is printed). Reproducibility: set
 * PACK_DATE (ISO) to pin `createdAt` so the integrity digest is stable across re-runs of a release.
 *
 * Run: `npm run pack:themes`  (or `vite-node scripts/pack-themes.ts`).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { THEME_CATALOG } from '../src/apps/storefront/platform/catalog/catalog';
import {
  packageFileName,
  packageFromCatalogEntry,
  serializePackage,
  sha256Hex,
  signPackage,
  createHmacSigner,
  type ThemeDistributionPackage,
} from '../src/apps/storefront/platform/distribution';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'dist', 'theme-packages');
const packDate = process.env['PACK_DATE'] && process.env['PACK_DATE'] !== '' ? process.env['PACK_DATE']! : new Date().toISOString();

const keyId = process.env['THEME_SIGNING_KEY_ID'];
const secret = process.env['THEME_SIGNING_KEY'];
const signer = keyId && secret ? createHmacSigner(keyId, secret) : null;

mkdirSync(outDir, { recursive: true });

if (!signer) {
  console.warn('[pack-themes] ⚠ THEME_SIGNING_KEY(_ID) not set — emitting UNSIGNED packages.');
}

interface IndexEntry {
  readonly id: string;
  readonly version: string;
  readonly file: string;
  readonly integrity: string;
  readonly signed: boolean;
  readonly signatureKeyId?: string;
}

const index: IndexEntry[] = [];
const sums: string[] = [];

for (const entry of THEME_CATALOG) {
  let pkg: ThemeDistributionPackage = packageFromCatalogEntry(entry, packDate);
  if (signer) pkg = signPackage(pkg, signer);

  const file = packageFileName(pkg);
  const json = serializePackage(pkg);
  writeFileSync(join(outDir, file), json, 'utf8');

  index.push({
    id: pkg.payload.manifest.id,
    version: pkg.payload.manifest.version,
    file,
    integrity: `sha256:${pkg.integrity.digest}`,
    signed: Boolean(pkg.signature),
    ...(pkg.signature ? { signatureKeyId: pkg.signature.keyId } : {}),
  });
  sums.push(`${sha256Hex(json)}  ${file}`);
  console.log(`[pack-themes] ${pkg.signature ? '🔏 signed  ' : '📦 unsigned'} ${file}  (integrity ${pkg.integrity.digest.slice(0, 12)}…)`);
}

writeFileSync(
  join(outDir, 'index.json'),
  JSON.stringify({ generatedAt: packDate, engineMin: '1.0.0', signed: Boolean(signer), packages: index }, null, 2),
  'utf8',
);
writeFileSync(join(outDir, 'SHA256SUMS'), sums.join('\n') + '\n', 'utf8');

console.log(`[pack-themes] wrote ${index.length} package(s) + index.json + SHA256SUMS → dist/theme-packages/`);
