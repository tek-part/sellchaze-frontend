/**
 * Rouge Tabs — accessible tablist with a gilt active underline. Controlled; the caller renders the
 * active panel via `renderPanel`. Arrow-key roving per WAI-ARIA.
 */
import { useId, useRef, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';

export interface TabItem {
  id: string;
  label: string;
}
export interface TabsProps {
  tabs: ReadonlyArray<TabItem>;
  value: string;
  onChange: (id: string) => void;
  renderPanel: (id: string) => ReactNode;
  className?: string;
}

export function Tabs(props: TabsProps): ReactElement {
  const { tabs, value, onChange, renderPanel, className } = props;
  const { t } = useTranslation();
  const baseId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + dir + tabs.length) % tabs.length;
    const target = tabs[next];
    if (target) {
      onChange(target.id);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className={cn('rge-tabs', className)}>
      <div className="rge-tabs__list" role="tablist" aria-label={t('pdp.productInformation')}>
        {tabs.map((tab, i) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              className="rge-tab"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="rge-tabs__panel" role="tabpanel" id={`${baseId}-panel-${value}`} aria-labelledby={`${baseId}-tab-${value}`}>
        {renderPanel(value)}
      </div>
    </div>
  );
}
