/**
 * Voltage account shell — the authenticated sidebar console. Mono nav rail (Profile / Orders /
 * Addresses / Wishlist / Sign out) beside a panel that hosts the active account sub-route (children =
 * the router Outlet). Auth-gating stays in the shared AccountLayout; this owns only the chrome.
 */
import { type ReactElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useAuth } from '../../../state/auth-context';

const LINKS = [
  { to: '/account', labelKey: 'account.profile', end: true },
  { to: '/account/orders', labelKey: 'account.orders', end: false },
  { to: '/account/addresses', labelKey: 'account.addresses', end: false },
  { to: '/wishlist', labelKey: 'account.wishlist', end: false },
];

export function AccountLayout(props: LayoutRenderProps): ReactElement {
  const { t } = useTranslation();
  const { children } = props;
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="vlt-section">
      <div className="vlt-container">
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">{t('account.eyebrowAccount')}</span>
          <h1 className="vlt-flow-head__title">{t('account.title')}</h1>
        </div>
        <div className="vlt-account">
          <nav className="vlt-account__nav" aria-label={t('account.title')}>
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => cn('vlt-account__link', isActive && 'vlt-account__link--active')}
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
            <button type="button" className="vlt-account__signout" onClick={() => void logout().then(() => navigate('/'))}>
              {t('account.signOut')}
            </button>
          </nav>
          <div className="vlt-account__panel">{children}</div>
        </div>
      </div>
    </section>
  );
}
