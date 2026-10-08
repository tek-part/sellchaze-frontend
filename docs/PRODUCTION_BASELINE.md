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

`npm run build` continues to build the source checkout; it must not be treated as a reproduction of this production baseline. CI still builds and tests that editable source, but verifies and restores the production archive separately. Only the restored site is uploaded as `production-baseline-<commit>`, and deployment accepts only that artifact name. Older workflow runs cannot silently supply an older source build. All existing quality and security gates remain required by the automatic deployment workflow.

The captured `storefront.html` is byte-identical to `production/storefront-shell.html`, so the deployment's existing copy into Laravel storage preserves the captured shell. This deployment mode deliberately keeps the captured production release stable; future source edits do not become live until the source is reconciled and the artifact selection is explicitly changed.

## Remaining source reconciliation

Find the source or original patch scripts for the September 23–24 and October 3 releases, port those changes to `src`, and test the resulting build against this captured version. Do not mark `sourceParity` as verified based only on a successful Vite build or passing tests on the old source. The archive is a recovery artifact, not a substitute for editable source.
