/**
 * HomePage — renders the `home` template from, in priority order:
 *   1. the live customizer's draft sections (`?customize=1`, after the editor's `hydrate`),
 *   2. the merchant's PUBLISHED composition from `GET /storefront/layout?template=home` when its
 *      `source` is `store` (contract §4; a missing endpoint / 404 is tolerated),
 *   3. the active theme's own `home` template.
 * Page data (catalogue rows, merchandising, editable content) comes from `useHomeContext()`.
 */
import { useMemo, type ReactElement } from 'react';
import { ThemeRenderer, useTemplate, type PageDefinition, type SectionInstance } from '../theme-engine';
import { useStore } from '../state/store-context';
import { useAsync } from '../api/useAsync';
import { getLayout, type ApiLayoutSection } from '../api/storefront';
import { activeThemeMatches } from '../active-theme-match';
import { useLocale } from '../i18n/useLocale';
import { Seo } from '../seo/Seo';
import { organizationSchema, websiteSchema } from '../seo/schema';
import { previewOrDev } from '../preview';
import { useCustomizerSections, useCustomizerState } from '../customize/customizer-state';
import { useHomeContext } from './home-context';
import { PageLoading } from '../foundation/components/PageLoading';

/** API layout sections → engine section instances (settings stay raw; sections resolve them). */
export function toSectionInstances(sections: ReadonlyArray<ApiLayoutSection>): SectionInstance[] {
  return sections.map((s, i) => ({ id: s.id || `${s.type}:${i}`, type: s.type, settings: s.settings ?? {} }));
}

export function HomePage(): ReactElement | null {
  const { locale } = useLocale();
  const { store, apiOk } = useStore();
  const themeHome = useTemplate('home');
  const { context, loading: homeLoading } = useHomeContext();
  const customizer = useCustomizerState();
  const draft = useCustomizerSections('/');

  // A theme preview (`?preview=1` without a store) has no layout API — skip the request rather than
  // paying a failed round-trip on every render of the demo.
  // Also skip when previewing a theme other than the active one: the stored composition belongs
  // to the active theme and would be rendered with the wrong section set/defaults.
  const isolatedPreview = previewOrDev() && !apiOk;
  const skipLayout = isolatedPreview || !activeThemeMatches();
  const layout = useAsync(
    () => (skipLayout ? Promise.resolve(null) : getLayout('home').catch(() => null)),
    [locale, skipLayout],
  );

  const page = useMemo<PageDefinition | undefined>(() => {
    if (draft) return { template: 'home', sections: draft };
    // Hold the first paint until the layout answers, so a store with a published composition never
    // flashes the theme default before swapping.
    if (!skipLayout && layout.loading) return undefined;
    const api = layout.data?.data;
    if (api && api.source === 'store' && api.sections.length > 0) {
      return { template: 'home', sections: toSectionInstances(api.sections) };
    }
    return themeHome;
  }, [draft, skipLayout, layout.loading, layout.data, themeHome]);

  // A saved composition and its data can resolve in either order. Keep a real loading
  // area until both are ready, rather than collapsing main or painting default content first.
  const waiting = !isolatedPreview && (homeLoading || (!draft && !skipLayout && layout.loading));

  const site = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <Seo path="/" jsonLd={[organizationSchema(store.name, site), websiteSchema(store.name, site)]} />
      {waiting ? <PageLoading /> : page ? <ThemeRenderer page={page} context={context} selectedSectionId={customizer.active ? customizer.selectedId : null} /> : null}
    </>
  );
}
