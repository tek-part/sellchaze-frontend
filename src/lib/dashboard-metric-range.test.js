import { describe, expect, it } from 'vitest';
import { calendarMonthMove, localDateKey, metricPreset, rangeDays } from '../components/dashboard/metric-range';

describe('metric date ranges', () => {
    it('uses inclusive calendar boundaries through month/year changes', () => {
        expect(metricPreset('seven', new Date(2026, 0, 2))).toEqual({ from: '2025-12-26', to: '2026-01-02' });
        expect(metricPreset('week', new Date(2026, 9, 12))).toEqual({ from: '2026-10-10', to: '2026-10-12' });
        expect(metricPreset('week', new Date(2026, 9, 12), false)).toEqual({ from: '2026-10-11', to: '2026-10-12' });
    });
    it('keeps previous leap-year and single-day selection valid without timestamp shifts', () => {
        const leap = metricPreset('previousYear', new Date(2025, 2, 30));
        expect(leap).toEqual({ from: '2024-01-01', to: '2024-12-31' });
        expect(rangeDays(leap.from, leap.to)).toBe(365);
        expect(rangeDays('2026-10-12', '2026-10-12')).toBe(0);
        expect(localDateKey(new Date(2026, 9, 12, 0, 1))).toBe('2026-10-12');
    });
    it('keyboard month navigation clamps the day at February rather than skipping it', () => {
        expect(localDateKey(calendarMonthMove(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
        expect(localDateKey(calendarMonthMove(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
        expect(localDateKey(calendarMonthMove(new Date(2026, 2, 31), -1))).toBe('2026-02-28');
    });
});

