/**
 * Static content pages — About, Contact, FAQ. Real, self-contained content (no CMS endpoint exists
 * in the storefront API, so these are first-party editorial pages, not placeholders).
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import {
  Accordion,
  Button,
  ButtonLink,
  Container,
  EmptyState,
  Input,
  Section,
  Textarea,
} from '../themes/luxury-fashion/components';
import { Seo } from '../seo/Seo';
import { useStoreContent } from '../content/useStoreContent';
import { fillTokens, getPolicy } from '../content/policies';
import { useLocale } from '../i18n/useLocale';
import { useTranslation } from 'react-i18next';
import { useStore } from '../state/store-context';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import type { PageDefinition } from '../theme-engine';
import { flowContext } from './flow-context';

interface FaqOverride {
  heading?: string;
  items?: Array<{ question?: string; answer?: string }>;
}

/**
 * Fold a store's saved FAQ content into a theme's `faq` template so the themed page (voltage et al.)
 * renders the merchant's own questions instead of the template's placeholders. Theme-agnostic: it
 * only rewrites the `faq`-type section's `title`/`items`, leaving every theme's FaqSection untouched.
 */
function withFaqOverride(page: PageDefinition, override: FaqOverride | null): PageDefinition {
  if (!override) return page;
  const items = (override.items ?? [])
    .map((x) => ({ q: (x.question || '').trim(), a: (x.answer || '').trim() }))
    .filter((x) => x.q && x.a);
  const heading = (override.heading || '').trim();
  if (items.length === 0 && !heading) return page;
  const itemsStr = items.map((x) => `${x.q} | ${x.a}`).join('\n');
  return {
    ...page,
    sections: page.sections.map((s) =>
      s.type === 'faq'
        ? {
            ...s,
            settings: {
              ...s.settings,
              ...(heading ? { title: heading } : {}),
              ...(itemsStr ? { items: itemsStr } : {}),
            },
          }
        : s,
    ),
  };
}

/** Render the active theme's static template when it provides one; otherwise null (luxury fallback). */
function useStaticTemplate(name: 'blog' | 'about' | 'contact' | 'faq'): ReactElement | null {
  const tpl = useTemplate(name);
  const { store } = useStore();
  if (!tpl) return null;
  return <ThemeRenderer page={tpl} context={flowContext(store)} />;
}

/**
 * Policy pages (/pages/:slug) — Privacy, Terms, Shipping, Returns, Refunds, Cookies, Warranty,
 * Accessibility. Every theme's footer links here, so the route must exist or those links 404.
 *
 * Deliberately does NOT ship generated legal text. A privacy policy or terms document is a binding
 * legal statement about how a specific merchant actually operates; auto-generating one that a
 * merchant might publish unreviewed would be worse than showing nothing. Until a CMS endpoint exists
 * the page renders the store's own content when present and an honest, finished empty state
 * otherwise — with a route to a human.
 */
/**
 * Format the revision date for the reader's locale.
 *
 * `Intl.DateTimeFormat` rather than a hand-kept month table: it produces the right month names and
 * the right order for every locale, and keeps Western Arabic numerals (`ar-u-nu-latn`) which is
 * what Gulf and Levantine commerce actually uses on invoices.
 */
function formatUpdated(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const tag = locale === 'ar' ? 'ar-u-nu-latn' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', year: 'numeric' }).format(
      new Date(Date.UTC(y, m - 1, d)),
    );
  } catch {
    return iso;
  }
}

/** Slugs whose content is editable per-store from the dashboard (Standard pages). */
const EDITABLE_POLICIES = new Set(['shipping', 'returns']);

interface PolicyOverride {
  title?: string;
  summary?: string;
  sections?: Array<{ heading?: string; body?: string[] | string; list?: string[] | string }>;
}

