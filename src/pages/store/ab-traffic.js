export function equalTraffic(targets) {
    if (!targets.length) return [];
    const base = Math.floor(10000 / targets.length);
    return targets.map((target, index) => ({ ...target, weight: base + (index < 10000 % targets.length ? 1 : 0) }));
}
export const trafficTotal = (targets) => targets.reduce((sum, target) => sum + target.weight, 0);
