import { describe, expect, it } from 'vitest';
import { equalTraffic, trafficTotal } from '../pages/store/ab-traffic';

describe('A/B traffic allocation', () => {
    it('distributes exact basis points with deterministic remainder', () => {
        const targets = [1, 2, 3].map((product_id) => ({ product_id, weight: 5000 }));
        const result = equalTraffic(targets);
        expect(result.map((target) => target.weight)).toEqual([3334, 3333, 3333]);
        expect(trafficTotal(result)).toBe(10000);
        expect(targets[0].weight).toBe(5000);
    });
    it('supports a single target and all supported target counts without lost traffic', () => {
        expect(equalTraffic([])).toEqual([]);
        for (let count = 1; count <= 20; count++) {
            const result = equalTraffic(Array.from({ length: count }, (_, product_id) => ({ product_id })));
            expect(trafficTotal(result)).toBe(10000);
            expect(Math.max(...result.map((target) => target.weight)) - Math.min(...result.map((target) => target.weight))).toBeLessThanOrEqual(1);
        }
    });
});
