/** Voltage Tabs — mono uppercase labels, cyan active underline; ARIA tab/tabpanel, arrow keys. */
import { useRef, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface TabItem { id: string; label: ReactNode; disabled?: boolean; }
export interface TabsProps {
  tabs: ReadonlyArray<TabItem>;
  value: string;
  onChange: (id: string) => void;
  renderPanel: (id: string) => ReactNode;
  label?: string;
  className?: string;
}

export function Tabs(props: TabsProps): ReactElement {
  const { tabs, value, onChange, renderPanel, label, className } = props;
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const enabled = tabs.filter((t) => !t.disabled);
    const i = enabled.findIndex((t) => t.id === value);
    if (i === -1) return;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (i + 1) % enabled.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + enabled.length) % enabled.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = enabled.length - 1;
    if (next === null) return;
    e.preventDefault();
    const t = enabled[next];
    if (t) {
      onChange(t.id);
      listRef.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(t.id)}"]`)?.focus();
    }
  };

  return (
    <div className={cn('vlt-tabs', className)}>
      <div ref={listRef} role="tablist" aria-label={label} className="vlt-tabs__list" onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`vlt-tab-${tab.id}`}
              data-tab-id={tab.id}
              aria-selected={selected}
              aria-controls={`vlt-tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              className="vlt-tab"
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`vlt-tabpanel-${value}`} aria-labelledby={`vlt-tab-${value}`} tabIndex={0} className="vlt-tabs__panel">
        {renderPanel(value)}
      </div>
    </div>
  );
}
