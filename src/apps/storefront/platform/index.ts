/**
 * Multi-Theme Platform — public surface. A cohesive layer over the FROZEN Theme Engine that adds the
 * marketplace, installer, switcher, live editor, preview, export/import, versioning, migration,
 * compatibility checker, validator, packaging, licensing, and update system. Every theme installs by
 * a catalog data change alone — no engine, page, or component edit — and stays fully isolated.
 */
export * from './catalog/types';
export { THEME_CATALOG, listCatalog, getCatalogEntry } from './catalog/catalog';
export * from './domain';
export { PlatformProvider, usePlatform, useInstallRecord, type PlatformContextValue } from './state/platform-context';
export { ThemeStudio } from './ui/ThemeStudio';
