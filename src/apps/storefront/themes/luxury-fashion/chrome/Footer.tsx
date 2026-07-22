/**
 * Footer — global bottom chrome: brand blurb, multi-column link lists (serif micro-headings, sans
 * links), and a hairline-separated legal row. §32.8.
 */
import type { ReactElement, ReactNode } from 'react';
import { Container } from '../components/Container';
import type { FooterGroup } from '../../../types/navigation';

export interface FooterProps {
  storeName: string;
  blurb?: string;
  groups: ReadonlyArray<FooterGroup>;
  legal?: string;
  /** Optional slot (e.g. a Newsletter) rendered above the columns. */
  children?: ReactNode;
}

export function Footer(props: FooterProps): ReactElement {
  const { storeName, blurb, groups, legal, children } = props;
  const year = new Date().getFullYear();

  return (
    <footer className="sf-footer" aria-label="Footer">
      <Container>
        {children ? <div className="sf-footer__slot">{children}</div> : null}
        <div className="sf-footer__grid">
          <div>
            <div className="sf-footer__brand-name">{storeName}</div>
            {blurb ? <p className="sf-footer__brand-blurb">{blurb}</p> : null}
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <div className="sf-footer__group-title">{group.title}</div>
              {group.links.map((link) => (
                <a key={link.url} href={link.url} className="sf-footer__link">
                  {link.label}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="sf-footer__legal">
          <span>© {year} {storeName}. All rights reserved.</span>
          {legal ? <span>{legal}</span> : null}
        </div>
      </Container>
    </footer>
  );
}
