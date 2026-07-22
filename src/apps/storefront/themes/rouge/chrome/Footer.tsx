/** Rouge Footer — petal-deep well, didone wordmark, gilt group titles, soft rouge link hovers. */
import type { ReactElement, ReactNode } from 'react';
import { Container } from '../components/Container';
import type { FooterGroup } from '../../../types/navigation';

export interface FooterProps {
  storeName: string;
  blurb?: string;
  groups: ReadonlyArray<FooterGroup>;
  children?: ReactNode;
}
export function Footer(props: FooterProps): ReactElement {
  const { storeName, blurb, groups } = props;
  const year = new Date().getFullYear();
  return (
    <footer className="rge-footer" aria-label="Footer">
      <Container>
        <div className="rge-footer__grid">
          <div className="rge-footer__intro">
            <div className="rge-footer__brand">{storeName}</div>
            {blurb ? <p className="rge-footer__blurb">{blurb}</p> : null}
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <div className="rge-footer__group-title">{group.title}</div>
              {group.links.map((link) => (
                <a key={link.url} href={link.url} className="rge-footer__link">{link.label}</a>
              ))}
            </nav>
          ))}
        </div>
        <div className="rge-footer__legal">
          <span>© {year} {storeName}</span>
          <span>Made with care · Cruelty-free</span>
        </div>
      </Container>
    </footer>
  );
}
