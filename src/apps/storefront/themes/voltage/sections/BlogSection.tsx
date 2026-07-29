/**
 * Voltage blog — the field journal. Renders a post grid when the page provides `posts` in context
 * data; otherwise a graceful, finished empty state (the storefront API exposes no articles endpoint).
 * Voltage's own .vlt-* markup.
 */
import type { CSSProperties, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { StoreImage } from '../components/Image';

interface BlogPost {
  id: string;
  title: string;
  url: string;
  excerpt?: string;
  image?: { src?: string; alt?: string };
  date?: string;
}

function postsOf(context: SectionRenderProps['context']): ReadonlyArray<BlogPost> {
  const v = (context.data as { posts?: unknown }).posts;
  return Array.isArray(v) ? (v as ReadonlyArray<BlogPost>) : [];
}

export function BlogSection(props: SectionRenderProps): ReactElement {
  const { t } = useTranslation();
  const posts = postsOf(props.context);

  return (
    <Section>
      <Container>
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">{t('blog.voltageEyebrow')}</span>
          <h1 className="vlt-flow-head__title">{t('blog.voltageTitle')}</h1>
        </div>

        {posts.length === 0 ? (
          <div className="vlt-empty vlt-empty--pad">
            <span className="vlt-empty__title">{t('blog.voltageEmpty')}</span>
            <span className="vlt-empty__text">{t('blog.voltageEmptyHint')}</span>
          </div>
        ) : (
          <div className="vlt-grid" style={{ '--vlt-cols': 3, '--vlt-cols-lg': 3, '--vlt-cols-md': 2, '--vlt-cols-sm': 1 } as CSSProperties}>
            {posts.map((post) => (
              <a key={post.id} href={post.url} className="vlt-blogcard">
                <div className="vlt-blogcard__media"><StoreImage className="vlt-blogcard__img" src={post.image?.src} alt="" /></div>
                <div className="vlt-blogcard__body">
                  {post.date ? <span className="vlt-blogcard__date vlt-num">{post.date}</span> : null}
                  <h2 className="vlt-blogcard__title">{post.title}</h2>
                  {post.excerpt ? <p className="vlt-blogcard__excerpt">{post.excerpt}</p> : null}
                </div>
              </a>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
