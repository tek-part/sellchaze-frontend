/**
 * ThemeRenderer — the Renderer layer (Engine → Renderer → Sections → Components).
 *
 * Walks a `PageDefinition` and renders each section from the ACTIVE theme's section registry
 * (via context — the renderer never imports a theme). Fail-closed per section, graceful drop of
 * unknown section types, and lifecycle hooks fired around render / page / section. Fully
 * theme-agnostic.
 */
import { useEffect, useLayoutEffect, type ReactElement } from 'react';
import { cn } from '../../../shared/utils/cn';
import { useTheme } from './context';
import { useEngine } from './engine-context';
import type { LifecycleManager } from './lifecycle';
import type {
  PageDefinition,
  SectionComponent,
  SectionInstance,
  StorefrontContext,
} from './rendering';
import { SectionErrorBoundary } from './SectionErrorBoundary';
import type { ThemeSettings } from './types';

const EMPTY_SETTINGS: ThemeSettings = Object.freeze({});

interface RenderedSectionProps {
  readonly Component: SectionComponent;
  readonly instance: SectionInstance;
  readonly index: number;
  readonly context: StorefrontContext;
  readonly lifecycle: LifecycleManager;
  readonly sectionId: string;
  readonly selected: boolean;
}

/**
 * Every section renders inside one plain block wrapper carrying `data-section-id` /
 * `data-section-type` (contract §1) so the live customizer can outline, select and scroll to it
 * without the section markup knowing. It is a real box (not `display: contents`) because outlines
 * need one; it carries no padding/margin so existing theme layouts are unchanged.
 */
function RenderedSection(props: RenderedSectionProps): ReactElement {
  const { Component, instance, index, context, lifecycle, sectionId, selected } = props;
  // Raw values are resolved by the section against its own schema; the engine passes them through.
  const settings = (instance.settings ?? EMPTY_SETTINGS) as ThemeSettings;

  useLayoutEffect(() => {
    lifecycle.beforeSection({ context, instance, index });
  }, [lifecycle, context, instance, index]);

  useEffect(() => {
    lifecycle.afterSection({ context, instance, index });
  }, [lifecycle, context, instance, index]);

  return (
    <div
      className={cn('sf-section-frame', selected && 'is-customizer-selected')}
      data-section-id={sectionId}
      data-section-type={instance.type}
    >
      <SectionErrorBoundary sectionType={instance.type}>
        <Component instance={instance} settings={settings} context={context} />
      </SectionErrorBoundary>
    </div>
  );
}

export interface ThemeRendererProps {
  readonly page: PageDefinition;
  readonly context: StorefrontContext;
  /** Live customizer: the section instance currently selected in the editor (adds `is-customizer-selected`). */
  readonly selectedSectionId?: string | null;
}

export function ThemeRenderer(props: ThemeRendererProps): ReactElement {
  const { page, context, selectedSectionId = null } = props;
  const { registries, lifecycle: themeLifecycle } = useTheme();
  const { plugins } = useEngine();
  const lifecycle = plugins.lifecycle;

  // Fold the active theme's own lifecycle hooks into the shared manager for this render tree.
  useEffect(() => {
    if (!themeLifecycle) return undefined;
    return lifecycle.add(themeLifecycle);
  }, [lifecycle, themeLifecycle]);

  useLayoutEffect(() => {
    lifecycle.beforeRender({ context, page });
    lifecycle.beforePage({ context, page });
  }, [lifecycle, context, page]);

  useEffect(() => {
    lifecycle.afterPage({ context, page });
    lifecycle.afterRender({ context, page });
  }, [lifecycle, context, page]);

  return (
    <>
      {page.sections.map((instance, index) => {
        const Component = registries.sections.resolve(instance.type);
        if (!Component) return null; // graceful degradation: unknown section type is dropped
        const key = instance.id ?? `${instance.type}:${index}`;
        return (
          <RenderedSection
            key={key}
            Component={Component}
            instance={instance}
            index={index}
            context={context}
            lifecycle={lifecycle}
            sectionId={key}
            selected={selectedSectionId !== null && selectedSectionId === key}
          />
        );
      })}
    </>
  );
}
