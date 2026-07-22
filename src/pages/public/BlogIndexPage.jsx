import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import SEO from '../../components/SEO';

const API = import.meta.env.VITE_API_URL || '';

export default function BlogIndexPage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const [params, setParams] = useSearchParams();
    const page = Number(params.get('page') ?? 1);
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${API}/public/articles`, {
                    params: { page, per_page: 12, lang },
                });
                if (!cancelled) {
                    setRows(data.data ?? []);
                    setMeta(data.meta ?? null);
                }
            } catch (e) {
                if (!cancelled) setErr(e.response?.data?.message || e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [page, lang]);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Sellchase Blog',
        url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    const [featured, ...rest] = rows;

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-16" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <SEO
                title={`${t('blog_title', 'Blog')} — Sellchase`}
                description={t('blog_subtitle', 'Insights, guides, and updates from the Sellchase team.')}
                jsonLd={jsonLd}
            />

            <header className="mb-8 text-center sm:mb-10">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-5xl">
                    {t('blog_title', 'Blog')}
                </h1>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 sm:mt-3 sm:text-base">
                    {t('blog_subtitle', 'Insights, guides, and updates from the Sellchase team.')}
                </p>
            </header>

            {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
            ) : null}

            {loading ? (
                <div className="py-12 text-center text-slate-500">{t('loading', 'Loading…')}</div>
            ) : rows.length === 0 ? (
                <div className="py-12 text-center text-slate-500">{t('blog_empty', 'No posts yet.')}</div>
            ) : (
                <>
                    {/* Featured (first article) */}
                    {featured ? (
                        <Link
                            to={`/blog/${featured.slug}`}
                            className="group mb-6 block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md sm:mb-8 md:grid md:grid-cols-2 md:gap-0"
                        >
                            {featured.featured_image_url ? (
                                <img
                                    src={featured.featured_image_url}
                                    alt={featured.title}
                                    className="aspect-16/10 w-full object-cover md:aspect-auto md:h-full"
                                    loading="eager"
                                />
                            ) : (
                                <div className="aspect-16/10 w-full bg-slate-100 md:aspect-auto md:h-full" />
                            )}
                            <div className="flex flex-col justify-center p-5 sm:p-6 md:p-8">
                                <span className="mb-2 inline-flex w-fit rounded-full bg-brand-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-dark">
                                    {t('featured', 'Featured')}
                                </span>
                                <h2 className="line-clamp-3 text-xl font-bold text-slate-900 group-hover:text-brand sm:text-2xl md:text-3xl">
                                    {featured.title}
                                </h2>
                                {featured.excerpt ? (
                                    <p className="mt-2 line-clamp-3 text-sm text-slate-600 sm:text-base">{featured.excerpt}</p>
                                ) : null}
                                <div className="mt-3 text-xs text-slate-500">
                                    {featured.published_at
                                        ? new Date(featured.published_at).toLocaleDateString(
                                              lang === 'ar' ? 'ar-EG' : 'en-US',
                                              { year: 'numeric', month: 'short', day: 'numeric' }
                                          )
                                        : ''}
                                </div>
                            </div>
                        </Link>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                        {rest.map((a) => (
                            <Link
                                key={a.id}
                                to={`/blog/${a.slug}`}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                {a.featured_image_url ? (
                                    <img
                                        src={a.featured_image_url}
                                        alt={a.title}
                                        className="aspect-video w-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="aspect-video w-full bg-slate-100" />
                                )}
                                <div className="flex flex-1 flex-col p-4 sm:p-5">
                                    <h2 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-brand sm:text-lg">
                                        {a.title}
                                    </h2>
                                    {a.excerpt ? (
                                        <p className="mt-2 line-clamp-3 text-sm text-slate-600">{a.excerpt}</p>
                                    ) : null}
                                    <div className="mt-auto pt-3 text-xs text-slate-500">
                                        {a.published_at
                                            ? new Date(a.published_at).toLocaleDateString(
                                                  lang === 'ar' ? 'ar-EG' : 'en-US',
                                                  { year: 'numeric', month: 'short', day: 'numeric' }
                                              )
                                            : ''}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {meta && meta.last_page > 1 ? (
                <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10">
                    <button
                        disabled={page <= 1}
                        onClick={() => setParams({ page: String(page - 1) })}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {t('previous', 'Previous')}
                    </button>
                    <span className="text-sm text-slate-600">
                        {page} / {meta.last_page}
                    </span>
                    <button
                        disabled={page >= meta.last_page}
                        onClick={() => setParams({ page: String(page + 1) })}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {t('next', 'Next')}
                    </button>
                </nav>
            ) : null}
        </div>
    );
}
