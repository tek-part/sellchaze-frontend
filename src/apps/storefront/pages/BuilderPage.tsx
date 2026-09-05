/**
 * BuilderPage — /pages/:slug. Renders a PUBLISHED custom page (`GET /storefront/pages/{slug}`,
 * contract §4) through the ThemeRenderer with the same store data bundle the home page uses, so
 * every library section works on landing pages too. In the live customizer, the editor's draft
 * sections for `/pages/<slug>` win. When the endpoint 404s (or is absent), the route falls back to
 * the existing PolicyPage so every footer link keeps working.
 */
import { useMemo, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { ThemeRenderer, type PageDefinition } from '../theme-engine';
import { useAsync } from '../api/useAsync';
import { getPage } from '../api/storefront';
import { useLocale } from '../i18n/useLocale';
import { pickLocalized } from '../i18n/localized';
import { useStore } from '../state/store-context';
import { Seo } from '../seo/Seo';
import { useCustomizerSections, useCustomizerState } from '../customize/customizer-state';
import { useHomeContext } from './home-context';
import { PolicyPage } from './StaticPages';
import { toSectionInstances } from './HomePage';

export function BuilderPage(): ReactElement | null {
  const { slug = '' } = useParams();
  const { locale } = useLocale();
  const { store } = useStore();
  const customizer = useCustomizerState();
  const draft = useCustomizerSections(`/pages/${slug}`);
  const pageQ = useAsync(() => getPage(slug).catch(() => null), [slug, locale]);
  const { context } = useHomeContext();

  const api = pageQ.data?.data ?? null;
  const page = useMemo<PageDefinition | null>(() => {
    if (draft) return { template: 'page', sections: draft };
    if (api && api.sections.length > 0) return { template: api.template || 'page', sections: toSectionInstances(api.sections) };
    return null;
  }, [draft, api]);

  // Still resolving (and no draft to show yet): keep the chrome, render nothing below it.
  if (!page && pageQ.loading && !draft) return null;

  // No published builder page → the policy/static page for this slug (or its not-found state).
  if (!page) return <PolicyPage />;

  const title = api ? pickLocalized(api.title, locale, store.defaultLocale) : '';
  const seo = api?.seo ?? null;
  return (
    <>
      <Seo
        path={`/pages/${slug}`}
        {...(seo?.title || title ? { title: seo?.title || title } : {})}
        {...(seo?.description ? { description: seo.description } : {})}
        {...(seo?.image ? { image: seo.image } : {})}
      />
      <ThemeRenderer page={page} context={context} selectedSectionId={customizer.active ? customizer.selectedId : null} />
    </>
  );
}
