/**
 * Accordion — collapse secondary content (shipping, FAQ, filters). Hairline row per item; chevron
 * rotates 180°; height eases via the grid-rows 0fr→1fr trick (no measuring, no fade-flash). `single`
 * keeps one open; `multi` allows many. RTL-safe. See §32.6.
 */
import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconChevronDown } from './icons';

export interface AccordionItemData {
  id: string;
  header: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: ReadonlyArray<AccordionItemData>;
  type?: 'single' | 'multi';
  defaultOpen?: ReadonlyArray<string>;
  className?: string;
}

export function Accordion(props: AccordionProps): ReactElement {
  const { items, type = 'single', defaultOpen = [], className } = props;
  const baseId = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(defaultOpen));

  const toggle = (id: string): void => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (type === 'single') next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn('sf-accordion', className)}>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const triggerId = `${baseId}-${item.id}-trigger`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id} className="sf-accordion__item">
            <h3 className="sf-accordion__heading">
              <button
                type="button"
                id={triggerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="sf-accordion__trigger"
                onClick={() => toggle(item.id)}
              >
                <span className="sf-accordion__label">{item.header}</span>
                <IconChevronDown className="sf-accordion__icon" width={18} height={18} />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={triggerId} className="sf-accordion__panel" data-open={isOpen}>
              <div className="sf-accordion__panel-inner">
                <div className="sf-accordion__content">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
