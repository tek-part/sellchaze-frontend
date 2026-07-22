/**
 * Tabs — switch content panels (PDP details, account). The gold underline slides between tabs
 * (position animates, never a colour flash); panels are ARIA tab/tabpanel; arrow-key navigable with
 * automatic activation. See §32.6.
 */
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: ReadonlyArray<TabItem>;
  value: string;
  onChange: (id: string) => void;
  renderPanel: (id: string) => ReactNode;
  /** Accessible name for the tablist. */
  label?: string;
  className?: string;
}

export function Tabs(props: TabsProps): ReactElement {
  const { tabs, value, onChange, renderPanel, label, className } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<CSSProperties>({ width: 0 });

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(value)}"]`);
    if (!active) return;
    setIndicator({
      width: `${active.offsetWidth}px`,
      transform: `translateX(${active.offsetLeft - list.clientLeft}px)`,
    });
  }, [value]);

  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const enabled = tabs.filter((t) => !t.disabled);
    const currentIndex = enabled.findIndex((t) => t.id === value);
    if (currentIndex === -1) return;
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % enabled.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = enabled.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = enabled[nextIndex];
    if (next) {
      onChange(next.id);
      listRef.current?.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(next.id)}"]`)?.focus();
    }
  };

  return (
    <div className={cn('sf-tabs', className)}>
      <div ref={listRef} role="tablist" aria-label={label} className="sf-tabs__list" onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`sf-tab-${tab.id}`}
              data-tab-id={tab.id}
              aria-selected={selected}
              aria-controls={`sf-tabpanel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              className="sf-tab"
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
        <span className="sf-tabs__indicator" style={indicator} aria-hidden />
      </div>
      <div
        role="tabpanel"
        id={`sf-tabpanel-${value}`}
        aria-labelledby={`sf-tab-${value}`}
        tabIndex={0}
        className="sf-tabs__panel"
      >
        {renderPanel(value)}
      </div>
    </div>
  );
}
