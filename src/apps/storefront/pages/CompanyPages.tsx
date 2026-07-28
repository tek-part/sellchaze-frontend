/**
 * About and Contact — the company pages.
 *
 * Both were single-section stubs: About was an h1, a subtitle and two paragraphs with no imagery;
 * Contact was an h1 and three form fields. They now carry the full corporate surface a premium
 * theme is expected to demonstrate.
 *
 * Content comes from `content/company`. Presentation uses the shared `.sf-*` library and
 * token-driven CSS in `styles/company.css`, so each theme re-skins the same markup in its own
 * language rather than four copies of the layout existing.
 */
import { useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonLink, Container, Input, Section, StoreImage, Textarea } from '../themes/luxury-fashion/components';
import { Seo } from '../seo/Seo';
import { breadcrumbSchema, faqSchema } from '../seo/schema';
import { useStore } from '../state/store-context';
import { useThemeManifest } from '../theme-engine';
import { catalogFor } from '../content/demo';
import { COMPANY, mapEmbedUrl, mapLinkUrl, type StoreLocation } from '../content/company';
import { useStoreContent } from '../content/useStoreContent';

interface AboutContent {
  heading?: string; subheading?: string; hero_image?: string; mission?: string; vision?: string;
  story?: string[]; values?: Array<{ title?: string; body?: string }>; stats?: Array<{ value?: string; label?: string }>;
  founded?: string; story_image?: string; craft_image?: string;
  milestones?: Array<{ year?: string; title?: string; body?: string }>;
  leadership?: Array<{ name?: string; role?: string; bio?: string; photo?: string }>;
  awards?: Array<{ year?: string; title?: string; body?: string }>;
  partners?: string[];
  craft_title?: string; craft_body?: string[];
  testimonials?: Array<{ quote?: string; author?: string; detail?: string }>;
  story_eyebrow?: string; story_heading?: string; values_eyebrow?: string; values_heading?: string;
  milestones_eyebrow?: string; milestones_heading?: string; leadership_eyebrow?: string; leadership_heading?: string;
  craft_eyebrow?: string; awards_eyebrow?: string; awards_heading?: string;
  testimonials_eyebrow?: string; testimonials_heading?: string; partners_eyebrow?: string; partners_heading?: string;
  cta_title?: string; cta_text?: string;
}
interface ContactContent {
  heading?: string; intro?: string; email?: string; phone?: string; address?: string; hours?: string;
  map_embed?: string; show_form?: boolean; notice_title?: string; notice_body?: string;
  departments?: Array<{ name?: string; description?: string; email?: string; phone?: string; hours?: string }>;
  locations?: Array<{ name?: string; address?: string; city?: string; country?: string; phone?: string; hours?: string; lat?: string; lon?: string }>;
  hero_eyebrow?: string; departments_eyebrow?: string; departments_heading?: string;
  form_heading?: string; locations_heading?: string; faq_eyebrow?: string; faq_heading?: string;
}

/** Return a trimmed override or the shipped default. */
const L = (v: string | undefined, d: string): string => (v && v.trim() ? v.trim() : d);

