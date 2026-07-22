/**
 * Voltage account shell — the authenticated sidebar console. Mono nav rail (Profile / Orders /
 * Addresses / Wishlist / Sign out) beside a panel that hosts the active account sub-route (children =
 * the router Outlet). Auth-gating stays in the shared AccountLayout; this owns only the chrome.
 */
import { type ReactElement } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../../../../shared/utils/cn';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useAuth } from '../../../state/auth-context';

const LINKS = [
  { to: '/account', label: 'Profile', end: true },
  { to: '/account/orders', label: 'Orders', end: false },
  { to: '/account/addresses', label: 'Addresses', end: false },
  { to: '/wishlist', label: 'Wishlist', end: false },
];

export function AccountLayout(props: LayoutRenderProps): ReactElement {
  const { children } = props;
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="vlt-section">
      <div className="vlt-container">
        <div className="vlt-flow-head">
          <span className="vlt-eyebrow">// Account</span>
          <h1 className="vlt-flow-head__title">My account</h1>
        </div>
        <div className="vlt-account">
          <nav className="vlt-account__nav" aria-label="Account">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => cn('vlt-account__link', isActive && 'vlt-account__link--active')}
              >
                {link.label}
              </NavLink>
            ))}
            <button type="button" className="vlt-account__signout" onClick={() => void logout().then(() => navigate('/'))}>
              Sign out
            </button>
          </nav>
          <div className="vlt-account__panel">{children}</div>
        </div>
      </div>
    </section>
  );
}
