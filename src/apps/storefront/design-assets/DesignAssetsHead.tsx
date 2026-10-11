import { useEffect } from 'react';
import { apiGet } from '../api/client';
import { useStore } from '../state/store-context';
import { availableAssets, type DesignManifest } from './domain';

const executed = new Set<string>();

/** Merchant code is loaded only by the dedicated storefront entry, never the dashboard. */
export function DesignAssetsHead(): null {
  const { store, apiOk } = useStore();
  useEffect(() => {
    if (!apiOk) return undefined;
    let active = true;
    const owned: HTMLElement[] = [];
    apiGet<{ data: DesignManifest }>('/design-assets').then(({ data }) => {
      if (!active) return;
      const assets = availableAssets(data);
      // Preserve existing Blade/SSR tags and avoid evaluating JavaScript twice on route changes.
      for (const asset of assets) {
        const key = `${store.id}:${asset.id}`;
        const existing = document.querySelector(`[data-store-design-asset="${asset.id}"]`);
        if (existing) { if (asset.kind === 'js') executed.add(key); continue; }
        if (asset.kind === 'js' && executed.has(key)) continue;
        const node = asset.kind === 'css' ? document.createElement('link') : document.createElement('script');
        node.setAttribute('data-store-design-asset', asset.id);
        if (node instanceof HTMLLinkElement) { node.rel = 'stylesheet'; node.href = asset.url; }
        else { node.src = asset.url; node.async = false; executed.add(key); }
        document.head.appendChild(node); owned.push(node);
      }
    }).catch(() => { /* Optional styles/code must not prevent the storefront from loading. */ });
    return () => { active = false; for (const node of owned) node.remove(); };
  }, [store.id, apiOk]);
  return null;
}
