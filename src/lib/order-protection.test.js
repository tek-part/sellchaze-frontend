import { describe, expect, it } from 'vitest';
import { PROTECTION_RULES, protectionRuleLabel, protectionSignalText } from './order-protection';

describe('fake order protection labels', () => {
    it('labels every rule in both languages', () => {
        for (const rule of PROTECTION_RULES) {
            expect(protectionRuleLabel(rule, false)).not.toBe(rule);
            expect(protectionRuleLabel(rule, true)).not.toBe(rule);
        }
    });

    it('explains which rule fired with its recorded detail', () => {
        expect(protectionSignalText({ rule: 'repeat_phone', action: 'flag', detail: { orders: 2, hours: 24 } }, false)).toBe('Repeated orders from the same phone: 2 earlier order(s) within 24 hours');
        expect(protectionSignalText({ rule: 'blocked_words', action: 'flag', detail: { word: 'test' } }, true)).toContain('«test»');
        expect(protectionSignalText({ rule: 'high_quantity', action: 'flag', detail: { units: 12, max_units: 10 } }, false)).toBe('Unusually high quantity: 12 items (limit 10)');
        expect(protectionSignalText({ rule: 'unknown' }, false)).toBe('unknown');
    });
});
