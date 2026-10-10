/**
 * Cart view-models. Store/currency-scoped client storage works offline; current catalog refresh
 * supplies price/availability observations. A line is a product+variant+personalization.
 */
export interface CartLine {
  /** Stable line id including normalized personalization, when present. */
  id: string;
  productId: string;
  digitalType?: 'physical' | 'link' | 'codes';
  variantId?: string;
  title: string;
  url: string;
  image?: string;
  /** Unit price in major units. */
  price: number;
  currency: string;
  quantity: number;
  maxQuantity?: number;
  /** Available code units shared by every variant/personalization of this product. */
  sharedMaxQuantity?: number;
  /** Merchant cap shared by all units of this product, independently of stock. */
  orderMaxQuantity?: number;
  /** Variant summary, e.g. "Size M · Black". */
  attributes?: string;
  personalization?: import('./personalization').PersonalizationValues;
  personalizationEntries?: ReadonlyArray<import('./personalization').PersonalizationEntry>;
}

export interface CartTotals {
  count: number;
  subtotal: number;
  currency: string;
}
