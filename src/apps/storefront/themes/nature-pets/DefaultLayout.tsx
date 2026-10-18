import type { ReactElement } from 'react';
import type { LayoutRenderProps } from '../../theme-engine/rendering';
import { NaturePetsCart } from './CartDrawer';
import { KidsLayout } from '../nature-kids/DefaultLayout';
/** The observed Nature family shares its chrome, cart and purchase presentation. */
export function NaturePetsLayout(props: LayoutRenderProps): ReactElement {
  return <div className="npt-theme"><KidsLayout {...props} footerCollapsible CartComponent={NaturePetsCart} /></div>;
}
