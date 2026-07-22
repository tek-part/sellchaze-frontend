/**
 * `<Widget name>` — resolves a reusable widget from the active theme's widget registry by key
 * and renders it. Sections/layouts compose shared widgets this way instead of importing a
 * concrete component, keeping the pipeline fully registry-driven. Unknown widget → nothing
 * (graceful, fail-closed).
 */
import type { ReactElement } from 'react';
import { useWidgetRegistry } from './context';
import type { StorefrontContext } from './rendering';

export interface WidgetProps {
  readonly name: string;
  readonly context?: StorefrontContext | null;
  readonly params?: Readonly<Record<string, unknown>>;
}

export function Widget(props: WidgetProps): ReactElement | null {
  const { name, context = null, params } = props;
  const Component = useWidgetRegistry().resolve(name);
  if (!Component) return null;
  return <Component context={context} {...(params ? { params } : {})} />;
}
