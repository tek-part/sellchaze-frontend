/**
 * Customer account area — AccountLayout (auth-gated shell + nav), Profile, Orders, Addresses.
 * Real integration against the storefront account endpoints. Guests are redirected to /login.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Container,
  EmptyState,
  Input,
  Section,
  Spinner,
} from '../themes/luxury-fashion/components';
import { useAuth } from '../state/auth-context';
import { useStore } from '../state/store-context';
import { ThemeRenderer, useLayout, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';

/** Render the active theme's account sub-template when it provides one; otherwise null (fallback). */
function useAccountTemplate(name: 'account-profile' | 'account-orders' | 'account-order' | 'account-addresses'): ReactElement | null {
  const tpl = useTemplate(name);
  const { store } = useStore();
  if (!tpl) return null;
  return <ThemeRenderer page={tpl} context={flowContext(store)} />;
}
import { useAsync } from '../api/useAsync';
import {
  changePassword,
  createAddress,
  deleteAddress,
  getAddresses,
  getOrder,
  getOrders,
  updateAccount,
  updateAddress,
  type ApiAddress,
  type ApiOrder,
} from '../api/storefront';
import { formatDate, formatMoney } from '../utils/format';

export function AccountLayout(): ReactElement {
  const { customer, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { store } = useStore();
  const AccountShell = useLayout('account');

  if (loading) {
    return (
      <Section>
        <Container>
          <div style={{ display: 'grid', placeItems: 'center', minHeight: '30vh' }}>
            <Spinner label="Loading your account" />
          </div>
        </Container>
      </Section>
    );
  }
  if (!customer) return <Navigate to="/login" replace />;

  if (AccountShell) {
    return (
      <AccountShell context={flowContext(store)}>
        <Outlet />
      </AccountShell>
    );
  }

  return (
    <Section>
      <Container>
        <div className="sf-page-head" style={{ textAlign: 'start' }}>
          <h1 className="sf-page-head__title">My account</h1>
        </div>
        <div className="sf-account">
          <nav className="sf-account__nav" aria-label="Account">
            <a href="/account">Profile</a>
            <a href="/account/orders">Orders</a>
            <a href="/account/addresses">Addresses</a>
            <a href="/wishlist">Wishlist</a>
            <button type="button" onClick={() => void logout().then(() => navigate('/'))}>
              Sign out
            </button>
          </nav>
          <div className="sf-account__panel">
            <Outlet />
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function AccountPage(): ReactElement {
  const { customer, refresh } = useAuth();
  const themed = useAccountTemplate('account-profile');
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('saving');
    try {
      await updateAccount({ name, email });
      await refresh();
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  if (themed) return themed;

  return (
    <div className="sf-account__panel">
      <form className="sf-account__panel" onSubmit={(e) => void submit(e)} noValidate>
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {status === 'saved' ? <p className="sf-newsletter__success">Your details have been saved.</p> : null}
        {status === 'error' ? <p className="sf-field__error">Could not save — please try again.</p> : null}
        <Button type="submit" loading={status === 'saving'}>
          Save changes
        </Button>
      </form>
      <hr className="sf-divider" />
      <ChangePasswordForm />
    </div>
  );
}

function ChangePasswordForm(): ReactElement {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string>();
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setStatus('saving');
    setError(undefined);
    try {
      await changePassword(form);
      setForm({ current_password: '', password: '', password_confirmation: '' });
      setStatus('saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your password.');
      setStatus('error');
    }
  };

  return (
    <form className="sf-account__panel" onSubmit={(e) => void submit(e)} noValidate>
      <h2 className="sf-footer__group-title">Change password</h2>
      <Input label="Current password" type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} required />
      <Input label="New password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} required />
      <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} required />
      {status === 'saved' ? <p className="sf-newsletter__success">Your password has been updated.</p> : null}
      {error ? <p className="sf-field__error">{error}</p> : null}
      <Button type="submit" variant="secondary" loading={status === 'saving'}>
        Update password
      </Button>
    </form>
  );
}

export function OrderDetailPage(): ReactElement {
  const { number = '' } = useParams();
  const { store } = useStore();
  const themed = useAccountTemplate('account-order');
  const orderQ = useAsync(() => getOrder(number), [number]);
  const order = orderQ.data?.data;

  if (themed) return themed;
  if (orderQ.loading) return <Spinner label="Loading order" />;
  if (!order) return <EmptyState variant="orders" title="Order not found" description="We couldn't find that order." />;

  const currency = order.currency || store.currency;
  return (
    <div className="sf-account__panel">
      <div>
        <div style={{ fontFamily: 'var(--heading)', fontSize: 'var(--fs-xl)', color: 'var(--text)' }}>Order {order.number}</div>
        <div className="sf-card-row__meta">
          {formatDate(order.created_at) ?? ''} · {order.status}
        </div>
      </div>
      {order.items && order.items.length > 0 ? (
        <div className="sf-card-list">
          {order.items.map((item, i) => (
            <div key={item.id ?? i} className="sf-card-row">
              <div>
                <div style={{ fontFamily: 'var(--heading)', color: 'var(--text)' }}>{item.name}</div>
                <div className="sf-card-row__meta">Qty {item.quantity}</div>
              </div>
              <div>{formatMoney(Number(item.price) * item.quantity, currency)}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="sf-cart-summary__total">
        <span>Total</span>
        <span className="sf-cart-summary__total-value">{formatMoney(Number(order.total), currency)}</span>
      </div>
      <a href="/account/orders" className="sf-link">
        <span className="sf-link__label">Back to orders</span>
      </a>
    </div>
  );
}

export function OrdersPage(): ReactElement {
  const { store } = useStore();
  const themed = useAccountTemplate('account-orders');
  const ordersQ = useAsync(() => getOrders(), []);
  const orders: ReadonlyArray<ApiOrder> = ordersQ.data?.data ?? [];

  if (themed) return themed;
  if (ordersQ.loading) return <Spinner label="Loading orders" />;
  if (orders.length === 0) {
    return <EmptyState variant="orders" title="No orders yet" description="When you place an order, it will appear here." />;
  }

  return (
    <div className="sf-card-list">
      {orders.map((order) => (
        <a key={order.id} href={`/account/orders/${order.number}`} className="sf-card-row" style={{ textDecoration: 'none' }}>
          <div>
            <div style={{ fontFamily: 'var(--heading)', color: 'var(--text)' }}>Order {order.number}</div>
            <div className="sf-card-row__meta">
              {formatDate(order.created_at) ?? ''} · {order.status}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--heading)', color: 'var(--text)' }}>
            {formatMoney(Number(order.total), order.currency || store.currency)}
          </div>
        </a>
      ))}
    </div>
  );
}

const EMPTY_ADDRESS = { name: '', line1: '', city: '', postal_code: '', country: '' };

export function AddressesPage(): ReactElement {
  const themed = useAccountTemplate('account-addresses');
  const addressesQ = useAsync(() => getAddresses(), []);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const addresses: ReadonlyArray<ApiAddress> = addressesQ.data?.data ?? [];

  const startEdit = (address: ApiAddress): void => {
    setEditingId(address.id);
    setAdding(true);
    setForm({
      name: address.name ?? '',
      line1: address.line1 ?? '',
      city: address.city ?? '',
      postal_code: address.postal_code ?? '',
      country: address.country ?? '',
    });
  };

  const closeForm = (): void => {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY_ADDRESS);
  };

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (editingId !== null) await updateAddress(editingId, form);
    else await createAddress(form);
    closeForm();
    addressesQ.reload();
  };

  const remove = async (id: number): Promise<void> => {
    await deleteAddress(id);
    addressesQ.reload();
  };

  if (themed) return themed;

  return (
    <div className="sf-account__panel">
      {addressesQ.loading ? (
        <Spinner label="Loading addresses" />
      ) : addresses.length === 0 && !adding ? (
        <EmptyState variant="generic" title="No saved addresses" description="Add an address for faster checkout." actions={<Button onClick={() => setAdding(true)}>Add address</Button>} />
      ) : (
        <>
          <div className="sf-card-list">
            {addresses.map((address) => (
              <div key={address.id} className="sf-card-row">
                <div>
                  <div style={{ fontFamily: 'var(--heading)', color: 'var(--text)' }}>{address.name}</div>
                  <div className="sf-card-row__meta">
                    {[address.line1, address.city, address.postal_code, address.country].filter(Boolean).join(', ')}
                  </div>
                </div>
                <div className="sf-pdp__actions">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(address)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void remove(address.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {adding ? (
            <form className="sf-account__panel" onSubmit={(e) => void submit(e)} noValidate>
              <Input label="Full name" value={form.name} onChange={set('name')} required />
              <Input label="Address line" value={form.line1} onChange={set('line1')} required />
              <Input label="City" value={form.city} onChange={set('city')} required />
              <Input label="Postal code" value={form.postal_code} onChange={set('postal_code')} required />
              <Input label="Country" value={form.country} onChange={set('country')} required />
              <div className="sf-pdp__row">
                <Button type="submit">{editingId !== null ? 'Update address' : 'Save address'}</Button>
                <Button type="button" variant="ghost" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="secondary" onClick={() => setAdding(true)}>
              Add address
            </Button>
          )}
        </>
      )}
    </div>
  );
}
