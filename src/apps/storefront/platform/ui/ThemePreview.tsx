/**
 * Full-fidelity theme preview — an isolated iframe rendering the REAL storefront at
 * the storefront root with `?theme=…&scheme=…&settings=…`. Complete isolation (its own CSS bundle),
 * so no theme CSS bleeds into the studio. Reflects unsaved editor settings via the `settings` param.
 */
import { useMemo, type ReactElement } from 'react';
import type { ColorSchemePreference, ThemeSettingValue } from '../../theme-engine';
import { previewUrl } from './studio-utils';

export interface ThemePreviewProps {
  themeId: string;
  scheme?: ColorSchemePreference;
  settings?: Readonly<Record<string, ThemeSettingValue>>;
  height?: number;
}

export function ThemePreview(props: ThemePreviewProps): ReactElement {
  const { themeId, scheme, settings, height = 620 } = props;
  const url = useMemo(() => previewUrl(themeId, scheme, settings), [themeId, scheme, settings]);
  return (
    <div className="ts-preview">
      <div className="ts-preview__bar">
        <span className="ts-preview__dot" /><span className="ts-preview__dot" /><span className="ts-preview__dot" />
        <code className="ts-preview__url">{url}</code>
        <a className="ts-preview__open" href={url} target="_blank" rel="noreferrer">Open ↗</a>
      </div>
      <iframe
        key={url}
        className="ts-preview__frame"
        title={`Preview of ${themeId}`}
        src={url}
        style={{ height: `${height}px` }}
        loading="lazy"
      />
    </div>
  );
}
