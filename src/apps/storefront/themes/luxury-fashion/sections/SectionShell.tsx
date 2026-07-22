/**
 * SectionShell — the common frame most sections share: a Section (vertical rhythm) wrapping a
 * Container (measure) with an optional SectionHead. Keeps every section's outer structure identical
 * so spacing/heads stay consistent and sections focus on their content. Supports a coloured band.
 */
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { SectionHead } from '../components/SectionHead';
import { useReveal } from '../components/useReveal';

export interface SectionShellProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  intro?: ReactNode;
  align?: 'start' | 'center';
  headingLevel?: 'h1' | 'h2' | 'h3';
  viewAllHref?: string;
  viewAllLabel?: string;
  narrow?: boolean;
  tight?: boolean;
  /** Fill the full-bleed section with a background band. */
  band?: boolean;
  bandColor?: string;
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}

export function SectionShell(props: SectionShellProps): ReactElement {
  const {
    eyebrow,
    title,
    intro,
    align = 'start',
    headingLevel,
    viewAllHref,
    viewAllLabel,
    narrow = false,
    tight = false,
    band = false,
    bandColor,
    id,
    className,
    containerClassName,
    children,
  } = props;

  const style: CSSProperties | undefined =
    band && bandColor ? ({ '--sf-band-bg': bandColor } as CSSProperties) : undefined;
  const hasHead = Boolean(title) || Boolean(eyebrow);
  const revealRef = useReveal<HTMLElement>();

  return (
    <section
      ref={revealRef}
      id={id}
      className={cn('sf-section', 'sf-reveal', tight && 'sf-section--tight', band && 'sf-section--band', className)}
      style={style}
    >
      <Container narrow={narrow} className={containerClassName}>
        {hasHead ? (
          <SectionHead
            {...(eyebrow ? { eyebrow } : {})}
            title={title}
            {...(intro ? { intro } : {})}
            align={align}
            {...(headingLevel ? { headingLevel } : {})}
            {...(viewAllHref ? { viewAllHref } : {})}
            {...(viewAllLabel ? { viewAllLabel } : {})}
            className="sf-section__head"
          />
        ) : null}
        {children}
      </Container>
    </section>
  );
}
