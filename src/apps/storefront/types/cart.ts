/**
 * Cart view-models. The client cart is real and works offline (localStorage); Phase 6 syncs it with
 * the backend. A line is a product+variant with a quantity.
 */
export interface CartLine {
  /** Stable line id (productId+variantId). */
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  url: string;
  image?: string;
  /** Unit price in major units. */
  price: number;
  currency: string;
  quantity: number;
  maxQuantity?: number;
  /** Variant summary, e.g. "Size M · Black". */
  attributes?: string;
}

export interface CartTotals {
  count: number;
  subtotal: number;
  currency: string;
}
