const colors = ['#7fe6a1', '#6ae292', '#55dd82'];

/** The three purchase stages use the observed curved flow; labels retain exact counts for assistive readers. */
export default function StoreConversionFlow({ counts, ar }) {
    const text = (a, e) => ar ? a : e;
    const stages = [['visits', text('زيارات', 'Visits'), counts.visits ? 100 : 0],
        ['started', text('مرات بدء الشراء', 'Checkout starts'), Number(counts.start_rate)],
        ['purchased', text('إكمال الشراء', 'Order completion'), Number(counts.purchase_rate)]];
    const tops = stages.map((row) => 180 * (1 - Math.max(0, Math.min(100, row[2])) / 100));
    return <div className="ws-metrics-flow"><svg viewBox="0 0 900 180" preserveAspectRatio="none" aria-hidden="true" style={{ transform: ar ? 'scaleX(-1)' : undefined }}>{stages.map(([key], index) => {
        const left = index * 300; const right = left + 300; const middle = left + 150;
        const start = tops[index]; const end = tops[index + 1] ?? start;
        return <g key={key}><path fill={colors[index]} d={`M ${left},${start} C ${middle},${start} ${middle},${end} ${right},${end} L ${right},180 L ${left},180 Z`} />{index < 2 ? <line x1={right} x2={right} y1="0" y2="180" stroke="var(--ws-border)" strokeDasharray="2 2" /> : null}</g>;
    })}</svg><ol>{stages.map(([key, label, percent], index) => <li key={key} aria-label={`${label}: ${counts[key]} (${percent.toFixed(2)}%)`} title={`${label}: ${counts[key]} (${percent.toFixed(2)}%)`}><strong>{index === 0 ? counts.visits : `${percent.toFixed(2)}%`}</strong><span>{label}</span></li>)}</ol></div>;
}
