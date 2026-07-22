/**
 * Voltage Accordion — an accessible disclosure list. Each header is a <button aria-expanded> that
 * controls its panel; one panel open at a time. Keyboard: Enter/Space toggle (native button). Panels
 * animate height via CSS (reduced-motion aware). Voltage's own .vlt-* markup.
 */
import { useId, useState, type ReactElement } from 'react';

export interface AccordionItem {
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: ReadonlyArray<AccordionItem>;
  /** Index open on mount (-1 = all closed). */
  defaultOpen?: number;
}

export function Accordion(props: AccordionProps): ReactElement {
  const { items, defaultOpen = -1 } = props;
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();

  return (
    <div className="vlt-accordion">
      {items.map((item, i) => {
        const expanded = open === i;
        const headId = `${baseId}-h${i}`;
        const panelId = `${baseId}-p${i}`;
        return (
          <div key={i} className="vlt-accordion__item">
            <h3 className="vlt-accordion__heading">
              <button
                type="button"
                id={headId}
                className="vlt-accordion__trigger"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? -1 : i)}
              >
                <span>{item.question}</span>
                <span className={expanded ? 'vlt-accordion__icon vlt-accordion__icon--open' : 'vlt-accordion__icon'} aria-hidden>+</span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={headId} className="vlt-accordion__panel" hidden={!expanded}>
              <p className="vlt-accordion__answer">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
