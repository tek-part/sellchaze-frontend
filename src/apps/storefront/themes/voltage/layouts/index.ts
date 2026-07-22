/** Voltage layout registry — the `default` global chrome shell + the `account` sidebar console. */
import type { LayoutMap } from '../../../theme-engine/rendering';
import { DefaultLayout } from './DefaultLayout';
import { AccountLayout } from './AccountLayout';
export const voltageLayouts: LayoutMap = { default: DefaultLayout, account: AccountLayout };
