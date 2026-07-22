/**
 * BlogCard — an article teaser: eyebrow category → serif title → muted meta (date · read-time),
 * excerpt clamped to 2 lines. See §32.4.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ArticleCardModel } from '../../../types/catalog';
import { formatDate, formatReadingTime } from '../../../utils/format';
import { Eyebrow } from './Typography';
import { StoreImage } from './Image';

export interface BlogCardProps {
  article: ArticleCardModel;
  locale?: string;
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

export function BlogCard(props: BlogCardProps): ReactElement {
  const { article, locale, headingLevel: Heading = 'h3', className } = props;
  const meta = [formatDate(article.publishedAt, locale), formatReadingTime(article.readingMinutes)]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className={cn('sf-blog-card', className)}>
      <a href={article.url} className="sf-blog-card__media" tabIndex={-1} aria-hidden>
        <StoreImage className="sf-blog-card__img" src={article.image?.src} alt="" />
      </a>
      {article.category ? <Eyebrow>{article.category}</Eyebrow> : null}
      <Heading className="sf-blog-card__title">
        <a href={article.url}>{article.title}</a>
      </Heading>
      {article.excerpt ? <p className="sf-blog-card__excerpt">{article.excerpt}</p> : null}
      {meta ? <p className="sf-blog-card__meta">{meta}</p> : null}
    </article>
  );
}
