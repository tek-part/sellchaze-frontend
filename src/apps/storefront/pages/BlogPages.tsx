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
import { useTranslation } from 'react-i18next';
import {
  Button,
  ButtonLink,
  Container,
  EmptyState,
  Input,
  Section,
  StoreImage,
} from '../foundation/components';
import { Pagination } from '../shared-ui';
import { Seo } from '../seo/Seo';
import { articleSchema, breadcrumbSchema } from '../seo/schema';
import { useStore } from '../state/store-context';
import { useNewsletter } from '../shared-ui';
import { useStoreContent, useStoreContentState } from '../content/useStoreContent';
import { previewOrDev } from '../preview';
import { sanitizeHtml } from '../../../shared/utils/sanitizeHtml';

interface StorePost {
  title?: string;
  slug?: string;
  excerpt?: string;
  image?: string;
  date?: string;
  body?: string;
  seo_title?: string;
  seo_description?: string;
}

interface BlogContent {
  heading?: string;
  intro?: string;
  posts?: StorePost[];
}

/** The store's own published posts (merchant articles and legacy blog content), titled ones only. */
function storePosts(content: BlogContent | null): StorePost[] {
  return (Array.isArray(content?.posts) ? content.posts : []).filter((post) => (post.title || '').trim() && (post.slug || '').trim());
}
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
  const { t } = useTranslation();
  const { article, className } = props;
  return (
    <p className={className ?? 'sf-article__meta'}>
      <time dateTime={article.published}>{formatArticleDate(article.published)}</time>
      <span aria-hidden> · </span>
      <span>{t('blog.readingTime', { count: article.readingMinutes })}</span>
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

function StorePostCard(props: { post: StorePost }): ReactElement {
  const { post } = props;
  const href = `/blog/${encodeURIComponent(post.slug ?? '')}`;
  return (
    <article className="sf-postcard">
      {post.image?.trim() ? (
        <Link to={href} className="sf-postcard__media" tabIndex={-1} aria-hidden>
          <StoreImage src={post.image} alt="" />
        </Link>
      ) : null}
      <div className="sf-postcard__body">
        <h3 className="sf-postcard__title">
          <Link to={href}>{post.title}</Link>
        </h3>
        {post.excerpt?.trim() ? <p className="sf-postcard__excerpt">{post.excerpt}</p> : null}
        {post.date?.trim() ? <p className="sf-postcard__meta"><time dateTime={post.date}>{post.date}</time></p> : null}
      </div>
    </article>
  );
}

function NewsletterCta(): ReactElement {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const { status, message, submitting, subscribe } = useNewsletter();
  const done = status === 'saved' || status === 'subscribed';

  return (
    <aside className="sf-blogcta">
      <h2 className="sf-blogcta__title">{t('newsletter.title')}</h2>
      <p className="sf-blogcta__text">{t('blog.newsletterText')}</p>
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
            label={t('footer.emailLabel')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            {...(status === 'invalid' || status === 'error' ? { error: message } : {})}
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? t('newsletter.subscribing') : t('newsletter.subscribe')}
          </Button>
        </form>
      )}
    </aside>
  );
}

/* --------------------------------------------------------------------- index */

