/**
 * `<Slot>` — a named extension point a theme places in its layout/sections; plugins fill it.
 * Renders every plugin contribution registered for `name`, in `order`. Empty when no plugin
 * fills the slot — themes must render fine with zero slot content.
 */
import type { ReactElement } from 'react';
import { useEngine } from './engine-context';
import type { StorefrontContext } from './rendering';

export interface SlotProps {
  readonly name: string;
  /** Current render context passed to slot contributors (optional). */
  readonly context?: StorefrontContext | null;
}

export function Slot(props: SlotProps): ReactElement | null {
  const { name, context = null } = props;
  const { plugins } = useEngine();
  const entries = plugins.slots.get(name);
  if (entries.length === 0) return null;
  return (
    <>
      {entries.map((entry, index) => {
        const Render = entry.render;
        return <Render key={`${entry.pluginId}:${index}`} context={context} />;
      })}
    </>
  );
}
