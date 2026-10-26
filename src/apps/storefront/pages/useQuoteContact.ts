import { useEffect, useState } from 'react';

/** A guest's phone and e-mail as sent with a checkout quote, so per-customer discount limits apply. */
export interface QuoteContact { customer_phone?: string; customer_email?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function quoteContact(phone: string, email: string): QuoteContact {
  return { ...(phone.replace(/\D/g, '').length >= 7 ? { customer_phone: phone } : {}), ...(EMAIL.test(email) ? { customer_email: email } : {}) };
}

/** The contact typed so far, settled once typing pauses so the quote is not re-requested per keystroke. */
export function useQuoteContact(payload: { customer_phone?: string; customer_email?: string }, delay = 600): QuoteContact {
  const phone = payload.customer_phone?.trim() ?? '';
  const email = payload.customer_email?.trim() ?? '';
  const [settled, setSettled] = useState<QuoteContact>(() => quoteContact(phone, email));
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = quoteContact(phone, email);
      setSettled((current) => current.customer_phone === next.customer_phone && current.customer_email === next.customer_email ? current : next);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phone, email, delay]);
  return settled;
}
