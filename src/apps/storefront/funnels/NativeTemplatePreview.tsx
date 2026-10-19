import { lazy, Suspense, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '../foundation/components/Spinner';
import { NotFoundPage } from '../pages/NotFoundPage';
import { loadNativeCatalogPreview } from './native-catalog';

const Glasses = lazy(() => loadNativeCatalogPreview('glasses-en'));
const Hair = lazy(() => loadNativeCatalogPreview('hair-revive-en'));
const Electric = lazy(() => loadNativeCatalogPreview('electric-biker-en'));
const Litter = lazy(() => loadNativeCatalogPreview('litter-robot-en'));
const HairCare = lazy(() => loadNativeCatalogPreview('hair-care-en'));
const SkinCare = lazy(() => loadNativeCatalogPreview('skin-care-en'));

export default function NativeTemplatePreview(): ReactElement {
  const { key } = useParams();
  return <Suspense fallback={<Spinner />}>{key === 'skin-care-ar' || key === 'skin-care-en' ? <SkinCare /> : key === 'hair-care-ar' || key === 'hair-care-en' ? <HairCare /> : key === 'electric-biker-ar' || key === 'electric-biker-en' ? <Electric /> : key === 'litter-robot-ar' || key === 'litter-robot-en' ? <Litter /> : key === 'hair-revive-ar' || key === 'hair-revive-en' ? <Hair /> : key === 'glasses-ar' || key === 'glasses-en' ? <Glasses /> : <NotFoundPage />}</Suspense>;
}
