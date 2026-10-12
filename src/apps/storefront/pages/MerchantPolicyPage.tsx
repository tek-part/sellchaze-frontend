import type { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ButtonLink, Container, EmptyState, Section } from '../foundation/components';
import { useStore } from '../state/store-context';
import { Seo } from '../seo/Seo';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml';

export function MerchantPolicyPage(): ReactElement {
  const { kind } = useParams(); const { store } = useStore(); const { t } = useTranslation();
  const policy = store.merchantInformation?.policies.find((row) => row.kind === kind);
  if (!policy) return <Section><Seo title={t('states.notFoundTitle')} path={`/policies/${kind || ''}`} noindex /><Container narrow><EmptyState variant="generic" title={t('states.notFoundTitle')} description={t('states.notFoundHint')} actions={<ButtonLink href="/">{t('states.backToShop')}</ButtonLink>} /></Container></Section>;
  return <Section><Seo title={policy.title} path={policy.url} /><Container narrow><article className="sf-policy"><header className="sf-page-head"><h1 className="sf-page-head__title">{policy.title}</h1></header><div className="sf-merchant-policy-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content_html, { formatting: true }) }} /></article></Container></Section>;
}
