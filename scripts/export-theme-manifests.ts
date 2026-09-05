/**
 * Export backend theme manifests (contract §2) from the catalogued theme modules.
 *
 * Loads every theme in `platform/catalog/catalog.ts` (or the ids passed on the CLI), converts it with
 * `buildBackendManifest()` and writes `../sellchaze-backend/resources/themes/storefront/<id>.json`.
 * By default only NEW manifests are written — an existing JSON is left untouched unless `--all` is
 * passed (the four original themes were hand-authored on the backend side).
 *
 *   npm run themes:manifests                # new themes only
 *   npm run themes:manifests -- --all       # overwrite every theme
 *   npm run themes:manifests -- naseem      # one theme (writes even if it exists)
 *   BACKEND_DIR=/path/to/backend npm run themes:manifests
 *
 * Runs under vite-node so theme modules (which import CSS + React components) load unchanged.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_CATALOG } from '../src/apps/storefront/platform/catalog/catalog';
import { buildBackendManifest } from '../src/apps/storefront/platform/export/theme-manifest-export';

const here = dirname(fileURLToPath(import.meta.url));
const backendDir = process.env['BACKEND_DIR'] ? resolve(process.env['BACKEND_DIR']) : resolve(here, '..', '..', 'sellchaze-backend');
const outDir = join(backendDir, 'resources', 'themes', 'storefront');

const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.filter((a) => !a.startsWith('--'));

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  const entries = only.length > 0 ? THEME_CATALOG.filter((e) => only.includes(e.id)) : THEME_CATALOG;
  if (only.length > 0 && entries.length !== only.length) {
    const missing = only.filter((id) => !entries.some((e) => e.id === id));
    console.error(`[themes:manifests] unknown theme id(s): ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  let written = 0;
  for (const entry of entries) {
    const file = join(outDir, `${entry.id}.json`);
    if (existsSync(file) && !all && only.length === 0) {
      console.log(`[themes:manifests] ⏭  ${entry.id}.json exists — skipped (pass --all or the id to overwrite)`);
      continue;
    }
    const module = await entry.load();
    const manifest = buildBackendManifest(module, entry);
    writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    written += 1;
    const sections = Object.keys(manifest.sections_schema).length;
    const groups = manifest.settings_schema.length;
    console.log(`[themes:manifests] ✅ ${entry.id}.json  (${sections} sections, ${groups} setting groups, templates: ${Object.keys(manifest.templates).join('/')})`);
  }
  console.log(`[themes:manifests] wrote ${written} manifest(s) → ${outDir}`);
}

// Top-level await: vite-node closes its server as soon as the module's evaluation finishes, so an
// un-awaited `main()` would lose the server mid-import ("The server is being restarted or closed").
try {
  await main();
} catch (error: unknown) {
  console.error('[themes:manifests] failed:', error);
  process.exitCode = 1;
}