function site(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/* ------------------------------------------------------------------ shared blocks */

function Crumbs(props: { label: string }): ReactElement {
  return (
    <nav className="sf-crumbs" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li aria-current="page">{props.label}</li>
      </ol>
    </nav>
  );
}

function StoreMap(props: { location: StoreLocation }): ReactElement {
  const { location } = props;
  return (
    <div className="sf-map">
      {/*
        The map is an enhancement. The address, phone and hours are all in the markup around it, so
        a blocked frame (corporate proxy, strict CSP, privacy extension) costs nothing but the tiles.
      */}
      <iframe
        className="sf-map__frame"
        title={`Map showing ${location.name}, ${location.city}`}
        src={mapEmbedUrl(location)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a className="sf-map__link" href={mapLinkUrl(location)} rel="noreferrer noopener" target="_blank">
        Open {location.city} in maps
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ About */

export function AboutPage(): ReactElement {
  const { store } = useStore();
  const manifest = useThemeManifest();
  const catalog = catalogFor(manifest.id);

  // Merge the store's editable content over the shipped defaults (unset -> default).
  const c = useStoreContent<AboutContent>('about') ?? {};
  const mission = c.mission?.trim() || COMPANY.mission;
  const vision = c.vision?.trim() || COMPANY.vision;
  const heroImage = c.hero_image?.trim() || COMPANY.heroImage;
  const heroTitle = c.heading?.trim() || 'Fewer, better things — and the truth about them';
  const heroSub = c.subheading?.trim() || mission;
  const story = (Array.isArray(c.story) && c.story.filter(Boolean).length ? c.story.filter(Boolean) : COMPANY.story) as ReadonlyArray<string>;
  const stats = (Array.isArray(c.stats) && c.stats.length ? c.stats : COMPANY.stats) as ReadonlyArray<{ value: string; label: string }>;
  const values = (Array.isArray(c.values) && c.values.length ? c.values : COMPANY.values) as ReadonlyArray<{ title: string; body: string }>;
  const founded = c.founded?.trim() || COMPANY.founded;
  const storyImage = c.story_image?.trim() || COMPANY.storyImage;
  const craftImage = c.craft_image?.trim() || COMPANY.craftImage;
  const milestones = (Array.isArray(c.milestones) && c.milestones.length ? c.milestones : COMPANY.milestones) as ReadonlyArray<{ year: string; title: string; body: string }>;
  const leadership = (Array.isArray(c.leadership) && c.leadership.length ? c.leadership : COMPANY.leadership) as ReadonlyArray<{ name: string; role: string; bio: string; photo: string }>;
  const awards = (Array.isArray(c.awards) && c.awards.length ? c.awards : COMPANY.awards) as ReadonlyArray<{ year: string; title: string; body: string }>;
  const partners = (Array.isArray(c.partners) && c.partners.filter(Boolean).length ? c.partners.filter(Boolean) : COMPANY.partners) as ReadonlyArray<string>;
  const testimonials = (Array.isArray(c.testimonials) && c.testimonials.length ? c.testimonials : catalog.testimonials.slice(0, 3)) as ReadonlyArray<{ quote: string; author: string; detail: string }>;
  const craftTitle = c.craft_title?.trim() || 'What we will and will not claim';
  const craftBody = (Array.isArray(c.craft_body) && c.craft_body.filter(Boolean).length
    ? c.craft_body.filter(Boolean)
    : [
        'Every product page carries full composition, the country of manufacture and the care instructions.',
        'Our repair service has handled more than 11,000 pieces, and we hold spare components for discontinued lines.',
      ]) as ReadonlyArray<string>;

  return (
    <>
      <Seo
        title="About us"
        path="/about"
        description={mission}
        image={heroImage}
        jsonLd={[breadcrumbSchema([{ label: 'Home', url: '/' }, { label: 'About us', url: '/about' }], site())]}
      />

      {/* Hero */}
      <section className="sf-cohero">
        <StoreImage className="sf-cohero__img" src={heroImage} alt="" eager />
        <div className="sf-cohero__scrim" aria-hidden />
        <Container className="sf-cohero__inner">
          <span className="sf-cohero__eyebrow">Since {founded}</span>
          <h1 className="sf-cohero__title">{heroTitle}</h1>
          <p className="sf-cohero__sub">{heroSub}</p>
        </Container>
      </section>

      <Section>
        <Container>
          <Crumbs label="About us" />

          {/* Story */}
          <div className="sf-costory">
            <div className="sf-costory__copy">
              <span className="sf-eyebrow">{L(c.story_eyebrow, 'Our story')}</span>
              <h2 className="sf-coheading">{L(c.story_heading, 'How we got here')}</h2>
              {story.map((para) => (
                <p key={para.slice(0, 28)} className="sf-coprose">
                  {para}
                </p>
              ))}
            </div>
            <figure className="sf-costory__media">
              <StoreImage src={storyImage} alt="Rolls of material stacked in a workshop" />
            </figure>
          </div>
        </Container>
      </Section>

      {/* Statistics */}
      <Section className="sf-coband">
        <Container>
          <ul className="sf-costats">
            {stats.map((s) => (
              <li key={s.label} className="sf-costat">
                <span className="sf-costat__value">{s.value}</span>
                <span className="sf-costat__label">{s.label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Mission & vision */}
      <Section>
        <Container>
          <div className="sf-comv">
            <article className="sf-comv__card">
              <span className="sf-eyebrow">Mission</span>
              <p className="sf-comv__text">{mission}</p>
            </article>
            <article className="sf-comv__card">
              <span className="sf-eyebrow">Vision</span>
              <p className="sf-comv__text">{vision}</p>
            </article>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section className="sf-coband">
        <Container>
          <header className="sf-cosection-head">
            <span className="sf-eyebrow">{L(c.values_eyebrow, 'What we hold to')}</span>
            <h2 className="sf-coheading">{L(c.values_heading, 'Our values')}</h2>
          </header>
          <ul className="sf-covalues">
            {values.map((v, i) => (
              <li key={v.title} className="sf-covalue">
                <span className="sf-covalue__num" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="sf-covalue__title">{v.title}</h3>
                <p className="sf-covalue__body">{v.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Timeline */}
      <Section>
        <Container>
          <header className="sf-cosection-head">
            <span className="sf-eyebrow">{L(c.milestones_eyebrow, 'Milestones')}</span>
            <h2 className="sf-coheading">{L(c.milestones_heading, 'Ten years, in order')}</h2>
          </header>
          <ol className="sf-cotimeline">
            {milestones.map((m) => (
              <li key={m.year} className="sf-comilestone">
                <span className="sf-comilestone__year">{m.year}</span>
                <div className="sf-comilestone__body">
                  <h3 className="sf-comilestone__title">{m.title}</h3>
                  <p>{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* Leadership */}
      <Section className="sf-coband">
        <Container>
          <header className="sf-cosection-head">
            <span className="sf-eyebrow">{L(c.leadership_eyebrow, 'The team')}</span>
            <h2 className="sf-coheading">{L(c.leadership_heading, 'Who runs the place')}</h2>
          </header>
          <ul className="sf-coteam">
            {leadership.map((p) => (
              <li key={p.name} className="sf-coperson">
                <div className="sf-coperson__media">
                  <StoreImage src={p.photo} alt={`${p.name}, ${p.role}`} />
                </div>
                <h3 className="sf-coperson__name">{p.name}</h3>
                <span className="sf-coperson__role">{p.role}</span>
                <p className="sf-coperson__bio">{p.bio}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Craft / quality */}
      <Section>
        <Container>
          <div className="sf-costory sf-costory--reverse">
            <figure className="sf-costory__media">
              <StoreImage src={craftImage} alt="Close detail of finished material" />
            </figure>
            <div className="sf-costory__copy">
              <span className="sf-eyebrow">{L(c.craft_eyebrow, 'Quality & sustainability')}</span>
              <h2 className="sf-coheading">{craftTitle}</h2>
              {craftBody.map((para) => (
                <p key={para.slice(0, 28)} className="sf-coprose">{para}</p>
              ))}
              <ButtonLink href="/pages/sustainability">Read our approach</ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      {/* Awards */}
      <Section className="sf-coband">
        <Container>
          <header className="sf-cosection-head">
            <span className="sf-eyebrow">{L(c.awards_eyebrow, 'Recognition')}</span>
            <h2 className="sf-coheading">{L(c.awards_heading, 'Awards & accreditation')}</h2>
          </header>
          <ul className="sf-coawards">
            {awards.map((a) => (
              <li key={a.title} className="sf-coaward">
                <span className="sf-coaward__year">{a.year}</span>
                <h3 className="sf-coaward__title">{a.title}</h3>
                <p className="sf-coaward__body">{a.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Testimonials — drawn from the active theme's catalogue, so they match the vertical. */}
      {testimonials.length > 0 ? (
        <Section>
          <Container>
            <header className="sf-cosection-head">
              <span className="sf-eyebrow">{L(c.testimonials_eyebrow, 'In their words')}</span>
              <h2 className="sf-coheading">{L(c.testimonials_heading, 'What customers say')}</h2>
            </header>
            <ul className="sf-coquotes">
              {testimonials.map((t) => (
                <li key={t.quote.slice(0, 24)} className="sf-coquote">
                  <blockquote>{t.quote}</blockquote>
                  <figcaption>
                    <span className="sf-coquote__author">{t.author}</span>
                    <span className="sf-coquote__detail">{t.detail}</span>
                  </figcaption>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* Partners / certifications */}
      <Section className="sf-coband">
        <Container>
          <header className="sf-cosection-head">
            <span className="sf-eyebrow">{L(c.partners_eyebrow, 'Standards we work to')}</span>
            <h2 className="sf-coheading">{L(c.partners_heading, 'Partners & certification')}</h2>
          </header>
          <ul className="sf-copartners">
            {partners.map((p) => (
              <li key={p} className="sf-copartner">
                {p}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="sf-coband">
        <Container>
          <div className="sf-cocta">
            <h2 className="sf-cocta__title">{L(c.cta_title, 'Questions about anything here?')}</h2>
            <p className="sf-cocta__text">
              {L(c.cta_text, `Customer care is the largest team at ${store.name} and reachable by phone, not just a form.`)}
            </p>
            <div className="sf-cocta__actions">
              <ButtonLink href="/contact">Contact us</ButtonLink>
              <ButtonLink href="/collections/all" variant="secondary">
                Shop the range
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------ Contact */

export function ContactPage(): ReactElement {
  const { store } = useStore();
  const manifest = useThemeManifest();
  const catalog = catalogFor(manifest.id);
  const cc = useStoreContent<ContactContent>('contact') ?? {};
  const faqSource = useStoreContent<{ items?: Array<{ question?: string; answer?: string }> }>('faq');
  const faqs = useMemo(() => {
    const items = (faqSource?.items ?? []).filter((x) => (x.question || '').trim());
    return items.length ? items.map((x) => ({ question: x.question || '', answer: x.answer || '' })) : catalog.faqs.slice(0, 6);
  }, [faqSource, catalog]);
  const heroTitle = cc.heading?.trim() || 'Talk to a person';
  const heroSub = cc.intro?.trim() || 'Six teams, four studios and a real phone number. Pick whoever fits your question.';
  const showForm = cc.show_form !== false;
  const hasContactInfo = !!(cc.email?.trim() || cc.phone?.trim() || cc.address?.trim() || cc.hours?.trim());
  const notice = { title: cc.notice_title?.trim() || COMPANY.notice.title, body: cc.notice_body?.trim() || COMPANY.notice.body };
  const departments = (Array.isArray(cc.departments) && cc.departments.length ? cc.departments : COMPANY.departments) as ReadonlyArray<{ name: string; description: string; email: string; phone: string; hours: string }>;
  const locations = ((Array.isArray(cc.locations) && cc.locations.length ? cc.locations : COMPANY.locations).map((l) => ({
    name: (l as { name?: string }).name || '', address: (l as { address?: string }).address || '',
    city: (l as { city?: string }).city || '', country: (l as { country?: string }).country || '',
    phone: (l as { phone?: string }).phone || '', hours: (l as { hours?: string }).hours || '',
    lat: Number((l as { lat?: string | number }).lat) || 0, lon: Number((l as { lon?: string | number }).lon) || 0,
  }))) as StoreLocation[];

  const [active, setActive] = useState(0);
  const location: StoreLocation = locations[active] ?? locations[0] ?? {
    name: '', address: '', city: '', country: '', phone: '', hours: '', lat: 0, lon: 0,
  };

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please complete your name, email and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(undefined);
    setSent(true);
  };

  return (
    <>
      <Seo
        title="Contact us"
        path="/contact"
        description={`Reach ${store.name} — customer care, sales, wholesale, press and careers.`}
        jsonLd={[
          breadcrumbSchema([{ label: 'Home', url: '/' }, { label: 'Contact', url: '/contact' }], site()),
          faqSchema(faqs.map((f) => ({ question: f.question, answer: f.answer }))),
        ]}
      />

      <section className="sf-cohero sf-cohero--short">
        <StoreImage className="sf-cohero__img" src={COMPANY.storyImage} alt="" eager />
        <div className="sf-cohero__scrim" aria-hidden />
        <Container className="sf-cohero__inner">
          <span className="sf-cohero__eyebrow">{L(cc.hero_eyebrow, 'We reply within one business day')}</span>
          <h1 className="sf-cohero__title">{heroTitle}</h1>
          <p className="sf-cohero__sub">{heroSub}</p>
        </Container>
      </section>

      <Section>
        <Container>
          <Crumbs label="Contact" />

          {/* Store's own contact details (editable from the dashboard). */}
          {hasContactInfo ? (
            <dl className="sf-codept__meta" style={{ marginBottom: '1.5rem' }}>
              {cc.email?.trim() ? (<><dt>Email</dt><dd><a href={`mailto:${cc.email.trim()}`}>{cc.email.trim()}</a></dd></>) : null}
              {cc.phone?.trim() ? (<><dt>Phone</dt><dd><a href={`tel:${cc.phone.replace(/\s/g, '')}`}>{cc.phone.trim()}</a></dd></>) : null}
              {cc.address?.trim() ? (<><dt>Address</dt><dd>{cc.address.trim()}</dd></>) : null}
              {cc.hours?.trim() ? (<><dt>Hours</dt><dd>{cc.hours.trim()}</dd></>) : null}
            </dl>
          ) : null}

          {/* Service notice */}
          <aside className="sf-conotice" role="note">
            <strong>{notice.title}</strong>
            <p>{notice.body}</p>
          </aside>

          {/* Departments */}
          <header className="sf-cosection-head">
            <span className="sf-eyebrow">{L(cc.departments_eyebrow, 'Departments')}</span>
            <h2 className="sf-coheading">{L(cc.departments_heading, 'Who to contact')}</h2>
          </header>
          <ul className="sf-codepts">
            {departments.map((d) => (
              <li key={d.name} className="sf-codept">
                <h3 className="sf-codept__name">{d.name}</h3>
                <p className="sf-codept__desc">{d.description}</p>
                <dl className="sf-codept__meta">
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${d.email}`}>{d.email}</a>
                  </dd>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${d.phone.replace(/\s/g, '')}`}>{d.phone}</a>
                  </dd>
                  <dt>Hours</dt>
                  <dd>{d.hours}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Form + locations */}
      <Section className="sf-coband">
        <Container>
          <div className="sf-cocontact">
            {showForm ? (
            <div className="sf-cocontact__form">
              <h2 className="sf-coheading">{L(cc.form_heading, 'Send a message')}</h2>
              {sent ? (
                <div className="sf-conote" role="status">
                  <p>
                    <strong>Thanks — your message is ready to send.</strong>
                  </p>
                  {/*
                    Honest degradation: there is no contact-submit endpoint in the storefront API, so
                    nothing was transmitted. Rather than claim it was, we hand the composed message to
                    the customer's own mail client, which genuinely does reach us.
                  */}
                  <p>
                    We don’t yet have a form endpoint connected, so nothing has been transmitted.
                    Use the button below to send it from your own mail app — it will reach the same
                    inbox.
                  </p>
                  <ButtonLink
                    href={`mailto:${departments[0]?.email ?? COMPANY.departments[0]!.email}?subject=${encodeURIComponent(
                      form.subject || 'Website enquiry',
                    )}&body=${encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`)}`}
                  >
                    Open in mail app
                  </ButtonLink>
                  <button type="button" className="sf-colink" onClick={() => setSent(false)}>
                    Edit the message
                  </button>
                </div>
              ) : (
                <form className="sf-coform" onSubmit={onSubmit} noValidate>
                  <Input
                    label="Your name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Input
                    label="Subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                  <Textarea
                    label="How can we help?"
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                  {error ? (
                    <p className="sf-coform__error" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit">Send message</Button>
                </form>
              )}
            </div>
            ) : null}

            <div className="sf-cocontact__locations">
              <h2 className="sf-coheading">{L(cc.locations_heading, 'Our studios')}</h2>
              <div className="sf-cotabs" role="tablist" aria-label="Store locations">
                {locations.map((loc, i) => (
                  <button
                    key={`${loc.name}-${i}`}
                    type="button"
                    role="tab"
                    id={`loc-tab-${i}`}
                    aria-selected={active === i}
                    aria-controls={`loc-panel-${i}`}
                    tabIndex={active === i ? 0 : -1}
                    className="sf-cotab"
                    onClick={() => setActive(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') setActive((active + 1) % locations.length);
                      if (e.key === 'ArrowLeft')
                        setActive((active - 1 + locations.length) % locations.length);
                    }}
                  >
                    {loc.city}
                  </button>
                ))}
              </div>

              <div
                className="sf-copanel"
                role="tabpanel"
                id={`loc-panel-${active}`}
                aria-labelledby={`loc-tab-${active}`}
              >
                <h3 className="sf-copanel__name">{location.name}</h3>
                <address className="sf-copanel__address">
                  {location.address}
                  <br />
                  {location.city}, {location.country}
                </address>
                <dl className="sf-copanel__meta">
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${location.phone.replace(/\s/g, '')}`}>{location.phone}</a>
                  </dd>
                  <dt>Opening hours</dt>
                  <dd>{location.hours}</dd>
                </dl>
                {location.lat || location.lon ? <StoreMap location={location} /> : null}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ preview */}
      <Section>
        <Container>
          <header className="sf-cosection-head">
            <span className="sf-eyebrow">{L(cc.faq_eyebrow, 'Before you write')}</span>
            <h2 className="sf-coheading">{L(cc.faq_heading, 'Frequently asked')}</h2>
          </header>
          <ul className="sf-cofaqs">
            {faqs.map((f) => (
              <li key={f.question} className="sf-cofaq">
                <details>
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              </li>
            ))}
          </ul>
          <div className="sf-cocta__actions">
            <ButtonLink href="/faq" variant="secondary">
              All questions
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
