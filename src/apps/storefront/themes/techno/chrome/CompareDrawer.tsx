/**
 * Techno CompareDrawer — the compare tray: up to four product snapshots side by side (image,
 * title, price, spec chips) with remove / clear. Opened from the header compare button.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import { formatMoney } from '../../../utils/format';
import { useLocale } from '../../../i18n/useLocale';
import { useLocaleCode } from '../../../sections-lib';
import { useCompare } from '../components/compare';
import { tkText } from '../components/i18n';
import { IconClose } from './icons';

export interface CompareDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CompareDrawer(props: CompareDrawerProps): ReactElement {
  const { open, onClose } = props;
  const { t } = useTranslation();
  const { locale } = useLocale();
  const code = useLocaleCode();
  const compare = useCompare();

  return (
    <Drawer open={open} onClose={onClose} title={`${tkText(code, 'compareTray')} (${compare.count}/${compare.max})`} className="tk-drawer">
      {compare.items.length === 0 ? (
        <div className="sf-overlay__body tk-cart__empty">
          <p className="tk-cart__empty-title">{tkText(code, 'compareEmpty')}</p>
          <p className="tk-cart__empty-hint">{tkText(code, 'compareHint')}</p>
        </div>
      ) : (
        <>
          <div className="sf-overlay__body tk-compare">
            <ul className="tk-compare__list">
              {compare.items.map((item) => (
                <li key={item.id} className="tk-compare__item">
                  <a href={item.url} className="tk-compare__thumb" tabIndex={-1} aria-hidden>
                    {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="tk-cart__thumb-fallback" />}
                  </a>
                  <div className="tk-compare__info">
                    {item.vendor ? <span className="tk-compare__vendor">{item.vendor}</span> : null}
                    <a href={item.url} className="tk-compare__title">{item.title}</a>
                    <span className="tk-compare__price">
                      <strong>{formatMoney(item.price, item.currency, locale)}</strong>
                      {typeof item.compareAtPrice === 'number' && item.compareAtPrice > item.price ? <s>{formatMoney(item.compareAtPrice, item.currency, locale)}</s> : null}
                    </span>
                    {item.specs.length > 0 ? (
                      <ul className="tk-card__specs" aria-label={tkText(code, 'specs')}>
                        {item.specs.map((spec) => <li key={spec} className="tk-chip">{spec}</li>)}
                      </ul>
                    ) : null}
                  </div>
                  <button type="button" className="tk-compare__remove" aria-label={t('common.remove')} onClick={() => compare.remove(item.id)}><IconClose width={16} height={16} /></button>
                </li>
              ))}
            </ul>
          </div>
          <div className="sf-overlay__footer tk-cart__foot">
            <button type="button" className="lib-btn lib-btn--secondary lib-btn--md lib-btn--block" onClick={compare.clear}>{tkText(code, 'clearAll')}</button>
          </div>
        </>
      )}
    </Drawer>
  );
}
