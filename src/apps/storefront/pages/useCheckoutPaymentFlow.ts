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

export interface CheckoutContactPayload {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  phone_verification?: string;
  notes?: string;
  shipping_address?: Record<string, unknown>;
  coupon_code?: string;
  shipping_region_id?: string;
  shipping_option_id?: string;
}

interface RetryState {
  token: string;
  orderNumber?: string;
}

interface CheckoutResponse {
  data?: { number?: string };
  receipt?: { token?: string };
  payment?: { redirect_url?: string | null };
}

export function useCheckoutPaymentFlow(options?: { items: ReadonlyArray<CheckoutItem>; preserveCart?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cart = useCart();
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
      if (response.receipt?.token) saveOrderReceipt(response.data.number, response.receipt.token);

      // Clearing the external cart store can render CheckoutPage before router navigation.
      // Keep its empty-cart redirect from preempting this successful order transition.
      completed.current = true;
      const saved = readCheckoutAttempt(scope);
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
        const body = requestError.payload as { checkout_rejected?: boolean; payment_retry?: { token?: string }; receipt?: { token?: string }; data?: { number?: string }; message?: string } | undefined;
        if (body?.data?.number && body.receipt?.token) saveOrderReceipt(body.data.number, body.receipt.token);
        if (body?.payment_retry?.token) {
          setPaymentRetry({ token: body.payment_retry.token, orderNumber: body.data?.number });
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
  }, [cart, preserveCart, navigate, paymentRetry, scope, t]);

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
    const next = { key: crypto.randomUUID(), body: {
      ...payload,
      payment_method: paymentMethod,
      ...(preserveCart ? { cart_mode: 'direct' } : {}),
      items: items ?? cart.lines.map((line) => ({ product_id: Number(line.productId), variant_id: line.variantId ? Number(line.variantId) : undefined, quantity: line.quantity, ...(line.personalization ? { personalization: line.personalization } : {}) })),
    } };
    saveCheckoutAttempt(scope, next);
    setAttempt(next);
    await run(() => submitCheckout(next.body, next.key) as Promise<CheckoutResponse>);
  }, [attempt, cart.lines, items, paymentMethod, paymentRetry, preserveCart, run, scope]);

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
