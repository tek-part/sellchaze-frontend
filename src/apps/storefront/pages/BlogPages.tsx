/**
 * Blog index and article pages.
 *
 * Content comes from `content/articles` because the storefront API has no articles endpoint; the
 * blog was previously a permanent empty state in all four themes. Presentation uses the shared
 * `.sf-*` component library, which each theme re-skins through its own stylesheet, so the editorial
 * layout carries each theme's identity without four copies of the logic.
 */
import { useMemo, useState, type ReactElement } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Button,
  ButtonLink,
  Container,
  EmptyState,
  Input,
  Section,
  StoreImage,
} from '../themes/luxury-fashion/components';
import { Pagination } from '../shared-ui';
import { Seo } from '../seo/Seo';
import { articleSchema, breadcrumbSchema } from '../seo/schema';
import { useStore } from '../state/store-context';
import { useNewsletter } from '../shared-ui';
import {
  ARTICLES_BY_DATE,
  articleCategories,
  articleNeighbours,
  articleTags,
  coverAt,
  formatArticleDate,
  getArticle,
  relatedArticles,
  type Article,
  type ArticleBlock,
} from '../content/articles';

const PER_PAGE = 4;

function site(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/* --------------------------------------------------------------------- shared bits */

function ArticleMeta(props: { article: Article; className?: string }): ReactElement {
  const { article, className } = props;
  return (
    <p className={className ?? 'sf-article__meta'}>
      <time dateTime={article.published}>{formatArticleDate(article.published)}</time>
      <span aria-hidden> · </span>
      <span>{article.readingMinutes} min read</span>
      <span aria-hidden> · </span>
      <span>{article.category}</span>
    </p>
  );
}

function ArticleCard(props: { article: Article; featured?: boolean }): ReactElement {
  const { article, featured } = props;
  return (
    <article className={featured ? 'sf-postcard sf-postcard--featured' : 'sf-postcard'}>
      <Link to={`/blog/${article.slug}`} className="sf-postcard__media" tabIndex={-1} aria-hidden>
        <StoreImage src={coverAt(article, featured ? 1200 : 800)} alt="" />
      </Link>
      <div className="sf-postcard__body">
        <span className="sf-postcard__cat">{article.category}</span>
        <h3 className="sf-postcard__title">
          <Link to={`/blog/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="sf-postcard__excerpt">{article.excerpt}</p>
        <ArticleMeta article={article} className="sf-postcard__meta" />
      </div>
    </article>
  );
}

function NewsletterCta(): ReactElement {
  const [email, setEmail] = useState('');
  const { status, message, submitting, subscribe } = useNewsletter();
  const done = status === 'saved' || status === 'subscribed';

  return (
    <aside className="sf-blogcta">
      <h2 className="sf-blogcta__title">Get new writing by email</h2>
      <p className="sf-blogcta__text">Occasional essays on materials, care and provenance. No offers.</p>
      {done ? (
        <p className="sf-blogcta__done" role="status">
          {message}
        </p>
      ) : (
        <form
          className="sf-blogcta__form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void subscribe(email);
          }}
        >
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...(status === 'invalid' || status === 'error' ? { error: message } : {})}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing up…' : 'Subscribe'}
          </Button>
        </form>
      )}
    </aside>
  );
}

/* --------------------------------------------------------------------- index */

export function BlogPage(): ReactElement {
  const { store } = useStore();
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').trim();
  const activeCategory = params.get('category') ?? '';
  const activeTag = params.get('tag') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ARTICLES_BY_DATE.filter((a) => {
      if (activeCategory && a.category !== activeCategory) return false;
      if (activeTag && !a.tags.includes(activeTag)) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory, activeTag]);

  // The featured slot only makes sense on an unfiltered first page; otherwise it would hide a
  // result the reader explicitly asked for.
  const unfiltered = !query && !activeCategory && !activeTag;
  const featured = unfiltered && page === 1 ? filtered.find((a) => a.featured) : undefined;
  const rest = featured ? filtered.filter((a) => a.slug !== featured.slug) : filtered;
  const pageCount = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const visible = rest.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const trending = ARTICLES_BY_DATE.slice(0, 3);

  return (
    <Section>
      <Seo
        title="Journal"
        path="/blog"
        description={`Essays, guides and notes from ${store.name}.`}
        jsonLd={[breadcrumbSchema([{ label: 'Home', url: '/' }, { label: 'Journal', url: '/blog' }], site())]}
      />
      <Container>
        <header className="sf-page-head">
          <h1 className="sf-page-head__title">The journal</h1>
          <p className="sf-page-head__sub">
            Essays, guides and notes on materials, care and the long life of well-made things.
          </p>
        </header>

        {featured ? (
          <div className="sf-blog__featured">
            <ArticleCard article={featured} featured />
          </div>
        ) : null}

        <div className="sf-blog">
          <div className="sf-blog__main">
            {visible.length === 0 ? (
              <EmptyState
                variant="search"
                title="No articles found"
                description={
                  query
                    ? `Nothing matches “${query}”. Try a different term or clear the filters.`
                    : 'No articles match these filters yet.'
                }
                actions={
                  <Button
                    onClick={() => {
                      setParams(new URLSearchParams());
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <div className="sf-blog__grid">
                {visible.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            )}

            <Pagination
              page={safePage}
              pageCount={pageCount}
              onPageChange={(next) => {
                const p = new URLSearchParams(params);
                p.set('page', String(next));
                setParams(p);
              }}
              className="sf-blog__pagination"
            />
          </div>

          <aside className="sf-blog__aside" aria-label="Journal filters">
            <div className="sf-blogside">
              <h2 className="sf-blogside__title">Search</h2>
              <Input
                label="Search articles"
                type="search"
                value={query}
                onChange={(e) => setParam('q', e.target.value)}
              />
            </div>

            <div className="sf-blogside">
              <h2 className="sf-blogside__title">Categories</h2>
              <ul className="sf-blogside__list">
                {articleCategories().map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      className="sf-blogside__link"
                      aria-pressed={activeCategory === c.name}
                      onClick={() => setParam('category', activeCategory === c.name ? '' : c.name)}
                    >
                      {c.name} <span className="sf-blogside__count">{c.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sf-blogside">
              <h2 className="sf-blogside__title">Trending</h2>
              <ol className="sf-blogside__trending">
                {trending.map((a, i) => (
                  <li key={a.slug}>
                    <span className="sf-blogside__rank" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Link to={`/blog/${a.slug}`}>{a.title}</Link>
                  </li>
                ))}
              </ol>
            </div>

            <div className="sf-blogside">
              <h2 className="sf-blogside__title">Tags</h2>
              <ul className="sf-blogside__tags">
                {articleTags().map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      className="sf-tagchip"
                      aria-pressed={activeTag === t}
                      onClick={() => setParam('tag', activeTag === t ? '' : t)}
                    >
                      #{t}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <NewsletterCta />
          </aside>
        </div>
      </Container>
    </Section>
  );
}

/* --------------------------------------------------------------------- detail */

function renderBlock(block: ArticleBlock, index: number): ReactElement {
  switch (block.kind) {
    case 'heading':
      return (
        <h2 key={index} id={`section-${index}`} className="sf-prose__h2">
          {block.text}
        </h2>
      );
    case 'quote':
      return (
        <blockquote key={index} className="sf-prose__quote">
          <p>{block.text}</p>
          {block.cite ? <cite>{block.cite}</cite> : null}
        </blockquote>
      );
    case 'list':
      return (
        <ul key={index} className="sf-prose__list">
          {block.items.map((item) => (
            <li key={item.slice(0, 24)}>{item}</li>
          ))}
        </ul>
      );
    case 'image':
      return (
        <figure key={index} className="sf-prose__figure">
          <StoreImage src={block.src} alt={block.alt} />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    default:
      return (
        <p key={index} className="sf-prose__p">
          {block.text}
        </p>
      );
  }
}

export function BlogDetailPage(): ReactElement {
  const { slug = '' } = useParams();
  const { store } = useStore();
  const article = getArticle(slug);

  if (!article) {
    return (
      <Section>
        <Seo title="Article not found" path={`/blog/${slug}`} noindex />
        <Container narrow>
          <EmptyState
            variant="search"
            title="Article not found"
            description="That article may have moved, or the link may be out of date."
            actions={<ButtonLink href="/blog">Back to the journal</ButtonLink>}
          />
        </Container>
      </Section>
    );
  }

  const headings = article.body
    .map((b, i) => ({ block: b, i }))
    .filter((x): x is { block: Extract<ArticleBlock, { kind: 'heading' }>; i: number } => x.block.kind === 'heading');
  const related = relatedArticles(article.slug);
  const { prev, next } = articleNeighbours(article.slug);
  const url = `${site()}/blog/${article.slug}`;

  const share = [
    { label: 'Share on X', href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}` },
    { label: 'Share on Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: 'Share by email', href: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(url)}` },
  ];

  return (
    <Section>
      <Seo
        title={article.title}
        path={`/blog/${article.slug}`}
        description={article.excerpt}
        image={article.cover}
        type="article"
        jsonLd={[
          breadcrumbSchema(
            [
              { label: 'Home', url: '/' },
              { label: 'Journal', url: '/blog' },
              { label: article.title, url: `/blog/${article.slug}` },
            ],
            site(),
          ),
          articleSchema({
            title: article.title,
            description: article.excerpt,
            url,
            image: article.cover,
            published: article.published,
            authorName: article.author.name,
            siteName: store.name,
          }),
        ]}
      />
      <Container>
        <nav className="sf-crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/blog">Journal</Link>
            </li>
            <li aria-current="page">{article.title}</li>
          </ol>
        </nav>

        <article className="sf-article">
          <header className="sf-article__head">
            <span className="sf-article__cat">{article.category}</span>
            <h1 className="sf-article__title">{article.title}</h1>
            <p className="sf-article__standfirst">{article.excerpt}</p>
            <ArticleMeta article={article} />
          </header>

          <figure className="sf-article__cover">
            <StoreImage src={article.cover} alt={article.coverAlt} eager />
          </figure>

          <div className="sf-article__layout">
            <div className="sf-article__aside">
              {headings.length > 1 ? (
                <nav className="sf-toc" aria-label="On this page">
                  <h2 className="sf-toc__title">On this page</h2>
                  <ol>
                    {headings.map(({ block, i }) => (
                      <li key={i}>
                        <a href={`#section-${i}`}>{block.text}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}

              <div className="sf-share">
                <h2 className="sf-share__title">Share</h2>
                <ul>
                  {share.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} rel="noreferrer noopener" target="_blank">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="sf-prose">{article.body.map(renderBlock)}</div>
          </div>

          <footer className="sf-article__foot">
            <div className="sf-author">
              <div className="sf-author__meta">
                <span className="sf-author__name">{article.author.name}</span>
                <span className="sf-author__role">{article.author.role}</span>
                <p className="sf-author__bio">{article.author.bio}</p>
              </div>
            </div>

            <ul className="sf-article__tags">
              {article.tags.map((t) => (
                <li key={t}>
                  <Link className="sf-tagchip" to={`/blog?tag=${encodeURIComponent(t)}`}>
                    #{t}
                  </Link>
                </li>
              ))}
            </ul>
          </footer>

          <nav className="sf-prevnext" aria-label="More articles">
            {prev ? (
              <Link className="sf-prevnext__item" to={`/blog/${prev.slug}`}>
                <span className="sf-prevnext__label">Previous</span>
                <span className="sf-prevnext__title">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="sf-prevnext__item sf-prevnext__item--next" to={`/blog/${next.slug}`}>
                <span className="sf-prevnext__label">Next</span>
                <span className="sf-prevnext__title">{next.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>

        {related.length > 0 ? (
          <section className="sf-related" aria-labelledby="related-heading">
            <h2 id="related-heading" className="sf-related__title">
              Related reading
            </h2>
            <div className="sf-blog__grid">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        ) : null}

        <NewsletterCta />
      </Container>
    </Section>
  );
}
