/**
 * BuilderPage — /pages/:slug and /funnels/:slug. Renders a PUBLISHED custom page,
 * contract §4) through the ThemeRenderer with the same store data bundle the home page uses, so
 * every library section works on landing pages too. In the live customizer, the editor's draft
 * sections for the current path win. Ordinary pages retain the policy fallback; funnels require
 * a published funnel and distinguish missing pages from recoverable request errors.
 */
import { useMemo, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { ThemeRenderer, type PageDefinition } from '../theme-engine';
import { useAsync } from '../api/useAsync';
import { getFunnel, getPage } from '../api/storefront';
import { ApiError } from '../api/client';
import { Button, Container, ErrorState, Section, Spinner } from '../foundation/components';
import { useLocale } from '../i18n/useLocale';
import { pickLocalized } from '../i18n/localized';
import { useStore } from '../state/store-context';
import { Seo } from '../seo/Seo';
import { useCustomizerSections, useCustomizerState } from '../customize/customizer-state';
import { useHomeContext } from './home-context';
import { PolicyPage } from './StaticPages';
import { NotFoundPage } from './NotFoundPage';
import { toSectionInstances } from './HomePage';

export function BuilderPage({ funnel = false }: { funnel?: boolean }): ReactElement | null {
  const { slug = '' } = useParams();
  const { locale } = useLocale();
  const { store } = useStore();
  const customizer = useCustomizerState();
  const path = `${funnel ? '/funnels' : '/pages'}/${slug}`;
  const draft = useCustomizerSections(path);
  const pageQ = useAsync(() => funnel ? getFunnel(slug) : getPage(slug).catch(() => null), [slug, locale, funnel]);
  const { context } = useHomeContext();

  const api = pageQ.data?.data.slug === slug ? pageQ.data.data : null;
  const page = useMemo<PageDefinition | null>(() => {
    if (draft) return { template: 'page', sections: draft };
    if (api && api.sections.length > 0) return { template: api.template || 'page', sections: toSectionInstances(api.sections) };
    return null;
  }, [draft, api]);

  if (!draft && pageQ.loading) return <Section><Container><Spinner label={locale === 'ar' ? 'جارٍ التحميل…' : 'Loading…'} /></Container></Section>;

  if (funnel && !draft && pageQ.error && !(pageQ.error instanceof ApiError && pageQ.error.status === 404)) {
    return <Section><Container><ErrorState
      title={locale === 'ar' ? 'تعذّر تحميل مسار البيع' : 'Unable to load this funnel'}
      description={locale === 'ar' ? 'حاول مرة أخرى بعد قليل.' : 'Please try again in a moment.'}
      actions={<Button onClick={pageQ.reload}>{locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}</Button>}
    /></Container></Section>;
  }

  // No published builder page → the policy/static page for this slug (or its not-found state).
  if (!page) return funnel ? <NotFoundPage /> : <PolicyPage />;

  const title = api ? pickLocalized(api.title, locale, store.defaultLocale) : '';
  const seo = api?.seo ?? null;
  return (
    <>
      <Seo
        path={api?.public_path || path}
        {...(seo?.title || title ? { title: seo?.title || title } : {})}
        {...(seo?.description ? { description: seo.description } : {})}
        {...(seo?.image ? { image: seo.image } : {})}
      />
      <ThemeRenderer page={page} context={context} selectedSectionId={customizer.active ? customizer.selectedId : null} />
    </>
  );
}
