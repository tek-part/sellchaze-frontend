import { createContext, useContext, useState, type ReactNode } from 'react';
import type { VariantSelection } from './variant-selection';
import type { PersonalizationChoice } from '../types/personalization';

function usePurchaseState() {
  const [selection, setSelection] = useState<{ productId: string; choice: VariantSelection; catalogVariantId: string | null }>();
  const [quantityChoice, setQuantityChoice] = useState<{ productId: string; value: number }>();
  const [customChoice, setCustomChoice] = useState<{ productId: string; choice: PersonalizationChoice }>();
  const [offerChoice, setOfferChoice] = useState<{ productId: string; id: string | null; version?: number }>();
  return { selection, setSelection, quantityChoice, setQuantityChoice, customChoice, setCustomChoice, offerChoice, setOfferChoice };
}
const PurchaseContext = createContext<ReturnType<typeof usePurchaseState> | null>(null);
export function ProductPurchaseProvider({ children }: { children: ReactNode }) {
  const state = usePurchaseState();
  return <PurchaseContext.Provider value={state}>{children}</PurchaseContext.Provider>;
}
export function useProductPurchase() {
  const shared = useContext(PurchaseContext);
  const local = usePurchaseState();
  return shared ?? local;
}
