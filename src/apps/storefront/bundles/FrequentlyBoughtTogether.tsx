import { useEffect, useState, type ReactElement } from 'react';
import { apiFetch } from '../api/client';
import { useCart } from '../state/cart';
import { useStore } from '../state/store-context';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { bundleAvailable, bundleTotals, type ProductBundle } from './bundle-totals';
import './bundles.css';

/** "Frequently bought together" offers for the product being viewed. Lazy-loaded below the product. */
export default function FrequentlyBoughtTogether({ productId }: { productId: string }): ReactElement | null {
  const { store } = useStore();
  const { locale } = useLocale();
  const cart = useCart();
  const ar = locale === 'ar';
  const [bundles, setBundles] = useState<ReadonlyArray<ProductBundle>>([]);
  const [added, setAdded] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    apiFetch<{ data: ProductBundle[] }>(`/bundles?product_id=${encodeURIComponent(productId)}`, { signal: abort.signal })
      .then(({ data }) => { if (!abort.signal.aborted) setBundles(Array.isArray(data) ? data : []); }).catch(() => { /* optional offer */ });
    return () => abort.abort();
  }, [productId, locale]);
  if (!bundles.length) return null;
  const multiplier = store.currencyMultipliers[store.currency] ?? 1;
  const money = (value: number): string => formatMoney(value, store.currency, locale);
  return <section className="sf-bundles" aria-label={ar ? 'يُشترى معًا' : 'Frequently bought together'} dir={ar ? 'rtl' : 'ltr'}>
    {bundles.map((bundle) => {
      const totals = bundleTotals(bundle, multiplier);
      const available = bundleAvailable(bundle);
      const add = (): void => {
        for (const product of bundle.products) {
          cart.add({ id: `${product.id}:default`, productId: String(product.id), title: product.name, url: `/products/${product.slug}`,
            ...(product.image_url ? { image: product.image_url } : {}), price: Math.round(Number(product.price) * multiplier * 100) / 100, currency: store.currency, quantity: 1 });
        }
        setAdded(bundle.id);
      };
      return <article key={bundle.id} className="sf-bundles__offer" aria-labelledby={`sf-bundle-${bundle.id}`}>
        <h2 id={`sf-bundle-${bundle.id}`}>{bundle.title}</h2>
        <ul className="sf-bundles__items">{bundle.products.map((product) => <li key={product.id}>
          {product.image_url ? <img src={product.image_url} alt="" width={64} height={64} loading="lazy" /> : <span className="sf-bundles__placeholder" aria-hidden>{product.name.slice(0, 1)}</span>}
          <span><a href={`/products/${encodeURIComponent(product.slug)}`}>{product.name}</a><bdi>{money(Number(product.price) * multiplier)}</bdi></span>
        </li>)}</ul>
        <p className="sf-bundles__total"><span>{ar ? 'سعر الحزمة' : 'Bundle price'}</span> <strong><bdi>{money(totals.discounted)}</bdi></strong> <s aria-label={ar ? 'السعر قبل الخصم' : 'Price before discount'}><bdi>{money(totals.original)}</bdi></s> <span className="sf-bundles__badge">{ar ? `وفّر ${bundle.discount_percent}%` : `Save ${bundle.discount_percent}%`}</span></p>
        <p className="sf-bundles__note">{ar ? 'يُطبَّق الخصم تلقائيًا عند إتمام الطلب إذا كانت كل منتجات الحزمة في السلة.' : 'The discount applies automatically at checkout when every bundle product is in your cart.'}</p>
        <button type="button" className="sf-bundles__add" disabled={!available} onClick={add}>{ar ? `أضف المنتجات (${bundle.products.length}) إلى السلة` : `Add all ${bundle.products.length} to cart`}</button>
        {!available ? <p className="sf-bundles__note">{ar ? 'أحد منتجات الحزمة غير متوفر حاليًا.' : 'One of the bundle products is currently out of stock.'}</p> : null}
        <p role="status" className="sf-bundles__status">{added === bundle.id ? (ar ? 'أُضيفت منتجات الحزمة إلى السلة.' : 'The bundle products were added to your cart.') : ''}</p>
      </article>;
    })}
  </section>;
}
