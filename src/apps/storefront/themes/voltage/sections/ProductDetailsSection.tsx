/**
 * Voltage product-details — the spec-led buy box. Gallery + vendor + title + tabular price + rating +
 * variant select + quantity + add-to-cart (shared cart store) + wishlist + tabs (Overview / Specs).
 * Reads context.data.product (shared ProductDetailModel). Voltage's own component — no Theme 01 reuse.
 */
import { useMemo, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { ProductGallery } from '../components/ProductGallery';
import { Price } from '../components/Price';
import { Rating } from '../components/Rating';
import { Select } from '../components/Select';
import { QuantityStepper } from '../components/QuantityStepper';
import { Button } from '../components/Button';
import { WishlistButton } from '../components/WishlistButton';
import { Tabs } from '../components/Tabs';
import { Reviews } from '../components/Reviews';
import { ShareButtons } from '../components/ShareButtons';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { productDetailOf, reviewsFor } from './section-data';
import { flag } from './section-settings';

export function ProductDetailsSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const product = productDetailOf(context);
  const reviews = reviewsFor(context);
  const cart = useCart();
  const wishlist = useWishlist();

  const firstAvailable = product?.variants?.find((v) => v.available)?.id;
  const [variantId, setVariantId] = useState<string | undefined>(firstAvailable);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('overview');

  const activeVariant = useMemo(() => product?.variants?.find((v) => v.id === variantId), [product?.variants, variantId]);
  if (!product) return null;

  const showSku = flag(settings, 'show_sku', true);
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
  };

  const hasShipping = Boolean(product.shippingReturns || product.careInstructions);
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specs' },
    ...(hasShipping ? [{ id: 'shipping', label: 'Shipping & returns' }] : []),
    ...(reviews.length > 0 ? [{ id: 'reviews', label: `Reviews (${reviews.length})` }] : []),
  ];

  return (
    <Section>
      <Container>
        <div className="vlt-pdp">
          <ProductGallery images={product.images} title={product.title} />
          <div className="vlt-pdp__buybox">
            {product.vendor ? <span className="vlt-pdp__vendor">{product.vendor}</span> : null}
            <h1 className="vlt-pdp__title">{product.title}</h1>
            <div className="vlt-pdp__price">
              <Price amount={unitPrice} {...(product.compareAtPrice ? { compareAt: product.compareAtPrice } : {})} currency={product.currency} />
              {typeof product.rating === 'number' ? <Rating value={product.rating} {...(product.reviewCount ? { count: product.reviewCount } : {})} /> : null}
            </div>
            {showSku && product.sku ? <span className="vlt-pdp__vendor">SKU {product.sku}</span> : null}

            {product.variants && product.variants.length > 0 ? (
              <Select
                label="Configuration"
                value={variantId ?? ''}
                onChange={(e) => setVariantId(e.target.value)}
                options={product.variants.map((v) => ({ value: v.id, label: v.label, disabled: !v.available }))}
              />
            ) : null}

            <div className="vlt-pdp__row">
              <QuantityStepper value={qty} onChange={setQty} label={`Quantity for ${product.title}`} />
              <Button className="vlt-pdp__add" onClick={addToCart} disabled={outOfStock}>
                {outOfStock ? 'Sold out' : 'Add to cart'}
              </Button>
              <div className="vlt-pdp__actions">
                <WishlistButton active={wishlist.has(product.id)} onToggle={() => wishlist.toggle(product.id)} />
              </div>
            </div>

            <span className={outOfStock ? 'vlt-pdp__stock vlt-pdp__stock--out' : 'vlt-pdp__stock'} style={{ color: outOfStock ? undefined : 'var(--success)' }}>
              {outOfStock ? '// Out of stock' : '// In stock — ships in 24h'}
            </span>

            {showShare ? <ShareButtons title={product.title} url={product.url} /> : null}

            <Tabs tabs={tabs} value={tab} onChange={setTab} renderPanel={(id) =>
              id === 'overview' ? (
                <div>
                  <div className="vlt-pdp__desc" dangerouslySetInnerHTML={{ __html: product.descriptionHtml ?? '<p>No description available.</p>' }} />
                  {product.highlights && product.highlights.length > 0 ? (
                    <ul className="vlt-pdp__highlights">
                      {product.highlights.map((h, i) => (<li key={i}>{h}</li>))}
                    </ul>
                  ) : null}
                </div>
              ) : id === 'reviews' ? (
                <Reviews reviews={reviews} />
              ) : id === 'shipping' ? (
                <div className="vlt-pdp__desc">
                  {product.shippingReturns ? <p style={{ whiteSpace: 'pre-line' }}>{product.shippingReturns}</p> : null}
                  {product.careInstructions ? (
                    <>
                      <h4 className="vlt-pdp__spec-k" style={{ marginTop: '1rem' }}>Care</h4>
                      <p style={{ whiteSpace: 'pre-line' }}>{product.careInstructions}</p>
                    </>
                  ) : null}
                </div>
              ) : (
                <dl className="vlt-pdp__specs">
                  {product.sku ? (<><dt className="vlt-pdp__spec-k">SKU</dt><dd className="vlt-pdp__spec-v">{product.sku}</dd></>) : null}
                  {product.vendor ? (<><dt className="vlt-pdp__spec-k">Brand</dt><dd className="vlt-pdp__spec-v">{product.vendor}</dd></>) : null}
                  {(product.specs ?? []).map((s, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <dt className="vlt-pdp__spec-k">{s.label}</dt><dd className="vlt-pdp__spec-v">{s.value}</dd>
                    </div>
                  ))}
                  <dt className="vlt-pdp__spec-k">Price</dt><dd className="vlt-pdp__spec-v">{unitPrice.toFixed(2)} {product.currency}</dd>
                  <dt className="vlt-pdp__spec-k">Availability</dt><dd className="vlt-pdp__spec-v">{outOfStock ? 'Out of stock' : 'In stock'}</dd>
                  {activeVariant ? (<><dt className="vlt-pdp__spec-k">Config</dt><dd className="vlt-pdp__spec-v">{activeVariant.label}</dd></>) : null}
                </dl>
              )
            } />
          </div>
        </div>
      </Container>
    </Section>
  );
}
