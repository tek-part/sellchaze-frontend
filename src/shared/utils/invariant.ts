/**
 * Shared, app-agnostic invariant helper. Reusable by any app module (admin, merchant,
 * supplier, storefront). Throws in a predictable way so callers fail loudly on programmer
 * error rather than rendering an invalid state.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[invariant] ${message}`);
  }
}
