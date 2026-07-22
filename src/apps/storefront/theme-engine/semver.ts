/**
 * Minimal semantic-version parsing + comparison (no dependency). Sufficient for engine ⇄ theme
 * compatibility checks (major.minor.patch, pre-release ignored for ordering).
 */
export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)/;

export function parseSemVer(input: string): SemVer | null {
  const match = SEMVER_RE.exec(input.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/** −1 if a < b, 0 if equal, 1 if a > b. */
export function compareSemVer(a: SemVer, b: SemVer): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

/** True when `version` satisfies `>= min` (both parseable). */
export function satisfiesMinimum(version: string, min: string): boolean {
  const v = parseSemVer(version);
  const m = parseSemVer(min);
  if (!v || !m) return false;
  return compareSemVer(v, m) >= 0;
}
