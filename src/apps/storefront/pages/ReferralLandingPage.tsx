import type { ReactElement } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiError } from '../api/client';
import { useAsync } from '../api/useAsync';
import { Button, Container, ErrorState, Section, Spinner } from '../foundation/components';
import { cleanReferralCode } from '../../../shared/marketing/referral';

export function ReferralLandingPage(): ReactElement {
  const { product = '', code = '' } = useParams(); const location = useLocation(); const { t } = useTranslation();
  const lookup = useAsync(async () => {
    if (!/^[1-9]\d*$/.test(product) || !cleanReferralCode(code)) throw new ApiError(404, 'Product not found');
    const response = await apiFetch<{ data: { id: number; slug: string } }>(`/referral-products/${product}`);
    if (response.data.id !== Number(product) || !/^[a-z0-9-]+$/.test(response.data.slug)) throw new ApiError(404, 'Product not found');
    return response.data;
  }, [product, code]);
  if (lookup.data && !lookup.loading && !lookup.error) {
    const params = new URLSearchParams(location.search); params.set('ref', code);
    return <Navigate replace to={`/products/${lookup.data.slug}?${params}${location.hash}`} />;
  }
  return <Section><Container>{lookup.loading ? <Spinner label={t('common.loading')} /> : <ErrorState title={t('pdp.unavailableTitle')} description={t('pdp.unavailableBody')} actions={<Button onClick={lookup.reload}>{t('pdp.tryAgain')}</Button>} />}</Container></Section>;
}
