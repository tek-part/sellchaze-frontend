import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import {
  getPaymentMethods,
  recoverCheckout,
  retryCheckoutPayment,
  submitCheckout,
  type StorefrontPaymentMethod,
  type CheckoutItem,
} from '../api/storefront';
import { useCart } from '../state/cart';
import { withSessionParams } from './NavigationInterceptor';
import { clearCheckoutAttempt, readCheckoutAttempt, resumeCheckoutAttempt, saveCheckoutAttempt, type CheckoutAttempt } from './checkout-attempt';
import { saveOrderReceipt } from './order-receipt';
import { retireLeadToken } from './checkout-lead-session';
import { checkoutCartItems } from './checkout-cart-items';
import { metricsSession } from '../analytics/events';
import { browserAdvertisingAllowed, sendAdvertisingEnvelope } from '../advertising/events';
import { useStore } from '../state/store-context';
import { abCheckoutToken } from './ab-assignment';
import { recordPromotionPurchase } from '../state/product-promotion-purchases';

export interface CheckoutContactPayload {
  payment_adjustment_token?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  lead_token?: string;
  phone_verification?: string;
  bot_proof?: string;
  notes?: string;
  shipping_address?: Record<string, unknown>;
  coupon_code?: string;
  shipping_region_id?: string;
  shipping_option_id?: string;
}

interface RetryState {
  token: string;
  orderNumber?: string;
  total?: string | number;
  currency?: string;
  adjustment?: string;
}

interface CheckoutResponse {
  data?: { number?: string; tracking?: unknown };
  receipt?: { token?: string };
  payment?: { redirect_url?: string | null };
}

