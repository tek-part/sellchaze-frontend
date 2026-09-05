/**
 * Bazaar AnnouncementBar — the top UTILITY bar: announcement text (rotates when there are several)
 * on the start side, language switcher + account / wishlist links on the end side. Rendered only
 * when `show_top_bar` is on; there is no session-dismiss so the utility links stay reachable.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../../../../../shared/env/media';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { IconHeart, IconTruck, IconUser } from './icons';

export interface AnnouncementBarProps {
  messages: ReadonlyArray<string>;
  url?: string;
}

export function AnnouncementBar(props: AnnouncementBarProps): ReactElement {
  const { messages, url } = props;
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1 || prefersReducedMotion()) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  const message = messages[index] ?? messages[0];
  return (
    <div className="bz-topbar" role="region" aria-label="Announcement">
      <div className="lib-container bz-topbar__inner">
        {message ? (
          <span aria-live="polite" className="bz-topbar__text">
            <IconTruck className="bz-topbar__icon" />
            {url ? <a href={url}>{message}</a> : message}
          </span>
        ) : <span />}
        <div className="bz-topbar__links">
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="bz-topbar__lang" />
          <a href="/wishlist" className="bz-topbar__link"><IconHeart width={15} height={15} /> {t('header.wishlist')}</a>
          <a href="/account" className="bz-topbar__link"><IconUser width={15} height={15} /> {t('header.account')}</a>
        </div>
      </div>
    </div>
  );
}
