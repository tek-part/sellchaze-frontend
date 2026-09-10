/**
 * SectionFrame — the wrapper every library section renders inside (contract §7 `__style`). Applies
 * padding (with tablet/mobile overrides from `__responsive`), background, container width, text
 * alignment, device visibility, anchor id and an extra class from the section's raw settings.
 * `createSectionMap()` wraps each component with it, so themes get it for free; it renders INSIDE
 * the engine's `data-section-id` wrapper, which stays the customizer's selection box.
 */
import { useMemo, type ReactElement, type ReactNode } from 'react';
import type { SectionComponent, SectionInstance, SectionRenderProps } from '../theme-engine/rendering';
import { frameClassName, frameInlineStyle, frameResponsiveCss, readFrameResponsive, readFrameStyle } from './frame-style';

export interface SectionFrameProps {
  readonly instance: SectionInstance;
  /** Raw section settings (the engine passes them through; `__style` / `__responsive` are read here). */
  readonly settings: Readonly<Record<string, unknown>> | undefined;
  readonly children: ReactNode;
}

export function SectionFrame(props: SectionFrameProps): ReactElement {
  const { instance, settings, children } = props;
  const rawStyle = settings?.['__style'];
  const rawResponsive = settings?.['__responsive'];
  const id = instance.id ?? instance.type;
  const frame = useMemo(() => {
    const style = readFrameStyle(rawStyle);
    const css = frameResponsiveCss(id, readFrameResponsive(rawResponsive), style);
    return {
      className: frameClassName(style),
      // Paddings go inline unless the responsive sheet carries them (inline vars would beat media rules).
      style: frameInlineStyle(style, css === ''),
      anchor: style.anchor,
      css,
    };
  }, [rawStyle, rawResponsive, id]);

  return (
    <div className={frame.className} style={frame.style} data-lib-frame={id} id={frame.anchor || undefined}>
      {frame.css ? <style>{frame.css}</style> : null}
      {children}
    </div>
  );
}

const WRAPPED = new WeakMap<SectionComponent, SectionComponent>();
const TARGET = new WeakMap<SectionComponent, SectionComponent>();

/** `Component` wrapped in a `SectionFrame` (memoised per component so map identities stay stable). */
export function withSectionFrame(Component: SectionComponent): SectionComponent {
  const cached = WRAPPED.get(Component);
  if (cached) return cached;
  function Framed(props: SectionRenderProps): ReactElement {
    return (
      <SectionFrame instance={props.instance} settings={props.settings}>
        <Component {...props} />
      </SectionFrame>
    );
  }
  Framed.displayName = `Framed(${Component.displayName ?? Component.name ?? 'Section'})`;
  WRAPPED.set(Component, Framed);
  TARGET.set(Framed, Component);
  return Framed;
}

/** The component inside a framed section (the component itself when it is not framed). */
export function unwrapSection(Component: SectionComponent): SectionComponent {
  return TARGET.get(Component) ?? Component;
}
