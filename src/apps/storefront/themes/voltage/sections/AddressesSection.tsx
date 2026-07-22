/**
 * Voltage account addresses — saved address book with add / edit / remove. Real integration via the
 * shared addresses API. Spinner + empty state + inline form. Voltage's own .vlt-* markup.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { useAsync } from '../../../api/useAsync';
import { createAddress, deleteAddress, getAddresses, updateAddress, type ApiAddress } from '../../../api/storefront';

const EMPTY = { name: '', line1: '', city: '', postal_code: '', country: '' };

export function AddressesSection(_props: SectionRenderProps): ReactElement {
  const addressesQ = useAsync(() => getAddresses(), []);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
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
    setForm(EMPTY);
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

  if (addressesQ.loading) return <div className="vlt-account-loading"><Spinner label="Loading addresses" /></div>;

  if (addresses.length === 0 && !adding) {
    return (
      <div className="vlt-empty vlt-empty--pad">
        <span className="vlt-empty__title">No saved addresses</span>
        <span className="vlt-empty__text">Add an address for faster checkout.</span>
        <Button className="vlt-empty__cta" onClick={() => setAdding(true)}>Add address</Button>
      </div>
    );
  }

  return (
    <div className="vlt-account-stack">
      <ul className="vlt-log">
        {addresses.map((address) => (
          <li key={address.id} className="vlt-log__row vlt-log__row--static">
            <span className="vlt-log__main">
              <span className="vlt-log__title">{address.name}</span>
              <span className="vlt-log__meta">{[address.line1, address.city, address.postal_code, address.country].filter(Boolean).join(', ')}</span>
            </span>
            <span className="vlt-addr__actions">
              <Button variant="ghost" size="sm" onClick={() => startEdit(address)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => void remove(address.id)}>Remove</Button>
            </span>
          </li>
        ))}
      </ul>

      {adding ? (
        <form className="vlt-account-form" onSubmit={(e) => void submit(e)} noValidate>
          <span className="vlt-eyebrow">{editingId !== null ? '// Edit address' : '// New address'}</span>
          <Input label="Full name" value={form.name} onChange={set('name')} required autoComplete="name" />
          <Input label="Address line" value={form.line1} onChange={set('line1')} required autoComplete="address-line1" />
          <Input label="City" value={form.city} onChange={set('city')} required autoComplete="address-level2" />
          <Input label="Postal code" value={form.postal_code} onChange={set('postal_code')} required autoComplete="postal-code" />
          <Input label="Country" value={form.country} onChange={set('country')} required autoComplete="country-name" />
          <div className="vlt-addr__form-actions">
            <Button type="submit">{editingId !== null ? 'Update address' : 'Save address'}</Button>
            <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div><Button variant="secondary" onClick={() => setAdding(true)}>Add address</Button></div>
      )}
    </div>
  );
}
