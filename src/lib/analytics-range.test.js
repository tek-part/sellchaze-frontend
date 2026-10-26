import { describe, expect, it } from 'vitest';
import { addDays, analyticsRange, inclusiveDays, todayIn } from './analytics-range';

describe('analytics date range presets', () => {
    it('computes today, yesterday, last 7 days and this month as inclusive dates across month and year changes', () => {
        expect(analyticsRange('today', {}, '2026-01-01')).toEqual({ from: '2026-01-01', to: '2026-01-01' });
        expect(analyticsRange('yesterday', {}, '2026-01-01')).toEqual({ from: '2025-12-31', to: '2025-12-31' });
        expect(analyticsRange('seven', {}, '2026-03-03')).toEqual({ from: '2026-02-25', to: '2026-03-03' });
        expect(inclusiveDays('2026-02-25', '2026-03-03')).toBe(7);
        expect(analyticsRange('month', {}, '2026-10-26')).toEqual({ from: '2026-10-01', to: '2026-10-26' });
        expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    });
    it('validates a specific day and a custom range of at most 366 days', () => {
        expect(analyticsRange('day', { day: '2026-10-12' }, '2026-10-26')).toEqual({ from: '2026-10-12', to: '2026-10-12' });
        expect(analyticsRange('day', { day: '' }, '2026-10-26')).toBeNull();
        expect(analyticsRange('custom', { from: '2026-10-01', to: '2026-10-12' }, '2026-10-26')).toEqual({ from: '2026-10-01', to: '2026-10-12' });
        expect(analyticsRange('custom', { from: '2026-10-12', to: '2026-10-01' }, '2026-10-26')).toBeNull();
        expect(analyticsRange('custom', { from: '2025-01-01', to: '2026-01-01' }, '2026-10-26')).toEqual({ from: '2025-01-01', to: '2026-01-01' });
        expect(analyticsRange('custom', { from: '2025-01-01', to: '2026-01-02' }, '2026-10-26')).toBeNull();
        expect(analyticsRange('unknown', {}, '2026-10-26')).toBeNull();
    });
    it('reads today in the store timezone rather than the browser clock', () => {
        const instant = new Date('2026-10-12T22:30:00Z');
        expect(todayIn('Africa/Cairo', instant)).toBe('2026-10-13');
        expect(todayIn('UTC', instant)).toBe('2026-10-12');
        expect(todayIn('America/Los_Angeles', instant)).toBe('2026-10-12');
    });
});