export function BlogPage(): ReactElement {
  const { t } = useTranslation();
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

  // Store's own blog content (editable). When custom posts exist they replace the demo grid.
  const bc = useStoreContent<BlogContent>('blog') ?? {};
  const blogHeading = bc.heading?.trim() || t('blog.title');
  const blogIntro = bc.intro?.trim() || t('blog.subtitle');
  const customPosts = storePosts(bc);
  // The sample journal is only for theme previews; a live store shows its own posts or nothing.
  const demo = previewOrDev();

  return (
    <Section>
      <Seo
        title="Journal"
        path="/blog"
        description={blogIntro}
        jsonLd={[breadcrumbSchema([{ label: 'Home', url: '/' }, { label: 'Journal', url: '/blog' }], site())]}
      />
      <Container>
        <header className="sf-page-head">
          <h1 className="sf-page-head__title">{blogHeading}</h1>
          <p className="sf-page-head__sub">{blogIntro}</p>
        </header>

        {customPosts.length || !demo ? (
          customPosts.length ? (
            <div className="sf-blog__grid">
              {customPosts.map((post) => <StorePostCard key={post.slug} post={post} />)}
            </div>
          ) : (
            <EmptyState title={t('blog.empty')} description={t('blog.emptyHint')} actions={<ButtonLink href="/">{t('blog.continueShopping')}</ButtonLink>} />
          )
        ) : (<>
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
                title={t('blog.noArticles')}
                description={
                  query
                    ? t('blog.noArticlesQuery', { query })
                    : t('blog.noArticlesFilters')
                }
                actions={
                  <Button
                    onClick={() => {
                      setParams(new URLSearchParams());
                    }}
                  >
                    {t('blog.clearFilters')}
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

          <aside className="sf-blog__aside" aria-label={t('blog.journalFilters')}>
            <div className="sf-blogside">
              <h2 className="sf-blogside__title">{t('search.title')}</h2>
              <Input
                label={t('blog.searchArticles')}
                type="search"
                value={query}
                onChange={(e) => setParam('q', e.target.value)}
              />
            </div>

            <div className="sf-blogside">
              <h2 className="sf-blogside__title">{t('nav.categories')}</h2>
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
              <h2 className="sf-blogside__title">{t('blog.trending')}</h2>
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
              <h2 className="sf-blogside__title">{t('blog.tags')}</h2>
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
        </>)}
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

/** Paragraphs for a plain-text body; merchant rich text (HTML) goes through the shared sanitizer. */
function PostBody(props: { body: string }): ReactElement {
  const body = props.body.trim();
  if (/<[a-z][\s\S]*>/i.test(body)) {
    return <div className="sf-prose" dangerouslySetInnerHTML={{ __html: sanitizeHtml(body, { formatting: true }) }} />;
  }
  return (
    <div className="sf-prose">
      {body.split(/\n{2,}/).map((paragraph, index) => (
        <p key={index} className="sf-prose__p">{paragraph}</p>
      ))}
    </div>
  );
}

function StorePostDetail(props: { post: StorePost }): ReactElement {
  const { t } = useTranslation();
  const { store } = useStore();
  const { post } = props;
  const title = post.title ?? '';
  const path = `/blog/${encodeURIComponent(post.slug ?? '')}`;
  const url = `${site()}${path}`;
  const description = post.seo_description?.trim() || post.excerpt?.trim() || '';

  return (
    <Section>
      <Seo
        title={post.seo_title?.trim() || title}
        path={path}
        description={description}
        {...(post.image?.trim() ? { image: post.image } : {})}
        type="article"
        jsonLd={[
          breadcrumbSchema([{ label: 'Home', url: '/' }, { label: 'Journal', url: '/blog' }, { label: title, url: path }], site()),
          articleSchema({ title, description, url, ...(post.image?.trim() ? { image: post.image } : {}), published: post.date ?? '', authorName: store.name, siteName: store.name }),
        ]}
      />
      <Container narrow>
        <nav className="sf-crumbs" aria-label={t('misc.breadcrumb')}>
          <ol>
            <li><Link to="/">{t('nav.home')}</Link></li>
            <li><Link to="/blog">{t('blog.journal')}</Link></li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <article className="sf-article">
          <header className="sf-article__head">
            <h1 className="sf-article__title">{title}</h1>
            {post.excerpt?.trim() ? <p className="sf-article__standfirst">{post.excerpt}</p> : null}
            {post.date?.trim() ? <p className="sf-article__meta"><time dateTime={post.date}>{post.date}</time></p> : null}
          </header>
          {post.image?.trim() ? (
            <figure className="sf-article__cover">
              <StoreImage src={post.image} alt="" eager />
            </figure>
          ) : null}
          {post.body?.trim() ? <PostBody body={post.body} /> : null}
          <p className="sf-article__back"><ButtonLink href="/blog" variant="secondary">{t('blog.backToJournal')}</ButtonLink></p>
        </article>
      </Container>
    </Section>
  );
}

export function BlogDetailPage(): ReactElement {
  const { t } = useTranslation();
  const { slug = '' } = useParams();
  const { store } = useStore();
  const { content, loading } = useStoreContentState<BlogContent>('blog');
  const post = storePosts(content).find((item) => item.slug === slug);
  // The sample journal only answers in theme previews; live stores serve their own posts.
  const article = !post && previewOrDev() ? getArticle(slug) : undefined;

  if (post) return <StorePostDetail post={post} />;
  if (!article && loading) {
    return (
      <Section>
        <Container narrow><div className="sf-article" aria-busy="true" /></Container>
      </Section>
    );
  }

  if (!article) {
    return (
      <Section>
        <Seo title="Article not found" path={`/blog/${slug}`} noindex />
        <Container narrow>
          <EmptyState
            variant="search"
            title={t('blog.articleNotFound')}
            description={t('blog.articleNotFoundHint')}
            actions={<ButtonLink href="/blog">{t('blog.backToJournal')}</ButtonLink>}
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
    { label: t('blog.shareOnX'), href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}` },
    { label: t('blog.shareOnFacebook'), href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: t('blog.shareByEmail'), href: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(url)}` },
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
        <nav className="sf-crumbs" aria-label={t('misc.breadcrumb')}>
          <ol>
            <li>
              <Link to="/">{t('nav.home')}</Link>
            </li>
            <li>
              <Link to="/blog">{t('blog.journal')}</Link>
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
                <nav className="sf-toc" aria-label={t('blog.onThisPage')}>
                  <h2 className="sf-toc__title">{t('blog.onThisPage')}</h2>
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
                <h2 className="sf-share__title">{t('product.share')}</h2>
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

          <nav className="sf-prevnext" aria-label={t('blog.moreArticles')}>
            {prev ? (
              <Link className="sf-prevnext__item" to={`/blog/${prev.slug}`}>
                <span className="sf-prevnext__label">{t('common.previous')}</span>
                <span className="sf-prevnext__title">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link className="sf-prevnext__item sf-prevnext__item--next" to={`/blog/${next.slug}`}>
                <span className="sf-prevnext__label">{t('common.next')}</span>
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
              {t('blog.relatedReading')}
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
