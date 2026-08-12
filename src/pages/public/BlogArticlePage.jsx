import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import SEO from '../../components/SEO';

const API = import.meta.env.VITE_API_URL || '';

export default function BlogArticlePage() {
    const { slug } = useParams();
    const { t, i18n } = useTranslation();
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const [article, setArticle] = useState(null);
    const [related, setRelated] = useState([]);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setErr('');
                const { data } = await axios.get(`${API}/public/articles/${slug}`, {
                    params: { lang },
                });
                if (!cancelled) setArticle(data.data ?? data);

                // Related: latest 3 (excluding current).
                const { data: listData } = await axios.get(`${API}/public/articles`, {
                    params: { per_page: 4, lang },
                });
                if (!cancelled) {
                    const list = (listData.data ?? []).filter((x) => x.slug !== slug).slice(0, 3);
                    setRelated(list);
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
    }, [slug, lang]);

    if (loading) {
        return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">{t('loading', 'Loading…')}</div>;
    }

    if (err || !article) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <h1 className="text-xl font-semibold text-slate-800">{t('blog_not_found', 'Article not found')}</h1>
                <p className="mt-2 text-sm text-slate-500">{err || t('blog_not_found_sub', 'This article may have been removed or unpublished.')}</p>
                <Link to="/blog" className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
                    {t('blog_back', 'Back to blog')}
                </Link>
            </div>
        );
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.meta_description || article.excerpt,
        image: article.featured_image_url,
        datePublished: article.published_at,
        author: { '@type': 'Person', name: article.author?.name ?? 'Sellchaze' },
    };

    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10 md:py-16" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <SEO
                title={article.meta_title || article.title}
                description={article.meta_description || article.excerpt}
                ogImage={article.featured_image_url}
                jsonLd={jsonLd}
            />

            <nav className="mb-4 text-sm sm:mb-6">
                <Link to="/blog" className="text-brand hover:underline">
                    {lang === 'ar' ? '→' : '←'} {t('blog_back', 'Back to blog')}
                </Link>
            </nav>

            <article>
                <header className="mb-6 sm:mb-8">
                    <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-5xl">
                        {article.title}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:text-sm">
                        {article.author?.name ? <span>{article.author.name}</span> : null}
                        {article.published_at ? (
                            <span>
                                · {new Date(article.published_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                })}
                            </span>
                        ) : null}
                    </div>
                </header>

                {article.featured_image_full_url || article.featured_image_url ? (
                    <img
                        src={article.featured_image_full_url || article.featured_image_url}
                        alt={article.title}
                        className="mb-6 aspect-video w-full rounded-xl object-cover shadow-sm sm:mb-8 sm:rounded-2xl"
                    />
                ) : null}

                <div
                    className="prose prose-sm prose-slate max-w-none wrap-break-word prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-brand prose-img:rounded-xl sm:prose-base"
                    // Backend already sanitizes: strip_tags-like filter for <script> and on* handlers.
                    dangerouslySetInnerHTML={{ __html: article.content || '' }}
                />
            </article>

            {related.length > 0 ? (
                <section className="mt-10 border-t border-slate-200 pt-8 sm:mt-16 sm:pt-10">
                    <h2 className="mb-4 text-lg font-bold text-slate-900 sm:mb-6 sm:text-xl">
                        {t('blog_related', 'Related articles')}
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                        {related.map((r) => (
                            <Link
                                key={r.id}
                                to={`/blog/${r.slug}`}
                                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm"
                            >
                                {r.featured_image_url ? (
                                    <img
                                        src={r.featured_image_url}
                                        alt={r.title}
                                        className="aspect-video w-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="aspect-video w-full bg-slate-100" />
                                )}
                                <div className="p-4">
                                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">
                                        {r.title}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
