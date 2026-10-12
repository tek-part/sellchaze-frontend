import type { ThemeModule } from '../../theme-engine/types';
import { defaultSettings } from '../../theme-engine/settings';
import { createSectionMap, SECTION_LIBRARY } from '../../sections-lib';
import { sphinxManifest } from './manifest';
import { sphinxSettingsSchema } from './settings';
import { sphinxTokens } from './tokens';
import { sphinxTemplates } from './templates';
import { SphinxLayout } from './DefaultLayout';
import { SphinxCategories, SphinxShelf, SphinxFeaturedProducts, sphinxCategoriesSchema, sphinxShelfSchema } from './sections';
import './theme.css';

const baseline = defaultSettings(sphinxSettingsSchema);
export const sphinxTheme: ThemeModule = {
  manifest: sphinxManifest, defaultSettings: baseline, tokens: sphinxTokens(baseline), createTokens: sphinxTokens,
  sections: { ...createSectionMap(), 'sphinx-categories': SphinxCategories, 'sphinx-shelf': SphinxShelf, 'featured-products': SphinxFeaturedProducts },
  sectionSchemas: [...SECTION_LIBRARY, sphinxCategoriesSchema, sphinxShelfSchema],
  layouts: { default: SphinxLayout }, templates: sphinxTemplates,
};
export default sphinxTheme;
