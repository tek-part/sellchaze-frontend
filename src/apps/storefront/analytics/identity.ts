export function metricsAllowed(options: { preview: boolean; doNotTrack?: string | null; globalPrivacyControl?: boolean }): boolean {
  return !options.preview && options.doNotTrack !== '1' && options.globalPrivacyControl !== true;
}
export function metricsAllowedInBrowser(): boolean {
  return typeof window !== 'undefined' && metricsAllowed({ preview: new URLSearchParams(window.location.search).get('preview') === '1',
    doNotTrack: navigator.doNotTrack, globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl });
}
export function metricsEventId(): string | undefined {
  if (!metricsAllowedInBrowser()) return undefined;
  try { return crypto.randomUUID(); } catch { return undefined; }
}
