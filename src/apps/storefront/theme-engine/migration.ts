/**
 * Manifest migration layer — versioned migrations that evolve the manifest SHAPE over time.
 *
 * When the engine's manifest format changes, older themes keep working: the engine runs their
 * manifest through the migration chain (`schemaVersion` → CURRENT) BEFORE validation and
 * rendering, normalising it to the current internal format. Migrations are ordered, additive,
 * and never theme-specific.
 */
import type { ThemeManifest } from './types';

/** Bump when the manifest shape changes; add a migration to `MANIFEST_MIGRATIONS`. */
export const CURRENT_MANIFEST_SCHEMA_VERSION = 2;

type RawManifest = Record<string, unknown>;

export interface ManifestMigration {
  readonly from: number;
  readonly to: number;
  readonly description: string;
  readonly migrate: (manifest: RawManifest) => void;
}

/**
 * Ordered chain. Each migration upgrades a manifest by exactly one shape version.
 * v1 → v2: introduced `capabilities` (defaults to an empty list for pre-capability themes).
 */
export const MANIFEST_MIGRATIONS: ReadonlyArray<ManifestMigration> = [
  {
    from: 1,
    to: 2,
    description: 'introduce capabilities[] (default empty)',
    migrate: (m) => {
      if (!Array.isArray(m['capabilities'])) m['capabilities'] = [];
    },
  },
];

export interface ManifestMigrationResult {
  readonly manifest: ThemeManifest;
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly applied: ReadonlyArray<string>;
}

/**
 * Migrate a manifest (current or older shape) to the current internal format. Idempotent for
 * already-current manifests (stamps `schemaVersion`). Never throws.
 */
export function migrateManifest(input: ThemeManifest | RawManifest): ManifestMigrationResult {
  const raw: RawManifest = { ...(input as RawManifest) };
  const declared = typeof raw['schemaVersion'] === 'number' ? (raw['schemaVersion'] as number) : 1;

  let version = declared;
  const applied: string[] = [];
  const chain = [...MANIFEST_MIGRATIONS].sort((a, b) => a.from - b.from);

  for (const migration of chain) {
    if (migration.from === version && migration.to <= CURRENT_MANIFEST_SCHEMA_VERSION) {
      try {
        migration.migrate(raw);
        applied.push(`v${migration.from}→v${migration.to}: ${migration.description}`);
        version = migration.to;
      } catch (error) {
        console.error(`[theme-engine] manifest migration ${migration.from}→${migration.to} failed:`, error);
        break;
      }
    }
  }

  raw['schemaVersion'] = CURRENT_MANIFEST_SCHEMA_VERSION;
  return {
    manifest: raw as unknown as ThemeManifest,
    fromVersion: declared,
    toVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
    applied,
  };
}
