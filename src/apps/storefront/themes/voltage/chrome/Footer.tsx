/** Voltage Footer — dark, mono group titles, cyan accents. */
import type { ReactElement, ReactNode } from 'react';
import { Container } from '../components/Container';
import { IconBolt } from '../components/icons';
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
    <footer className="vlt-footer" aria-label="Footer">
      <Container>
        <div className="vlt-footer__grid">
          <div>
            <div className="vlt-footer__brand"><span aria-hidden style={{ color: 'var(--primary)', display: 'inline-flex' }}><IconBolt width={18} height={18} /></span>{storeName}</div>
            {blurb ? <p className="vlt-footer__blurb">{blurb}</p> : null}
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <div className="vlt-footer__group-title">{group.title}</div>
              {group.links.map((link) => (
                <a key={link.url} href={link.url} className="vlt-footer__link">{link.label}</a>
              ))}
            </nav>
          ))}
        </div>
        <div className="vlt-footer__legal">
          <span>© {year} {storeName}</span>
          <span className="vlt-num">All systems nominal</span>
        </div>
      </Container>
    </footer>
  );
}
