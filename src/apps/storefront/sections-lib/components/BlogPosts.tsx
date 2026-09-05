/**
 * blog-posts — latest journal articles as cards (image, category, title, excerpt, reading time).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { bool, gridStyle, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibGrid, LibImage, LibSection } from '../primitives';
import { useLibT, useLocaleCode } from '../i18n';

export const blogPostsSchema = defineSection({
  type: 'blog-posts',
  label: 'Blog posts',
  description: 'Latest articles from the store blog.',
  category: 'content',
  icon: 'HiOutlineNewspaper',
  settings: [
    fields.text('title', 'Title', tr('من المدونة', 'From the blog')),
    fields.text('subtitle', 'Subtitle', ''),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 4), '3'),
    fields.range('limit', 'Posts to show', 3, 1, 12),
    fields.toggle('show_excerpt', 'Show excerpt', true),
    fields.toggle('show_meta', 'Show date & reading time', true),
    fields.url('view_all_url', 'View-all link', '/blog'),
    ...spacingFields(),
  ],
});

export function BlogPosts(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(blogPostsSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const locale = useLocaleCode();
  const posts = data.articles(num(s, 'limit', 3));
  if (posts.length === 0) return null;
  const fmtDate = (iso?: string): string => {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
    } catch {
      return iso;
    }
  };
  return (
    <LibSection title={str(s, 'title')} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} style={spacingStyle(s)}>
      <LibGrid style={gridStyle(num(s, 'columns', 3), 1)}>
        {posts.map((p) => (
          <article key={p.id} className="lib-post">
            <a href={p.url} className="lib-post__media" tabIndex={-1} aria-hidden>
              <LibImage src={p.image?.src} alt="" className="lib-post__img" />
            </a>
            <div className="lib-post__body">
              {p.category ? <span className="lib-eyebrow">{p.category}</span> : null}
              <h3 className="lib-post__title"><a href={p.url}>{p.title}</a></h3>
              {bool(s, 'show_excerpt', true) && p.excerpt ? <p className="lib-post__excerpt">{p.excerpt}</p> : null}
              {bool(s, 'show_meta', true) ? (
                <p className="lib-post__meta">
                  {fmtDate(p.publishedAt)}
                  {p.readingMinutes ? <span> · {t('minRead', { n: p.readingMinutes })}</span> : null}
                </p>
              ) : null}
              <a href={p.url} className="lib-link">{t('readMore')} <span aria-hidden className="lib-link__arrow">→</span></a>
            </div>
          </article>
        ))}
      </LibGrid>
    </LibSection>
  );
}
