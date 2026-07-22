/**
 * Live token preview — theme-agnostic. Resolves the theme module's tokens for the given settings +
 * scheme and projects them onto a scoped container via the engine's `applyTokensToElement`, then
 * renders a sample gallery styled ONLY with `var(--token)` (no theme-specific classes). This updates
 * live as the merchant edits settings in the editor — a real preview for any theme, no theme CSS
 * required. The full-fidelity storefront preview is the sibling iframe.
 */
import { useEffect, useMemo, useRef, type CSSProperties, type ReactElement } from 'react';
import {
  applyTokensToElement,
  resolveSettings,
  type ColorScheme,
  type ThemeModule,
  type ThemeSettingValue,
} from '../../theme-engine';

export interface TokenPreviewProps {
  module: ThemeModule;
  settings: Partial<Record<string, ThemeSettingValue>>;
  scheme: ColorScheme;
}

const SWATCHES: ReadonlyArray<{ token: string; label: string }> = [
  { token: '--primary', label: 'Primary' },
  { token: '--accent', label: 'Accent' },
  { token: '--bg', label: 'Background' },
  { token: '--surface', label: 'Surface' },
  { token: '--text', label: 'Text' },
  { token: '--sale', label: 'Sale' },
  { token: '--success', label: 'Success' },
  { token: '--border', label: 'Border' },
];

export function TokenPreview(props: TokenPreviewProps): ReactElement {
  const { module, settings, scheme } = props;
  const ref = useRef<HTMLDivElement>(null);

  const tokens = useMemo(() => {
    const resolved = resolveSettings(module.manifest.settingsSchema, settings);
    return module.createTokens(resolved);
  }, [module, settings]);

  useEffect(() => {
    if (ref.current) applyTokensToElement(ref.current, tokens, scheme);
  }, [tokens, scheme]);

  const surface: CSSProperties = {
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'var(--font)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  };

  return (
    <div ref={ref} className="ts-tokenprev" style={surface} data-theme={scheme}>
      <div className="ts-tokenprev__swatches">
        {SWATCHES.map((s) => (
          <div key={s.token} className="ts-tokenprev__swatch" title={s.token}>
            <span className="ts-tokenprev__chip" style={{ background: `var(${s.token})`, borderColor: 'var(--border)' }} />
            <span className="ts-tokenprev__swatch-label" style={{ color: 'var(--muted)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="ts-tokenprev__type">
        <div style={{ fontFamily: 'var(--heading)', fontSize: 'var(--fs-2xl)', lineHeight: 'var(--lh-tight)' }}>
          The quick brown fox
        </div>
        <p style={{ color: 'var(--muted)', margin: '8px 0 0', maxWidth: '48ch' }}>
          Body copy renders in the theme’s humanist stack, sized by the fluid type scale and coloured by
          the resolved tokens.
        </p>
      </div>

      <div className="ts-tokenprev__row">
        <button
          type="button"
          style={{
            background: 'var(--primary)',
            color: 'var(--on-primary)',
            border: 0,
            borderRadius: 'var(--radius-pill)',
            padding: '12px 22px',
            font: 'inherit',
            fontWeight: 600,
            boxShadow: 'var(--shadow)',
            cursor: 'default',
          }}
        >
          Primary action
        </button>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--surface-2)',
            color: 'var(--accent)',
            border: '1px solid var(--border)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
          }}
        >
          Accent chip
        </span>
      </div>

      <div
        className="ts-tokenprev__card"
        style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', padding: '16px' }}
      >
        <div style={{ fontFamily: 'var(--heading)', fontSize: 'var(--fs-lg)' }}>Sample card</div>
        <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', marginTop: '4px' }}>Elevated on the theme’s shadow + radius.</div>
      </div>
    </div>
  );
}
