/**
 * Theme switcher — activates an installed, entitled theme as the live one. Activation is gated on
 * licence entitlement (install is for preview; going live needs a valid grant). Pure + clock-injected.
 */
import { getRecord, setActive, type InstallState } from './install-state';
import { isEntitled } from './licensing';

export interface ActivateResult {
  readonly ok: boolean;
  readonly state: InstallState;
  readonly error?: string;
}

/** Make `id` the active (live) theme. Fails if not installed or not entitled. */
export function activate(state: InstallState, id: string, at: string): ActivateResult {
  const record = getRecord(state, id);
  if (!record) return { ok: false, state, error: `“${id}” is not installed` };
  if (!isEntitled(record.license, at)) {
    return { ok: false, state, error: `“${id}” needs a licence before it can go live` };
  }
  return { ok: true, state: setActive(state, id) };
}

/** Clear the active theme (fall back to the configured default at render time). */
export function deactivate(state: InstallState): InstallState {
  return setActive(state, null);
}
