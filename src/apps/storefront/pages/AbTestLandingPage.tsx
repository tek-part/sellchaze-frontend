import { useEffect, useState, type ReactElement } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiError } from '../api/client';
import { useStore } from '../state/store-context';
import { Button, Container, ErrorState, Section, Spinner } from '../foundation/components';
import { abVisitor, saveAbAssignment } from './ab-assignment';

export function AbTestLandingPage(): ReactElement {
  const { slug = '' } = useParams(); const { store } = useStore();
  return <ResolveTest key={`${store.id}:${slug}`} slug={slug} storeId={store.id} />;
}
function ResolveTest({ slug, storeId }: { slug: string; storeId: number | string }): ReactElement {
  const navigate = useNavigate(); const location = useLocation(); const { t } = useTranslation();
  const [error, setError] = useState(false); const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setError(false);
    void (async () => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ApiError(404, 'Test unavailable');
      const { data } = await apiFetch<{ data: { slug: string; product_id: number; token: string; expires_at: string } }>(`/ab-tests/${slug}/resolve`, { method: 'POST', body: JSON.stringify({ visitor: abVisitor(storeId) }) });
      if (!/^[a-z0-9-]+$/.test(data.slug) || !/^[a-f0-9]{64}$/.test(data.token)) throw new ApiError(404, 'Test unavailable');
      if (!active) return;
      saveAbAssignment(storeId, data);
      // Capabilities never enter URLs, analytics query strings or referrer headers.
      navigate(`/products/${data.slug}${location.search}${location.hash}`, { replace: true });
    })().catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [slug, storeId, navigate, location.search, location.hash, retry]);
  return <Section><Container>{!error ? <Spinner label={t('common.loading')} /> : <ErrorState headingLevel={1} title={t('pdp.unavailableTitle')} description={t('pdp.unavailableBody')} actions={<Button onClick={() => setRetry((n) => n + 1)}>{t('pdp.tryAgain')}</Button>} />}</Container></Section>;
}
