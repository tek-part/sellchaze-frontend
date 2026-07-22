/**
 * Rouge Accordion — soft disclosure rows (ingredients / how to use / details / shipping). Single or
 * multi-open; accessible button/region pairing with a rotating chevron.
 */
import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { IconChevronDown } from './icons';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}
export interface AccordionProps {
  items: ReadonlyArray<AccordionItem>;
  /** Allow multiple panels open at once. */
  multiple?: boolean;
  /** Ids open by default. */
  defaultOpen?: ReadonlyArray<string>;
  className?: string;
}

export function Accordion(props: AccordionProps): ReactElement {
  const { items, multiple = false, defaultOpen = [], className } = props;
  const baseId = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(defaultOpen));

  const toggle = (id: string): void => {
    setOpen((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn('rge-accordion', className)}>
      {items.map((item) => {
        const isOpen = open.has(item.id);
        return (
          <div key={item.id} className="rge-accordion__item">
            <h3 className="rge-accordion__heading">
              <button
                type="button"
                className="rge-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={`${baseId}-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                <span>{item.title}</span>
                <IconChevronDown className={cn('rge-accordion__icon', isOpen && 'rge-accordion__icon--open')} width={18} height={18} />
              </button>
            </h3>
            <div id={`${baseId}-${item.id}`} className="rge-accordion__panel" hidden={!isOpen}>
              <div className="rge-accordion__content">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
