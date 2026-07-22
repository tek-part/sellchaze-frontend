/**
 * `<Capability name>` — renders its children only when the active theme declares `name`. Lets
 * shared/feature UI gate on declared capabilities instead of theme-name conditionals.
 */
import type { ReactElement, ReactNode } from 'react';
import type { ThemeCapability } from './capabilities';
import { useCapability } from './context';

export interface CapabilityProps {
  readonly name: ThemeCapability;
  readonly fallback?: ReactNode;
  readonly children: ReactNode;
}

export function Capability(props: CapabilityProps): ReactElement {
  const enabled = useCapability(props.name);
  return <>{enabled ? props.children : props.fallback ?? null}</>;
}
