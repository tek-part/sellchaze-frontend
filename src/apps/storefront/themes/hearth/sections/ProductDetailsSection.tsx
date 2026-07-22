/**
 * product-details (PDP) — Hearth's product experience: big Gallery beside a warm buy box (title,
 * price, finish swatches, quantity, add-to-cart, availability, delivery reassurance) and detail
 * tabs. Binds the shared `ProductDetailModel` and the shared cart state (real, offline-capable).
 * Every optional field is gap-safe — rating/finishes/availability render only when present, and
 * dimensions/AR (data gaps) are simply omitted rather than fabricated.
 */
import { useMemo, useState, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { useCart } from '../../../state/cart';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Price } from '../components/Price';
import { Rating } from '../components/Rating';
import { Tag } from '../components/Badge';
import { ProductGallery } from '../components/ProductGallery';
import { QuantityStepper } from '../components/QuantityStepper';
import { VariantPicker } from '../components/VariantPicker';
import { productDetailOf } from './section-data';

function stripHtml(html: string): string[] {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .filter(Boolean);
}

type TabKey = 'details' | 'materials' | 'delivery';

export function ProductDetailsSection(props: SectionRenderProps): ReactElement | null {
  const { context } = props;
  const product = productDetailOf(context);
  const cart = useCart();

  const colors = product?.colors ?? [];
  const [finish, setFinish] = useState(colors[0]?.value ?? '');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<TabKey>('details');

  const description = useMemo(
    () => (product?.descriptionHtml ? stripHtml(product.descriptionHtml) : []),
    [product?.descriptionHtml],
  );

  if (!product) return null;

  const selectedFinish = colors.find((c) => c.value === finish);
  const soldOut = product.soldOut === true || product.inStock === false;

  const onAdd = (): void => {
    cart.add({
      id: finish ? `${product.id}:${finish}` : product.id,
      productId: product.id,
      ...(finish ? { variantId: finish } : {}),
      title: product.title,
      url: product.url,
      ...(product.image?.src ? { image: product.image.src } : {}),
      price: product.price,
      currency: product.currency,
      quantity: qty,
      ...(selectedFinish ? { attributes: selectedFinish.label } : {}),
    });
    setAdded(true);
  };

  return (
    <section className="hh-section hh-section--oat hh-pdp">
      <Container>
        <div className="hh-pdp__grid">
          <ProductGallery images={product.images} title={product.title} />

          <div className="hh-pdp__buybox">
            {product.vendor ? <p className="hh-pdp__vendor">{product.vendor}</p> : null}
            <h1 className="hh-pdp__title">{product.title}</h1>

            <div className="hh-pdp__meta">
              <Price
                value={product.price}
                {...(product.compareAtPrice !== undefined ? { compareAt: product.compareAtPrice } : {})}
                currency={product.currency}
                size="lg"
              />
              <Rating
                {...(product.rating !== undefined ? { value: product.rating } : {})}
                {...(product.reviewCount !== undefined ? { count: product.reviewCount } : {})}
                compact
              />
            </div>

            {product.lowStock ? <Tag tone="warning">Low stock</Tag> : null}
            {soldOut ? <Tag tone="neutral">Sold out</Tag> : null}

            {colors.length > 0 ? (
              <VariantPicker label="Finish" options={colors} value={finish} onChange={setFinish} className="hh-pdp__variant" />
            ) : null}

            <div className="hh-pdp__actions">
              <QuantityStepper value={qty} onChange={setQty} />
              <Button block onClick={onAdd} disabled={soldOut}>
                {soldOut ? 'Sold out' : 'Add to cart'}
              </Button>
            </div>
            {added ? (
              <p className="hh-pdp__added" role="status">
                Added to your cart.
              </p>
            ) : null}

            <ul className="hh-pdp__reassure">
              <li>Free delivery over $150 · two-person delivery on large items</li>
              <li>30-day returns · 5-year frame warranty</li>
              <li>Order a swatch to feel the material first</li>
            </ul>

            <div className="hh-pdp__tabs">
              <div className="hh-pdp__tablist" role="tablist" aria-label="Product information">
                {(['details', 'materials', 'delivery'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    className={tab === key ? 'hh-pdp__tab hh-pdp__tab--active' : 'hh-pdp__tab'}
                    onClick={() => setTab(key)}
                  >
                    {key === 'details' ? 'Details' : key === 'materials' ? 'Materials & care' : 'Delivery'}
                  </button>
                ))}
              </div>
              <div className="hh-pdp__panel" role="tabpanel">
                {tab === 'details' ? (
                  description.length > 0 ? (
                    description.map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <p>Considered materials and honest construction, made to live with for years.</p>
                  )
                ) : null}
                {tab === 'materials' ? (
                  <p>
                    Made from solid, responsibly sourced timber and natural textiles. Wipe with a soft, dry cloth;
                    keep out of direct heat and sunlight to let the finish age gracefully.
                  </p>
                ) : null}
                {tab === 'delivery' ? (
                  <p>
                    Small items ship by courier within a few days. Larger furniture is delivered by our two-person
                    team to your room of choice — you’ll pick a date at checkout.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
