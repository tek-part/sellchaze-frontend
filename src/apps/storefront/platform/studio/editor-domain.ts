export type Viewport = 'desktop' | 'tablet' | 'mobile';
export type StudioLocale = 'ar' | 'en';

export interface EditableSection {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  reusable_section_id: number | null;
  is_visible: boolean;
}

export interface EditorHistory {
  past: EditableSection[][];
  present: EditableSection[];
  future: EditableSection[][];
}

export function createHistory(sections: EditableSection[]): EditorHistory {
  return { past: [], present: structuredClone(sections), future: [] };
}

export function commit(history: EditorHistory, next: EditableSection[]): EditorHistory {
  if (JSON.stringify(history.present) === JSON.stringify(next)) return history;
  return { past: [...history.past.slice(-49), history.present], present: structuredClone(next), future: [] };
}

export function undo(history: EditorHistory): EditorHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return { past: history.past.slice(0, -1), present: previous, future: [history.present, ...history.future] };
}

export function redo(history: EditorHistory): EditorHistory {
  const next = history.future[0];
  if (!next) return history;
  return { past: [...history.past, history.present], present: next, future: history.future.slice(1) };
}

export function reorder(sections: EditableSection[], from: number, to: number): EditableSection[] {
  if (from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return sections;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  if (!moved) return sections;
  next.splice(to, 0, moved);
  return next;
}

export type StudioToPreviewMessage =
  | { channel: 'sellchaze-theme-studio'; version: 1; type: 'hydrate'; payload: { sections: EditableSection[]; locale: StudioLocale; path: string } }
  | { channel: 'sellchaze-theme-studio'; version: 1; type: 'select-section'; payload: { id: string | null } };

export type PreviewToStudioMessage =
  | { channel: 'sellchaze-theme-preview'; version: 1; type: 'ready' }
  | { channel: 'sellchaze-theme-preview'; version: 1; type: 'section-selected'; payload: { id: string } };

export function isPreviewMessage(value: unknown): value is PreviewToStudioMessage {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (item.channel !== 'sellchaze-theme-preview' || item.version !== 1) return false;
  if (item.type === 'ready') return true;
  if (item.type !== 'section-selected' || !item.payload || typeof item.payload !== 'object') return false;
  return typeof (item.payload as Record<string, unknown>).id === 'string';
}

export const VIEWPORT_WIDTH: Record<Viewport, number> = { desktop: 1440, tablet: 768, mobile: 390 };