export function useCheckoutPaymentFlow(options?: { items: ReadonlyArray<CheckoutItem>; preserveCart?: boolean; surface?: 'product' | 'storefront' | 'funnel' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cart = useCart();
  const { store } = useStore();
  const scope = window.location.origin;
  const [attempt, setAttempt] = useState<CheckoutAttempt | undefined>(() => readCheckoutAttempt(scope));
  const [paymentMethods, setPaymentMethods] = useState<ReadonlyArray<StorefrontPaymentMethod>>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRetry, setPaymentRetry] = useState<RetryState>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const completed = useRef(false);
  const items = options?.items;
  const paymentBasketKey = JSON.stringify([...new Set(items ? items.map((item) => item.product_id) : cart.lines.map((line) => Number(line.productId)))].sort((a, b) => a - b));
  const preserveCart = options?.preserveCart ?? false;
  const surface = options?.surface;

  useEffect(() => {
    let active = true;
    void getPaymentMethods(JSON.parse(paymentBasketKey) as number[])
      .then(({ data }) => {
        if (!active) return;
        setPaymentMethods(data);
        setPaymentMethod((current) => data.some((method) => method.slug === current) ? current : data[0]?.slug || '');
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : t('checkout.orderFailed'));
      });
    return () => { active = false; };
  }, [t, paymentBasketKey]);

  const run = useCallback(async (operation: () => Promise<CheckoutResponse>): Promise<void> => {
    if (submitting.current || completed.current) return;
    submitting.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const response = await operation();
      if (!response.data?.number) throw new Error(t('checkout.orderFailed'));
      sendAdvertisingEnvelope(store.id, response.data.tracking);
      if (response.receipt?.token) saveOrderReceipt(response.data.number, response.receipt.token);

      // Clearing the external cart store can render CheckoutPage before router navigation.
      // Keep its empty-cart redirect from preempting this successful order transition.
      completed.current = true;
      const saved = readCheckoutAttempt(scope);
      recordPromotionPurchase(store.id, response.data.number, saved?.body.items ?? items ?? checkoutCartItems(cart.lines));
      try { retireLeadToken(window.sessionStorage, saved?.body.lead_token); } catch { /* optional browser persistence */ }
      if ((saved ? saved.body.cart_mode !== 'direct' : !preserveCart)) cart.clear();
      if (response.payment?.redirect_url) {
        if (saved) saveCheckoutAttempt(scope, { ...saved, orderNumber: response.data.number });
        window.location.assign(response.payment.redirect_url);
        return;
      }
      clearCheckoutAttempt(scope);
      setAttempt(undefined);
      const number = response.data?.number;
      navigate(withSessionParams(number ? `/order/success?number=${encodeURIComponent(number)}` : '/order/success', window.location.search));
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        const body = requestError.payload as { checkout_rejected?: boolean; payment_retry?: { token?: string }; receipt?: { token?: string }; data?: { number?: string; tracking?: unknown; total?: string | number; currency?: string; payment_adjustment_total?: string }; message?: string } | undefined;
        if (body?.data?.number && body.receipt?.token) {
          recordPromotionPurchase(store.id, body.data.number, readCheckoutAttempt(scope)?.body.items ?? items ?? checkoutCartItems(cart.lines));
          sendAdvertisingEnvelope(store.id, body.data.tracking);
          saveOrderReceipt(body.data.number, body.receipt.token);
          try { retireLeadToken(window.sessionStorage, readCheckoutAttempt(scope)?.body.lead_token); } catch { /* server already converted the lead */ }
        }
        if (body?.payment_retry?.token) {
          setPaymentRetry({ token: body.payment_retry.token, orderNumber: body.data?.number, total: body.data?.total, currency: body.data?.currency, adjustment: body.data?.payment_adjustment_total });
          setError(undefined);
          return;
        }
        // Only a server-confirmed rejection before order creation permits a new key.
        if (body?.checkout_rejected === true && !paymentRetry) {
          clearCheckoutAttempt(scope);
          setAttempt(undefined);
        }
      }
      setError(requestError instanceof Error ? requestError.message : t('checkout.orderFailed'));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }, [cart, items, preserveCart, navigate, paymentRetry, scope, t, store.id]);

  const submit = useCallback(async (payload: CheckoutContactPayload): Promise<void> => {
    if (submitting.current || completed.current) return;
    if (paymentRetry) {
      await run(() => retryCheckoutPayment(paymentRetry.token) as Promise<CheckoutResponse>);
      return;
    }
    if (attempt) return;
    const unresolved = readCheckoutAttempt(scope);
    if (unresolved) {
      setAttempt(unresolved);
      return;
    }
    const metrics = metricsSession(store.id);
    const next = { key: crypto.randomUUID(), body: {
      ...payload,
      analytics_session: metrics?.id,
      marketing_attribution: metrics?.campaign,
      referral_attribution: metrics?.referral,
      ab_token: abCheckoutToken(store.id, (items ?? checkoutCartItems(cart.lines)).map((item) => item.product_id)),
      advertising_allowed: browserAdvertisingAllowed(),
      payment_method: paymentMethod,
      ...(preserveCart ? { cart_mode: 'direct' } : {}),
      ...(surface ? { checkout_surface: surface } : {}),
      ...(surface === 'funnel' && /^\/(?:funnels|pages)\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/.test(window.location.pathname) ? { funnel_path: window.location.pathname } : {}),
      items: items ?? checkoutCartItems(cart.lines),
    } };
    saveCheckoutAttempt(scope, next);
    setAttempt(next);
    await run(() => submitCheckout(next.body, next.key) as Promise<CheckoutResponse>);
  }, [attempt, cart.lines, items, paymentMethod, paymentRetry, preserveCart, run, scope, store.id, surface]);

  const recover = useCallback(async (): Promise<void> => {
    if (!attempt) return;
    await run(() => resumeCheckoutAttempt(attempt, recoverCheckout, submitCheckout) as Promise<CheckoutResponse>);
  }, [attempt, run]);

  return {
    completed: completed.current,
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    paymentRetry,
    error,
    busy,
    submit,
    unresolved: !!attempt,
    recoverable: !!attempt && !paymentRetry,
    recover,
  };
}
