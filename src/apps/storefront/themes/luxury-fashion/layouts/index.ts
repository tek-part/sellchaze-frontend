/**
 * Layout registry for Theme 01. The `default` layout is the global chrome shell used by every page.
 * Additional layouts (e.g. a bare checkout shell) register here without touching the engine.
 */
import type { LayoutMap } from '../../../theme-engine/rendering';
import { DefaultLayout } from './DefaultLayout';

export const luxuryLayouts: LayoutMap = {
  default: DefaultLayout,
};
