import { useRef, useState } from 'react';
import { keyboardTarget, moveItem } from '../components/store/catalog-tools';

/**
 * Drag-and-drop plus keyboard reordering for one or more nested lists. Each list is a named group so a
 * dragged value never drops into its parent list. `announce(label, position, total)` feeds a live region.
 */
export default function useSortable(announce) {
    const drag = useRef(null);
    const [over, setOver] = useState(null);
    const [message, setMessage] = useState('');
    function sortable(group, items, apply, label) {
        const move = (from, to) => {
            if (to === null || to === from) return;
            apply(moveItem(items, from, to));
            setMessage(announce(label(items[from]), to + 1, items.length));
        };
        return {
            item: (index) => ({
                'data-drop-target': over === `${group}:${index}` ? 'true' : undefined,
                onDragOver: (event) => { if (drag.current?.group !== group) return; event.preventDefault(); event.stopPropagation(); setOver(`${group}:${index}`); },
                onDrop: (event) => {
                    if (drag.current?.group !== group) return;
                    event.preventDefault(); event.stopPropagation();
                    const from = drag.current.index; drag.current = null; setOver(null); move(from, index);
                },
            }),
            handle: (index) => ({
                draggable: true,
                onDragStart: (event) => {
                    event.stopPropagation(); drag.current = { group, index };
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(index));
                },
                onDragEnd: () => { drag.current = null; setOver(null); },
                onKeyDown: (event) => { const to = keyboardTarget(event.key, index, items.length); if (to !== null) { event.preventDefault(); move(index, to); } },
            }),
        };
    }
    return { sortable, message };
}
