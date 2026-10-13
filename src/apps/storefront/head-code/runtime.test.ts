import { afterEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { mayMountHeadCode, mountHeadCode } from './runtime';

const fingerprint = 'a'.repeat(64);
let dom: JSDOM | undefined;
function browser(search = '') {
  dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: `https://live.example.test/${search}`, runScripts: 'dangerously' });
  // Only known, locally authored test scripts run here; no external resources are enabled.
  vi.stubGlobal('window', dom.window); vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('HTMLScriptElement', dom.window.HTMLScriptElement); vi.stubGlobal('Element', dom.window.Element);
  return dom.window;
}
afterEach(() => { dom?.window.close(); dom = undefined; vi.unstubAllGlobals(); });
describe('live merchant head code', () => {
  it('executes JavaScript, publishes verification metadata and CSS once', async () => {
    const window = browser();
    const code = { host: 'live.example.test', fingerprint, html: '<meta name="review" content="verified"><style>html{--review-head:published}</style><script>document.documentElement.dataset.headRuns=String(Number(document.documentElement.dataset.headRuns||0)+1)</script>' };
    await mountHeadCode(code); await mountHeadCode(code);
    expect(window.document.documentElement.dataset.headRuns).toBe('1');
    expect(window.document.head.querySelector('meta[name="review"]')?.getAttribute('content')).toBe('verified');
    expect(window.document.head.querySelectorAll('style')).toHaveLength(1);
    expect(window.document.head.querySelector('style')?.textContent).toContain('--review-head:published');
  });
  it('does not run again when server-rendered code already exists', async () => {
    const window = browser();
    window.document.head.innerHTML = `<meta name="sellchaze-head-code" content="${fingerprint}">`;
    await mountHeadCode({ host: 'live.example.test', fingerprint, html: '<script>document.documentElement.dataset.executed="yes"</script>' });
    expect(window.document.documentElement.dataset.executed).toBeUndefined();
  });
  it.each(['?preview=1', '?preview=0', '?customize=1', '?__preview=token'])('renders published code on the isolated tenant preview %s', async (search) => {
    const window = browser(search);
    await mountHeadCode({ host: 'live.example.test', fingerprint, html: '<script>document.documentElement.dataset.executed="yes"</script>' });
    expect(window.document.documentElement.dataset.executed).toBe('yes');
  });
  it('rejects a payload meant for another host and malformed fingerprint', () => {
    expect(mayMountHeadCode({ host: 'other.test', html: '', fingerprint }, { hostname: 'live.example.test', search: '' })).toBe(false);
    expect(mayMountHeadCode({ host: 'live.example.test', html: '', fingerprint: '"bad' }, { hostname: 'live.example.test', search: '' })).toBe(false);
    expect(mayMountHeadCode({ host: 'live.example.test', html: '', fingerprint }, { hostname: 'dashboard.example.test', search: '?preview=1' })).toBe(false);
    expect(mayMountHeadCode({ host: 'live.example.test', html: '', fingerprint }, { hostname: 'dashboard.example.test', search: '?preview=1' }, true)).toBe(false);
  });
  it('waits for ordered external scripts before their inline dependents without fetching in this test', async () => {
    const window = browser();
    const done = mountHeadCode({ host: 'live.example.test', fingerprint, html: '<script src="https://tracking.example.test/loader.js"></script><script>document.documentElement.dataset.afterExternal="yes"</script>' });
    await Promise.resolve();
    expect(window.document.documentElement.dataset.afterExternal).toBeUndefined();
    const external = window.document.head.querySelector('script[src]')!;
    external.dispatchEvent(new window.Event('load'));
    await done;
    expect(window.document.documentElement.dataset.afterExternal).toBe('yes');
  });
});
