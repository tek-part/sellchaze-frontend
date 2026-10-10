import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductCardModel } from '../../types/catalog';
import { useCart } from '../../state/cart';
import { cardCartInput } from '../../utils/card-purchase';
import { cartAdditionLimit } from '../../state/cart-quantity';
import { resolveCardVariant } from '../../state/variant-selection';
import { useVariantSelectionAutomatic } from '../../state/store-context';
import './card-options.css';

export function useCardPurchase(product: ProductCardModel) {
  const [selection, setSelection] = useState<{ productId: string; variantId: string }>();
  const cart = useCart();
  const automatic = useVariantSelectionAutomatic(product.autoSelectVariants);
  const explicitId = selection?.productId === product.id ? selection.variantId : undefined;
  const variant = resolveCardVariant(product.variants ?? [], explicitId, automatic);
  const variantId = variant?.id;
  const input = cardCartInput(product, variantId);
  const quantity = input ? cart.lines.find((line) => line.id === input.id)?.quantity ?? 0 : 0;
  const canAdd = input !== null && cartAdditionLimit(cart.lines, input) > 0;
  return { variantId, variant, input, quantity, canAdd,
    price: variant?.price ?? product.price,
    compareAt: variant?.compareAtPrice ?? product.compareAtPrice,
    choose: (value: string) => setSelection({ productId: product.id, variantId: value }),
    add: () => { if (!canAdd || !input) return false; cart.add(input); return true; },
  };
}

export function CardVariantPicker({ product, value, onChange, atLimit = false }: { product: ProductCardModel; value?: string; onChange: (value: string) => void; atLimit?: boolean }): ReactElement | null {
  const { i18n } = useTranslation(); const ar = i18n.language.startsWith('ar');
  if (product.hasPersonalization) return <a className="sf-card-options" href={product.url}>{ar ? 'تخصيص المنتج' : 'Personalize product'}</a>;
  if (!product.variants?.length) return null;
  const choose = ar ? 'اختر الخيار' : 'Choose an option';
  return <label className="sf-card-options"><span>{choose}</span><select aria-label={`${choose}: ${product.title}`} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
    <option value="" disabled>{choose}</option>
    {product.variants.map((variant) => <option key={variant.id} value={variant.id} disabled={!variant.available}>
      {variant.label} · {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: product.currency }).format(variant.price ?? product.price)}{!variant.available ? (ar ? ' — نفد المخزون' : ' — Sold out') : ''}
    </option>)}
  </select>{atLimit ? <span role="status">{ar ? 'وصلت للكمية المتاحة في سلتك' : 'Available quantity is already in your cart'}</span> : null}</label>;
}
