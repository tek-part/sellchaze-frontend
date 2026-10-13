import { describe, expect, it } from 'vitest';
import { resolveApiBase } from '../api/base-url';
describe('merchant API origin', () => {
    it('targets the live API on both published merchant hosts without a build-time override', () => {
        for (const hostname of ['sellchaze.com', 'www.sellchaze.com', 'SELLCHAZE.COM']) {
            expect(resolveApiBase({ hostname, protocol: 'https:', development: false })).toBe('https://api.sellchaze.com/api/v1');
        }
    });
    it('keeps local development, preview and independently hosted deployments on their same-origin proxy', () => {
        for (const hostname of ['localhost', '127.0.0.1', 'dashboard.example.test']) {
            expect(resolveApiBase({ hostname, protocol: 'http:', development: false })).toBe('/api/v1');
        }
        expect(resolveApiBase({ hostname: 'sellchaze.com', development: true })).toBe('/api/v1');
    });
    it('honors configured deployments and prevents mixed content on HTTPS', () => {
        expect(resolveApiBase({ configured: ' http://api.example.test/api/v1/ ', protocol: 'https:', hostname: 'sellchaze.com' })).toBe('https://api.example.test/api/v1');
        expect(resolveApiBase({ configured: 'http://127.0.0.1:8009/api/v1', protocol: 'http:' })).toBe('http://127.0.0.1:8009/api/v1');
    });
});
