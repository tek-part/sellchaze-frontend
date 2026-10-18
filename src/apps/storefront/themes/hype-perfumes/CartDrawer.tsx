import type { ReactElement } from 'react';
import { KidsCart } from '../nature-kids/CartDrawer';
import { CartIntroduction } from '../nature-pets/CartDrawer';
import { useLocale } from '../../i18n/useLocale';
import { HypeIcon } from './icons';
import { useThemeManifest } from '../../theme-engine/context';
export function HypeCart({ open, close }: { open: boolean; close: () => void }): ReactElement {
  const ar = useLocale().locale === 'ar';
  const themeId = useThemeManifest().id;
  const empty = <div className="hyp-empty-cart"><HypeIcon kind="cart" /><h3>{ar ? 'السلة فارغة' : 'Empty cart'}</h3><p>{ar ? 'لا توجد منتجات في سلتك بعد.' : 'You have no items in your cart.'}</p></div>;
  return <KidsCart open={open} close={close} title={ar ? 'السلة' : 'Cart'} className="hyp-cart" hideShipping introduction={<CartIntroduction open={open} themeId={themeId} />} emptyContent={empty} />;
}
