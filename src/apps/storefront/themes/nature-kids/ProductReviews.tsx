import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import type { ProductDetailModel, ReviewModel } from '../../types/catalog';
import { useOptionalAuth } from '../../state/auth-context';
import { useStore } from '../../state/store-context';
import { useLocaleCode } from '../../sections-lib/i18n';
import { useAsync } from '../../api/useAsync';
import { getProductReviews, submitProductReview } from '../../api/storefront';
import { toReview } from '../../api/mappers';
import { ApiError } from '../../api/client';
import { Modal } from '../../foundation/components/Modal';
import { ReviewList, ReviewSummary } from '../../foundation/components/Reviews';

export function reviewError(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.payload && typeof error.payload === 'object') {
    const errors = (error.payload as { errors?: Record<string, unknown> }).errors;
    for (const key of ['rating', 'title', 'body']) { const value = errors?.[key]; if (Array.isArray(value) && typeof value[0] === 'string') return value[0]; }
  }
  return error instanceof Error ? error.message : fallback;
}
function ReviewComposer({ product, close, saved }: { product: ProductDetailModel; close: () => void; saved: () => void }): ReactElement {
  const customer = useOptionalAuth()?.customer; const ar = useLocaleCode() === 'ar'; const [rating, setRating] = useState(5); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const mounted = useRef(true); useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function submit(event: FormEvent): Promise<void> { event.preventDefault(); if (!customer || busy) return; setBusy(true); setError(''); try { await submitProductReview(product.handle, { rating, title: title.trim(), body: body.trim() }); if (mounted.current) saved(); } catch (failure) { if (mounted.current) setError(reviewError(failure, ar ? 'تعذر إرسال التقييم.' : 'Unable to submit your review.')); } finally { if (mounted.current) setBusy(false); } }
  return <Modal open onClose={close} title={ar ? 'شارك تقييمك' : 'Share your review'} className="nkd-review-modal">{customer ? <form className="sf-overlay__body" onSubmit={event => void submit(event)}><label>{ar ? 'التقييم' : 'Rating'}<select value={rating} onChange={event => setRating(Number(event.target.value))} disabled={busy}>{[5, 4, 3, 2, 1].map(value => <option value={value} key={value}>{value} ★</option>)}</select></label><label>{ar ? 'العنوان' : 'Title'}<input maxLength={255} value={title} onChange={event => setTitle(event.target.value)} disabled={busy} /></label><label>{ar ? 'تقييمك' : 'Your review'}<textarea maxLength={5000} rows={5} value={body} onChange={event => setBody(event.target.value)} disabled={busy} /></label>{error ? <p role="alert">{error}</p> : null}<button className="nkd-pill" type="submit" disabled={busy}>{busy ? ar ? 'جارٍ الإرسال…' : 'Submitting…' : ar ? 'إرسال التقييم' : 'Submit review'}</button></form> : <div className="sf-overlay__body"><p>{ar ? 'سجّل الدخول إلى حسابك لكتابة تقييم.' : 'Sign in to your customer account to write a review.'}</p><a className="nkd-pill" href={`/login?next=${encodeURIComponent(`${product.url}#reviews`)}`}>{ar ? 'تسجيل الدخول' : 'Sign in'}</a></div>}</Modal>;
}
export function KidsReviews({ product, initialReviews }: { product: ProductDetailModel; initialReviews: ReadonlyArray<ReviewModel> }): ReactElement {
  const { store, apiOk } = useStore(); const customer = useOptionalAuth()?.customer; const locale = useLocaleCode(); const ar = locale === 'ar'; const [open, setOpen] = useState(false); const [revision, setRevision] = useState(0); const [page, setPage] = useState(1); const [loaded, setLoaded] = useState<ReadonlyArray<ReviewModel>>(initialReviews); const [saved, setSaved] = useState(false); const scope = `${store.id}:${product.id}:${locale}:${revision}`;
  useEffect(() => { if (typeof window !== 'undefined' && window.location.hash === '#reviews') document.getElementById('reviews')?.scrollIntoView({ block: 'start' }); }, []);
  const response = useAsync(async () => apiOk ? { scope, page, response: await getProductReviews(product.handle, page) } : null, [scope, apiOk, page]);
  const current = response.data?.scope === scope ? response.data.response : null;
  useEffect(() => { if (response.data?.scope !== scope || response.data.page !== page) return; const next = response.data.response.data.map(toReview); setLoaded(previous => page === 1 ? next : [...previous, ...next.filter(review => !previous.some(old => old.id === review.id))]); }, [response.data, scope, page]);
  const reviews = loaded; const total = current?.summary?.count ?? current?.meta.total ?? reviews.length; const average = current?.summary?.average ?? (reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0);
  return <section id="reviews" className="nkd-product-reviews"><h2>{ar ? 'تقييمات العملاء' : 'Users reviews'}</h2>{total ? <><ReviewSummary average={average} total={total} /><ReviewList reviews={reviews} hasMore={Boolean(current && current.meta.last_page > page)} loadingMore={response.loading} onLoadMore={() => setPage(value => value + 1)} /></> : <p>{ar ? 'لا توجد تقييمات بعد.' : 'No reviews'}</p>}{response.error ? <p role="status">{ar ? 'تعذر تحميل التقييمات.' : 'Unable to load reviews.'}</p> : null}{saved ? <p role="status">{ar ? 'تم إرسال تقييمك.' : 'Your review was submitted.'}</p> : null}<button type="button" className="nkd-review-trigger" onClick={() => setOpen(true)}>{ar ? 'شارك تقييمك' : 'Share your review'}</button>{open ? <ReviewComposer key={`${scope}:${customer?.id ?? 'guest'}`} product={product} close={() => setOpen(false)} saved={() => { setOpen(false); setSaved(true); setPage(1); setRevision(value => value + 1); }} /> : null}</section>;
}
