/**
 * product-details — the PDP buy box (convert). Gallery + price + variant selection + quantity +
 * add-to-cart (optimistic via the cart store, single toast) + wishlist/share + description/shipping
 * tabs + reviews. Reads the product from context.data.product. Settings: show_sku, show_share,
 * gallery_layout. §08 product-details.
 */
import { useMemo, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { ProductGallery } from '../components/ProductGallery';
import { Price } from '../components/Price';
import { Rating } from '../components/Rating';
import { Select } from '../components/Select';
import { QuantityStepper } from '../components/QuantityStepper';
import { Button } from '../components/Button';
import { WishlistButton } from '../components/WishlistButton';
import { ShareButton } from '../components/ShareButton';
import { Tabs } from '../components/Tabs';
import { ReviewList, ReviewSummary } from '../components/Reviews';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { useToast } from '../components/toast/useToast';
import { productDetailOf, reviewsFor } from './section-data';
import { flag } from './section-settings';

export function ProductDetailsSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const product = productDetailOf(context);
  const cart = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const reviews = reviewsFor(context);

  const firstAvailable = product?.variants?.find((v) => v.available)?.id;
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const activeVariant = useMemo(
    () => product?.variants?.find((v) => v.id === variantId),
    [product?.variants, variantId],
  );

  if (!product) return null;

  const showSku = flag(settings, 'show_sku', false);
  const showShare = flag(settings, 'show_share', true);
  const outOfStock = product.inStock === false || (product.variants && product.variants.length > 0 && !firstAvailable);
  const unitPrice = activeVariant?.price ?? product.price;

  const addToCart = (): void => {
    cart.add({
      id: `${product.id}:${variantId ?? 'default'}`,
      productId: product.id,
      ...(variantId ? { variantId } : {}),
      title: product.title,
      url: product.url,
      ...(product.image ? { image: product.image.src } : {}),
      price: unitPrice,
      currency: product.currency,
      quantity: qty,
      ...(activeVariant ? { attributes: activeVariant.label } : {}),
    });
    toast.toast({ message: `${product.title} added to your bag`, variant: 'success' });
  };

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'shipping', label: 'Shipping & returns' },
  ];

  return (
    <section className="sf-section">
      <Container>
        <div className="sf-pdp">
          <ProductGallery images={product.images} title={product.title} />

          <div className="sf-pdp__buybox">
            {product.vendor ? <span className="sf-pdp__vendor">{product.vendor}</span> : null}
            <h1 className="sf-pdp__title">{product.title}</h1>

            <div className="sf-pdp__price">
              <Price amount={unitPrice} {...(product.compareAtPrice ? { compareAt: product.compareAtPrice } : {})} currency={product.currency} emphasis />
              {typeof product.rating === 'number' ? <Rating value={product.rating} {...(product.reviewCount ? { count: product.reviewCount } : {})} /> : null}
            </div>

            {showSku && product.sku ? <span className="sf-pdp__vendor">SKU {product.sku}</span> : null}

            {product.variants && product.variants.length > 0 ? (
              <Select
                label="Variant"
                value={variantId ?? ''}
                onChange={(e) => setVariantId(e.target.value)}
                options={product.variants.map((v) => ({ value: v.id, label: v.label, disabled: !v.available }))}
              />
            ) : null}

            <div className="sf-pdp__row">
              <QuantityStepper value={qty} onChange={setQty} label={`Quantity for ${product.title}`} />
              <Button className="sf-pdp__add" onClick={addToCart} disabled={outOfStock}>
                {outOfStock ? 'Sold out' : 'Add to bag'}
              </Button>
            </div>

            {product.lowStock && !outOfStock ? <span className="sf-pdp__stock sf-pdp__stock--low">Low stock — order soon</span> : null}

            <div className="sf-pdp__actions">
              <WishlistButton active={wishlist.has(product.id)} onToggle={() => wishlist.toggle(product.id)} labelledText="Save" />
              {showShare ? (
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : product.url}
                  title={product.title}
                  onResult={(r) => r === 'copied' && toast.toast({ message: 'Link copied' })}
                />
              ) : null}
            </div>

            <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} renderPanel={(id) =>
              id === 'description' ? (
                <div className="sf-prose" dangerouslySetInnerHTML={{ __html: product.descriptionHtml ?? '' }} />
              ) : (
                <p className="sf-pdp__desc">
                  Complimentary shipping on orders over $200. Returns accepted within 14 days on unworn pieces.
                </p>
              )
            } />
          </div>
        </div>

        {reviews.length > 0 ? (
          <div style={{ marginTop: 'var(--section-y)' }}>
            <ReviewSummary
              average={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length}
              total={reviews.length}
            />
            <ReviewList reviews={reviews} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
