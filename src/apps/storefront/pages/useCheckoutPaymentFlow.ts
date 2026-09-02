import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import {
  getPaymentMethods,
  retryCheckoutPayment,
  submitCheckout,
  type StorefrontPaymentMethod,
} from '../api/storefront';
import { useCart } from '../state/cart';

export interface CheckoutContactPayload {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
  shipping_address: Record<string, unknown>;
  coupon_code?: string;
}

interface RetryState {
  token: string;
  orderNumber?: string;
}

interface CheckoutResponse {
  data?: { number?: string };
  payment?: { redirect_url?: string | null };
}

export function useCheckoutPaymentFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cart = useCart();
  const [paymentMethods, setPaymentMethods] = useState<ReadonlyArray<StorefrontPaymentMethod>>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentRetry, setPaymentRetry] = useState<RetryState>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getPaymentMethods()
      .then(({ data }) => {
        if (!active) return;
        setPaymentMethods(data);
        setPaymentMethod((current) => current || data[0]?.slug || '');
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : t('checkout.orderFailed'));
      });
    return () => { active = false; };
  }, [t]);

  const submit = useCallback(async (payload: CheckoutContactPayload): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      const response = paymentRetry
        ? await retryCheckoutPayment(paymentRetry.token) as CheckoutResponse
        : await submitCheckout({
            ...payload,
            payment_method: paymentMethod,
            items: cart.lines.map((line) => ({
              product_id: Number(line.productId),
              variant_id: line.variantId ? Number(line.variantId) : undefined,
              quantity: line.quantity,
            })),
          }) as CheckoutResponse;

      cart.clear();
      if (response.payment?.redirect_url) {
        window.location.assign(response.payment.redirect_url);
        return;
      }
      const number = response.data?.number;
      navigate(number ? `/order/success?number=${encodeURIComponent(number)}` : '/order/success');
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        const body = requestError.payload as { payment_retry?: { token?: string }; data?: { number?: string }; message?: string } | undefined;
        if (body?.payment_retry?.token) {
          setPaymentRetry({ token: body.payment_retry.token, orderNumber: body.data?.number });
          setError(body.message ?? t('checkout.orderFailed'));
          return;
        }
      }
      setError(requestError instanceof Error ? requestError.message : t('checkout.orderFailed'));
    } finally {
      setBusy(false);
    }
  }, [cart, navigate, paymentMethod, paymentRetry, t]);

  const cancelRetry = useCallback(() => {
    setPaymentRetry(undefined);
    setError(undefined);
  }, []);

  return {
    paymentMethods,
    paymentMethod,
    setPaymentMethod,
    paymentRetry,
    error,
    busy,
    submit,
    cancelRetry,
  };
}
