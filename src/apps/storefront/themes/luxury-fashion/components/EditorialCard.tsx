/**
 * EditorialCard — a story / campaign teaser: eyebrow → serif headline → one sentence → ghost link,
 * beside brand photography. media-left / media-right / stacked; stacks on mobile. One idea per card.
 * See §32.4.
 */
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { Eyebrow } from './Typography';
import { LinkButton } from './LinkButton';
import { StoreImage } from './Image';

export interface EditorialCardProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  text?: ReactNode;
  image?: { src?: string; alt?: string };
  href?: string;
  cta?: string;
  variant?: 'media-left' | 'media-right' | 'stacked';
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

export function EditorialCard(props: EditorialCardProps): ReactElement {
  const { t } = useTranslation();
  const {
    title,
    eyebrow,
    text,
    image,
    href,
    cta = t('misc.discover'),
    variant = 'media-left',
    headingLevel: Heading = 'h3',
    className,
  } = props;

  return (
    <article className={cn('sf-editorial', `sf-editorial--${variant}`, className)}>
      {variant !== 'stacked' || image ? (
        <div className="sf-editorial__media">
          <StoreImage className="sf-editorial__img" src={image?.src} alt={image?.alt ?? ''} />
        </div>
      ) : null}
      <div className="sf-editorial__content">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading className="sf-editorial__title">{title}</Heading>
        {text ? <p className="sf-editorial__text">{text}</p> : null}
        {href ? (
          <LinkButton variant="arrow" href={href}>
            {cta}
          </LinkButton>
        ) : null}
      </div>
    </article>
  );
}
