/**
 * CustomizeBridge — the storefront side of the live customizer (contract §5).
 *
 * Mounted by StorefrontApp only in `?customize=1` mode. On mount it posts `ready` to the parent
 * editor, then:
 *   hydrate         → visible draft sections → customizer store (HomePage/BuilderPage render them),
 *                     `settings` → theme provider overrides (locale maps flattened for the draft
 *                     locale), `locale` → i18n, `path` → router.
 *   select-section  → outline + scroll `[data-section-id]` into view.
 * and posts `section-selected` when the visitor clicks inside a section (capture phase on the
 * document, so section components need no wiring and must NOT stopPropagation on their root).
 *
 * Navigation inside sections is suppressed in customize mode (the editor owns `path`), and the
 * `sf-customizing` body class hides dismiss buttons + hover-outlines sections (customize.css).
 */
import { useEffect, type ReactElement } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme-engine/context';
import { flattenLocalizedSettings } from '../theme-engine/settings';
import type { SectionInstance } from '../theme-engine/rendering';
import { isStudioMessage, type EditableSection, type PreviewToStudioMessage } from '../platform/studio/editor-domain';
import { normalizePath, setCustomizerState } from './customizer-state';
import './customize.css';

const PREVIEW_CHANNEL = 'sellchaze-theme-preview' as const;

function post(message: PreviewToStudioMessage): void {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage(message, '*');
}

/** Map editor sections (visible only) to engine section instances. */
export function toSectionInstances(sections: ReadonlyArray<EditableSection>): SectionInstance[] {
  return sections
    .filter((s) => s.is_visible !== false)
    .map((s) => ({ id: s.id, type: s.type, settings: s.settings ?? {} }));
}

export function CustomizeBridge(): ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const theme = useTheme();
  const updateSettings = theme.updateSettings;

  // Body flag for the customize skin + announce readiness to the editor.
  useEffect(() => {
    document.body.classList.add('sf-customizing');
    post({ channel: PREVIEW_CHANNEL, version: 1, type: 'ready' });
    return () => document.body.classList.remove('sf-customizing');
  }, []);

  // Editor → SPA.
  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>): void => {
      const message = event.data;
      if (!isStudioMessage(message)) return;
      if (message.type === 'hydrate') {
        const { sections, locale, path, settings } = message.payload;
        const draftLocale = locale || i18n.language || 'en';
        setCustomizerState({ sections: toSectionInstances(sections ?? []), path: normalizePath(path || '/'), locale: draftLocale });
        if (locale && i18n.language !== locale) void i18n.changeLanguage(locale);
        if (settings && typeof settings === 'object') updateSettings(flattenLocalizedSettings(settings, draftLocale));
        const target = normalizePath(path || '/');
        if (normalizePath(location.pathname) !== target) navigate({ pathname: target, search: location.search }, { replace: true });
        return;
      }
      if (message.type === 'select-section') {
        const id = message.payload.id;
        setCustomizerState({ selectedId: id });
        if (id) {
          const el = document.querySelector<HTMLElement>(`[data-section-id="${CSS.escape(id)}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [i18n, navigate, location.pathname, location.search, updateSettings]);

  // SPA → editor: clicks inside a section select it; in-section navigation is suppressed.
  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      const frame = target?.closest<HTMLElement>('[data-section-id]');
      if (!frame) return;
      const id = frame.dataset['sectionId'];
      if (!id) return;
      if (target?.closest('a[href]')) event.preventDefault();
      setCustomizerState({ selectedId: id });
      post({ channel: PREVIEW_CHANNEL, version: 1, type: 'section-selected', payload: { id } });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
