import { useEffect, useState, type ReactElement } from 'react';
import type { ProductPreferences } from '../../types/product-preferences';
import { usePromotionPurchasedQuantity } from '../../state/product-promotion-purchases';

const expires = new Map<string, number>();
export function ProductPromotions({ id, storeId, preferences, ar }: { id: string; storeId: string; preferences: ProductPreferences; ar: boolean }): ReactElement | null {
  const purchasedQuantity = usePromotionPurchasedQuantity(storeId, id);
  const low = preferences.fake_visitors_min ?? 20; const high = Math.max(low, preferences.fake_visitors_max ?? 70);
  const [visitors, setVisitors] = useState(low); const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!preferences.is_fake_visitors) return;
    const tick = (): void => setVisitors(Math.floor(Math.random() * (high - low + 1)) + low);
    tick(); const timer = window.setInterval(tick, 8000); return () => window.clearInterval(timer);
  }, [id, preferences.is_fake_visitors, low, high]);
  const hours = preferences.fake_timer_hours ?? 1;
  useEffect(() => {
    if (!preferences.is_fake_timer) return;
    const key = `sf:product-promotion:${window.location.host}:${id}:${hours}`;
    let end = expires.get(key);
    if (end === undefined) {
      try { const saved = Number(sessionStorage.getItem(key)); if (saved > 0 && saved <= Date.now() + hours * 3600_000) end = saved; } catch { /* Private browsing uses the document clock. */ }
      end ??= Date.now() + hours * 3600_000; expires.set(key, end);
      try { sessionStorage.setItem(key, String(end)); } catch { /* In-memory fallback. */ }
    }
    const deadline = end;
    const tick = (): void => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [id, preferences.is_fake_timer, hours]);
  if (!preferences.is_fake_visitors && !preferences.is_fake_stock && !preferences.is_fake_timer && !preferences.is_free_shipping) return null;
  const remaining = Math.max(0, (preferences.fake_stock_count ?? 5) - purchasedQuantity);
  const time = `${Math.floor(seconds / 3600).toString().padStart(2, '0')}:${Math.floor(seconds / 60 % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return <div className="sf-product-promotions">{preferences.is_free_shipping ? <p>{ar ? 'شحن مجاني لهذا المنتج' : 'Free shipping for this product'}</p> : null}{preferences.is_fake_visitors ? <p>{ar ? `يشاهد هذا المنتج الآن ${visitors} زائرًا` : `${visitors} visitors are viewing this product`}</p> : null}{preferences.is_fake_stock ? <p>{ar ? `تبقّى ${remaining} قطع` : `${remaining} pieces left`}</p> : null}{preferences.is_fake_timer && seconds > 0 ? <p>{ar ? 'الوقت المتبقي على العرض' : 'Offer countdown'} <time dir="ltr">{time}</time></p> : null}</div>;
}
