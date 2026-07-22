/**
 * Theme ⇄ engine compatibility. A theme declares `minEngineVersion`; the engine refuses to
 * load a theme it is too old to satisfy. Keeps themes and the engine independently versioned.
 */
import { parseSemVer, satisfiesMinimum } from './semver';
import type { ThemeManifest } from './types';

/** The engine's own version. Bump on breaking changes to the theme contract. */
export const ENGINE_VERSION = '1.0.0';

export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly reason?: string;
}

export function checkThemeCompatibility(
  manifest: ThemeManifest,
  engineVersion: string = ENGINE_VERSION,
): CompatibilityResult {
  if (!parseSemVer(manifest.version)) {
    return { compatible: false, reason: `theme version "${manifest.version}" is not valid semver` };
  }
  if (!parseSemVer(manifest.minEngineVersion)) {
    return {
      compatible: false,
      reason: `minEngineVersion "${manifest.minEngineVersion}" is not valid semver`,
    };
  }
  if (!satisfiesMinimum(engineVersion, manifest.minEngineVersion)) {
    return {
      compatible: false,
      reason: `theme "${manifest.id}" needs engine ≥ ${manifest.minEngineVersion}, but engine is ${engineVersion}`,
    };
  }
  return { compatible: true };
}
