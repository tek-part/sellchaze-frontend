import { lazy, Suspense, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '../foundation/components/Spinner';
import { NotFoundPage } from '../pages/NotFoundPage';

const Glasses = lazy(() => import('./GlassesFunnel').then(m => ({ default: m.GlassesTemplatePreview })));
const Hair = lazy(() => import('./HairReviveFunnel').then(m => ({ default: m.HairTemplatePreview })));

export default function NativeTemplatePreview(): ReactElement {
  const { key } = useParams();
  return <Suspense fallback={<Spinner />}>{key === 'hair-revive-ar' || key === 'hair-revive-en' ? <Hair /> : key === 'glasses-ar' || key === 'glasses-en' ? <Glasses /> : <NotFoundPage />}</Suspense>;
}
