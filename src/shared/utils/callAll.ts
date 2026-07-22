/**
 * callAll — compose several event handlers into one (used when cloning a trigger element to add
 * behaviour without clobbering the caller's own handler). Skips undefined handlers.
 */
export function callAll<E>(...handlers: ReadonlyArray<((event: E) => void) | undefined>): (event: E) => void {
  return (event: E) => {
    for (const handler of handlers) handler?.(event);
  };
}
