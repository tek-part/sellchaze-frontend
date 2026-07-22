/**
 * Voltage CompareTray — a fixed bottom rail listing the compare set with a spec-table modal. Reads
 * the theme-local compare context; hidden when the set is empty. Voltage's own chrome.
 */
import { useState, type ReactElement } from 'react';
import { useCompare } from '../state/compare-context';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { StoreImage } from '../components/Image';
import { Price } from '../components/Price';
import { IconClose } from '../components/icons';

export function CompareTray(): ReactElement | null {
  const compare = useCompare();
  const [open, setOpen] = useState(false);
  if (compare.items.length === 0) return null;

  const rows: Array<{ label: string; render: (p: (typeof compare.items)[number]) => ReactElement | string }> = [
    { label: 'Price', render: (p) => <Price amount={p.price} {...(p.compareAtPrice ? { compareAt: p.compareAtPrice } : {})} currency={p.currency} /> },
    { label: 'Brand', render: (p) => p.vendor ?? '—' },
    { label: 'Rating', render: (p) => (typeof p.rating === 'number' ? `${p.rating.toFixed(1)} ★` : '—') },
    { label: 'Availability', render: (p) => (p.soldOut ? 'Sold out' : 'In stock') },
  ];

  return (
    <>
      <div className="vlt-compare-tray" role="region" aria-label="Compare tray">
        <ul className="vlt-compare-tray__items">
          {compare.items.map((p) => (
            <li key={p.id} className="vlt-compare-tray__item">
              <StoreImage className="vlt-compare-tray__thumb" src={p.image?.src} alt="" />
              <span className="vlt-compare-tray__name">{p.title}</span>
              <IconButton label={`Remove ${p.title} from compare`} onClick={() => compare.remove(p.id)} className="vlt-compare-tray__rm"><IconClose /></IconButton>
            </li>
          ))}
        </ul>
        <div className="vlt-compare-tray__actions">
          <Button variant="ghost" size="sm" onClick={compare.clear}>Clear</Button>
          <Button size="sm" onClick={() => setOpen(true)} disabled={compare.items.length < 2}>Compare ({compare.items.length})</Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Compare products" size="lg" className="vlt-compare-modal">
        <div className="vlt-compare-table-wrap">
          <table className="vlt-compare-table">
            <thead>
              <tr>
                <th scope="col"><span className="vlt-visually-hidden">Attribute</span></th>
                {compare.items.map((p) => (
                  <th key={p.id} scope="col">
                    <a href={p.url} className="vlt-compare-table__head">
                      <StoreImage className="vlt-compare-table__img" src={p.image?.src} alt="" />
                      <span className="vlt-compare-table__title">{p.title}</span>
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="vlt-compare-table__rowlabel">{row.label}</th>
                  {compare.items.map((p) => (
                    <td key={p.id} className="vlt-num">{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
