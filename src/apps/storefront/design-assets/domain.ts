export interface DesignAsset { id: string; kind: 'css' | 'js'; url: string }
export interface DesignManifest { enabled: boolean; assets: DesignAsset[] }

/** Only this store's host-resolved immutable file routes may become executable tags. */
export function availableAssets(manifest: DesignManifest | null | undefined): DesignAsset[] {
  if (!manifest?.enabled || !Array.isArray(manifest.assets)) return [];
  const ids = new Set<string>();
  return manifest.assets.filter((asset) => {
    if (!asset || !['css', 'js'].includes(asset.kind) || !/^[a-f0-9-]{36}$/.test(asset.id)
      || asset.url !== `/api/v1/storefront/design-assets/${asset.id}.${asset.kind}` || ids.has(asset.id)) return false;
    ids.add(asset.id); return true;
  });
}
