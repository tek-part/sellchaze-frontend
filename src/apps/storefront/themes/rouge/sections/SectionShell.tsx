/** Rouge SectionShell — a Section + Container + optional centered SectionHead wrapper for rails/blocks. */
import type { ReactElement, ReactNode } from 'react';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import { SectionHead } from '../components/SectionHead';

export interface SectionShellProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  viewAllHref?: string;
  tight?: boolean;
  children: ReactNode;
}

export function SectionShell(props: SectionShellProps): ReactElement {
  const { eyebrow, title, intro, viewAllHref, tight = false, children } = props;
  return (
    <Section tight={tight}>
      <Container>
        {title || eyebrow ? (
          <SectionHead
            align="center"
            {...(eyebrow ? { eyebrow } : {})}
            title={title ?? eyebrow ?? ''}
            {...(intro ? { intro } : {})}
            {...(viewAllHref ? { viewAllHref } : {})}
            className="rge-section__head-wrap"
          />
        ) : null}
        {children}
      </Container>
    </Section>
  );
}
