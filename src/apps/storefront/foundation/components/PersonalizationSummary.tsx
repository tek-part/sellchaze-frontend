import type { ReactElement } from 'react';
import type { PersonalizationEntry } from '../../types/personalization';
import './personalization.css';

export function PersonalizationSummary({ entries = [] }: { entries?: ReadonlyArray<PersonalizationEntry> }): ReactElement | null {
  if (!entries.length) return null;
  return <dl className="sf-personalization-summary">{entries.map((entry) => <div key={entry.key}>
    <dt>{entry.label}</dt><dd>{entry.type === 'image' ? entry.url && /^(\/[^/]|https?:\/\/)/i.test(entry.url) ? <a href={entry.url} target="_blank" rel="noreferrer">{entry.filename}</a> : entry.filename : entry.value}</dd>
  </div>)}</dl>;
}
