# Live behavior preserved before source release

The deployed storefront includes country currency selection, store-specific manual currency preferences, enabled payment-method labels and imported review photos. Preserve these while releasing the newer source editor and product-page presets.

Automatic selection uses only supported currencies, is not persisted as an explicit preference, and falls back to the base currency. Manual choices use `sf:currency:manual:<store id>` and continue to work for the current visit when browser storage is unavailable. The legacy global preference does not override a different store.

The merchant localization form retains the automatic-currency setting. Footer payment labels derive from enabled methods returned by the backend. Review mapping accepts existing photo objects and legacy URL strings; it does not add a verified-purchase claim.

The server's old editable checkout (`16ae724`) is clean and predates the current rebuilt application. Its older themes and editor do not replace newer main code. Private production bundles and code backups remain outside Git.

Validation: 806 unit/component tests in 138 files, lint and TypeScript. CI also checks build budgets, accessibility, performance and PWA behavior; visual snapshots remain a separate non-blocking check in the existing workflow.
