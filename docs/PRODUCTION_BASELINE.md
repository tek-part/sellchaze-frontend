# Production baseline — 2026-10-09

The production site is ahead of this repository's React/TypeScript source. This change preserves the exact deployed frontend and its API storefront shell. It does **not** claim that the older source tree reproduces the site.

- GitHub source base: `24b787543588dc68e4205044350e7e8e5716706d` (September 10).
- Source checkout found on the server: `16ae7244ac0eb6e3b879f1640eb42765c6e332cd` (September 6).
- Live dashboard entry: `main-DdjYz5KM-resilient-20261003.js`.
- `production/baseline.json` records the capture time and all 5,756 file hashes.
- `production/site-2026-10-09.zip` contains the deployed files, including historical hashed chunks retained for already-open tabs.
- `production/storefront-shell.html` is the corresponding shell served by Laravel.
- No production credentials, backend customer uploads, or database contents are included.

## Verify and restore locally

With Python 3.9 or newer, from the repository root:

```sh
python scripts/production_baseline.py --verify-only
python scripts/production_baseline.py
```

The second command restores to a new, ignored `production-site` directory. It refuses to overwrite an existing directory. Supply `--output another-new-directory` for another copy. Verification checks the archive, each member's size and SHA-256, exact file inventory, and safe paths before extraction.

`npm run build` builds the source checkout; it must not be treated as a reproduction of this production baseline. CI builds and tests that editable source, and verifies and restores the production archive separately. The restored site is uploaded as `production-baseline-<commit>`. It remains the default deployment artifact; a rebuilt application release requires the explicit source selection described below. Older workflow runs without the selected exact artifact fail closed. All existing quality and security gates remain required.

The captured `storefront.html` is byte-identical to `production/storefront-shell.html`, so the deployment's existing copy into Laravel storage preserves the captured shell. This deployment mode deliberately keeps the captured production release stable; future source edits do not become live until the source is reconciled and the artifact selection is explicitly changed.

## Remaining source reconciliation

Find the source or original patch scripts for the September 23–24 and October 3 releases, port those changes to `src`, and test the resulting build against this captured version. Do not mark `sourceParity` as verified based only on a successful Vite build or passing tests on the old source. The archive is a recovery artifact, not a substitute for editable source.

## Explicit rebuilt application release — 2026-10-11

The owner has requested publication of the full rebuilt application. Quality now
uploads an additional `source-release-<sha>` artifact. Manual deployment defaults
to the historical capture; an operator must explicitly select `source-release`
and an exact SHA with a successful main Quality run to publish the rebuild.
The audit gate and all existing functional gates remain in force. This opt-in
publishes the new application; it does not assert that it reproduces every
historical production patch. The captured baseline remains immutable and usable
for recovery. Back up the current web root and API shell before first activation.
