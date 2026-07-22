/** Theme Studio — small presentational pieces (badges, pills, empty state). */
import type { ReactElement, ReactNode } from 'react';
import { ENGINE_VERSION } from '../../theme-engine';
import { checkEntryCompatibility } from '../domain';
import type { CatalogEntry, ThemeLicense } from '../catalog/types';
import { cx } from './studio-utils';

export function LicenseBadge(props: { license: ThemeLicense }): ReactElement {
  const { license } = props;
  const label =
    license.type === 'free'
      ? 'Free'
      : license.type === 'trial'
        ? `${license.trialDays ?? 14}-day trial`
        : license.price !== undefined
          ? `${license.currency ?? '$'}${license.price}`
          : 'Premium';
  return <span className={cx('ts-badge', `ts-badge--lic-${license.type}`)}>{label}</span>;
}

export function CompatBadge(props: { entry: CatalogEntry }): ReactElement {
  const result = checkEntryCompatibility(props.entry, ENGINE_VERSION);
  return (
    <span
      className={cx('ts-badge', result.compatible ? 'ts-badge--ok' : 'ts-badge--bad')}
      title={result.compatible ? `Engine ${ENGINE_VERSION} compatible` : result.reason}
    >
      {result.compatible ? 'Compatible' : 'Incompatible'}
    </span>
  );
}

export function StatusPill(props: { tone: 'active' | 'installed' | 'update' | 'muted'; children: ReactNode }): ReactElement {
  return <span className={cx('ts-pill', `ts-pill--${props.tone}`)}>{props.children}</span>;
}

export function EmptyState(props: { title: string; text?: string; children?: ReactNode }): ReactElement {
  return (
    <div className="ts-empty">
      <div className="ts-empty__title">{props.title}</div>
      {props.text ? <p className="ts-empty__text">{props.text}</p> : null}
      {props.children}
    </div>
  );
}