/** Merge a store's saved payload over the shipped policy doc; unset fields keep the default. */
function mergePolicy(
  staticDoc: ReturnType<typeof getPolicy>,
  override: PolicyOverride | null,
  slug: string,
): ReturnType<typeof getPolicy> {
  if (!override) return staticDoc;
  const asLines = (v: string[] | string | undefined): string[] =>
    (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map((s) => s.trim()).filter(Boolean);
  const sections = (Array.isArray(override.sections) ? override.sections : [])
    .map((s) => ({ heading: (s.heading || '').trim(), body: asLines(s.body), list: asLines(s.list) }))
    .filter((s) => s.heading || s.body.length || s.list.length)
    .map((s) => ({ heading: s.heading, body: s.body, ...(s.list.length ? { list: s.list } : {}) }));
  return {
    title: (override.title || '').trim() || staticDoc?.title || slug,
    slug,
    summary: (override.summary || '').trim() || staticDoc?.summary || '',
    updated: staticDoc?.updated || new Date().toISOString().slice(0, 10),
    sections: sections.length ? sections : (staticDoc?.sections ?? []),
  } as ReturnType<typeof getPolicy>;
}

export function PolicyPage(): ReactElement {
  const { slug = '' } = useParams();
  const { store } = useStore();
  const { locale } = useLocale();
  const { t } = useTranslation();
  const override = useStoreContent<PolicyOverride>(slug, EDITABLE_POLICIES.has(slug));
  const doc = mergePolicy(getPolicy(slug, locale), override, slug);
  const contactEmail = `hello@${store.slug || 'example'}.com`;

  if (!doc) {
    return (
      <Section>
        <Seo title="Information" path={`/pages/${slug}`} noindex />
        <Container narrow>
          <EmptyState
            variant="generic"
            title={t('states.notFoundTitle')}
            description={t('states.notFoundHint')}
            actions={<ButtonLink href="/">{t('states.backToShop')}</ButtonLink>}
          />
        </Container>
      </Section>
    );
  }

  const fill = (s: string): string => fillTokens(s, store.name, contactEmail);

  return (
    <Section>
      <Seo title={doc.title} path={`/pages/${doc.slug}`} description={fill(doc.summary)} />
      <Container narrow>
        <article className="sf-policy">
          <header className="sf-page-head">
            <h1 className="sf-page-head__title">{doc.title}</h1>
            <p className="sf-page-head__sub">{fill(doc.summary)}</p>
            <p className="sf-policy__updated">{t('policy.lastUpdated', { date: formatUpdated(doc.updated, locale) })}</p>
          </header>

          {/*
            A visible, non-dismissible notice. This copy is a well-formed starting document, not
            legal advice — publishing it unreviewed as a binding policy would be a real risk to the
            merchant, so the page says so plainly rather than implying the text is final.
          */}
          <aside className="sf-policy__notice" role="note">
            <strong>{t('policy.noticeTitle')}</strong> {t('policy.noticeBody')}
          </aside>

          <nav className="sf-policy__toc" aria-label={t('blog.onThisPage')}>
            <h2 className="sf-policy__toc-title">{t('blog.onThisPage')}</h2>
            <ol>
              {doc.sections.map((s, i) => (
                <li key={s.heading}>
                  <a href={`#policy-${i}`}>{s.heading}</a>
                </li>
              ))}
            </ol>
          </nav>

          {doc.sections.map((section, i) => (
            <section key={section.heading} className="sf-policy__section" id={`policy-${i}`}>
              <h2 className="sf-policy__heading">{section.heading}</h2>
              {section.body.map((para) => (
                <p key={para.slice(0, 32)} className="sf-policy__para">
                  {fill(para)}
                </p>
              ))}
              {section.list ? (
                <ul className="sf-policy__list">
                  {section.list.map((item) => (
                    <li key={item.slice(0, 32)}>{fill(item)}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <footer className="sf-policy__foot">
            <p>{t('policy.questions')}</p>
            <ButtonLink href="/contact">{t('nav.contact')}</ButtonLink>
          </footer>
        </article>
      </Container>
    </Section>
  );
}

export function BlogPage(): ReactElement {
  const themed = useStaticTemplate('blog');
  if (themed) return themed;
  // The storefront API exposes no articles endpoint yet; render a graceful, finished empty state.
  return (
    <Section>
      <Container narrow>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">The journal</h1>
          <p className="sf-page-head__sub">Stories from the atelier — coming soon.</p>
        </div>
        <EmptyState variant="generic" title="No stories yet" description="Our first journal entries are being written." />
      </Container>
    </Section>
  );
}

export function AboutPage(): ReactElement {
  const { store } = useStore();
  const themed = useStaticTemplate('about');
  if (themed) return themed;
  return (
    <Section>
      <Container narrow>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">The house</h1>
          {store.description ? <p className="sf-page-head__sub">{store.description}</p> : null}
        </div>
        <div className="sf-prose sf-prose--narrow">
          <p>
            {store.name} began with a single conviction: that fewer, finer things — cut from natural fibres and made
            to last — are a quieter kind of luxury. Each piece is designed in-house and made by hands that have
            practised their craft for a lifetime.
          </p>
          <p>
            We work in small runs, with mills we know by name, and we design for longevity rather than season. What
            we make is meant to be worn, repaired, and kept — an antidote to the disposable.
          </p>
        </div>
      </Container>
    </Section>
  );
}

export function ContactPage(): ReactElement {
  const themed = useStaticTemplate('contact');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    // No contact endpoint in the storefront API — open the client's mail app with the message.
    const subject = encodeURIComponent(`Enquiry from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:client.care@selchase.example?subject=${subject}&body=${body}`;
  };

  if (themed) return themed;

  return (
    <Section>
      <Container narrow>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">Contact</h1>
          <p className="sf-page-head__sub">Our client care team replies within one business day.</p>
        </div>
        <form className="sf-auth" onSubmit={submit} noValidate>
          <Input label="Your name" value={form.name} onChange={set('name')} required />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required />
          <Textarea label="How can we help?" rows={5} value={form.message} onChange={set('message')} required />
          <Button type="submit">Send message</Button>
        </form>
      </Container>
    </Section>
  );
}

const FAQ_ITEMS = [
  { id: 'ship', header: 'Where do you ship?', content: 'We ship to more than 40 countries. Duties and taxes are calculated at checkout for a landed price.' },
  { id: 'returns', header: 'What is your returns policy?', content: 'Return any unworn piece within 14 days for a full refund. Returns are complimentary within the EU and US.' },
  { id: 'sizing', header: 'How do I find my size?', content: 'Each product page includes detailed measurements. If you are between sizes, we recommend sizing up for outerwear.' },
  { id: 'care', header: 'How should I care for natural fibres?', content: 'Every piece ships with considered care instructions. As a rule, cold hand-wash or professional cleaning preserves natural fibres longest.' },
];

export function FaqPage(): ReactElement {
  const { t } = useTranslation();
  const tpl = useTemplate('faq');
  const { store } = useStore();
  const override = useStoreContent<FaqOverride>('faq');
  if (tpl) {
    return <ThemeRenderer page={withFaqOverride(tpl, override)} context={flowContext(store)} />;
  }

  const items = override?.items?.length
    ? override.items
        .filter((x) => (x.question || '').trim())
        .map((x, i) => ({ id: `q${i}`, header: (x.question || '').trim(), content: (x.answer || '').trim() }))
    : FAQ_ITEMS;
  const heading = (override?.heading || '').trim() || t('contact.faqHeading');

  return (
    <Section>
      <Container narrow>
        <div className="sf-page-head">
          <h1 className="sf-page-head__title">{heading}</h1>
        </div>
        <Accordion items={items} type="single" defaultOpen={items[0] ? [items[0].id] : []} />
      </Container>
    </Section>
  );
}
