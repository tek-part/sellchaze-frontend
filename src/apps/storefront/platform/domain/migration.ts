/**
 * Theme migration — SETTINGS-level migrations that evolve a theme's saved merchant settings across
 * theme versions (distinct from the engine's manifest-SHAPE migration, which is re-exported here for
 * completeness). When a theme ships a new version that renames/repurposes a setting, a registered
 * migration upgrades an install record's settings so an update never loses or breaks configuration.
 *
 * The default registry is empty (1.0.0 themes need none); the mechanism is the deliverable and is
 * exercised by unit tests with synthetic migrations. Pure + fail-safe.
 */
import { compareSemVer, parseSemVer, type ThemeSettingValue } from '../../theme-engine';

export { migrateManifest, CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine';

export type SettingsBag = Readonly<Record<string, ThemeSettingValue>>;

export interface SettingsMigration {
  readonly themeId: string;
  /** Applies when upgrading FROM a version `> from` up TO `<= to`. */
  readonly from: string;
  readonly to: string;
  readonly description: string;
  readonly migrate: (settings: Record<string, ThemeSettingValue>) => void;
}

/** Registered per-theme settings migrations (empty by default). */
export const SETTINGS_MIGRATIONS: ReadonlyArray<SettingsMigration> = [];

export interface SettingsMigrationResult {
  readonly settings: SettingsBag;
  readonly applied: ReadonlyArray<string>;
}

/**
 * Migrate `settings` for `themeId` from `fromVersion` up to `toVersion`, applying every registered
 * migration whose window `(from, to]` the upgrade crosses, in ascending `to` order. Never throws:
 * a failing migration is skipped and logged. A downgrade / equal version is a no-op.
 */
export function migrateThemeSettings(
  themeId: string,
  fromVersion: string,
  toVersion: string,
  settings: SettingsBag,
  migrations: ReadonlyArray<SettingsMigration> = SETTINGS_MIGRATIONS,
): SettingsMigrationResult {
  const from = parseSemVer(fromVersion);
  const to = parseSemVer(toVersion);
  if (!from || !to || compareSemVer(from, to) >= 0) {
    return { settings, applied: [] };
  }
  const relevant = migrations
    .filter((mig) => mig.themeId === themeId)
    .map((mig) => ({ mig, mFrom: parseSemVer(mig.from), mTo: parseSemVer(mig.to) }))
    .filter((x): x is { mig: SettingsMigration; mFrom: NonNullable<ReturnType<typeof parseSemVer>>; mTo: NonNullable<ReturnType<typeof parseSemVer>> } => x.mFrom !== null && x.mTo !== null)
    // window applies when: from < mig.to <= to
    .filter((x) => compareSemVer(from, x.mTo) < 0 && compareSemVer(x.mTo, to) <= 0)
    .sort((a, b) => compareSemVer(a.mTo, b.mTo));

  const draft: Record<string, ThemeSettingValue> = { ...settings };
  const applied: string[] = [];
  for (const { mig } of relevant) {
    try {
      mig.migrate(draft);
      applied.push(`${mig.from}→${mig.to}: ${mig.description}`);
    } catch (error) {
      console.error(`[platform] settings migration ${mig.themeId} ${mig.from}→${mig.to} failed:`, error);
    }
  }
  return { settings: draft, applied };
}
