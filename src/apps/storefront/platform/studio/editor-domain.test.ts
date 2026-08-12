import { describe, expect, it } from 'vitest';
import { commit, createHistory, isPreviewMessage, redo, reorder, undo, type EditableSection } from './editor-domain';

const sections: EditableSection[] = [
  { id: 'a', type: 'hero', settings: {}, reusable_section_id: null, is_visible: true },
  { id: 'b', type: 'products', settings: {}, reusable_section_id: null, is_visible: true },
];

describe('theme studio editor domain', () => {
  it('supports bounded immutable undo and redo', () => {
    const changed = commit(createHistory(sections), reorder(sections, 0, 1));
    expect(changed.present.map((s) => s.id)).toEqual(['b', 'a']);
    const restored = undo(changed);
    expect(restored.present.map((s) => s.id)).toEqual(['a', 'b']);
    expect(redo(restored).present.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('rejects malformed cross-frame messages', () => {
    expect(isPreviewMessage({ channel: 'sellchaze-theme-preview', version: 1, type: 'ready' })).toBe(true);
    expect(isPreviewMessage({ channel: 'evil', version: 1, type: 'ready' })).toBe(false);
    expect(isPreviewMessage({ channel: 'sellchaze-theme-preview', version: 1, type: 'section-selected', payload: {} })).toBe(false);
  });
});
