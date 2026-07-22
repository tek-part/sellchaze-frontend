/**
 * Rouge product-details — the beauty PDP buy box (convert). Breadcrumb + gallery + didone title +
 * price + rating + shade picker (ShadeDots, the signature control) and/or variant pills + quantity +
 * add-to-bag (optimistic via the cart store, single toast) + wishlist/share + tabbed details + a
 * review summary/list. Reads the product from context.data.product. Settings: show_sku, show_share.
 */
import { useMemo, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGallery } from '../components/ProductGallery';
import { Price } from '../components/Price';
import { Rating } from '../components/Rating';
import { ShadeDots } from '../components/ShadeDots';
import { VariantPicker } from '../components/VariantPicker';
import { QuantityStepper } from '../components/QuantityStepper';
import { Button } from '../components/Button';
import { WishlistButton } from '../components/WishlistButton';
import { ShareButton } from '../components/ShareButton';
import { Tabs } from '../components/Tabs';
import { Eyebrow } from '../components/Typography';
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

  const shades = useMemo(() => product?.colors ?? [], [product?.colors]);
  const firstVariant = product?.variants?.find((v) => v.available)?.id;
  const [shade, setShade] = useState<string | undefined>(shades[0]?.value);
  const [variantId, setVariantId] = useState<string | undefined>(firstVariant);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const activeVariant = useMemo(
    () => product?.variants?.find((v) => v.id === variantId),
    [product?.variants, variantId],
  );
  const activeShade = useMemo(() => shades.find((s) => s.value === shade), [shades, shade]);

  if (!product) return null;

  const showSku = flag(settings, 'show_sku', false);
  const showShare = flag(settings, 'show_share', true);
  const outOfStock = product.inStock === false || (product.variants && product.variants.length > 0 && !firstVariant);
  const unitPrice = activeVariant?.price ?? product.price;
  const attributes = [activeShade?.label, activeVariant?.label].filter(Boolean).join(' · ') || undefined;

  const addToCart = (): void => {
    cart.add({
      id: `${product.id}:${shade ?? variantId ?? 'default'}`,
      productId: product.id,
      ...(variantId ? { variantId } : {}),
      title: product.title,
      url: product.url,
      ...(product.image ? { image: product.image.src } : {}),
      price: unitPrice,
      currency: product.currency,
      quantity: qty,
      ...(attributes ? { attributes } : {}),
    });
    toast.toast({ message: `${product.title} added to your bag`, variant: 'success' });
  };

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'how-to', label: 'How to use' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'shipping', label: 'Shipping & returns' },
  ];

  return (
    <section className="rge-section">
      <Container>
        <Breadcrumb
          className="rge-pdp__crumb"
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/collections/all' },
            { label: product.title },
          ]}
        />

        <div className="rge-pdp">
          <ProductGallery images={product.images} title={product.title} />

          <div className="rge-pdp__buybox">
            {product.vendor ? <Eyebrow>{product.vendor}</Eyebrow> : null}
            <h1 className="rge-pdp__title">{product.title}</h1>

            <div className="rge-pdp__price">
              <Price amount={unitPrice} {...(product.compareAtPrice ? { compareAt: product.compareAtPrice } : {})} currency={product.currency} />
              {typeof product.rating === 'number' ? (
                <Rating value={product.rating} {...(product.reviewCount ? { count: product.reviewCount } : {})} />
              ) : null}
            </div>

            {showSku && product.sku ? <span className="rge-pdp__sku">SKU {product.sku}</span> : null}

            {shades.length > 0 ? (
              <div className="rge-pdp__shades">
                <span className="rge-pdp__shade-label">
                  Shade{activeShade ? <span className="rge-pdp__shade-name"> — {activeShade.label}</span> : null}
                </span>
                <ShadeDots shades={shades} selected={shade} onSelect={setShade} large />
              </div>
            ) : null}

            {product.variants && product.variants.length > 0 ? (
              <VariantPicker label="Size" variants={product.variants} {...(variantId ? { value: variantId } : {})} onChange={setVariantId} />
            ) : null}

            <div className="rge-pdp__row">
              <QuantityStepper value={qty} onChange={setQty} label={`Quantity for ${product.title}`} />
              <Button className="rge-pdp__add" size="lg" onClick={addToCart} disabled={outOfStock}>
                {outOfStock ? 'Sold out' : 'Add to bag'}
              </Button>
            </div>

            {product.lowStock && !outOfStock ? <span className="rge-pdp__stock rge-pdp__stock--low">Low stock — order soon</span> : null}

            <div className="rge-pdp__actions">
              <WishlistButton active={wishlist.has(product.id)} onToggle={() => wishlist.toggle(product.id)} />
              {showShare ? (
                <ShareButton
                  url={typeof window !== 'undefined' ? window.location.href : product.url}
                  title={product.title}
                  onResult={(r) => { if (r === 'copied') toast.toast({ message: 'Link copied to clipboard' }); }}
                />
              ) : null}
            </div>

            <Tabs
              className="rge-pdp__tabs"
              tabs={tabs}
              value={activeTab}
              onChange={setActiveTab}
              renderPanel={(id) =>
                id === 'description' ? (
                  <div className="rge-prose" dangerouslySetInnerHTML={{ __html: product.descriptionHtml ?? '<p>A weightless, skin-loving formula in a spectrum of wearable shades.</p>' }} />
                ) : id === 'how-to' ? (
                  <p className="rge-pdp__desc">Sweep across bare or primed skin and build to your desired finish. Layer for depth; blend with a brush or fingertips for a second-skin veil.</p>
                ) : id === 'ingredients' ? (
                  <p className="rge-pdp__desc">Clean, vegan, and dermatologist-tested — formulated without 1,800+ questionable ingredients. Full INCI list on pack.</p>
                ) : (
                  <p className="rge-pdp__desc">Complimentary shipping on orders over $50. Returns accepted within 30 days on gently used products.</p>
                )
              }
            />
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="rge-pdp__reviews">
            <ReviewSummary average={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length} total={reviews.length} />
            <ReviewList reviews={reviews} />
          </div>
        ) : null}
      </Container>
    </section>
  );
}
