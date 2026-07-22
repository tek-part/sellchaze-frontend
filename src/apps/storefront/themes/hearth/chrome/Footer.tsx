/**
 * Footer — warm, generous link/utility/legal region on the sand band. Brand + mission, a keep-in-touch
 * block, configurable link columns (from the engine nav), social links, accepted-payment marks and a
 * legal row that always carries policy links (locked chrome behaviour). Columns collapse gracefully.
 *
 * Graceful degradation: the storefront API exposes no newsletter-subscribe endpoint, so the sign-up
 * block does NOT fake a subscription. It hands the address to the real `/contact` route, which is a
 * registered page — no invented endpoint, no fabricated success state. Social links and payment marks
 * render only when supplied, so an unconfigured store shows a clean footer rather than dead icons.
 */
import type { ReactElement } from 'react';
import type { FooterGroup } from '../../../types/navigation';
import { Container } from '../components/Container';

export interface SocialLink {
  label: string;
  url: string;
}

export interface FooterProps {
  storeName: string;
  blurb?: string;
  groups: ReadonlyArray<FooterGroup>;
  copyright?: string;
  /**
   * Copyright year, supplied by the caller. Engine invariant I4 forbids a request-time clock inside
   * rendered output (it would break SSR↔Blade byte-parity), so the value is passed in and stays
   * stable for a given render — rather than being frozen in this file's source, where it silently
   * goes stale. Callers resolve it once at the app boundary.
   */
  year?: number;
  social?: ReadonlyArray<SocialLink>;
  /** Accepted payment methods, rendered as accessible text marks (no third-party logo assets). */
  payments?: ReadonlyArray<string>;
  /** Displayed shipping region / currency, e.g. "Ships worldwide · USD". */
  regionNote?: string;
}

const FALLBACK_YEAR = 2026;

export function Footer(props: FooterProps): ReactElement {
  const { storeName, blurb, groups, copyright, social = [], payments = [], regionNote } = props;
  const year = props.year ?? FALLBACK_YEAR;

  return (
    <footer className="hh-footer">
      <Container className="hh-footer__inner">
        <div className="hh-footer__brand">
          <a href="/" className="hh-footer__wordmark">
            {storeName}
          </a>
          {blurb ? <p className="hh-footer__blurb">{blurb}</p> : null}

          <form className="hh-footer__signup" action="/contact" method="get">
            <label className="hh-footer__signup-label" htmlFor="hh-footer-email">
              Keep in touch
            </label>
            <p className="hh-footer__signup-note">
              New arrivals, room guides and care tips — a few times a season, never more.
            </p>
            <div className="hh-footer__signup-row">
              <input
                id="hh-footer-email"
                className="hh-footer__signup-input"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                aria-describedby="hh-footer-signup-help"
              />
              <button type="submit" className="hh-footer__signup-btn">
                Sign up
              </button>
            </div>
            <p id="hh-footer-signup-help" className="hh-footer__signup-help">
              We&rsquo;ll open our contact form so you can confirm your preferences.
            </p>
          </form>
        </div>

        {groups.length > 0 ? (
          <nav className="hh-footer__columns" aria-label="Footer">
            {groups.map((group) => (
              <div key={group.title} className="hh-footer__column">
                <h2 className="hh-footer__column-title">{group.title}</h2>
                <ul className="hh-footer__links">
                  {group.links.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} className="hh-footer__link">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ) : null}
      </Container>

      {social.length > 0 || payments.length > 0 || regionNote ? (
        <Container className="hh-footer__utility">
          {social.length > 0 ? (
            <ul className="hh-footer__social" aria-label="Social media">
              {social.map((s) => (
                <li key={s.url}>
                  <a className="hh-footer__social-link" href={s.url} rel="noreferrer noopener" target="_blank">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {regionNote ? <p className="hh-footer__region">{regionNote}</p> : null}

          {payments.length > 0 ? (
            <ul className="hh-footer__payments" aria-label="Accepted payment methods">
              {payments.map((p) => (
                <li key={p} className="hh-footer__payment">
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
        </Container>
      ) : null}

      <Container className="hh-footer__legal">
        <p className="hh-footer__copy">{copyright || `© ${year} ${storeName}. All rights reserved.`}</p>
        <ul className="hh-footer__policy">
          <li>
            <a href="/pages/privacy">Privacy</a>
          </li>
          <li>
            <a href="/pages/terms">Terms</a>
          </li>
          <li>
            <a href="/pages/accessibility">Accessibility</a>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
