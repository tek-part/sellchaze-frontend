import { themeRegistry } from '../theme-engine/registry';
import type { ThemeModule } from '../theme-engine/types';

const MAX_BUNDLE_BYTES = 10 * 1024 * 1024;

function assertRemoteUrl(raw: string): string {
  const url = new URL(raw, window.location.href);
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('Remote theme bundles require HTTPS.');
  }
  return url.href;
}

async function fetchVerifiedModule(url: string, integrity: string, themeId: string): Promise<ThemeModule> {
  if (!/^sha384-[A-Za-z0-9+/=]+$/.test(integrity)) {
    throw new Error('Remote theme bundle has an invalid integrity value.');
  }

  const response = await fetch(url, {
    cache: 'force-cache',
    credentials: 'omit',
    mode: 'cors',
    integrity,
  });
  if (!response.ok) throw new Error(`Remote theme bundle failed (${response.status}).`);

  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > MAX_BUNDLE_BYTES) throw new Error('Remote theme bundle exceeds 10 MB.');
  const source = await response.text();
  if (new Blob([source]).size > MAX_BUNDLE_BYTES) throw new Error('Remote theme bundle exceeds 10 MB.');

  const objectUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try {
    const imported = await import(/* @vite-ignore */ objectUrl) as Record<string, unknown>;
    const candidate = imported.default ?? imported.theme ?? imported.themeModule;
    if (!candidate || typeof candidate !== 'object') throw new Error('Remote bundle did not export a ThemeModule.');
    const module = candidate as ThemeModule;
    if (module.manifest?.id !== themeId) throw new Error(`Remote theme manifest id must be "${themeId}".`);
    return module;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Register one server-selected remote theme. The engine still validates manifest.id on load. */
export function registerRemoteTheme(id: string, version: string, bundleUrl: string, integrity: string): string {
  const runtimeId = `remote:${id}@${version}:${integrity.slice(-12)}`;
  if (themeRegistry.has(runtimeId)) return runtimeId;
  const verifiedUrl = assertRemoteUrl(bundleUrl);
  themeRegistry.register(runtimeId, () => fetchVerifiedModule(verifiedUrl, integrity, id), id);
  return runtimeId;
}
